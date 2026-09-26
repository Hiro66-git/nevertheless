import unittest
from leafcode.ui.theme import style, green_gradient, make_box, make_badge, Colors
from leafcode.ui.markdown_renderer import render_markdown, highlight_code_line
from leafcode.ui.diff_viewer import render_diff
from leafcode.ui.ascii_art import get_welcome_banner, get_bonsai_header

class TestUI(unittest.TestCase):
    def test_theme_styling(self):
        styled = style("Hello World", Colors.EMERALD, Colors.BOLD)
        self.assertIn("Hello World", styled)

    def test_green_gradient(self):
        grad = green_gradient("LeafCode Terminal")
        self.assertIn("LeafCode", grad)

    def test_make_box(self):
        box = make_box("Title", "Content inside box")
        self.assertIn("Title", box)
        self.assertIn("Content inside box", box)

    def test_markdown_renderer(self):
        md = "# Header 1\n\nSome **bold text** and `inline_code`.\n\n```python\ndef test():\n    return 42\n```"
        rendered = render_markdown(md)
        self.assertIn("Header 1", rendered)
        self.assertIn("bold text", rendered)
        self.assertIn("inline_code", rendered)
        self.assertIn("def test", rendered)

    def test_diff_viewer(self):
        old = "def foo():\n    return 1"
        new = "def foo():\n    return 2"
        diff = render_diff(old, new, "test.py")
        self.assertIn("DIFF: test.py", diff)
        self.assertIn("+", diff)
        self.assertIn("-", diff)

    def test_ascii_art(self):
        banner = get_welcome_banner("0.1.0", "llama-3.3-70b-versatile", "GROQ", "/workspace")
        self.assertIn("Botanical AI Coding Terminal", banner)
        self.assertIn("0.1.0", banner)

        bonsai = get_bonsai_header()
        self.assertTrue(len(bonsai) > 50)

if __name__ == "__main__":
    unittest.main()
