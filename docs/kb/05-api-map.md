# 05 — API Map

Base: FastAPI `backend/app/api/routes.py`. OpenAPI: `/docs`.

## Core GCI

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness |
| GET | `/api/meta` | Version, gaps, hand_labeled_count |
| GET | `/api/companies` | `market`, `index`, `limit`, `offset` |
| GET | `/api/companies/count` | Pagination |
| GET | `/api/companies/{id}/gci` | Full dossier payload |
| GET | `/api/companies/{id}/gci/history` | PIT points + Δ |
| GET | `/api/alerts` | Misses / dropped |
| GET | `/api/peers/{sector}` | Sector benchmark |

## Write / pipeline (API key)

| Method | Path |
|---|---|
| POST | `/api/extract`, `/api/extract/commit`, `/api/extract/pending` |
| POST | `/api/match` |
| POST | `/api/review` · GET `/api/reviews` |
| POST | `/api/import/alphahunter` |
| POST | `/api/ingest/paste`, `/text`, `/url`, `/bootstrap`, `/media` |
| POST | `/api/ingest/crawl` · GET `/api/ingest/crawl/status` |
| POST | `/api/ingest/refresh` | live 6h job: crawl + extract queue + FMP warm |
| POST | `/api/actuals/import`, `/api/consensus/import` |
| POST | `/api/admin/reset-demo` |

## Research

`/api/research/search`, `chat`, `snapshot/{id}`, `estimates/{id}`, `brief/{id}`, `news`, `watchlist`, `transcripts`

## Product extras

| Path | Purpose |
|---|---|
| `/api/vernacular/{id}` | Lang blurbs |
| `/api/badge/{ticker}` (+ `/svg`) | Embed trust badge |
| `/api/compliance/sebi-note` | Disclaimer text |
| `/api/export/em-factor/{id}` | Factor export shape |
| `/api/metrics` | Parameter catalog |
| `/api/orgs/{id}` | Seats / CSM stub |
| `/api/auth/*` | Register, login, SSO stub |
| `/api/markets`, indexes, history | Multi-market scaffold |

## Frontend contract

All UI calls go through `frontend/src/lib/api.ts`. Do not add ad-hoc `fetch` in pages without updating that module + types.
