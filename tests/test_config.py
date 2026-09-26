import os
import unittest
import tempfile
from pathlib import Path
from leafcode.config import ConfigManager

class TestConfig(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.config_path = Path(self.temp_dir.name) / "config.json"
        self.manager = ConfigManager(config_path=self.config_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_default_config_values(self):
        self.assertEqual(self.manager.active_provider, "groq")
        self.assertEqual(self.manager.active_model, "llama-3.3-70b-versatile")
        self.assertFalse(self.manager.auto_confirm)

    def test_set_and_save_api_key(self):
        self.manager.set_api_key("groq", "gsk_test_key_12345")
        self.assertEqual(self.manager.get_api_key("groq"), "gsk_test_key_12345")

        # Reload from file to ensure persistence
        new_manager = ConfigManager(config_path=self.config_path)
        self.assertEqual(new_manager.get_api_key("groq"), "gsk_test_key_12345")

    def test_env_var_override(self):
        os.environ["GROQ_API_KEY"] = "gsk_env_override_999"
        try:
            self.assertEqual(self.manager.get_api_key("groq"), "gsk_env_override_999")
        finally:
            del os.environ["GROQ_API_KEY"]

if __name__ == "__main__":
    unittest.main()
