"""
LeafCode Shell Execution Tools
==============================
Executes system commands with safety checks, real-time logging, and timeout boundaries.
"""

import subprocess
from leafcode.tools.registry import tool

@tool(name="run_command", description="Executes a shell command in the workspace and returns stdout/stderr output.")
def run_command(command: str, timeout: int = 60) -> str:
    # Basic safety checks for catastrophic destructive commands
    forbidden = ["rm -rf /", "mkfs", ":(){ :|:& };:", "dd if=/dev/zero of=/dev/sda"]
    for f in forbidden:
        if f in command:
            return f"Command execution blocked for security reasons: prohibited pattern '{f}'."
            
    try:
        proc = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        out = proc.stdout.strip()
        err = proc.stderr.strip()
        
        result = []
        if out:
            result.append(out)
        if err:
            result.append(f"[STDERR]\n{err}")
        if proc.returncode != 0:
            result.append(f"[Exit code: {proc.returncode}]")
            
        return "\n".join(result) if result else "(Command produced no output)"
    except subprocess.TimeoutExpired:
        return f"Error: Command timed out after {timeout} seconds."
    except Exception as e:
        return f"Error executing command: {str(e)}"
