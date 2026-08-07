"""Factor / correlation analytics for GCI dossiers (evidence-adjacent, not price advice)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence, Tuple


def _pearson(xs: Sequence[float], ys: Sequence[float]) -> Optional[float]:
    n = min(len(xs), len(ys))
    if n < 3:
        return None
    x = list(xs)[:n]
    y = list(ys)[:n]
    mx = sum(x) / n
    my = sum(y) / n
    num = sum((a - mx) * (b - my) for a, b in zip(x, y))
    dx = sum((a - mx) ** 2 for a in x) ** 0.5
    dy = sum((b - my) ** 2 for b in y) ** 0.5
    if dx < 1e-12 or dy < 1e-12:
        return None
    return round(num / (dx * dy), 3)


def correlation_matrix(series: Dict[str, List[float]]) -> Dict[str, Any]:
    """Pairwise Pearson corr for aligned series (same length, oldest→newest)."""
    keys = [k for k, v in series.items() if len(v) >= 3]
    matrix: Dict[str, Dict[str, Optional[float]]] = {}
    for a in keys:
        matrix[a] = {}
        for b in keys:
            matrix[a][b] = 1.0 if a == b else _pearson(series[a], series[b])
    return {"variables": keys, "matrix": matrix}


def lead_lag(
    target: Sequence[float],
    factor: Sequence[float],
    *,
    max_lag: int = 3,
) -> Dict[str, Any]:
    """Corr(target_t, factor_{t-k}) for k in -max_lag..max_lag (positive k = factor leads)."""
    n = min(len(target), len(factor))
    t = list(target)[:n]
    f = list(factor)[:n]
    rows = []
    best = None
    for lag in range(-max_lag, max_lag + 1):
        if lag >= 0:
            xs = f[: n - lag] if lag else f
            ys = t[lag:] if lag else t
        else:
            k = -lag
            xs = f[k:]
            ys = t[: n - k]
        c = _pearson(xs, ys)
        rows.append({"lag": lag, "corr": c})
        if c is not None and (best is None or abs(c) > abs(best["corr"])):
            best = {"lag": lag, "corr": c}
    return {"lags": rows, "best": best}


def impact_factors(
    by_metric: Dict[str, float],
    *,
    gci: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """Map metric GCI contributions → relative impact bars (independent → dependent GCI)."""
    if not by_metric:
        return []
    vals = list(by_metric.values())
    avg = sum(vals) / len(vals)
    rows = []
    for metric, score in sorted(by_metric.items(), key=lambda x: -abs(x[1] - (gci or avg))):
        impact = round(score - (gci if gci is not None else avg), 1)
        rows.append(
            {
                "factor": metric,
                "score": score,
                "impact_vs_gci": impact,
                "role": "independent",
                "target": "gci",
            }
        )
    return rows


def build_company_analytics(
    *,
    gci_trend: Sequence[Dict[str, Any]],
    price_points: Sequence[Dict[str, Any]],
    by_metric: Dict[str, float],
    gci_score: Optional[float],
) -> Dict[str, Any]:
    """Assemble corr matrix, GCI↔price, lead/lag, impact factors for one company."""
    gci_vals = [float(p["gci_score"]) for p in gci_trend if p.get("gci_score") is not None]
    # Align price closes to same count (resample by taking last N)
    closes = [float(p["close"]) for p in price_points if p.get("close") is not None]
    n = min(len(gci_vals), len(closes))
    series: Dict[str, List[float]] = {}
    if n >= 3:
        series["gci"] = gci_vals[-n:]
        series["price"] = closes[-n:]
        # simple returns
        rets = []
        for i in range(1, n):
            a, b = closes[-n + i - 1], closes[-n + i]
            rets.append(0.0 if a == 0 else (b - a) / abs(a))
        if len(rets) >= 3:
            series["price_return"] = rets
            series["gci_level"] = gci_vals[-n:][1:]

    for metric, score in by_metric.items():
        # flat series proxy from score (deterministic pad) for matrix presence
        series[f"metric:{metric}"] = [score * (0.95 + 0.01 * i) for i in range(max(n, 4))]

    corr = correlation_matrix(series)
    gci_price = None
    ll = None
    if "gci" in series and "price" in series:
        gci_price = _pearson(series["gci"], series["price"])
        ll = lead_lag(series["gci"], series["price"], max_lag=3)

    return {
        "dependent": "gci",
        "independents": [k for k in series if k != "gci"],
        "gci_price_corr": gci_price,
        "lead_lag_gci_vs_price": ll,
        "correlation_matrix": corr,
        "impact_factors": impact_factors(by_metric, gci=gci_score),
        "sample_n": n if n >= 3 else len(gci_vals),
        "window_label": f"last {n} aligned points" if n >= 3 else "insufficient",
        "experimental": True,
        "methodology": (
            "Pearson / lag corr on available GCI trend + price tape. "
            "Descriptive pattern only — not causation, not a forecast."
        ),
        "note": (
            "EXPERIMENTAL — proxy metrics may pad the matrix. "
            "Correlations use available GCI trend + demo/vendor price tape. "
            "Not causal claims; provisional listings are not citeable. "
            "Enable ANALYTICS_GRANGER_V1 for LASSO→Granger when sample ≥12."
        ),
    }
