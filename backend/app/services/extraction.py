"""Heuristic + real LLM guidance extraction (Phase 3).

LLM path uses OpenAI-compatible chat when keyed; always ``needs_review=True``.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List

# Patterns: growth / margin / capex style guidance with optional ranges
_PATTERNS = [
    (
        "revenue_growth_pct",
        re.compile(
            r"revenue growth\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*[–\-to]+\s*(\d+(?:\.\d+)?)\s*%",
            re.I,
        ),
    ),
    (
        "revenue_growth_pct",
        re.compile(
            r"guidance for growth.{0,80}?(\d+(?:\.\d+)?)\s*%\s*to\s*(\d+(?:\.\d+)?)\s*%",
            re.I | re.S,
        ),
    ),
    (
        "revenue_growth_pct",
        re.compile(
            r"(?:revenue )?growth[^\d%]{0,60}?(\d+(?:\.\d+)?)\s*%\s*(?:to|–|-)\s*(\d+(?:\.\d+)?)\s*%",
            re.I,
        ),
    ),
    (
        "revenue_growth_pct",
        re.compile(
            r"revenues grew at\s*(\d+(?:\.\d+)?)\s*%",
            re.I,
        ),
    ),
    (
        "revenue_growth_pct",
        re.compile(
            r"revenue[^\d%]{0,40}?grow(?:th|)\s*(?:of|around|about)?\s*(\d+(?:\.\d+)?)\s*%",
            re.I,
        ),
    ),
    (
        "ebitda_margin_pct",
        re.compile(
            r"margin guidance.{0,60}?(\d+(?:\.\d+)?)\s*%\s*(?:to|–|-)\s*(\d+(?:\.\d+)?)\s*%",
            re.I | re.S,
        ),
    ),
    (
        "ebitda_margin_pct",
        re.compile(
            r"(?:EBITDA |operating )?margin[^\d%]{0,40}?(\d+(?:\.\d+)?)\s*[–\-to]+\s*(\d+(?:\.\d+)?)\s*%",
            re.I,
        ),
    ),
    (
        "ebitda_margin_pct",
        re.compile(
            r"(?:EBITDA |operating )?margin[^\d%]{0,40}?(?:around|about|near|at)\s*(\d+(?:\.\d+)?)\s*%",
            re.I,
        ),
    ),
    (
        "capex_inr_cr",
        re.compile(
            r"capex[^\d]{0,40}?(\d+(?:\.\d+)?)\s*[–\-to]+\s*(\d+(?:\.\d+)?)",
            re.I,
        ),
    ),
]


def extract_guidance(
    text: str,
    *,
    company_id: str,
    period: str = "FY26",
    source_ref: str = "upload",
) -> List[Dict[str, Any]]:
    found: List[Dict[str, Any]] = []
    seen = set()
    for metric, pattern in _PATTERNS:
        for m in pattern.finditer(text):
            groups = m.groups()
            if len(groups) == 2:
                low, high = float(groups[0]), float(groups[1])
                mid = (low + high) / 2.0
            else:
                mid = float(groups[0])
                low = high = mid
            key = (metric, round(mid, 2), round(low, 2), round(high, 2))
            if key in seen:
                continue
            seen.add(key)
            speaker = (
                "CFO"
                if "CFO" in text[max(0, m.start() - 40) : m.start()].upper()
                else "Management"
            )
            found.append(
                {
                    "company_id": company_id,
                    "period": period,
                    "metric": metric,
                    "guided_value": mid,
                    "guided_low": low,
                    "guided_high": high,
                    "actual_value": None,
                    "guided_text": m.group(0).strip(),
                    "confidence": 0.7,
                    "speaker": speaker,
                    "thread_id": f"{company_id}-{metric}",
                    "dropped": False,
                    "source_url": None,
                    "source_ref": source_ref,
                    "quote_span": m.group(0).strip()[:120],
                    "as_of": None,
                    "review_status": "pending",
                    "needs_review": True,
                    "extract_engine": "heuristic_v1",
                }
            )
    from app.data.metric_catalog import normalize_statement_metrics

    return normalize_statement_metrics(found)


def extract_with_llm_prompt(
    text: str,
    *,
    company_id: str,
    period: str = "FY26",
    source_ref: str = "upload",
) -> List[Dict[str, Any]]:
    """Prefer real LLM when configured; else heuristic tagged ``llm_fallback_heuristic``."""
    from app.services import llm_client
    from app.services.feature_flags import llm_extract_enabled

    if llm_extract_enabled() and llm_client.llm_configured():
        try:
            rows = llm_client.extract_guidance_via_llm(
                text,
                company_id=company_id,
                period=period,
                source_ref=source_ref,
                wait=False,
            )
            if rows:
                return rows
        except Exception:
            pass  # fall through to heuristic; never block ingest

    rows = extract_guidance(text, company_id=company_id, period=period, source_ref=source_ref)
    for r in rows:
        r["extract_engine"] = (
            "llm_fallback_heuristic"
            if llm_extract_enabled()
            else "heuristic_v1"
        )
        r["needs_review"] = True
        r["confidence"] = min(float(r.get("confidence", 0.7)), 0.75)
    return rows


def extract_auto(
    text: str,
    *,
    company_id: str,
    period: str = "FY26",
    source_ref: str = "upload",
) -> List[Dict[str, Any]]:
    """Route used by /api/extract and ingest — LLM when enabled, else heuristic."""
    from app.services.feature_flags import llm_extract_enabled

    if llm_extract_enabled():
        return extract_with_llm_prompt(
            text, company_id=company_id, period=period, source_ref=source_ref
        )
    return extract_guidance(text, company_id=company_id, period=period, source_ref=source_ref)
