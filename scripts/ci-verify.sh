#!/usr/bin/env bash
# Non-interactive CI verification — same gates as verify-all.sh, but:
#   - emits JUnit XML (backend/reports/pytest.xml, e2e/reports/junit.xml)
#   - always tears down docker compose, even on failure
# Used by the Jenkinsfile stages; run locally to reproduce CI exactly:
#   CI=true ./scripts/ci-verify.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CI="${CI:-true}"

cleanup() {
  cd "$ROOT"
  docker compose down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "== Unit + functional (pytest, junit) =="
cd "$ROOT/backend"
python3 -m pip install -q -r requirements.txt
mkdir -p reports
PYTHONPATH=. python3 -m pytest -q --junitxml=reports/pytest.xml

echo "== Frontend unit + build =="
cd "$ROOT/frontend"
if [ -f package-lock.json ]; then npm ci --silent; else npm install --silent; fi
npm test
npm run build

echo "== Docker deploy =="
cd "$ROOT"
docker compose up --build -d
echo "Waiting for health..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8000/health >/dev/null; then
    break
  fi
  sleep 2
done
curl -sf http://127.0.0.1:8000/health | grep -q ok

echo "== E2E (Playwright, junit) =="
cd "$ROOT/e2e"
if [ -f package-lock.json ]; then npm ci --silent; else npm install --silent; fi
npx playwright install chromium
mkdir -p reports
E2E_BASE_URL=http://127.0.0.1:8080 npx playwright test

echo "All CI checks passed."
echo "Reports: backend/reports/pytest.xml, e2e/reports/junit.xml"
