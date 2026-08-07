"""GCI scorer v2 — ranges, asymmetric beats, labels, dropped guidance."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple


class OutcomeLabel(str, Enum):
    EXCEEDED = "exceeded"
    MET = "met"
    MISSED = "missed"
    DROPPED = "dropped"
    PENDING = "pending"


@dataclass(frozen=True)
class GuidanceOutcome:
    period: str
    metric: str
    guided_value: float
    actual_value: Optional[float]
    guided_text: str
    confidence: float = 1.0
    speaker: str = "CFO"
    guided_low: Optional[float] = None
    guided_high: Optional[float] = None
    dropped: bool = False
    thread_id: Optional[str] = None
    source_url: Optional[str] = None
    source_ref: Optional[str] = None
    quote_span: Optional[str] = None
    as_of: Optional[str] = None  # YYYY-MM-DD point-in-time stamp
    doc_id: Optional[str] = None
    span_start: Optional[int] = None
    span_end: Optional[int] = None


def _band(outcome: GuidanceOutcome) -> Tuple[float, float]:
    low = outcome.guided_low if outcome.guided_low is not None else outcome.guided_value
    high = outcome.guided_high if outcome.guided_high is not None else outcome.guided_value
    if low > high:
        low, high = high, low
    return low, high


def classify_outcome(outcome: GuidanceOutcome) -> OutcomeLabel:
    if outcome.dropped:
        return OutcomeLabel.DROPPED
    if outcome.actual_value is None:
        return OutcomeLabel.PENDING
    low, high = _band(outcome)
    actual = outcome.actual_value
    # 2% tolerance around band for "met"
    pad = max(abs(outcome.guided_value) * 0.02, 0.05)
    if actual > high + pad:
        return OutcomeLabel.EXCEEDED
    if actual < low - pad:
        return OutcomeLabel.MISSED
    return OutcomeLabel.MET


def outcome_score(outcome: GuidanceOutcome) -> Optional[float]:
    """
    Score 0–100 for a closed outcome.
    - Dropped → 35 (silence ≠ full miss, but hurts credibility)
    - Pending → None (excluded from company average)
    - In-band (met) → 100
    - Exceeded (beat) → 92–100 (slightly below perfect — forecast quality)
    - Missed → decays with relative distance below low band; ≥50% miss → 0
    """
    label = classify_outcome(outcome)
    if label == OutcomeLabel.PENDING:
        return None
    if label == OutcomeLabel.DROPPED:
        raw = 35.0
    elif label == OutcomeLabel.MET:
        raw = 100.0
    elif label == OutcomeLabel.EXCEEDED:
        # Beats score high (asymmetric vs misses)
        low, high = _band(outcome)
        actual = float(outcome.actual_value)
        overshoot = (actual - high) / max(abs(high), 1e-6)
        # Mild penalty for large overshoots (poor forecasting), floor 85
        raw = max(85.0, 100.0 - min(overshoot, 1.0) * 15.0)
    else:  # MISSED
        low, _high = _band(outcome)
        actual = float(outcome.actual_value)
        if low == 0:
            rel_err = abs(actual - low)
        else:
            rel_err = abs(actual - low) / abs(low)
        raw = max(0.0, 100.0 * (1.0 - min(rel_err / 0.5, 1.0)))

    weight = min(max(outcome.confidence, 0.5), 1.0)
    # Low confidence pulls toward 50 (uncertain)
    return raw * weight + (1.0 - weight) * 50.0


def compute_company_gci(outcomes: List[GuidanceOutcome]) -> Optional[float]:
    scored: List[Tuple[float, float]] = []
    for o in outcomes:
        s = outcome_score(o)
        if s is None:
            continue
        w = min(max(o.confidence, 0.5), 1.0)
        scored.append((s, w))
    if not scored:
        return None
    total_w = sum(w for _, w in scored)
    return round(sum(s * w for s, w in scored) / total_w, 1)


def metric_breakdown(outcomes: List[GuidanceOutcome]) -> Dict[str, float]:
    by_metric: Dict[str, List[GuidanceOutcome]] = {}
    for o in outcomes:
        by_metric.setdefault(o.metric, []).append(o)
    result: Dict[str, float] = {}
    for metric, rows in by_metric.items():
        score = compute_company_gci(rows)
        if score is not None:
            result[metric] = score
    return result


def label_counts(outcomes: List[GuidanceOutcome]) -> Dict[str, int]:
    counts = {label.value: 0 for label in OutcomeLabel}
    for o in outcomes:
        counts[classify_outcome(o).value] += 1
    return counts


def delta_pct(guided: float, actual: Optional[float]) -> Optional[float]:
    if actual is None:
        return None
    if guided == 0:
        return 0.0
    return round(100.0 * (actual - guided) / abs(guided), 2)


def gci_trend_series(
    outcomes: List[GuidanceOutcome], periods: Optional[List[str]] = None
) -> List[Dict[str, Optional[float]]]:
    """Cumulative GCI after each period (ordered), with period-over-period change."""
    from app.services.changes import enrich_value_series, sort_periods

    ordered_periods = periods or sort_periods(list({o.period for o in outcomes}))
    series: List[Dict[str, Any]] = []
    accumulated: List[GuidanceOutcome] = []
    for period in ordered_periods:
        accumulated.extend([o for o in outcomes if o.period == period])
        series.append({"period": period, "gci_score": compute_company_gci(accumulated)})
    return enrich_value_series(series, period_key="period", value_key="gci_score")  # type: ignore[return-value]
