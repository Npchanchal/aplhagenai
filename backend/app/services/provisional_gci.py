"""Provisional GCI coverage for NSE/BSE listings.

Uses the production scorer in ``gci_scoring`` (v2 default; v3 via
``INTELLENS_GCI_VERSION``). Outcomes for non-seeded listings are deterministic
demo-grade bands — quality ``listing_provisional``. Never presented as
hand_labeled; cite only hand_labeled Sensex rows.
"""

from __future__ import annotations

import hashlib
from typing import Any, Dict, List, Optional, Tuple

from app.services.gci_scoring import (
    GuidanceOutcome,
    compute_company_gci,
    gci_trend_series,
    label_counts,
    metric_breakdown,
    outcome_score,
)


QUALITY = "listing_provisional"


def _h(ticker: str) -> int:
    return int(hashlib.sha256(ticker.encode("utf-8")).hexdigest()[:8], 16)


def _ir(ticker: str) -> str:
    return f"https://www.nseindia.com/get-quotes/equity?symbol={ticker.upper()}"


def make_provisional_outcomes(
    company_id: str, ticker: str, sector: str = "Equity"
) -> List[GuidanceOutcome]:
    """Deterministic multi-period guidance vs actuals → feed into gci_scoring v2."""
    h = _h(ticker)
    # Spread delivery quality across the universe (not a single cluster)
    delivery = (h % 100) / 100.0  # 0..0.99 — higher = better historical delivery
    base_rev = 6 + (h % 12)  # 6–17% growth guides
    margin = 12.0 + (h % 16)  # 12–27%
    conf = 0.72 + ((h >> 3) % 20) / 100.0  # 0.72–0.91

    def band(mid: float, width: float = 1.0) -> Tuple[float, float, float]:
        return mid, mid - width, mid + width

    def actual_for(mid: float, low: float, high: float, kind: str) -> float:
        """Map delivery quintile → met / slight beat / miss / big miss / drop-ish."""
        bucket = int(delivery * 5)  # 0..4
        if kind == "drop":
            return mid  # unused when dropped=True
        if bucket >= 4:
            return high + max(abs(high) * 0.03, 0.2)  # beat
        if bucket == 3:
            return (low + high) / 2.0  # met mid
        if bucket == 2:
            return low + (high - low) * 0.25  # met low
        if bucket == 1:
            return low - max(abs(low) * 0.08, 0.3)  # mild miss
        return low - max(abs(low) * 0.35, 1.0)  # larger miss

    rows: List[GuidanceOutcome] = []
    thread_rev = f"{company_id}-rev-growth"
    thread_mgn = f"{company_id}-margin"
    thread_wc = f"{company_id}-wc"

    periods = [
        ("FY23", "2023-05-15", base_rev, 0.0),
        ("FY24", "2024-05-12", base_rev - 0.5 + ((h >> 5) % 3) * 0.5, 0.05),
        ("FY25", "2025-05-10", base_rev + 1.0 - ((h >> 7) % 4) * 0.5, 0.1),
    ]
    for period, as_of, mid, _jitter in periods:
        gv, lo, hi = band(float(mid), 1.0)
        act = actual_for(gv, lo, hi, "rev")
        rows.append(
            GuidanceOutcome(
                period=period,
                metric="revenue_growth_pct",
                guided_value=gv,
                guided_low=lo,
                guided_high=hi,
                actual_value=act,
                guided_text=(
                    f"[provisional] {ticker} {period} revenue growth guided {lo:.0f}–{hi:.0f}%."
                ),
                confidence=conf,
                speaker="CFO",
                thread_id=thread_rev,
                dropped=False,
                source_url=_ir(ticker),
                source_ref=f"{ticker}-{period}-provisional",
                quote_span=None,  # never invent citeable quotes
                as_of=as_of,
            )
        )

    gv, lo, hi = band(margin, 0.8)
    rows.append(
        GuidanceOutcome(
            period="FY24",
            metric="ebitda_margin_pct",
            guided_value=gv,
            guided_low=lo,
            guided_high=hi,
            actual_value=actual_for(gv, lo, hi, "mgn"),
            guided_text=f"[provisional] EBITDA margin guided {lo:.1f}–{hi:.1f}%.",
            confidence=conf - 0.02,
            speaker="CFO",
            thread_id=thread_mgn,
            dropped=False,
            source_url=_ir(ticker),
            source_ref=f"{ticker}-FY24-margin-provisional",
            quote_span=None,
            as_of="2024-11-01",
        )
    )
    gv, lo, hi = band(margin + 0.5, 0.8)
    rows.append(
        GuidanceOutcome(
            period="FY25",
            metric="ebitda_margin_pct",
            guided_value=gv,
            guided_low=lo,
            guided_high=hi,
            actual_value=actual_for(gv, lo, hi, "mgn"),
            guided_text=f"[provisional] FY25 EBITDA margin guided {lo:.1f}–{hi:.1f}%.",
            confidence=conf,
            speaker="CFO",
            thread_id=thread_mgn,
            dropped=False,
            source_url=_ir(ticker),
            source_ref=f"{ticker}-FY25-margin-provisional",
            quote_span=None,
            as_of="2025-11-01",
        )
    )

    # Working capital / one dropped thread for lower-delivery names
    gv, lo, hi = band(float(5 + (h % 5)), 1.0)
    dropped = delivery < 0.15
    rows.append(
        GuidanceOutcome(
            period="FY25",
            metric="wc_days",
            guided_value=gv,
            guided_low=lo,
            guided_high=hi,
            actual_value=None if dropped else actual_for(gv, lo, hi, "wc"),
            guided_text=f"[provisional] Working-capital days guided near {gv:.0f}.",
            confidence=max(0.55, conf - 0.1),
            speaker="CFO",
            thread_id=thread_wc,
            dropped=dropped,
            source_url=_ir(ticker),
            source_ref=f"{ticker}-FY25-wc-provisional",
            quote_span=None,
            as_of="2025-08-01",
        )
    )

    # Open pending period (excluded from average)
    gv, lo, hi = band(float(base_rev), 1.0)
    rows.append(
        GuidanceOutcome(
            period="FY26",
            metric="revenue_growth_pct",
            guided_value=gv,
            guided_low=lo,
            guided_high=hi,
            actual_value=None,
            guided_text=f"[provisional] FY26 growth guided {lo:.0f}–{hi:.0f}% — period open.",
            confidence=conf,
            speaker="CFO",
            thread_id=thread_rev,
            dropped=False,
            source_url=_ir(ticker),
            source_ref=f"{ticker}-FY26-provisional",
            quote_span=None,
            as_of="2026-05-01",
        )
    )
    return rows


def score_provisional(
    company_id: str, ticker: str, sector: str = "Equity"
) -> Dict[str, Any]:
    outcomes = make_provisional_outcomes(company_id, ticker, sector)
    score = compute_company_gci(outcomes)
    trend = gci_trend_series(outcomes)
    return {
        "gci_score": score,
        "data_quality": QUALITY,
        "by_metric": metric_breakdown(outcomes),
        "label_counts": label_counts(outcomes),
        "trend": trend,
        "outcome_count": sum(1 for o in outcomes if outcome_score(o) is not None),
    }


def outcomes_as_dicts(
    company_id: str, ticker: str, sector: str = "Equity"
) -> List[Dict[str, Any]]:
    out = []
    for o in make_provisional_outcomes(company_id, ticker, sector):
        out.append(
            {
                "period": o.period,
                "metric": o.metric,
                "guided_value": o.guided_value,
                "guided_low": o.guided_low,
                "guided_high": o.guided_high,
                "actual_value": o.actual_value,
                "guided_text": o.guided_text,
                "confidence": o.confidence,
                "speaker": o.speaker,
                "thread_id": o.thread_id,
                "dropped": o.dropped,
                "source_url": o.source_url,
                "source_ref": o.source_ref,
                "quote_span": o.quote_span,
                "as_of": o.as_of,
            }
        )
    return out
