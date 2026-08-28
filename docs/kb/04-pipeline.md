# 04 — Guidance Pipeline

## Stages

1. **Ingest** — paste / text / URL allowlist / **Sensex IR crawl** / media→ASR stub (`/api/ingest/*`)
2. **Extract** — structured statements (metric, band, period, speaker, confidence); default **pending**
3. **Review** — Accept / Edit / Reject; corrections append to `reviews[]` (moat)
4. **Commit** — `POST /api/extract/commit` accepted indices → outcomes
5. **Match** — key `(company_id, period, metric)` only
6. **Score** — pure GCI (`INTELLENS_GCI_VERSION=v3` default; set `v2` for legacy)
7. **Import paths** — AlphaHunter JSON, actuals import, consensus import (flags)

## Sensex IR crawl (keep pages fresh)

| Piece | Detail |
|---|---|
| Catalog | `backend/app/data/ir_sources.py` — allowlisted IR URLs + offline digests |
| Job | `POST /api/ingest/crawl` · `python -m app.jobs.sensex_ir_crawl` · `scripts/sensex-ir-crawl.sh` |
| Modes | `dry_run` · catalog (default, CI-safe) · `live=true` HTTP fetch with catalog fallback |
| Landing | New docs → `review_status=pending` (never auto-score into GCI) |
| Alerts | `docs_pending_review` on Tracker alerts rail → Desk Review queue |
| Schedule | **Every 6 hours** live: `docker compose` `scheduler` · `scripts/gci-refresh-loop.sh` · cron · `POST /api/ingest/refresh` |
| Refresh job | Live IR crawl → pending docs → auto-extract to review queue (not auto-GCI) · optional FMP warm |
| India listings | Real **NSE_ALL** (~2.3k) + **BSE_ALL** (~4.9k) masters in `app/data/listings/`; refresh via `scripts/refresh-india-listings.sh`. GCI only where outcomes exist (Sensex hand_labeled + Nifty demo). |

## Auth

Mutations require `X-API-Key` (demo: `intellens-demo`).

## Source policy (GCI math)

**In:** transcripts, filings/PDF text, IR HTML/PPT text, ASR→transcript, reported actuals.  
**Out of score:** raw A/V scoring, technicals, forensic shenanigans engines, sentiment-only (wordmap is context stub).  
**Audit deductions (v3 only):** guidance withdrawal / dropped → −15; mid-horizon definition shift flag → −10 — not a Beneish/M-score engine.

## Desk UI

Review queue: `/desk?tab=review` (includes **Run Sensex IR crawl**). Evidence Accept/Reject also on company dossier.

## Code map

| Concern | Module |
|---|---|
| Extract | `services/extraction.py` |
| Match | `services/matching.py` |
| Ingest | `services/ingest.py` |
| Crawl | `services/crawl.py` · `data/ir_sources.py` |
| Store | `services/repository.py` · `data/doc_store.py` |
| Parameters catalog | `GET /api/metrics` + `docs/GCI_PARAMETERS_AND_SOURCES.md` |
