"""LASSO selection → Granger causality (Tier 3 v1).

Pure-Python OLS + soft-threshold LASSO so CI needs no sklearn/statsmodels.
Sample gates: ≥12 bivariate, ≥24 before VAR claims.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Sequence, Tuple


MIN_OBS_BIVARIATE = 12
MIN_OBS_VAR = 24


def _mean(xs: Sequence[float]) -> float:
    return sum(xs) / len(xs) if xs else 0.0


def _pearson(xs: Sequence[float], ys: Sequence[float]) -> Optional[float]:
    n = min(len(xs), len(ys))
    if n < 3:
        return None
    x = list(xs)[:n]
    y = list(ys)[:n]
    mx, my = _mean(x), _mean(y)
    num = sum((a - mx) * (b - my) for a, b in zip(x, y))
    dx = math.sqrt(sum((a - mx) ** 2 for a in x))
    dy = math.sqrt(sum((b - my) ** 2 for b in y))
    if dx < 1e-12 or dy < 1e-12:
        return None
    return round(num / (dx * dy), 4)


def _diff(xs: Sequence[float]) -> List[float]:
    return [xs[i] - xs[i - 1] for i in range(1, len(xs))]


def adf_proxy_stationary(xs: Sequence[float]) -> Dict[str, Any]:
    """Cheap stationarity proxy: prefer first-diff when |AR(1)| is high."""
    if len(xs) < 6:
        return {"stationary": False, "reason": "short_series", "use_diff": True}
    # AR(1) coef via OLS on demeaned levels
    y = list(xs)[1:]
    x = list(xs)[:-1]
    mx, my = _mean(x), _mean(y)
    varx = sum((a - mx) ** 2 for a in x)
    if varx < 1e-12:
        return {"stationary": True, "ar1": 0.0, "use_diff": False}
    ar1 = sum((a - mx) * (b - my) for a, b in zip(x, y)) / varx
    use_diff = abs(ar1) > 0.85
    return {
        "stationary": not use_diff,
        "ar1": round(ar1, 4),
        "use_diff": use_diff,
        "note": "Proxy ADF — first-diff when |AR1|>0.85",
    }


def _soft_threshold(z: float, lam: float) -> float:
    if z > lam:
        return z - lam
    if z < -lam:
        return z + lam
    return 0.0


def lasso_select(
    target: Sequence[float],
    factors: Dict[str, Sequence[float]],
    *,
    max_keep: int = 5,
    lam: float = 0.15,
    max_iter: int = 200,
) -> List[Dict[str, Any]]:
    """Coordinate-descent LASSO on standardized factors (Elastic-Net-ready interface)."""
    n = len(target)
    if n < 3 or not factors:
        return []
    y = list(target)[:n]
    my = _mean(y)
    y_c = [v - my for v in y]
    names: List[str] = []
    cols: List[List[float]] = []
    for name, series in factors.items():
        if len(series) < n:
            continue
        col = list(series)[:n]
        m = _mean(col)
        sd = math.sqrt(sum((v - m) ** 2 for v in col) / n)
        if sd < 1e-12:
            continue
        names.append(name)
        cols.append([(v - m) / sd for v in col])
    if not names:
        # fall back to |corr| ranking
        ranked = []
        for name, series in factors.items():
            c = _pearson(target, series)
            if c is None:
                continue
            ranked.append({"factor": name, "abs_corr": abs(c), "corr": c, "coef": c})
        ranked.sort(key=lambda r: -r["abs_corr"])
        return ranked[:max_keep]

    p = len(names)
    beta = [0.0] * p
    for _ in range(max_iter):
        max_delta = 0.0
        for j in range(p):
            # partial residual
            r = []
            for i in range(n):
                pred = sum(beta[k] * cols[k][i] for k in range(p) if k != j)
                r.append(y_c[i] - pred)
            rho = sum(cols[j][i] * r[i] for i in range(n)) / n
            new_b = _soft_threshold(rho, lam)
            max_delta = max(max_delta, abs(new_b - beta[j]))
            beta[j] = new_b
        if max_delta < 1e-6:
            break

    rows = []
    for name, coef, col in zip(names, beta, cols):
        if abs(coef) < 1e-8:
            continue
        c = _pearson(y_c, col)
        rows.append(
            {
                "factor": name,
                "coef": round(coef, 4),
                "abs_coef": abs(coef),
                "corr": c,
                "abs_corr": abs(c) if c is not None else 0.0,
                "method": "lasso_cd",
            }
        )
    rows.sort(key=lambda r: -r["abs_coef"])
    if not rows:
        # keep top |corr| so UI always has candidates when series exist
        for name, col in zip(names, cols):
            c = _pearson(y_c, col)
            if c is None:
                continue
            rows.append(
                {
                    "factor": name,
                    "coef": 0.0,
                    "abs_coef": abs(c),
                    "corr": c,
                    "abs_corr": abs(c),
                    "method": "corr_fallback",
                }
            )
        rows.sort(key=lambda r: -r["abs_corr"])
    return rows[:max_keep]


def _ols_rss(y: Sequence[float], X: List[List[float]]) -> Tuple[float, int]:
    """Return (RSS, n) for y ~ X via normal equations (X includes intercept col)."""
    n = len(y)
    if not X or n == 0:
        return sum(v * v for v in y), n
    p = len(X[0])
    # XtX, Xty
    xtx = [[0.0] * p for _ in range(p)]
    xty = [0.0] * p
    for i in range(n):
        for a in range(p):
            xty[a] += X[i][a] * y[i]
            for b in range(p):
                xtx[a][b] += X[i][a] * X[i][b]
    # Gaussian elimination
    aug = [xtx[r][:] + [xty[r]] for r in range(p)]
    for col in range(p):
        pivot = max(range(col, p), key=lambda r: abs(aug[r][col]))
        if abs(aug[pivot][col]) < 1e-12:
            return sum(v * v for v in y), n  # singular → RSS of mean-zero y
        aug[col], aug[pivot] = aug[pivot], aug[col]
        div = aug[col][col]
        for j in range(col, p + 1):
            aug[col][j] /= div
        for r in range(p):
            if r == col:
                continue
            fac = aug[r][col]
            for j in range(col, p + 1):
                aug[r][j] -= fac * aug[col][j]
    beta = [aug[r][p] for r in range(p)]
    rss = 0.0
    for i in range(n):
        pred = sum(beta[j] * X[i][j] for j in range(p))
        e = y[i] - pred
        rss += e * e
    return rss, n


def _f_sf(f: float, dfn: int, dfd: int) -> float:
    """Survival function P(F > f) rough approximation via incomplete beta transform."""
    if dfd <= 0 or dfn <= 0 or f <= 0:
        return 1.0
    # Convert F to beta variable
    x = dfd / (dfd + dfn * f)
    # Regularized incomplete beta I_x(a,b) approx with continued fraction (limited)
    a = dfd / 2.0
    b = dfn / 2.0
    # For p-value we need I_x(a,b). Use simple Monte-free clamp via Wilson-Hilferty-ish
    # Prefer erfc-based chi2 approx for larger dfd
    try:
        # Fisher approximation: z ≈ ((1-2/9dfd)*F^(1/3) - (1-2/9dfn)) / sqrt(...)
        f13 = f ** (1.0 / 3.0)
        mu = 1.0 - 2.0 / (9.0 * dfd)
        nu = 1.0 - 2.0 / (9.0 * dfn)
        sig = math.sqrt(2.0 / (9.0 * dfn) + (f13 ** 2) * 2.0 / (9.0 * dfd))
        if sig < 1e-12:
            return 0.5
        z = (mu * f13 - nu) / sig
        # Φ(-z) ≈ erfc
        p = 0.5 * math.erfc(z / math.sqrt(2.0))
        return max(0.0, min(1.0, p))
    except Exception:
        return 0.5 if x > 0.5 else 0.1


def granger_pairwise(
    y: Sequence[float],
    x: Sequence[float],
    *,
    max_lag: int = 3,
) -> Dict[str, Any]:
    """Granger causality F-test on (optionally differenced) series."""
    if len(y) < MIN_OBS_BIVARIATE or len(x) < MIN_OBS_BIVARIATE:
        return {
            "ok": False,
            "reason": "insufficient_sample",
            "n": min(len(y), len(x)),
            "min_required": MIN_OBS_BIVARIATE,
        }
    n0 = min(len(y), len(x))
    y0 = list(y)[:n0]
    x0 = list(x)[:n0]
    sty = adf_proxy_stationary(y0)
    stx = adf_proxy_stationary(x0)
    use_diff = sty.get("use_diff") or stx.get("use_diff")
    if use_diff:
        y0 = _diff(y0)
        x0 = _diff(x0)
    n = min(len(y0), len(x0))
    y0, x0 = y0[:n], x0[:n]
    lag = max(1, min(max_lag, (n // 4) or 1))
    # Build lagged design from index lag .. n-1
    y_dep: List[float] = []
    X_r: List[List[float]] = []
    X_u: List[List[float]] = []
    for t in range(lag, n):
        y_dep.append(y0[t])
        row_r = [1.0] + [y0[t - k] for k in range(1, lag + 1)]
        row_u = row_r + [x0[t - k] for k in range(1, lag + 1)]
        X_r.append(row_r)
        X_u.append(row_u)
    if len(y_dep) < lag + 2:
        return {
            "ok": False,
            "reason": "insufficient_sample_after_lags",
            "n": n,
            "min_required": MIN_OBS_BIVARIATE,
        }
    rss_r, n_obs = _ols_rss(y_dep, X_r)
    rss_u, _ = _ols_rss(y_dep, X_u)
    dfn = lag
    dfd = n_obs - (1 + 2 * lag)
    if dfd <= 0 or rss_u <= 1e-15:
        f_stat = 0.0
        p_value = 1.0
    else:
        f_stat = ((rss_r - rss_u) / dfn) / (rss_u / dfd)
        f_stat = max(0.0, f_stat)
        p_value = _f_sf(f_stat, dfn, dfd)

    # Also report lag-wise cross-corr for interpretation (CCF aid)
    lags = []
    best = None
    for k in range(0, lag + 1):
        if k == 0:
            c = _pearson(y0, x0)
        else:
            c = _pearson(y0[k:], x0[:-k])
        row = {"lag": k, "corr": c}
        lags.append(row)
        if c is not None and (best is None or abs(c) > abs(best["corr"] or 0)):
            best = row

    return {
        "ok": True,
        "method": "granger_f_test",
        "note": (
            "Predictive precedence (Granger) — not causation, not a forecast, "
            "not investment advice."
        ),
        "n": n0,
        "n_used": n_obs,
        "max_lag": lag,
        "differenced": bool(use_diff),
        "stationarity": {"y": sty, "x": stx},
        "f_stat": round(f_stat, 4),
        "p_value": round(p_value, 4),
        "significant_0_05": p_value < 0.05,
        "rss_restricted": round(rss_r, 6),
        "rss_unrestricted": round(rss_u, 6),
        "lags": lags,
        "best": best,
        "ccf_note": "Cross-corr lags are interpretation aids under the F-test.",
    }


def _bh_fdr(p_values: List[float], alpha: float = 0.1) -> List[bool]:
    """Benjamini–Hochberg FDR mask."""
    m = len(p_values)
    if m == 0:
        return []
    order = sorted(range(m), key=lambda i: p_values[i])
    keep = [False] * m
    max_i = -1
    for rank, idx in enumerate(order, start=1):
        if p_values[idx] <= (rank / m) * alpha:
            max_i = rank
    for rank, idx in enumerate(order, start=1):
        if rank <= max_i:
            keep[idx] = True
    return keep


def impact_map_from_granger(tests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Directed edges where Granger passes FDR-controlled threshold."""
    pvals = [float(t.get("p_value") or 1.0) for t in tests if t.get("ok")]
    ok_tests = [t for t in tests if t.get("ok")]
    mask = _bh_fdr(pvals, alpha=0.1)
    edges = []
    for t, keep in zip(ok_tests, mask):
        if not keep and not t.get("significant_0_05"):
            continue
        if not keep:
            continue
        best = t.get("best") or {}
        edges.append(
            {
                "from": t.get("factor"),
                "to": "gci",
                "lag": best.get("lag"),
                "f_stat": t.get("f_stat"),
                "p_value": t.get("p_value"),
                "weight": round(1.0 - float(t.get("p_value") or 1.0), 3),
                "label": "Statistical precedence (Granger), not proven cause.",
            }
        )
    return edges


def build_granger_bundle(
    *,
    gci_series: Sequence[float],
    price_series: Sequence[float],
    factor_series: Optional[Dict[str, Sequence[float]]] = None,
) -> Dict[str, Any]:
    factors = dict(factor_series or {})
    if len(price_series) >= 3:
        factors.setdefault("price", price_series)
    selected = lasso_select(gci_series, factors) if factors else []
    tests: List[Dict[str, Any]] = []
    for row in selected:
        name = row["factor"]
        series = factors.get(name) or []
        tests.append({"factor": name, "selection": row, **granger_pairwise(gci_series, series)})
    # Always test price if present and not already selected
    if "price" in factors and not any(t.get("factor") == "price" for t in tests):
        tests.append(
            {
                "factor": "price",
                "selection": {"factor": "price", "method": "forced"},
                **granger_pairwise(gci_series, factors["price"]),
            }
        )
    edges = impact_map_from_granger(tests)
    return {
        "enabled": True,
        "dependent": "gci",
        "min_obs_bivariate": MIN_OBS_BIVARIATE,
        "min_obs_var": MIN_OBS_VAR,
        "var_ready": len(gci_series) >= MIN_OBS_VAR,
        "sample_n": len(gci_series),
        "lasso_selected": selected,
        "granger_tests": tests,
        "impact_map": edges,
        "disclaimer": (
            "Statistical precedence only — not investment advice, not causation, "
            "not a forecast. Analyst owns any prediction."
        ),
    }
