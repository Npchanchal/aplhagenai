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

| Effective | Version | Change |
|---|---|---|
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
| `dropped` | Stopped reiterating | excluded + company **−15** | excluded + company **−15** | ≈ **35** |
| `pending` | Period open | **Excluded** | **Excluded** | **Excluded** |
| `unmapped` | Qualitative / NLP fail | **Excluded** | **Excluded** | **Excluded** |

### v3 / v4 highlights

- Point guidance → synthetic ±2% band (`W = 0.02 · \|G_mid\|`).
- Miss below band: γ = 1.4; beat / in-band: γ = 1.0.
- v4 still scores **closeness to guidance**: a small beat scores near 100, a large beat decays toward 60. A beat always outscores a miss of equal distance (beat − miss = 100 − S ≥ 0). Public copy must explain the floor wherever per-row points are shown.
- Recency: `w_t = e^{-0.15(t-1)}` (t=1 most recent).
- Optional `definition_shift` audit flag → **−10**.
- `N < 4` periods → `low_confidence`; optional linear shrinkage toward `sector_mean`.
- Forensic “shenanigans engines” remain out of scope — only explicit audit flags / withdrawals.

## Bands

Prefer `guided_low`–`guided_high`. Midpoint-only guidance is weaker; vague text → lower **confidence weight** (0.5–1.0), not silent zero.

## Invariants

- Deterministic: same inputs → same score.
- Pure function in `backend/app/services/gci_scoring.py` — no I/O.
- Outcomes should carry `source_url` / `source_ref` / `quote_span` when available.
- Threads: `thread_id` groups raise/lower/reiterate history.

## Tests

Edge cases in `backend/tests/test_gci_scoring.py` (v2 golden), `test_gci_scoring_v3.py` (v3) and `test_gci_scoring_v4.py` (v4 floor, v3 parity for misses). Gap tests `test_g06`… in `test_gaps.py`.

## Do not

- Treat beats as misses: v2 floors beats ≥85; v4 floors beats ≥60; v3 lets large beats decay toward 0. All versions apply γ=1.4 only to misses.
- Score pending / unmapped into the average.
- Invent actuals to “fill” a demo.

## Multi-horizon GCI Δ (WoW / MoM / QoQ / YoY)

- Engine: `services/changes.py` → `change_bundle` (calendar-aligned day windows + FY/quarter labels).
- Company chips: `gci_change_bundle_for` (citeable PIT when deep; else `demo_multi_horizon` weekly path — **not** citeable as IR).
- India listings cache: `python -m app.jobs.build_universe_gci_depth` writes `wow_pct`/`mom_pct`/`qoq_pct`/`yoy_pct` on every NSE/BSE row.
- Citations: hand_labeled only for external cite; `citation_index.json` holds comprehensive outcome packs (guided/actual/label/evidence_summary).

## Red alerts & revision trail

- `services/guidance_flags.py` — audit flags (`guidance_withdrawal`, `restatement`, `definition_shift`) → GCI v3/v4 deductions + UI badges.
- Tracker `/api/alerts` includes audit kinds, misses, drops, revisions, drift, stale threads.
- Dossier: `audit_badges`, `red_alerts`, `revision_timeline` on `CompanyGCIDetail`.
- Not a Beneish / forensic shenanigans engine — evidence-linked guidance events only.
