"""
LeafCode Tool Registry & OpenAI Schema Generator
================================================
Registers Python functions as callable AI tools with automated JSON schema extraction.
"""

import inspect
from typing import Callable, Dict, Any, List, Optional

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._schemas: List[Dict[str, Any]] = []

    def register(self, name: Optional[str] = None, description: Optional[str] = None):
        """Decorator to register a function as an LLM tool."""
        def decorator(func: Callable):
            tool_name = name or func.__name__
            tool_desc = description or (func.__doc__ or "").strip().split("\n")[0]
            
            sig = inspect.signature(func)
            properties: Dict[str, Any] = {}
            required: List[str] = []
            
            type_map = {
                str: "string",
                int: "integer",
                float: "number",
                bool: "boolean",
                list: "array",
                dict: "object"
            }
            
            for param_name, param in sig.parameters.items():
                if param_name in ("self", "cls"):
                    continue
                param_type = "string"
                if param.annotation != inspect.Parameter.empty:
                    param_type = type_map.get(param.annotation, "string")
                
                properties[param_name] = {
                    "type": param_type,
                    "description": f"Parameter {param_name}"
                }
                if param.default == inspect.Parameter.empty:
                    required.append(param_name)
                    
            schema = {
                "type": "function",
                "function": {
                    "name": tool_name,
                    "description": tool_desc,
                    "parameters": {
                        "type": "object",
                        "properties": properties,
                        "required": required
                    }
                }
            }
            
            self._tools[tool_name] = func
            self._schemas.append(schema)
            return func
        return decorator

    def get_schemas(self) -> List[Dict[str, Any]]:
        return self._schemas

    def execute(self, name: str, arguments: Dict[str, Any]) -> str:
        if name not in self._tools:
            return f"Error: Unknown tool '{name}'."
        try:
            func = self._tools[name]
            result = func(**arguments)
            return str(result)
        except Exception as e:
            return f"Error executing tool '{name}': {str(e)}"

# Global tool registry
registry = ToolRegistry()
tool = registry.register
