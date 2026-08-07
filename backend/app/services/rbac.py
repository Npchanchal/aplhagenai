"""Phase 5 — role checks; SSO delegates to sso.py."""

from __future__ import annotations

from typing import Any, Dict, Set

from fastapi import Depends, HTTPException

from app.services.auth import resolve_api_key
from app.services import sso as sso_svc


ROLE_PERMS: Dict[str, Set[str]] = {
    "viewer": {"read"},
    "analyst": {"read", "review", "extract", "ingest"},
    "reviewer": {"read", "review", "ingest"},
    "admin": {"read", "review", "extract", "ingest", "admin", "sso"},
}


def require_perm(perm: str):
    def _dep(auth: Dict[str, Any] = Depends(resolve_api_key)) -> Dict[str, Any]:
        role = auth.get("role", "viewer")
        allowed = ROLE_PERMS.get(role, set())
        if perm not in allowed:
            raise HTTPException(status_code=403, detail=f"Role {role} lacks {perm}")
        return auth

    return _dep


def sso_status() -> Dict[str, Any]:
    return sso_svc.sso_status()


def sso_login_stub() -> Dict[str, Any]:
    """Backward-compatible name — returns authorize payload or config_required."""
    return sso_svc.sso_authorize()
