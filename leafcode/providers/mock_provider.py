"""
LeafCode Built-in Offline Simulation Provider
==============================================
Enables immediate out-of-the-box local testing, offline terminal workflows,
and tool verification without requiring any API keys or network access.
"""

import json
from typing import List, Dict, Any, Generator, Tuple, Optional
from leafcode.providers.base import BaseProvider

class MockProvider(BaseProvider):
    def __init__(self):
        super().__init__(api_key=None, base_url=None)

    @property
    def name(self) -> str:
        return "mock"

    def is_available(self) -> Tuple[bool, str]:
        return True, "Ready (Offline Brain)"

    def generate(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        last_msg = messages[-1]["content"] if messages else ""
        if isinstance(last_msg, list):
            last_msg = str(last_msg)

        # Check if previous message was a tool result
        if messages and messages[-1].get("role") == "tool":
            tool_res = messages[-1].get("content", "")
            return {
                "content": f"🍃 **Offline Analysis Result:**\n\nI processed the tool output:\n```\n{tool_res[:300]}...\n```\nEverything looks healthy and green!",
                "tool_calls": [],
                "usage": {"prompt_tokens": 100, "completion_tokens": 50}
            }

        # Autonomous heuristic tool calling for mock engine
        lower = last_msg.lower()
        if "list" in lower and ("file" in lower or "dir" in lower or "folder" in lower):
            return {
                "content": "🌿 Let me explore the workspace tree for you.",
                "tool_calls": [{
                    "id": "mock_call_ls",
                    "type": "function",
                    "function": {
                        "name": "list_dir",
                        "arguments": json.dumps({"path": "."})
                    }
                }],
                "usage": {"prompt_tokens": 50, "completion_tokens": 25}
            }
        elif "git" in lower and "status" in lower:
            return {
                "content": "🌿 Checking repository git status...",
                "tool_calls": [{
                    "id": "mock_call_git",
                    "type": "function",
                    "function": {
                        "name": "run_command",
                        "arguments": json.dumps({"command": "git status --short"})
                    }
                }],
                "usage": {"prompt_tokens": 50, "completion_tokens": 25}
            }
            
        return {
            "content": f"🍃 **LeafCode Offline Simulator Active**\n\nI received your prompt: *\"{last_msg}\"*\n\nTo connect to real AI models (including Free Tier Llama 3.3 70B on Groq, Gemini 2.0 Flash, or Ollama local), configure your keys with `/config` or set `GROQ_API_KEY` / `GEMINI_API_KEY` in your environment.",
            "tool_calls": [],
            "usage": {"prompt_tokens": 80, "completion_tokens": 60}
        }

    def stream(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Generator[str, None, None]:
        res = self.generate(messages, model, temperature, max_tokens, tools)
        content = res.get("content", "")
        for word in content.split(" "):
            yield word + " "
