"""In-process soft rate limits (Desk pricing claim)."""

from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from typing import Callable, Deque, Dict, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


def rate_limit_rpm() -> int:
    try:
        return max(30, int(os.environ.get("RATE_LIMIT_RPM", "120")))
    except ValueError:
        return 120


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window RPM by API key or client IP. Skips /health."""

    def __init__(self, app, rpm: Optional[int] = None):
        super().__init__(app)
        self.rpm = rpm or rate_limit_rpm()
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def _key(self, request: Request) -> str:
        api_key = request.headers.get("x-api-key")
        if api_key:
            return f"key:{api_key}"
        client = request.client.host if request.client else "unknown"
        return f"ip:{client}"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        if path in ("/health", "/api/meta") or path.startswith("/docs") or path.startswith("/openapi"):
            return await call_next(request)

        key = self._key(request)
        now = time.monotonic()
        window = self._hits[key]
        while window and now - window[0] > 60.0:
            window.popleft()
        if len(window) >= self.rpm:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded",
                    "limit_rpm": self.rpm,
                    "retry_after_sec": 60,
                },
                headers={"Retry-After": "60"},
            )
        window.append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.rpm)
        response.headers["X-RateLimit-Remaining"] = str(max(0, self.rpm - len(window)))
        return response
