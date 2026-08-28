"""In-process soft rate limits (Desk pricing + auth abuse controls)."""

from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from typing import Callable, Deque, Dict, Optional, Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


def rate_limit_rpm() -> int:
    try:
        return max(30, int(os.environ.get("RATE_LIMIT_RPM", "120")))
    except ValueError:
        return 120


def auth_rate_limit_rpm() -> int:
    """Stricter limit for register / guest / reset (B2C abuse control)."""
    try:
        return max(5, int(os.environ.get("AUTH_RATE_LIMIT_RPM", "20")))
    except ValueError:
        return 20


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window RPM by API key or client IP. Skips /health."""

    def __init__(self, app, rpm: Optional[int] = None, auth_rpm: Optional[int] = None):
        super().__init__(app)
        self.rpm = rpm or rate_limit_rpm()
        self.auth_rpm = auth_rpm or auth_rate_limit_rpm()
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def _key(self, request: Request) -> str:
        api_key = request.headers.get("x-api-key")
        if api_key:
            return f"key:{api_key}"
        client = request.client.host if request.client else "unknown"
        return f"ip:{client}"

    def _limit_for(self, path: str) -> Tuple[int, str]:
        if path.startswith("/api/auth/") or path == "/api/pilot-request":
            return auth_rate_limit_rpm(), "auth"
        return rate_limit_rpm(), "api"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        if path in ("/health", "/api/meta") or path.startswith("/docs") or path.startswith("/openapi"):
            return await call_next(request)

        limit, bucket = self._limit_for(path)
        key = f"{bucket}:{self._key(request)}"
        now = time.monotonic()
        window = self._hits[key]
        while window and now - window[0] > 60.0:
            window.popleft()
        if len(window) >= limit:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded",
                    "limit_rpm": limit,
                    "bucket": bucket,
                    "retry_after_sec": 60,
                },
                headers={"Retry-After": "60"},
            )
        window.append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - len(window)))
        response.headers["X-RateLimit-Bucket"] = bucket
        return response
