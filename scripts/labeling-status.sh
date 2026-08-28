#!/usr/bin/env bash
# Labeling wave status — local or remote API.
set -euo pipefail
API="${1:-${INTELLENS_PUBLIC_URL:-http://127.0.0.1:8000}}"
API="${API%/}"

echo "=== Labeling status ($API) ==="
if ! curl -sf --max-time 20 "$API/health" >/dev/null; then
  echo "FAIL: $API/health unreachable"
  exit 1
fi

python3 - <<PY
import json, urllib.request
api = "${API}"

def get(path):
    with urllib.request.urlopen(api + path, timeout=30) as r:
        return json.load(r)

meta = get("/api/meta")
legal = meta.get("legal") or {}
print(f"version: {meta.get('version')}")
print(f"hand_labeled: {meta.get('hand_labeled_count')}  demo_structured: {meta.get('demo_structured_count')}")
print(f"gci_listing_scored: {meta.get('gci_listing_scored_count')}  company_count: {meta.get('company_count')}")
print(f"counsel: {legal.get('counsel_status')}  retail_marketing: {legal.get('retail_marketing_allowed')}")

m = get("/api/universe/nifty/milestones")
print("\nNifty milestones:")
for row in m.get("milestones") or []:
    print(f"  {row['id']} [{row['status']}] {row['title']}")
c = m.get("counts") or {}
print(f"  counts: sensex_hl={c.get('sensex_hand_labeled')} nifty_hl={c.get('nifty_hand_labeled')} nifty_queued={c.get('nifty_queued')}/{c.get('nifty_extra_count')}")

cos = get("/api/companies")
if isinstance(cos, dict):
    cos = cos.get("companies") or cos.get("items") or []
demo = [x for x in cos if x.get("data_quality") == "demo_structured"]
print(f"\nP0 candidates (demo_structured): {len(demo)}")
for x in sorted(demo, key=lambda z: z.get("ticker") or ""):
    print(f"  {x.get('ticker'):12} {x.get('id'):16} GCI={x.get('gci_score')}")

print("\nSpreadsheet: docs/labeling/batch_p0_nifty_extra.csv")
print("Runbook:     docs/LABELING_RUNBOOK.md")
PY
