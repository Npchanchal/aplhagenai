"""Guidance audit flags, red alerts, and revision / restatement timeline.

On-wedge only: withdrawal, restatement, definition shift, miss, revise.
Not a Beneish / forensic shenanigans engine.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence, Tuple

from app.services.gci_scoring import (
    AUDIT_PENALTY_PTS,
    GuidanceOutcome,
    audit_deduction,
    classify_outcome,
    compute_company_gci,
)

# Human labels for UI chips
AUDIT_LABELS: Dict[str, str] = {
    "guidance_withdrawal": "Guidance withdrawn",
    "restatement": "Results restatement",
    "definition_shift": "Definition / basis shift",
}

AUDIT_SEVERITY: Dict[str, str] = {
    "guidance_withdrawal": "high",
    "restatement": "high",
    "definition_shift": "medium",
}


def _mid(o: GuidanceOutcome) -> float:
    if o.guided_low is not None and o.guided_high is not None:
        return (float(o.guided_low) + float(o.guided_high)) / 2.0
    return float(o.guided_value)


def _text_blob(o: GuidanceOutcome) -> str:
    return f"{o.source_ref or ''} {o.guided_text or ''} {o.quote_span or ''}".lower()


def collect_audit_flags(outcomes: Sequence[GuidanceOutcome]) -> List[str]:
    """Derive company-level audit flags from outcomes (evidence-linked heuristics)."""
    flags: set[str] = set()
    if any(o.dropped for o in outcomes):
        flags.add("guidance_withdrawal")

    for o in outcomes:
        blob = _text_blob(o)
        if "restat" in blob:
            flags.add("restatement")
        if "definition" in blob or "basis change" in blob or "reclassif" in blob:
            flags.add("definition_shift")

    # Mid-horizon material revision on a thread → definition_shift candidate
    by_thread: Dict[str, List[GuidanceOutcome]] = {}
    for o in outcomes:
        if o.thread_id and not o.dropped:
            by_thread.setdefault(o.thread_id, []).append(o)
    for rows in by_thread.values():
        ordered = sorted(rows, key=lambda r: (r.as_of or "", r.period))
        if len(ordered) < 2:
            continue
        for prev, cur in zip(ordered, ordered[1:]):
            if abs(_mid(cur) - _mid(prev)) >= 2.0:
                # Same metric thread with material move mid-cycle
                flags.add("definition_shift")
                break

    return sorted(flags)


def audited_company_gci(outcomes: Sequence[GuidanceOutcome], **kwargs: Any) -> Optional[float]:
    """Company GCI after audit deductions — the number every surface must show."""
    rows = list(outcomes)
    return compute_company_gci(rows, audit_flags=collect_audit_flags(rows), **kwargs)


def audit_summary(outcomes: Sequence[GuidanceOutcome]) -> Dict[str, Any]:
    flags = collect_audit_flags(outcomes)
    deduction = audit_deduction(outcomes, flags)
    badges = [
        {
            "flag": f,
            "label": AUDIT_LABELS.get(f, f.replace("_", " ").title()),
            "points": AUDIT_PENALTY_PTS.get(f, 0.0),
            "severity": AUDIT_SEVERITY.get(f, "medium"),
        }
        for f in flags
    ]
    return {
        "flags": flags,
        "deduction": round(float(deduction), 1),
        "badges": badges,
        "note": (
            "Audit deductions applied in GCI v3/v4 (withdrawal / restatement / definition shift). "
            "Not a forensic accruals or Beneish engine."
        ),
    }


def revision_timeline(
    outcomes: Sequence[GuidanceOutcome],
    *,
    company_id: str = "",
    ticker: str = "",
) -> List[Dict[str, Any]]:
    """Chronological guidance → revise → actual → drop/restatement events."""
    events: List[Dict[str, Any]] = []

    by_thread: Dict[str, List[GuidanceOutcome]] = {}
    singles: List[GuidanceOutcome] = []
    for o in outcomes:
        if o.thread_id:
            by_thread.setdefault(o.thread_id, []).append(o)
        else:
            singles.append(o)

    def _sort_key(o: GuidanceOutcome) -> Tuple:
        return (o.as_of or "9999", o.period, o.metric)

    for tid, rows in by_thread.items():
        ordered = sorted(rows, key=_sort_key)
        prev: Optional[GuidanceOutcome] = None
        for o in ordered:
            label = classify_outcome(o).value
            kind = "stated"
            detail = f"Stated {o.metric} band mid {_mid(o):.1f}"
            if prev is not None:
                d = _mid(o) - _mid(prev)
                if abs(d) >= 0.5:
                    kind = "revised_up" if d > 0 else "revised_down"
                    detail = (
                        f"Revised {o.metric} {_mid(prev):.1f} → {_mid(o):.1f} "
                        f"({'+' if d > 0 else ''}{d:.1f})"
                    )
                else:
                    kind = "reiterated"
                    detail = f"Reiterated {o.metric} near {_mid(o):.1f}"
            if o.dropped or label == "dropped":
                kind = "withdrawn"
                detail = f"Withdrew / dropped {o.metric} guidance ({o.period})"
            elif label in ("met", "exceeded", "missed") and o.actual_value is not None:
                kind = f"resolved_{label}"
                detail = (
                    f"{label.title()} {o.metric}: guided ~{_mid(o):.1f}, "
                    f"actual {o.actual_value}"
                )
            if "restat" in _text_blob(o):
                kind = "restatement"
                detail = f"Restatement signal on {o.metric} ({o.period})"

            severity = "low"
            if kind in ("withdrawn", "restatement", "resolved_missed"):
                severity = "high"
            elif kind.startswith("revised"):
                severity = "medium"

            events.append(
                {
                    "as_of": o.as_of or o.period,
                    "period": o.period,
                    "metric": o.metric,
                    "thread_id": tid,
                    "kind": kind,
                    "label": label,
                    "detail": detail,
                    "guided_value": o.guided_value,
                    "guided_low": o.guided_low,
                    "guided_high": o.guided_high,
                    "actual_value": o.actual_value,
                    "source_url": o.source_url,
                    "quote_span": o.quote_span,
                    "severity": severity,
                    "company_id": company_id,
                    "ticker": ticker,
                }
            )
            prev = o

    for o in sorted(singles, key=_sort_key):
        label = classify_outcome(o).value
        kind = "stated"
        if o.dropped or label == "dropped":
            kind = "withdrawn"
        elif label in ("met", "exceeded", "missed") and o.actual_value is not None:
            kind = f"resolved_{label}"
        if "restat" in _text_blob(o):
            kind = "restatement"
        events.append(
            {
                "as_of": o.as_of or o.period,
                "period": o.period,
                "metric": o.metric,
                "thread_id": None,
                "kind": kind,
                "label": label,
                "detail": f"{kind.replace('_', ' ').title()} — {o.metric} {o.period}",
                "guided_value": o.guided_value,
                "guided_low": o.guided_low,
                "guided_high": o.guided_high,
                "actual_value": o.actual_value,
                "source_url": o.source_url,
                "quote_span": o.quote_span,
                "severity": "high" if kind in ("withdrawn", "restatement", "resolved_missed") else "low",
                "company_id": company_id,
                "ticker": ticker,
            }
        )

    # Sort oldest → newest by as_of / period
    def _ek(e: Dict[str, Any]) -> Tuple:
        return (str(e.get("as_of") or ""), str(e.get("period") or ""), str(e.get("metric") or ""))

    return sorted(events, key=_ek)


def company_red_alerts(
    outcomes: Sequence[GuidanceOutcome],
    *,
    company_id: str,
    ticker: str,
) -> List[Dict[str, Any]]:
    """Per-company red alert cards for dossier (subset of global alert rail)."""
    alerts: List[Dict[str, Any]] = []
    summary = audit_summary(outcomes)
    for b in summary["badges"]:
        alerts.append(
            {
                "company_id": company_id,
                "ticker": ticker,
                "kind": b["flag"],
                "message": (
                    f"{ticker}: {b['label']} (−{b['points']:.0f} GCI pts audit)"
                ),
                "severity": b["severity"],
                "audit_flag": b["flag"],
                "deduction_pts": b["points"],
            }
        )
    for o in outcomes:
        label = classify_outcome(o).value
        if label == "missed":
            alerts.append(
                {
                    "company_id": company_id,
                    "ticker": ticker,
                    "kind": "large_miss",
                    "message": f"{ticker} missed {o.metric} for {o.period}",
                    "severity": "high",
                    "period": o.period,
                    "metric": o.metric,
                    "source_url": o.source_url,
                }
            )
        if label == "dropped":
            alerts.append(
                {
                    "company_id": company_id,
                    "ticker": ticker,
                    "kind": "guidance_dropped",
                    "message": f"{ticker} dropped {o.metric} ({o.period})",
                    "severity": "high",
                    "period": o.period,
                    "metric": o.metric,
                    "source_url": o.source_url,
                }
            )
    return alerts
