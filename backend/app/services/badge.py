"""Broker-embeddable GCI badge (W5.4). Not a Trust Score; not investment advice."""

from __future__ import annotations

from datetime import datetime
from html import escape
from typing import Any, Dict, Optional
from xml.sax.saxutils import escape as xml_escape

from fastapi import HTTPException
from fastapi.responses import Response

from app.services import repository

LABEL = "Guidance Credibility Index (GCI)"
DISCLAIMER = "Not investment advice. Factual guidance-delivery metric."

_TIER_TITLE = {
    "provisional": "Provisional",
    "established": "Established",
    "deep": "Deep",
}


def _format_as_of(iso: Optional[str]) -> str:
    if not iso:
        return ""
    try:
        d = datetime.fromisoformat(str(iso)[:10])
    except ValueError:
        return str(iso)[:10]
    return d.strftime("%d %b %Y")


def payload(ticker: str) -> Dict[str, Any]:
    row = repository.resolve_ticker_summary(ticker)
    if row is None:
        raise HTTPException(status_code=404, detail="Ticker not found")
    score = row.get("gci_score")
    shown = "" if score is None else f"{score:.1f}".rstrip("0").rstrip(".")
    display = shown or "—"
    return {
        "ticker": row["ticker"],
        "name": row.get("name"),
        "gci_score": score,
        "confidence_tier": row.get("confidence_tier"),
        "as_of": row.get("as_of"),
        "algorithm_id": row.get("algorithm_id"),
        "label": LABEL,
        "embed": (
            f'<span data-citealpha-badge="{escape(row["ticker"], quote=True)}">'
            f"{display}</span>"
        ),
        "svg_url": f"/api/badge/{row['ticker']}/svg",
        "status": "ok",
        "data_quality": row.get("data_quality"),
        "disclaimer": DISCLAIMER,
    }


def svg_response(ticker: str) -> Response:
    row = repository.resolve_ticker_summary(ticker)
    if row is None:
        raise HTTPException(status_code=404, detail="Ticker not found")
    gci = row.get("gci_score")
    score = "—" if gci is None else f"{gci:.1f}".rstrip("0").rstrip(".")
    tier = _TIER_TITLE.get(row.get("confidence_tier") or "", "")
    as_of = _format_as_of(row.get("as_of"))
    ticker_s = xml_escape(str(row["ticker"]))
    fill = "#6b6b6b" if gci is None else "#0e1a16"
    accent = "#9aa3ad" if gci is None else "#0b6b5f"
    width = 320 if gci is None else 300
    meta_bits = [p for p in (tier, as_of) if p]
    meta = xml_escape(" · ".join(meta_bits)) if meta_bits else "Not yet scored"
    if gci is None:
        meta = "Not yet scored"
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="48" role="img" aria-label="{xml_escape(LABEL)} {ticker_s}">
  <rect width="{width}" height="48" rx="4" fill="{fill}"/>
  <rect x="0" y="0" width="6" height="48" fill="{accent}"/>
  <text x="16" y="18" fill="#c5cdc8" font-family="ui-sans-serif, system-ui, sans-serif" font-size="10">GCI</text>
  <text x="16" y="38" fill="#ffffff" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="600">{ticker_s}  {xml_escape(score)}</text>
  <text x="{width - 12}" y="30" fill="#d4e8e4" font-family="ui-sans-serif, system-ui, sans-serif" font-size="11" text-anchor="end">{meta}</text>
</svg>"""
    return Response(content=svg, media_type="image/svg+xml")
