"""OIDC SSO — real authorize/callback when configured; stub otherwise."""

from __future__ import annotations

import hashlib
import os
import secrets
import urllib.parse
from typing import Any, Dict, Optional

from fastapi import HTTPException

from app.services.feature_flags import sso_enabled


def _oidc_configured() -> bool:
    return bool(
        os.environ.get("OIDC_CLIENT_ID")
        and os.environ.get("OIDC_ISSUER")
        and os.environ.get("OIDC_REDIRECT_URI")
    )


def sso_status() -> Dict[str, Any]:
    enabled = sso_enabled()
    configured = _oidc_configured()
    providers = []
    if enabled and configured:
        providers = ["oidc"]
    elif enabled:
        providers = ["oidc-google", "oidc-azure"]  # advertised when flag on, awaiting env
    return {
        "enabled": enabled,
        "configured": configured,
        "providers": providers,
        "login_url": "/api/auth/sso/login" if enabled else None,
        "callback_url": "/api/auth/sso/callback" if enabled else None,
        "note": (
            "OIDC ready — set OIDC_CLIENT_ID / OIDC_ISSUER / OIDC_REDIRECT_URI"
            if enabled and not configured
            else (
                "OIDC configured"
                if enabled and configured
                else "SSO disabled — set SSO=true to enable"
            )
        ),
    }


def sso_authorize() -> Dict[str, Any]:
    if not sso_enabled():
        raise HTTPException(status_code=404, detail="SSO disabled")
    if not _oidc_configured():
        return {
            "status": "config_required",
            "message": (
                "SSO flag is on but OIDC env is incomplete. "
                "Set OIDC_CLIENT_ID, OIDC_ISSUER, OIDC_REDIRECT_URI."
            ),
            "authorize_url": None,
        }
    client_id = os.environ["OIDC_CLIENT_ID"]
    issuer = os.environ["OIDC_ISSUER"].rstrip("/")
    redirect = os.environ["OIDC_REDIRECT_URI"]
    state = secrets.token_urlsafe(16)
    # Store state in-process for callback validation (demo-scale)
    _pending_states()[state] = True
    scope = os.environ.get("OIDC_SCOPE", "openid email profile")
    params = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "response_type": "code",
            "scope": scope,
            "redirect_uri": redirect,
            "state": state,
        }
    )
    authorize_url = f"{issuer}/authorize?{params}"
    return {
        "status": "redirect",
        "authorize_url": authorize_url,
        "state": state,
    }


_STATES: Dict[str, bool] = {}


def _pending_states() -> Dict[str, bool]:
    return _STATES


def sso_callback(
    *,
    code: Optional[str] = None,
    state: Optional[str] = None,
    email: Optional[str] = None,
    name: Optional[str] = None,
) -> Dict[str, Any]:
    """Complete SSO.

    Production: exchange `code` at token endpoint (requires client secret + HTTP).
    Demo/test: when OIDC_DEMO_ASSERT=1, accept email claim to mint a session.
    """
    if not sso_enabled():
        raise HTTPException(status_code=404, detail="SSO disabled")
    if state and state not in _pending_states() and not os.environ.get("OIDC_DEMO_ASSERT"):
        raise HTTPException(status_code=400, detail="Invalid OIDC state")
    if state:
        _pending_states().pop(state, None)

    demo = os.environ.get("OIDC_DEMO_ASSERT", "").lower() in ("1", "true", "yes")
    if demo and email:
        from app.services import session_auth
        from app.services import orgs as org_svc

        # Upsert-style: register if new, else login-equivalent session
        existing = None
        try:
            from app.services.session_auth import _find_by_email

            existing = _find_by_email(email)
        except Exception:
            existing = None
        if existing:
            token = session_auth._issue_session(existing["id"])
            return {"token": token, "user": session_auth._public_user(existing), "via": "oidc_demo"}
        org_svc.consume_seat("demo")
        reg = session_auth.register(
            email,
            secrets.token_urlsafe(12) + "A1",
            name or email.split("@")[0],
        )
        return {**reg, "via": "oidc_demo"}

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    if not _oidc_configured():
        raise HTTPException(status_code=503, detail="OIDC not configured")

    # Token exchange is env-gated; without client secret return honest handoff payload
    client_secret = os.environ.get("OIDC_CLIENT_SECRET")
    if not client_secret:
        return {
            "status": "code_received",
            "message": "Authorization code received — set OIDC_CLIENT_SECRET to complete token exchange",
            "code_fingerprint": hashlib.sha256(code.encode()).hexdigest()[:12],
        }

    # Minimal token exchange via urllib (no extra dependency)
    import json
    import urllib.request

    issuer = os.environ["OIDC_ISSUER"].rstrip("/")
    token_url = os.environ.get("OIDC_TOKEN_URL") or f"{issuer}/token"
    body = urllib.parse.urlencode(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": os.environ["OIDC_REDIRECT_URI"],
            "client_id": os.environ["OIDC_CLIENT_ID"],
            "client_secret": client_secret,
        }
    ).encode()
    req = urllib.request.Request(
        token_url, data=body, headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            payload = json.loads(resp.read().decode())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OIDC token exchange failed: {e}") from e

    return {
        "status": "tokens",
        "token_type": payload.get("token_type"),
        "expires_in": payload.get("expires_in"),
        "has_id_token": bool(payload.get("id_token")),
        "note": "Wire id_token claims → session_auth in production hardening",
    }
