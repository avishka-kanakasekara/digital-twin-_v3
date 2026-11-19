#!/bin/zsh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"

# Drop Cursor/agent loopback proxies
unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
export NO_PROXY='*'

# Free port 8000
if lsof -tiTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:8000 -sTCP:LISTEN | xargs kill -9 || true
  sleep 1
fi

cd "$BACKEND"
source "$BACKEND/venv/bin/activate"
echo "Starting backend on http://127.0.0.1:8000 ..."
exec uvicorn app.main:app --host 127.0.0.1 --port 8000
