"""Org-scoped habit counters — citations copied and dossier opens. Does not mutate GCI."""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.data.seed import get_data, save_data


def _row(org_id: str) -> Dict[str, Any]:
    data = get_data()
    store = data.setdefault("org_activity", {})
    return store.setdefault(str(org_id), {"cite_copies": 0, "dossier_opens": 0})


def bump(org_id: Optional[str], field: str, n: int = 1) -> Dict[str, int]:
    if not org_id or field not in ("cite_copies", "dossier_opens"):
        return counts(org_id)
    row = _row(str(org_id))
    row[field] = int(row.get(field) or 0) + n
    save_data()
    return counts(org_id)


def counts(org_id: Optional[str]) -> Dict[str, int]:
    if not org_id:
        return {"cite_copies": 0, "dossier_opens": 0}
    row = (get_data().get("org_activity") or {}).get(str(org_id)) or {}
    return {
        "cite_copies": int(row.get("cite_copies") or 0),
        "dossier_opens": int(row.get("dossier_opens") or 0),
    }
