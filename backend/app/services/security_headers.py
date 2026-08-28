"""Security headers (HSTS / HTTPS / CSP) for production."""

from __future__ import annotations

import os
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response

# Analytics hosts are listed so gtag/Plausible *can* load after DPDP consent.
# JS still does not inject those scripts until the visitor accepts.
CSP_POLICY = (
    "default-src 'self'; "
    "base-uri 'self'; "
    "frame-ancestors 'none'; "
    "object-src 'none'; "
    "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com; "
    "style-src 'self' 'unsafe-inline'; "
    "font-src 'self' data:; "
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com "
    "https://www.google-analytics.com https://plausible.io; "
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com "
    "https://www.googletagmanager.com https://plausible.io; "
    "frame-src https://www.googletagmanager.com"
)


def csp_policy() -> str:
    return CSP_POLICY


def force_https() -> bool:
    return os.environ.get("FORCE_HTTPS", "").lower() in ("1", "true", "yes")


def hsts_enabled() -> bool:
    return force_https() or os.environ.get("ENABLE_HSTS", "").lower() in ("1", "true", "yes")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Redirect HTTP→HTTPS when FORCE_HTTPS; emit HSTS + CSP."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        forwarded = (request.headers.get("x-forwarded-proto") or "").lower()
        host = (request.headers.get("host") or request.url.hostname or "").lower()
        loopback = host.startswith("127.0.0.1") or host.startswith("localhost")
        if force_https() and forwarded == "http" and not loopback:
            url = request.url.replace(scheme="https")
            return RedirectResponse(str(url), status_code=308)

        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Content-Security-Policy", CSP_POLICY)
        if hsts_enabled():
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        return response
