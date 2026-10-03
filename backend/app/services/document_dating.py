"""Reviewer dating of stored documents that arrived without a date (web search, issuer-site crawl).

A date is accepted only with evidence: a verbatim snippet from the stored text, title or URL
that states it (call date, meeting date, signing date, cover-letter date). Guidance rows
already extracted from the document inherit the date as ``guidance_as_of``.
"""

from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import Any, Dict, Optional

from app.data import doc_store

DATE_BASES = ("call_or_meeting_date", "document_date", "board_signing_date", "cover_letter_date")


def _squash(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip().lower()


def date_document(
    doc_id: str,
    *,
    as_of: str,
    evidence: str,
    basis: str,
    reviewer: str,
) -> Dict[str, Any]:
    try:
        day = date.fromisoformat(as_of)
    except ValueError:
        raise ValueError("as_of must be YYYY-MM-DD") from None
    if not date(2000, 1, 1) <= day <= datetime.now(timezone.utc).date():
        raise ValueError("as_of outside 2000-01-01 … today")
    if basis not in DATE_BASES:
        raise ValueError(f"basis must be one of {', '.join(DATE_BASES)}")
    if not reviewer.strip():
        raise ValueError("reviewer required")
    doc = doc_store.get_document(doc_id)
    if doc is None:
        raise KeyError(doc_id)
    needle = _squash(evidence)
    haystack = " ".join(_squash(doc.get(k) or "") for k in ("text", "title", "url"))
    if len(needle) < 6 or needle not in haystack:
        raise ValueError("evidence must be a verbatim snippet of the stored text, title or URL")
    previous = str(doc.get("date") or "")
    doc = doc_store.patch_document(
        doc_id,
        date=day.isoformat(),
        date_basis=basis,
        date_evidence=evidence.strip()[:300],
        dated_by=reviewer.strip(),
        dated_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    rows = _backfill_guidance_as_of(doc, day.isoformat())
    return {"doc_id": doc_id, "date": day.isoformat(), "previous_date": previous, "rows_dated": rows}


def _backfill_guidance_as_of(doc: Dict[str, Any], as_of: str) -> int:
    from app.data.seed import get_data, save_data
    from app.services.extract_pipeline import _save_overlay

    key = doc_store.url_key(doc.get("url"))
    if not key:
        return 0
    rows = (get_data().get("outcomes") or {}).get(doc["company_id"]) or []
    changed = 0
    for row in rows:
        if doc_store.url_key(row.get("guidance_source_url")) == key and not str(row.get("guidance_as_of") or "").strip():
            row["guidance_as_of"] = as_of
            changed += 1
    if changed:
        save_data()
        _save_overlay([doc["company_id"]])
    return changed


def undated_documents(company_id: Optional[str] = None) -> list:
    return [
        {k: d.get(k) for k in ("doc_id", "company_id", "doc_type", "title", "url")}
        for d in doc_store.list_documents(company_id=company_id, hydrate=False)
        if d.get("url") and not d.get("date")
    ]
