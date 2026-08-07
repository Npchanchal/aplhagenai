"""Org plan entitlements + seat metering."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import HTTPException

from app.data.seed import get_data, save_data

# Named seats by commercial plan (Package / PRICING.md)
PLAN_SEATS: Dict[str, int] = {
    "pilot": 5,
    "desk": 25,
    "enterprise": 100,
    "onestop": 40,
    "one-stop": 40,
    "one_stop": 40,
}

PLAN_FEATURES: Dict[str, set] = {
    "pilot": {"tracker", "desk", "research", "read_api"},
    "desk": {"tracker", "desk", "research", "read_api", "alerts", "vernacular", "import"},
    "enterprise": {
        "tracker",
        "desk",
        "research",
        "read_api",
        "alerts",
        "vernacular",
        "import",
        "em_export",
        "sso",
    },
    "onestop": {
        "tracker",
        "desk",
        "research",
        "read_api",
        "alerts",
        "vernacular",
        "import",
        "em_export",
        "sso",
        "wordmap",
        "badge",
        "labeling_priority",
    },
    "one-stop": set(),  # alias filled below
    "one_stop": set(),
}
PLAN_FEATURES["one-stop"] = PLAN_FEATURES["onestop"]
PLAN_FEATURES["one_stop"] = PLAN_FEATURES["onestop"]


def normalize_plan(plan: Optional[str]) -> str:
    p = (plan or "pilot").strip().lower().replace(" ", "")
    if p in ("one-stop", "one_stop", "onestopplatform"):
        return "onestop"
    if p in PLAN_SEATS:
        return p
    return "pilot"


def seat_limit_for(plan: Optional[str], explicit_seats: Optional[int] = None) -> int:
    if explicit_seats is not None and explicit_seats > 0:
        return int(explicit_seats)
    return PLAN_SEATS.get(normalize_plan(plan), 5)


def org_snapshot(org_id: str) -> Dict[str, Any]:
    orgs = get_data().get("orgs", {})
    if org_id not in orgs:
        raise HTTPException(status_code=404, detail="Org not found")
    row = dict(orgs[org_id])
    plan = normalize_plan(row.get("plan"))
    seats = seat_limit_for(plan, row.get("seats"))
    used = int(row.get("seats_used") or 0)
    features = sorted(PLAN_FEATURES.get(plan, PLAN_FEATURES["pilot"]))
    return {
        "id": org_id,
        **row,
        "plan": plan,
        "seats": seats,
        "seats_used": used,
        "seats_available": max(0, seats - used),
        "features": features,
        "entitlements": {
            "plan": plan,
            "seat_cap": seats,
            "features": features,
        },
    }


def consume_seat(org_id: str = "demo") -> Dict[str, Any]:
    """Increment seats_used; raise 403 if at capacity."""
    data = get_data()
    orgs = data.setdefault("orgs", {})
    if org_id not in orgs:
        orgs[org_id] = {
            "name": "IntelLens Pilot Desk",
            "plan": "pilot",
            "seats": 5,
            "seats_used": 0,
            "csm": "Assigned at convert",
        }
    snap = org_snapshot(org_id)
    if snap["seats_used"] >= snap["seats"]:
        raise HTTPException(
            status_code=403,
            detail=f"Seat limit reached for plan={snap['plan']} ({snap['seats']} seats)",
        )
    orgs[org_id]["seats_used"] = int(orgs[org_id].get("seats_used") or 0) + 1
    orgs[org_id]["seats"] = snap["seats"]
    orgs[org_id]["plan"] = snap["plan"]
    save_data()
    return org_snapshot(org_id)


def plan_allows(org_id: str, feature: str) -> bool:
    snap = org_snapshot(org_id)
    return feature in snap["features"]
