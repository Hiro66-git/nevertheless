"""
LeafCode Dynamic AI Provider Router & Failover Engine
=====================================================
Directs prompt streams to the chosen API provider, verifies credentials,
and seamlessly handles fallback failovers.
"""

from typing import Dict, Any, Optional, Tuple, List
from leafcode.config import config
from leafcode.providers.base import BaseProvider
from leafcode.providers.groq_provider import GroqProvider
from leafcode.providers.gemini_provider import GeminiProvider
from leafcode.providers.ollama_provider import OllamaProvider
from leafcode.providers.openrouter_provider import OpenRouterProvider
from leafcode.providers.openai_provider import OpenAIProvider
from leafcode.providers.anthropic_provider import AnthropicProvider
from leafcode.providers.mistral_provider import MistralProvider
from leafcode.providers.mock_provider import MockProvider
from leafcode.providers.models import MODELS_CATALOG

class ProviderRouter:
    def __init__(self):
        self._instances: Dict[str, BaseProvider] = {}

    def get_provider(self, provider_name: Optional[str] = None) -> BaseProvider:
        """Retrieves or creates a configured provider instance."""
        target_name = (provider_name or config.active_provider).lower()
        
        # Check active API key or base url
        api_key = config.get_api_key(target_name)
        
        if target_name == "groq":
            return GroqProvider(api_key=api_key)
        elif target_name in ("gemini", "google"):
            return GeminiProvider(api_key=api_key)
        elif target_name == "ollama":
            return OllamaProvider(base_url=config.config.get("ollama_base_url"))
        elif target_name == "openrouter":
            return OpenRouterProvider(api_key=api_key)
        elif target_name == "openai":
            return OpenAIProvider(api_key=api_key)
        elif target_name == "anthropic":
            return AnthropicProvider(api_key=api_key)
        elif target_name == "mistral":
            return MistralProvider(api_key=api_key)
        else:
            return MockProvider()

    def get_active_provider_and_model(self) -> Tuple[BaseProvider, str]:
        """Resolves active provider & active model, falling back to mock if unconfigured."""
        prov_name = config.active_provider
        prov = self.get_provider(prov_name)
        is_avail, _ = prov.is_available()
        
        model_name = config.active_model
        
        if not is_avail and prov_name != "mock":
            # Check if any other provider is configured before falling back to mock
            for candidate in ["groq", "gemini", "openrouter", "openai", "anthropic", "ollama"]:
                candidate_prov = self.get_provider(candidate)
                c_avail, _ = candidate_prov.is_available()
                if c_avail:
                    return candidate_prov, self._get_default_model_for(candidate)
            return MockProvider(), "leaf-offline"
            
        return prov, model_name

    def _get_default_model_for(self, provider: str) -> str:
        defaults = {
            "groq": "llama-3.3-70b-versatile",
            "gemini": "gemini-2.0-flash",
            "ollama": "ollama/llama3.2",
            "openrouter": "deepseek/deepseek-r1:free",
            "openai": "gpt-4o",
            "anthropic": "claude-3-7-sonnet-20250219",
            "mistral": "codestral-latest",
            "mock": "leaf-offline"
        }
        return defaults.get(provider.lower(), "llama-3.3-70b-versatile")

# Global router instance
router = ProviderRouter()
