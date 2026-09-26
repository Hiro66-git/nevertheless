"""
LeafCode Anthropic Claude Provider (Claude 3.7 Sonnet, Claude 3.5 Sonnet)
========================================================================
Integrates Anthropic Messages API with native tool use and streaming.
"""

import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Generator, Tuple, Optional
from leafcode.providers.base import BaseProvider

class AnthropicProvider(BaseProvider):
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key=api_key, base_url="https://api.anthropic.com/v1")

    @property
    def name(self) -> str:
        return "anthropic"

    def is_available(self) -> Tuple[bool, str]:
        if not self.api_key:
            return False, "Anthropic API key not set (export ANTHROPIC_API_KEY or use /config)"
        return True, "Ready"

    def _convert_messages(self, messages: List[Dict[str, Any]]) -> Tuple[Optional[str], List[Dict[str, Any]]]:
        system_prompt = None
        converted = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                system_prompt = content
            elif role == "tool":
                converted.append({
                    "role": "user",
                    "content": [{
                        "type": "tool_result",
                        "tool_use_id": m.get("tool_call_id", "call_default"),
                        "content": str(content)
                    }]
                })
            elif role == "assistant" and "tool_calls" in m and m["tool_calls"]:
                content_blocks = []
                if content:
                    content_blocks.append({"type": "text", "text": str(content)})
                for tc in m["tool_calls"]:
                    fn = tc.get("function", {})
                    args = fn.get("arguments", "{}")
                    if isinstance(args, str):
                        try:
                            args = json.loads(args)
                        except Exception:
                            args = {}
                    content_blocks.append({
                        "type": "tool_use",
                        "id": tc.get("id", "call_0"),
                        "name": fn.get("name", ""),
                        "input": args
                    })
                converted.append({"role": "assistant", "content": content_blocks})
            else:
                converted.append({"role": role, "content": str(content)})
        return system_prompt, converted

    def generate(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/messages"
        system_prompt, converted_messages = self._convert_messages(messages)
        
        payload: Dict[str, Any] = {
            "model": model,
            "messages": converted_messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        if system_prompt:
            payload["system"] = system_prompt
            
        if tools:
            # Convert OpenAI schema to Anthropic tool schema
            anthropic_tools = []
            for t in tools:
                if t.get("type") == "function":
                    fn = t["function"]
                    anthropic_tools.append({
                        "name": fn.get("name"),
                        "description": fn.get("description", ""),
                        "input_schema": fn.get("parameters", {"type": "object", "properties": {}})
                    })
            if anthropic_tools:
                payload["tools"] = anthropic_tools

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text_content = ""
                tool_calls = []
                
                for block in data.get("content", []):
                    if block.get("type") == "text":
                        text_content += block.get("text", "")
                    elif block.get("type") == "tool_use":
                        tool_calls.append({
                            "id": block.get("id"),
                            "type": "function",
                            "function": {
                                "name": block.get("name"),
                                "arguments": json.dumps(block.get("input", {}))
                            }
                        })
                return {
                    "content": text_content,
                    "tool_calls": tool_calls,
                    "usage": data.get("usage", {})
                }
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Anthropic error ({e.code}): {err}")
        except Exception as e:
            raise RuntimeError(f"Failed to connect to Anthropic: {str(e)}")

    def stream(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Generator[str, None, None]:
        res = self.generate(messages, model, temperature, max_tokens, tools)
        if res.get("content"):
            yield res["content"]
