"""
LeafCode Botanical Theme & ANSI Color Palette Engine
====================================================
Provides an elegant green-tinted aesthetic with graceful color transitions,
badges, borders, and styled text formatting across all terminal environments.
"""

import os
import sys

# Detect color support
def supports_color() -> bool:
    if os.environ.get("NO_COLOR"):
        return False
    if not hasattr(sys.stdout, "isatty") or not sys.stdout.isatty():
        return False
    return True

COLOR_ENABLED = supports_color()

class Colors:
    RESET = "\033[0m" if COLOR_ENABLED else ""
    BOLD = "\033[1m" if COLOR_ENABLED else ""
    DIM = "\033[2m" if COLOR_ENABLED else ""
    ITALIC = "\033[3m" if COLOR_ENABLED else ""
    UNDERLINE = "\033[4m" if COLOR_ENABLED else ""
    
    # Botanical Green Shades (Truecolor & 256 Fallback)
    FOREST = "\033[38;2;34;139;34m" if COLOR_ENABLED else ""       # Deep Forest Green
    EMERALD = "\033[38;2;46;204;113m" if COLOR_ENABLED else ""     # Vibrant Emerald
    MINT = "\033[38;2;168;230;207m" if COLOR_ENABLED else ""       # Soft Mint
    LIME = "\033[38;2;166;227;161m" if COLOR_ENABLED else ""       # Radiant Lime
    JADE = "\033[38;2;0;168;107m" if COLOR_ENABLED else ""         # Sacred Jade
    SAGE = "\033[38;2;148;175;152m" if COLOR_ENABLED else ""       # Calming Sage
    MOSS = "\033[38;2;138;171;143m" if COLOR_ENABLED else ""       # Earthy Moss
    LEAF_GLOW = "\033[38;2;85;239;196m" if COLOR_ENABLED else ""   # Electric Aqua Leaf
    
    # Earth & Floral Accents
    WOOD_BROWN = "\033[38;2;184;115;51m" if COLOR_ENABLED else ""  # Cedar Wood
    AMBER = "\033[38;2;255;193;7m" if COLOR_ENABLED else ""        # Pollen Amber
    ROSE = "\033[38;2;255;118;117m" if COLOR_ENABLED else ""       # Petal Rose / Warning
    LOTUS = "\033[38;2;253;121;168m" if COLOR_ENABLED else ""      # Lotus Flower Pink
    
    # Monochromes
    WHITE = "\033[38;2;245;247;248m" if COLOR_ENABLED else ""
    GRAY = "\033[38;2;136;146;158m" if COLOR_ENABLED else ""
    DARK_GRAY = "\033[38;2;75;85;99m" if COLOR_ENABLED else ""
    BG_DARK_GREEN = "\033[48;2;20;38;25m" if COLOR_ENABLED else ""
    BG_MUTED = "\033[48;2;30;35;42m" if COLOR_ENABLED else ""

def style(text: str, *styles: str) -> str:
    """Applies styles to text and resets automatically."""
    if not COLOR_ENABLED or not styles:
        return text
    return "".join(styles) + text + Colors.RESET

def green_gradient(text: str) -> str:
    """Renders text with a smooth multi-hue green botanical gradient."""
    if not COLOR_ENABLED:
        return text
    
    colors = [
        (34, 139, 34),   # Forest
        (46, 204, 113),  # Emerald
        (85, 239, 196),  # Leaf Glow
        (166, 227, 161), # Lime
        (168, 230, 207), # Mint
    ]
    
    result = []
    n = len(text)
    if n == 0:
        return ""
    
    for i, char in enumerate(text):
        progress = i / max(n - 1, 1)
        segment = progress * (len(colors) - 1)
        idx = min(int(segment), len(colors) - 2)
        factor = segment - idx
        
        c1 = colors[idx]
        c2 = colors[idx + 1]
        r = int(c1[0] + (c2[0] - c1[0]) * factor)
        g = int(c1[1] + (c2[1] - c1[1]) * factor)
        b = int(c1[2] + (c2[2] - c1[2]) * factor)
        
        result.append(f"\033[38;2;{r};{g};{b}m{char}")
        
    result.append(Colors.RESET)
    return "".join(result)

def make_box(title: str, content: str, width: int = 70, border_color: str = Colors.EMERALD) -> str:
    """Renders a formatted box with rounded or double border."""
    lines = content.strip().split("\n")
    max_len = max([len(l) for l in lines] + [len(title) + 4, width - 4])
    box_w = max_len + 4
    
    top = f"{border_color}╭─ {Colors.BOLD}{Colors.WHITE}{title}{Colors.RESET}{border_color} " + "─" * (box_w - len(title) - 5) + f"╮{Colors.RESET}"
    bottom = f"{border_color}╰" + "─" * (box_w - 2) + f"╯{Colors.RESET}"
    
    body = []
    for l in lines:
        padding = " " * (box_w - 4 - len(l))
        body.append(f"{border_color}│{Colors.RESET}  {l}{padding}{border_color}│{Colors.RESET}")
        
    return "\n".join([top] + body + [bottom])

def make_badge(label: str, text: str, color: str = Colors.EMERALD) -> str:
    """Creates a stylized tag/badge: [LABEL: TEXT]."""
    return f"{color}[{Colors.BOLD}{label}{Colors.RESET}{color}:{Colors.RESET} {text}{color}]{Colors.RESET}"
