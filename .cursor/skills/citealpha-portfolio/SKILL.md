---
name: citealpha-portfolio
description: >-
  Implements or packages CiteAlpha portfolio SKUs (Score, Cite, Radar, Ledger,
  Data). Use when working on /products, portfolio APIs, SKU one-pagers, or
  docs/PRODUCT_PORTFOLIO.md.
---

# CiteAlpha Portfolio

## Steps

1. Read `docs/PRODUCT_PORTFOLIO.md`, `docs/PORTFOLIO_ROADMAP.md`, and the target SKU in `docs/customer/skus/`.
2. Catalog: `backend/app/services/portfolio.py` — extend `PRODUCTS` and compose helpers, don't fork data.
3. APIs: thin routes in `routes.py`; sync `frontend/src/lib/api.ts`.
4. Entitlements: gate new surfaces in `entitlements.py` (plan ∩ role).
5. UI: `/products`, `/package` — evidence-first; honest `status` (live vs partial).
6. Tests for new endpoints; update kb `13-commercial.md` if scope shifts.

## SKU map

| SKU | Hero job | Key surfaces |
|---|---|---|
| Score | GCI + peers | `/`, `/companies/:id`, `/rankings` |
| Cite | Citations + Research | `/research`, `/c/:id` |
| Radar | Change / miss / drop feed | `/api/radar/*`, Desk alerts |
| Ledger | Promise dossier | `promise_brief`, Ledger UI |
| Data | PIT export / factor | `/api/pit/*`, EM export |
| Sights | Disclosure research OS | `/sights/*` (see `citealpha-sights`) |

## Non-goals

Sentiment dashboards · news-only feeds · inventing actuals · competitor clone naming.
