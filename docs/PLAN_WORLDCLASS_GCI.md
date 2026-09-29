# Plan — World-class GCI (Round-3 review remediation)

**Status:** planning approved for execution · **Created:** 2026-09-28 · **Owner:** product + `index-steward`
**Source:** Round-3 full-site review (28 Sep 2026): live citealpha.com walk, production API probes, three code audits (scoring/data, frontend/copy, enterprise/legal).
**Execute with:** skill `citealpha-worldclass-remediation` · always-on rule `index-integrity` · copy rule `public-copy-voice`.

---

## 0. Goal and definition of "world-class"

**Goal.** GCI becomes the number an Indian equity desk, an IR team, or a journalist reaches for when asking *"did management deliver on guidance?"* — and can cite without caveats.

**World-class, for a domain expert, means (acceptance bar for the whole plan):**

| # | Bar | How we know |
|---|---|---|
| B1 | Every public number is real, dated, tiered, reviewer-stamped, and traceable to **two** filings (promise + actual) | `tests/test_index_integrity.py` green; guest walk shows no synthetic value |
| B2 | Scores discriminate: no ten-way tie at 100 on n=1 | Distribution of `established` cohort has ≥ 5 distinct deciles; Public Snapshot ranks only `established`/`deep` |
| B3 | Any score change is explained publicly the same day | `/changelog` + ledger; Round-2 style reviewer finds no unexplained move |
| B4 | A PM understands a dossier in one read: ≤ 6 panels, plain finance English, display names, units | `citealpha-expert-ux` checklist; copy-hygiene test; 5-minute hallway test with 2 analysts |
| B5 | A journalist can find and quote a company page from Google and share it | Dossiers indexed, OG share card, "Cite this page" |
| B6 | An enterprise buyer sees three plans, honest billing status, real security posture | Package = 3 plans; no counsel/env leakage; session TTL, MFA/SAML roadmap, grievance officer |
| B7 | GCI can be licensed as an index | Governance charter, frozen files, licence pack, external row audit |

---

## 1. Findings register (R3-nn)

Severity: **P0** blocks external quoting · **P1** before wider demo · **P2** platform. `W` = workstream that closes it.

### Index & data
| ID | Sev | Finding | Evidence | W |
|---|---|---|---|---|
| R3-01 | P0 | 30/39 scored companies = 100.0; 35/43 hand-labeled have ≤2 closed periods; Snapshot is a tie at 100 with n=1 | `/api/companies`, `/api/public/gci-rankings` | W1, W2 |
| R3-02 | P0 | Synthetic PIT random walk (±3 pts, anchor 70.0 default) drives WoW/MoM/QoQ/YoY, GCI↔price, Granger on real companies | `pit_warehouse.py:43-72`, `repository.py:1301-1361`, `changes.py:311-318` | W1 |
| R3-03 | P0 | "Demo tape" 5Y price series on Screener and dossier | `HomePage.tsx` history panel; `CompanyDetailPage.tsx:797-1018` | W1 |
| R3-04 | P0 | Infosys 48.2 → 88.2 in one day, unlogged; no immutable score ledger; `INTELLENS_GCI_VERSION` can move published numbers silently | `docs/kb/03-scoring.md` changelog stops 27 Sep; `gci_scoring.py:85-95` | W1 |
| R3-05 | P0 | Composite = flat mean of metric scores; one single-period metric (op-margin 100) lifted Infosys from 76.5 to 88.2 | `gci_scoring.py:398-411` | W1 |
| R3-06 | P0 | `low_confidence` / sector shrinkage documented but never wired | `gci_scoring.py:416-418`; no `sector_mean` caller | W1 |
| R3-07 | P0 | Guidance-side citation on only 6/105 rows; FY25 op-margin "met" against "typical framing" | `hand_labeled.py`; `/api/companies/infy/gci` | W2 |
| R3-08 | P0 | Labeling governance empty: drafts/submitted/accepted = 0; `audit.json` has no labeler attribution | `/api/trust.labeling_governance`; `audit.json` | W2 |
| R3-09 | P0 | No filing → score pipeline; outcomes hand-edited in Python; 4 source URLs verified in CI, 4 known broken | `refresh.py`, `test_source_verify.py` | W2 |
| R3-10 | P1 | Audit flags are keyword heuristics, not analyst-set | `guidance_flags.py:43-73` | W2 |
| R3-11 | P1 | Revisions populated for 6/105 rows while copy promises "every revision shown" | `hand_labeled.py` | W2 |

### Dossier / Screener / Snapshot UX
| ID | Sev | Finding | Evidence | W |
|---|---|---|---|---|
| R3-12 | P0 | Dossiers `noindex`, generic title, absent from sitemap | `seo.ts:102-109`, `sitemap.xml` | W5 |
| R3-13 | P1 | Unrendered template `[85:{o.span_end}]` on every source locator | `EvidenceTable.tsx:189` | W3 |
| R3-14 | P1 | Screener default sort puts "Not yet scored" first | `HomePage.tsx:123` | W4 |
| R3-15 | P1 | Dossier header: no "as of", no reviewer stamp, no one-sentence record, no calc panel, no share/permalink | `CompanyDetailPage.tsx` | W3 |
| R3-16 | P1 | Guest sees workflow chrome (Run extract, Accept/reject, review queue) and 15+ panels (Ledger, IR Mirror, NCI beta, Radar diff, wordmap stub, vernacular, One-Stop/AlphaHunter/CSM link) | dossier innerText | W3 |
| R3-17 | P1 | Raw metric ids in alerts, tables, revision trail (`revenue_growth_cc_pct`, `production_volume_mmt`); enum strings (`RESOLVED_EXCEEDED`) | Screener alerts; dossier | W3, W4, W6 |
| R3-18 | P1 | "Δ ACTUAL YoY +200%" (YoY of a growth rate); "Δ VS GUIDE 110" unit-less | `EvidenceTable.tsx` | W3 |
| R3-19 | P1 | Public Snapshot: no QualityBadge/tier per row; Top/Lowest framing on ties; Markdown-only export | `RankingsPage.tsx:67-102` | W4 |
| R3-20 | P1 | Screener kicker/lede engineer-voiced ("INDIA-DEEP; OTHER MARKETS ARE SCAFFOLDS", "primary desk signal", "citeable corpus hits"); 6 ⓘ in 4 lines; scaffold markets in dropdown; Δ column clipped ≤ 950 px | `en.json home.*`; screenshot | W4, W6 |
| R3-21 | P1 | `sector avg 97.6`, `Peer #5` meaningless while cohort is degenerate | dossier header | W3 |
| R3-22 | P2 | Disclosure Explorer has 13 sub-surfaces in Beta; raw `/research` as link text | `SightsLayout.tsx`, `SightsHubPage.tsx` | W7 |

### Copy, naming, compliance
| ID | Sev | Finding | Evidence | W |
|---|---|---|---|---|
| R3-23 | P1 | Badge endpoint labels GCI "Promoter/Management Trust Score"; embed attr `data-intellens-badge` | `routes.py:709-710` | W6 |
| R3-24 | P1 | "AlphaHunter" user-visible (Workbench tab, Package, One-Stop copy) | `DeskPage.tsx:1370`, `en.json:441,682` | W6 |
| R3-25 | P1 | `sentiment` field in dossier payload; "signal" in Screener/Research copy | `/api/companies/{id}/gci`; `en.json:74,1137` | W1, W6 |
| R3-26 | P1 | Leftover Tracker / Desk / Research Terminal / Sights / Rankings in UI strings, blog, glossary, Terms, customer docs | `en.json:1120,1172,1327,1587,1612`, `blogPosts.ts:47,98`, `glossary.ts:202`, `legal.py:82`, `docs/customer/*` | W6 |
| R3-27 | P1 | Package page: 4 plans × 5 SKUs × 5 surfaces; repo path on page; "Wordmap (stub)", "Granger… non-citeable scaffold", "EOD may be demo", retail-attestation status; "paid seats" while billing is a stub | `PackagePage.tsx`, `en.json package.*` | W7 |
| R3-28 | P1 | Public `/api/trust` and GuestPaywall expose counsel status, `INTELLENS_RETAIL_MARKETING`, SSO `production_ready:false`, "backups ops-dependent" | `/api/trust`; `GuestPaywallModal.tsx:62-65` | W8 |
| R3-29 | P1 | Privacy names Plausible only while GA4 loads; no Grievance Officer; privacy contact `sales@`; LLM processor unnamed; no refund clause | `analytics.ts:14-15`, `legal.py:248-304` | W8 |
| R3-30 | P2 | Debug-ish gate text "Current access: guest / guest"; unlock hint "Desk plans" | `en.json:1615` | W6 |

### Enterprise / platform
| ID | Sev | Finding | Evidence | W |
|---|---|---|---|---|
| R3-31 | P0 | SEBI RA characterisation memo outstanding; retail marketing gated off | `COMPLIANCE.md:18-31`; `/api/trust` | W8 |
| R3-32 | P1 | Sessions never expire; password min 6; no MFA/SAML/SCIM; no auth-event audit | `session_auth.py:187-234` | W8 |
| R3-33 | P1 | 188 routes in public Swagger incl. `/api/admin/reset-demo`, `/api/infra/db/migrate`, `/api/import/alphahunter`; CORS `*`; only PIT under `/api/v1` | `/openapi.json`; `main.py:10-21` | W8 |
| R3-34 | P1 | Billing stubbed (no PSP) while Package sells seats; SLA 99.x% illustrative on Spot/idle infra; JSON data store in container | `billing.py:126-171`; `COVERAGE_AND_SLA.md:21-26`; go-live checklist | W7, W8 |
| R3-35 | P1 | FMP price licence posture and IR/transcript redistribution rights unreviewed | `fmp_client.py`, `crawl.py` | W8 |
| R3-36 | P2 | Customer docs / GAPS / ACCURACY / PRODUCT_DEFINITION stale vs score policy and names | `GAPS_AND_ROADMAP.md:7,41`, `ACCURACY_ASSESSMENT.md:10`, `FAQ.md:10,30` | W6 |
| R3-37 | P2 | No SDK, feed spec, Excel/terminal delivery, RSS; social kit only | — | W9 |

### Index governance
| ID | Sev | Finding | Evidence | W |
|---|---|---|---|---|
| R3-38 | P1 | No methodology governance (versioned doc, change control, consultation), no frozen index files, no corrections policy page | `docs/` search | W9 |
| R3-39 | P1 | No index licence agreement / attribution rules / mark usage; Terms only "non-redistribution" | `legal.py:122-129`, `ORDER_FORM.md` | W9 |
| R3-40 | P2 | No external verification of a labeled sample; coverage/depth targets not stated as commitments | — | W9 |

---

## 2. Workstreams and tasks

Task ids `Wn.m`. **Owner** = agent · skill. **Effort** in engineer-days. Every task: failing test first, then implementation, then kb/plan update.

### W1 — Stop the bleeding: nothing synthetic, tiers, ledger, changelog (closes R3-01..06, R3-25 part)
Owner: `index-steward` + `gci-engineer` · skills `citealpha-index-integrity`, `citealpha-gci-dev`

| Task | Work | Files | Acceptance | Effort |
|---|---|---|---|---|
| W1.1 | Gate every Δ/PIT/analytics output behind `series_kind == "citeable_pit"`; return `null` otherwise. Remove `anchor = 70.0`; `build_company_pit_series` returns `[]` when anchor is None. Remove `demo_multi_horizon` fallback from `gci_change_bundle_for`. | `pit_warehouse.py`, `repository.py:1301-1361`, `changes.py`, `gci_score_cache.py:127-133`, `gci_rankings.py`, `pit_contract.py` | `/api/companies`, `/{id}/gci`, `/gci/history`, `/api/v1/pit/*`, `/api/public/gci-rankings` contain no numeric Δ or PIT point for any company without ≥4 citeable as-of points. New `tests/test_index_integrity.py::test_no_synthetic_numbers_public` | 2 |
| W1.2 | Remove from guest/public UI: demo tape panels (Screener + dossier), GCI↔price overlay, Granger/LASSO, lead-lag, impact map, wordmap, NCI beta, `sentiment`. Move to Workbench behind `analytics_experimental` entitlement with *Experimental — synthetic inputs* banner. Drop `sentiment` from `CompanyGCIDetail`. | `HomePage.tsx`, `CompanyDetailPage.tsx:797-1018`, `Charts.tsx`, `schemas.py`, `routes.py`, `DeskPage.tsx` | Guest dossier innerText contains none of: "Demo tape", "Granger", "LASSO", "impact", "Wordmap", "NCI", "sentiment". E2E `dossier-public.spec.ts` | 2 |
| W1.3 | Confidence tiers in `score_policy.py`: `provisional` (<3 closed periods or 1 metric) · `established` (≥3, ≥2 metrics) · `deep` (≥5, ≥2). Add `confidence_tier`, `closed_periods`, `metrics_scored`, `as_of`, `algorithm_id` to `CompanySummary` and `CompanyGCIDetail`. Rankings include only `established`/`deep`. | `score_policy.py`, `schemas.py`, `repository.py`, `gci_rankings.py`, `api.ts` | Every scored company carries a tier; `/api/public/gci-rankings.universe_n` = count of established+deep; `test_index_integrity.py::test_tiers` | 1.5 |
| W1.4 | Evidence-weighted composite: metric weight = closed periods (capped 5); metric with <2 closed periods is context-only (shown, not in composite). Update methodology copy (`landing.method.score.text`, `method.page.company.*`) and the homepage calc panel. | `gci_scoring.py:398-411`, `en.json`, `LandingWorkedExample.tsx` | Infosys composite documented before/after; `test_gci_scoring_v4.py::test_evidence_weighting`; methodology and calc panel agree | 1.5 |
| W1.5 | Resolve sector shrinkage: **remove** from docs/UI (decision: not wired; degenerate cohort makes sector means meaningless). Remove `Peer #`/`sector avg` from dossier header until ≥ 5 established names per sector. | `gci_scoring.py`, `03-scoring.md`, `MethodologyPage`, `CompanyDetailPage.tsx:316-320` | No public text mentions shrinkage; header shows tier instead of peer rank | 0.5 |
| W1.6 | Score ledger: append-only `backend/app/data/score_ledger.jsonl`; job `python -m app.jobs.snapshot_scores` writes one row per scored company with `algorithm_id`, `dataset_version`, `tier`, `reason`; API `GET /api/v1/index/ledger?company_id=`; pin `algorithm_id` in every score response. | new `services/score_ledger.py`, `jobs/snapshot_scores.py`, `routes.py`, `05-api-map.md` | Ledger has rows for all 39 scored names incl. the Infosys 48.2→88.2 move with reason; `test_index_integrity.py::test_ledger_append_only` | 2 |
| W1.7 | Public `/changelog` page fed from `docs/kb/03-scoring.md` table (or a JSON mirror) + per-company filter; link from dossier footer and methodology. Backfill the 28 Sep Infosys change and the v4/flag changes. | `pages/ChangelogPage.tsx`, `seoRoutes.json`, `03-scoring.md`, `SiteFooter.tsx` | `/changelog` lists ≥ 4 entries; dossier footer "Changelog (Infosys)" filters to that company | 1 |
| W1.8 | Screener sort: unscored last in both directions; default filter = scored; "Not yet scored — no analyst-reviewed guidance yet" tooltip. | `HomePage.tsx:120-137` | First row on `/tracker` is a scored company; E2E asserts | 0.25 |

**Gate G-A:** W1 done; deploy; guest walk finds zero synthetic values; Round-2 reviewer note updated with the logged Infosys path 48.2 → 88.2 (flag change) → 76.5 (v4.1 evidence weighting) + link to `/changelog?company=infy`. *Status 2026-09-28: code + tests + local docker verified; production deploy pending.*

### W2 — Evidence depth and governance (closes R3-07..11)
Owner: `labeling-analyst` + `index-steward` · skills `citealpha-labeling`, `citealpha-index-integrity`

| Task | Work | Files | Acceptance | Effort |
|---|---|---|---|---|
| W2.1 | **Done 2026-09-29.** Schema: `reviewed_by`, `reviewed_at`, `guidance_source_url/quote/as_of` **required** for a row to score; else label `pending_guidance_cite` (excluded, shown as context). | `gci_scoring.py` (`GuidanceOutcome`), `score_policy.py`, `schemas.py`, `hand_labeled*.py` | `test_index_integrity.py::test_dual_citation_required`; Infosys FY25 op-margin row excluded until cited | 1 |
| W2.2 | Backfill promise citations for all 105 rows (results release / transcript that set the band, date, quote). Priority: Infosys, Apollo, TCS, HCL, Wipro, Titan, Asian Paints (multi-period names). | `hand_labeled.py`, `hand_labeled_nifty.py` | `guidance_source_url` ≥ 100/105; ledger rows for any score that moves | 6 (analyst) |
| W2.3 | Depth: raise ≥ 15 Sensex names to ≥ 3 closed periods × 2 metrics (revenue growth + margin or volume) from FY22–FY26 filings. Target: ≥ 20 `established` companies. | labeled data + `LABELING_PLAYBOOK.md` | `/api/public/gci-rankings.universe_n ≥ 20`; distribution has ≥ 5 distinct deciles | 15 (analyst) |
| W2.4 | Revisions backfill for every multi-raise name (IT services, Apollo, HDFC Life…); revision trail renders from data, not prose. | `hand_labeled*.py` | `revisions` non-empty on ≥ 40 rows | 4 (analyst) |
| W2.5 | **Done 2026-09-29.** Labeling governance: promote-to-hand_labeled writes `label_accept` to `audit.json` with submitter/reviewer; `/api/trust.labeling_governance` counts real; dossier shows "Reviewed by analyst · dd Mon yyyy". | `labeling.py`, `audit_log.py`, `routes.py`, `CompanyDetailPage.tsx` | Governance counts > 0; every scored row has `reviewed_by`; E2E asserts stamp | 1.5 |
| W2.6 | **Done 2026-09-29.** Analyst-set audit flags: persist `audit_flags[]` with source + reviewer on the company; keyword heuristics only enqueue a review-queue suggestion. | `guidance_flags.py`, `labeling_queue.py` | No flag applied without `set_by`; test | 1 |
| W2.7 | **Done 2026-09-29.** Universe-wide source verification job (nightly): download every `source_url`/`guidance_source_url`, verify quote presence; failures → `citeable=false` + review queue; publish "n of N links verified" on Trust. | `source_verify.py`, `jobs/verify_sources.py`, `TrustPage` | Job runs in CI/scheduler; 4 known-broken rows re-cited or excluded | 2 |
| W2.8 | **Done 2026-09-29.** Filing-to-score SLA: define and publish "score updated within N business days of results filing"; instrument `refresh.py` to record filing date → review date → publish date per row. | `refresh.py`, `pending_depth.py`, `/methodology`, `COVERAGE_AND_SLA.md` | Median latency shown on Methodology from real data; no illustrative SLA left. **Target 5 business days** (filings on/after 29 Sep 2026). Observed backfill median from 6 dual-cited rows; live n=0. | 1.5 |

### W3 — Public dossier for experts (closes R3-13, 15–18, 21)
Owner: `frontend-designer` · skill `citealpha-expert-ux`

| Task | Work | Files | Acceptance | Effort |
|---|---|---|---|---|
| W3.1 | **Done 2026-09-29.** Header rebuild: score · tier chip · "Data as of" · reviewer stamp · one-sentence record. | `CompanyDetailPage.tsx`, new `components/RecordSentence.tsx`, `en.json` | E2E `dossier-public.spec.ts` asserts all five header elements | 1.5 |
| W3.2 | Delivery record panel: outcome chips + per-metric rows (display name, closed periods, metric score, "context only" when <2). | `CompanyDetailPage.tsx`, `lib/score.ts` | Matches `/api/companies/{id}/gci.by_metric` | 1 |
| W3.3 | Evidence table rewrite: Promise source + Actual source columns (date + link; quotes on expand); fix `{o.span_end}`; drop doc hashes, cite ids to a "Copy citation" action; replace "Δ ACTUAL YoY" with level + guided-vs-actual gap in metric units; label "Points" with ⓘ→methodology. | `EvidenceTable.tsx` | No `{` in rendered text; each row shows two dated links; unit test for locator string | 1.5 |
| W3.4 | Revision trail: opening → revisions → final, with outcome vs final as context; human labels (Raised / Cut / Reiterated). | `RevisionTimeline.tsx`, `ThreadTimeline.tsx` | No enum strings in innerText | 0.75 |
| W3.5 | "How this score is calculated" panel reused from homepage (`example-calc`) for every company. | `LandingWorkedExample.tsx` → extract `ScoreCalcPanel.tsx` | Same numbers as header; test | 0.75 |
| W3.6 | Footer: Methodology · Changelog (company) · Cite this page (permalink + markdown + BibTeX-style) · Report an error (mailto with company id) · Disclaimer. | `CompanyDetailPage.tsx` | Links resolve; copy-cite tracked via `/api/activity/cite-copy` | 0.5 |
| W3.7 | Move to Workbench (pilot seat): Run extract, review queue, Ledger/PDF, IR Mirror, Radar diff, PIT export, notes, IC dossier, vernacular, wordmap, analytics. Dossier gets a single "Open in Analyst Workbench" link for seated users. | `CompanyDetailPage.tsx`, `DeskPage.tsx`, `deskPaths.ts` | Guest dossier ≤ 6 panels; seated user still reaches every moved feature | 2 |
| W3.8 | **Done 2026-09-29.** 390 px set in `docs/reviews/2026-09-29/` (home, Screener, Infosys dossier, Snapshot). Tables use horizontal scroll under 420 px; dossier section nav stays sticky. | `styles.css`, `docs/reviews/2026-09-29/` | Screenshots filed | 0.75 |

### W4 — Screener and Public Snapshot (closes R3-14, 19, 20)
Owner: `frontend-designer` + `gci-engineer`

| Task | Work | Files | Acceptance | Effort |
|---|---|---|---|---|
| W4.1 | Screener columns: ☆ · Company · Sector · GCI · Tier · Closed results · Last filing · Record chips; Δ only when citeable. Remove demo tape panel and scaffold-market dropdown from public; keep index tabs (Sensex, Nifty 50…). | `HomePage.tsx`, `api.ts`, `CompanySummary` | Table fits 1024 px without clipping; E2E column assertions | 1.5 |
| W4.2 | Copy: kicker "Covers Indian listed companies · Sensex scored · Nifty 50 in progress"; lede one sentence; ≤ 2 ⓘ; alerts use display names + guided vs reported numbers. | `en.json home.*`, `routes.py` alerts message builder | Copy-hygiene test passes with "signal", "corpus hits", "scaffold" banned | 0.75 |
| W4.3 | Public Snapshot → delivery-record table until ≥ 20 established: company · tier · met/exceeded/missed · last filing; badge per row; CSV export; permalink `?as_of=`. Re-enable "ranked" mode automatically when the threshold is met. | `RankingsPage.tsx`, `gci_rankings.py` | No "Top/Lowest" headings while `universe_n < 20`; CSV download works | 1.5 |
| W4.4 | Sector leaderboard rows badge/tier; hide sectors with < 3 established names. | `SectorLeaderboard.tsx` | Test | 0.5 |

### W5 — Findable and citable (closes R3-12)
Owner: `frontend-designer` · rule `seo-marketing`

| Task | Work | Files | Acceptance | Effort |
|---|---|---|---|---|
| W5.1 | **Done 2026-09-29.** Indexable dossiers for hand_labeled names: title with GCI + as-of, record description, Dataset + Breadcrumb JSON-LD. Non-hand-labeled stay `noindex`. | `seo.ts`, `seoJsonLd.ts` | Lighthouse SEO ≥ 95 on `/companies/infy`; `robots` meta correct per quality | 1 |
| W5.2 | **Done 2026-09-29.** Prerender + sitemap for hand_labeled `/companies/:id` (API or `seoDossiers.json` snapshot). | `prerender-seo.mjs`, `seo-shared.mjs`, `sitemap.xml` | Sitemap lists 43 dossiers with `lastmod` = as_of | 1 |
| W5.3 | **Done 2026-09-29.** OG share card `GET /api/og/{id}.png` (+ SVG): name, GCI, tier, record, as-of, not-advice. | new `routes.py /api/og/{id}.png` or build-time | LinkedIn/X preview shows card | 1.5 |
| W5.4 | Badge endpoint: label → "Guidance Credibility Index (GCI)"; attr `data-citealpha-badge`; include tier + as-of; SVG restyled. | `routes.py:699-720` | **2026-09-29:** label GCI; `data-citealpha-badge`; JSON has `gci_score` + `confidence_tier` + `as_of`; SVG restyled. Hygiene bans Trust Score / intellens in badge strings. | 0.5 |

### W6 — Copy voice and naming sweep (closes R3-17, 23–26, 30, 36)
Owner: `compliance-reviewer` + `frontend-designer` · rule `public-copy-voice`

| Task | Work | Files | Acceptance | Effort |
|---|---|---|---|---|
| W6.1 | Extend `test_public_copy_hygiene.py` banned list: AlphaHunter, intellens, Trust Score, Promoter, signal, alpha, OS, CSM, One-Stop, corpus hits, scaffold, stub, PIT scaffold, hybrid_pit, pit.v1, Tier-1 gate, `INTELLENS_`, `docs/`, `Current access:`, `{o.`; scan en.json, tsx, glossary, tours, blog, llms.txt, API string constants. | `backend/tests/test_public_copy_hygiene.py` | Test fails today; passes after W6.2–W6.4 | 0.5 |
| W6.2 | `metricDisplayName()` + unit map in `lib/score.ts` and backend `metrics.py`; use everywhere (alerts, tables, threads, Radar, exports). | `lib/score.ts`, `metrics` catalog, `routes.py` | grep for `_pct"` in rendered E2E text returns nothing | 1 |
| W6.3 | **Done 2026-09-29.** Remaining English surface names updated. 16 locales: legacy strings (One-Stop, scaffold market copy, demo tape) reset to current English. Keys listed in `frontend/src/i18n/translation-backlog.json` until translated. | `en.json`, `locales/*.json`, `translation-backlog.json` | Hygiene test green | 1.5 |
| W6.4 | Docs sweep: `docs/customer/*`, Terms (`legal.py:82`), `GAPS_AND_ROADMAP.md`, `ACCURACY_ASSESSMENT.md`, `PRODUCT_DEFINITION.md`, `kb/06-frontend-ux.md` → current names, score policy, coverage table (one source: `/api/meta`). | listed docs | No stale names; one coverage table referenced everywhere | 1.5 |

### W7 — Package, plans, product surface reduction (closes R3-22, 27, 34 part)
Owner: `product-strategist` + `frontend-designer` · skills `citealpha-product`, `citealpha-expert-ux`

| Task | Work | Files | Acceptance | Effort |
|---|---|---|---|---|
| W7.1 | **Done 2026-09-29.** Package page = three plans (Pilot · Desk seat · Enterprise API/Data), quote CTA, no checkout, no SKU matrix. | `PackagePage.tsx`, `en.json package.*` | Page ≤ 1 screen of copy above plans; hygiene test green; `BillingPage` reachable only when signed in | 1.5 |
| W7.2 | Products page → "What you get" (Screener, Workbench, Filing Search, API) with SKU names demoted to an appendix; Tier-features page folded into Help. | `ProductsPage.tsx`, `TierFeaturesPage.tsx`, routes | Nav "More" has ≤ 5 items | 1 |
| W7.3 | Disclosure Explorer: collapse to Search · Ask · Compare (grid); Boards/Themes/Street/Field/Deep Dive/Fundamentals/Agents/Export/Settings behind `SIGHTS_ADVANCED` flag, off in prod. | `SightsLayout.tsx`, `App.tsx`, `feature_flags.py` | Public nav shows 3 items; E2E sights spec updated | 1 |
| W7.4 | Workbench first-run + gate copy: "Pilot seats (complimentary, 30–60 days) and Desk seats"; remove "Current access: guest / guest". | `en.json`, `PlanAccessGate.tsx` | Hygiene | 0.25 |

### W8 — Legal, privacy, security, ops hardening (closes R3-28, 29, 31–35)
Owner: `platform-engineer` + `compliance-reviewer` + `devops-aws`

| Task | Work | Files | Acceptance | Effort |
|---|---|---|---|---|
| W8.1 | Counsel: SEBI RA characterisation memo; `POST /api/legal/attest kind=terms_privacy`; decide retail. **User decision + external.** | `legal_attest.py`, Trust | `counsel_status` attested; retail flag per memo. **2026-09-29:** retail **off** (register 403); counsel attest still external (do not self-attest). | ext |
| W8.2 | **Done 2026-09-29.** Remove counsel/attestation status, env-flag names, SSO readiness booleans, "backups ops-dependent" from public `/api/trust`. Kept on `/api/admin/portal/trust` + `/api/legal/meta`. | `routes.py /api/trust`, `GuestPaywallModal.tsx` | Public trust JSON has no `counsel_*`, `INTELLENS_*`, `production_ready` keys | 0.5 |
| W8.3 | Privacy/Trust: list GA4 + Plausible + named LLM processor; Grievance Officer (name, email, address); privacy@ contact; refund/cancellation clause; retention table. | `legal.py`, `TrustPage`, `LegalPage` | Counsel-reviewed text live; versions bumped | 1 + ext |
| W8.4 | Sessions: TTL ≤ 12 h idle / 30 d absolute with refresh; password ≥ 12; MFA (TOTP) for owner/admin; auth-event audit (login, fail, logout, invite, revoke, key create) with export. | `session_auth.py`, `auth.py`, `audit_log.py`, `AccountSettingsPage` | `test_production_auth.py` extended | 3 |
| W8.5 | **Done 2026-09-29.** Public OpenAPI is an allowlist (≤ 40 paths): v1 companies/gci/history/rankings, ledger, changelog, files, digest, badge, OG, trust, legal, meta. Auth, billing, labeling, and ops stay callable and out of `/openapi.json`. | `main.py`, `API_QUICKSTART.md` | `test_public_api_surface.py` asserts `len(paths) <= 40` | 2 |
| W8.6 | **Applied 2026-09-29.** Overlay deployed: on-demand Fargate (base 1, no Spot), EFS auth, alarms, EFS backup, index S3. Idle script refuses. Local backup drill passed. Postgres still opt-in (no RDS). SMTP on the task is Mailtrap. | `deploy/aws/production.overlay.tfvars`, live ECS `intellens-gci-aws-app` | citealpha.com `/health` ok; service capacity provider FARGATE | 4 |
| W8.7 | Data rights: FMP commercial licence or drop prices entirely (recommended: drop — not an input to GCI); IR/transcript ToS memo; link-out policy documented on Trust. | `fmp_client.py`, Trust copy | Decision logged; no price data on public pages | 0.5 + ext |
| W8.8 | **Done 2026-09-29. Quote only, no PSP.** Retail checkout and confirm return 403 even if retail marketing were later attested. Billing page has no checkout button. | `billing.py`, `BillingPage.tsx` | `test_billing_quote_only_refuses_checkout` | 3 (if PSP) |

### W9 — GCI as a licensable index (closes R3-37..40)
Owner: `index-steward` + `product-strategist`

| Task | Work | Files | Acceptance | Effort |
|---|---|---|---|---|
| W9.1 | Methodology document v1.0 (PDF + `/methodology`): definitions, eligibility, tiers, formula with worked numbers, revisions, deductions, data sources, review process, latency, corrections, versioning, governance committee, consultation process. Reference IOSCO Principles for Financial Benchmarks and SEBI (Index Providers) Regulations 2024 where applicable. | `docs/index/GCI_METHODOLOGY_v1.md`, `MethodologyPage` | Two external readers (one quant, one compliance) sign off | 3 |
| W9.2 | **Done 2026-09-29.** Daily CSV + Parquet + sha256 from the ledger. `GET /api/v1/index/files` and `…/files/{name}`. S3 upload when `INTELLENS_INDEX_S3_BUCKET` is set (bucket in the production overlay, not created until apply). | `jobs/publish_index_files.py`, `services/parquet_plain.py`, `routes.py` | `test_index_distribution.py` | 2 |
| W9.3 | Corrections & restatement policy page; every correction → ledger `reason=data_correction` + changelog + email to licensees. | `/changelog`, `docs/index/CORRECTIONS_POLICY.md` | Policy linked from Methodology and Trust | 0.5 |
| W9.4 | Index licence pack: display vs redistribution vs derived-use tiers, attribution rules ("GCI by CiteAlpha, data as of…"), mark usage, pricing for media/brokers/platforms; order form. | `docs/index/INDEX_LICENSE.md`, `docs/customer/ORDER_FORM.md` | Counsel-reviewed | 2 + ext |
| W9.5 | External verification: independent reviewer re-checks a random 30-row sample against filings; publish result on Trust. | `docs/index/VERIFICATION_2026Q4.md` | Published with pass rate | ext |
| W9.6 | **Done 2026-09-29.** Python + TS SDK, changelog RSS, weekly ledger digest (`python -m app.jobs.ledger_digest`, scheduler when `INTELLENS_LEDGER_DIGEST=1`). Mail stubs until SMTP and `INTELLENS_LEDGER_DIGEST_TO` are set. | `services/ledger_digest.py`, `sdk/`, `API_QUICKSTART.md` | `test_sdk_smoke.py`, `test_index_distribution.py` | 3 |
| W9.7 | Coverage commitments: publish "Sensex 30 ≥ established by <date>; Nifty 50 by <date>" **only** after user supplies dates. | homepage coverage panel | **2026-09-29:** Sensex 30 and Nifty 50 Established by **31 March 2027**. Live on homepage coverage panel. | 0.25 |

---

## 3. Phasing, gates, sequencing

| Phase | Weeks | Workstreams | Gate |
|---|---|---|---|
| **A — Stop the bleeding** | 1 | W1 (all), W6.1, W5.4 | **G-A**: no synthetic public numbers; tiers; ledger + changelog live; Infosys move logged |
| **B — Trustworthy page** | 2–4 | W2.1, W2.5–2.8, W3, W4, W6.2–6.3 (analyst work W2.2–2.4 runs in parallel through week 8) | **G-B**: dual citations enforced; dossier anatomy shipped; Snapshot honest; reviewer stamps |
| **C — Findable & sellable** | 5–6 | W5, W6.4, W7 | **G-C**: dossiers indexed; package = 3 plans; copy sweep done |
| **D — Enterprise** | 6–9 | W8 | **G-D**: counsel attested; TTL/MFA; API v1 + hidden ops routes; durable infra |
| **E — Index** | 8–12 | W9 (+ W2.3 reaching ≥ 20 established) | **G-E**: methodology v1.0; frozen files; licence pack; external audit published |

Critical path: W1.1/W1.3 → W3.1 → W5.1; W2.1 → W2.2 → G-B; W2.3 → W4.3 ranked mode → W9.

Engineering total ≈ 60 days; analyst labeling ≈ 25 days; external (counsel, audit) in parallel.

---

## 4. UX specification for domain experts (summary — full spec in skill `citealpha-expert-ux`)

**Homepage** (keep; small edits): coverage panel gains tier counts ("12 established · 27 provisional"); worked example gains reviewer stamp and "Changelog" link; the FY25 op-margin row shows both sources or is removed.

**Dossier** (guest): header → delivery record → evidence (two sources per row) → revision trail → how calculated → footer (methodology, changelog, cite, report error). Six panels, no workflow chrome, no analytics.

**Screener**: scored companies by default; Tier and Closed-results columns; unscored last; alerts in plain English with numbers.

**Public Snapshot**: delivery-record table until the established cohort ≥ 20; then ranked with tier and badge; CSV + dated permalink.

**Package**: three plans, buyer language, quote-not-checkout until PSP.

**Voice**: every string reads like a results release; metric display names + units; ≤ 2 ⓘ per panel; one primary action per panel; "Data as of" wherever a number appears.

Key strings to land (en.json):

```text
home.kicker            Covers Indian listed companies · Sensex scored · Nifty 50 in progress
home.lede              Screen companies by how reliably reported results kept their own guidance. Open any row for the filings behind the score.
tier.provisional       Provisional — fewer than 3 closed results
tier.established       Established — 3+ closed results across 2+ metrics
tier.deep              Deep — 5+ closed results across 2+ metrics
dossier.reviewed       Reviewed by a CiteAlpha analyst · {date}
dossier.asOf           Data as of {date} (latest filing reviewed)
dossier.record         {metOrBeat} of {closed} closed results met or beat guidance{missedClause}.
rankings.recordMode    Ranked view opens when at least 20 companies reach the Established tier. Until then, this table shows each company's delivery record.
```

---

## 5. Test plan (new / extended)

| File | Covers |
|---|---|
| `backend/tests/test_index_integrity.py` (new) | no synthetic numbers on any public route; PIT refuses null anchor; dual citation required; tiers present; ranking only established+deep; ledger append-only; changelog ≥ ledger groups; `algorithm_id` pinned |
| `backend/tests/test_score_consistency.py` | + tier and as_of consistency across list / dossier / snapshot / PIT |
| `backend/tests/test_public_copy_hygiene.py` | + banned terms from `public-copy-voice`; + API string constants (badge, alerts, trust) |
| `backend/tests/test_gci_scoring_v4.py` | + evidence-weighted composite; context-only metrics |
| `backend/tests/test_labeling_governance.py` (new) | `label_accept` audit rows; `reviewed_by` required; analyst-set flags |
| `backend/tests/test_public_api_surface.py` (new) | public OpenAPI path count and no admin/ops routes; CORS allowlist |
| `e2e/tests/dossier-public.spec.ts` (new) | six panels; header elements; two sources per row; no banned text; mobile 390 |
| `e2e/tests/screener.spec.ts` | columns; unscored last; no demo tape |
| `e2e/tests/rankings.spec.ts` | record mode vs ranked mode; badges; CSV |
| `e2e/tests/seo.spec.ts` (new) | dossier title/description/robots per quality; sitemap contains dossiers |

---

## 6. Decisions needed from the owner

| # | Decision | Default if silent |
|---|---|---|
| D1 | Counsel engagement for SEBI RA memo + privacy (Grievance Officer name) | **Decided 2026-09-29:** retail stays off; public rankings stay factual; counsel brief in `COMPLIANCE.md`. Grievance Officer name still needed for W8.3. |
| D2 | Drop price data (FMP) from the product entirely vs buy a commercial licence | Drop from public; keep Workbench-only until licence |
| D3 | Wire Razorpay now vs "quote only" | Quote only through Phase C |
| D4 | Coverage dates for Sensex-established / Nifty 50 | **Decided 2026-09-29:** Sensex 30 and Nifty 50 Established by 31 Mar 2027 (W9.7). |
| D5 | Sector shrinkage: remove vs wire | Remove (W1.5) |
| D6 | Threshold for ranked Public Snapshot (proposed 20 established) | 20 |

---

## 7. Progress log

| Date | Tasks closed | Tests | Numbers moved (ledger ids) | Open risks |
|---|---|---|---|---|
| 2026-09-28 | Plan created; rules/skills/agents updated (`index-integrity`, `public-copy-voice`, `citealpha-index-integrity`, `citealpha-expert-ux`, `citealpha-worldclass-remediation`, `index-steward`) | — | — | Infosys 48.2→88.2 still unlogged until W1.6/W1.7 |
| 2026-09-28 | **W1 complete (W1.1–W1.8).** W1.1 Δ/PIT/analytics gated on `citeable_pit` (≥4 reviewed dates); 70.0 anchor removed; `demo_multi_horizon`/`hybrid_pit` fallbacks removed from `gci_change_bundle_for`, listing cache, `pit_contract`. W1.2 `/analytics`, `/stocks/{id}/history` behind `analytics_experimental`; `/wordmap` behind `wordmap`; `sentiment` dropped from dossier payload; guest dossier shows no price/Granger/NCI/wordmap; seat sees "Experimental — synthetic inputs" banner. W1.3 tiers in `score_policy` + `CompanySummary`/`CompanyGCIDetail`/`api.ts`; Public Snapshot ranks established+deep only. W1.4 evidence-weighted composite (v4.1) + methodology copy + calc panel. W1.5 shrinkage removed; header shows tier + as-of instead of Peer #/sector avg (Screener too). W1.6 `score_ledger.py`, `jobs/snapshot_scores.py`, `GET /api/v1/index/ledger`. W1.7 `/changelog` page + `GET /api/v1/index/changelog` + footer links + kb backfill. W1.8 Screener sort unscored-last, default "Scored only", tooltip. | `tests/test_index_integrity.py` (18) · `test_gci_scoring_v4.py` +4 · full pytest 361 pass · `npm test` · `npm run build` · Playwright 139/139 incl. `dossier-public.spec.ts` | Ledger `2026-09-27.1` INFY 48.1→48.2 (backfill); `2026-09-28.1` INFY 48.2→88.2 (flag_change, retrospective); `2026-09-28.2` methodology: INFY 88.2→**76.5**, CIPLA 92.6→**85.2**, HDFCLIFE 87.3→**94.0**, APOLLOHOSP 63.7→**54.6**; 35 others unchanged, tier=provisional | Only **TRENT** is `established` → Public Snapshot (Nifty 50) lists one name; Sensex snapshot empty with explanation. Tier thresholds are a product decision (D-new): keep, or count context metrics toward `metrics_scored`. W5.1 title should now read 76.5. |
| 2026-09-29 | **D-tier decided: context metrics count toward `metrics_scored`.** `score_meta()` now counts every metric with ≥ 1 closed reviewed result (composite + context) for the tier; composite weighting and all levels unchanged. `snapshot_rows` derives `dataset_version` from the row `as_of`, not the wall clock. Copy: `tier.*`, `method.page.company.history`, `TierBadge` doc. | `test_index_integrity.py::test_context_metrics_count_toward_tier_breadth` · full pytest 372 pass · vitest 14 | Ledger `2026-09-29.1`: INFY provisional → **deep**, CIPLA provisional → **established** (`prior_gci == gci`). Changelog + kb row added. | Public Snapshot (Nifty 50) ranks TRENT, CIPLA, INFY; Sensex view ranks INFY. HINDALCO / HDFCLIFE / APOLLOHOSP still provisional (< 3 closed periods) — W2.3 labeling depth is the lever. |
| 2026-09-29 | **W8.1 / D1: retail off until counsel memo.** Public register is desk-only (`account_type` defaults to `b2b`); `retail` returns 403 unless `sebi_retail` is attested. Checkout 403 copy no longer leaks env flags. Guest paywall points at register / Pilot / Package. Terms accounts section: individual self-serve not offered. Counsel `terms_privacy` **not** self-attested. Brief + decision in `docs/customer/COMPLIANCE.md`. | `test_tenancy_legal.py::test_retail_register_forbidden_until_sebi_attest` · pytest subset | none | External: send the counsel brief; do not set `INTELLENS_RETAIL_MARKETING` in prod. W8.2 still to strip counsel keys from public `/api/trust`. |
| 2026-09-29 | **W9.7 / D4: coverage dates published.** Homepage coverage panel + `docs/customer/COVERAGE_AND_SLA.md`: Sensex 30 and Nifty 50 Established by **31 March 2027**. | e2e `coverage-commitments` | none | Dates are labeling-capacity targets (W2.3). Slip if analyst time is less than full-time. |
| 2026-09-29 | **W5.4 GCI badge.** `/api/badge/{ticker}` label is Guidance Credibility Index (GCI); embed `data-citealpha-badge`; payload carries `gci_score`, `confidence_tier`, `as_of` (no `trust_score`). SVG restyled with ticker, score, tier, as-of. | `test_badge_is_gci_with_tier_and_as_of` · `test_badge_api_strings_ban_trust_score_and_intellens` · `test_g20_badge*` | none | Next Phase A leftover: W6.1 (banned-list test that stays red until W6.2–W6.4). |
| 2026-09-29 | **W2.1 dual citation required to score.** Closed rows without `guidance_source_url` + quote + as-of are `pending_guidance_cite` (shown, not scored). `reviewed_by`/`reviewed_at` on the schema (enforced W2.5). 6/84 closed rows already dual-cited. | `test_dual_citation_required` · `test_actual_cite_without_promise_cite_excluded` · integrity + consistency + hygiene | Ledger `2026-09-29.2`: INFY 76.5 deep → **provisional**; CIPLA 85.2 → **65.5 provisional**; **37 names withdrawn** (incl. TRENT 89.9). Snapshot empty. | W2.2 must backfill promise cites or the public index stays a two-name provisional set. |
| 2026-09-29 | **W2.5 labeling governance.** Dual-cited closed rows stamped `reviewed_by=analyst:nv` / `reviewed_at=2026-09-29`; those fields are required to score. `accept_draft` writes `label_accept` (submitter + reviewer) to `audit.json` and stamps the merged outcome. Trust `labeling_governance.accepted` counts those rows. Infosys dossier shows “Reviewed by a CiteAlpha analyst · 29 Sep 2026”. | `test_labeling_governance.py` · `test_dual_cited_without_reviewer_is_excluded` · e2e `dossier-reviewed` | none (levels unchanged) | Public stamp is generic “analyst”, not a named person. W2.2 still blocks Snapshot. |
| 2026-09-29 | **W2.6 analyst-set audit flags.** Heuristic keyword hits enqueue `kind=audit_flag_suggestion` on the labeling queue and do not deduct. `audit_deduction` no longer auto-adds withdrawal on dropped rows. Persist `company_audit_flags` with `set_by` + `source_url`; POST/DELETE `/api/companies/{id}/audit-flags` (`labeling`). | `test_labeling_governance.py::test_heuristic_does_not_apply_flag_without_set_by` · `test_guidance_flags` · `test_gci_scoring_v3` dropped | none (INFY 76.5, CIPLA 65.5) | W2.2 still blocks Snapshot. |
| 2026-09-29 | **W2.7 source verification job.** Nightly (live refresh, 24h cadence) fetches every `source_url` / `guidance_source_url` and checks the recorded quote. Failures → `citeable=false` + `source_verify_fail` queue. Trust shows n of N. Four HTML press pages excluded (HCLTech FY26, Maruti FY25 volume, JSW Steel FY25, Grasim FY25 volumes). CI still live-checks IndusInd, Axis, TechM, Sun Pharma. | `test_source_verify.py` · integrity/consistency/hygiene | none (INFY 76.5, CIPLA 65.5) | Re-cite the four excluded rows to filing PDFs (W2.2). |
| 2026-09-29 | **W6 + W7.2 + W8.3/4/5/6/7 + W9.6 engineering.** Copy sweep: display names, canonical surface names, customer docs + Terms. Hygiene banned-list green. Products = What you get + SKU appendix; Help walkthrough. Privacy v2026-09-29 (GA4+Plausible, privacy@, refund, retention; GO name still counsel). TOTP MFA for owner/admin. `/developers` + `/status`. FMP/prices dropped from public (DATA_RIGHTS). Python/TS SDK + changelog RSS. | `test_public_copy_hygiene` · `test_owner_mfa_enroll_and_login` · `test_sdk_smoke` · `test_changelog_rss_and_status` | none | Skip: W2.2–2.4 analyst; W8.1/8.3 GO name + counsel attest; W8.6 Fargate/Postgres; W9.4–9.5 licence+external audit; OpenAPI still >40 paths (ops hidden). |
| 2026-09-29 | **Engineering leftovers.** W8.5 public OpenAPI allowlist ≤ 40. W9.2 CSV + Parquet + sha256, S3 when the bucket env is set. W9.6 weekly ledger digest wired to the scheduler flag. W6.3 16 locales reset to current English for legacy keys (`translation-backlog.json`). W8.8 checkout 403, quote only. W8.6 overlay + idle guard + local backup drill; live ECS apply not run. | `test_public_api_surface` · `test_index_distribution` · `test_sdk_smoke` · `test_billing_quote_only_refuses_checkout` · hygiene | none (INFY 76.5, CIPLA 65.5) | Still analyst: W2.2–2.4 and the four HTML re-cites. Still you: counsel, grievance officer name, licence pack, external audit. |
| 2026-09-29 | **Production deploy.** `AWS_PROFILE=ocotillo ./scripts/aws-deploy.sh` with `production.overlay.tfvars`. ECS 1/1 on FARGATE (base 1, no Spot). Index bucket created. citealpha.com `/health` ok, OpenAPI 32 paths, Parquet file downloads, digest preview live. SQL auth schema applied. | live curl `/health` `/openapi.json` `/api/v1/index/files` | none (scored count 2) | SMTP is still Mailtrap. Postgres not provisioned. Counsel and labeling unchanged. |
