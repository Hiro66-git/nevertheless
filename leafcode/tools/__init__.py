"""
LeafCode Tools Package
======================
Automatically registers file, search, shell, git, and web tools into the global registry.
"""

from leafcode.tools.registry import registry, tool
import leafcode.tools.file_tools
import leafcode.tools.search_tools
import leafcode.tools.bash_tools
import leafcode.tools.git_tools
import leafcode.tools.web_tools

__all__ = ["registry", "tool"]
