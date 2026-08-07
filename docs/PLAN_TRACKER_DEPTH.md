# Product plan — Tracker depth (leaderboard + 11 asks)

Status: **scaffold shipped; quality bar moved to** [`PLAN_TIERED_FOUNDATION.md`](./PLAN_TIERED_FOUNDATION.md).

The table below was useful for demo wiring. It is **not** institutional Tier-complete.
Tier 1 must be treated as **ingest → structure → search → cite** before trusting Tier 2/3 analytics.

| # | Ask | Scaffold | Tier bar |
|---|---|---|---|
| 0 | Sector leaderboard all tabs | Done | Keep |
| 1 | Entity search | API + typeahead | Coverage facets + honesty (Tier 1) |
| 2–3 | Δ horizons + charts | Done UI | Null when no series (Tier 2) |
| 4–5 | Auto ingest / period docs | Crawl + paste extract | Period-complete corpus (Tier 1) |
| 6 | Citability + HITL | quote_span edit | citation_id pipeline (Tier 1) |
| 7 | GCI vs price | Overlay + Pearson | Descriptive only, no forecast UI (Tier 2) |
| 8–9 | Lead/lag / impact | Proxy corr bars | **Experimental** until Granger+LASSO (Tier 3) |
| 10–11 | Notes / reports | Done API | Cite-only report body (Tier 2) |

## Invariants

- Never invent citeable actuals; provisional listings stay `listing_provisional`.
- No Buy/Hold.
- Prefer small, tested modules under `backend/app/services/`.
