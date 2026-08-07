"""Point-in-time GCI series warehouse for Tier 2/3 analytics.

Hand-labeled seed outcomes only yield a handful of ``as_of`` dates. Granger /
multi-horizon deltas need ≥12 aligned observations. This module builds an
honest **demo_pit_extension** quarterly series from the latest citeable GCI
level — labeled non-citeable, never mixed into evidence exports.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

from app.data.seed import get_outcomes, list_companies
from app.services.gci_scoring import compute_company_gci

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "pit_series.json"
TARGET_POINTS = 16  # ≥12 bivariate Granger; short of VAR(24) on purpose
SERIES_KIND = "demo_pit_extension"


def _stable_unit(seed: str) -> float:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return (int(digest[:8], 16) % 10000) / 10000.0


def _quarter_labels(n: int = TARGET_POINTS) -> List[str]:
    """Oldest → newest quarterly as_of labels ending near FY26."""
    # Start ~4 years back: 2022Q2 … 
    labels: List[str] = []
    year, q = 2022, 2
    for _ in range(n):
        labels.append(f"{year}-Q{q}")
        q += 1
        if q > 4:
            q = 1
            year += 1
    return labels


def build_company_pit_series(company_id: str, *, n: int = TARGET_POINTS) -> Dict[str, Any]:
    """Deterministic quarterly GCI path anchored on current seed GCI."""
    outcomes = get_outcomes(company_id)
    anchor = compute_company_gci(outcomes)
    if anchor is None:
        anchor = 70.0
    labels = _quarter_labels(n)
    scores: List[float] = []
    gci = float(anchor)
    # Walk backwards from anchor so the latest point ≈ current GCI
    trail = [gci]
    for i in range(1, n):
        u = _stable_unit(f"{company_id}|pit|{n-i}")
        # mean-reverting noise ±3 pts
        delta = (u - 0.5) * 6.0
        prev = max(35.0, min(98.0, trail[-1] - delta * 0.35))
        trail.append(prev)
    trail.reverse()  # oldest → newest
    # Force last to anchor
    trail[-1] = float(anchor)
    points = []
    for label, score in zip(labels, trail):
        points.append(
            {
                "as_of": label,
                "gci_score": round(score, 1),
                "citeable": False,
                "series_kind": SERIES_KIND,
            }
        )
        scores.append(round(score, 1))
    return {
        "company_id": company_id,
        "series_kind": SERIES_KIND,
        "n": len(points),
        "anchor_gci": round(float(anchor), 1),
        "citeable": False,
        "note": (
            "Synthetic quarterly PIT extension for analytics (Granger / horizons). "
            "Not hand-labeled evidence — never cite as IR source."
        ),
        "points": points,
        "gci_values": scores,
    }


def build_aligned_factor_series(
    company_id: str,
    gci_values: Sequence[float],
    *,
    by_metric: Optional[Dict[str, float]] = None,
    price_closes: Optional[Sequence[float]] = None,
) -> Dict[str, List[float]]:
    """Build factor series same length as GCI for LASSO→Granger."""
    n = len(gci_values)
    factors: Dict[str, List[float]] = {}
    if price_closes and len(price_closes) >= 3:
        closes = list(price_closes)
        if len(closes) >= n:
            aligned = closes[-n:]
        else:
            # pad front with first close
            aligned = [closes[0]] * (n - len(closes)) + closes
        factors["price"] = [float(x) for x in aligned]
        rets = [0.0]
        for i in range(1, n):
            a, b = aligned[i - 1], aligned[i]
            rets.append(0.0 if a == 0 else (b - a) / abs(a))
        factors["price_return"] = rets
    for metric, score in (by_metric or {}).items():
        # Metric delivery score with small deterministic drift (not constant pad)
        base = float(score)
        series = []
        for i in range(n):
            u = _stable_unit(f"{company_id}|{metric}|{i}")
            series.append(round(base + (u - 0.5) * 4.0, 2))
        factors[f"metric:{metric}"] = series
    return factors


def load_warehouse() -> Dict[str, Any]:
    if not DATA_PATH.exists():
        return {"version": 1, "series_kind": SERIES_KIND, "companies": {}}
    try:
        return json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"version": 1, "series_kind": SERIES_KIND, "companies": {}}


def save_warehouse(payload: Dict[str, Any]) -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def get_pit_series(company_id: str) -> Optional[Dict[str, Any]]:
    store = load_warehouse()
    row = (store.get("companies") or {}).get(company_id)
    if row and (row.get("n") or 0) >= 3:
        return row
    return None


def ensure_pit_series(company_id: str, *, n: int = TARGET_POINTS) -> Dict[str, Any]:
    existing = get_pit_series(company_id)
    if existing and existing.get("n", 0) >= n:
        return existing
    built = build_company_pit_series(company_id, n=n)
    store = load_warehouse()
    companies = store.setdefault("companies", {})
    companies[company_id] = built
    store["series_kind"] = SERIES_KIND
    store["version"] = 1
    save_warehouse(store)
    return built


def ensure_sensex_pit_warehouse(*, limit: Optional[int] = None) -> Dict[str, Any]:
    cos = [c for c in list_companies() if c.get("data_quality") == "hand_labeled"]
    if limit is not None:
        cos = cos[:limit]
    built = []
    for c in cos:
        built.append(ensure_pit_series(c["id"]))
    return {
        "ok": True,
        "companies": len(built),
        "min_n": min((r.get("n") or 0) for r in built) if built else 0,
        "target_points": TARGET_POINTS,
        "series_kind": SERIES_KIND,
        "path": str(DATA_PATH),
    }


def analytics_series_for(company_id: str) -> Tuple[List[float], List[Dict[str, Any]]]:
    """Prefer citeable PIT when ≥12; else hybrid (citeable tail + demo head) or full demo."""
    citeable_pts = _citeable_points(company_id)
    if len(citeable_pts) >= 12:
        vals = [float(p["gci_score"]) for p in citeable_pts]
        return vals, citeable_pts

    built = ensure_pit_series(company_id)
    points = [dict(p) for p in built["points"]]
    if len(citeable_pts) >= 4 and points:
        # Pin citeable scores onto the newest N warehouse slots (honest hybrid).
        n = min(len(citeable_pts), len(points))
        for i in range(n):
            src = citeable_pts[-(n - i)]
            tgt = points[-(n - i)]
            tgt["gci_score"] = src["gci_score"]
            tgt["as_of"] = src["as_of"]
            tgt["citeable"] = True
            tgt["series_kind"] = "hybrid_pit"
        for p in points:
            if not p.get("citeable"):
                p["series_kind"] = "hybrid_pit"
                p["citeable"] = False
        vals = [float(p["gci_score"]) for p in points]
        return vals, points

    vals = [float(p["gci_score"]) for p in points]
    return vals, points


def _citeable_points(company_id: str) -> List[Dict[str, Any]]:
    """Build citeable GCI points from outcome as_of / period chronology (no invented actuals)."""
    outcomes = get_outcomes(company_id)
    if not outcomes:
        return []
    dates = sorted({o.as_of for o in outcomes if o.as_of})
    raw: List[Dict[str, Any]] = []
    if len(dates) >= 2:
        for d in dates:
            subset = [o for o in outcomes if o.as_of and o.as_of <= d]
            score = compute_company_gci(subset)
            if score is None:
                continue
            raw.append(
                {
                    "as_of": d,
                    "gci_score": round(float(score), 1),
                    "citeable": True,
                    "series_kind": "citeable_pit",
                }
            )
    else:
        periods = sorted({o.period for o in outcomes if o.period})
        for i, period in enumerate(periods):
            subset = [o for o in outcomes if o.period in periods[: i + 1]]
            score = compute_company_gci(subset)
            if score is None:
                continue
            raw.append(
                {
                    "as_of": period,
                    "gci_score": round(float(score), 1),
                    "citeable": True,
                    "series_kind": "citeable_pit",
                }
            )
    return raw
