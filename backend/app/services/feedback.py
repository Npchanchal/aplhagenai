"""Design-partner quality feedback — does not mutate GCI scores."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import HTTPException

from app.data.seed import get_data, save_data

KINDS = frozenset(
    {
        "wrong_band",
        "wrong_period",
        "wrong_label",
        "missing_source",
        "nps",
        "convert_intent",
    }
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _store() -> List[Dict[str, Any]]:
    return get_data().setdefault("partner_feedback", [])


def create(
    *,
    company_id: str,
    kind: str,
    comment: str = "",
    period: Optional[str] = None,
    metric: Optional[str] = None,
    nps: Optional[int] = None,
    actor: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    k = (kind or "").strip().lower()
    if k not in KINDS:
        raise HTTPException(status_code=400, detail=f"kind must be one of {sorted(KINDS)}")
    if not (company_id or "").strip() and k not in ("nps", "convert_intent"):
        raise HTTPException(status_code=400, detail="company_id required")
    actor = actor or {}
    row = {
        "id": f"fb_{uuid4().hex[:12]}",
        "company_id": (company_id or "").strip() or None,
        "period": period,
        "metric": metric,
        "kind": k,
        "comment": (comment or "").strip()[:2000],
        "nps": nps,
        "status": "open",
        "org_id": actor.get("org_id") or actor.get("org"),
        "user_id": actor.get("user_id"),
        "created_at": _now(),
    }
    _store().append(row)
    save_data()
    _touch_pilot_checklist(str(actor.get("org_id") or ""), k)
    if k in ("wrong_band", "wrong_period", "wrong_label", "missing_source") and row.get("company_id"):
        try:
            from app.services import labeling_queue as lq

            qitem = lq.enqueue(
                company_id=str(row["company_id"]),
                org_id=str(row.get("org_id") or "demo"),
                priority="high",
                note=(
                    f"Partner feedback {k}"
                    + (f" {row.get('period') or ''} {row.get('metric') or ''}".rstrip())
                    + (f": {row['comment'][:180]}" if row.get("comment") else "")
                ).strip(),
                requested_by=str(actor.get("user_id") or actor.get("key") or "feedback"),
            )
            row["queue_item_id"] = qitem.get("id")
            save_data()
        except Exception:
            pass
    return row


def list_feedback(
    *,
    org_id: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    rows = list(_store())
    if org_id:
        rows = [r for r in rows if r.get("org_id") == org_id]
    if status:
        rows = [r for r in rows if r.get("status") == status]
    return sorted(rows, key=lambda r: r.get("created_at") or "", reverse=True)


def set_status(item_id: str, status: str) -> Dict[str, Any]:
    if status not in ("open", "ack", "closed"):
        raise HTTPException(status_code=400, detail="status must be open|ack|closed")
    for row in _store():
        if row.get("id") == item_id:
            row["status"] = status
            row["updated_at"] = _now()
            save_data()
            return row
    raise HTTPException(status_code=404, detail="Feedback not found")


def counts_for_org(org_id: str) -> Dict[str, int]:
    rows = [r for r in _store() if r.get("org_id") == org_id]
    return {
        "total": len(rows),
        "open": sum(1 for r in rows if r.get("status") == "open"),
        "quality": sum(
            1
            for r in rows
            if r.get("kind") in ("wrong_band", "wrong_period", "wrong_label", "missing_source")
        ),
        "nps": sum(1 for r in rows if r.get("kind") == "nps"),
        "convert_intent": sum(1 for r in rows if r.get("kind") == "convert_intent"),
    }


def _touch_pilot_checklist(org_id: str, kind: str) -> None:
    if not org_id:
        return
    data = get_data()
    row = (data.get("pilot_checklists") or {}).get(org_id)
    if not row:
        return
    items = row.setdefault("items", {})
    if kind in ("wrong_band", "wrong_period", "wrong_label", "missing_source"):
        items["quality_feedback"] = True
    if kind == "convert_intent":
        items["convert_intent"] = True
        row["convert_intent"] = "yes"
    save_data()
