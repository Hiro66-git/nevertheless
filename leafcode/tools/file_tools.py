"""
LeafCode File Manipulation Tools
================================
Safe, reliable file system manipulation tools for the AI agent.
"""

import os
from pathlib import Path
from leafcode.tools.registry import tool

@tool(name="read_file", description="Reads text content from a file with optional line offsets and limits.")
def read_file(path: str, offset: int = 1, limit: int = 500) -> str:
    p = Path(path).expanduser().resolve()
    if not p.exists():
        return f"Error: File '{path}' does not exist."
    if p.is_dir():
        return f"Error: '{path}' is a directory, not a file. Use list_dir instead."
    
    try:
        with open(p, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
            
        start_idx = max(0, offset - 1)
        end_idx = min(len(lines), start_idx + limit)
        selected_lines = lines[start_idx:end_idx]
        
        numbered_output = []
        for idx, line in enumerate(selected_lines, start=start_idx + 1):
            numbered_output.append(f"{idx:4d} | {line}")
            
        return "".join(numbered_output) if numbered_output else "(Empty file)"
    except Exception as e:
        return f"Error reading file '{path}': {str(e)}"

@tool(name="write_file", description="Creates or overwrites a file with full specified text content.")
def write_file(path: str, content: str) -> str:
    p = Path(path).expanduser().resolve()
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote {len(content)} characters to '{path}'."
    except Exception as e:
        return f"Error writing file '{path}': {str(e)}"

@tool(name="edit_file", description="Replaces exact or fuzzy matching text inside an existing file.")
def edit_file(path: str, old_text: str, new_text: str) -> str:
    p = Path(path).expanduser().resolve()
    if not p.exists():
        return f"Error: File '{path}' does not exist."
        
    try:
        with open(p, "r", encoding="utf-8") as f:
            data = f.read()
            
        if old_text not in data:
            # Try normalized whitespace replacement
            norm_old = " ".join(old_text.split())
            norm_data = " ".join(data.split())
            if norm_old not in norm_data:
                return f"Error: Target text to replace was not found in '{path}'."
            else:
                return f"Error: Exact match not found in '{path}'. Please check whitespace."
                
        updated_data = data.replace(old_text, new_text, 1)
        with open(p, "w", encoding="utf-8") as f:
            f.write(updated_data)
            
        return f"Successfully replaced occurrences in '{path}'."
    except Exception as e:
        return f"Error editing file '{path}': {str(e)}"

@tool(name="list_dir", description="Lists files and subdirectories within a given directory path.")
def list_dir(path: str = ".") -> str:
    p = Path(path).expanduser().resolve()
    if not p.exists():
        return f"Error: Directory '{path}' does not exist."
    if not p.is_dir():
        return f"Error: '{path}' is a file, not a directory."
        
    try:
        entries = sorted(p.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
        output = [f"Contents of {p}:"]
        for e in entries:
            prefix = "📁 " if e.is_dir() else "📄 "
            size_str = f" ({e.stat().st_size} bytes)" if e.is_file() else ""
            output.append(f"  {prefix}{e.name}{size_str}")
        return "\n".join(output)
    except Exception as e:
        return f"Error listing directory '{path}': {str(e)}"
