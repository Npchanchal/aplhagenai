"""5-year market & stock history — FMP EOD when keyed, else deterministic demo.

Not used in GCI math. Vendor series labeled vendor_eod; demo stays honest.
"""

from __future__ import annotations

import hashlib
from datetime import date
from typing import Any, Dict, List, Optional

from app.data import markets as markets_data
from app.services import fmp_client

HISTORY_YEARS = 5
HISTORY_KIND_DEMO = "demo_deterministic"
HISTORY_NOTE_DEMO = (
    "Demo-generated monthly series for navigation context. "
    "Not live exchange data and not an input to GCI scoring."
)
HISTORY_NOTE_FMP = (
    "End-of-day prices via Financial Modeling Prep (when API key set). "
    "Context only — not an input to GCI scoring. Falls back to demo if vendor "
    "plan blocks the symbol (e.g. some India NSE tickers on free tiers)."
)


def _seed_int(key: str) -> int:
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def _rng(key: str) -> List[float]:
    """Simple LCG stream from seed — stable across runs."""
    x = _seed_int(key) or 1
    out: List[float] = []
    for _ in range(120):
        x = (1103515245 * x + 12345) % (2**31)
        out.append(x / (2**31))
    return out


def _month_ends(years: int = HISTORY_YEARS) -> List[date]:
    """Last calendar day-ish of each month for the trailing `years` window."""
    today = date.today().replace(day=1)
    points: List[date] = []
    y, m = today.year, today.month
    for _ in range(years * 12):
        m -= 1
        if m == 0:
            m = 12
            y -= 1
        points.append(date(y, m, 28))
    points.reverse()
    return points


def _series(
    key: str,
    *,
    base: float,
    years: int = HISTORY_YEARS,
    drift: float = 0.006,
    vol: float = 0.04,
) -> List[Dict[str, Any]]:
    months = _month_ends(years)
    rnd = _rng(key)
    price = base
    rows: List[Dict[str, Any]] = []
    for i, d in enumerate(months):
        shock = (rnd[i % len(rnd)] - 0.48) * vol
        price = max(1.0, price * (1.0 + drift + shock))
        vol_shares = round(50_000 + rnd[(i + 3) % len(rnd)] * 2_500_000)
        rows.append(
            {
                "date": d.isoformat(),
                "close": round(price, 2),
                "volume": vol_shares,
            }
        )
    return rows


def _fundamentals(key: str, years: int = HISTORY_YEARS) -> List[Dict[str, Any]]:
    rnd = _rng(f"fund:{key}")
    end_year = date.today().year
    rows = []
    for i in range(years):
        fy = end_year - years + i + 1
        rows.append(
            {
                "fiscal_year": f"FY{str(fy)[-2:]}",
                "revenue_growth_pct": round(2 + rnd[i] * 14 - 2, 1),
                "operating_margin_pct": round(8 + rnd[i + 5] * 18, 1),
            }
        )
    return rows


def _quality_for_market(market_id: str) -> str:
    return "demo_structured" if market_id.upper() == "IN" else "market_scaffold"


def index_base_price(index_id: str) -> float:
    bases = {
        "SENSEX": 55000.0,
        "NIFTY50": 18000.0,
        "NIFTYBANK": 42000.0,
        "SPX": 4200.0,
        "DJI": 34000.0,
        "NDX": 14000.0,
        "FTSE100": 7500.0,
        "N225": 28000.0,
        "TOPIX": 1900.0,
        "HSI": 20000.0,
        "CSI300": 3800.0,
        "SSEC": 3100.0,
        "STOXX50": 4100.0,
        "DAX": 15000.0,
        "CAC40": 7000.0,
        "STI": 3200.0,
        "ASX200": 7000.0,
        "KOSPI200": 320.0,
        "IBOV": 110000.0,
        "TSX60": 1200.0,
    }
    return bases.get(index_id.upper(), 1000.0 + (_seed_int(index_id) % 5000))


def stock_base_price(stock_id: str) -> float:
    return 20.0 + (_seed_int(stock_id) % 480)


def _apply_vendor(base: Dict[str, Any], vendor: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(base)
    out["points"] = vendor["points"]
    out["point_count"] = vendor["point_count"]
    out["last"] = vendor["last"]
    out["change_pct"] = vendor["change_pct"]
    out["kind"] = vendor["kind"]
    out["note"] = vendor["note"]
    out["data_quality"] = vendor.get("data_quality", "vendor_eod")
    out["provider"] = vendor.get("provider")
    out["fmp_symbol"] = vendor.get("symbol")
    return out


def get_index_history(index_id: str, years: int = HISTORY_YEARS) -> Optional[Dict[str, Any]]:
    ix = markets_data.get_index_raw(index_id)
    if ix is None:
        return None
    years = max(1, min(years, 10))
    points = _series(
        f"index:{ix['id']}",
        base=index_base_price(ix["id"]),
        years=years,
        drift=0.005,
        vol=0.035,
    )
    first, last = points[0]["close"], points[-1]["close"]
    change_pct = round(((last / first) - 1.0) * 100, 2) if first else None
    row: Dict[str, Any] = {
        "index_id": ix["id"],
        "market_id": ix["market_id"],
        "name": ix["name"],
        "ticker": ix["ticker"],
        "years": years,
        "points": points,
        "point_count": len(points),
        "last": last,
        "change_pct": change_pct,
        "data_quality": _quality_for_market(ix["market_id"]),
        "kind": HISTORY_KIND_DEMO,
        "note": HISTORY_NOTE_DEMO,
    }
    sym = fmp_client.fmp_symbol_for_index(ix["id"])
    if sym:
        vendor = fmp_client.history_bundle(sym, years=years)
        if vendor:
            return _apply_vendor(row, vendor)
    return row


def get_market_history(
    market_id: str, index_id: Optional[str] = None, years: int = HISTORY_YEARS
) -> Optional[Dict[str, Any]]:
    market = markets_data.get_market(market_id)
    if market is None:
        return None
    indexes = markets_data.list_indexes(market_id)
    if not indexes:
        return None
    chosen = None
    if index_id:
        chosen = next((i for i in indexes if i["id"] == index_id.upper()), None)
    if chosen is None:
        chosen = indexes[0]
    hist = get_index_history(chosen["id"], years=years)
    if hist is None:
        return None
    return {
        "market_id": market["id"],
        "market_name": market["name"],
        "currency": market["currency"],
        "index": hist,
        "kind": hist.get("kind", HISTORY_KIND_DEMO),
        "note": hist.get("note", HISTORY_NOTE_DEMO),
    }


def get_stock_history(stock_id: str, years: int = HISTORY_YEARS) -> Optional[Dict[str, Any]]:
    years = max(1, min(years, 10))
    stock = markets_data.get_stock(stock_id)
    if stock is None:
        return None

    points = _series(
        f"stock:{stock_id}",
        base=stock_base_price(stock_id),
        years=years,
        drift=0.007,
        vol=0.055,
    )
    first, last = points[0]["close"], points[-1]["close"]
    change_pct = round(((last / first) - 1.0) * 100, 2) if first else None
    row: Dict[str, Any] = {
        "stock_id": stock["id"],
        "name": stock["name"],
        "ticker": stock["ticker"],
        "market_id": stock.get("market_id"),
        "index_ids": stock.get("index_ids", []),
        "years": years,
        "points": points,
        "point_count": len(points),
        "last": last,
        "change_pct": change_pct,
        "fundamentals": _fundamentals(stock_id, years=years),
        "data_quality": stock.get(
            "data_quality", _quality_for_market(stock.get("market_id", "US"))
        ),
        "kind": HISTORY_KIND_DEMO,
        "note": HISTORY_NOTE_DEMO,
    }
    vendor = fmp_client.history_bundle_for_stock(
        stock["ticker"], stock.get("market_id"), years=years
    )
    if vendor:
        return _apply_vendor(row, vendor)
    return row


def history_meta() -> Dict[str, Any]:
    fmp_on = fmp_client.enabled()
    return {
        "history_years": HISTORY_YEARS,
        "history_kind": "fmp_eod_with_demo_fallback" if fmp_on else HISTORY_KIND_DEMO,
        "history_note": HISTORY_NOTE_FMP if fmp_on else HISTORY_NOTE_DEMO,
        "fmp_configured": fmp_on,
    }
