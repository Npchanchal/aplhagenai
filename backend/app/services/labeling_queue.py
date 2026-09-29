"""One-Stop labeling priority queue (process SLA + product backlog)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import HTTPException

from app.data.seed import get_data, save_data


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def list_queue(*, org_id: Optional[str] = None) -> List[Dict[str, Any]]:
    rows = list(get_data().get("labeling_queue") or [])
    if org_id:
        rows = [r for r in rows if r.get("org_id") == org_id]
    return sorted(rows, key=lambda r: (0 if r.get("priority") == "high" else 1, r.get("created_at") or ""))


def enqueue(
    *,
    company_id: str,
    org_id: str = "demo",
    priority: str = "normal",
    note: str = "",
    requested_by: str = "api",
    kind: str = "label",
    flag: Optional[str] = None,
) -> Dict[str, Any]:
    from app.services import repository

    try:
        detail = repository.get_company_gci(company_id)
        name = detail.name
        quality = detail.data_quality
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Unknown company: {company_id}") from e

    item = {
        "id": f"lq_{uuid4().hex[:10]}",
        "company_id": company_id,
        "company_name": name,
        "data_quality": quality,
        "org_id": org_id,
        "priority": "high" if priority == "high" else "normal",
        "note": note or "",
        "requested_by": requested_by,
        "status": "queued",
        "created_at": _now(),
        "kind": kind or "label",
        "flag": flag,
    }
    data = get_data()
    q = data.setdefault("labeling_queue", [])
    q.append(item)
    save_data()
    return item


def _open_suggestion(company_id: str, flag: str) -> bool:
    for row in list_queue():
        if (
            row.get("company_id") == company_id
            and row.get("flag") == flag
            and row.get("kind") == "audit_flag_suggestion"
            and row.get("status") in ("queued", "in_progress")
        ):
            return True
    return False


def enqueue_flag_suggestions(
    company_id: str,
    *,
    org_id: str = "demo",
    requested_by: str = "heuristic",
) -> List[Dict[str, Any]]:
    """Keyword heuristics → review queue only. Never applies a GCI deduction (W2.6)."""
    from app.data.seed import get_outcomes
    from app.services.guidance_flags import applied_audit_flags, suggest_audit_flags

    suggested = suggest_audit_flags(get_outcomes(company_id))
    applied = set(applied_audit_flags(company_id))
    created: List[Dict[str, Any]] = []
    for flag in suggested:
        if flag in applied or _open_suggestion(company_id, flag):
            continue
        created.append(
            enqueue(
                company_id=company_id,
                org_id=org_id,
                priority="high" if flag == "guidance_withdrawal" else "normal",
                note=(
                    f"Suggested audit flag `{flag}` (keyword heuristic). "
                    "Not applied to GCI until an analyst sets it with a source."
                ),
                requested_by=requested_by,
                kind="audit_flag_suggestion",
                flag=flag,
            )
        )
    return created


def update_status(item_id: str, status: str, *, org_id: Optional[str] = None) -> Dict[str, Any]:
    """Set item status. When ``org_id`` is given, items owned by other orgs are treated as missing."""
    allowed = {"queued", "in_progress", "done", "cancelled"}
    if status not in allowed:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(allowed)}")
    data = get_data()
    for row in data.get("labeling_queue") or []:
        if row.get("id") == item_id and (org_id is None or row.get("org_id") == org_id):
            row["status"] = status
            row["updated_at"] = _now()
            save_data()
            return row
    raise HTTPException(status_code=404, detail="Queue item not found")
