"""GCI source policy — text-first; audio/video only via ASR→transcript."""

from __future__ import annotations

from typing import Any, Dict, FrozenSet, Optional

# May contribute to GCI evidence / extract / actuals
ALLOWED_SOURCE_TYPES: FrozenSet[str] = frozenset(
    {
        "transcript",
        "filing_pdf",
        "ir_html",
        "ppt_text",
        "press_release",
        "asr_transcript",
        "reported_actuals",
        # legacy ingest tags mapped below
        "paste",
        "plain_text",
        "html_fetch",
        "seed",
        "alphahunter",
    }
)

# Must never enter GCI score path
DISALLOWED_FOR_GCI: FrozenSet[str] = frozenset(
    {
        "audio_raw",
        "video_raw",
        "technical",
        "shenanigan",
        "sentiment_only",
        "chart",
        "price_pattern",
    }
)

DOC_TYPE_TO_SOURCE = {
    "transcript": "transcript",
    "filing": "filing_pdf",
    "guidance": "press_release",
    "news": "press_release",
    "ppt": "ppt_text",
    "asr": "asr_transcript",
}

INGEST_SOURCE_TO_TYPE = {
    "paste": "transcript",
    "plain_text": "filing_pdf",
    "html_fetch": "ir_html",
    "ir_catalog": "ir_html",
    "ir_crawl": "ir_html",
    "bootstrap": "ir_html",
    "seed": "press_release",
}

POLICY_SUMMARY = (
    "GCI uses quantified guidance vs actuals from text sources "
    "(transcripts, filings, IR, PPT text, press releases). "
    "Audio/video are ASR→text only. Technicians and forensic shenanigans are out of scope. "
    "Fundamentals feed actuals only — not a separate GCI. Wordmap/sentiment is context only."
)


def is_allowed_for_gci(source_type: Optional[str]) -> bool:
    if not source_type:
        return True  # unspecified treated as text ingest
    s = source_type.strip().lower()
    if s in DISALLOWED_FOR_GCI:
        return False
    return s in ALLOWED_SOURCE_TYPES or s in DOC_TYPE_TO_SOURCE.values()


def require_gci_source(source_type: Optional[str]) -> str:
    s = (source_type or "transcript").strip().lower()
    mapped = INGEST_SOURCE_TO_TYPE.get(s, s)
    mapped = DOC_TYPE_TO_SOURCE.get(mapped, mapped)
    if mapped in DISALLOWED_FOR_GCI or not is_allowed_for_gci(mapped):
        raise ValueError(
            f"Source type {source_type!r} cannot score GCI. "
            f"Provide text via transcript/filing. Disallowed: {sorted(DISALLOWED_FOR_GCI)}"
        )
    return mapped


def resolve_source_type(*, doc_type: str = "transcript", source: str = "paste") -> str:
    if doc_type in DOC_TYPE_TO_SOURCE:
        return DOC_TYPE_TO_SOURCE[doc_type]
    return INGEST_SOURCE_TO_TYPE.get(source, "transcript")


def policy_payload() -> Dict[str, Any]:
    return {
        "summary": POLICY_SUMMARY,
        "allowed_source_types": sorted(ALLOWED_SOURCE_TYPES),
        "disallowed_for_gci": sorted(DISALLOWED_FOR_GCI),
        "media_policy": "audio/video accepted only as stub → provide ASR transcript via /api/ingest/text",
        "fundamentals_policy": "reported financials fill actual_value only; not a parallel GCI",
        "out_of_scope": ["technicals", "shenanigans", "buy_hold_sell", "raw_av_scoring"],
    }
