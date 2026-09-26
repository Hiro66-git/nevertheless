"""
LeafCode Agent Context & System Prompt Engine
=============================================
Manages prompt templates, OS environment introspection, and context compaction.
"""

import os
import sys
import platform
from typing import List, Dict, Any

LEAFCODE_SYSTEM_PROMPT = """You are LeafCode (🍃), an elite AI software engineering assistant operating directly in the developer's terminal.
Your demeanor is botanical, fresh, focused, and exceptionally competent.

Environment Context:
- Operating System: {os_name} ({platform_release})
- Python Version: {python_version}
- Current Working Directory: {cwd}

Core Operating Guidelines:
1. Be concise, direct, and actionable. Avoid fluff.
2. When answering code questions, provide clear explanations alongside styled markdown code snippets.
3. You have full access to workspace tools:
   - read_file, write_file, edit_file, list_dir
   - search_code, find_files
   - run_command (executes shell commands)
   - git_status, git_diff, git_log, git_commit
   - fetch_url
4. Always inspect relevant files before modifying them.
5. Provide helpful summaries after tool executions.
"""

class ContextManager:
    def __init__(self, cwd: str = "."):
        self.cwd = os.path.abspath(cwd)
        
    def build_system_message(self) -> Dict[str, str]:
        prompt = LEAFCODE_SYSTEM_PROMPT.format(
            os_name=platform.system(),
            platform_release=platform.release(),
            python_version=platform.python_version(),
            cwd=self.cwd
        )
        return {"role": "system", "content": prompt}

    def compact_history(self, messages: List[Dict[str, Any]], max_messages: int = 40) -> List[Dict[str, Any]]:
        """Keeps system prompt, initial turns, and most recent turns within bounds."""
        if len(messages) <= max_messages:
            return messages
            
        system_msg = messages[0] if messages and messages[0].get("role") == "system" else None
        other_msgs = messages[1:] if system_msg else messages
        
        # Keep last (max_messages - 1)
        trimmed = other_msgs[-(max_messages - 1):]
        
        result = []
        if system_msg:
            result.append(system_msg)
        result.extend(trimmed)
        return result
