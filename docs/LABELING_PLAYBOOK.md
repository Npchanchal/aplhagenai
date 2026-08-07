# Phase 1.1 — Hand-labeling playbook

Goal: every Sensex outcome used externally is **citation-ready**.

## Steps per company

1. Open IR / guidance-vs-actuals / results press release.
2. Extract **metric** (must be a catalog id from `GET /api/metrics` / `docs/GCI_PARAMETERS_AND_SOURCES.md`), **period**, **guided_low–guided_high** (or point).
3. Record **actual** when period closed; else `null` + label pending.
4. Capture `source_url`, `source_ref`, `quote_span` (≤120 chars). Prefer source types: transcript, filing_pdf, ir_html, ppt_text, press_release.
5. Set `confidence` 0.85–0.98 for official tables; 0.65–0.8 for reconstructed IR commentary.
6. Mark company `data_quality: hand_labeled` in `HAND_LABELED`.
7. Never overwrite Infosys official table rows with demos (`FREEZE_DEMO_PAD=true`).

## Metric IDs

Use catalog ids only (e.g. `revenue_growth_pct`, not free text). Aliases are normalized on import. See `backend/app/data/metric_catalog.py`.

## Dropped guidance

If management stops reiterating a prior band, set `dropped: true` and keep mid-low score (~35).

## Definition of done

- `source_url` and `quote_span` non-empty on every hand-labeled row
- Metric is a catalog id
- `/api/meta.hand_labeled_count` reflects coverage
- UI shows **Hand-labeled** vs **Demo** badge
