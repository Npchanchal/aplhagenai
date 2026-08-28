"""Real NSE / BSE equity masters (cached JSON under app/data/listings/).

GCI is NOT invented for these rows — only Sensex/Nifty seed outcomes score.
Listings power navigation (NSE_ALL / BSE_ALL / IN1000) with data_quality=listing_master.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from app.data.universe import NIFTY_EXTRA, SENSEX_30

_LISTINGS = Path(__file__).with_name("listings")

StockRow = Dict[str, Any]


def _slug(ticker: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "_", (ticker or "").lower()).strip("_")
    return s or "unknown"


@lru_cache(maxsize=1)
def _sensex_by_ticker() -> Dict[str, Tuple[str, str, str, str]]:
    return {t.upper(): (cid, name, t, sector) for cid, name, t, sector in SENSEX_30}


@lru_cache(maxsize=1)
def _nifty_extra_by_ticker() -> Dict[str, Tuple[str, str, str, str]]:
    return {t.upper(): (cid, name, t, sector) for cid, name, t, sector in NIFTY_EXTRA}


def _load_json(name: str) -> Dict[str, Any]:
    path = _LISTINGS / name
    if not path.exists():
        return {"count": 0, "rows": [], "source": None}
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def nse_meta() -> Dict[str, Any]:
    raw = _load_json("nse_equity.json")
    return {"count": int(raw.get("count") or len(raw.get("rows") or [])), "source": raw.get("source")}


@lru_cache(maxsize=1)
def bse_meta() -> Dict[str, Any]:
    raw = _load_json("bse_equity.json")
    return {"count": int(raw.get("count") or len(raw.get("rows") or [])), "source": raw.get("source")}


def _resolve_id_name_sector(symbol: str, name: str) -> Tuple[str, str, str, str]:
    """Return (id, name, ticker, sector) preferring Sensex / Nifty seed ids."""
    sym = (symbol or "").upper()
    if sym in _sensex_by_ticker():
        return _sensex_by_ticker()[sym]
    if sym in _nifty_extra_by_ticker():
        return _nifty_extra_by_ticker()[sym]
    return (f"nse_{_slug(sym)}", name or sym, sym, "Equity")


@lru_cache(maxsize=1)
def india_equity_universe() -> Tuple[StockRow, ...]:
    """Merged NSE + BSE equities; dual-listed share one id via ISIN/ticker."""
    nse_raw = _load_json("nse_equity.json").get("rows") or []
    bse_raw = _load_json("bse_equity.json").get("rows") or []

    by_id: Dict[str, StockRow] = {}
    isin_to_id: Dict[str, str] = {}

    for row in nse_raw:
        symbol = (row.get("symbol") or "").strip().upper()
        if not symbol:
            continue
        cid, name, ticker, sector = _resolve_id_name_sector(symbol, row.get("name") or symbol)
        quality = (
            "hand_labeled"
            if cid in {x[0] for x in SENSEX_30}
            else "demo_structured"
            if cid in {x[0] for x in NIFTY_EXTRA}
            else "listing_master"
        )
        isin = (row.get("isin") or "").strip().upper()
        entry: StockRow = {
            "id": cid,
            "market_id": "IN",
            "index_ids": ["NSE_ALL", "IN1000"],
            "name": name,
            "ticker": ticker,
            "sector": sector,
            "data_quality": quality,
            "exchange": "NSE",
            "isin": isin or None,
        }
        by_id[cid] = entry
        if isin:
            isin_to_id[isin] = cid

    for row in bse_raw:
        isin = (row.get("isin") or "").strip().upper()
        symbol = (row.get("symbol") or "").strip().upper()
        name = (row.get("name") or symbol or row.get("scrip_code") or "").strip()
        code = str(row.get("scrip_code") or "").strip()

        existing_id: Optional[str] = None
        if isin and isin in isin_to_id:
            existing_id = isin_to_id[isin]
        elif symbol:
            # ticker match against NSE / seed
            for cid, entry in by_id.items():
                if entry["ticker"].upper() == symbol:
                    existing_id = cid
                    break

        if existing_id and existing_id in by_id:
            ids = list(by_id[existing_id].get("index_ids") or [])
            if "BSE_ALL" not in ids:
                ids.append("BSE_ALL")
            by_id[existing_id]["index_ids"] = ids
            if by_id[existing_id].get("exchange") == "NSE":
                by_id[existing_id]["exchange"] = "NSE+BSE"
            continue

        cid = f"bse_{code or _slug(symbol)}"
        if cid in by_id:
            continue
        by_id[cid] = {
            "id": cid,
            "market_id": "IN",
            "index_ids": ["BSE_ALL", "IN1000"],
            "name": name,
            "ticker": symbol or code,
            "sector": "Equity",
            "data_quality": "listing_master",
            "exchange": "BSE",
            "isin": isin or None,
            "bse_scrip_code": code or None,
        }
        if isin:
            isin_to_id[isin] = cid

    # Sensex / Nifty membership overlays
    sensex_ids = {cid for cid, *_ in SENSEX_30}
    nifty_ids = sensex_ids | {cid for cid, *_ in NIFTY_EXTRA}
    bank_tickers = {"HDFCBANK", "ICICIBANK", "AXISBANK", "KOTAKBANK", "SBIN", "INDUSINDBK"}
    for cid, entry in by_id.items():
        ids = list(entry.get("index_ids") or [])
        if cid in sensex_ids:
            for ix in ("SENSEX", "NIFTY50"):
                if ix not in ids:
                    ids.append(ix)
        elif cid in nifty_ids:
            if "NIFTY50" not in ids:
                ids.append("NIFTY50")
        if entry.get("ticker", "").upper() in bank_tickers and "NIFTYBANK" not in ids:
            ids.append("NIFTYBANK")
        entry["index_ids"] = ids

    # Stable order: deep GCI first, then NSE ticker, then BSE-only
    deep = [by_id[c] for c, *_ in SENSEX_30 if c in by_id]
    deep += [by_id[c] for c, *_ in NIFTY_EXTRA if c in by_id and c not in sensex_ids]
    deep_ids = {r["id"] for r in deep}
    rest = sorted(
        (r for r in by_id.values() if r["id"] not in deep_ids),
        key=lambda r: (0 if "NSE_ALL" in r.get("index_ids", []) else 1, r.get("ticker") or ""),
    )
    return tuple(deep + rest)


def find_listing(company_id: str) -> Optional[StockRow]:
    cid = (company_id or "").strip()
    for row in india_equity_universe():
        if row["id"] == cid:
            return dict(row)
    return None


@lru_cache(maxsize=1)
def _listings_by_ticker() -> Dict[str, StockRow]:
    out: Dict[str, StockRow] = {}
    for row in india_equity_universe():
        ticker = (row.get("ticker") or "").strip().upper()
        if ticker and ticker not in out:
            out[ticker] = row
    return out


def find_listing_by_ticker(ticker: str) -> Optional[StockRow]:
    """NSE/BSE listing lookup by exchange symbol (e.g. 20MICRONS)."""
    key = (ticker or "").strip().upper()
    if not key:
        return None
    row = _listings_by_ticker().get(key)
    return dict(row) if row else None


def listing_counts() -> Dict[str, Any]:
    rows = india_equity_universe()
    nse = sum(1 for r in rows if "NSE_ALL" in r.get("index_ids", []))
    bse = sum(1 for r in rows if "BSE_ALL" in r.get("index_ids", []))
    return {
        "merged": len(rows),
        "nse": nse,
        "bse": bse,
        "nse_source": nse_meta().get("source"),
        "bse_source": bse_meta().get("source"),
        "nse_file_count": nse_meta().get("count"),
        "bse_file_count": bse_meta().get("count"),
    }


def clear_listing_caches() -> None:
    india_equity_universe.cache_clear()
    nse_meta.cache_clear()
    bse_meta.cache_clear()
    _sensex_by_ticker.cache_clear()
    _nifty_extra_by_ticker.cache_clear()
    _listings_by_ticker.cache_clear()
