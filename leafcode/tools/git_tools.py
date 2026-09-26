"""
LeafCode Git Integration Tools
==============================
Provides first-class Git repository inspections and modifications.
"""

import subprocess
from leafcode.tools.registry import tool

def _run_git(args: list) -> str:
    try:
        res = subprocess.run(["git"] + args, capture_output=True, text=True, timeout=30)
        out = res.stdout.strip()
        err = res.stderr.strip()
        if res.returncode != 0:
            return f"Git error ({res.returncode}): {err or out}"
        return out if out else "(No output)"
    except Exception as e:
        return f"Error executing git command: {str(e)}"

@tool(name="git_status", description="Shows current Git working tree status.")
def git_status() -> str:
    return _run_git(["status", "--short", "--branch"])

@tool(name="git_diff", description="Shows git diff for unstaged or staged changes.")
def git_diff(staged: bool = False) -> str:
    args = ["diff", "--cached"] if staged else ["diff"]
    return _run_git(args)

@tool(name="git_log", description="Shows the recent Git commit history.")
def git_log(max_count: int = 5) -> str:
    return _run_git(["log", f"-n{max_count}", "--oneline", "--decorate"])

@tool(name="git_commit", description="Stages modified files and creates a git commit with a message.")
def git_commit(message: str) -> str:
    add_res = _run_git(["add", "-A"])
    commit_res = _run_git(["commit", "-m", message])
    return f"{add_res}\n{commit_res}".strip()
