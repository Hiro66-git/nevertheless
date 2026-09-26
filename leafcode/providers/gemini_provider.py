"""
LeafCode Google Gemini Provider (Free Tier Supported)
=====================================================
Integrates Google Generative AI (Gemini 2.0 Flash, Gemini 1.5 Pro).
"""

import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Generator, Tuple, Optional
from leafcode.providers.base import BaseProvider

class GeminiProvider(BaseProvider):
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key=api_key, base_url="https://generativelanguage.googleapis.com/v1beta/models")

    @property
    def name(self) -> str:
        return "gemini"

    def is_available(self) -> Tuple[bool, str]:
        if not self.api_key:
            return False, "Gemini API key not set (export GEMINI_API_KEY or use /config)"
        return True, "Ready"

    def _convert_messages_to_gemini(self, messages: List[Dict[str, Any]]) -> Tuple[Optional[str], List[Dict[str, Any]]]:
        system_instruction = None
        contents = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                system_instruction = content
            elif role == "user":
                contents.append({
                    "role": "user",
                    "parts": [{"text": str(content)}]
                })
            elif role == "assistant":
                parts = []
                if content:
                    parts.append({"text": str(content)})
                if "tool_calls" in m and m["tool_calls"]:
                    for tc in m["tool_calls"]:
                        fn = tc.get("function", {})
                        args = fn.get("arguments", "{}")
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except Exception:
                                args = {}
                        parts.append({
                            "functionCall": {
                                "name": fn.get("name", ""),
                                "args": args
                            }
                        })
                contents.append({"role": "model", "parts": parts})
            elif role == "tool":
                contents.append({
                    "role": "user",
                    "parts": [{
                        "functionResponse": {
                            "name": m.get("name", "tool_result"),
                            "response": {"output": str(content)}
                        }
                    }]
                })
        return system_instruction, contents

    def generate(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/{model}:generateContent?key={self.api_key}"
        system_instruction, contents = self._convert_messages_to_gemini(messages)
        
        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        headers = {"Content-Type": "application/json"}
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if not candidates:
                    return {"content": "", "tool_calls": [], "usage": {}}
                
                parts = candidates[0].get("content", {}).get("parts", [])
                text_content = ""
                tool_calls = []
                
                for idx, p in enumerate(parts):
                    if "text" in p:
                        text_content += p["text"]
                    elif "functionCall" in p:
                        fc = p["functionCall"]
                        tool_calls.append({
                            "id": f"call_{idx}",
                            "type": "function",
                            "function": {
                                "name": fc.get("name"),
                                "arguments": json.dumps(fc.get("args", {}))
                            }
                        })
                return {
                    "content": text_content,
                    "tool_calls": tool_calls,
                    "usage": data.get("usageMetadata", {})
                }
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Gemini API error ({e.code}): {err}")
        except Exception as e:
            raise RuntimeError(f"Failed to connect to Gemini: {str(e)}")

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
