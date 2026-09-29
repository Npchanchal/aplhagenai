#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "== Unit + functional (pytest) =="
cd "$ROOT/backend"
python3 -m pip install -q -r requirements.txt
PYTHONPATH=. python3 -m pytest -q

echo "== Frontend unit + build =="
cd "$ROOT/frontend"
npm install --silent
npm test
npm run build

echo "== Docker deploy =="
cd "$ROOT"
# E2E reloads pages rapidly from one IP; lift soft limits like backend/tests/conftest.py does.
RATE_LIMIT_RPM="${RATE_LIMIT_RPM:-5000}" AUTH_RATE_LIMIT_RPM="${AUTH_RATE_LIMIT_RPM:-500}" \
  docker compose up --build -d
echo "Waiting for health..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8000/health >/dev/null; then
    break
  fi
  sleep 2
done
curl -sf http://127.0.0.1:8000/health | grep -q ok

echo "== E2E (Playwright) =="
cd "$ROOT/e2e"
npm install --silent
npx playwright install chromium
E2E_BASE_URL=http://127.0.0.1:8080 npx playwright test

echo "All checks passed."
echo "UI:  http://127.0.0.1:8080"
echo "API: http://127.0.0.1:8000/docs"
