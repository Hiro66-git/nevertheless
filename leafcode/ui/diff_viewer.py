"""
LeafCode Unified & Colorized Diff Viewer
========================================
Presents file modifications and Git diffs clearly with green additions
and red/amber deletions inside a clean terminal container.
"""

import difflib
from leafcode.ui.theme import Colors

def render_diff(old_content: str, new_content: str, file_path: str = "file") -> str:
    """Generates a color-coded unified diff for proposed code changes."""
    old_lines = old_content.splitlines(keepends=True)
    new_lines = new_content.splitlines(keepends=True)
    
    diff = list(difflib.unified_diff(
        old_lines,
        new_lines,
        fromfile=f"a/{file_path}",
        tofile=f"b/{file_path}",
        lineterm=""
    ))
    
    if not diff:
        return f"{Colors.GRAY}No changes detected.{Colors.RESET}"
    
    header = f"{Colors.MINT}{Colors.BOLD}DIFF: {file_path}{Colors.RESET}"
    divider = f"{Colors.FOREST}─" * 60 + f"{Colors.RESET}"
    
    output = [header, divider]
    for line in diff:
        if line.startswith("+++") or line.startswith("---"):
            output.append(f"{Colors.BOLD}{Colors.WHITE}{line}{Colors.RESET}")
        elif line.startswith("@@"):
            output.append(f"{Colors.LEAF_GLOW}{line}{Colors.RESET}")
        elif line.startswith("+"):
            output.append(f"{Colors.EMERALD}+ {line[1:]}{Colors.RESET}")
        elif line.startswith("-"):
            output.append(f"{Colors.ROSE}- {line[1:]}{Colors.RESET}")
        else:
            output.append(f"{Colors.GRAY}  {line}{Colors.RESET}")
            
    output.append(divider)
    return "\n".join(output)
