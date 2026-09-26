"""
LeafCode Configuration & Environment Manager
============================================
Handles persistent user preferences, active provider/model routing,
API key retrieval (env vars or config file), and session options.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional

DEFAULT_CONFIG_DIR = Path.home() / ".leafcode"
CONFIG_FILE_PATH = DEFAULT_CONFIG_DIR / "config.json"
SESSIONS_DIR = DEFAULT_CONFIG_DIR / "sessions"

DEFAULT_CONFIG: Dict[str, Any] = {
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.3,
    "max_tokens": 4096,
    "ollama_base_url": "http://localhost:11434",
    "auto_confirm": False,
    "persona": "Botanical Master (Accurate, concise, friendly)",
    "api_keys": {
        "groq": "",
        "gemini": "",
        "openrouter": "",
        "openai": "",
        "anthropic": "",
        "mistral": ""
    }
}

class ConfigManager:
    def __init__(self, config_path: Path = CONFIG_FILE_PATH):
        self.config_path = config_path
        self.config: Dict[str, Any] = dict(DEFAULT_CONFIG)
        self.load()

    def load(self):
        """Loads configuration from file if exists, otherwise sets up defaults."""
        DEFAULT_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
        
        if self.config_path.exists():
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.config.update(data)
            except Exception:
                pass
        else:
            self.save()

    def save(self):
        """Saves active configuration to disk."""
        DEFAULT_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(self.config, f, indent=2)

    def get_api_key(self, provider: str) -> Optional[str]:
        """Retrieves API key with priority: Environment Variable -> Config File."""
        env_map = {
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "gemini": "GEMINI_API_KEY",
            "google": "GEMINI_API_KEY",
            "groq": "GROQ_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
            "mistral": "MISTRAL_API_KEY",
            "together": "TOGETHER_API_KEY",
            "cohere": "COHERE_API_KEY",
            "huggingface": "HF_TOKEN"
        }
        
        env_var = env_map.get(provider.lower())
        if env_var and os.environ.get(env_var):
            return os.environ.get(env_var)
            
        return self.config.get("api_keys", {}).get(provider.lower())

    def set_api_key(self, provider: str, key: str):
        if "api_keys" not in self.config:
            self.config["api_keys"] = {}
        self.config["api_keys"][provider.lower()] = key.strip()
        self.save()

    @property
    def active_provider(self) -> str:
        return self.config.get("provider", "groq")

    @active_provider.setter
    def active_provider(self, val: str):
        self.config["provider"] = val.lower()
        self.save()

    @property
    def active_model(self) -> str:
        return self.config.get("model", "llama-3.3-70b-versatile")

    @active_model.setter
    def active_model(self, val: str):
        self.config["model"] = val
        self.save()

    @property
    def auto_confirm(self) -> bool:
        return self.config.get("auto_confirm", False)

    @auto_confirm.setter
    def auto_confirm(self, val: bool):
        self.config["auto_confirm"] = val
        self.save()

# Global config singleton
config = ConfigManager()
