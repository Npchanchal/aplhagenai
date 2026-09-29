# 03 — GCI Scoring

## Definition

Company GCI = scored closed outcomes aggregated to **0–100**. Higher = better historical delivery vs stated guidance.

## Scorer versions

| Flag | Algorithm |
|---|---|
| `INTELLENS_GCI_VERSION=v4` (**default**) | v3 engine with beats floored: beat = `60 + 40·exp(−α δ^β)`. In-band and misses identical to v3 |
| `INTELLENS_GCI_VERSION=v3` | Spec engine: band δ → exp(−α δ^β), γ miss asymmetry, exp recency λ, φ metric weights, audit deductions. Beats decay toward 0 |
| `INTELLENS_GCI_VERSION=v2` | Legacy confidence-weighted heuristic (beats floored ≥85; dropped → 35) |

`GET /api/meta` → `gci_algorithm` / `feature_flags.INTELLENS_GCI_VERSION`. Rebuild listing cache after switching versions (`python -m app.jobs.score_india_universe`).

### Methodology changelog

Public mirror: `/changelog` ← `GET /api/v1/index/changelog` (source `backend/app/data/score_changelog.json`). Every moved number also has a row in `backend/app/data/score_ledger.jsonl` (`GET /api/v1/index/ledger?company_id=`; job `python -m app.jobs.snapshot_scores --write --reason … --by …`).

| 2026-09-29 | display (W2.8) | **Filing-to-score SLA.** Target: reviewed score published within 5 India business days of the results filing (`as_of`), for filings dated on or after 29 Sep 2026. Refresh records `filing_seen`; `accept_draft` records review → publish. Methodology and Trust show the observed median from scored rows (today: historical batch, n=6, all reviewed 29 Sep 2026; live sample empty). Availability 99.x% struck from `COVERAGE_AND_SLA.md`. Published GCI levels unchanged. |
| 2026-09-29 | data (W2.7) | **Source-link verification job.** Every hand-labeled `source_url` / `guidance_source_url` is checked for quote presence (`python -m app.jobs.verify_sources`; live refresh at most once per 24h). Failures are not citeable and go to the labeling queue. Trust Center shows n of N verified. Four HTML press pages that do not contain a verifiable quote are excluded (HCLTech FY26 guidance, Maruti FY25 wholesale volume, JSW Steel FY25, Grasim FY25 UltraTech volumes). Published GCI levels unchanged (Infosys 76.5, Cipla 65.5). |
| 2026-09-29 | methodology (W2.6) | **Audit flags are analyst-set.** Withdrawal (−15), restatement (−15) and definition-shift (−10) apply only when a reviewer persists the flag with `set_by` and a source URL. Keyword heuristics still run, but they enqueue a labeling-queue suggestion and do not move GCI. Dropped rows stay excluded from the average; they no longer auto-apply the withdrawal deduction. Published levels unchanged (Infosys 76.5, Cipla 65.5). |
| 2026-09-29 | methodology (W2.1) | **Dual citation required to score.** A closed row enters the composite only when both the original guidance and the subsequent actual have `source` + quote + as-of. Rows with an actual citation but no promise citation are labelled `pending_guidance_cite` (shown on the dossier, not scored). 6 of 84 closed rows already had both cites. **Withdrawn (37):** every previously published name except Infosys and Cipla, including TRENT 89.9. **Moved:** INFY 76.5 deep → **76.5 provisional** (FY25 op-margin excluded; one dual-cited metric remains); CIPLA 85.2 established → **65.5 provisional** (only FY24 EBITDA-margin remains dual-cited). Public Snapshot ranks no company until W2.2/W2.3 restore Established names. Ledger `2026-09-29.2`. `reviewed_by`/`reviewed_at` added to the outcome schema (enforced in W2.5). |
| 2026-09-29 | tier rule (D-tier) | **Context metrics count toward tier breadth.** `metrics_scored` = metrics with ≥ 1 closed, analyst-reviewed result (composite **and** context-only). Composite weighting and every level unchanged. Tier moves: INFY provisional → **deep** (5 periods, revenue + op-margin), CIPLA provisional → **established** (3 periods, revenue + R&D-spend). HINDALCO / HDFCLIFE / APOLLOHOSP gain breadth but stay provisional (< 3 periods). Public Snapshot (Nifty 50) now ranks TRENT, CIPLA, INFY; Sensex view ranks INFY. Ledger `2026-09-29.1` (tier rows, `prior_gci == gci`). |
| 2026-09-28 | v4.1 methodology | **Evidence-weighted composite.** Metric weight = closed periods (cap 5); a metric with < 2 closed periods is *context-only* (`context_metrics`, shown, not in the composite) whenever a deeper metric exists; if every metric is single-period the composite is a flat mean (tier `provisional`). Moved: INFY 88.2 → **76.5** (FY25 op-margin single row → context), CIPLA 92.6 → **85.2**, HDFCLIFE 87.3 → **94.0**, APOLLOHOSP 63.7 → **54.6**. TRENT / HINDALCO unchanged. Sector shrinkage removed (D5). Confidence tiers introduced (`score_policy.confidence_tier`): provisional / established / deep; Public Snapshot ranks established + deep only (today: TRENT). `algorithm_id` stays `gci_scoring_v4`; `ALGORITHM_REVISION` = "v4.1 evidence-weighted composite". Ledger `2026-09-28.2`. |
| 2026-09-28 | display fix | Δ chips / horizon bars / PIT feed publish only `series_kind == "citeable_pit"` (≥ 4 reviewed as-of points); otherwise horizons are `null` with `note`. `demo_pit_extension`, `demo_multi_horizon`, `hybrid_pit*` removed from every public route and from the listing cache; `pit_warehouse` returns an empty series when there is no published score. `/analytics`, `/wordmap`, `/stocks/{id}/history` require `analytics_experimental` / `wordmap` (pilot, desk, enterprise, onestop). `sentiment` dropped from `CompanyGCIDetail`. |
| 2026-09-28 | flag_change (INFY) | **Logged retrospectively.** INFY 48.2 → **88.2**: in-year band revisions moved from separate rows onto the FY row's `revisions`; placeholder FY24 "dropped restatement sample" row removed; `definition_shift` now keyed by `(thread_id, period)`. Withdrawal −15 / restatement −15 / definition-shift −10 no longer fire. Ledger `2026-09-28.1`. |
| 2026-09-27 | display fix | GCI Screener list, Public Snapshot, entity search, listing cache and PIT history now apply audit deductions (`audited_company_gci`), so every surface shows the dossier number. Previously lists showed the pre-deduction score for the 22 audit-flagged names (e.g. INFY 73.2 list vs 48.2 dossier; COALINDIA 4.7 vs 0.0; HDFCLIFE, ONGC, HINDALCO, TRENT −10). Guarded by `tests/test_score_consistency.py`. Public Snapshot "citeable rows" column was always 0 (counted raw outcomes) — now counts enriched citeable outcomes. |
| 2026-09-27 | data (INFY) | Infosys revenue rows re-cited to SEC-filed results releases (Form 6-K Ex. 99.1): `guidance_*` = the April release that set the band, `source_url`/`quote_span`/`as_of` = the April release that reported the actual. Corrections: FY22 band 10–12% → **12–14%** (Apr 2021 release; IR summary table disagreed), FY26 `as_of` 2026-04-17 → **2026-04-23**. FY22 60.4 → 61.8 pts; INFY dossier 48.1 → 48.2. No label changed. |
| 2026-09-27 | v4 | Beats floored at `GCI_BEAT_FLOOR = 60`. A beat far above the band still means the guidance was off, so it decays with distance, but no longer toward 0. Misses, in-band, dropped, recency, audit deductions unchanged. Cohort impact at switch: 15 of 49 scored names rose (e.g. INFY dossier 40.7 → 48.1 after audit deductions, AXISBANK 59.6 → 83.8); none fell. INFY FY22 row (band 10–12%, actual 19.7%) 1.1 → 60.4 pts. |
| before 2026-09-27 | v3 | Default exp-δ engine; beats decayed toward 0 (INFY FY22 ≈ 1 pt). |

### Labels

| Label | Meaning | v4 score | v3 score | v2 score |
|---|---|---|---|---|
| `met` | Actual in band | 100 | 100 | 100 |
| `exceeded` | Beat above band | 60 + 40·exp(−α δ^β) | exp(−α δ^β), γ=1.0 | ≥85 |
| `missed` | Below band | exp + γ=1.4 | exp + γ=1.4 | linear shortfall → 0 at ≥50% |
| `dropped` | Stopped reiterating | excluded; **−15** only if an analyst sets `guidance_withdrawal` | excluded; **−15** if analyst-set | ≈ **35** |
| `pending` | Period open | **Excluded** | **Excluded** | **Excluded** |
| `pending_guidance_cite` | Closed actual cited, original guidance not yet cited | **Excluded** | **Excluded** | **Excluded** |
| `unmapped` | Qualitative / NLP fail | **Excluded** | **Excluded** | **Excluded** |

### v3 / v4 highlights

- Point guidance → synthetic ±2% band (`W = 0.02 · \|G_mid\|`).
- Miss below band: γ = 1.4; beat / in-band: γ = 1.0.
- v4 scores **promise-keeping**: a small beat scores near 100, a large beat decays toward 60 and never below it. A beat always outscores a miss of equal distance (beat − miss = 100 − S ≥ 0). Public copy names this as a design choice (promise-keeping discipline, separate from forecast accuracy) and states the δ = 1 points: a miss scores about 59, a beat about 88. Cross-metric comparability is half-width of each range; there is no sector adjustment. A wide range reaches 100 more easily than a tight one.
- Recency: `w_t = e^{-0.15(t-1)}` (t=1 most recent).
- Optional `definition_shift` audit flag → **−10**, only when an analyst sets it (`set_by` + source). Keyword heuristics enqueue a review suggestion (W2.6).
- `N < 4` periods → `low_confidence` (informational). Sector shrinkage removed 2026-09-28 (D5); `sector_mean` is accepted and ignored.
- **Composite (v4.1):** weight per metric = `min(closed periods, 5)`; metrics with < 2 closed periods are `context_metrics` (not in the composite) when a deeper metric exists. `score_meta()` in `guidance_flags.py` returns `confidence_tier`, `closed_periods`, `metrics_scored`, `as_of`, `algorithm_id`, `composite_weights`.
- Forensic “shenanigans engines” remain out of scope — only analyst-set audit flags.

## Bands

Prefer `guided_low`–`guided_high`. Midpoint-only guidance is weaker; vague text → lower **confidence weight** (0.5–1.0), not silent zero.

## Invariants

- **Index integrity:** any change that moves a published number → score ledger row + changelog row the same day (rule `index-integrity`, skill `citealpha-index-integrity`). Public surfaces never show synthetic history or Δ (`demo_pit_extension`, `demo_multi_horizon`, `hybrid_pit`). Remediation plan: `docs/PLAN_WORLDCLASS_GCI.md` (W1).
- A row scores only with both citations (promise `guidance_*` + actual `source_*`) **and** `reviewed_by` / `reviewed_at`. Rows missing the promise citation are `pending_guidance_cite` and are excluded. Companies carry a `confidence_tier` (`provisional` / `established` / `deep`).
- Deterministic: same inputs → same score.
- Pure function in `backend/app/services/gci_scoring.py` — no I/O.
- Outcomes should carry `source_url` / `source_ref` / `quote_span` when available.
- Threads: `thread_id` groups raise/lower/reiterate history.

## Tests

Edge cases in `backend/tests/test_gci_scoring.py` (v2 golden), `test_gci_scoring_v3.py` (v3) and `test_gci_scoring_v4.py` (v4 floor, v3 parity for misses). Gap tests `test_g06`… in `test_gaps.py`. Source-link verification: `test_source_verify.py`. Filing-to-score: `test_score_sla.py`.

## Do not

- Treat beats as misses: v2 floors beats ≥85; v4 floors beats ≥60; v3 lets large beats decay toward 0. All versions apply γ=1.4 only to misses.
- Score pending / unmapped into the average.
- Invent actuals to “fill” a demo.

## Multi-horizon GCI Δ (WoW / MoM / QoQ / YoY)

- Engine: `services/changes.py` → `change_bundle` (calendar-aligned day windows + FY/quarter labels).
- Company chips: `gci_change_bundle_for` — **citeable PIT only** (`MIN_CITEABLE_PIT_FOR_DELTAS = 4`); otherwise all horizons `null` + `note`. Synthetic paths (`demo_multi_horizon`, `demo_pit_extension`, `hybrid_pit*`) are Workbench analytics scaffolding only and never appear on public routes (`tests/test_index_integrity.py`).
- India listings cache: `python -m app.jobs.score_india_universe` writes horizons only for `citeable_pit` rows plus `confidence_tier` / `closed_periods` / `metrics_scored` / `as_of` / `algorithm_id`.
- Citations: hand_labeled only for external cite; `citation_index.json` holds comprehensive outcome packs (guided/actual/label/evidence_summary).

## Red alerts & revision trail

- `services/guidance_flags.py` — analyst-set audit flags (`guidance_withdrawal`, `restatement`, `definition_shift`) with `set_by` + source → GCI v3/v4 deductions + UI badges. Keyword hits enqueue `/api/labeling/queue` (`kind=audit_flag_suggestion`) and do not deduct.
- GCI Screener `/api/alerts` includes applied audit kinds, misses, drops, revisions, drift, stale threads.
- Dossier: `audit_badges`, `red_alerts`, `revision_timeline` on `CompanyGCIDetail`.
- Not a Beneish / forensic shenanigans engine — evidence-linked guidance events only.
