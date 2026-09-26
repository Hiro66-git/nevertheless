# 🍃 LeafCode

> **The Intelligent Botanical AI Terminal Assistant CLI**  
> *Autonomous coding agent with multi-provider AI model routing, rich green botanical terminal aesthetics, and zero external runtime dependencies.*

[![PyPI Version](https://img.shields.io/badge/pypi-v0.1.0-2ecc71.svg?style=flat-square)](https://pypi.org/project/leafcode/)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-55efc4.svg?style=flat-square)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-a8e6cf.svg?style=flat-square)](LICENSE)
[![OS: Linux | macOS | Windows](https://img.shields.io/badge/platform-cross--platform-16a085.svg?style=flat-square)](https://github.com/Hiro66-git/nevertheless)

```text
  _       ______          ______ _____ ____  _____  ______ 
 | |     |  ____|   /\   |  ____/ ____/ __ \|  __ \|  ____|
 | |     | |__     /  \  | |__ | |   | |  | | |  | | |__   
 | |     |  __|   / /\ \ |  __|| |   | |  | | |  | |  __|  
 | |____ | |____ / ____ \| |   | |___| |__| | |__| | |____ 
 |______||______/_/    \_\_|    \_____\____/|_____/|______|

 🍃 The Botanical AI Coding Terminal • v0.1.0
 ──────────────────────────────────────────────────────────────
 ● Provider: GROQ          ● Active Model: llama-3.3-70b-versatile
 ● Workspace: /my-project
 ──────────────────────────────────────────────────────────────
```

---

## 🌿 Highlights

- **Multi-Provider AI Engine with Free Models Support**:
  - ⚡ **Groq** (Ultra-fast free tier: `llama-3.3-70b-versatile`, `deepseek-r1-distill-llama-70b`, `llama-3.1-8b-instant`)
  - 🪐 **Google Gemini** (Free tier available: `gemini-2.0-flash`, `gemini-1.5-pro` with 1M–2M context)
  - 🦙 **Ollama Local AI** (100% free & offline: `ollama/llama3.2`, `ollama/deepseek-r1`, `ollama/qwen2.5-coder`)
  - 🌐 **OpenRouter** (Free community models: `deepseek/deepseek-r1:free`, `meta-llama/llama-3.3-70b-instruct:free`)
  - 🧠 **Anthropic Claude** (`claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-5-haiku`)
  - 🤖 **OpenAI** (`gpt-4o`, `gpt-4o-mini`, `o3-mini`)
  - 💨 **Mistral AI** (`codestral-latest`)
  - 🍃 **LeafCode Offline Simulator** (Works 100% out-of-the-box with **zero API keys required**)

- **Autonomous Agent Tool Execution**:
  - 📄 **File Operations**: `read_file` (with line slicing), `write_file`, `edit_file` (fuzzy code patching), `list_dir`
  - 🔍 **Search & Discovery**: `search_code` (high-speed regex/keyword grep), `find_files` (glob matching)
  - 💻 **Safe Shell Runner**: `run_command` with interactive user confirmation or `-y` auto-confirm
  - 🌿 **Git Integration**: `git_status`, `git_diff`, `git_log`, `git_commit`
  - 🌐 **Web Access**: `fetch_url` (extracts plain text & markdown from documentation)

- **Aesthetic Botanical Terminal Experience**:
  - Forest Emerald, Mint, Lime, Sage, and Jade ANSI truecolor gradients
  - Sprouting seedling boot animations and pulsing leaf spinners
  - Terminal Markdown rendering with syntax highlighting across Python, JS/TS, Rust, Go, C++, HTML/CSS, Shell, JSON, and YAML
  - Colorized unified diff viewer with emerald additions and rose deletions

- **Zero Heavy Dependencies**:
  - Built strictly using pure Python standard library (`urllib`, `json`, `subprocess`, `difflib`, `argparse`, `pathlib`)
  - Ultra-fast startup (<20ms) and lightweight memory footprint (<15MB)
  - Works natively on **Linux**, **macOS**, and **Windows**.

---

## 🚀 Quick Start

### Installation

Install via PyPI:

```bash
pip install leafcode
```

Or via `pipx` for isolated CLI usage:

```bash
pipx install leafcode
```

Or install locally from source:

```bash
git clone https://github.com/Hiro66-git/nevertheless.git
cd nevertheless
pip install -e .
```

### Launch Interactive Session

```bash
leafcode
```

### One-Shot Command Execution

```bash
# Ask a quick coding question
leafcode "How do I implement a LRU cache with threading lock in Python?"

# Fix a bug in a file directly
leafcode "Find all occurrences of deprecated API in src/ and update them to v2"

# Run with auto-confirmation for tools
leafcode -y "Run pytest and fix any failing unit tests"

# Use a specific provider and model
leafcode -p gemini -m gemini-2.0-flash "Audit this project structure"
```

---

## 🔑 Free Tier API Configuration

LeafCode is pre-configured to work out-of-the-box with free models. You can configure your favorite provider in seconds:

### Option 1: Via LeafCode Terminal (`/config`)

Launch `leafcode` and type:
```text
/config set groq gsk_your_groq_api_key_here
/config set gemini AIzaSyYourGeminiKeyHere
/config set openrouter sk-or-v1-your_openrouter_key
```

### Option 2: Via Environment Variables

Add to your `~/.bashrc` or `~/.zshrc`:
```bash
# Groq (Free fast inference)
export GROQ_API_KEY="gsk_..."

# Google Gemini (Free tier)
export GEMINI_API_KEY="AIzaSy..."

# OpenRouter (Free community models)
export OPENROUTER_API_KEY="sk-or-v1-..."

# Anthropic / OpenAI / Mistral
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-proj-..."
export MISTRAL_API_KEY="..."
```

### Option 3: Local 100% Free Offline (Ollama)

1. Start your local Ollama daemon: `ollama run llama3.2`
2. In LeafCode, simply run: `/provider ollama`

---

## 🎮 Interactive Slash Commands

| Command | Description |
|---|---|
| `/help` | Show interactive guide & hotkeys |
| `/models` | Display catalog of supported models (Free & Frontier) |
| `/provider <name>` | Switch active provider (`groq`, `gemini`, `ollama`, `openrouter`, `openai`, `anthropic`, `mock`) |
| `/model <name>` | Switch active model (`llama-3.3-70b-versatile`, `gemini-2.0-flash`, `gpt-4o`, etc.) |
| `/config` | View active settings and API keys status |
| `/config set <provider> <key>` | Save an API key securely to `~/.leafcode/config.json` |
| `/clear` | Clear the current conversation context memory |
| `/sessions` | List saved conversation sessions |
| `/export` | Export the current session transcript to Markdown |
| `/bonsai` | Display colorized ASCII botanical bonsai artwork |
| `/exit` | Exit the LeafCode session |

---

## 🛠️ CLI Options

```text
usage: leafcode [-h] [-p PROVIDER] [-m MODEL] [-y] [--models] [--config] [--tree] [-v] [prompt ...]

🍃 LeafCode — The Botanical AI Coding Terminal Assistant

positional arguments:
  prompt                Direct prompt to execute in one-shot mode.

options:
  -h, --help            show this help message and exit
  -p PROVIDER, --provider PROVIDER
                        Specify AI provider (groq, gemini, ollama, openrouter, openai, anthropic, mock)
  -m MODEL, --model MODEL
                        Specify active model name
  -y, --yes             Auto-confirm all tool executions without prompting
  --models              List all supported models and exit
  --config              Show active configuration and exit
  --tree                Display botanical ASCII art
  -v, --version         show program's version number and exit
```

---

## 🧪 Testing

Run the full automated test suite:

```bash
python3 run_tests.py
```

All 25 test cases run across config, providers, tools, agent ReAct loop, terminal UI, and CLI argument parsing.

---

## 📜 License

MIT License © 2026 [Hiro66-git](https://github.com/Hiro66-git) & LeafCode Contributors.
