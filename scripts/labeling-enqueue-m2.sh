#!/usr/bin/env bash
# Enqueue all NIFTY_EXTRA names into the labeling queue (milestone M2 / P0).
set -euo pipefail
API="${1:-${INTELLENS_PUBLIC_URL:-http://127.0.0.1:8000}}"
KEY="${2:-${INTELLENS_API_KEY:-intellens-demo}}"
API="${API%/}"

echo "=== Enqueue Nifty M2 labeling ($API) ==="
curl -sS --max-time 60 -X POST \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  "$API/api/universe/nifty/enqueue-labeling" | python3 -m json.tool

echo
echo "Queue:"
curl -sS --max-time 30 -H "X-API-Key: $KEY" "$API/api/labeling/queue" | python3 -m json.tool | head -80
