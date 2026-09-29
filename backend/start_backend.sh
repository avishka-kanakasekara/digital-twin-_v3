#!/bin/zsh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"

# Drop Cursor/agent loopback proxies
unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
export NO_PROXY='*'

# ODBC Driver 18 needs OpenSSL 3 (not Homebrew openssl@4)
OPENSSL3_LIB="/opt/homebrew/opt/openssl@3/lib"
if [[ -d "$OPENSSL3_LIB" ]]; then
  export DYLD_LIBRARY_PATH="$OPENSSL3_LIB${DYLD_LIBRARY_PATH:+:$DYLD_LIBRARY_PATH}"
  export DYLD_FALLBACK_LIBRARY_PATH="$OPENSSL3_LIB${DYLD_FALLBACK_LIBRARY_PATH:+:$DYLD_FALLBACK_LIBRARY_PATH}"
fi

# Free port 8000
if lsof -tiTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:8000 -sTCP:LISTEN | xargs kill -9 || true
  sleep 1
fi

cd "$BACKEND"
source "$BACKEND/venv/bin/activate"
echo "Starting backend on http://127.0.0.1:8000 ..."
# Avoid --reload: macOS SIP can strip DYLD_* from the reloader child and break ODBC SSL.
exec uvicorn app.main:app --host 127.0.0.1 --port 8000
