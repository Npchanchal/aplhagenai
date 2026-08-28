---
name: citealpha-sights
description: >-
  Builds or fixes CiteAlpha Sights (India disclosure research OS at /sights).
  Use when working on Sights pages, /api/sights/*, feature flags, or docs/kb/14-sights.md.
---

# CiteAlpha Sights

## Steps

1. Read `docs/kb/14-sights.md` and `docs/customer/skus/SIGHTS.md`.
2. Backend: `backend/app/services/sights.py` + thin routes in `routes.py`.
3. Frontend: `frontend/src/pages/sights/*` via `lib/api.ts` + `lib/entitlements.tsx`.
4. Gate surfaces with feature flags (`feature_flags.py`) and plan ∩ role entitlements.
5. Every answer/search result must cite or refuse — no invented actuals.
6. `pytest` sights tests + `npm run build`.

## Surfaces

| Path | Job |
|---|---|
| `/sights` | Hub |
| `/sights/search` · `/sights/ask` | Search + cite-only Q&A |
| `/sights/boards` | Watchlists + saved queries |
| `/sights/themes` | Delivery themes (met/miss/drop/pending) |
| `/sights/street` · `/sights/field` | Street context + field evidence |
| `/sights/grid` · `/sights/deep-dive` | Compare grid + multi-doc synthesis |
| `/sights/agents` | Desk agents (flagged) |
| `/sights/export` | Cite export (MD/CSV/PDF) |

## Non-goals

Competitor naming in UI · broker PDF redistribution · expert-call marketplace · Buy/Hold.
