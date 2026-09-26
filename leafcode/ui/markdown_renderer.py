"""
LeafCode Terminal Markdown & Code Syntax Highlighter
====================================================
Formats raw AI Markdown responses into gorgeous, styled terminal output
with syntax-colored code blocks, tables, bold/italic, lists, and quotes.
"""

import re
from leafcode.ui.theme import Colors, style

# Basic syntax highlighter without heavy dependencies
KEYWORDS_PYTHON = {"def", "class", "import", "from", "return", "if", "elif", "else", "for", "while", "try", "except", "with", "as", "in", "is", "not", "and", "or", "lambda", "yield", "async", "await", "None", "True", "False"}
KEYWORDS_JS = {"function", "const", "let", "var", "return", "if", "else", "for", "while", "import", "export", "from", "default", "class", "async", "await", "new", "this", "null", "undefined", "true", "false"}
KEYWORDS_RUST = {"fn", "let", "mut", "pub", "struct", "enum", "impl", "trait", "match", "if", "else", "for", "while", "loop", "return", "use", "mod", "crate", "self", "Self", "true", "false"}

def highlight_code_line(line: str, lang: str = "") -> str:
    """Applies fast lexical coloring to a line of source code."""
    # Comments
    if line.strip().startswith("#") or line.strip().startswith("//"):
        return f"{Colors.DARK_GRAY}{line}{Colors.RESET}"
    
    # Strings ("..." or '...')
    str_pattern = r'("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')'
    parts = re.split(str_pattern, line)
    
    colored_parts = []
    keywords = KEYWORDS_PYTHON if "py" in lang else (KEYWORDS_RUST if "rs" in lang else KEYWORDS_JS)
    
    for i, part in enumerate(parts):
        if i % 2 == 1:
            # String literal in gold/amber
            colored_parts.append(f"{Colors.AMBER}{part}{Colors.RESET}")
        else:
            # Word token replacement
            words = re.split(r'(\b\w+\b)', part)
            styled_words = []
            for w in words:
                if w in keywords:
                    styled_words.append(f"{Colors.LEAF_GLOW}{Colors.BOLD}{w}{Colors.RESET}")
                elif w.isdigit():
                    styled_words.append(f"{Colors.LOTUS}{w}{Colors.RESET}")
                else:
                    styled_words.append(w)
            colored_parts.append("".join(styled_words))
            
    return "".join(colored_parts)

def render_code_block(code: str, lang: str = "") -> str:
    """Wraps code in a polished botanical terminal container with line numbers."""
    lines = code.strip().split("\n")
    max_line_len = max([len(l) for l in lines] + [len(lang) + 12, 50])
    width = max_line_len + 10
    
    lang_tag = f" {Colors.LEAF_GLOW}{Colors.BOLD}{lang.upper() if lang else 'CODE'}{Colors.RESET} "
    top_bar = f"{Colors.FOREST}┌─{lang_tag}" + "─" * (width - len(lang or 'CODE') - 6) + f"┐{Colors.RESET}"
    bottom_bar = f"{Colors.FOREST}└" + "─" * (width - 2) + f"┘{Colors.RESET}"
    
    body = []
    for idx, l in enumerate(lines, 1):
        num_str = f"{Colors.DARK_GRAY}{idx:3d} │{Colors.RESET} "
        colored_code = highlight_code_line(l, lang)
        body.append(f"{Colors.FOREST}│{Colors.RESET} {num_str}{colored_code}")
        
    return "\n".join([top_bar] + body + [bottom_bar])

def render_markdown(text: str) -> str:
    """Renders a full Markdown document with styled headers, code blocks, lists, and inline formatting."""
    lines = text.split("\n")
    output = []
    in_code_block = False
    code_block_lang = ""
    code_block_lines = []
    
    for line in lines:
        # Code block fence
        if line.strip().startswith("```"):
            if not in_code_block:
                in_code_block = True
                code_block_lang = line.strip().lstrip("`").strip()
                code_block_lines = []
            else:
                in_code_block = False
                output.append(render_code_block("\n".join(code_block_lines), code_block_lang))
                code_block_lines = []
            continue
            
        if in_code_block:
            code_block_lines.append(line)
            continue
            
        # Headers
        if line.startswith("# "):
            output.append(f"\n{Colors.EMERALD}{Colors.BOLD}🌿 {line[2:]}{Colors.RESET}")
            output.append(f"{Colors.FOREST}" + "━" * (len(line) + 2) + f"{Colors.RESET}")
        elif line.startswith("## "):
            output.append(f"\n{Colors.MINT}{Colors.BOLD}🍃 {line[3:]}{Colors.RESET}")
        elif line.startswith("### "):
            output.append(f"{Colors.LIME}{Colors.BOLD}🌱 {line[4:]}{Colors.RESET}")
        elif line.startswith("> "):
            # Blockquote
            output.append(f"{Colors.JADE}▎ {Colors.ITALIC}{Colors.SAGE}{line[2:]}{Colors.RESET}")
        elif line.strip().startswith("- ") or line.strip().startswith("* "):
            # Bullet list
            indent = len(line) - len(line.lstrip())
            content = line.strip()[2:]
            output.append(" " * indent + f"{Colors.EMERALD}●{Colors.RESET} {format_inline(content)}")
        elif re.match(r'^\d+\.\s', line.strip()):
            # Numbered list
            m = re.match(r'^(\d+)\.\s(.*)$', line.strip())
            if m:
                num, content = m.groups()
                output.append(f"{Colors.MINT}{num}.{Colors.RESET} {format_inline(content)}")
            else:
                output.append(format_inline(line))
        else:
            output.append(format_inline(line))
            
    if in_code_block and code_block_lines:
        output.append(render_code_block("\n".join(code_block_lines), code_block_lang))
        
    return "\n".join(output)

def format_inline(text: str) -> str:
    """Formats inline `code`, **bold**, *italic*, and [links]."""
    # Inline code: `...`
    text = re.sub(r'`([^`]+)`', f"{Colors.MINT}\\1{Colors.RESET}", text)
    # Bold: **...**
    text = re.sub(r'\*\*([^*]+)\*\*', f"{Colors.BOLD}\\1{Colors.RESET}", text)
    # Italic: *...*
    text = re.sub(r'\*([^*]+)\*', f"{Colors.ITALIC}\\1{Colors.RESET}", text)
    return text
