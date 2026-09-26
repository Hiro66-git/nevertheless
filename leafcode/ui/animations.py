"""
LeafCode Terminal Animations & Live Visualizers
===============================================
Smooth, non-intrusive ASCII spinners, botanical growth transitions,
and stream throttlers for a delightful developer experience.
"""

import sys
import time
import threading
from typing import Optional, Callable
from leafcode.ui.theme import Colors, style
from leafcode.ui.ascii_art import SPROUT_FRAMES

class LeafSpinner:
    """A botanical live spinner that pulses leaves while an AI query or tool runs."""
    
    FRAMES = [
        "🌱   ",
        " 🌿  ",
        "  🍃 ",
        "   🍂",
        "  🍃 ",
        " 🌿  "
    ]
    
    DOT_FRAMES = [
        "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"
    ]
    
    def __init__(self, message: str = "Thinking..."):
        self.message = message
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        
    def _spin(self):
        idx = 0
        while self.is_running:
            frame = self.FRAMES[idx % len(self.FRAMES)]
            dot = self.DOT_FRAMES[idx % len(self.DOT_FRAMES)]
            
            output = f"\r{Colors.EMERALD}{dot} {frame} {Colors.RESET}{Colors.MINT}{self.message}{Colors.RESET} "
            sys.stdout.write(output)
            sys.stdout.flush()
            time.sleep(0.08)
            idx += 1
            
        # Clear line on stop
        sys.stdout.write("\r" + " " * (len(self.message) + 20) + "\r")
        sys.stdout.flush()
        
    def start(self):
        if not sys.stdout.isatty():
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._spin, daemon=True)
        self.thread.start()
        
    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=0.5)

def play_sprout_animation(duration_ms: int = 400):
    """Plays a mini sprouting ASCII animation on initial launch."""
    if not sys.stdout.isatty():
        return
    
    delay = (duration_ms / 1000.0) / len(SPROUT_FRAMES)
    for frame in SPROUT_FRAMES:
        lines = frame.strip().split("\n")
        # Print frame in green
        sys.stdout.write("\033[2K\r")
        sys.stdout.write(f"{Colors.EMERALD}{frame}{Colors.RESET}\n")
        sys.stdout.flush()
        time.sleep(delay)
        # Move cursor up to overwrite
        sys.stdout.write(f"\033[{len(lines) + 1}A")
        
    # Clear the animation space cleanly
    last_frame_lines = len(SPROUT_FRAMES[-1].strip().split("\n"))
    sys.stdout.write(f"\033[{last_frame_lines + 1}B\r\033[K")
    sys.stdout.flush()

def type_writer(text: str, delay: float = 0.015, color: str = Colors.WHITE):
    """Simulates typewriter effect for dramatic assistant messages."""
    for char in text:
        sys.stdout.write(f"{color}{char}{Colors.RESET}")
        sys.stdout.flush()
        time.sleep(delay)
    sys.stdout.write("\n")
    sys.stdout.flush()
