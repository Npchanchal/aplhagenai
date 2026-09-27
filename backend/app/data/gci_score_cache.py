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
        from app.services.gci_scoring import algorithm_id

        _CACHE = {"version": 1, "algorithm": algorithm_id(), "scores": {}}
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
    """Score every India listing with active gci_scoring version (seed or provisional).

    Each row includes calendar-aligned WoW / MoM / QoQ / YoY on the GCI level
    (demo multi-horizon path for provisional / thin PIT — never invents IR quotes).
    """
    from datetime import datetime, timezone

    from app.data.india_listings import india_equity_universe
    from app.data.seed import get_outcomes, list_companies
    from app.services.changes import change_bundle, multi_horizon_gci_series
    from app.services.gci_scoring import (
        algorithm_id,
        gci_trend_series,
        label_counts,
        metric_breakdown,
    )
    from app.services.guidance_flags import audited_company_gci
    from app.services.provisional_gci import QUALITY, score_provisional

    algo = algorithm_id()

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

    def _horizon_fields(cid: str, gci: Optional[float], trend: List[Dict[str, Any]]) -> Dict[str, Any]:
        if gci is None:
            return {
                "wow_pct": None,
                "mom_pct": None,
                "qoq_pct": None,
                "yoy_pct": None,
                "series_kind": None,
            }
        series = [
            (str(p.get("period") or ""), p.get("gci_score"))
            for p in (trend or [])
            if p.get("gci_score") is not None
        ]
        bundle = change_bundle(gci, series)
        need = [bundle.get("wow_pct"), bundle.get("mom_pct"), bundle.get("qoq_pct"), bundle.get("yoy_pct")]
        kind = "trend_pit"
        if sum(1 for x in need if x is not None) < 3:
            mh = multi_horizon_gci_series(cid, float(gci))
            filled = change_bundle(gci, mh)
            for key in ("wow_pct", "mom_pct", "qoq_pct", "yoy_pct"):
                if bundle.get(key) is None:
                    bundle[key] = filled.get(key)
            kind = "demo_multi_horizon"
        return {
            "wow_pct": bundle.get("wow_pct"),
            "mom_pct": bundle.get("mom_pct"),
            "qoq_pct": bundle.get("qoq_pct"),
            "yoy_pct": bundle.get("yoy_pct"),
            "series_kind": kind,
        }

    for stock in universe:
        cid = stock["id"]
        ticker = stock.get("ticker") or cid
        sector = stock.get("sector") or "Equity"
        seeded = seed_by_id.get(cid)
        if seeded is not None:
            outcomes = get_outcomes(cid)
            gci = audited_company_gci(outcomes)
            trend = gci_trend_series(outcomes)
            ch_pct, ch_h = _trend_change(trend)
            horizons = _horizon_fields(cid, gci, trend)
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
                **horizons,
            }
        else:
            rep = score_provisional(cid, ticker, sector)
            ch_pct, ch_h = _trend_change(rep.get("trend") or [])
            gci = rep.get("gci_score")
            horizons = _horizon_fields(cid, gci, rep.get("trend") or [])
            scores[cid] = {
                "gci_score": gci,
                "data_quality": QUALITY,
                "ticker": ticker,
                "sector": sector,
                "by_metric": rep.get("by_metric") or {},
                "label_counts": rep.get("label_counts") or {},
                "gci_change_pct": ch_pct,
                "gci_change_horizon": ch_h,
                "source": "provisional",
                "outcome_count": rep.get("outcome_count"),
                **horizons,
            }

    scored_n = sum(1 for s in scores.values() if s.get("gci_score") is not None)
    with_yoy = sum(1 for s in scores.values() if s.get("yoy_pct") is not None)
    with_all = sum(
        1
        for s in scores.values()
        if all(s.get(k) is not None for k in ("wow_pct", "mom_pct", "qoq_pct", "yoy_pct"))
    )
    payload = {
        "version": 2,
        "algorithm": algo,
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(scores),
        "scored_count": scored_n,
        "horizons_yoy_count": with_yoy,
        "horizons_full_count": with_all,
        "note": (
            "listing_provisional = deterministic demo outcomes scored with production "
            f"{algo}. WoW/MoM/QoQ/YoY from calendar-aligned multi-horizon GCI path "
            "(demo_multi_horizon when PIT is thin). Cite hand_labeled only."
        ),
        "scores": scores,
    }
    if os.environ.get("INTELLENS_SKIP_SCORE_CACHE_WRITE") != "1":
        save_cache(payload)
    else:
        global _CACHE
        _CACHE = payload
    return payload
