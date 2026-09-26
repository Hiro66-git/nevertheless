import unittest
from leafcode.cli import build_parser

class TestCLI(unittest.TestCase):
    def test_parser_defaults(self):
        parser = build_parser()
        args = parser.parse_args([])
        self.assertEqual(args.prompt, [])
        self.assertIsNone(args.provider)
        self.assertIsNone(args.model)
        self.assertFalse(args.yes)

    def test_parser_with_flags(self):
        parser = build_parser()
        args = parser.parse_args(["-p", "groq", "-m", "llama-3.3-70b-versatile", "-y", "check", "system"])
        self.assertEqual(args.provider, "groq")
        self.assertEqual(args.model, "llama-3.3-70b-versatile")
        self.assertTrue(args.yes)
        self.assertEqual(args.prompt, ["check", "system"])

if __name__ == "__main__":
    unittest.main()
