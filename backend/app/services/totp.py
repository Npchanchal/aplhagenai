"""TOTP (RFC 6238) for owner/admin MFA — stdlib only."""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import struct
import time
from typing import Optional


def new_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def _hotp(key: bytes, counter: int, digits: int = 6) -> str:
    msg = struct.pack(">Q", counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return f"{code % (10 ** digits):0{digits}d}"


def _decode_secret(secret: str) -> bytes:
    pad = "=" * ((8 - len(secret) % 8) % 8)
    return base64.b32decode(secret.upper() + pad, casefold=True)


def totp_at(secret: str, timestamp: Optional[float] = None, *, step: int = 30, digits: int = 6) -> str:
    ts = int(timestamp if timestamp is not None else time.time())
    return _hotp(_decode_secret(secret), ts // step, digits)


def verify(secret: str, code: str, *, window: int = 1, step: int = 30) -> bool:
    if not secret or not code:
        return False
    raw = "".join(ch for ch in str(code) if ch.isdigit())
    if len(raw) != 6:
        return False
    now = int(time.time())
    for delta in range(-window, window + 1):
        if totp_at(secret, now + delta * step, step=step) == raw:
            return True
    return False


def otpauth_uri(secret: str, email: str, issuer: str = "CiteAlpha") -> str:
    label = f"{issuer}:{email}"
    return (
        f"otpauth://totp/{label}?secret={secret}&issuer={issuer}&algorithm=SHA1"
        f"&digits=6&period=30"
    )
