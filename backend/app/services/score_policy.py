"""Which companies may carry a public GCI number, and how confident that number is.

Only analyst-reviewed, source-cited outcomes (``hand_labeled``) are scored.
Demo seed and provisional listing outcomes are placeholders; companies built on
them show "Not yet scored" instead of a number.

Confidence tiers (plan W1.3, rule `index-integrity`) — every published score
carries one, and only *established* / *deep* scores are ranked publicly:

- ``provisional``  — < 3 closed periods, or only 1 metric
- ``established``  — ≥ 3 closed periods and ≥ 2 metrics
- ``deep``         — ≥ 5 closed periods and ≥ 2 metrics

``metrics`` here means metrics with at least one closed, analyst-reviewed result
— composite *and* context-only metrics (decision D-tier, 2026-09-29). Breadth of
evidence is what the tier measures; whether a metric moves the composite is a
separate question answered by ``MIN_CLOSED_PERIODS_PER_METRIC``.
"""

from __future__ import annotations

from typing import Iterable, Optional

SCOREABLE_QUALITIES = frozenset({"hand_labeled"})
NOT_SCORED_STATUS = "not_yet_scored"

TIER_PROVISIONAL = "provisional"
TIER_ESTABLISHED = "established"
TIER_DEEP = "deep"
RANKABLE_TIERS = frozenset({TIER_ESTABLISHED, TIER_DEEP})

ESTABLISHED_MIN_PERIODS = 3
DEEP_MIN_PERIODS = 5
MIN_METRICS_FOR_ESTABLISHED = 2

#: A metric with fewer closed periods than this is shown as context but does
#: not enter the composite (plan W1.4 — evidence-weighted composite).
MIN_CLOSED_PERIODS_PER_METRIC = 2
#: Evidence weight of a metric = min(closed periods, this cap).
METRIC_WEIGHT_CAP = 5


def is_scoreable(data_quality: Optional[str]) -> bool:
    return (data_quality or "").strip().lower() in SCOREABLE_QUALITIES


def publishable_score(score: Optional[float], data_quality: Optional[str]) -> Optional[float]:
    return score if is_scoreable(data_quality) else None


def confidence_tier(*, closed_periods: int, metrics_scored: int) -> Optional[str]:
    """Tier for a published score; ``None`` when there is nothing to score."""
    if closed_periods <= 0 or metrics_scored <= 0:
        return None
    if metrics_scored < MIN_METRICS_FOR_ESTABLISHED or closed_periods < ESTABLISHED_MIN_PERIODS:
        return TIER_PROVISIONAL
    if closed_periods >= DEEP_MIN_PERIODS:
        return TIER_DEEP
    return TIER_ESTABLISHED


def is_rankable(tier: Optional[str]) -> bool:
    return tier in RANKABLE_TIERS


PENDING_GUIDANCE_CITE = "pending_guidance_cite"


def _filled(*vals: object) -> bool:
    return all(bool(str(v or "").strip()) for v in vals)


def is_dual_cited(outcome: object) -> bool:
    """Promise citation + actual citation, each with URL, quote, and as-of date."""
    g = outcome.get if isinstance(outcome, dict) else lambda k, d=None: getattr(outcome, k, d)
    return _filled(
        g("guidance_source_url"),
        g("guidance_quote"),
        g("guidance_as_of"),
        g("source_url"),
        g("quote_span"),
        g("as_of"),
    )


def is_pending_guidance_cite(outcome: object) -> bool:
    """Closed row that has an actual citation but no promise citation — cannot score.

    Math-only fixtures with no ``source_url`` are not production rows and still score.
    """
    g = outcome.get if isinstance(outcome, dict) else lambda k, d=None: getattr(outcome, k, d)
    if g("unmapped") or g("dropped"):
        return False
    if g("actual_value") is None:
        return False
    has_actual = _filled(g("source_url"), g("quote_span"), g("as_of"))
    has_guidance = _filled(g("guidance_source_url"), g("guidance_quote"), g("guidance_as_of"))
    return bool(has_actual and not has_guidance)


def is_source_verify_fail(outcome: object) -> bool:
    """Quote was checked against the filing and is not on the page (W2.7)."""
    g = outcome.get if isinstance(outcome, dict) else lambda k, d=None: getattr(outcome, k, d)
    if g("source_verified") is False:
        return True
    return g("citeable") is False and bool(g("source_verify_fail"))


def is_unreviewed(outcome: object) -> bool:
    """Dual-cited closed row with no reviewer stamp (W2.5) — cannot score."""
    if is_pending_guidance_cite(outcome):
        return False
    if not is_dual_cited(outcome):
        return False
    g = outcome.get if isinstance(outcome, dict) else lambda k, d=None: getattr(outcome, k, d)
    return not _filled(g("reviewed_by"), g("reviewed_at"))


def excluded_from_score(outcome: object) -> bool:
    """Production-shaped closed row that must not enter the composite."""
    return (
        is_pending_guidance_cite(outcome)
        or is_unreviewed(outcome)
        or is_source_verify_fail(outcome)
    )


def closed_period_count(outcomes: Iterable) -> int:
    """Distinct reporting periods with a closed (non-pending) outcome."""
    periods = set()
    for o in outcomes:
        status = getattr(o, "status", None) or (o.get("status") if isinstance(o, dict) else None)
        period = getattr(o, "period", None) or (o.get("period") if isinstance(o, dict) else None)
        if status and status != "pending" and period:
            periods.add(period)
    return len(periods)
