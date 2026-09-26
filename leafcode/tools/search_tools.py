"""
LeafCode Search & Discovery Tools
=================================
Fast code search (ripgrep/grep equivalent) and file glob pattern finder.
"""

import os
import fnmatch
from pathlib import Path
from leafcode.tools.registry import tool

@tool(name="search_code", description="Searches for exact text pattern across files in a directory.")
def search_code(query: str, path: str = ".", file_pattern: str = "*") -> str:
    root = Path(path).expanduser().resolve()
    if not root.exists():
        return f"Error: Path '{path}' does not exist."
        
    matches = []
    ignore_dirs = {".git", "node_modules", ".venv", "__pycache__", "dist", "build", ".next", ".cache"}
    
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
        for filename in filenames:
            if fnmatch.fnmatch(filename, file_pattern):
                full_path = Path(dirpath) / filename
                rel_path = full_path.relative_to(root)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        for line_no, line in enumerate(f, 1):
                            if query in line:
                                matches.append(f"{rel_path}:{line_no}: {line.strip()}")
                                if len(matches) >= 100:
                                    break
                except Exception:
                    continue
        if len(matches) >= 100:
            break
            
    if not matches:
        return f"No matches found for '{query}'."
    return "\n".join(matches)

@tool(name="find_files", description="Finds files matching a glob pattern (e.g. '*.py', '**/*.json').")
def find_files(pattern: str = "*", path: str = ".") -> str:
    root = Path(path).expanduser().resolve()
    if not root.exists():
        return f"Error: Path '{path}' does not exist."
        
    matched_files = []
    ignore_dirs = {".git", "node_modules", ".venv", "__pycache__", "dist", "build"}
    
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
        for filename in filenames:
            if fnmatch.fnmatch(filename, pattern):
                full_path = Path(dirpath) / filename
                matched_files.append(str(full_path.relative_to(root)))
                if len(matched_files) >= 200:
                    break
        if len(matched_files) >= 200:
            break
            
    if not matched_files:
        return f"No files found matching '{pattern}' in '{path}'."
    return "\n".join(matched_files)
