"""Inbound pilot evaluation requests — stored for admin review (no outbound email)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import HTTPException

from app.data.seed import get_data, save_data


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _store() -> List[Dict[str, Any]]:
    return get_data().setdefault("pilot_requests", [])


def create_request(
    *,
    name: str,
    email: str,
    firm: str,
    role: str = "",
    team_size: str = "",
    message: str = "",
) -> Dict[str, Any]:
    row = {
        "id": f"pr_{uuid4().hex[:12]}",
        "name": name.strip(),
        "email": email.strip(),
        "firm": firm.strip(),
        "role": role.strip(),
        "team_size": team_size.strip(),
        "message": message.strip()[:4000],
        "status": "pending",
        "org_id": None,
        "admin_note": "",
        "reviewed_by": None,
        "reviewed_at": None,
        "created_at": _now(),
    }
    _store().append(row)
    save_data()
    return row


def list_requests(*, status: Optional[str] = None) -> List[Dict[str, Any]]:
    rows = list(_store())
    if status:
        want = status.strip().lower()
        rows = [r for r in rows if (r.get("status") or "").lower() == want]
    return sorted(rows, key=lambda r: str(r.get("created_at") or ""), reverse=True)


def _find_request(request_id: str) -> Optional[Dict[str, Any]]:
    for row in _store():
        if row.get("id") == request_id:
            return row
    return None


def review_request(
    request_id: str,
    *,
    action: str,
    actor: Dict[str, Any],
    note: str = "",
) -> Dict[str, Any]:
    row = _find_request(request_id)
    if not row:
        raise HTTPException(status_code=404, detail="Pilot request not found")
    act = (action or "").strip().lower()
    if act not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be approve or reject")
    if row.get("status") != "pending":
        raise HTTPException(status_code=409, detail=f"Request already {row.get('status')}")

    reviewer = actor.get("email") or actor.get("name") or actor.get("user_id") or "admin"
    row["reviewed_by"] = reviewer
    row["reviewed_at"] = _now()
    row["admin_note"] = (note or "").strip()[:1000]

    if act == "reject":
        row["status"] = "rejected"
        save_data()
        return {"ok": True, "request": row}

    from app.services.pilot_checklist import provision_pilot_org

    org_name = row.get("firm") or row.get("name") or "Pilot Desk"
    provisioned = provision_pilot_org(
        name=str(org_name),
        owner_email=row.get("email") or None,
    )
    row["status"] = "approved"
    row["org_id"] = provisioned.get("org", {}).get("id")
    save_data()
    return {"ok": True, "request": row, "provisioned": provisioned}
