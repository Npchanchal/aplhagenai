# Research Terminal — Intellens Search + Intellens Desk

Complements GCI. Demo research surface branded as **Intellens** (not third-party terminal names).

## What we ship (demo)

| Intellens product | Feature | API / UI |
|---|---|---|
| **Intellens Search** | Primary-source search | `GET /api/research/search` · Research → Search |
| **Intellens Research Chat** | Chat with citations | `POST /api/research/chat` · Research → AI Chat |
| **Intellens Transcripts** | Transcript library | `GET /api/research/transcripts` |
| **Intellens Desk Snapshot** | Company desk card (demo tape + GCI) **with MoM/QoQ/YoY** | `GET /api/research/snapshot/{id}` |
| **Intellens Estimates** | Street vs guidance vs actual **+ period Δ** | `GET /api/research/estimates/{id}` |
| **Intellens News & Filings** | News / filings feed | `GET /api/research/news` |
| **Intellens Watchlist** | Watchlist tape + GCI **+ change trends** | `GET /api/research/watchlist` |

**Design note:** absolute levels are shown, but **incremental changes (MoM / QoQ / YoY / PoP)** are first-class — the primary desk signal for any parameter.

UI: `/research`

## Explicit non-goals

- Live quotes, OMS, portfolio, options chains  
- Buy / Hold / Sell  
- Full expert-network marketplace  

## Positioning

> Use Intellens for India guidance accountability and research desk workflows (search, chat, estimates, watchlist). GCI remains the core score with an evidence trail.
