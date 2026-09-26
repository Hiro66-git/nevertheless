"""
LeafCode CLI Entry Point & Interactive Shell
============================================
Handles command-line argument parsing, one-shot prompt execution,
and the botanical interactive REPL session.
"""

import sys
import os
import argparse
from leafcode import __version__
from leafcode.config import config
from leafcode.agent.core import LeafAgent
from leafcode.agent.session import SessionManager
from leafcode.commands.slash_commands import handle_slash_command, show_models, show_config
from leafcode.ui.theme import Colors, style
from leafcode.ui.ascii_art import get_welcome_banner, get_bonsai_header
from leafcode.ui.animations import play_sprout_animation

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="leafcode",
        description="🍃 LeafCode — The Botanical AI Coding Terminal Assistant",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("prompt", nargs="*", help="Direct prompt to execute in one-shot mode.")
    parser.add_argument("-p", "--provider", type=str, help="Specify AI provider (groq, gemini, ollama, openrouter, openai, anthropic, mock)")
    parser.add_argument("-m", "--model", type=str, help="Specify active model name")
    parser.add_argument("-y", "--yes", action="store_true", help="Auto-confirm all tool executions without prompting")
    parser.add_argument("--models", action="store_true", help="List all supported models and exit")
    parser.add_argument("--config", action="store_true", help="Show active configuration and exit")
    parser.add_argument("--tree", action="store_true", help="Display botanical ASCII art")
    parser.add_argument("-v", "--version", action="version", version=f"LeafCode v{__version__}")
    return parser

def interactive_repl():
    """Runs the full interactive terminal REPL."""
    # Play botanical sprout animation
    play_sprout_animation(duration_ms=350)
    
    # Print welcome screen
    cwd_name = os.getcwd()
    banner = get_welcome_banner(
        version=__version__,
        model_name=config.active_model,
        provider_name=config.active_provider.upper(),
        cwd_path=cwd_name
    )
    print(banner)
    
    session = SessionManager()
    agent = LeafAgent(session=session)
    
    while True:
        try:
            prompt_str = f"{Colors.EMERALD}🍃 leafcode{Colors.RESET}{Colors.FOREST}>{Colors.RESET} "
            user_input = input(prompt_str).strip()
            
            if not user_input:
                continue
                
            # Check for slash commands
            if user_input.startswith("/"):
                handled = handle_slash_command(user_input, session)
                if handled:
                    continue
                    
            # Run agent turn
            print()
            agent.run_turn(user_input)
            print()
            
        except KeyboardInterrupt:
            print(f"\n{Colors.AMBER}(Interrupted current turn){Colors.RESET}\n")
            continue
        except EOFError:
            print(f"\n{Colors.EMERALD}🍃 May your code stay evergreen. Farewell!{Colors.RESET}\n")
            break

def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.provider:
        config.active_provider = args.provider
    if args.model:
        config.active_model = args.model
    if args.yes:
        config.auto_confirm = True

    if args.models:
        show_models()
        return

    if args.config:
        show_config()
        return

    if args.tree:
        print(get_bonsai_header())
        return

    # Check if a prompt was provided via CLI arguments
    if args.prompt:
        full_prompt = " ".join(args.prompt)
        agent = LeafAgent()
        agent.run_turn(full_prompt)
        return

    # Otherwise launch interactive REPL
    interactive_repl()

if __name__ == "__main__":
    main()
