"""Phase 2 — document store (JSON-backed) with content-hash dedupe."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

_PATH = Path(__file__).with_name("documents.json")
_DOCS: Optional[Dict[str, Any]] = None


def _load() -> Dict[str, Any]:
    global _DOCS
    if _DOCS is None:
        if _PATH.exists():
            _DOCS = json.loads(_PATH.read_text())
        else:
            _DOCS = {"documents": [], "versions": []}
    return _DOCS


def save() -> None:
    data = _load()
    _PATH.write_text(json.dumps(data, indent=2))


def reset_docs() -> None:
    global _DOCS
    _DOCS = {"documents": [], "versions": []}
    save()


def content_hash(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()


def upsert_document(
    *,
    company_id: str,
    doc_type: str,
    title: str,
    text: str,
    url: Optional[str] = None,
    date: str = "2025-01-01",
    source: str = "ingest",
    review_status: str = "pending",
    source_type: Optional[str] = None,
    period: Optional[str] = None,
) -> Dict[str, Any]:
    from app.data.source_policy import resolve_source_type

    store = _load()
    h = content_hash(text)
    for d in store["documents"]:
        if d.get("content_hash") == h and d.get("company_id") == company_id:
            return d  # dedupe
    st = source_type or resolve_source_type(doc_type=doc_type, source=source)
    doc = {
        "doc_id": str(uuid4()),
        "company_id": company_id,
        "doc_type": doc_type,
        "title": title,
        "text": text,
        "url": url,
        "date": date,
        "source": source,
        "source_type": st,
        "period": period,
        "content_hash": h,
        "review_status": review_status,  # pending | accepted | rejected
        "version": 1,
    }
    store["documents"].append(doc)
    store["versions"].append({"doc_id": doc["doc_id"], "version": 1, "hash": h})
    save()
    return doc


def list_documents(
    company_id: Optional[str] = None,
    doc_type: Optional[str] = None,
    include_rejected: bool = False,
) -> List[Dict[str, Any]]:
    rows = _load()["documents"]
    out = []
    for d in rows:
        if not include_rejected and d.get("review_status") == "rejected":
            continue
        if company_id and d["company_id"] != company_id:
            continue
        if doc_type and d["doc_type"] != doc_type:
            continue
        out.append(d)
    return out


def set_review_status(doc_id: str, status: str) -> Dict[str, Any]:
    store = _load()
    for d in store["documents"]:
        if d["doc_id"] == doc_id:
            d["review_status"] = status
            save()
            return d
    raise KeyError(doc_id)


def patch_document(doc_id: str, **fields: Any) -> Dict[str, Any]:
    """Update selected fields on an existing document (period, url, review_status…)."""
    store = _load()
    for d in store["documents"]:
        if d["doc_id"] == doc_id:
            for k, v in fields.items():
                if v is not None:
                    d[k] = v
            save()
            return d
    raise KeyError(doc_id)


def seed_from_outcomes_and_transcripts() -> int:
    """Bootstrap store from GCI outcomes + sample transcripts (idempotent by hash)."""
    from app.data.seed import get_data
    from app.services.citations import span_offsets

    data = get_data()
    n = 0
    cos = {c["id"]: c for c in data["companies"]}
    for cid, rows in data.get("outcomes", {}).items():
        c = cos.get(cid, {})
        quality = c.get("data_quality") or "demo_structured"
        for o in rows:
            text = " ".join(
                filter(None, [o.get("guided_text"), o.get("quote_span"), o.get("source_ref")])
            )
            if not text.strip():
                continue
            status = "accepted" if quality == "hand_labeled" else "pending"
            doc = upsert_document(
                company_id=cid,
                doc_type="guidance",
                title=f"{o.get('period')} {o.get('metric')}",
                text=text,
                url=o.get("source_url"),
                date=o.get("as_of") or "2024-01-01",
                source=o.get("source_ref") or "outcome",
                review_status=status,
                period=o.get("period"),
            )
            if status == "accepted" and doc.get("review_status") != "accepted":
                doc = set_review_status(doc["doc_id"], "accepted")
            if not doc.get("period") and o.get("period"):
                doc = patch_document(doc["doc_id"], period=o.get("period"))
            start, end = span_offsets(doc.get("text") or text, o.get("quote_span"))
            if quality == "hand_labeled":
                o["doc_id"] = doc["doc_id"]
                if start is not None:
                    o["span_start"] = start
                    o["span_end"] = end
            n += 1
    for cid, text in data.get("sample_transcripts", {}).items():
        c = cos.get(cid, {})
        upsert_document(
            company_id=cid,
            doc_type="transcript",
            title=f"{c.get('ticker', cid)} sample concall",
            text=text,
            date="2025-04-18",
            source="sample_transcript",
            review_status="accepted" if c.get("data_quality") == "hand_labeled" else "pending",
            period="FY26",
        )
        n += 1
    from app.data.seed import save_data

    save_data()
    return n
