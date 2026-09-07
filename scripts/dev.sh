#!/usr/bin/env bash
# Start backend + frontend for local development
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🌱 Seeding database..."
cd "$ROOT/backend"
source venv/bin/activate
python -m scripts.seed_database

echo ""
echo "🚀 Starting backend on http://localhost:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd "$ROOT"
echo "🚀 Starting frontend on http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
