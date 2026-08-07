"""Simple API-key auth for write/pilot endpoints."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import Header, HTTPException

from app.data.seed import get_data


def resolve_api_key(x_api_key: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    for row in get_data().get("api_keys", []):
        if row["key"] == x_api_key:
            return row
    raise HTTPException(status_code=403, detail="Invalid API key")


def optional_api_key(x_api_key: Optional[str] = Header(default=None)) -> Optional[Dict[str, Any]]:
    if not x_api_key:
        return None
    for row in get_data().get("api_keys", []):
        if row["key"] == x_api_key:
            return row
    raise HTTPException(status_code=403, detail="Invalid API key")
