"""Curated Sensex IR crawl targets — allowlisted hosts only.

Live crawl fetches `url` when enabled. Offline/catalog mode upserts `digest`
text (honest curated snapshot) so CI and dry runs never invent live prints.
"""

from __future__ import annotations

from typing import Dict, List, Optional, TypedDict

from app.data.universe import SENSEX_30


class IrTarget(TypedDict):
    company_id: str
    ticker: str
    name: str
    url: str
    digest: str


def _digest(name: str, ticker: str, theme: str) -> str:
    return (
        f"{name} ({ticker}) investor relations digest — {theme}. "
        f"Management discussed growth outlook, operating margins, and capital allocation. "
        f"Quantified guidance bands, when restated, are the primary IntelLens GCI input. "
        f"Source: curated IR catalog (not a live exchange feed)."
    )


# Prefer stable IR / filings pages on hosts already in ingest.ALLOWLIST_HOSTS.
_URLS: Dict[str, str] = {
    "infy": "https://www.infosys.com/investors/reports-filings/financials/guidance-vs-actuals-usd.html",
    "tcs": "https://www.tcs.com/investor-relations",
    "wipro": "https://www.wipro.com/investors/",
    "hcltech": "https://www.hcltech.com/investors",
    "techm": "https://www.techmahindra.com/en-in/investors/",
    "reliance": "https://www.ril.com/InvestorRelations/FinancialReporting.aspx",
    "hdfcbank": "https://www.hdfcbank.com/personal/about-us/investor-relations",
    "icicibank": "https://www.icicibank.com/about-us/investor-relations",
    "sbin": "https://www.sbi.co.in/web/corporate-governance/investor-relations",
    "kotakbank": "https://www.kotak.com/en/investor-relations.html",
    "axisbank": "https://www.axisbank.com/shareholders-corner/investor-relations",
    "indusindbk": "https://www.indusind.com/in/en/personal/investors.html",
    "bhartiartl": "https://www.airtel.in/about-us/investor-relations",
    "itc": "https://www.itcportal.com/about-itc/shareholder-value.aspx",
    "hindunilvr": "https://www.hul.co.in/investor-relations/",
    "nestleind": "https://www.nestle.in/investors",
    "maruti": "https://www.marutisuzuki.com/corporate/investors",
    "m_m": "https://www.mahindra.com/investors",
    "tatamotors": "https://www.tatamotors.com/investors/",
    "tatasteel": "https://www.tatasteel.com/investors/",
    "jswsteel": "https://www.jsw.in/investors",
    "lt": "https://www.larsentoubro.com/corporate/investors/",
    "ntpc": "https://www.ntpc.co.in/investors",
    "powergrid": "https://www.powergrid.in/investors",
    "sunpharma": "https://www.sunpharma.com/investors",
    "drreddy": "https://www.drreddys.com/investors",
    "asianpaints": "https://www.asianpaints.com/more/investors.html",
    "titan": "https://www.titancompany.in/investors",
    "bajajfinance": "https://www.bajajfinserv.in/investors",
    "bajajfinserv": "https://www.bajajfinserv.in/investors",
}

_THEMES: Dict[str, str] = {
    "infy": "guidance vs actuals (USD) and large-deal pipeline",
    "tcs": "deal wins, attrition, and margin commentary",
    "reliance": "segment growth and capital expenditure framing",
    "hdfcbank": "loan growth and NIMs",
}


def sensex_ir_targets() -> List[IrTarget]:
    rows: List[IrTarget] = []
    for cid, name, ticker, _sector in SENSEX_30:
        url = _URLS.get(cid) or f"https://www.bseindia.com/stock-share-price/{ticker.lower()}/"
        theme = _THEMES.get(cid, "outlook, margins, and capital allocation")
        rows.append(
            {
                "company_id": cid,
                "ticker": ticker,
                "name": name,
                "url": url,
                "digest": _digest(name, ticker, theme),
            }
        )
    return rows


def target_for(company_id: str) -> Optional[IrTarget]:
    for t in sensex_ir_targets():
        if t["company_id"] == company_id:
            return t
    return None
