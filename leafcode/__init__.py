"""
🍃 LeafCode — Intelligent Botanical AI Terminal Assistant CLI
============================================================
An OS-independent, high-performance, aesthetically pleasing AI terminal assistant
with multi-provider model integration, autonomous tool use, and rich terminal experiences.
"""

__version__ = "0.1.0"
__author__ = "LeafCode Contributors"
__license__ = "MIT"

def main():
    from leafcode.cli import main as cli_main
    return cli_main()

__all__ = ["main", "__version__"]
