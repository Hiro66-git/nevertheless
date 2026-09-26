"""
LeafCode Multi-Provider Model Catalog
=====================================
Directory of supported foundation models across providers with free tier indicators,
context limits, and recommended use-cases.
"""

from typing import Dict, List, Any

MODELS_CATALOG: Dict[str, Dict[str, Any]] = {
    # Groq Models (Ultra-Fast Free Tier)
    "llama-3.3-70b-versatile": {
        "provider": "groq",
        "name": "Llama 3.3 70B Versatile",
        "free": True,
        "context_window": 128000,
        "description": "Meta's flagship high-performance open model, fast & versatile."
    },
    "deepseek-r1-distill-llama-70b": {
        "provider": "groq",
        "name": "DeepSeek R1 Distill Llama 70B",
        "free": True,
        "context_window": 128000,
        "description": "DeepSeek reasoning model distilled into Llama 70B."
    },
    "llama-3.1-8b-instant": {
        "provider": "groq",
        "name": "Llama 3.1 8B Instant",
        "free": True,
        "context_window": 128000,
        "description": "Blazing fast lightweight coding & conversational model."
    },
    
    # Google Gemini Models (Free tier available)
    "gemini-2.0-flash": {
        "provider": "gemini",
        "name": "Gemini 2.0 Flash",
        "free": True,
        "context_window": 1048576,
        "description": "Next-gen multimodal speed with massive 1M token context."
    },
    "gemini-1.5-pro": {
        "provider": "gemini",
        "name": "Gemini 1.5 Pro",
        "free": True,
        "context_window": 2097152,
        "description": "Google's 2M token context coding powerhouse."
    },
    "gemini-1.5-flash": {
        "provider": "gemini",
        "name": "Gemini 1.5 Flash",
        "free": True,
        "context_window": 1048576,
        "description": "Fast & cost-efficient Google Gemini model."
    },
    
    # Ollama Local Models (100% Free & Offline)
    "ollama/llama3.2": {
        "provider": "ollama",
        "name": "Llama 3.2 Local",
        "free": True,
        "context_window": 128000,
        "description": "Local offline execution via Ollama runtime."
    },
    "ollama/deepseek-r1": {
        "provider": "ollama",
        "name": "DeepSeek R1 Local",
        "free": True,
        "context_window": 64000,
        "description": "Local offline DeepSeek reasoning model."
    },
    "ollama/qwen2.5-coder": {
        "provider": "ollama",
        "name": "Qwen 2.5 Coder Local",
        "free": True,
        "context_window": 128000,
        "description": "Alibaba Qwen specialized local coding model."
    },
    
    # OpenRouter Models (Free & Paid)
    "deepseek/deepseek-r1:free": {
        "provider": "openrouter",
        "name": "DeepSeek R1 Free",
        "free": True,
        "context_window": 64000,
        "description": "Free community-routed DeepSeek reasoning engine."
    },
    "meta-llama/llama-3.3-70b-instruct:free": {
        "provider": "openrouter",
        "name": "Llama 3.3 70B Instruct Free",
        "free": True,
        "context_window": 131072,
        "description": "OpenRouter hosted free tier Llama 3.3 70B."
    },
    
    # Anthropic Frontier Models
    "claude-3-7-sonnet-20250219": {
        "provider": "anthropic",
        "name": "Claude 3.7 Sonnet (Hybrid Reasoning)",
        "free": False,
        "context_window": 200000,
        "description": "Anthropic's premier hybrid reasoning and coding model."
    },
    "claude-3-5-sonnet-20241022": {
        "provider": "anthropic",
        "name": "Claude 3.5 Sonnet",
        "free": False,
        "context_window": 200000,
        "description": "Industry benchmark for software engineering and tool use."
    },
    "claude-3-5-haiku-20241022": {
        "provider": "anthropic",
        "name": "Claude 3.5 Haiku",
        "free": False,
        "context_window": 200000,
        "description": "Ultra fast lightweight model with Claude-level intelligence."
    },
    
    # OpenAI Frontier Models
    "gpt-4o": {
        "provider": "openai",
        "name": "GPT-4o Omnimodel",
        "free": False,
        "context_window": 128000,
        "description": "OpenAI's flagship multimodal intelligence engine."
    },
    "gpt-4o-mini": {
        "provider": "openai",
        "name": "GPT-4o Mini",
        "free": False,
        "context_window": 128000,
        "description": "Affordable, high-speed OpenAI model."
    },
    "o3-mini": {
        "provider": "openai",
        "name": "o3-mini (Reasoning)",
        "free": False,
        "context_window": 200000,
        "description": "OpenAI high-tier reasoning model for math and code."
    },
    
    # Mistral AI
    "codestral-latest": {
        "provider": "mistral",
        "name": "Mistral Codestral",
        "free": False,
        "context_window": 32000,
        "description": "Mistral's dedicated generative coding model."
    },
    
    # Built-in Offline Simulation Engine
    "leaf-offline": {
        "provider": "mock",
        "name": "LeafCode Offline Brain",
        "free": True,
        "context_window": 32000,
        "description": "Zero-config offline intelligent simulator for testing tools and flows."
    }
}

def get_models_by_provider(provider: str) -> Dict[str, Dict[str, Any]]:
    return {k: v for k, v in MODELS_CATALOG.items() if v["provider"] == provider.lower()}

def get_free_models() -> Dict[str, Dict[str, Any]]:
    return {k: v for k, v in MODELS_CATALOG.items() if v.get("free", False)}
