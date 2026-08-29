#!/usr/bin/env bash
# Desk corpus ops: refresh crawl/extract + show pending Accept/Reject queue.
set -euo pipefail
API="${1:-${INTELLENS_PUBLIC_URL:-http://127.0.0.1:8000}}"
KEY="${2:-${INTELLENS_API_KEY:-intellens-demo}}"
API="${API%/}"

echo "=== Corpus refresh ($API) ==="
curl -sS --max-time 120 -X POST \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  "$API/api/ingest/refresh" | python3 -m json.tool | head -40

echo
echo "=== Pending depth / corpus coverage ==="
curl -sS --max-time 30 -H "X-API-Key: $KEY" \
  "$API/api/ops/corpus-coverage" | python3 -m json.tool | head -60

echo
echo "=== Pending documents (Desk Accept/Reject) ==="
curl -sS --max-time 30 -H "X-API-Key: $KEY" \
  "$API/api/ops/pending-depth" | python3 -m json.tool | head -80

echo
echo "Desk: /desk → Corpus tab → Accept/Reject pending extracts before citing externally."
