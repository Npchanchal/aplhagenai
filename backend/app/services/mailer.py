"""Outbound email stub — logs tokens when SMTP unset; ready for SES/SMTP."""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

log = logging.getLogger("intellens.mail")


def smtp_configured() -> bool:
    return bool(os.environ.get("SMTP_HOST") and os.environ.get("SMTP_FROM"))


def auth_dev_tokens_enabled() -> bool:
    """Expose one-time tokens in API responses for local/test (never in prod)."""
    return os.environ.get("INTELLENS_AUTH_DEV_TOKENS", "").lower() in ("1", "true", "yes")


def send_mail(*, to: str, subject: str, body: str) -> Dict[str, Any]:
    """Send or stub. Production: set SMTP_HOST, SMTP_PORT, SMTP_FROM, SMTP_USER, SMTP_PASS."""
    if not smtp_configured():
        log.info("mail_stub to=%s subject=%s body=%s", to, subject, body[:200])
        return {"status": "stubbed", "to": to, "smtp": False}
    # Minimal SMTP path — optional dependency
    try:
        import smtplib
        from email.message import EmailMessage

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = os.environ["SMTP_FROM"]
        msg["To"] = to
        msg.set_content(body)
        host = os.environ["SMTP_HOST"]
        port = int(os.environ.get("SMTP_PORT", "587"))
        user = os.environ.get("SMTP_USER")
        password = os.environ.get("SMTP_PASS")
        with smtplib.SMTP(host, port, timeout=20) as smtp:
            smtp.starttls()
            if user and password:
                smtp.login(user, password)
            smtp.send_message(msg)
        return {"status": "sent", "to": to, "smtp": True}
    except Exception as exc:  # noqa: BLE001 — surface as stub failure detail
        log.exception("smtp_send_failed")
        return {"status": "error", "to": to, "smtp": True, "detail": str(exc)}


def public_base_url() -> str:
    return (os.environ.get("INTELLENS_PUBLIC_URL") or "http://localhost:8080").rstrip("/")
