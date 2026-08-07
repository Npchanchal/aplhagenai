"""Cached GCI scores for full India NSE/BSE listing universe."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

_PATH = Path(__file__).with_name("gci_listing_scores.json")
_CACHE: Optional[Dict[str, Any]] = None


def cache_path() -> Path:
    return _PATH


def load_cache(*, force: bool = False) -> Dict[str, Any]:
    global _CACHE
    if _CACHE is not None and not force:
        return _CACHE
    if _PATH.exists():
        _CACHE = json.loads(_PATH.read_text(encoding="utf-8"))
    else:
        _CACHE = {"version": 1, "algorithm": "gci_scoring_v2", "scores": {}}
    return _CACHE


def save_cache(data: Dict[str, Any]) -> None:
    global _CACHE
    _CACHE = data
    _PATH.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")


def get_listing_score(company_id: str) -> Optional[Dict[str, Any]]:
    scores = load_cache().get("scores") or {}
    row = scores.get(company_id)
    return dict(row) if row else None


def clear_memory_cache() -> None:
    global _CACHE
    _CACHE = None


def build_india_gci_cache(*, limit: Optional[int] = None) -> Dict[str, Any]:
    """Score every India listing with gci_scoring v2 (seed outcomes or provisional)."""
    from datetime import datetime, timezone

    from app.data.india_listings import india_equity_universe
    from app.data.seed import get_outcomes, list_companies
    from app.services.gci_scoring import (
        compute_company_gci,
        gci_trend_series,
        label_counts,
        metric_breakdown,
    )
    from app.services.provisional_gci import QUALITY, score_provisional

    seed_by_id = {c["id"]: c for c in list_companies()}
    scores: Dict[str, Any] = {}
    universe = list(india_equity_universe())
    if limit is not None and limit > 0:
        universe = universe[:limit]

    def _trend_change(trend: List[Dict[str, Any]]):
        if not trend:
            return None, None
        last = trend[-1]
        return last.get("change_pct"), last.get("change_horizon")

    for stock in universe:
        cid = stock["id"]
        ticker = stock.get("ticker") or cid
        sector = stock.get("sector") or "Equity"
        seeded = seed_by_id.get(cid)
        if seeded is not None:
            outcomes = get_outcomes(cid)
            gci = compute_company_gci(outcomes)
            trend = gci_trend_series(outcomes)
            ch_pct, ch_h = _trend_change(trend)
            scores[cid] = {
                "gci_score": gci,
                "data_quality": seeded.get("data_quality", "demo_structured"),
                "ticker": ticker,
                "sector": sector,
                "by_metric": metric_breakdown(outcomes),
                "label_counts": label_counts(outcomes),
                "gci_change_pct": ch_pct,
                "gci_change_horizon": ch_h,
                "source": "seed",
            }
        else:
            rep = score_provisional(cid, ticker, sector)
            ch_pct, ch_h = _trend_change(rep.get("trend") or [])
            scores[cid] = {
                "gci_score": rep["gci_score"],
                "data_quality": QUALITY,
                "ticker": ticker,
                "sector": sector,
                "by_metric": rep.get("by_metric") or {},
                "label_counts": rep.get("label_counts") or {},
                "gci_change_pct": ch_pct,
                "gci_change_horizon": ch_h,
                "source": "provisional",
                "outcome_count": rep.get("outcome_count"),
            }

    scored_n = sum(1 for s in scores.values() if s.get("gci_score") is not None)
    payload = {
        "version": 1,
        "algorithm": "gci_scoring_v2",
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(scores),
        "scored_count": scored_n,
        "note": (
            "listing_provisional = deterministic demo outcomes scored with production "
            "gci_scoring v2. Cite hand_labeled only."
        ),
        "scores": scores,
    }
    if os.environ.get("INTELLENS_SKIP_SCORE_CACHE_WRITE") != "1":
        save_cache(payload)
    else:
        global _CACHE
        _CACHE = payload
    return payload
