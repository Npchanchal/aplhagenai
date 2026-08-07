#!/usr/bin/env bash
# Sensex IR crawl — schedule via cron/EventBridge, e.g. daily 02:30 IST.
# Default: catalog mode (no live HTTP). Pass --live for allowlisted fetches.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

LIMIT="${CRAWL_LIMIT:-30}"
LIVE_FLAG=()
DRY=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --live) LIVE_FLAG=(--live); shift ;;
    --dry-run) DRY=(--dry-run); shift ;;
    --limit) LIMIT="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -d .venv ]]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

export PYTHONPATH="${PYTHONPATH:-}:$ROOT/backend"
python -m app.jobs.sensex_ir_crawl --limit "$LIMIT" "${DRY[@]}" "${LIVE_FLAG[@]}"
