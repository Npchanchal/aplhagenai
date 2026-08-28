"""Verify that citeable quote_span text appears on an official source URL."""

from __future__ import annotations

import re
from typing import Optional
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from app.services.ingest import _TextExtractor

_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def normalize_text(text: str) -> str:
    t = (text or "").lower()
    t = t.replace("\u2013", "-").replace("\u2014", "-").replace("\u2019", "'")
    t = re.sub(r"[\s\u00a0]+", " ", t)
    return t.strip()


def _loose_pdf_text(data: bytes) -> str:
    """Extract text from PDF bytes (pypdf when available, else heuristic)."""
    try:
        from io import BytesIO

        from pypdf import PdfReader

        reader = PdfReader(BytesIO(data))
        parts: list[str] = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        joined = "\n".join(parts).strip()
        if joined:
            return joined
    except Exception:
        pass
    chunks: list[str] = []
    for m in re.finditer(rb"\(([^()\\]{4,200})\)", data):
        try:
            chunks.append(m.group(1).decode("latin-1", errors="ignore"))
        except Exception:
            continue
    return " ".join(chunks)


def fetch_source_text(url: str, *, timeout: int = 20) -> str:
    href = (url or "").strip()
    if not href:
        return ""
    req = Request(
        href,
        headers={"User-Agent": _UA, "Accept": "text/html,application/pdf,*/*"},
    )
    with urlopen(req, timeout=timeout) as resp:  # noqa: S310 — allowlist + verify only
        raw = resp.read()
        ctype = (resp.headers.get("Content-Type") or "").lower()
    path = urlparse(href).path.lower()
    q = urlparse(href).query.lower()
    is_pdf = (
        path.endswith(".pdf")
        or ".pdf?" in href.lower()
        or "fmt=pdf" in q
        or "application/pdf" in ctype
    )
    if is_pdf:
        return _loose_pdf_text(raw)
    html = raw.decode("utf-8", errors="ignore")
    parser = _TextExtractor()
    parser.feed(html)
    return parser.text()


def quote_in_text(quote: Optional[str], text: str) -> bool:
    q = normalize_text(quote or "")
    body = normalize_text(text)
    if not q or not body:
        return False
    if q in body:
        return True
    short = q[:40]
    if len(short) >= 12 and short in body:
        return True
    # tolerate minor punctuation / percent spacing drift
    q2 = re.sub(r"[^a-z0-9%.,$-]+", "", q)
    b2 = re.sub(r"[^a-z0-9%.,$-]+", "", body)
    return bool(q2 and len(q2) >= 12 and q2 in b2)


def verify_source_binding(source_url: Optional[str], quote_span: Optional[str]) -> Optional[bool]:
    """Return True/False when quote presence is known; None if fetch/extract failed."""
    url = (source_url or "").strip()
    quote = (quote_span or "").strip()
    if not url or not quote:
        return False
    try:
        text = fetch_source_text(url)
    except Exception:
        return None
    if not normalize_text(text):
        return None
    return quote_in_text(quote, text)
