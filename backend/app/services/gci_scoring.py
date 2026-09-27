"""GCI scorers — v4 (v3 engine + beat floor), v3 (exp δ / γ / recency), v2 (legacy heuristic).

Toggle with ``INTELLENS_GCI_VERSION=v2|v3|v4`` (default ``v4``).
"""

from __future__ import annotations

import math
import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Sequence, Tuple


# --- v3 constants (Technical Spec) ---
GCI_ALPHA = 0.35
GCI_BETA = 1.25
GCI_LAMBDA = 0.15
GCI_GAMMA_MISS = 1.4
GCI_EPS = 1e-6
POINT_BAND_FRAC = 0.02
MIN_PERIODS_FULL_CONF = 4

# --- v4: beats decay from 100 toward this floor instead of toward 0 ---
GCI_BEAT_FLOOR = 60.0

AUDIT_PENALTY_PTS: Dict[str, float] = {
    "guidance_withdrawal": 15.0,
    "restatement": 15.0,
    "definition_shift": 10.0,
}


class OutcomeLabel(str, Enum):
    EXCEEDED = "exceeded"
    MET = "met"
    MISSED = "missed"
    DROPPED = "dropped"
    PENDING = "pending"
    UNMAPPED = "unmapped"


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
    unmapped: bool = False  # qualitative / NLP UNMAPPED — excluded from GCI


@dataclass
class GciComputeResult:
    gci: Optional[float]
    version: str
    low_confidence: bool = False
    periods_used: int = 0
    shenanigans_deduction: float = 0.0
    by_metric: Dict[str, float] = field(default_factory=dict)


def scorer_version(override: Optional[str] = None) -> str:
    raw = (override or os.environ.get("INTELLENS_GCI_VERSION") or "v4").strip().lower()
    if raw in ("v2", "2", "gci_v2", "gci_scoring_v2", "legacy"):
        return "v2"
    if raw in ("v3", "3", "gci_v3", "gci_scoring_v3"):
        return "v3"
    return "v4"


def algorithm_id(override: Optional[str] = None) -> str:
    return f"gci_scoring_{scorer_version(override)}"


def _band(outcome: GuidanceOutcome) -> Tuple[float, float]:
    low = outcome.guided_low if outcome.guided_low is not None else outcome.guided_value
    high = outcome.guided_high if outcome.guided_high is not None else outcome.guided_value
    if low > high:
        low, high = high, low
    return low, high


def classify_outcome(outcome: GuidanceOutcome) -> OutcomeLabel:
    if outcome.unmapped:
        return OutcomeLabel.UNMAPPED
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


# ---------------------------------------------------------------------------
# v2 — ranges, asymmetric beats, labels, dropped guidance
# ---------------------------------------------------------------------------


def outcome_score_v2(outcome: GuidanceOutcome) -> Optional[float]:
    """
    Score 0–100 for a closed outcome (v2).
    - Dropped → 35 (silence ≠ full miss, but hurts credibility)
    - Pending / unmapped → None (excluded from company average)
    - In-band (met) → 100
    - Exceeded (beat) → 92–100 (slightly below perfect — forecast quality)
    - Missed → decays with relative distance below low band; ≥50% miss → 0
    """
    label = classify_outcome(outcome)
    if label in (OutcomeLabel.PENDING, OutcomeLabel.UNMAPPED):
        return None
    if label == OutcomeLabel.DROPPED:
        raw = 35.0
    elif label == OutcomeLabel.MET:
        raw = 100.0
    elif label == OutcomeLabel.EXCEEDED:
        low, high = _band(outcome)
        actual = float(outcome.actual_value)
        overshoot = (actual - high) / max(abs(high), 1e-6)
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
    return raw * weight + (1.0 - weight) * 50.0


def compute_company_gci_v2(outcomes: List[GuidanceOutcome]) -> Optional[float]:
    scored: List[Tuple[float, float]] = []
    for o in outcomes:
        s = outcome_score_v2(o)
        if s is None:
            continue
        w = min(max(o.confidence, 0.5), 1.0)
        scored.append((s, w))
    if not scored:
        return None
    total_w = sum(w for _, w in scored)
    return round(sum(s * w for s, w in scored) / total_w, 1)


# ---------------------------------------------------------------------------
# v3 — normalized δ, exp decay, γ asymmetry, recency, audit deductions
# ---------------------------------------------------------------------------


def effective_band(outcome: GuidanceOutcome) -> Tuple[float, float, float, float]:
    """Return (G_min, G_max, G_mid, W) with synthetic ±2% band for point estimates."""
    low, high = _band(outcome)
    gmid = (low + high) / 2.0
    if abs(high - low) < GCI_EPS:
        w = max(POINT_BAND_FRAC * abs(gmid), GCI_EPS)
        return gmid - w, gmid + w, gmid, w
    w = (high - low) / 2.0
    return low, high, gmid, w


def normalized_deviation(outcome: GuidanceOutcome) -> Optional[float]:
    """Out-of-band δ_t; 0 inside band; None if period excluded."""
    if outcome.unmapped or outcome.dropped or outcome.actual_value is None:
        return None
    gmin, gmax, gmid, w = effective_band(outcome)
    actual = float(outcome.actual_value)
    if gmin <= actual <= gmax:
        return 0.0
    return (abs(actual - gmid) - w) / (w + GCI_EPS)


def _outcome_score_exp(outcome: GuidanceOutcome, beat_floor: float) -> Optional[float]:
    if outcome.unmapped or outcome.dropped or outcome.actual_value is None:
        return None
    gmin, gmax, gmid, w = effective_band(outcome)
    actual = float(outcome.actual_value)
    if gmin <= actual <= gmax:
        return 100.0
    delta = (abs(actual - gmid) - w) / (w + GCI_EPS)
    # Guard negative base for fractional β on tiny float noise
    delta = max(0.0, delta)
    decay = math.exp(-GCI_ALPHA * (delta**GCI_BETA))
    if actual > gmax:
        return beat_floor + (100.0 - beat_floor) * decay
    return max(0.0, 100.0 - GCI_GAMMA_MISS * (100.0 - 100.0 * decay))


def outcome_score_v3(outcome: GuidanceOutcome) -> Optional[float]:
    """Adjusted single-period score S̃_{m,t} (0–100). Excludes pending/unmapped/dropped."""
    return _outcome_score_exp(outcome, 0.0)


def outcome_score_v4(outcome: GuidanceOutcome) -> Optional[float]:
    """v3 with beats floored at GCI_BEAT_FLOOR; in-band and misses are identical to v3."""
    return _outcome_score_exp(outcome, GCI_BEAT_FLOOR)


_EXP_SCORERS = {"v3": outcome_score_v3, "v4": outcome_score_v4}


def audit_deduction(
    outcomes: Sequence[GuidanceOutcome],
    audit_flags: Optional[Sequence[str]] = None,
) -> float:
    """D_shenanigans from explicit flags + auto guidance_withdrawal if any dropped."""
    flags = set(audit_flags or [])
    if any(o.dropped for o in outcomes):
        flags.add("guidance_withdrawal")
    return sum(AUDIT_PENALTY_PTS[f] for f in flags if f in AUDIT_PENALTY_PTS)


def _recency_weight(t_index: int) -> float:
    """t_index=1 is most recent → w = e^{-λ(t-1)}."""
    return math.exp(-GCI_LAMBDA * (t_index - 1))


def _periods_newest_first(outcomes: Sequence[GuidanceOutcome]) -> List[str]:
    from app.services.changes import sort_periods

    ordered = sort_periods(list({o.period for o in outcomes}))
    return list(reversed(ordered))


def _metric_score_v3(
    rows: List[GuidanceOutcome],
    period_rank: Dict[str, int],
    score_fn=outcome_score_v3,
) -> Optional[float]:
    """Recency-weighted multi-period S_m."""
    # One score per period (average if multiple rows in same period)
    by_period: Dict[str, List[float]] = {}
    conf_by_period: Dict[str, List[float]] = {}
    for o in rows:
        s = score_fn(o)
        if s is None:
            continue
        by_period.setdefault(o.period, []).append(s)
        conf_by_period.setdefault(o.period, []).append(min(max(o.confidence, 0.5), 1.0))
    if not by_period:
        return None
    num = 0.0
    den = 0.0
    for period, scores in by_period.items():
        t = period_rank.get(period)
        if t is None:
            continue
        s_bar = sum(scores) / len(scores)
        c_bar = sum(conf_by_period[period]) / len(conf_by_period[period])
        w = _recency_weight(t) * c_bar
        num += w * s_bar
        den += w
    if den <= 0:
        return None
    return num / den


def compute_company_gci_v3(
    outcomes: List[GuidanceOutcome],
    *,
    sector_mean: Optional[float] = None,
    metric_weights: Optional[Dict[str, float]] = None,
    audit_flags: Optional[Sequence[str]] = None,
    version: str = "v3",
) -> Optional[float]:
    result = compute_gci_v3_detail(
        outcomes,
        sector_mean=sector_mean,
        metric_weights=metric_weights,
        audit_flags=audit_flags,
        version=version,
    )
    return result.gci


def compute_company_gci_v4(
    outcomes: List[GuidanceOutcome],
    *,
    sector_mean: Optional[float] = None,
    metric_weights: Optional[Dict[str, float]] = None,
    audit_flags: Optional[Sequence[str]] = None,
) -> Optional[float]:
    return compute_company_gci_v3(
        outcomes,
        sector_mean=sector_mean,
        metric_weights=metric_weights,
        audit_flags=audit_flags,
        version="v4",
    )


def compute_gci_v3_detail(
    outcomes: List[GuidanceOutcome],
    *,
    sector_mean: Optional[float] = None,
    metric_weights: Optional[Dict[str, float]] = None,
    audit_flags: Optional[Sequence[str]] = None,
    version: str = "v3",
) -> GciComputeResult:
    """Full v3/v4 composite: φ-weighted metrics − D_shenanigans, optional sector shrinkage."""
    score_fn = _EXP_SCORERS.get(version, outcome_score_v3)
    scored_outcomes = [
        o
        for o in outcomes
        if not o.unmapped and score_fn(o) is not None
    ]
    periods = _periods_newest_first(scored_outcomes)
    period_rank = {p: i + 1 for i, p in enumerate(periods)}

    by_metric_rows: Dict[str, List[GuidanceOutcome]] = {}
    for o in outcomes:
        if o.unmapped:
            continue
        by_metric_rows.setdefault(o.metric, []).append(o)

    s_by_metric: Dict[str, float] = {}
    for metric, rows in by_metric_rows.items():
        sm = _metric_score_v3(rows, period_rank, score_fn)
        if sm is not None:
            s_by_metric[metric] = sm

    if not s_by_metric:
        # Only audit / dropped with no scored delivery — still no GCI
        return GciComputeResult(gci=None, version=version, by_metric={})

    weights = metric_weights or {}
    v_sum = 0.0
    weighted = 0.0
    for metric, sm in s_by_metric.items():
        v = float(weights.get(metric, 1.0))
        if v <= 0:
            continue
        v_sum += v
        weighted += v * sm
    if v_sum <= 0:
        return GciComputeResult(gci=None, version=version, by_metric=s_by_metric)

    gci_raw = weighted / v_sum
    d_shen = audit_deduction(outcomes, audit_flags)
    gci = max(0.0, min(100.0, gci_raw - d_shen))

    n_periods = len(periods)
    low_conf = n_periods < MIN_PERIODS_FULL_CONF
    if low_conf and sector_mean is not None:
        blend = n_periods / float(MIN_PERIODS_FULL_CONF)
        gci = blend * gci + (1.0 - blend) * float(sector_mean)
        gci = max(0.0, min(100.0, gci))

    return GciComputeResult(
        gci=round(gci, 1),
        version=version,
        low_confidence=low_conf,
        periods_used=n_periods,
        shenanigans_deduction=d_shen,
        by_metric={k: round(v, 1) for k, v in s_by_metric.items()},
    )


# ---------------------------------------------------------------------------
# Version-routed public API (default v4)
# ---------------------------------------------------------------------------


def outcome_score(
    outcome: GuidanceOutcome,
    *,
    version: Optional[str] = None,
) -> Optional[float]:
    ver = scorer_version(version)
    if ver == "v2":
        return outcome_score_v2(outcome)
    return _EXP_SCORERS[ver](outcome)


def compute_company_gci(
    outcomes: List[GuidanceOutcome],
    *,
    version: Optional[str] = None,
    sector_mean: Optional[float] = None,
    metric_weights: Optional[Dict[str, float]] = None,
    audit_flags: Optional[Sequence[str]] = None,
) -> Optional[float]:
    ver = scorer_version(version)
    if ver == "v2":
        return compute_company_gci_v2(outcomes)
    return compute_company_gci_v3(
        outcomes,
        sector_mean=sector_mean,
        metric_weights=metric_weights,
        audit_flags=audit_flags,
        version=ver,
    )


def metric_breakdown(
    outcomes: List[GuidanceOutcome],
    *,
    version: Optional[str] = None,
) -> Dict[str, float]:
    by_metric: Dict[str, List[GuidanceOutcome]] = {}
    for o in outcomes:
        by_metric.setdefault(o.metric, []).append(o)
    result: Dict[str, float] = {}
    ver = scorer_version(version)
    for metric, rows in by_metric.items():
        score = compute_company_gci(rows, version=ver)
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
    outcomes: List[GuidanceOutcome],
    periods: Optional[List[str]] = None,
    *,
    version: Optional[str] = None,
) -> List[Dict[str, Optional[float]]]:
    """Cumulative GCI after each period (ordered), with period-over-period change."""
    from app.services.changes import enrich_value_series, sort_periods

    ordered_periods = periods or sort_periods(list({o.period for o in outcomes}))
    ver = scorer_version(version)
    series: List[Dict[str, Any]] = []
    accumulated: List[GuidanceOutcome] = []
    for period in ordered_periods:
        accumulated.extend([o for o in outcomes if o.period == period])
        series.append({"period": period, "gci_score": compute_company_gci(accumulated, version=ver)})
    return enrich_value_series(series, period_key="period", value_key="gci_score")  # type: ignore[return-value]
