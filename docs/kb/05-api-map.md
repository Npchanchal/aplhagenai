# 05 — API Map

Base: FastAPI `backend/app/api/routes.py`. Public OpenAPI (`/docs`, `/openapi.json`) is the W8.5 allowlist — 40 paths or fewer. Other routes stay callable and are omitted from the spec.

## Core GCI

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness |
| GET | `/api/meta` | Version, gaps, `gci_algorithm`, `pending_depth`, flags; `gci_scored_count` (scoreable quality with a score), `gci_listing_unscored_count`, `sensex_scored_count` / `sensex_count`; `gci_coverage` tallies; `filing_to_score` (W2.8 target + observed median) |

**Score policy:** only `hand_labeled` companies carry a public `gci_score`. Listings and demo companies return `score: null` with status `not_yet_scored` (see `services/score_policy.py`). Outcome rows may include `revisions[]`, `revision_direction` (raised/cut/unchanged), `final_guided_low/high` and a context-only `final_label`; the score always uses the opening band.
| GET | `/api/ops/pending-depth` | Depth backlog + optional `?bootstrap=true` |
| POST | `/api/ops/pending-depth/bootstrap` | Nifty M2 enqueue + PIT warehouse ensure |
| GET | `/api/ops/corpus-coverage` | Sensex hand_labeled Tier-1 gate rollup |
| GET | `/api/public/seo-dossiers` | Hand-labeled dossier titles/descriptions for prerender + sitemap (W5.2) |
| GET | `/api/og/{id}.png` · `/api/og/{id}.svg` | OG share card (W5.3) |
| GET | `/api/v1/companies` · `/{id}/gci` · `/{id}/gci/history` · `/api/v1/rankings` | Public-read aliases (W8.5) |
| GET | `/api/v1/index/files` · `/files/{name}` | Frozen daily GCI CSV + Parquet + checksum (W9.2). S3 when `INTELLENS_INDEX_S3_BUCKET` is set |
| GET | `/api/v1/index/digest` | Weekly ledger-move email preview (W9.6). Send via `python -m app.jobs.ledger_digest` |
| GET | `/api/companies/count` | Pagination |
| GET | `/api/entitlements/me` | Plan × role intersection (`features`, `limits`). Guest: `tracker` only |
| GET | `/api/companies/{id}/gci` | Full dossier payload; guest sessions cap at 15 opens (`403` `guest_dossier_cap` — paywall modal, not GCI change). Carries `coverage_status`, `confidence_tier`, `closed_periods`, `metrics_scored`, `as_of`, `algorithm_id`, `by_metric` (composite) + `context_metrics` (< 2 closed periods). No `sentiment`. |
| GET | `/api/companies/{id}/gci/history` | PIT points + Δ (citeable outcome as-of only) |
| GET | `/api/companies/{id}/changes` | WoW/MoM/QoQ/YoY — numeric only when `series_kind == "citeable_pit"` (≥ 4 reviewed dates); else `null` + `note` |
| GET | `/api/companies/{id}/analytics` · `/api/stocks/{id}/history` | **Seat-only** (`analytics_experimental`). Experimental — synthetic inputs; `401`/`403` for guests |
| GET | `/api/companies/{id}/wordmap` | **Seat-only** (`wordmap`) |
| GET | `/api/alerts` | Misses / dropped |
| GET | `/api/products` | Portfolio SKU catalog (Score / Cite / Radar / Ledger / Data / Sights) |
| GET | `/api/radar/feed` | CiteAlpha Radar change feed |
| GET | `/api/ledger/{company_id}` | CiteAlpha Ledger promise dossier |
| GET | `/api/data/catalog` | CiteAlpha Data export contracts |
| GET | `/api/sights/meta` | CiteAlpha Sights catalog + flags + refuse list |
| GET | `/api/sights/search` | Sights Search (+ Business Lexicon expand) |
| POST | `/api/sights/ask` | Sights Ask (cite-only) |
| GET | `/api/sights/themes` | Delivery Themes |
| GET | `/api/sights/street/{id}` | Street Context (not broker notes) |
| GET | `/api/sights/field/{id}` | Field Evidence |
| POST | `/api/sights/grid` | Compare Grid (`SIGHTS_GRID`) |
| POST | `/api/sights/deep-dive` | Deep Dive (`SIGHTS_DEEP_DIVE`) |
| GET | `/api/sights/fundamentals/{id}` | Fundamentals Strip |
| GET | `/api/sights/agents` · POST `/api/sights/agents/run` | Desk Agents |
| GET | `/api/sights/hooks` | Notify Hooks (Radar reuse) |
| GET | `/api/sights/export/{id}` | Cite Export markdown/csv/json |
| GET | `/api/sights/enterprise` | Trust / SSO / billing deep-links |
| GET | `/api/radar/diff/{company_id}` | QoQ guidance diff brief |
| GET | `/api/radar/calendar` | Open promise / result windows |
| GET | `/api/radar/digest/preview` | Weekly digest preview |
| POST | `/api/radar/digest/send` | Email digest (`RADAR_DIGEST=1`) |
| POST | `/api/radar/webhooks` | Webhook registration stub |
| GET | `/api/ledger/{company_id}/pdf` | Ledger PDF (API key) |
| GET | `/api/ledger/mirror/{company_id}` | IR Mirror (`IR_MIRROR=1`) |
| GET | `/api/cite/tiers` · `/api/cite/usage` | Cite API commercial tiers |
| GET | `/api/data/export/outcomes` | Bulk outcomes JSON/CSV/Parquet |
| GET | `/api/digest/vernacular/{company_id}` | Factual vernacular digest |
| GET | `/api/data/kpi-dictionary` | Metric ontology |
| GET | `/api/score/narrative-consistency/{id}` | NCI beta |
| GET | `/api/channel/trust-badge/{ticker}` | Broker badge channel |
| GET | `/api/workbench/extraction` | Ops workbench stub |
| GET | `/api/peers/{sector}` | Sector benchmark |

## Write / pipeline (session or API key; `require_feature`)

Writes are gated by **plan × role intersection**. Guest Bearer cannot piggyback `intellens-demo`. CSV/Parquet EM export needs `em_export` (Enterprise / One-Stop). Research chat / Sights Ask need `research_chat` / `sights_ask`.

| Method | Path |
|---|---|
| POST | `/api/extract`, `/api/extract/commit`, `/api/extract/pending` |
| POST | `/api/match` |
| POST | `/api/review` · GET `/api/reviews` |
| POST | `/api/labeling/drafts` · submit/accept/reject · `/api/labeling/import` |
| GET | `/api/labeling/companies` · `/api/labeling/drafts` |
| POST | `/api/companies/{id}/audit-flags` · DELETE `…/audit-flags/{flag}` (analyst-set; labeling) |
| POST | `/api/feedback` · GET `/api/feedback` (does not mutate GCI; quality kinds enqueue labeling-queue) |
| POST | `/api/activity/cite-copy` | Habit ping (no quote text); guests allowed |
| POST | `/api/orgs/{id}/partner-invite` · `/members/{user_id}/role` |
| POST | `/api/import/alphahunter` |
| POST | `/api/ingest/paste`, `/text`, `/url`, `/bootstrap`, `/media` |
| POST | `/api/ingest/crawl` · GET `/api/ingest/crawl/status` |
| POST | `/api/ingest/refresh` | live 6h job: crawl + extract queue + FMP warm |
| POST | `/api/actuals/import`, `/api/consensus/import` |
| POST | `/api/admin/reset-demo` | platform `system.ops` only — wipes JSON store **and** persisted tenant state |

## Platform admin portal

Requires `platform_admin_role` on session user or API key. See `docs/ADMIN_PORTAL.md`.

| Method | Path | Permission |
|---|---|---|
| GET | `/api/admin/portal/me` | any platform role |
| GET | `/api/admin/portal/orgs` | `orgs.read` |
| GET | `/api/admin/portal/users` | `users.read` |
| PATCH | `/api/admin/portal/users/{id}/platform-role` | `users.write` (super) |
| GET/PATCH | `/api/admin/portal/feedback` | `feedback.read` / `feedback.write` |
| GET/POST | `/api/admin/portal/legal` · `/legal/attest` | `legal.read` / `legal.write` |
| GET | `/api/admin/portal/billing` | `billing.read` |
| GET | `/api/admin/portal/audit` | `audit.read` |
| POST | `/api/admin/portal/pilot` | `pilot.manage` |

## Research

`/api/research/search`, `chat`, `snapshot/{id}`, `estimates/{id}`, `brief/{id}`, `news`, `watchlist`, `transcripts`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/citations?company_id=` | Citeable outcome records + bibliographic / markdown / IC footnote |
| GET | `/api/citations/{citation_id}` | Lookup `cite_*` (outcomes) or document fingerprint; includes `document_text`, span offsets, `highlight_url` |
| GET | `/api/documents` | Indexed corpus list |
| GET | `/api/documents/{doc_id}` | One filing/transcript body for in-app highlight |
| POST | `/api/research/chat` | Cite-only; numbered `[1]` markers bound to citation objects |
| GET | `/api/research/watchlist` | Optional `ids=` or Bearer `preferences.watchlist`; else default slice |
| GET | `/api/trust` | Public Trust Center (security + CSP, residency, SSO, citations, source-link verification n of N, filing-to-score SLA, labeling governance, counsel, subprocessors) |

## Product extras

| Path | Purpose |
|---|---|
| `/api/vernacular/{id}` | Lang blurbs |
| `/api/badge/{ticker}` (+ `/svg`) | Embed **GCI** badge (`data-citealpha-badge`; ticker, score, tier, as-of). Not a Trust Score. |
| `/api/compliance/sebi-note` | Disclaimer text + Ocotillo entity |
| `/api/legal/meta` · `/terms` · `/privacy` | Copyright, Terms, Privacy (counsel_status, contact_email) |
| `/api/export/em-factor/{id}` | Factor export · honest `series_kind` |
| `/api/v1/pit/contract` · `/companies/{id}/history` · `/bulk` | Design-partner PIT contract (`series_kind_enum`: citeable_pit · citeable_pit_short · hand_labeled_incomplete_citations · not_yet_scored) |
| `GET /api/v1/index/ledger?company_id=&limit=` | Append-only score ledger (`score_ledger.jsonl`); one row per published level |
| `GET /api/v1/index/changelog?company_id=` | Public changelog (`score_changelog.json`), feeds `/changelog` |
| `/api/reports/generate` | IC audit dossier markdown/json/pdf |
| `/api/public/gci-rankings` | Citeable-only public rankings |
| `/api/ops/throughput` | Extract→review citeable backlog |
| `/api/orgs/pilot` · `/orgs/{id}/pilot-checklist` | Pilot template + conversion checklist (`activity.dossier_opens` / `citations_copied`) |
| `/api/csm/{org_id}` | CSM dashboard + `labeling_audit` (submitter/reviewer ids) |
| `/api/metrics` | Parameter catalog |
| `/api/auth/*` | Register (B2B desk + terms; retail 403 until `sebi_retail`), login, guest, verify-email, password-reset, accept-invite, SSO |
| POST | `/api/pilot-request` | Public pilot intake (abuse challenge; stored as pending for admin review) |
| GET/PATCH | `/api/admin/portal/pilot-requests` | List / approve / reject inbound pilot requests (`pilot.manage`) |
| `/api/orgs/{id}/invites` · `/revoke` · `/members` · `/api-keys` · `/oidc` | B2B seat admin |
| `/api/infra/postgres` | DB readiness |
| `/api/markets`, indexes, history | Multi-market scaffold |

## Frontend contract

All UI calls go through `frontend/src/lib/api.ts`. Do not add ad-hoc `fetch` in pages without updating that module + types.
