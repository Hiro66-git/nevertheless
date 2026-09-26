"""
LeafCode Slash Commands & Interactive Control Engine
===================================================
Provides quick in-terminal controls for switching providers, managing models,
inspecting sessions, setting keys, and exploring features.
"""

import sys
import json
from typing import Optional, List
from leafcode.config import config
from leafcode.providers.models import MODELS_CATALOG, get_free_models
from leafcode.providers.router import router
from leafcode.agent.session import SessionManager
from leafcode.ui.theme import Colors, style, make_box, make_badge
from leafcode.ui.ascii_art import get_bonsai_header

def handle_slash_command(cmd_line: str, session: SessionManager) -> bool:
    """
    Handles slash command invocations.
    Returns True if command was handled, False otherwise.
    """
    parts = cmd_line.strip().split()
    if not parts or not parts[0].startswith("/"):
        return False
        
    cmd = parts[0].lower()
    args = parts[1:]
    
    if cmd in ("/exit", "/quit", "/q"):
        print(f"\n{Colors.EMERALD}🍃 May your code stay evergreen. Farewell!{Colors.RESET}\n")
        sys.exit(0)
        
    elif cmd in ("/help", "/h", "/?"):
        show_help()
        return True
        
    elif cmd in ("/models", "/m"):
        show_models()
        return True
        
    elif cmd in ("/provider", "/p"):
        if args:
            prov = args[0].lower()
            valid_providers = ["groq", "gemini", "ollama", "openrouter", "openai", "anthropic", "mistral", "mock"]
            if prov in valid_providers:
                config.active_provider = prov
                default_m = router._get_default_model_for(prov)
                config.active_model = default_m
                print(f"{Colors.EMERALD}✓ Switched provider to:{Colors.RESET} {Colors.WHITE}{prov}{Colors.RESET} (Model: {Colors.LIME}{default_m}{Colors.RESET})")
            else:
                print(f"{Colors.ROSE}Invalid provider. Choose from: {', '.join(valid_providers)}{Colors.RESET}")
        else:
            print(f"{Colors.MINT}Active provider:{Colors.RESET} {Colors.WHITE}{config.active_provider}{Colors.RESET}")
            print(f"{Colors.GRAY}Usage: /provider <groq|gemini|ollama|openrouter|openai|anthropic|mistral|mock>{Colors.RESET}")
        return True
        
    elif cmd in ("/model",):
        if args:
            new_model = args[0]
            config.active_model = new_model
            print(f"{Colors.EMERALD}✓ Active model set to:{Colors.RESET} {Colors.LIME}{new_model}{Colors.RESET}")
        else:
            print(f"{Colors.MINT}Active model:{Colors.RESET} {Colors.LIME}{config.active_model}{Colors.RESET}")
            print(f"{Colors.GRAY}Usage: /model <model_name> (see /models for options){Colors.RESET}")
        return True
        
    elif cmd in ("/config", "/cfg"):
        if not args:
            show_config()
        elif args[0] == "set" and len(args) >= 3:
            key_name, key_val = args[1].lower(), args[2]
            if key_name in config.config.get("api_keys", {}):
                config.set_api_key(key_name, key_val)
                print(f"{Colors.EMERALD}✓ Successfully updated API key for {key_name}.{Colors.RESET}")
            elif key_name == "auto_confirm":
                config.auto_confirm = key_val.lower() in ("true", "1", "yes")
                print(f"{Colors.EMERALD}✓ Auto-confirm set to {config.auto_confirm}.{Colors.RESET}")
            else:
                print(f"{Colors.ROSE}Unknown config key '{key_name}'. Use `/config set <provider> <key>`{Colors.RESET}")
        else:
            print(f"{Colors.GRAY}Usage:\n  /config\n  /config set <groq|gemini|openai|anthropic|openrouter|mistral> <API_KEY>\n  /config set auto_confirm true{Colors.RESET}")
        return True
        
    elif cmd in ("/clear", "/c"):
        session.messages.clear()
        print(f"{Colors.MINT}🍃 Context cleared. Fresh conversation started.{Colors.RESET}")
        return True
        
    elif cmd in ("/bonsai", "/tree"):
        print(get_bonsai_header())
        return True
        
    elif cmd in ("/sessions", "/history"):
        sessions = SessionManager.list_sessions()
        print(f"\n{Colors.EMERALD}{Colors.BOLD}🍃 Saved LeafCode Sessions:{Colors.RESET}")
        for s in sessions[:10]:
            print(f"  {Colors.MINT}● {s['id']}{Colors.RESET} {Colors.GRAY}({s['time']} • {s['message_count']} messages){Colors.RESET}")
        print()
        return True
        
    elif cmd in ("/export",):
        md = session.export_markdown()
        out_file = f"leafcode_session_{session.session_id}.md"
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(md)
        print(f"{Colors.EMERALD}✓ Exported session to {out_file}{Colors.RESET}")
        return True
        
    else:
        print(f"{Colors.ROSE}Unknown slash command '{cmd}'. Type {Colors.LEAF_GLOW}/help{Colors.ROSE} for available commands.{Colors.RESET}")
        return True

def show_help():
    help_content = f"""
{Colors.EMERALD}{Colors.BOLD}🌿 LeafCode Terminal Assistant Commands{Colors.RESET}
─────────────────────────────────────────────────────────────
{Colors.LEAF_GLOW}/help{Colors.RESET}                  Show this interactive guide
{Colors.LEAF_GLOW}/models{Colors.RESET}                Browse available AI models (Free & Frontier)
{Colors.LEAF_GLOW}/provider <name>{Colors.RESET}       Switch provider (groq, gemini, ollama, openrouter, openai, anthropic, mock)
{Colors.LEAF_GLOW}/model <name>{Colors.RESET}          Switch active model
{Colors.LEAF_GLOW}/config{Colors.RESET}                View & set API keys and preferences
{Colors.LEAF_GLOW}/config set <p> <k>{Colors.RESET}   Store API key for a provider
{Colors.LEAF_GLOW}/clear{Colors.RESET}                 Clear conversation context memory
{Colors.LEAF_GLOW}/sessions{Colors.RESET}              List previous conversation sessions
{Colors.LEAF_GLOW}/export{Colors.RESET}                Export current chat history to Markdown
{Colors.LEAF_GLOW}/bonsai{Colors.RESET}                Display ASCII botanical tree artwork
{Colors.LEAF_GLOW}/exit{Colors.RESET}                  Exit LeafCode
─────────────────────────────────────────────────────────────
{Colors.DARK_GRAY}Tip: You can ask LeafCode to edit files, run bash commands, inspect Git diffs, or debug errors.{Colors.RESET}
"""
    print(help_content)

def show_models():
    print(f"\n{Colors.EMERALD}{Colors.BOLD}🍃 Supported AI Models Catalog:{Colors.RESET}\n")
    for model_id, info in MODELS_CATALOG.items():
        free_badge = f"{Colors.EMERALD}[FREE]{Colors.RESET}" if info.get("free") else f"{Colors.GRAY}[PAID]{Colors.RESET}"
        prov_badge = f"{Colors.MINT}[{info['provider'].upper()}]{Colors.RESET}"
        print(f"  {prov_badge} {free_badge} {Colors.WHITE}{Colors.BOLD}{model_id}{Colors.RESET}")
        print(f"     {Colors.GRAY}↳ {info['description']} (Ctx: {info['context_window']:,} tokens){Colors.RESET}")
    print(f"\n{Colors.DARK_GRAY}To select a model: {Colors.LEAF_GLOW}/provider <name>{Colors.DARK_GRAY} or {Colors.LEAF_GLOW}/model <model_id>{Colors.RESET}\n")

def show_config():
    prov = config.active_provider
    model = config.active_model
    auto_c = config.auto_confirm
    keys = config.config.get("api_keys", {})
    
    print(f"\n{Colors.EMERALD}{Colors.BOLD}🍃 Active Configuration:{Colors.RESET}")
    print(f"  {Colors.MINT}Provider:{Colors.RESET}       {Colors.WHITE}{prov}{Colors.RESET}")
    print(f"  {Colors.MINT}Model:{Colors.RESET}          {Colors.LIME}{model}{Colors.RESET}")
    print(f"  {Colors.MINT}Auto-confirm:{Colors.RESET}   {Colors.WHITE}{auto_c}{Colors.RESET}")
    print(f"  {Colors.MINT}Ollama URL:{Colors.RESET}     {Colors.WHITE}{config.config.get('ollama_base_url')}{Colors.RESET}")
    print(f"\n{Colors.MINT}API Key Status:{Colors.RESET}")
    for p in ["groq", "gemini", "openrouter", "openai", "anthropic", "mistral"]:
        has_key = bool(config.get_api_key(p))
        status = f"{Colors.EMERALD}Configured ✓{Colors.RESET}" if has_key else f"{Colors.GRAY}Not set{Colors.RESET}"
        print(f"  {p.ljust(12)}: {status}")
    print(f"\n{Colors.DARK_GRAY}To update a key: {Colors.LEAF_GLOW}/config set <provider> <key>{Colors.RESET}\n")
