#!/usr/bin/env bash
# Enqueue companies from a labeling batch CSV into the Desk labeling queue.
# Usage: ./scripts/labeling-enqueue-batch.sh <batch.csv> [API_BASE] [API_KEY]
set -euo pipefail

CSV="${1:?batch CSV path required}"
API="${2:-${INTELLENS_PUBLIC_URL:-http://127.0.0.1:8000}}"
KEY="${3:-${INTELLENS_API_KEY:-intellens-demo}}"
API="${API%/}"

if [[ ! -f "$CSV" ]]; then
  echo "FAIL: file not found: $CSV" >&2
  exit 1
fi

echo "=== Enqueue labeling batch ($CSV) → $API ==="

python3 - "$CSV" "$API" "$KEY" <<'PY'
import csv, json, sys, urllib.request

csv_path, api, key = sys.argv[1:4]

def post(path, body):
    req = urllib.request.Request(
        api + path,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "X-API-Key": key},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

created = skipped = failed = 0
with open(csv_path, newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        cid = (row.get("company_id") or "").strip()
        if not cid:
            continue
        note = f"{row.get('wave','?')}: {row.get('ticker','')} — {row.get('notes','')}".strip()
        try:
            post("/api/labeling/queue", {
                "company_id": cid,
                "priority": "high",
                "note": note,
            })
            created += 1
            print(f"  + {row.get('ticker', cid)}")
        except Exception as e:
            msg = str(e)
            if "409" in msg or "already" in msg.lower():
                skipped += 1
                print(f"  ~ skip {row.get('ticker', cid)}")
            else:
                failed += 1
                print(f"  ! fail {row.get('ticker', cid)}: {e}", file=sys.stderr)

print(f"\nDone: enqueued={created} skipped={failed and skipped or skipped} failed={failed}")
PY
