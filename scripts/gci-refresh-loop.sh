#!/usr/bin/env bash
# Run live GCI refresh every 6 hours (override with INTELLENS_REFRESH_HOURS).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export INTELLENS_REFRESH_HOURS="${INTELLENS_REFRESH_HOURS:-6}"
export INTELLENS_CRAWL_LIVE="${INTELLENS_CRAWL_LIVE:-1}"
exec "$ROOT/scripts/gci-refresh.sh" --loop
