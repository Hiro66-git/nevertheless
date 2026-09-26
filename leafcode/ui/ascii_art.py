"""
LeafCode Botanical ASCII Art & Illustrations
=============================================
Hand-crafted vector-like ASCII art celebrating nature, growth, and code.
"""

from leafcode.ui.theme import Colors, style, green_gradient

LEAFCODE_BANNER = r"""
  _       ______          ______ _____ ____  _____  ______ 
 | |     |  ____|   /\   |  ____/ ____/ __ \|  __ \|  ____|
 | |     | |__     /  \  | |__ | |   | |  | | |  | | |__   
 | |     |  __|   / /\ \ |  __|| |   | |  | | |  | |  __|  
 | |____ | |____ / ____ \| |   | |___| |__| | |__| | |____ 
 |______||______/_/    \_\_|    \_____\____/|_____/|______|
"""

LEAF_MINI_LOGO = r"""
       \`.  _.-'|
        \ `-    /
   __..-'      /
  /           /
 |  .-.      /
 | (   `----'
  \ \
   `'
"""

BONSAI_TREE = r"""
              ,@@@@@@@,
      ,,,.   ,@@@@@@/@@,  .oo8888o.
   ,&%%&%&&%,@@@@@/@@@@@@,8888\88/8o
  ,%&\%&&%&&%,@@@\@@@/@@@88\88888/88'
  %&&%&%&/%&&%@@\@@/ /@@@88888\88888'
  %&&%/ %&%%&&@@\ V /@@' `88\8 `/88'
  `&%\ ` /%&'    |.|        \ '|8'
      |o|        | |         | |
      |.|        | |         | |
   \\/ ._\//_/__/  ,\_//__\\/.  \_//__/_
"""

SPROUT_FRAMES = [
    # Frame 0: Seed in soil
    """
    
    
    
     .·:·. (•)
    ═══════════
    """,
    # Frame 1: Little crack & root
    """
    
    
        |
     .·:🌱:·.
    ═══════════
    """,
    # Frame 2: Sprout rising
    """
    
        ,
       /|
      / |
    ═══════════
    """,
    # Frame 3: Leaves unfolding
    """
       \`.
        \ `-
      __..-'
        ||
    ═══════════
    """,
    # Frame 4: Dual lush leaves
    """
       \`.  _.-'|
        \ `-    /
      __..-'.  /
         ||  /
    ═══════════
    """
]

FALLING_LEAVES = [
    "  🍃  ",
    "   🌿 ",
    " 🍂   ",
    "    🌱",
    "  🍃  "
]

def get_welcome_banner(version: str, model_name: str, provider_name: str, cwd_path: str) -> str:
    """Generates the full styled botanical welcome screen."""
    styled_banner = green_gradient(LEAFCODE_BANNER)
    
    tagline = f"{Colors.EMERALD}🍃 The Botanical AI Coding Terminal{Colors.RESET} {Colors.GRAY}•{Colors.RESET} {Colors.MINT}v{version}{Colors.RESET}"
    
    meta_box = f"""
{Colors.MINT}● Provider:{Colors.RESET} {Colors.WHITE}{provider_name}{Colors.RESET}   {Colors.MINT}● Active Model:{Colors.RESET} {Colors.LIME}{model_name}{Colors.RESET}
{Colors.MINT}● Workspace:{Colors.RESET} {Colors.GRAY}{cwd_path}{Colors.RESET}
{Colors.DARK_GRAY}Type {Colors.LEAF_GLOW}/help{Colors.DARK_GRAY} for slash commands, {Colors.LEAF_GLOW}/models{Colors.DARK_GRAY} to switch, or start typing below.{Colors.RESET}
"""
    divider = f"{Colors.FOREST}─" * 68 + f"{Colors.RESET}"
    
    return f"{styled_banner}\n{tagline}\n{divider}{meta_box}{divider}"

def get_bonsai_header() -> str:
    """Returns a colorized miniature bonsai tree."""
    return f"{Colors.EMERALD}{BONSAI_TREE}{Colors.RESET}"
