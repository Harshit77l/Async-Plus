#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Start backend API on port 3001
npx tsx backend/src/server.ts &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Start frontend on the exposed preview port
npx vite --port 3000 --host 0.0.0.0
