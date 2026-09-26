import os
import unittest
import tempfile
from pathlib import Path
from leafcode.tools.file_tools import read_file, write_file, edit_file, list_dir
from leafcode.tools.search_tools import search_code, find_files
from leafcode.tools.bash_tools import run_command
from leafcode.tools.registry import registry

class TestTools(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_file_write_and_read(self):
        test_file = self.root / "sample.py"
        res_write = write_file(str(test_file), "def hello():\n    return 'leaf'\n")
        self.assertIn("Successfully wrote", res_write)

        res_read = read_file(str(test_file))
        self.assertIn("def hello():", res_read)
        self.assertIn("return 'leaf'", res_read)

    def test_file_edit(self):
        test_file = self.root / "config.txt"
        write_file(str(test_file), "theme = dark\nversion = 1.0\n")
        
        res_edit = edit_file(str(test_file), "theme = dark", "theme = emerald_green")
        self.assertIn("Successfully replaced", res_edit)

        content = read_file(str(test_file))
        self.assertIn("theme = emerald_green", content)

    def test_list_dir(self):
        (self.root / "subdir").mkdir()
        write_file(str(self.root / "file1.txt"), "hello")
        
        res_ls = list_dir(str(self.root))
        self.assertIn("file1.txt", res_ls)
        self.assertIn("subdir", res_ls)

    def test_search_code_and_find_files(self):
        write_file(str(self.root / "module.py"), "def find_me(): pass")
        
        search_res = search_code("find_me", path=str(self.root))
        self.assertIn("module.py", search_res)
        self.assertIn("find_me", search_res)

        find_res = find_files("*.py", path=str(self.root))
        self.assertIn("module.py", find_res)

    def test_run_command_safe(self):
        res = run_command("echo 'LeafCode Test'")
        self.assertIn("LeafCode Test", res)

    def test_tool_registry_schemas(self):
        schemas = registry.get_schemas()
        tool_names = [s["function"]["name"] for s in schemas]
        self.assertIn("read_file", tool_names)
        self.assertIn("write_file", tool_names)
        self.assertIn("edit_file", tool_names)
        self.assertIn("run_command", tool_names)

if __name__ == "__main__":
    unittest.main()
