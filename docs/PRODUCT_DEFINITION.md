                                                                                                                                                                                                                                                                                                                                # Product Definition — CiteAlpha GCI MVP

## Vision

A **credit score for management guidance** on Indian listed companies, delivered as an analyst workbench tab and API.

## MVP in scope

1. Company list (Sensex-style seed universe).
2. Per-company **GCI score (0–100)** with trend and metric breakdown (revenue, margin, other).
3. **Evidence trail:** each outcome shows guidance text, period, guided value, actual value, delta, confidence.
4. REST API: health, list companies, get company GCI detail.
5. Web UI: browse companies → open Guidance Tracker detail.
6. Seed dataset with synthetic-but-realistic guidance/actual pairs for demo and tests.

## Explicit non-goals (MVP)

- Buy / Hold / Sell recommendations.
- Live concall NLP ingestion (Phase 1).
- Retail consumer app.
- Broker white-label badge.
- Multi-language vernacular UI (planned parallel track).

## Parallel portfolio (beyond GCI MVP)

GCI remains the hero. Parallel sellable jobs on the same spine are catalogued in
[`PRODUCT_PORTFOLIO.md`](PRODUCT_PORTFOLIO.md): **Score · Cite · Radar · Ledger · Data**.
Phased build: [`PORTFOLIO_ROADMAP.md`](PORTFOLIO_ROADMAP.md). Do not expand MVP non-goals
into sentiment dashboards or recommendations.

## Personas

| Persona | Need |
|---|---|
| Buy-side analyst | Screen chronic guidance misses; drill into evidence |
| Sell-side associate | Faster, auditable outlook notes input |
| Quant / data buyer | Point-in-time GCI series via API (Phase 3 shape in MVP stub) |

## Data model (logical)

```
Company { id, name, ticker, sector }
GuidanceStatement { id, company_id, period, metric, guided_value, guided_text, speaker, confidence }
ActualResult { id, company_id, period, metric, actual_value }
GuidanceOutcome { statement + actual + delta + score_contribution }
CompanyGCI { score, by_metric, outcomes[], as_of }
```

## Scoring (v0.2 rules — legacy v2; default v4 differs, see `docs/kb/03-scoring.md`)

- Prefer guidance **bands** (`guided_low`–`guided_high`); in-band delivery = **met** (100).
- **Exceeded** (beat above band) scores high (≥85), not like a miss.
- **Missed** (below band) decays with relative distance; ≥50% shortfall → 0.
- **Dropped** (stopped reiterating) → fixed mid-low score (~35), distinct from miss.
- **Pending** (period open) excluded from company average.
- Weight by confidence (0.5–1.0). Company GCI = weighted average of scored outcomes.
- Every outcome should carry source linkage when available.

## Success metrics

- Unit tests green for scoring edge cases.
- Functional API tests green.
- E2E: user can open a company and see score + ≥1 evidence row.
- Deploy: `docker compose up` serves API `:8000` and UI `:5173` (or nginx `:8080`).

## Tech stack

- Backend: Python 3.12, FastAPI, Pydantic
- Frontend: React 18, TypeScript, Vite
- Tests: pytest, Playwright
- Deploy: Docker Compose
