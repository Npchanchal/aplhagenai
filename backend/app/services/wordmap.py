"""Wordmap themes from citeable corpus text (entity vs industry).

Falls back to seed sentiment stubs when the corpus is empty.
Does not invent financials — only keyword theme weights from accepted docs.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

# Theme → lexicon (lowercase tokens). Scores are presence/density 0–100.
THEME_LEXICON: Dict[str, Tuple[str, ...]] = {
    "margin_expansion": (
        "margin",
        "ebitda",
        "operating margin",
        "profitability",
        "cost optimization",
        "opex",
    ),
    "pricing_power": (
        "pricing",
        "price hike",
        "realization",
        "asp",
        "rate hike",
        "premium",
    ),
    "demand_recovery": (
        "demand",
        "recovery",
        "volume growth",
        "order book",
        "pipeline",
        "deal wins",
        "booking",
    ),
    "working_capital": (
        "working capital",
        "cash conversion",
        "dso",
        "receivable",
        "inventory",
        "payable",
        "nwc",
    ),
    "capex_discipline": (
        "capex",
        "capital expenditure",
        "investment",
        "capacity",
        "asset light",
    ),
    "guidance_credibility": (
        "guidance",
        "outlook",
        "expect",
        "committed",
        "on track",
        "reaffirm",
        "deliver",
    ),
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower())


def score_themes(text: str) -> Dict[str, float]:
    """Return 0–100 theme scores from free text."""
    blob = _normalize(text)
    if not blob.strip():
        return {k: 0.0 for k in THEME_LEXICON}
    out: Dict[str, float] = {}
    for theme, words in THEME_LEXICON.items():
        hits = sum(blob.count(w) for w in words)
        # Saturating score: 0 hits → 0; ~8+ hits → ~100
        out[theme] = round(min(100.0, hits * 12.5), 1)
    return out


def _company_corpus_text(company_id: str) -> str:
    from app.data import doc_store

    parts: List[str] = []
    for doc in doc_store.list_documents(company_id=company_id)[:80]:
        status = (doc.get("review_status") or doc.get("status") or "").lower()
        if status in ("rejected", "pending"):
            continue
        text = doc.get("text") or doc.get("body") or ""
        if text:
            parts.append(str(text))
        quote = doc.get("quote_span") or ""
        if quote:
            parts.append(str(quote))
    # Also fold outcome quote spans from seed store
    from app.data.seed import get_data

    for o in get_data().get("outcomes", {}).get(company_id, []):
        if isinstance(o, dict):
            if o.get("quote_span"):
                parts.append(str(o["quote_span"]))
            if o.get("guided_text"):
                parts.append(str(o["guided_text"]))
    return "\n".join(parts)


def build_wordmap(company_id: str) -> Dict[str, Any]:
    """Entity vs industry theme map with honest source labeling."""
    from app.services import repository

    detail = repository.get_company_gci(company_id)
    peers = [c for c in repository.list_company_summaries() if c.sector == detail.sector]

    entity_text = _company_corpus_text(company_id)
    corpus_scores = score_themes(entity_text) if entity_text.strip() else None
    seed = detail.sentiment or {}
    used_corpus = bool(corpus_scores and any(v > 0 for v in corpus_scores.values()))

    if used_corpus and corpus_scores is not None:
        # Blend: corpus presence dominates; seed fills zeros for display continuity
        entity: Dict[str, float] = {}
        keys = list(THEME_LEXICON.keys())
        for k in keys:
            c = corpus_scores.get(k, 0.0)
            s = float(seed.get(k) or 0)
            entity[k] = round(c if c > 0 else max(0.0, s * 0.35), 1)
        source = "corpus"
        citeable = True
    else:
        entity = {k: float(seed.get(k) or 0) for k in (list(seed.keys()) or THEME_LEXICON)}
        source = "seed_fallback"
        citeable = False

    industry: Dict[str, Optional[float]] = {}
    peer_entity_maps: List[Dict[str, float]] = []
    for p in peers:
        pt = _company_corpus_text(p.id)
        if pt.strip() and any(score_themes(pt).values()):
            peer_entity_maps.append(score_themes(pt))
        else:
            from app.data.seed import get_data

            peer_entity_maps.append(
                {k: float(v) for k, v in (get_data().get("sentiment", {}).get(p.id) or {}).items()}
            )

    keys = list(entity.keys())
    for k in keys:
        vals = [m.get(k) for m in peer_entity_maps if m.get(k) is not None]
        industry[k] = round(sum(vals) / len(vals), 1) if vals else None

    return {
        "company_id": company_id,
        "entity": entity,
        "industry": industry,
        "sector": detail.sector,
        "peer_count": len(peers),
        "source": source,
        "citeable": citeable,
        "note": (
            "Themes derived from accepted docs / quote spans"
            if citeable
            else "Seed theme stubs — corpus empty for this name"
        ),
    }
