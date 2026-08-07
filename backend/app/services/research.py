"""Intellens Research — doc-store search, hybrid retrieve, cite-only chat."""

from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Set

from app.data import consensus_store, doc_store
from app.data.seed import get_data
from app.services import repository
from app.services.analytics import track
from app.services.feature_flags import consensus_import_enabled, research_llm_enabled


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9]+", (text or "").lower())


def _tfidf_scores(query: str, docs: List[Dict[str, Any]]) -> List[float]:
    """Local embedding fallback: cosine over TF-IDF bag-of-words."""
    q_toks = _tokenize(query)
    if not q_toks or not docs:
        return [0.0] * len(docs)
    df: Counter[str] = Counter()
    doc_toks: List[List[str]] = []
    for d in docs:
        toks = _tokenize(f"{d.get('title', '')} {d.get('text', d.get('body', ''))}")
        doc_toks.append(toks)
        df.update(set(toks))
    n = len(docs)
    idf = {t: math.log((n + 1) / (df[t] + 1)) + 1 for t in df}

    def vec(toks: List[str]) -> Dict[str, float]:
        tf = Counter(toks)
        return {t: (tf[t] / max(len(toks), 1)) * idf.get(t, 0) for t in tf}

    qv = vec(q_toks)

    def cos(a: Dict[str, float], b: Dict[str, float]) -> float:
        keys = set(a) | set(b)
        dot = sum(a.get(k, 0) * b.get(k, 0) for k in keys)
        na = math.sqrt(sum(v * v for v in a.values())) or 1e-9
        nb = math.sqrt(sum(v * v for v in b.values())) or 1e-9
        return dot / (na * nb)

    return [cos(qv, vec(t)) for t in doc_toks]


def ensure_doc_store_seeded() -> None:
    if not doc_store.list_documents():
        doc_store.seed_from_outcomes_and_transcripts()


def build_documents() -> List[Dict[str, Any]]:
    ensure_doc_store_seeded()
    cos = {c["id"]: c for c in get_data()["companies"]}
    docs = []
    for d in doc_store.list_documents():
        c = cos.get(d["company_id"], {})
        docs.append(
            {
                "id": d["doc_id"],
                "company_id": d["company_id"],
                "ticker": c.get("ticker", d["company_id"].upper()),
                "name": c.get("name", d["company_id"]),
                "doc_type": d["doc_type"],
                "title": d["title"],
                "date": d.get("date") or "2024-01-01",
                "source": d.get("source"),
                "url": d.get("url"),
                "snippet": (d.get("text") or "")[:280],
                "body": d.get("text") or "",
                "review_status": d.get("review_status"),
            }
        )
    return docs


def search_documents(
    query: str,
    *,
    company_id: Optional[str] = None,
    doc_type: Optional[str] = None,
    limit: int = 25,
    hybrid: bool = True,
) -> Dict[str, Any]:
    track("research_search", {"q": query, "company_id": company_id})
    q = (query or "").strip().lower()
    docs = build_documents()
    filtered = []
    for d in docs:
        if company_id and d["company_id"] != company_id:
            continue
        if doc_type and d["doc_type"] != doc_type:
            continue
        filtered.append(d)

    if not q:
        hits = [{**d, "score": 1.0} for d in filtered[:limit]]
    elif hybrid:
        scores = _tfidf_scores(query, filtered)
        ranked = sorted(
            ({**d, "score": float(s)} for d, s in zip(filtered, scores)),
            key=lambda x: -x["score"],
        )
        # also boost keyword hits
        for h in ranked:
            blob = f"{h['title']} {h['body']}".lower()
            if q in blob:
                h["score"] += 0.5
            for tok in q.split():
                if tok and tok in blob:
                    h["score"] += 0.1
        ranked.sort(key=lambda x: -x["score"])
        hits = [h for h in ranked if h["score"] > 0][:limit]
        if not hits:
            hits = ranked[:limit]
    else:
        hits = []
        for d in filtered:
            blob = f"{d['title']} {d['body']}".lower()
            if q in blob or any(tok and tok in blob for tok in q.split()):
                hits.append({**d, "score": blob.count(q) + 1})
        hits.sort(key=lambda x: -x["score"])
        hits = hits[:limit]

    return {
        "query": query,
        "count": len(hits),
        "results": hits,
        "engine": "intellens-hybrid-v1" if hybrid else "intellens-keyword-v1",
        "product": "Intellens Search",
        "llm_mode": research_llm_enabled(),
    }


def research_chat(question: str, company_id: Optional[str] = None) -> Dict[str, Any]:
    """Cite-only: answer only from retrieved chunks; refuse if empty."""
    track("research_chat", {"question": question[:120], "company_id": company_id})
    q = (question or "").strip()
    if not q:
        return {
            "answer": "Ask a question about guidance, margins, or delivery.",
            "citations": [],
            "refused": False,
        }

    search = search_documents(q, company_id=company_id, limit=5)
    q_toks = set(_tokenize(q))
    citations = []
    for c in search["results"][:5]:
        blob = f"{c.get('title', '')} {c.get('body', '')} {c.get('snippet', '')}".lower()
        # require at least one meaningful token overlap (len>3) or strong score
        overlap = [t for t in q_toks if len(t) > 3 and t in blob]
        if overlap or float(c.get("score") or 0) >= 0.25:
            citations.append(c)
        if len(citations) >= 3:
            break

    gci_note = ""
    if company_id:
        try:
            detail = repository.get_company_gci(company_id)
            gci_note = (
                f" {detail.name} GCI is "
                f"{'n/a' if detail.gci_score is None else detail.gci_score}."
            )
        except Exception:
            gci_note = ""

    if not citations:
        return {
            "question": q,
            "company_id": company_id,
            "answer": (
                "I don't have cited evidence in the Intellens document store for that question. "
                "Ingest a filing/transcript or narrow to a covered Sensex name."
            ),
            "citations": [],
            "refused": True,
            "engine": "intellens-cite-only-v1",
            "product": "Intellens Research Chat",
            "disclaimer": "Not investment advice. Cite-only mode — no answer without sources.",
            "llm_mode": research_llm_enabled(),
        }

    bits = [c["snippet"] for c in citations]
    answer = (
        f"Based only on indexed Intellens sources:{gci_note} "
        + " | ".join(bits[:2])
        + " — Factual draft, not investment advice."
    )
    return {
        "question": q,
        "company_id": company_id,
        "answer": answer,
        "citations": [
            {
                "id": c["id"],
                "title": c["title"],
                "doc_type": c["doc_type"],
                "ticker": c["ticker"],
                "snippet": c["snippet"],
                "date": c["date"],
                "company_id": c["company_id"],
            }
            for c in citations
        ],
        "refused": False,
        "engine": "intellens-cite-only-v1",
        "product": "Intellens Research Chat",
        "disclaimer": "Not investment advice. Answers restricted to retrieved citations.",
        "llm_mode": research_llm_enabled(),
    }


def _demo_price(ticker: str) -> float:
    h = sum(ord(c) for c in ticker) % 500
    return round(800 + h * 3.7, 2)


def company_snapshot(company_id: str) -> Dict[str, Any]:
    from app.services.changes import change_bundle, demo_fundamental_series

    track("gci_open", {"company_id": company_id, "via": "snapshot"})
    detail = repository.get_company_gci(company_id)
    price = _demo_price(detail.ticker)
    mkt_cap_cr = round(price * (12 + len(detail.ticker)) * 10, 1)
    # demo price path for MoM/QoQ/YoY
    price_series = [
        (f"2025-{m:02d}", round(price * (0.94 + i * 0.015), 2))
        for i, m in enumerate((1, 2, 3, 4, 5, 6))
    ]
    price_series[-1] = (price_series[-1][0], price)
    price_ch = change_bundle(price, price_series)

    rev = 6.5 + (len(detail.ticker) % 5)
    opm = 18 + (len(detail.sector) % 8)
    roe = 14 + (len(detail.name) % 6)
    fundamentals = {
        "revenue_growth_ttm_pct": change_bundle(
            rev, demo_fundamental_series(rev, detail.ticker, kind="quarterly")
        ),
        "op_margin_pct": change_bundle(
            opm, demo_fundamental_series(opm, detail.ticker + "m", kind="quarterly")
        ),
        "roe_pct": change_bundle(
            roe, demo_fundamental_series(roe, detail.ticker + "r", kind="annual")
        ),
    }
    return {
        "company_id": detail.id,
        "name": detail.name,
        "ticker": detail.ticker,
        "sector": detail.sector,
        "exchange": "NSE/BSE",
        "market": {
            "last": price,
            "currency": "INR",
            "change_pct": price_ch.get("pop_pct")
            or round(((sum(ord(c) for c in detail.ticker) % 21) - 10) / 10, 2),
            "mom_pct": price_ch.get("mom_pct"),
            "qoq_pct": price_ch.get("qoq_pct"),
            "yoy_pct": price_ch.get("yoy_pct"),
            "mkt_cap_cr": mkt_cap_cr,
            "volume": 1_000_000 + (sum(ord(c) for c in detail.ticker) % 900_000),
            "as_of": "demo-eod",
            "note": "Demo quote tape — Intellens Desk (not a live exchange feed). Changes are MoM/QoQ/YoY where series allow.",
            "history": price_ch.get("history", []),
        },
        "gci": {
            "score": detail.gci_score,
            "change_pct": detail.gci_change_pct,
            "change_horizon": detail.gci_change_horizon,
            "label_counts": detail.label_counts,
            "peer_rank_in_sector": detail.peer_rank_in_sector,
            "sector_avg_gci": detail.sector_avg_gci,
            "data_quality": detail.data_quality,
            "trend": detail.trend,
        },
        "fundamentals_demo": fundamentals,
        "product": "Intellens Desk Snapshot",
        "note": "Levels plus MoM/QoQ/YoY change trends — increments are primary for desk use.",
    }


def consensus_estimates(company_id: str) -> Dict[str, Any]:
    from app.services.changes import enrich_metric_rows
    from app.services.feature_flags import allow_demo_street

    detail = repository.get_company_gci(company_id)
    rows = []
    imported = consensus_import_enabled()
    demo_ok = allow_demo_street()
    for o in detail.outcomes[:12]:
        street = consensus_store.lookup(company_id, o.period, o.metric) if imported else None
        if street is not None:
            street_src = "imported"
        elif demo_ok:
            street = round(o.guided_value + ((hash(o.period + o.metric) % 7) - 3) * 0.15, 2)
            street_src = "demo"
        else:
            street = None
            street_src = "unavailable"
        vs = None
        if o.actual_value is not None and street is not None:
            vs = round((o.actual_value - street) / max(abs(street), 1e-6) * 100, 2)
        rows.append(
            {
                "period": o.period,
                "metric": o.metric,
                "street_consensus": street,
                "street_source": street_src,
                "management_guidance": o.guided_value,
                "guided_band": [o.guided_low, o.guided_high],
                "actual": o.actual_value,
                "gci_label": o.label,
                "vs_street_pct": vs,
            }
        )
    rows = enrich_metric_rows(
        rows, value_keys=("actual", "management_guidance", "street_consensus")
    )
    return {
        "company_id": company_id,
        "ticker": detail.ticker,
        "estimates": rows,
        "product": "Intellens Estimates",
        "note": (
            "Street consensus only from imported rows unless ALLOW_DEMO_STREET=true. "
            "MoM/QoQ/YoY change vs prior period where series allow."
        ),
        "demo_street_allowed": demo_ok,
    }


def promise_brief(company_id: str) -> Dict[str, Any]:
    """Pre-earnings promise brief — what management promised for the periods
    still open, and how often they have kept that kind of promise before.

    Pure composition over existing stores (outcomes + consensus); no new data.
    """
    track("promise_brief", {"company_id": company_id})
    detail = repository.get_company_gci(company_id)
    imported = consensus_import_enabled()

    closed_by_metric: Dict[str, Counter] = {}
    for o in detail.outcomes:
        if o.label == "pending":
            continue
        closed_by_metric.setdefault(o.metric, Counter())[o.label] += 1

    promises: List[Dict[str, Any]] = []
    from app.services.feature_flags import allow_demo_street

    demo_ok = allow_demo_street()
    for o in detail.outcomes:
        if o.label != "pending":
            continue
        street = consensus_store.lookup(company_id, o.period, o.metric) if imported else None
        if street is not None:
            street_src = "imported"
        elif demo_ok:
            street = round(o.guided_value + ((hash(o.period + o.metric) % 7) - 3) * 0.15, 2)
            street_src = "demo"
        else:
            street = None
            street_src = "unavailable"
        counts = closed_by_metric.get(o.metric, Counter())
        closed = sum(counts.values())
        kept = counts.get("met", 0) + counts.get("exceeded", 0)
        promises.append(
            {
                "period": o.period,
                "metric": o.metric,
                "guided_value": o.guided_value,
                "guided_band": [o.guided_low, o.guided_high],
                "guided_text": o.guided_text,
                "speaker": o.speaker,
                "confidence": o.confidence,
                "source_url": o.source_url,
                "source_ref": o.source_ref,
                "street_consensus": street,
                "street_source": street_src,
                "history": {
                    "closed": closed,
                    "met": counts.get("met", 0),
                    "exceeded": counts.get("exceeded", 0),
                    "missed": counts.get("missed", 0),
                    "dropped": counts.get("dropped", 0),
                    "kept": kept,
                    "hit_rate_pct": round(kept / closed * 100, 1) if closed else None,
                },
            }
        )

    return {
        "company_id": detail.id,
        "name": detail.name,
        "ticker": detail.ticker,
        "sector": detail.sector,
        "gci_score": detail.gci_score,
        "gci_change_pct": detail.gci_change_pct,
        "gci_change_horizon": detail.gci_change_horizon,
        "data_quality": detail.data_quality,
        "open_promise_count": len(promises),
        "promises": promises,
        "product": "Intellens Pre-Earnings Promise Brief",
        "note": (
            "Open (pending) guidance for periods being reported, with the historical "
            "hit rate on the same metric. Factual delivery record — not a forecast."
        ),
        "disclaimer": "Not investment advice.",
    }


def news_feed(company_id: Optional[str] = None, limit: int = 20) -> Dict[str, Any]:
    docs = [
        d
        for d in build_documents()
        if d["doc_type"] in ("news", "filing", "expert", "transcript", "guidance")
        and (not company_id or d["company_id"] == company_id)
    ]
    docs.sort(key=lambda d: d["date"], reverse=True)
    return {
        "count": min(len(docs), limit),
        "items": docs[:limit],
        "product": "Intellens News & Filings",
    }


def watchlist() -> Dict[str, Any]:
    from app.services.changes import change_bundle

    rows = []
    for c in repository.list_company_summaries()[:15]:
        price = _demo_price(c.ticker)
        price_series = [
            (f"2025-{m:02d}", round(price * (0.94 + i * 0.015), 2))
            for i, m in enumerate((3, 4, 5, 6))
        ]
        price_series[-1] = (price_series[-1][0], price)
        pch = change_bundle(price, price_series)
        rows.append(
            {
                "company_id": c.id,
                "ticker": c.ticker,
                "name": c.name,
                "sector": c.sector,
                "gci_score": c.gci_score,
                "gci_change_pct": c.gci_change_pct,
                "gci_change_horizon": c.gci_change_horizon,
                "data_quality": c.data_quality,
                "last": price,
                "change_pct": pch.get("pop_pct")
                or round(((sum(ord(x) for x in c.ticker) % 21) - 10) / 10, 2),
                "mom_pct": pch.get("mom_pct"),
                "qoq_pct": pch.get("qoq_pct"),
                "yoy_pct": pch.get("yoy_pct"),
            }
        )
    return {
        "items": rows,
        "product": "Intellens Watchlist",
        "note": "Tape and GCI shown as level + MoM/QoQ/YoY change where available.",
    }


def list_transcripts(company_id: Optional[str] = None) -> Dict[str, Any]:
    docs = [
        d
        for d in build_documents()
        if d["doc_type"] == "transcript" and (not company_id or d["company_id"] == company_id)
    ]
    return {"count": len(docs), "transcripts": docs, "product": "Intellens Transcripts"}


def chat_eval_hit_rate(cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Phase 4.5 — eval harness over expected citation company/doc types."""
    hits = 0
    for case in cases:
        out = research_chat(case["q"], company_id=case.get("company_id"))
        cite_ids: Set[str] = {c["id"] for c in out.get("citations", [])}
        expected = set(case.get("expect_any_ids") or [])
        expect_company = case.get("expect_company_id")
        ok = False
        if expected and cite_ids & expected:
            ok = True
        if expect_company and any(c.get("company_id") == expect_company for c in out.get("citations", [])):
            ok = True
        if out.get("refused") and case.get("expect_refuse"):
            ok = True
        if ok:
            hits += 1
    total = max(len(cases), 1)
    return {"hits": hits, "total": total, "rate": round(hits / total, 3)}
