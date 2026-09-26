"""
LeafCode Agent Autonomous ReAct Loop Engine
===========================================
Orchestrates prompt evaluation, tool dispatch, multi-step execution, and user feedback.
"""

import sys
import json
from typing import Optional, Callable
from leafcode.config import config
from leafcode.providers.router import router
from leafcode.tools import registry
from leafcode.agent.context import ContextManager
from leafcode.agent.session import SessionManager
from leafcode.ui.theme import Colors, style, make_box, make_badge
from leafcode.ui.markdown_renderer import render_markdown
from leafcode.ui.animations import LeafSpinner

class LeafAgent:
    def __init__(self, session: Optional[SessionManager] = None):
        self.context_mgr = ContextManager()
        self.session = session or SessionManager()
        
        # Initialize with system message if brand new session
        if not self.session.messages:
            self.session.messages.append(self.context_mgr.build_system_message())

    def run_turn(self, user_prompt: str, confirm_callback: Optional[Callable[[str], bool]] = None) -> str:
        """Executes a complete user-agent interaction turn, handling any ReAct tool calls."""
        # Record user message
        self.session.add_message("user", user_prompt)
        
        max_tool_steps = 10
        step_count = 0
        final_text = ""
        
        while step_count < max_tool_steps:
            step_count += 1
            provider, model_name = router.get_active_provider_and_model()
            schemas = registry.get_schemas()
            
            # Compact history to fit context windows
            compacted_msgs = self.context_mgr.compact_history(self.session.messages)
            
            spinner = LeafSpinner(message=f"LeafCode thinking ({model_name})...")
            spinner.start()
            
            try:
                response = provider.generate(
                    messages=compacted_msgs,
                    model=model_name,
                    temperature=config.config.get("temperature", 0.3),
                    max_tokens=config.config.get("max_tokens", 4096),
                    tools=schemas if schemas else None
                )
            except Exception as e:
                spinner.stop()
                err_msg = f"{Colors.ROSE}Error communicating with {provider.name}: {str(e)}{Colors.RESET}"
                print(err_msg)
                return err_msg
            finally:
                spinner.stop()

            content = response.get("content", "") or ""
            tool_calls = response.get("tool_calls", [])

            # Record assistant turn in history
            self.session.add_message("assistant", content, tool_calls=tool_calls if tool_calls else None)

            if content:
                print(render_markdown(content))
                final_text += content

            # If no tools were invoked, we are done
            if not tool_calls:
                break

            # Process all tool calls in sequence
            for tc in tool_calls:
                fn = tc.get("function", {})
                tool_name = fn.get("name", "unknown")
                raw_args = fn.get("arguments", "{}")
                
                if isinstance(raw_args, str):
                    try:
                        args = json.loads(raw_args)
                    except Exception:
                        args = {}
                else:
                    args = raw_args

                # Format tool execution badge
                args_preview = ", ".join(f"{k}={repr(v)[:40]}" for k, v in args.items())
                print(f"\n{Colors.EMERALD}🌿 Executing Tool:{Colors.RESET} {Colors.BOLD}{Colors.WHITE}{tool_name}{Colors.RESET}({Colors.MINT}{args_preview}{Colors.RESET})")

                # Permission check for command execution
                proceed = True
                if tool_name == "run_command" and not config.auto_confirm:
                    if confirm_callback:
                        proceed = confirm_callback(args.get("command", ""))
                    else:
                        ans = input(f"{Colors.AMBER}🍃 Allow shell execution: `{args.get('command')}`? [Y/n]: {Colors.RESET}").strip().lower()
                        proceed = ans in ("", "y", "yes")

                if proceed:
                    tool_output = registry.execute(tool_name, args)
                else:
                    tool_output = "User declined tool execution permission."
                    print(f"{Colors.ROSE}Execution cancelled by user.{Colors.RESET}")

                # Show tool output snippet
                preview_lines = tool_output.strip().split("\n")
                if len(preview_lines) > 8:
                    snippet = "\n".join(preview_lines[:7]) + f"\n... [{len(preview_lines) - 7} more lines]"
                else:
                    snippet = tool_output.strip()
                    
                print(f"{Colors.DARK_GRAY}┌─ Tool Result ──────────────────────────────────────{Colors.RESET}")
                for line in snippet.split("\n"):
                    print(f"{Colors.DARK_GRAY}│{Colors.RESET} {line}")
                print(f"{Colors.DARK_GRAY}└────────────────────────────────────────────────────{Colors.RESET}\n")

                # Append tool result to session history
                self.session.add_message(
                    "tool",
                    tool_output,
                    tool_call_id=tc.get("id", "call_default"),
                    name=tool_name
                )

        return final_text
