# 01 — Product (GCI + portfolio)

## Wedge

**Guidance Credibility Index** — credit score for management promises vs delivery on Indian equities.

## Parallel SKUs (same spine)

| Bundle | Job |
|---|---|
| **Score** | GCI + peer delivery benchmarks |
| **Cite** | Citations + Research Terminal |
| **Radar** | Guidance change / miss / drop feed |
| **Ledger** | Promise accountability dossier |
| **Data** | PIT outcomes + factor export |

Catalog: `docs/PRODUCT_PORTFOLIO.md` · Roadmap: `docs/PORTFOLIO_ROADMAP.md` · UI: `/products` · API: `GET /api/products`.

## Personas

| Persona | Need |
|---|---|
| Buy-side analyst | Screen chronic misses; drill evidence |
| Sell-side associate | Auditable outlook notes input |
| Quant / data buyer | PIT GCI series via API |
| Compliance / credit | Ledger without requiring a score product |
| PM / risk | Radar change feed |

## In scope (MVP+)

- Sensex-style universe with GCI, Δ GCI, quality badge, peer rank, sector avg
- Evidence trail: band, actual, Δ, label, source, Accept/Edit/Reject
- Extract → pending → commit review queue
- Desk One-Stop tabs; Research search/chat/snapshot
- Vernacular factual blurbs + SEBI disclaimer
- AlphaHunter facts import; EM factor export shape
- Portfolio compositions: Radar feed, Ledger, Data catalog

## Explicit non-goals

- Buy / Hold / Sell recommendations
- Live OMS / quotes / options
- Cloning Bloomberg or AlphaSense as a feature set
- B2C retail newsroom
- Claiming hand-audited accuracy without labeled sources
- Sentiment-only dashboards sold as GCI

## Success (analyst)

Screen Sensex GCI → open dossier → cite a source in **under 60 seconds**.

## Doc pointers

- `docs/PRODUCT_DEFINITION.md`, `docs/USER_STORIES.md`, `docs/BUSINESS_PLAN.md`
- `docs/customer/ONE_PAGER.md`, `docs/customer/skus/`, `docs/PITCH_DECK.md`
