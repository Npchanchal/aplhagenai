"""Equity universes for IntelLens."""

from __future__ import annotations

from typing import List, Tuple

# id, name, ticker, sector
CompanyRow = Tuple[str, str, str, str]

SENSEX_30: List[CompanyRow] = [
    ("asianpaints", "Asian Paints Ltd.", "ASIANPAINT", "Consumer"),
    ("axisbank", "Axis Bank Ltd.", "AXISBANK", "Banks"),
    ("bajajfinance", "Bajaj Finance Ltd.", "BAJFINANCE", "NBFC"),
    ("bajajfinserv", "Bajaj Finserv Ltd.", "BAJAJFINSV", "Financials"),
    ("bhartiartl", "Bharti Airtel Ltd.", "BHARTIARTL", "Telecom"),
    ("drreddy", "Dr. Reddy's Laboratories Ltd.", "DRREDDY", "Pharma"),
    ("hcltech", "HCL Technologies Ltd.", "HCLTECH", "IT Services"),
    ("hdfcbank", "HDFC Bank Ltd.", "HDFCBANK", "Banks"),
    ("hindunilvr", "Hindustan Unilever Ltd.", "HINDUNILVR", "FMCG"),
    ("icicibank", "ICICI Bank Ltd.", "ICICIBANK", "Banks"),
    ("indusindbk", "IndusInd Bank Ltd.", "INDUSINDBK", "Banks"),
    ("infy", "Infosys Ltd.", "INFY", "IT Services"),
    ("itc", "ITC Ltd.", "ITC", "FMCG"),
    ("jswsteel", "JSW Steel Ltd.", "JSWSTEEL", "Metals"),
    ("kotakbank", "Kotak Mahindra Bank Ltd.", "KOTAKBANK", "Banks"),
    ("lt", "Larsen & Toubro Ltd.", "LT", "Industrials"),
    ("m_m", "Mahindra & Mahindra Ltd.", "M&M", "Auto"),
    ("maruti", "Maruti Suzuki India Ltd.", "MARUTI", "Auto"),
    ("ntpc", "NTPC Ltd.", "NTPC", "Power"),
    ("nestleind", "Nestle India Ltd.", "NESTLEIND", "FMCG"),
    ("powergrid", "Power Grid Corporation of India Ltd.", "POWERGRID", "Power"),
    ("reliance", "Reliance Industries Ltd.", "RELIANCE", "Energy / Conglomerate"),
    ("sbin", "State Bank of India", "SBIN", "Banks"),
    ("sunpharma", "Sun Pharmaceutical Industries Ltd.", "SUNPHARMA", "Pharma"),
    ("tcs", "Tata Consultancy Services Ltd.", "TCS", "IT Services"),
    ("tatamotors", "Tata Motors Ltd.", "TATAMOTORS", "Auto"),
    ("tatasteel", "Tata Steel Ltd.", "TATASTEEL", "Metals"),
    ("techm", "Tech Mahindra Ltd.", "TECHM", "IT Services"),
    ("titan", "Titan Company Ltd.", "TITAN", "Consumer"),
    ("wipro", "Wipro Ltd.", "WIPRO", "IT Services"),
]

# Phase 7 — Nifty-50 names beyond Sensex (P0 cohort + P1 completion)
NIFTY_EXTRA: List[CompanyRow] = [
    ("adani_ports", "Adani Ports & SEZ Ltd.", "ADANIPORTS", "Infrastructure"),
    ("apollohosp", "Apollo Hospitals Enterprise Ltd.", "APOLLOHOSP", "Healthcare"),
    ("britannia", "Britannia Industries Ltd.", "BRITANNIA", "FMCG"),
    ("cipla", "Cipla Ltd.", "CIPLA", "Pharma"),
    ("coalindia", "Coal India Ltd.", "COALINDIA", "Energy"),
    ("divislab", "Divi's Laboratories Ltd.", "DIVISLAB", "Pharma"),
    ("eichermot", "Eicher Motors Ltd.", "EICHERMOT", "Auto"),
    ("grasim", "Grasim Industries Ltd.", "GRASIM", "Conglomerate"),
    ("hdfclife", "HDFC Life Insurance Co. Ltd.", "HDFCLIFE", "Insurance"),
    ("hero_motocorp", "Hero MotoCorp Ltd.", "HEROMOTOCO", "Auto"),
]

# P1 — remaining Nifty-50 index members (Aug 2026 membership)
NIFTY50_REMAINING: List[CompanyRow] = [
    ("adanient", "Adani Enterprises Ltd.", "ADANIENT", "Metals & Mining"),
    ("bajaj_auto", "Bajaj Auto Ltd.", "BAJAJ-AUTO", "Auto"),
    ("bel", "Bharat Electronics Ltd.", "BEL", "Defence / Electronics"),
    ("eternal", "Eternal Ltd.", "ETERNAL", "Consumer Services"),
    ("hindalco", "Hindalco Industries Ltd.", "HINDALCO", "Metals"),
    ("indigo", "InterGlobe Aviation Ltd.", "INDIGO", "Aviation"),
    ("jiofin", "Jio Financial Services Ltd.", "JIOFIN", "Financials"),
    ("maxhealth", "Max Healthcare Institute Ltd.", "MAXHEALTH", "Healthcare"),
    ("ongc", "Oil & Natural Gas Corporation Ltd.", "ONGC", "Energy"),
    ("sbilife", "SBI Life Insurance Co. Ltd.", "SBILIFE", "Insurance"),
    ("shriramfin", "Shriram Finance Ltd.", "SHRIRAMFIN", "NBFC"),
    ("tataconsum", "Tata Consumer Products Ltd.", "TATACONSUM", "FMCG"),
    ("trent", "Trent Ltd.", "TRENT", "Retail"),
]

NIFTY50_BEYOND_SENSEX: List[CompanyRow] = NIFTY_EXTRA + NIFTY50_REMAINING

# Official NSE Nifty-50 membership (Aug 2026 — not all Sensex / legacy extras)
OFFICIAL_NIFTY50_TICKERS: frozenset[str] = frozenset(
    {
        "ADANIENT",
        "ADANIPORTS",
        "APOLLOHOSP",
        "ASIANPAINT",
        "AXISBANK",
        "BAJAJ-AUTO",
        "BAJFINANCE",
        "BAJAJFINSV",
        "BEL",
        "BHARTIARTL",
        "CIPLA",
        "COALINDIA",
        "DRREDDY",
        "EICHERMOT",
        "ETERNAL",
        "GRASIM",
        "HCLTECH",
        "HDFCBANK",
        "HDFCLIFE",
        "HEROMOTOCO",
        "HINDALCO",
        "HINDUNILVR",
        "ICICIBANK",
        "INDIGO",
        "INFY",
        "ITC",
        "JIOFIN",
        "JSWSTEEL",
        "KOTAKBANK",
        "LT",
        "M&M",
        "MARUTI",
        "MAXHEALTH",
        "NESTLEIND",
        "NTPC",
        "ONGC",
        "POWERGRID",
        "RELIANCE",
        "SBILIFE",
        "SBIN",
        "SHRIRAMFIN",
        "SUNPHARMA",
        "TATACONSUM",
        "TCS",
        "TATAMOTORS",
        "TATASTEEL",
        "TECHM",
        "TITAN",
        "TRENT",
        "WIPRO",
    }
)
