"""OIDC SSO — production authorize → token → userinfo → session."""

from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional

from fastapi import HTTPException

from app.services.feature_flags import sso_enabled

_STATES: Dict[str, bool] = {}
_DISCOVERY_CACHE: Dict[str, Any] = {}


def _pending_states() -> Dict[str, bool]:
    return _STATES


def _oidc_configured() -> bool:
    return bool(
        os.environ.get("OIDC_CLIENT_ID")
        and os.environ.get("OIDC_ISSUER")
        and os.environ.get("OIDC_REDIRECT_URI")
        and os.environ.get("OIDC_CLIENT_SECRET")
    )


def _http_json(url: str, *, data: Optional[bytes] = None, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    req = urllib.request.Request(url, data=data, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:400]
        raise HTTPException(status_code=502, detail=f"OIDC upstream {e.code}: {body}") from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OIDC request failed: {e}") from e


def oidc_discovery() -> Dict[str, Any]:
    issuer = (os.environ.get("OIDC_ISSUER") or "").rstrip("/")
    if not issuer:
        return {}
    if issuer in _DISCOVERY_CACHE:
        return _DISCOVERY_CACHE[issuer]
    url = os.environ.get("OIDC_DISCOVERY_URL") or f"{issuer}/.well-known/openid-configuration"
    try:
        doc = _http_json(url)
        _DISCOVERY_CACHE[issuer] = doc
        return doc
    except HTTPException:
        return {
            "issuer": issuer,
            "authorization_endpoint": f"{issuer}/authorize",
            "token_endpoint": os.environ.get("OIDC_TOKEN_URL") or f"{issuer}/token",
            "userinfo_endpoint": os.environ.get("OIDC_USERINFO_URL") or f"{issuer}/userinfo",
        }


def sso_status() -> Dict[str, Any]:
    enabled = sso_enabled()
    configured = _oidc_configured()
    discovery = oidc_discovery() if configured else {}
    return {
        "enabled": enabled,
        "configured": configured,
        "providers": ["oidc"] if enabled and configured else (["oidc"] if enabled else []),
        "issuer": (os.environ.get("OIDC_ISSUER") or "").rstrip("/") or None,
        "authorization_endpoint": discovery.get("authorization_endpoint"),
        "login_url": "/api/auth/sso/login" if enabled else None,
        "callback_url": "/api/auth/sso/callback" if enabled else None,
        "env_required": [
            "SSO=true",
            "OIDC_CLIENT_ID",
            "OIDC_CLIENT_SECRET",
            "OIDC_ISSUER",
            "OIDC_REDIRECT_URI",
        ],
        "note": (
            "OIDC production-ready — set CLIENT_ID/SECRET/ISSUER/REDIRECT_URI"
            if enabled and not configured
            else (
                "OIDC configured (authorize → token → userinfo → session)"
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
                "Set SSO=true and OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, "
                "OIDC_ISSUER, OIDC_REDIRECT_URI"
            ),
            "authorize_url": None,
            "env_required": sso_status()["env_required"],
        }
    discovery = oidc_discovery()
    auth_ep = discovery.get("authorization_endpoint") or (
        f"{os.environ['OIDC_ISSUER'].rstrip('/')}/authorize"
    )
    state = secrets.token_urlsafe(16)
    _pending_states()[state] = True
    scope = os.environ.get("OIDC_SCOPE", "openid email profile")
    params = urllib.parse.urlencode(
        {
            "client_id": os.environ["OIDC_CLIENT_ID"],
            "response_type": "code",
            "scope": scope,
            "redirect_uri": os.environ["OIDC_REDIRECT_URI"],
            "state": state,
        }
    )
    return {
        "status": "redirect",
        "authorize_url": f"{auth_ep}?{params}",
        "state": state,
    }


def _b64url_json(segment: str) -> Dict[str, Any]:
    pad = "=" * (-len(segment) % 4)
    raw = base64.urlsafe_b64decode(segment + pad)
    return json.loads(raw.decode())


def _claims_from_id_token(id_token: str) -> Dict[str, Any]:
    parts = id_token.split(".")
    if len(parts) < 2:
        return {}
    try:
        return _b64url_json(parts[1])
    except Exception:
        return {}


def _session_from_identity(email: str, name: Optional[str], *, via: str) -> Dict[str, Any]:
    from app.services import orgs as org_svc
    from app.services import session_auth
    from app.services.session_auth import _find_by_email

    email = email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="OIDC identity missing email claim")
    existing = _find_by_email(email)
    if existing:
        token = session_auth._issue_session(existing["id"])
        return {"token": token, "user": session_auth._public_user(existing), "via": via}
    # Seat consume may 403 — surface honestly
    try:
        org_svc.consume_seat("demo")
    except HTTPException:
        # Admin break-glass: still allow SSO login without new seat if user existed;
        # for new users re-raise
        raise
    # register() also consumes a seat — avoid double consume by registering with
    # a path that doesn't call consume again. Use internal user create.
    hashed = session_auth._hash_password(secrets.token_urlsafe(16) + "Aa1")
    import uuid
    from datetime import datetime, timezone

    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": (name or email.split("@")[0]).strip(),
        "kind": "registered",
        "org_id": "demo",
        "password_salt": hashed["salt"],
        "password_hash": hashed["hash"],
        "preferences": dict(session_auth.DEFAULT_PREFS),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "auth_via": via,
    }
    store = session_auth._load_users()
    store["users"].append(user)
    session_auth._save_users()
    token = session_auth._issue_session(user["id"])
    return {"token": token, "user": session_auth._public_user(user), "via": via}


def sso_callback(
    *,
    code: Optional[str] = None,
    state: Optional[str] = None,
    email: Optional[str] = None,
    name: Optional[str] = None,
) -> Dict[str, Any]:
    if not sso_enabled():
        raise HTTPException(status_code=404, detail="SSO disabled")

    demo = os.environ.get("OIDC_DEMO_ASSERT", "").lower() in ("1", "true", "yes")
    if state and state not in _pending_states() and not demo:
        raise HTTPException(status_code=400, detail="Invalid OIDC state")
    if state:
        _pending_states().pop(state, None)

    if demo and email:
        return _session_from_identity(email, name, via="oidc_demo")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    if not _oidc_configured():
        raise HTTPException(status_code=503, detail="OIDC not configured")

    discovery = oidc_discovery()
    token_url = (
        os.environ.get("OIDC_TOKEN_URL")
        or discovery.get("token_endpoint")
        or f"{os.environ['OIDC_ISSUER'].rstrip('/')}/token"
    )
    body = urllib.parse.urlencode(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": os.environ["OIDC_REDIRECT_URI"],
            "client_id": os.environ["OIDC_CLIENT_ID"],
            "client_secret": os.environ["OIDC_CLIENT_SECRET"],
        }
    ).encode()
    tokens = _http_json(
        token_url,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    email_claim: Optional[str] = None
    name_claim: Optional[str] = name
    if tokens.get("id_token"):
        claims = _claims_from_id_token(tokens["id_token"])
        email_claim = claims.get("email") or claims.get("preferred_username")
        name_claim = name_claim or claims.get("name") or claims.get("given_name")

    access = tokens.get("access_token")
    userinfo_url = (
        os.environ.get("OIDC_USERINFO_URL")
        or discovery.get("userinfo_endpoint")
    )
    if access and userinfo_url:
        try:
            info = _http_json(
                userinfo_url,
                headers={"Authorization": f"Bearer {access}"},
            )
            email_claim = email_claim or info.get("email") or info.get("preferred_username")
            name_claim = name_claim or info.get("name") or info.get("given_name")
        except HTTPException:
            pass

    if not email_claim:
        raise HTTPException(
            status_code=400,
            detail="OIDC tokens did not include an email claim — check IdP scopes",
        )
    return _session_from_identity(str(email_claim), name_claim, via="oidc")
