#!/usr/bin/env bash
# The Quiet Archive — app launcher (macOS / Linux).
#
#   ./start.sh                          # bundled demo catalogue
#   ./start.sh --project ../my-site     # your project
#   ./start.sh --url owner/repo         # clone, then run
#
# Needs Node 20+ (https://nodejs.org). Nothing else.

set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  cat >&2 <<'MSG'
Node.js is not installed (or not on PATH).

  macOS:  brew install node
  Debian: sudo apt install nodejs npm
  Other:  https://nodejs.org  (LTS 20 or newer)

Then run this script again. The app has no other dependencies for the
checks, the sitemap, and the citation exports. Social cards need `npm install`.
MSG
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node $(node -v) is too old; this app needs 20 or newer." >&2
  exit 1
fi

# Social cards are the only optional feature; install them on first run only if
# node_modules is absent and npm is available. Failure here is not fatal.
if [ ! -d node_modules ] && command -v npm >/dev/null 2>&1; then
  echo "Installing the optional social-card renderer (satori, resvg)…"
  npm install --no-audit --no-fund --loglevel=error || \
    echo "  (skipped: cards will be disabled. Everything else works.)"
fi

exec node bin/quiet-archive.mjs "$@"
