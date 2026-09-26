"""
LeafCode Mistral AI Provider (Codestral, Mistral Large)
======================================================
Connects to Mistral AI endpoints.
"""

import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Generator, Tuple, Optional
from leafcode.providers.base import BaseProvider

class MistralProvider(BaseProvider):
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key=api_key, base_url="https://api.mistral.ai/v1")

    @property
    def name(self) -> str:
        return "mistral"

    def is_available(self) -> Tuple[bool, str]:
        if not self.api_key:
            return False, "Mistral API key not set (export MISTRAL_API_KEY or use /config)"
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
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if tools:
            payload["tools"] = tools

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
            raise RuntimeError(f"Mistral error ({e.code}): {err}")
        except Exception as e:
            raise RuntimeError(f"Failed to connect to Mistral: {str(e)}")

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
