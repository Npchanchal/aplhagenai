"""Financial Modeling Prep (FMP) client — price history context only, never GCI math.

Auth: set INTELLENS_FMP_API_KEY or FMP_API_KEY in the environment.
Docs: https://site.financialmodelingprep.com/developer/docs/quickstart
Base: https://financialmodelingprep.com/stable/
"""

from __future__ import annotations

import json
import os
import time
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE_URL = "https://financialmodelingprep.com/stable"
_CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "fmp_cache"
_CACHE_TTL_SEC = 12 * 3600

# Index id → FMP symbol (caret indexes). Some EM symbols need a paid plan.
INDEX_SYMBOLS: Dict[str, str] = {
    "SPX": "^GSPC",
    "DJI": "^DJI",
    "NDX": "^NDX",
    "SENSEX": "^BSESN",
    "NIFTY50": "^NSEI",
    "NIFTYBANK": "^NSEBANK",
    "FTSE100": "^FTSE",
    "N225": "^N225",
    "HSI": "^HSI",
    "DAX": "^GDAXI",
    "CAC40": "^FCHI",
    "STOXX50": "^STOXX50E",
    "ASX200": "^AXJO",
    "KOSPI200": "^KS11",
    "IBOV": "^BVSP",
    "TSX60": "^GSPTSE",
    "SSEC": "^SSEC",
    "CSI300": "000300.SS",
}


def api_key() -> Optional[str]:
    _load_dotenv_once()
    raw = (
        os.environ.get("INTELLENS_FMP_API_KEY")
        or os.environ.get("FMP_API_KEY")
        or ""
    ).strip()
    return raw or None


_DOTENV_LOADED = False


def _load_dotenv_once() -> None:
    """Minimal .env loader (no python-dotenv dep). Never logs secret values."""
    global _DOTENV_LOADED
    if _DOTENV_LOADED:
        return
    _DOTENV_LOADED = True
    # backend/.env then repo root .env
    roots = [
        Path(__file__).resolve().parents[2] / ".env",
        Path(__file__).resolve().parents[3] / ".env",
    ]
    for path in roots:
        if not path.is_file():
            continue
        try:
            for line in path.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, _, v = line.partition("=")
                k, v = k.strip(), v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v
        except Exception:
            pass
        break


def enabled() -> bool:
    return bool(api_key())


def fmp_symbol_candidates_for_stock(ticker: str, market_id: Optional[str]) -> List[str]:
    t = (ticker or "").strip().upper()
    mid = (market_id or "").upper()
    if mid == "IN":
        return [f"{t}.NS", f"{t}.BO", t]
    if mid == "GB":
        return [f"{t}.L", t]
    if mid == "JP":
        return [t if t.endswith(".T") else f"{t}.T", t]
    return [t]


def fmp_symbol_for_stock(ticker: str, market_id: Optional[str]) -> str:
    return fmp_symbol_candidates_for_stock(ticker, market_id)[0]


def fmp_symbol_for_index(index_id: str) -> Optional[str]:
    return INDEX_SYMBOLS.get(index_id.upper())


def _cache_path(kind: str, symbol: str) -> Path:
    safe = symbol.replace("/", "_").replace("^", "IDX_")
    return _CACHE_DIR / f"{kind}_{safe}.json"


def _read_cache(path: Path) -> Optional[Any]:
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text())
        if time.time() - float(payload.get("ts", 0)) > _CACHE_TTL_SEC:
            return None
        return payload.get("data")
    except Exception:
        return None


def _write_cache(path: Path, data: Any) -> None:
    try:
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"ts": time.time(), "data": data}))
    except Exception:
        pass


def _get(path: str, params: Dict[str, Any]) -> Any:
    key = api_key()
    if not key:
        raise RuntimeError("FMP API key not configured")
    q = dict(params)
    q["apikey"] = key
    url = f"{BASE_URL}{path}?{urlencode(q)}"
    req = Request(url, headers={"User-Agent": "IntelLens/1.0"})
    with urlopen(req, timeout=20) as resp:  # noqa: S310 — fixed FMP host
        return json.loads(resp.read().decode("utf-8"))


def fetch_historical_eod(
    symbol: str,
    *,
    years: int = 5,
    use_cache: bool = True,
) -> List[Dict[str, Any]]:
    """Return list of {date, close, volume?} newest-last after sort."""
    cache = _cache_path("eod", f"{symbol}_{years}")
    if use_cache:
        hit = _read_cache(cache)
        if isinstance(hit, list) and hit:
            return hit

    end = date.today()
    start = end - timedelta(days=365 * max(1, years) + 14)
    try:
        raw = _get(
            "/historical-price-eod/light",
            {"symbol": symbol, "from": start.isoformat(), "to": end.isoformat()},
        )
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")[:300]
        raise RuntimeError(f"FMP HTTP {e.code} for {symbol}: {body}") from e
    except URLError as e:
        raise RuntimeError(f"FMP network error for {symbol}: {e}") from e

    if isinstance(raw, dict) and raw.get("Error Message"):
        raise RuntimeError(str(raw.get("Error Message")))
    if not isinstance(raw, list):
        raise RuntimeError(f"Unexpected FMP payload for {symbol}")

    points: List[Dict[str, Any]] = []
    for row in raw:
        d = row.get("date")
        # light endpoint uses "price"; full uses "close"
        close = row.get("close", row.get("price"))
        if d is None or close is None:
            continue
        points.append(
            {
                "date": str(d)[:10],
                "close": round(float(close), 4),
                "volume": int(row["volume"]) if row.get("volume") is not None else None,
            }
        )
    points.sort(key=lambda p: p["date"])
    if use_cache and points:
        _write_cache(cache, points)
    return points


def downsample_monthly(points: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Keep last observation per YYYY-MM for chart density."""
    by_month: Dict[str, Dict[str, Any]] = {}
    for p in points:
        key = p["date"][:7]
        by_month[key] = p
    return [by_month[k] for k in sorted(by_month.keys())]


def history_bundle(
    symbol: str,
    *,
    years: int = 5,
) -> Optional[Dict[str, Any]]:
    """Normalized history for market_history consumers, or None on failure."""
    if not enabled():
        return None
    try:
        daily = fetch_historical_eod(symbol, years=years)
        monthly = downsample_monthly(daily)
        if len(monthly) < 2:
            return None
        first, last = monthly[0]["close"], monthly[-1]["close"]
        change_pct = round(((last / first) - 1.0) * 100, 2) if first else None
        return {
            "symbol": symbol,
            "points": monthly,
            "point_count": len(monthly),
            "last": last,
            "change_pct": change_pct,
            "kind": "fmp_eod",
            "provider": "financialmodelingprep",
            "note": (
                "End-of-day prices via Financial Modeling Prep. "
                "Context only — not an input to GCI scoring."
            ),
            "data_quality": "vendor_eod",
        }
    except Exception:
        return None


def history_bundle_for_stock(
    ticker: str, market_id: Optional[str], *, years: int = 5
) -> Optional[Dict[str, Any]]:
    for sym in fmp_symbol_candidates_for_stock(ticker, market_id):
        hit = history_bundle(sym, years=years)
        if hit:
            return hit
    return None
