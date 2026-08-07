#!/usr/bin/env bash
# Refresh NSE + BSE equity master JSON under backend/app/data/listings/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/backend/app/data/listings"
mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Fetching NSE EQUITY_L.csv…"
curl -fsSL -A 'Mozilla/5.0' \
  -o "$TMP/nse.csv" \
  'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv'

echo "Fetching BSE equity list…"
curl -fsSL -A 'Mozilla/5.0' -H 'Referer: https://www.bseindia.com/' \
  -o "$TMP/bse.json" \
  'https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active'

cd "$ROOT/backend"
export PYTHONPATH="${PYTHONPATH:-}:$ROOT/backend"
python3 << PY
import csv, json
from pathlib import Path
tmp = Path("$TMP")
out = Path("$OUT")

nse = []
with (tmp / "nse.csv").open(newline="", encoding="utf-8", errors="replace") as f:
    for row in csv.DictReader(f):
        keys = {k.strip(): (v.strip() if isinstance(v, str) else v) for k, v in row.items() if k}
        sym = keys.get("SYMBOL") or ""
        series = (keys.get("SERIES") or "").strip()
        if not sym or series not in ("EQ", "BE", "SM"):
            continue
        nse.append({
            "symbol": sym,
            "name": keys.get("NAME OF COMPANY") or "",
            "series": series,
            "isin": keys.get("ISIN NUMBER") or "",
        })
(out / "nse_equity.json").write_text(json.dumps({
    "source": "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv",
    "count": len(nse),
    "rows": nse,
}, separators=(",", ":")))

raw = json.loads((tmp / "bse.json").read_text())
bse, seen = [], set()
for row in raw:
    code = str(row.get("SCRIP_CD") or "").strip()
    if not code or code in seen:
        continue
    status = (row.get("Status") or "").strip().lower()
    if status and status != "active":
        continue
    seg = (row.get("Segment") or "").strip().lower()
    if seg and seg != "equity":
        continue
    seen.add(code)
    bse.append({
        "scrip_code": code,
        "symbol": (row.get("scrip_id") or "").strip(),
        "name": (row.get("Issuer_Name") or row.get("Scrip_Name") or "").strip(),
        "isin": (row.get("ISIN_NUMBER") or "").strip(),
        "group": (row.get("GROUP") or "").strip(),
    })
(out / "bse_equity.json").write_text(json.dumps({
    "source": "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w",
    "count": len(bse),
    "rows": bse,
}, separators=(",", ":")))
print(f"Wrote NSE={len(nse)} BSE={len(bse)} → {out}")
PY

echo "Done. Restart API (or clear india_listings caches) to pick up new files."
