# 00 — Overview

**IntelLens** scores whether Indian listed-company management **delivered on stated guidance**. The hero metric is the **Guidance Credibility Index (GCI)** 0–100 — not sentiment, not Buy/Hold.

## Pitch

> Keep your market terminal for prices; use IntelLens for **guidance delivery**.

## Three product surfaces

| Route | Product | Job |
|---|---|---|
| `/` · `/companies/:id` | Guidance Credibility Index | Screen universe → evidence dossier |
| `/desk` | One-Stop Desk | Tracker, evidence, review queue, PIT/API, AlphaHunter, parameters, wordmap, vernacular, CSM |
| `/research` | Research Terminal | Search, cite-only chat, snapshot, news, watchlist |

Secondary: `/package`, `/help`, `/login`, `/register`.

## Stack

- **Backend:** Python 3.12, FastAPI, Pydantic — `backend/app/`
- **Frontend:** React 18, TypeScript, Vite — `frontend/src/`
- **Tests:** pytest + Playwright (`e2e/`)
- **Local deploy:** Docker Compose (`api` + `web`)
- **Cloud:** AWS ECS/ALB — `deploy/aws/`, `scripts/aws-*.sh`

## Non-negotiables

1. Every GCI point → guidance statement + actual (date, metric, source).
2. No retail Buy/Hold/Sell without SEBI RA review.
3. India beachhead (Sensex → Nifty); export later via API.
4. Never invent financial actuals; seed/fixtures/stubs only in tests.
5. Honest `data_quality`: `hand_labeled` | `demo_structured` | `market_scaffold`.

## Default demo key

Write paths: header `X-API-Key: intellens-demo`.

## Version / meta

`GET /api/meta` and `GET /health` — check `open_gaps`, `hand_labeled_count`, version before claiming accuracy.
