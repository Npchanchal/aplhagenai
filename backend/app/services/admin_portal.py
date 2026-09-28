"""Platform admin portal — role-based access separate from org admin."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set

from fastapi import Depends, Header, HTTPException

from app.data.seed import get_data
from app.services import feedback as feedback_svc
from app.services import session_auth
from app.services.auth import lookup_api_key

PLATFORM_ADMIN_ROLES = frozenset({"super", "ops", "compliance", "billing", "support"})

ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "super": {
        "portal.access",
        "orgs.read",
        "orgs.write",
        "users.read",
        "users.write",
        "feedback.read",
        "feedback.write",
        "legal.read",
        "legal.write",
        "billing.read",
        "billing.write",
        "pilot.manage",
        "audit.read",
        "system.ops",
    },
    "ops": {
        "portal.access",
        "orgs.read",
        "orgs.write",
        "users.read",
        "feedback.read",
        "feedback.write",
        "pilot.manage",
        "audit.read",
    },
    "compliance": {
        "portal.access",
        "legal.read",
        "legal.write",
        "audit.read",
        "orgs.read",
    },
    "billing": {
        "portal.access",
        "billing.read",
        "billing.write",
        "orgs.read",
        "audit.read",
    },
    "support": {
        "portal.access",
        "feedback.read",
        "feedback.write",
        "users.read",
        "orgs.read",
        "audit.read",
    },
}

ALL_PERMISSIONS: Set[str] = set().union(*ROLE_PERMISSIONS.values())


def permissions_for_role(role: Optional[str]) -> Set[str]:
    r = (role or "").strip().lower()
    if r == "super":
        return set(ALL_PERMISSIONS)
    return set(ROLE_PERMISSIONS.get(r, set()))


def has_permission(actor: Dict[str, Any], perm: str) -> bool:
    return perm in set(actor.get("permissions") or [])


def _actor_from_user(user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    role = user.get("platform_admin_role")
    if not role or role not in PLATFORM_ADMIN_ROLES:
        return None
    perms = sorted(permissions_for_role(str(role)))
    return {
        "source": "session",
        "user_id": user.get("id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "org_id": user.get("org_id"),
        "org_role": user.get("role"),
        "platform_admin_role": role,
        "permissions": perms,
    }


def _actor_from_api_key(key_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    role = key_row.get("platform_admin_role")
    if not role or role not in PLATFORM_ADMIN_ROLES:
        return None
    perms = sorted(permissions_for_role(str(role)))
    return {
        "source": "api_key",
        "user_id": None,
        "email": None,
        "name": key_row.get("key"),
        "org_id": key_row.get("org") or key_row.get("org_id"),
        "org_role": key_row.get("role"),
        "platform_admin_role": role,
        "permissions": perms,
        "api_key": key_row.get("key"),
    }


def resolve_platform_admin(
    authorization: Optional[str] = Header(default=None),
    x_api_key: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    user = session_auth.resolve_token(session_auth.extract_bearer(authorization))
    if user:
        actor = _actor_from_user(user)
        if actor:
            return actor
        raise HTTPException(status_code=403, detail="Platform admin access required")
    if x_api_key:
        row = lookup_api_key(x_api_key)
        if row is None:
            raise HTTPException(status_code=403, detail="Invalid API key")
        actor = _actor_from_api_key(row)
        if actor:
            return actor
        raise HTTPException(status_code=403, detail="Platform admin access required")
    raise HTTPException(status_code=401, detail="Authentication required")


def platform_actor_or_none(
    authorization: Optional[str], x_api_key: Optional[str]
) -> Optional[Dict[str, Any]]:
    """Like ``resolve_platform_admin`` but returns None instead of raising."""
    user = session_auth.resolve_token(session_auth.extract_bearer(authorization))
    if user:
        return _actor_from_user(user)
    if x_api_key:
        row = lookup_api_key(x_api_key)
        if row:
            return _actor_from_api_key(row)
    return None


def require_platform_perm(perm: str):
    def _dep(actor: Dict[str, Any] = Depends(resolve_platform_admin)) -> Dict[str, Any]:
        if not has_permission(actor, perm):
            raise HTTPException(
                status_code=403,
                detail=f"Platform role {actor.get('platform_admin_role')} lacks {perm}",
            )
        return actor

    return _dep


def portal_me(actor: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "platform_admin_role": actor.get("platform_admin_role"),
        "permissions": actor.get("permissions") or [],
        "source": actor.get("source"),
        "email": actor.get("email"),
        "name": actor.get("name"),
        "sections": _sections_for(actor),
    }


def _sections_for(actor: Dict[str, Any]) -> List[Dict[str, str]]:
    perms = set(actor.get("permissions") or [])
    sections: List[Dict[str, str]] = [{"id": "overview", "label": "Overview"}]
    if "orgs.read" in perms:
        sections.append({"id": "orgs", "label": "Organizations"})
    if "users.read" in perms:
        sections.append({"id": "users", "label": "Users"})
    if "feedback.read" in perms:
        sections.append({"id": "feedback", "label": "Feedback"})
    if "legal.read" in perms:
        sections.append({"id": "legal", "label": "Legal"})
    if "billing.read" in perms:
        sections.append({"id": "billing", "label": "Billing"})
    if "audit.read" in perms:
        sections.append({"id": "audit", "label": "Audit"})
    if "pilot.manage" in perms:
        sections.append({"id": "pilot-requests", "label": "Pilot requests"})
    if "system.ops" in perms:
        sections.append({"id": "system", "label": "System"})
    return sections


def list_orgs() -> List[Dict[str, Any]]:
    from app.services import orgs as org_svc

    data = get_data()
    out: List[Dict[str, Any]] = []
    for oid, row in (data.get("orgs") or {}).items():
        try:
            snap = org_svc.org_snapshot(str(oid))
        except HTTPException:
            snap = dict(row or {})
            snap["id"] = oid
        out.append(snap)
    return sorted(out, key=lambda r: str(r.get("id") or r.get("name") or ""))


def list_users() -> List[Dict[str, Any]]:
    rows = session_auth._load_users().get("users", [])
    out = []
    for u in rows:
        out.append(
            {
                "id": u.get("id"),
                "email": u.get("email"),
                "name": u.get("name"),
                "kind": u.get("kind"),
                "account_type": u.get("account_type"),
                "org_id": u.get("org_id"),
                "role": u.get("role"),
                "platform_admin_role": u.get("platform_admin_role"),
                "email_verified": bool(u.get("email_verified")),
                "active": u.get("active", True) is not False,
                "created_at": u.get("created_at"),
            }
        )
    return sorted(out, key=lambda r: str(r.get("email") or r.get("id") or ""))


def assign_platform_admin_role(
    user_id: str,
    role: Optional[str],
    *,
    actor: Dict[str, Any],
) -> Dict[str, Any]:
    if not has_permission(actor, "users.write"):
        raise HTTPException(status_code=403, detail="users.write required")
    if role and role not in PLATFORM_ADMIN_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"platform_admin_role must be one of {sorted(PLATFORM_ADMIN_ROLES)} or null",
        )
    user = session_auth._find_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role:
        user["platform_admin_role"] = role
    else:
        user.pop("platform_admin_role", None)
    session_auth._save_users()
    session_auth.reload_users_cache()
    user = session_auth._find_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["id"],
        "email": user.get("email"),
        "platform_admin_role": user.get("platform_admin_role"),
    }


def audit_summary() -> Dict[str, Any]:
    data = get_data()
    feedback_rows = feedback_svc.list_feedback()
    from app.services import pilot_request as pr_svc

    pilot_rows = pr_svc.list_requests()
    return {
        "orgs": len(data.get("orgs") or {}),
        "users": len(session_auth._load_users().get("users", [])),
        "feedback_open": sum(1 for r in feedback_rows if r.get("status") == "open"),
        "feedback_total": len(feedback_rows),
        "pilot_requests_pending": sum(1 for r in pilot_rows if r.get("status") == "pending"),
        "pilot_requests_total": len(pilot_rows),
        "reviews": len(data.get("reviews") or []),
        "pending_extracts": len(data.get("pending_extracts") or []),
    }
