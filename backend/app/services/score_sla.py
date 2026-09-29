"""Filing-to-score latency (plan W2.8).

A scored row records three dates:

- *filing* — results-release date (`as_of` on the actual)
- *review* — analyst accept (`reviewed_at`)
- *publish* — score goes public (`published_at`; same calendar day as review
  unless a later ledger write is recorded)

Target: **5 India business days** (Monday–Friday; no holiday calendar) from
filing to publish, for filings dated on or after ``INSTRUMENTATION_DATE``.
Historical Sensex labels batch-reviewed on that date are reported as backfill
and are not measured against the target.

Refresh writes ``filing_seen`` events when a new IR document lands. ``accept_draft``
writes ``review_publish``. Observed medians for scored rows come from the
hand-labeled outcomes themselves, not from the event log.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from statistics import median
from typing import Any, Dict, Iterable, List, Optional

from app.services.score_policy import excluded_from_score, is_dual_cited

PIPELINE_PATH = Path(__file__).resolve().parent.parent / "data" / "score_pipeline.jsonl"

TARGET_BUSINESS_DAYS = 5
INSTRUMENTATION_DATE = date(2026, 9, 29)


def _parse_day(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    text = str(value).strip()[:10]
    try:
        return date.fromisoformat(text)
    except ValueError:
        return None


def business_days_between(start: date, end: date) -> int:
    """Inclusive of ``end``, exclusive of ``start``. Weekends skipped.

    Filing Friday, publish next Monday → 1. Same calendar day → 0.
    """
    if end <= start:
        return 0
    n = 0
    cursor = start
    while cursor < end:
        cursor += timedelta(days=1)
        if cursor.weekday() < 5:
            n += 1
    return n


def _g(outcome: object, key: str, default: Any = None) -> Any:
    if isinstance(outcome, dict):
        return outcome.get(key, default)
    return getattr(outcome, key, default)


def _is_scored_row(outcome: object) -> bool:
    if _g(outcome, "unmapped") or _g(outcome, "dropped"):
        return False
    if _g(outcome, "actual_value") is None:
        return False
    if not is_dual_cited(outcome):
        return False
    return not excluded_from_score(outcome)


def iter_scored_latencies(
    outcomes: Iterable[object],
    *,
    company_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for o in outcomes:
        if not _is_scored_row(o):
            continue
        filing = _parse_day(_g(o, "as_of"))
        reviewed = _parse_day(_g(o, "reviewed_at"))
        if filing is None or reviewed is None:
            continue
        published = reviewed
        bd = business_days_between(filing, published)
        live = filing >= INSTRUMENTATION_DATE
        rows.append(
            {
                "company_id": company_id,
                "period": _g(o, "period"),
                "metric": _g(o, "metric"),
                "filing_date": filing.isoformat(),
                "reviewed_at": reviewed.isoformat(),
                "published_at": published.isoformat(),
                "business_days": bd,
                "sample": "live" if live else "historical_backfill",
            }
        )
    return rows


def _median(values: List[int]) -> Optional[float]:
    if not values:
        return None
    return float(median(values))


def scored_latency_rows() -> List[Dict[str, Any]]:
    from app.data.seed import get_outcomes, list_companies

    rows: List[Dict[str, Any]] = []
    for c in list_companies():
        if c.get("data_quality") != "hand_labeled":
            continue
        cid = c["id"]
        rows.extend(iter_scored_latencies(get_outcomes(cid), company_id=cid))
    return rows


def sla_summary() -> Dict[str, Any]:
    rows = scored_latency_rows()
    live = [r for r in rows if r["sample"] == "live"]
    backfill = [r for r in rows if r["sample"] != "live"]
    live_days = [int(r["business_days"]) for r in live]
    backfill_days = [int(r["business_days"]) for r in backfill]
    all_days = [int(r["business_days"]) for r in rows]
    live_median = _median(live_days)
    backfill_median = _median(backfill_days)
    observed = live_median if live else backfill_median
    sample = "live" if live else ("historical_backfill" if backfill else "none")
    return {
        "target_business_days": TARGET_BUSINESS_DAYS,
        "instrumentation_date": INSTRUMENTATION_DATE.isoformat(),
        "unit": "India business days (Monday–Friday)",
        "scored_rows": len(rows),
        "observed_median_business_days": observed,
        "sample": sample,
        "live": {
            "n": len(live),
            "median_business_days": live_median,
            "note": (
                "Filings dated on or after the instrumentation date."
                if live
                else "No filings dated on or after 2026-09-29 have been scored yet."
            ),
        },
        "backfill": {
            "n": len(backfill),
            "median_business_days": backfill_median,
            "reviewed_on": "2026-09-29",
            "note": (
                "Batch-reviewed Sensex rows. Filing dates are the results-release "
                "dates; review happened in one labeling pass and is not the 5-day target."
            ),
        },
        "all_scored": {
            "n": len(rows),
            "median_business_days": _median(all_days),
        },
        "pipeline_events": _pipeline_event_count(),
        "policy": (
            f"Score published within {TARGET_BUSINESS_DAYS} business days of the "
            "results filing for filings dated on or after "
            f"{INSTRUMENTATION_DATE.isoformat()}."
        ),
    }


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _pipeline_event_count() -> int:
    if not PIPELINE_PATH.exists():
        return 0
    n = 0
    for line in PIPELINE_PATH.read_text(encoding="utf-8").splitlines():
        if line.strip():
            n += 1
    return n


def append_pipeline_event(event: Dict[str, Any]) -> None:
    PIPELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    row = dict(event)
    row.setdefault("recorded_at", _now_iso())
    with PIPELINE_PATH.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(row, ensure_ascii=False) + "\n")


def record_filings_from_crawl(crawl: Dict[str, Any]) -> int:
    """Stamp ``filing_seen`` for each newly ingested IR document."""
    written = 0
    seen_at = str(crawl.get("as_of") or _now_iso())[:10]
    for row in crawl.get("results") or []:
        if row.get("deduped") or row.get("action") in ("failed", "dry_run", "planned"):
            continue
        if not row.get("doc_id"):
            continue
        append_pipeline_event(
            {
                "kind": "filing_seen",
                "company_id": row.get("company_id"),
                "doc_id": row.get("doc_id"),
                "url": row.get("url"),
                "filing_date": seen_at,
                "action": row.get("action"),
            }
        )
        written += 1
    return written


def record_review_publish(
    *,
    company_id: str,
    period: str,
    metric: str,
    filing_date: Optional[str],
    reviewed_at: str,
    published_at: Optional[str] = None,
) -> None:
    filed = _parse_day(filing_date)
    reviewed = _parse_day(reviewed_at)
    published = _parse_day(published_at) or reviewed
    bd = (
        business_days_between(filed, published)
        if filed and published
        else None
    )
    live = bool(filed and filed >= INSTRUMENTATION_DATE)
    append_pipeline_event(
        {
            "kind": "review_publish",
            "company_id": company_id,
            "period": period,
            "metric": metric,
            "filing_date": filed.isoformat() if filed else filing_date,
            "reviewed_at": reviewed.isoformat() if reviewed else reviewed_at,
            "published_at": published.isoformat() if published else published_at,
            "business_days": bd,
            "sample": "live" if live else "historical_backfill",
        }
    )


def pipeline_events(*, kind: Optional[str] = None) -> List[Dict[str, Any]]:
    if not PIPELINE_PATH.exists():
        return []
    out: List[Dict[str, Any]] = []
    for line in PIPELINE_PATH.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw:
            continue
        try:
            row = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if kind and row.get("kind") != kind:
            continue
        out.append(row)
    return out
