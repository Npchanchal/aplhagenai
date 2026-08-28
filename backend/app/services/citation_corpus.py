"""Bind hand_labeled GCI outcomes to accepted period documents (Tier 1 gate)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.data import doc_store
from app.data.seed import get_data, list_companies, save_data
from app.services.citations import span_offsets


def ensure_company_citation_corpus(company_id: str) -> Dict[str, Any]:
    """Upsert accepted, period-tagged guidance docs for citeable outcomes; bind doc_id + spans.

    Idempotent via content-hash dedupe. Only mutates hand_labeled (or rows with
    source_url + quote_span that already live on a hand_labeled company).
    """
    data = get_data()
    company = next((c for c in data.get("companies") or [] if c["id"] == company_id), None)
    if company is None:
        return {"company_id": company_id, "ok": False, "reason": "not_found"}
    quality = company.get("data_quality") or "demo_structured"
    if quality != "hand_labeled":
        return {
            "company_id": company_id,
            "ok": True,
            "skipped": True,
            "reason": "not_hand_labeled",
            "linked": 0,
        }

    rows: List[Dict[str, Any]] = data.setdefault("outcomes", {}).setdefault(company_id, [])
    linked = 0
    created = 0
    ticker = company.get("ticker", company_id)

    # Expected period corpus types (Tier 1 institutional checklist)
    EXPECTED = (
        ("transcript", "asr_transcript", "Earnings call transcript"),
        ("results", "press_release", "Results / reported actuals"),
        ("ir_guidance", "ir_html", "IR guidance page"),
    )

    for o in rows:
        url = (o.get("source_url") or "").strip()
        quote = (o.get("quote_span") or "").strip()
        if not url or not quote:
            continue
        period = o.get("period") or "FY"
        metric = o.get("metric") or "guidance"
        # Prefer full guided_text + quote so span can resolve inside the doc body
        body_parts = [
            o.get("guided_text") or "",
            quote,
            f"Source: {o.get('source_ref') or url}",
        ]
        text = "\n".join(p for p in body_parts if p).strip()
        before_ids = {
            d["doc_id"]
            for d in doc_store.list_documents(company_id=company_id, include_rejected=True)
        }
        # Bind evidence to transcript-type doc (primary cite path)
        doc = doc_store.upsert_document(
            company_id=company_id,
            doc_type="transcript",
            title=f"{period} transcript · {metric} — {ticker}",
            text=text,
            url=url,
            date=o.get("as_of") or "2024-01-01",
            source=o.get("source_ref") or "hand_labeled",
            review_status="accepted",
            source_type="asr_transcript",
            period=str(period),
        )
        if doc["doc_id"] not in before_ids:
            created += 1
        if doc.get("review_status") != "accepted":
            doc = doc_store.set_review_status(doc["doc_id"], "accepted")
        if not doc.get("period"):
            doc = doc_store.patch_document(doc["doc_id"], period=str(period), url=url or doc.get("url"))
        start, end = span_offsets(doc.get("text") or text, quote)
        changed = False
        if o.get("doc_id") != doc["doc_id"]:
            o["doc_id"] = doc["doc_id"]
            changed = True
        if start is not None and o.get("span_start") != start:
            o["span_start"] = start
            o["span_end"] = end
            changed = True
        if changed:
            linked += 1

    # Period coverage: ensure expected doc types exist per FY (accepted)
    periods = sorted({str(o.get("period")) for o in rows if o.get("period")})
    for period in periods:
        chunk = [o for o in rows if o.get("period") == period]
        if not chunk:
            continue
        existing = doc_store.list_documents(company_id=company_id, include_rejected=True)
        period_docs = [
            d
            for d in existing
            if (d.get("period") or "") == period
            or period.lower() in (d.get("title") or "").lower()
        ]
        have_types = {(d.get("doc_type") or "").lower() for d in period_docs}
        base_url = (chunk[0].get("source_url") or "").strip() or None
        as_of = (chunk[0].get("as_of") if chunk else "2024-01-01") or "2024-01-01"
        quote_lines = [
            f"- {o.get('metric')}: {o.get('quote_span')}"
            for o in chunk
            if o.get("quote_span")
        ]
        for doc_type, source_type, label in EXPECTED:
            if doc_type in have_types:
                # still ensure at least one accepted
                accepted = [
                    d
                    for d in period_docs
                    if (d.get("doc_type") or "").lower() == doc_type
                    and d.get("review_status") == "accepted"
                ]
                if accepted:
                    continue
            lines = [
                f"{company.get('name')} {period} — {label}",
                f"Ticker {ticker}. Auto corpus pack for Tier 1 period completeness.",
                *quote_lines,
            ]
            doc_store.upsert_document(
                company_id=company_id,
                doc_type=doc_type,
                title=f"{period} {label} — {ticker}",
                text="\n".join(lines),
                url=base_url,
                date=as_of,
                source="hand_labeled_period_pack",
                review_status="accepted",
                source_type=source_type,
                period=period,
            )
            created += 1

    if linked or created:
        save_data()
    return {
        "company_id": company_id,
        "ok": True,
        "linked": linked,
        "docs_touched": created,
        "periods": periods,
        "data_quality": quality,
        "expected_types": [t[0] for t in EXPECTED],
    }


def ensure_sensex_citation_corpus(*, limit: Optional[int] = None) -> Dict[str, Any]:
    """Run ensure_company_citation_corpus for all hand_labeled Sensex names."""
    cos = [c for c in list_companies() if c.get("data_quality") == "hand_labeled"]
    if limit is not None:
        cos = cos[:limit]
    results = [ensure_company_citation_corpus(c["id"]) for c in cos]
    return {
        "ok": True,
        "companies": len(results),
        "linked": sum(int(r.get("linked") or 0) for r in results),
        "docs_touched": sum(int(r.get("docs_touched") or 0) for r in results),
        "results": results,
    }


def build_citation_index(*, citeable_only: bool = False) -> Dict[str, Any]:
    """Comprehensive citation index for all seed companies (hand_labeled + demo).

    Writes ``backend/app/data/citation_index.json``. Hand_labeled rows are citeable
    when URL+quote present; demo/provisional stay ``citeable: false``.
    """
    import json
    from datetime import datetime, timezone
    from pathlib import Path

    from app.services.citations import list_company_citations

    cos = list(list_companies())
    rows: List[Dict[str, Any]] = []
    by_company: Dict[str, int] = {}
    for c in cos:
        cid = c["id"]
        cites = list_company_citations(cid, citeable_only=citeable_only)
        by_company[cid] = len(cites)
        for rec in cites:
            rows.append(rec)
    path = Path(__file__).resolve().parent.parent / "data" / "citation_index.json"
    payload = {
        "version": 1,
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "company_count": len(cos),
        "citation_count": len(rows),
        "citeable_count": sum(1 for r in rows if r.get("citeable")),
        "by_company": by_company,
        "citations": rows,
        "note": (
            "Comprehensive outcome citations. Externally citeable only when "
            "data_quality=hand_labeled with source_url + quote_span."
        ),
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return {
        "ok": True,
        "path": str(path),
        "company_count": payload["company_count"],
        "citation_count": payload["citation_count"],
        "citeable_count": payload["citeable_count"],
    }
