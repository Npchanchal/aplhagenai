"""Citation / citeability helpers for GCI outcomes (Tier 1 foundation)."""

from __future__ import annotations

import hashlib
from typing import Any, Dict, Optional, Tuple

# Only hand_labeled outcomes may be presented as externally citeable.
CITEABLE_QUALITIES = frozenset({"hand_labeled"})


def citation_id_for(
    *,
    company_id: str,
    period: str,
    metric: str,
    source_url: Optional[str] = None,
    quote_span: Optional[str] = None,
    doc_id: Optional[str] = None,
) -> str:
    """Stable citation id from company + period + metric + source fingerprint."""
    raw = "|".join(
        [
            company_id or "",
            period or "",
            metric or "",
            (doc_id or "").strip(),
            (source_url or "").strip(),
            (quote_span or "").strip()[:80],
        ]
    )
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]
    return f"cite_{digest}"


def span_offsets(text: str, quote: Optional[str]) -> Tuple[Optional[int], Optional[int]]:
    """Return (start, end) char offsets of quote in text, if found."""
    if not text or not quote:
        return None, None
    q = quote.strip()
    if not q:
        return None, None
    idx = text.find(q)
    if idx < 0:
        # try first 40 chars of quote
        short = q[:40]
        idx = text.find(short)
        if idx < 0:
            return None, None
        return idx, idx + len(short)
    return idx, idx + len(q)


def assess_citeability(
    *,
    data_quality: str,
    source_url: Optional[str] = None,
    quote_span: Optional[str] = None,
    review_status: Optional[str] = None,
    doc_id: Optional[str] = None,
) -> Tuple[bool, str]:
    """Return (citeable, reason).

    Reasons: ok | provisional | demo | missing_source | pending_review | rejected | quality_not_citeable
    """
    q = (data_quality or "").strip().lower()
    if q == "listing_provisional" or q.startswith("listing_"):
        return False, "provisional"
    if q == "demo_structured":
        return False, "demo"
    if review_status == "pending":
        return False, "pending_review"
    if review_status == "rejected":
        return False, "rejected"
    if q not in CITEABLE_QUALITIES:
        return False, "quality_not_citeable"
    url = (source_url or "").strip()
    quote = (quote_span or "").strip()
    if not url or not quote:
        return False, "missing_source"
    # doc_id preferred but not required for hand_labeled with URL+quote
    _ = doc_id
    return True, "ok"


def enrich_outcome_citation(
    outcome: Any,
    *,
    company_id: str,
    data_quality: str,
    doc_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Build citation fields for OutcomeView serialization."""

    def _get(key: str) -> Any:
        if isinstance(outcome, dict):
            return outcome.get(key)
        return getattr(outcome, key, None)

    source_url = _get("source_url")
    quote_span = _get("quote_span")
    period = _get("period") or ""
    metric = _get("metric") or ""
    bound_doc = doc_id or _get("doc_id")
    span_start = _get("span_start")
    span_end = _get("span_end")
    citeable, reason = assess_citeability(
        data_quality=data_quality,
        source_url=source_url,
        quote_span=quote_span,
        review_status=_get("review_status"),
        doc_id=bound_doc,
    )
    out_quote = None if reason == "provisional" else quote_span
    cid = None
    if citeable:
        cid = citation_id_for(
            company_id=company_id,
            period=str(period),
            metric=str(metric),
            source_url=source_url,
            quote_span=quote_span,
            doc_id=bound_doc,
        )
    return {
        "citation_id": cid,
        "doc_id": bound_doc,
        "citeable": citeable,
        "cite_reason": reason,
        "quote_span": out_quote,
        "span_start": span_start,
        "span_end": span_end,
    }


def outcome_is_citeable(row: Dict[str, Any]) -> bool:
    if "citeable" in row:
        return bool(row["citeable"])
    citeable, _ = assess_citeability(
        data_quality=str(row.get("data_quality") or ""),
        source_url=row.get("source_url"),
        quote_span=row.get("quote_span"),
        doc_id=row.get("doc_id"),
    )
    return citeable
