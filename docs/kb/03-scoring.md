# 03 — GCI Scoring

## Definition

Company GCI = scored closed outcomes aggregated to **0–100**. Higher = better historical delivery vs stated guidance.

## Scorer versions

| Flag | Algorithm |
|---|---|
| `INTELLENS_GCI_VERSION=v3` (**default**) | Spec engine: band δ → exp(−α δ^β), γ miss asymmetry, exp recency λ, φ metric weights, audit deductions |
| `INTELLENS_GCI_VERSION=v2` | Legacy confidence-weighted heuristic (beats floored ≥85; dropped → 35) |

`GET /api/meta` → `gci_algorithm` / `feature_flags.INTELLENS_GCI_VERSION`. Rebuild listing cache after switching versions.

### Labels

| Label | Meaning | v3 score | v2 score |
|---|---|---|---|
| `met` | Actual in band | 100 | 100 |
| `exceeded` | Beat above band | exp(−α δ^β), γ=1.0 | ≥85 |
| `missed` | Below band | exp + γ=1.4 | linear shortfall → 0 at ≥50% |
| `dropped` | Stopped reiterating | excluded + company **−15** | ≈ **35** |
| `pending` | Period open | **Excluded** | **Excluded** |
| `unmapped` | Qualitative / NLP fail | **Excluded** | **Excluded** |

### v3 highlights

- Point guidance → synthetic ±2% band (`W = 0.02 · \|G_mid\|`).
- Miss below band: γ = 1.4; beat / in-band: γ = 1.0.
- v3 scores **forecast accuracy**, so a beat far above the band decays like distance does (e.g. INFY FY22: band 10–12%, actual 19.7% → δ≈7.7 → ~1 pt). A miss the same distance below scores lower still (γ). Public copy must explain this wherever per-row points are shown.
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

Edge cases in `backend/tests/test_gci_scoring.py` (v2 golden) and `test_gci_scoring_v3.py` (v3). Gap tests `test_g06`… in `test_gaps.py`.

## Do not

- Treat beats as misses: v2 floors beats ≥85; v3 scores beats via exp δ without γ=1.4, so a beat always outscores a miss of equal distance — but large beats can still score low.
- Score pending / unmapped into the average.
- Invent actuals to “fill” a demo.

## Multi-horizon GCI Δ (WoW / MoM / QoQ / YoY)

- Engine: `services/changes.py` → `change_bundle` (calendar-aligned day windows + FY/quarter labels).
- Company chips: `gci_change_bundle_for` (citeable PIT when deep; else `demo_multi_horizon` weekly path — **not** citeable as IR).
- India listings cache: `python -m app.jobs.build_universe_gci_depth` writes `wow_pct`/`mom_pct`/`qoq_pct`/`yoy_pct` on every NSE/BSE row.
- Citations: hand_labeled only for external cite; `citation_index.json` holds comprehensive outcome packs (guided/actual/label/evidence_summary).

## Red alerts & revision trail

- `services/guidance_flags.py` — audit flags (`guidance_withdrawal`, `restatement`, `definition_shift`) → GCI v3 deductions + UI badges.
- Tracker `/api/alerts` includes audit kinds, misses, drops, revisions, drift, stale threads.
- Dossier: `audit_badges`, `red_alerts`, `revision_timeline` on `CompanyGCIDetail`.
- Not a Beneish / forensic shenanigans engine — evidence-linked guidance events only.
