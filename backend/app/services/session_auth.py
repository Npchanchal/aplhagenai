"""Lightweight session auth: register / login / guest + preferences.

JSON-backed users + sessions. Passwords hashed with PBKDF2-HMAC-SHA256.
Bearer token returned to the frontend (also accepted via Authorization header).
"""

from __future__ import annotations

import hashlib
import json
import secrets
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import Header, HTTPException

_USERS_PATH = Path(__file__).resolve().parent.parent / "data" / "users.json"
_SESSIONS_PATH = Path(__file__).resolve().parent.parent / "data" / "sessions.json"

_USERS: Optional[Dict[str, Any]] = None
_SESSIONS: Optional[Dict[str, Any]] = None

DEFAULT_PREFS: Dict[str, Any] = {
    "language": "en",
    "default_market": "IN",
    "default_index": "SENSEX",
    "watchlist": [],
    "show_demo_tape": True,
    "density": "comfortable",
}

_PBKDF2_ITERS = 120_000


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_users() -> Dict[str, Any]:
    global _USERS
    if _USERS is None:
        if _USERS_PATH.exists():
            _USERS = json.loads(_USERS_PATH.read_text())
        else:
            _USERS = {"users": []}
    return _USERS


def _load_sessions() -> Dict[str, Any]:
    global _SESSIONS
    if _SESSIONS is None:
        if _SESSIONS_PATH.exists():
            _SESSIONS = json.loads(_SESSIONS_PATH.read_text())
        else:
            _SESSIONS = {"sessions": {}}
    return _SESSIONS


def _save_users() -> None:
    _USERS_PATH.parent.mkdir(parents=True, exist_ok=True)
    _USERS_PATH.write_text(json.dumps(_load_users(), indent=2))


def _save_sessions() -> None:
    _SESSIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
    _SESSIONS_PATH.write_text(json.dumps(_load_sessions(), indent=2))


def reset_auth_store() -> None:
    """Test helper — wipe in-memory + on-disk auth state."""
    global _USERS, _SESSIONS
    _USERS = {"users": []}
    _SESSIONS = {"sessions": {}}
    if _USERS_PATH.exists():
        _USERS_PATH.unlink()
    if _SESSIONS_PATH.exists():
        _SESSIONS_PATH.unlink()


def _hash_password(password: str, salt: Optional[str] = None) -> Dict[str, str]:
    salt_b = bytes.fromhex(salt) if salt else secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt_b, _PBKDF2_ITERS
    )
    return {"salt": salt_b.hex(), "hash": digest.hex(), "iters": str(_PBKDF2_ITERS)}


def _verify_password(password: str, salt: str, expected_hash: str) -> bool:
    got = _hash_password(password, salt=salt)
    return secrets.compare_digest(got["hash"], expected_hash)


def _public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user["id"],
        "email": user.get("email"),
        "name": user.get("name"),
        "kind": user.get("kind", "registered"),
        "preferences": {**DEFAULT_PREFS, **(user.get("preferences") or {})},
        "created_at": user.get("created_at"),
    }


def _issue_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    store = _load_sessions()
    store["sessions"][token] = {
        "user_id": user_id,
        "created_at": _now(),
    }
    _save_sessions()
    return token


def _find_user(user_id: str) -> Optional[Dict[str, Any]]:
    return next((u for u in _load_users()["users"] if u["id"] == user_id), None)


def _find_by_email(email: str) -> Optional[Dict[str, Any]]:
    email_l = email.strip().lower()
    return next(
        (u for u in _load_users()["users"] if (u.get("email") or "").lower() == email_l),
        None,
    )


def register(
    email: str,
    password: str,
    name: str,
    *,
    merge_preferences: Optional[Dict[str, Any]] = None,
    guest_token: Optional[str] = None,
    org_id: str = "demo",
) -> Dict[str, Any]:
    email = email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if _find_by_email(email):
        raise HTTPException(status_code=409, detail="Email already registered")

    # Seat metering (Package Pilot/Desk/One-Stop caps)
    from app.services import orgs as org_svc

    org_svc.consume_seat(org_id)

    prefs = dict(DEFAULT_PREFS)
    if guest_token:
        guest_user = resolve_token(guest_token)
        if guest_user and guest_user.get("kind") == "guest":
            prefs.update(guest_user.get("preferences") or {})
    if merge_preferences:
        prefs.update({k: v for k, v in merge_preferences.items() if k in DEFAULT_PREFS})

    hashed = _hash_password(password)
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": (name or email.split("@")[0]).strip(),
        "kind": "registered",
        "org_id": org_id,
        "password_salt": hashed["salt"],
        "password_hash": hashed["hash"],
        "preferences": prefs,
        "created_at": _now(),
    }
    store = _load_users()
    store["users"].append(user)
    _save_users()

    if guest_token:
        # Drop guest session after merge
        sessions = _load_sessions()
        sessions["sessions"].pop(guest_token, None)
        _save_sessions()

    token = _issue_session(user["id"])
    return {"token": token, "user": _public_user(user)}


def login(email: str, password: str) -> Dict[str, Any]:
    user = _find_by_email(email)
    if user is None or user.get("kind") == "guest":
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not _verify_password(password, user["password_salt"], user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = _issue_session(user["id"])
    return {"token": token, "user": _public_user(user)}


def create_guest() -> Dict[str, Any]:
    user = {
        "id": f"guest-{uuid.uuid4().hex[:12]}",
        "email": None,
        "name": "Guest",
        "kind": "guest",
        "preferences": dict(DEFAULT_PREFS),
        "created_at": _now(),
    }
    store = _load_users()
    store["users"].append(user)
    _save_users()
    token = _issue_session(user["id"])
    return {"token": token, "user": _public_user(user)}


def logout(token: Optional[str]) -> Dict[str, str]:
    if token:
        sessions = _load_sessions()
        sessions["sessions"].pop(token, None)
        _save_sessions()
    return {"status": "ok"}


def resolve_token(token: Optional[str]) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    sessions = _load_sessions()
    row = sessions["sessions"].get(token)
    if not row:
        return None
    user = _find_user(row["user_id"])
    if not user:
        return None
    return _public_user(user)


def get_preferences(token: Optional[str]) -> Dict[str, Any]:
    user = require_session(token)
    return user["preferences"]


def update_preferences(token: Optional[str], patch: Dict[str, Any]) -> Dict[str, Any]:
    public = require_session(token)
    user = _find_user(public["id"])
    if user is None:
        raise HTTPException(status_code=401, detail="Session expired")
    prefs = {**DEFAULT_PREFS, **(user.get("preferences") or {})}
    for key in DEFAULT_PREFS:
        if key in patch:
            prefs[key] = patch[key]
    user["preferences"] = prefs
    _save_users()
    return prefs


def require_session(token: Optional[str]) -> Dict[str, Any]:
    user = resolve_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def extract_bearer(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return None


def optional_session(
    authorization: Optional[str] = Header(default=None),
) -> Optional[Dict[str, Any]]:
    return resolve_token(extract_bearer(authorization))
