"""
LeafCode Web & Remote Tools
===========================
Allows the AI agent to fetch web documentation and query external resources.
"""

import urllib.request
import urllib.error
import re
from leafcode.tools.registry import tool

@tool(name="fetch_url", description="Fetches the raw text or markdown content of a web page URL.")
def fetch_url(url: str) -> str:
    if not (url.startswith("http://") or url.startswith("https://")):
        return "Error: URL must begin with http:// or https://"
        
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "LeafCode-AI/0.1.0 (+https://github.com/Hiro66-git/nevertheless)"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read().decode("utf-8", errors="replace")
            
            # Simple HTML tag stripper
            if "html" in content_type.lower():
                text = re.sub(r'<script.*?</script>', '', raw, flags=re.DOTALL)
                text = re.sub(r'<style.*?</style>', '', text, flags=re.DOTALL)
                text = re.sub(r'<[^>]+>', ' ', text)
                text = re.sub(r'\s+', ' ', text).strip()
                return text[:5000]
            return raw[:5000]
    except urllib.error.HTTPError as e:
        return f"HTTP error {e.code}: {e.reason}"
    except Exception as e:
        return f"Error fetching URL: {str(e)}"
