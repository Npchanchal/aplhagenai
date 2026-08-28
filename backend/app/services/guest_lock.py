"""Block guest Bearer tokens from mutating APIs even when a demo API key is also sent."""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from typing import Callable

from app.services.entitlements import guest_write_blocked
from app.services.session_auth import resolve_token


class GuestWriteMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            raw = request.headers.get("authorization") or ""
            token = None
            parts = raw.split(" ", 1)
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1].strip()
            user = resolve_token(token) if token else None
            path = request.url.path
            if user and user.get("kind") == "guest" and guest_write_blocked(path):
                return JSONResponse(
                    status_code=403,
                    content={
                        "detail": "Guest sessions are read-only — register for Desk, chat, and labeling"
                    },
                )
        return await call_next(request)
