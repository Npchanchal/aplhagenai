"""GCI coverage status for every listing — a typed cell, never an invented number.

Statuses:
- scored — publishable GCI exists
- open_period — guidance on file, result not yet reported
- filing_in_review — documents or unlabeled promises exist; no number yet
- no_quantified_guidance — lookback completed; no metric+number promise found
- listed_only — on the NSE/BSE master, ingest not yet run
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

SCORED = "scored"
OPEN_PERIOD = "open_period"
FILING_IN_REVIEW = "filing_in_review"
NO_QUANTIFIED_GUIDANCE = "no_quantified_guidance"
LISTED_ONLY = "listed_only"

COVERAGE_STATUSES = frozenset(
    {SCORED, OPEN_PERIOD, FILING_IN_REVIEW, NO_QUANTIFIED_GUIDANCE, LISTED_ONLY}
)

# Public labels — plain finance English (rule public-copy-voice).
COVERAGE_LABELS = {
    SCORED: "Scored",
    OPEN_PERIOD: "Open period",
    FILING_IN_REVIEW: "Filing in review",
    NO_QUANTIFIED_GUIDANCE: "No quantified guidance",
    LISTED_ONLY: "Listed only",
}

_CACHE: Optional[Dict[str, Any]] = None


def _store_path() -> Path:
    override = os.environ.get("INTELLENS_DATA_DIR", "").strip()
    base = Path(override) if override else Path(__file__).resolve().parents[1] / "data"
    base.mkdir(parents=True, exist_ok=True)
    return base / "coverage_status.json"


def load_coverage(*, force: bool = False) -> Dict[str, Any]:
    global _CACHE
    if _CACHE is not None and not force:
        return _CACHE
    path = _store_path()
    if path.exists():
        try:
            _CACHE = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            _CACHE = {"companies": {}}
    else:
        _CACHE = {"companies": {}}
    _CACHE.setdefault("companies", {})
    return _CACHE


def save_coverage(data: Optional[Dict[str, Any]] = None) -> None:
    global _CACHE
    blob = data if data is not None else load_coverage()
    _CACHE = blob
    path = _store_path()
    path.write_text(json.dumps(blob, indent=2) + "\n", encoding="utf-8")


def clear_coverage_memory() -> None:
    global _CACHE
    _CACHE = None


def reset_coverage() -> None:
    """Wipe persisted coverage stamps (tests)."""
    global _CACHE
    _CACHE = {"companies": {}}
    path = _store_path()
    path.write_text('{"companies": {}}\n', encoding="utf-8")


def stamp_coverage(
    company_id: str,
    status: str,
    *,
    reason: str = "",
    lookback_complete: bool = False,
) -> Dict[str, Any]:
    if status not in COVERAGE_STATUSES:
        raise ValueError(f"unknown coverage status: {status}")
    blob = load_coverage()
    prior = blob["companies"].get(company_id) or {}
    row = {
        "status": status,
        "reason": reason,
        "lookback_complete": lookback_complete,
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }
    if prior.get("last_discovery"):
        row["last_discovery"] = prior["last_discovery"]
    blob["companies"][company_id] = row
    save_coverage(blob)
    return row


def note_discovery(company_id: str) -> None:
    """Record that filings were searched today; keeps any stamped status."""
    blob = load_coverage()
    row = blob["companies"].setdefault(company_id, {"status": LISTED_ONLY})
    row["last_discovery"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    save_coverage(blob)


def persisted_row(company_id: str) -> Dict[str, Any]:
    return dict((load_coverage().get("companies") or {}).get(company_id) or {})


def _has_usable_docs(company_id: str) -> bool:
    try:
        from app.data import doc_store
    except Exception:
        return False
    for doc in doc_store.list_documents(company_id=company_id, hydrate=False):
        text = (doc.get("text") or "").lower()
        if doc.get("source") == "hand_labeled_period_pack":
            continue
        if "auto corpus pack" in text:
            continue
        if not (doc.get("text") or "").strip():
            continue
        return True
    return False


def published_status(company_id: str) -> str:
    """Status using the published score, for callers without a score in hand.

    Companies with outcome rows are scored live (binds land there first); other
    listings use the listing cache.
    """
    row: Dict[str, Any] = {}
    try:
        from app.data.seed import get_data, get_outcomes
        from app.services.gci_scoring import compute_company_gci
        from app.services.score_policy import is_scoreable

        company = next((c for c in get_data()["companies"] if c["id"] == company_id), None)
        if company is not None and is_scoreable(company.get("data_quality")):
            row = {
                "gci_score": compute_company_gci(get_outcomes(company_id)),
                "data_quality": company.get("data_quality"),
            }
        if row.get("gci_score") is None:
            from app.data.gci_score_cache import get_listing_score

            row = get_listing_score(company_id) or {}
    except Exception:
        row = {}
    return coverage_status_for(
        company_id,
        score=row.get("gci_score"),
        data_quality=row.get("data_quality") if row.get("gci_score") is not None else None,
    )


def _outcomes_for(company_id: str, outcomes: Optional[Iterable[Any]]) -> List[Any]:
    if outcomes is not None:
        return list(outcomes)
    try:
        from app.data.seed import get_data

        raw = (get_data().get("outcomes") or {}).get(company_id) or []
        return list(raw)
    except Exception:
        return []


def coverage_status_for(
    company_id: str,
    *,
    score: Optional[float] = None,
    outcomes: Optional[Iterable[Any]] = None,
    data_quality: Optional[str] = None,
) -> str:
    """Live status. A number always wins; persisted no-guidance only after lookback."""
    from app.services.score_policy import is_scoreable

    if score is not None and (data_quality is None or is_scoreable(data_quality)):
        return SCORED

    rows = _outcomes_for(company_id, outcomes)
    persisted = persisted_row(company_id)

    open_period = False
    distinct_unbound = False
    for row in rows:
        g = row.get if isinstance(row, dict) else lambda k, d=None: getattr(row, k, d)
        actual = g("actual_value")
        if actual is None and (
            g("guided_value") is not None
            or str(g("guidance_quote") or "").strip()
            or str(g("guidance_source_url") or "").strip()
        ):
            open_period = True
            continue
        reviewed = bool(str(g("reviewed_by") or "").strip())
        if reviewed:
            continue
        try:
            from app.services.guidance_review import _promise_distinct

            if isinstance(row, dict) and _promise_distinct(row):
                distinct_unbound = True
        except Exception:
            if actual is not None and g("guided_value") is not None:
                try:
                    if abs(float(g("guided_value")) - float(actual)) >= 0.05:
                        distinct_unbound = True
                except (TypeError, ValueError):
                    pass

    if open_period:
        return OPEN_PERIOD
    if distinct_unbound:
        return FILING_IN_REVIEW
    if persisted.get("lookback_complete") and persisted.get("status") == NO_QUANTIFIED_GUIDANCE:
        return NO_QUANTIFIED_GUIDANCE
    if _has_usable_docs(company_id) or rows:
        return FILING_IN_REVIEW
    if persisted.get("status") in COVERAGE_STATUSES and persisted.get("status") != LISTED_ONLY:
        return str(persisted["status"])
    return LISTED_ONLY


def coverage_label(status: Optional[str]) -> str:
    return COVERAGE_LABELS.get(status or "", COVERAGE_LABELS[LISTED_ONLY])


def coverage_counts(company_ids: Iterable[str]) -> Dict[str, int]:
    tallies = {k: 0 for k in COVERAGE_STATUSES}
    for cid in company_ids:
        status = published_status(cid)
        tallies[status] = tallies.get(status, 0) + 1
    tallies["total"] = sum(tallies[k] for k in COVERAGE_STATUSES)
    return tallies


def universe_coverage_counts(company_ids: Iterable[str], universe_ids: Iterable[str]) -> Dict[str, int]:
    """Tallies over the whole listing universe.

    Listings with no company record and no stamped status have nothing to
    classify and count as listed_only without a per-name walk.
    """
    known = set(company_ids) | set(load_coverage().get("companies") or {})
    universe = set(universe_ids)
    tallies = coverage_counts(sorted(known & universe))
    tallies[LISTED_ONLY] = tallies.get(LISTED_ONLY, 0) + len(universe - known)
    tallies["total"] = sum(tallies[k] for k in COVERAGE_STATUSES)
    return tallies
