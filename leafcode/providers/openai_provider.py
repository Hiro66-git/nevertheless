"""
LeafCode OpenAI Provider (GPT-4o, o3-mini)
=========================================
Direct integration with OpenAI API chat completions.
"""

import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Generator, Tuple, Optional
from leafcode.providers.base import BaseProvider

class OpenAIProvider(BaseProvider):
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key=api_key, base_url="https://api.openai.com/v1")

    @property
    def name(self) -> str:
        return "openai"

    def is_available(self) -> Tuple[bool, str]:
        if not self.api_key:
            return False, "OpenAI API key not set (export OPENAI_API_KEY or use /config)"
        return True, "Ready"

    def generate(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/chat/completions"
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
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
                choice = data["choices"][0]
                message = choice["message"]
                return {
                    "content": message.get("content", "") or "",
                    "tool_calls": message.get("tool_calls", []),
                    "usage": data.get("usage", {})
                }
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"OpenAI error ({e.code}): {err}")
        except Exception as e:
            raise RuntimeError(f"Failed to connect to OpenAI: {str(e)}")

    def stream(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Generator[str, None, None]:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=60) as resp:
            for line in resp:
                line_str = line.decode("utf-8").strip()
                if not line_str or line_str.startswith("data: [DONE]"):
                    continue
                if line_str.startswith("data: "):
                    json_str = line_str[6:]
                    try:
                        chunk = json.loads(json_str)
                        delta = chunk["choices"][0]["delta"]
                        if "content" in delta and delta["content"]:
                            yield delta["content"]
                    except json.JSONDecodeError:
                        continue
