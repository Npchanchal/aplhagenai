"""Phase 6 — street consensus import store."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

_PATH = Path(__file__).with_name("consensus.json")
_DATA: Optional[Dict[str, Any]] = None


def _load() -> Dict[str, Any]:
    global _DATA
    if _DATA is None:
        if _PATH.exists():
            _DATA = json.loads(_PATH.read_text())
        else:
            _DATA = {"rows": []}
    return _DATA


def save() -> None:
    _PATH.write_text(json.dumps(_load(), indent=2))


def import_rows(rows: List[Dict[str, Any]]) -> int:
    """Upsert by (company_id, period, metric) — last write wins."""
    store = _load()
    existing = store.setdefault("rows", [])
    index = {
        (r.get("company_id"), r.get("period"), r.get("metric")): i
        for i, r in enumerate(existing)
    }
    n = 0
    for r in rows:
        if not r.get("company_id") or not r.get("period") or not r.get("metric"):
            continue
        if r.get("street_consensus") is None:
            continue
        row = {
            "company_id": r["company_id"],
            "period": r["period"],
            "metric": r["metric"],
            "street_consensus": float(r["street_consensus"]),
            "as_of": r.get("as_of") or "imported",
            "source": r.get("source") or "import",
        }
        key = (row["company_id"], row["period"], row["metric"])
        if key in index:
            existing[index[key]] = row
        else:
            index[key] = len(existing)
            existing.append(row)
        n += 1
    save()
    return n


def stats() -> Dict[str, Any]:
    rows = _load().get("rows") or []
    companies = {r.get("company_id") for r in rows if r.get("company_id")}
    return {"row_count": len(rows), "company_count": len(companies)}


def get_for_company(company_id: str) -> List[Dict[str, Any]]:
    return [r for r in _load()["rows"] if r["company_id"] == company_id]


def lookup(company_id: str, period: str, metric: str) -> Optional[float]:
    for r in get_for_company(company_id):
        if r["period"] == period and r["metric"] == metric:
            return float(r["street_consensus"])
    return None
