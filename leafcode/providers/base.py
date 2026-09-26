"""
LeafCode Base AI Provider Interface
===================================
Defines the standard contract for all model providers (streaming, completion, tool calling).
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Generator, Optional, Tuple

class BaseProvider(ABC):
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key
        self.base_url = base_url

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider identifier name (e.g. 'groq', 'openai', 'ollama')."""
        pass

    @abstractmethod
    def is_available(self) -> Tuple[bool, str]:
        """Checks if provider is configured and reachable."""
        pass

    @abstractmethod
    def generate(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Synchronously generates a completion with potential tool calls."""
        pass

    @abstractmethod
    def stream(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Generator[str, None, None]:
        """Streams response tokens incrementally."""
        pass
