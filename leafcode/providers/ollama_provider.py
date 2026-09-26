"""
LeafCode Ollama Local AI Provider (100% Free & Offline)
=======================================================
Communicates with a locally running Ollama instance (http://localhost:11434).
"""

import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Generator, Tuple, Optional
from leafcode.providers.base import BaseProvider

class OllamaProvider(BaseProvider):
    def __init__(self, base_url: Optional[str] = "http://localhost:11434"):
        super().__init__(api_key=None, base_url=base_url or "http://localhost:11434")

    @property
    def name(self) -> str:
        return "ollama"

    def is_available(self) -> Tuple[bool, str]:
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status == 200:
                    return True, "Ollama daemon connected"
        except Exception:
            pass
        return False, f"Ollama not running at {self.base_url}"

    def generate(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        # Strip ollama/ prefix if present
        clean_model = model.replace("ollama/", "")
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": clean_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                msg = data.get("message", {})
                return {
                    "content": msg.get("content", ""),
                    "tool_calls": msg.get("tool_calls", []),
                    "usage": {
                        "prompt_tokens": data.get("prompt_eval_count", 0),
                        "completion_tokens": data.get("eval_count", 0)
                    }
                }
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Ollama error ({e.code}): {err}")
        except Exception as e:
            raise RuntimeError(f"Failed to connect to Ollama at {self.base_url}: {str(e)}")

    def stream(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Generator[str, None, None]:
        clean_model = model.replace("ollama/", "")
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": clean_model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=120) as resp:
            for line in resp:
                if line:
                    data = json.loads(line.decode("utf-8"))
                    msg = data.get("message", {})
                    content = msg.get("content", "")
                    if content:
                        yield content
