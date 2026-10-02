# 04 — Guidance Pipeline

## Stages

1. **Ingest** — paste / text / URL allowlist / **Sensex IR crawl** / media→ASR stub (`/api/ingest/*`)
2. **Extract** — structured statements (metric, band, period, speaker, confidence); default **pending**
3. **Review** — Accept / Edit / Reject; corrections append to `reviews[]` (moat)
4. **Commit** — `POST /api/extract/commit` accepted indices → outcomes
5. **Match** — key `(company_id, period, metric)` only
6. **Score** — pure GCI (`INTELLENS_GCI_VERSION=v4` default; `v3` or legacy `v2` selectable)
7. **Import paths** — AlphaHunter JSON, actuals import, consensus import (flags)

## Sensex IR crawl (keep pages fresh)

| Piece | Detail |
|---|---|
| Catalog | `backend/app/data/ir_sources.py` — allowlisted IR URLs + offline digests |
| Job | `POST /api/ingest/crawl` · `python -m app.jobs.sensex_ir_crawl` · `scripts/sensex-ir-crawl.sh` |
| Modes | `dry_run` · catalog (default, CI-safe) · `live=true` HTTP fetch with catalog fallback |
| Landing | New docs → `review_status=pending` (never auto-score into GCI) |
| Daily citation review | `python -m app.jobs.guidance_review` — one market per day inside the API when `INTELLENS_GUIDANCE_REVIEW=1`. Copies a quote only from an accepted filing that already contains the number. Does not invent a score. |
| India filing ingest | `python -m app.jobs.ingest_india_filings` — BSE/NSE allowlisted URLs already on outcome rows (or `--live` fetch); `--discover` adds NSE corporate announcements by symbol (con-call transcripts first, then presentations, results, AGM transcripts / proceedings, annual reports; `INTELLENS_FILING_DISCOVERY_MONTHS`=24, `_MAX_DOCS`=6). Guidance documents (`GUIDANCE_DOC_TYPES`) are `concall`, `presentation`, `agm`, `annual_report`. AGM notices, voting results and "weblink to the annual report" letters are skipped. A short filing (≤4,000 chars, a cover letter) is followed once to the PDFs it links on hosts allowed for that issuer (wrapped URLs rejoined; `linked_filing_urls`), also for cover letters stored on earlier runs. The latest AGM record is kept even when transcripts fill the cap. Web-search discovery (`INTELLENS_WEB_SEARCH_DISCOVERY=1`; OpenAI Responses API `web_search` tool, `INTELLENS_LLM_SEARCH_MODEL` default `gpt-4.1-mini`) asks for guidance-bearing document links per company; the answer is a lead only — links are tracking-stripped, kept only on exchange hosts or that issuer's `ISSUER_HOSTS` domain, then fetched, extracted and quote-bound like any filing. Such documents are stored undated, so a row from them has no `guidance_as_of` and stays unscored until dated. Capped by `INTELLENS_WEB_SEARCH_DAILY_CAP` (60) and re-searched per company every `INTELLENS_WEB_SEARCH_REFRESH_DAYS` (30); state in `web_search_ledger.json`. Issuer-site walk (`services/ir_discovery.py`, `INTELLENS_IR_CRAWL_DISCOVERY=1`): starts at the curated IR page (`ir_sources`), the homepage, else a guessed `/investors/`; fetches at most 8 pages, 3 levels deep, on that issuer's allowed hosts only (bot UA; sites that refuse it are left alone; regional-language copies skipped). On each page the LLM picks from numbered links only — it cannot add a URL — which links are guidance documents and which pages to open; keyword fallback when no LLM budget. Results rank transcripts first, at most 3 per kind, drop titles/URLs naming a year older than the lookback, and are stored undated like web-search documents. LLM calls count against `INTELLENS_EXTRACT_LLM_DAILY_CAP`; at most `INTELLENS_IR_CRAWL_DAILY_CAP` (60) companies a day, each every `INTELLENS_IR_CRAWL_REFRESH_DAYS` (30); state in `ir_crawl_ledger.json`. Annual reports come from NSE's annual-report list (latest two PDFs; older years are ZIPs, skipped). An annual report keeps the management-discussion span (its running header, small gaps filled) plus pages elsewhere naming outlook, "we expect" or capex, up to 300k characters. Issuer IR hosts (`ISSUER_HOSTS`, Sensex and promise cohort) are allowed only for their own issuer. A domain shared by several listed group companies (`jsw.in`) is not mapped. News / aggregator sites never. Requests identify as CiteAlphaBot; BSE/NSE refuse bots, so exchange hosts fall back to a browser UA (`INTELLENS_FILING_BROWSER_UA_FALLBACK=0` disables). Rate limit `INTELLENS_FILING_FETCH_INTERVAL_SEC`; daily caps `INTELLENS_FILING_FETCH_DAILY_CAP` (200) and `INTELLENS_FILING_DISCOVERY_DAILY_CAP` (500), persisted in `filing_fetch_budget.json` so they hold across processes. BSE's announcement API is behind bot protection and is not used, so BSE-only names have no discovery source yet. PDF via `pypdf` (sniffed by magic bytes). Stores quotes + URL, not a republished PDF. |
| Daily coverage roll | Runs in the API process before the 02:30 IST guidance review when `INTELLENS_INDIA_COVERAGE=1` and `INTELLENS_FILING_LIVE=1` (on in production). `india_coverage.roll_daily` walks NSE names least-recently-searched first (`last_discovery` in `coverage_status.json`), discover → ingest → extract → classify, and stops when the day's fetch or discovery budget is spent (~33 names/day at 200 filings, 6 per name). BSE-only names are skipped. Without `INTELLENS_FILING_LIVE` it only reclassifies. |
| Filing text storage | With `INTELLENS_DATA_DIR`, text over 4,000 chars is stored in `doc_text/<content_hash>.txt`; `documents.json` keeps metadata + a 4,000-char preview. Per-company / single-doc reads hydrate full text (LRU 64); corpus-wide lists (search, pending counts) see the preview. Inline overlays migrate on first load. |
| Coverage lookback | `classify_india_coverage --live` discovers + ingests per name. `no_quantified_guidance` only when a con-call or presentation exchange filing was ingested, the extractor found no promise, and the company has no guidance rows at all. Counts use the cached published score. |
| Extract + classify | `python -m app.jobs.extract_india_guidance` · `python -m app.jobs.classify_india_coverage`. Priority: Nifty 50 → IN1000 → NSE_ALL → BSE-only. One listing master (`india_listings.india_equity_universe`, one row per scrip, NSE+BSE merged by ISIN/ticker); SENSEX / NIFTY50 / NIFTYBANK / NSE_ALL / BSE_ALL / IN1000 are membership tags on that row. Cohorts are disjoint slices (`india_coverage.cohort_partition`): Sensex ∪ Nifty 50 ∪ Nifty Bank, then the rest of IN1000, rest of NSE, BSE-only — each scrip is ingested, scored and cached once. LLM extract reads each document in 12k-char chunks (1k overlap, max 30 per document), one call per chunk, capped per UTC day by `INTELLENS_EXTRACT_LLM_DAILY_CAP` (production 10,000). Call count and chunks already read persist in `llm_extract_ledger.json` on `INTELLENS_DATA_DIR`, so a restart neither resets the cap nor re-sends a chunk; a failed call or an over-cap chunk falls back to the rule-based extractor and is retried by the model later. `relabel_copied_guidance` uses the rule-based extractor only. Refresh hook: `INTELLENS_INDIA_COVERAGE=1`. |
| Coverage status | `scored` · `open_period` · `filing_in_review` · `no_quantified_guidance` · `listed_only` on every listing (`GET /api/companies`, dossier). `no_quantified_guidance` only after a completed lookback. |
| Alerts | `docs_pending_review` on Tracker alerts rail → Desk Review queue |
| Schedule | **Every 6 hours** live: `docker compose` `scheduler` · `scripts/gci-refresh-loop.sh` · cron · `POST /api/ingest/refresh` |
| Refresh job | Live IR crawl → pending docs → auto-extract to review queue (not auto-GCI) · optional FMP warm |
| Source verify | Nightly (at most once per 24h on live refresh when `INTELLENS_VERIFY_SOURCES=1`): `python -m app.jobs.verify_sources --write`. Missing quotes → `citeable=false` + labeling queue. Counts on `/api/trust.source_verification` / Trust Center. |
| Filing-to-score | Target **5 business days** from results filing (`as_of`) to publish (`reviewed_at`), for filings on or after 29 Sep 2026. Refresh writes `filing_seen` to `score_pipeline.jsonl`; `accept_draft` writes `review_publish`. Observed median: `/methodology` and `GET /api/meta` → `filing_to_score`. |
| India listings | Real **NSE_ALL** (~2.3k) + **BSE_ALL** (~4.9k) masters in `app/data/listings/`; refresh via `scripts/refresh-india-listings.sh`. Every row has `coverage_status`. A number publishes only for `hand_labeled` or `extracted_verified` with dual citation. |

## Auth

Mutations require `X-API-Key` (demo: `intellens-demo`).

## Source policy (GCI math)

**In:** transcripts, filings/PDF text, IR HTML/PPT text, ASR→transcript, reported actuals.  
**Out of score:** raw A/V scoring, technicals, forensic shenanigans engines, sentiment-only (wordmap is context stub).  
**Audit deductions (v3/v4):** guidance withdrawal / dropped → −15; mid-horizon definition shift flag → −10 — not a Beneish/M-score engine.

## Desk UI

Review queue: `/desk?tab=review` (includes **Run Sensex IR crawl**). Evidence Accept/Reject also on company dossier.

## Code map

| Concern | Module |
|---|---|
| Extract | `services/extraction.py` · `services/extract_pipeline.py` |
| Match | `services/matching.py` |
| Coverage | `services/coverage.py` · `services/india_coverage.py` |
| Exchange filings | `services/exchange_filings.py` · `python -m app.jobs.ingest_india_filings` |
| Ingest | `services/ingest.py` |
| Crawl | `services/crawl.py` · `data/ir_sources.py` |
| Source verify | `services/source_verify.py` · `python -m app.jobs.verify_sources` |
| Score SLA | `services/score_sla.py` · `data/score_pipeline.jsonl` |
| Store | `services/repository.py` · `data/doc_store.py` |
| Parameters catalog | `GET /api/metrics` + `docs/GCI_PARAMETERS_AND_SOURCES.md` |
