# Prompt — 5-year market & stock history (demo series)

**Status today:** Implemented — deterministic 5Y monthly demo series by default; optional **Financial Modeling Prep** EOD when `INTELLENS_FMP_API_KEY` / `FMP_API_KEY` is set (`services/fmp_client.py`). Labeled honestly (`fmp_eod` vs `demo_deterministic`). Not GCI input. Free FMP plans often 402 India `.NS` → demo fallback.

Copy everything below the line into Cursor Agent to implement (or extend).

---

## Role

Extend **CiteAlpha** (`/Users/navin/AlphaGenAI`) with **5-year historical series** for every scaffolded **market (flagship indexes)** and every **constituent stock**.

This is **navigation / research context**, not live exchange data and **not** a GCI input. Prefer deterministic demo series with honest `data_quality` badges. Do **not** invent GCI guidance actuals; do **not** claim live coverage.

## Locked product decisions

### Honesty
- Label all series `data_quality: demo_structured` (India Sensex names) or `market_scaffold` (non-India).
- UI copy: “Demo tape / demo history — not live exchange data; not used in GCI math.”
- Meta: `history_years: 5`, `history_kind: "demo_deterministic"`.

### Coverage
- **Every market** in `backend/app/data/markets.py` → at least one **flagship index** monthly (or weekly) close series for last 5 years (~60 monthly points).
- **Every constituent stock** returned by markets APIs → monthly close + optional volume + simple fundamentals stub (revenue_growth_pct, operating_margin_pct) for last 5 fiscal years where trivial.
- Deterministic RNG seeded by `stock_id` / `index_id` so series are stable across restarts.

### Data model
```
HistoryPoint { date: YYYY-MM-DD, close: float, volume?: float }
FundamentalYear { fiscal_year: str, revenue_growth_pct?: float, operating_margin_pct?: float }
MarketHistory { market_id, index_id, points[], data_quality, note }
StockHistory { stock_id, market_id, points[], fundamentals[], data_quality, note }
```

### APIs
- `GET /api/markets/{id}/history?index=&years=5`
- `GET /api/indexes/{id}/history?years=5`
- `GET /api/stocks/{id}/history?years=5`
- Extend research snapshot (optional): include `history_5y` summary (last, change_5y_pct) when available
- Meta: `history_years`, `history_kind`, `history_note`

### UI
- Tracker: when a market/index is selected, show a small **5Y index sparkline/chart** + demo badge
- Company detail (when GCI deep) or Research desk snapshot: **5Y price path** chart for the focus name
- Empty/scaffold states stay honest

### Non-goals
- Paid vendor feeds / WebSocket ticks
- Using history series inside GCI scoring
- Full daily bars for S&P 500 (monthly is enough for MVP)
- Buy/Hold recommendations

## Docs

- Update `docs/I18N_AUTH_MARKETS.md` with a short “5Y demo history” note, or keep `docs/prompts/MARKET_HISTORY_5Y_PROMPT.md` as the source prompt.
