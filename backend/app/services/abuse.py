"""Abuse challenge (soft CAPTCHA) for register / guest."""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import time
from typing import Any, Dict

from fastapi import HTTPException


def _secret() -> bytes:
    return (os.environ.get("INTELLENS_ABUSE_SECRET") or "intellens-dev-abuse").encode()


def issue_challenge() -> Dict[str, Any]:
    a = secrets.randbelow(8) + 2
    b = secrets.randbelow(8) + 2
    ts = int(time.time())
    nonce = secrets.token_hex(8)
    payload = f"{a}|{b}|{ts}|{nonce}"
    sig = hmac.new(_secret(), payload.encode(), hashlib.sha256).hexdigest()[:24]
    return {
        "challenge_id": f"{payload}|{sig}",
        "prompt": f"What is {a} + {b}?",
        "expires_in_sec": 600,
    }


def verify_challenge(challenge_id: str, answer: str) -> None:
    if os.environ.get("INTELLENS_ABUSE_OFF", "").lower() in ("1", "true", "yes"):
        return
    parts = (challenge_id or "").split("|")
    if len(parts) != 5:
        raise HTTPException(status_code=400, detail="Invalid abuse challenge")
    a, b, ts_s, nonce, sig = parts
    payload = f"{a}|{b}|{ts_s}|{nonce}"
    expect = hmac.new(_secret(), payload.encode(), hashlib.sha256).hexdigest()[:24]
    if not hmac.compare_digest(expect, sig):
        raise HTTPException(status_code=400, detail="Invalid abuse challenge signature")
    try:
        ts = int(ts_s)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid abuse challenge") from exc
    if time.time() - ts > 600:
        raise HTTPException(status_code=400, detail="Abuse challenge expired")
    try:
        got = int(str(answer).strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Abuse challenge answer required") from exc
    if got != int(a) + int(b):
        raise HTTPException(status_code=400, detail="Incorrect abuse challenge answer")
