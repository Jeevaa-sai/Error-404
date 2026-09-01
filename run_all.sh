#!/usr/bin/env bash
# macOS / Linux equivalent of run_all.bat.
set -euo pipefail
cd "$(dirname "$0")"

command -v python3 >/dev/null || { echo "[X] python3 not found. Install Python 3.10+."; exit 1; }
python3 -c "import fastapi, uvicorn" 2>/dev/null || {
  echo "[X] Backend dependencies missing. Run: python3 -m pip install -r blastapi/api/requirements.txt"; exit 1; }
[ -d frontend/node_modules ] || { echo "[X] Frontend dependencies missing. Run: cd frontend && npm install"; exit 1; }

LANIP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || echo localhost)

( cd blastapi && python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 ) &
BACKEND=$!
( cd frontend && npm run dev -- --host 0.0.0.0 ) &
FRONTEND=$!

trap 'kill $BACKEND $FRONTEND 2>/dev/null' EXIT INT TERM

cat <<EOF

Both services are starting!

  Frontend : http://localhost:5173      | http://$LANIP:5173
  Backend  : http://localhost:8000      | http://$LANIP:8000
  API docs : http://localhost:8000/docs | http://$LANIP:8000/docs

Press Ctrl+C to stop both.
EOF

wait
