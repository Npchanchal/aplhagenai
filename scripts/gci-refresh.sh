#!/usr/bin/env bash
# One-shot or looping live GCI refresh.
# Usage:
#   ./scripts/gci-refresh.sh           # once, live crawl
#   ./scripts/gci-refresh.sh --loop    # every INTELLENS_REFRESH_HOURS (default 6)
#   ./scripts/gci-refresh.sh --catalog # once, no live HTTP
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
elif [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -d .venv ]]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

export PYTHONPATH="${PYTHONPATH:-}:$ROOT/backend"
export INTELLENS_REFRESH_HOURS="${INTELLENS_REFRESH_HOURS:-6}"
export INTELLENS_CRAWL_LIVE="${INTELLENS_CRAWL_LIVE:-1}"

LIMIT="${CRAWL_LIMIT:-30}"
ARGS=(--limit "$LIMIT")
MODE_LIVE=1
LOOP=0
for arg in "$@"; do
  case "$arg" in
    --loop) LOOP=1 ;;
    --catalog) MODE_LIVE=0 ;;
    --live) MODE_LIVE=1 ;;
    --no-extract) ARGS+=(--no-extract) ;;
    --no-fmp) ARGS+=(--no-fmp) ;;
  esac
done

if [[ "$MODE_LIVE" == "1" ]]; then
  ARGS+=(--live)
else
  ARGS+=(--catalog)
fi
[[ "$LOOP" == "1" ]] && ARGS+=(--loop)

python -m app.jobs.gci_refresh "${ARGS[@]}"
