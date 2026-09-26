import unittest
from leafcode.providers.mock_provider import MockProvider
from leafcode.providers.gemini_provider import GeminiProvider
from leafcode.providers.anthropic_provider import AnthropicProvider
from leafcode.providers.router import ProviderRouter
from leafcode.providers.models import MODELS_CATALOG, get_free_models

class TestProviders(unittest.TestCase):
    def test_mock_provider(self):
        prov = MockProvider()
        avail, status = prov.is_available()
        self.assertTrue(avail)
        self.assertIn("Ready", status)

        res = prov.generate(
            messages=[{"role": "user", "content": "Hello LeafCode"}],
            model="leaf-offline"
        )
        self.assertIn("LeafCode", res["content"])

    def test_gemini_message_conversion(self):
        prov = GeminiProvider(api_key="test_key")
        sys_msg, contents = prov._convert_messages_to_gemini([
            {"role": "system", "content": "System directive"},
            {"role": "user", "content": "How to sort a list in python?"}
        ])
        self.assertEqual(sys_msg, "System directive")
        self.assertEqual(len(contents), 1)
        self.assertEqual(contents[0]["role"], "user")

    def test_anthropic_message_conversion(self):
        prov = AnthropicProvider(api_key="test_key")
        sys_msg, contents = prov._convert_messages([
            {"role": "system", "content": "Anthropic system prompt"},
            {"role": "user", "content": "Fix this bug"}
        ])
        self.assertEqual(sys_msg, "Anthropic system prompt")
        self.assertEqual(len(contents), 1)
        self.assertEqual(contents[0]["role"], "user")

    def test_models_catalog_free_models(self):
        free_models = get_free_models()
        self.assertIn("llama-3.3-70b-versatile", free_models)
        self.assertIn("gemini-2.0-flash", free_models)
        self.assertIn("ollama/llama3.2", free_models)
        self.assertIn("leaf-offline", free_models)

if __name__ == "__main__":
    unittest.main()
