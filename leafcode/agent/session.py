"""
LeafCode Session State & History Persistence
=============================================
Stores and restores multi-turn conversation sessions to disk in ~/.leafcode/sessions/.
"""

import os
import json
import time
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from leafcode.config import SESSIONS_DIR

class SessionManager:
    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or time.strftime("%Y%m%d_%H%M%S_") + str(uuid.uuid4())[:6]
        self.file_path = SESSIONS_DIR / f"{self.session_id}.json"
        self.messages: List[Dict[str, Any]] = []
        self.created_at = time.time()
        self.updated_at = time.time()

    def add_message(self, role: str, content: Any, **kwargs):
        msg = {"role": role, "content": content, **kwargs}
        self.messages.append(msg)
        self.updated_at = time.time()
        self.save()

    def save(self):
        SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
        data = {
            "session_id": self.session_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "messages": self.messages
        }
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load(self, session_id: str) -> bool:
        target = SESSIONS_DIR / f"{session_id}.json"
        if not target.exists():
            return False
        try:
            with open(target, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.session_id = data.get("session_id", session_id)
                self.created_at = data.get("created_at", time.time())
                self.updated_at = data.get("updated_at", time.time())
                self.messages = data.get("messages", [])
                self.file_path = target
            return True
        except Exception:
            return False

    @staticmethod
    def list_sessions() -> List[Dict[str, Any]]:
        SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
        results = []
        for file in sorted(SESSIONS_DIR.glob("*.json"), key=os.path.getmtime, reverse=True):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    results.append({
                        "id": data.get("session_id", file.stem),
                        "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(data.get("updated_at", 0))),
                        "message_count": len(data.get("messages", []))
                    })
            except Exception:
                continue
        return results

    def export_markdown(self) -> str:
        md = [f"# LeafCode Session Export ({self.session_id})\n"]
        for m in self.messages:
            role = m.get("role", "user").capitalize()
            content = m.get("content", "")
            md.append(f"### 🍃 {role}\n\n{content}\n")
        return "\n".join(md)
