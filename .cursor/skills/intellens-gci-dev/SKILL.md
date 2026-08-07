---
name: intellens-gci-dev
description: >-
  Implements IntelLens Guidance Credibility Index (GCI) features end-to-end.
  Use when adding scoring logic, guidance APIs, Guidance Tracker UI, seed data,
  or evidence-trail views for management credibility scoring.
---

# IntelLens GCI Development

## When to use

Building or changing GCI scoring, company guidance APIs, or the Guidance Tracker UI.

## Workflow

1. Read `docs/kb/00-overview.md`, `docs/PRODUCT_DEFINITION.md`, and relevant `docs/USER_STORIES.md`.
2. Change pure scoring in `backend/app/services/gci_scoring.py` first; add unit tests.
3. Wire API in `backend/app/api/`; keep routers thin; sync `frontend/src/lib/api.ts`.
4. Update frontend pages/components (evidence-first on dossiers).
5. Run: `cd backend && pytest` and `cd frontend && npm run build`.
6. Confirm every displayed score still links to guidance + actual evidence.

## Invariants

- GCI is 0–100. Higher = better historical delivery vs stated guidance.
- Vague guidance gets lower confidence weight, not silent zero.
- No recommendation engine in MVP responses.
- KB: `docs/kb/03-scoring.md`, `docs/kb/05-api-map.md`.
