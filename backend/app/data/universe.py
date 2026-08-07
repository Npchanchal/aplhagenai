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

# Phase 7 — Nifty-50 shortlist scaffolding (subset beyond Sensex for roadmap)
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
