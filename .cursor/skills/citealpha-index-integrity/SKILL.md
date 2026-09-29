---
name: citealpha-index-integrity
description: >-
  Governs any change that creates, moves, or removes a published GCI number —
  scorer constants, hand-labeled rows, audit flags, confidence tiers, PIT history,
  score ledger and public changelog. Use when editing gci_scoring.py, score_policy.py,
  pit_warehouse.py, hand_labeled*.py, guidance_flags.py, rankings, or when a reviewer
  reports a score that changed without explanation.
---

# GCI index integrity

A published GCI is an index level. This skill is the change-control protocol for it.

## Before coding

1. Read rule `index-integrity` and `docs/kb/03-scoring.md` (changelog table).
2. Capture the **before** state: `cd backend && PYTHONPATH=. .venv/bin/python -m app.jobs.snapshot_scores > /tmp/before.json`. After the change: `… snapshot_scores --write --reason <reason> --note "…" --by analyst:<id>` appends one ledger row per moved level (rebuild the listing cache first: `python -m app.jobs.score_india_universe`).
3. Decide the change reason: `methodology` · `data_correction` · `new_filing` · `flag_change` · `display_fix`.

## Workflow

```
- [ ] 1. Make the change (scorer / data / flag) — pure, unit-tested
- [ ] 2. Rebuild: delete backend/app/data/store.json; rebuild listing cache if needed
- [ ] 3. Diff scores: before vs after per company (id, old, new, tier_old, tier_new)
- [ ] 4. Ledger: append one row per moved company to the score ledger
- [ ] 5. Changelog: docs/kb/03-scoring.md + public /changelog entry (same wording)
- [ ] 6. Tests: pytest tests/test_score_consistency.py tests/test_index_integrity.py tests/test_public_copy_hygiene.py
- [ ] 7. If the homepage worked example or Round-2 report quotes the number, update it
- [ ] 8. Deploy; re-check /api/public/gci-rankings and the dossier agree
```

## Invariants to test (tests/test_index_integrity.py)

- No numeric `gci_score`, `wow_pct`/`mom_pct`/`qoq_pct`/`yoy_pct`, or PIT point exists on any `/api/*` response unless `series_kind == "citeable_pit"` and `data_quality == "hand_labeled"`.
- `pit_warehouse.build_company_pit_series` raises / returns empty when the anchor is `None` — no `70.0` default.
- Every scored row has both citations (promise + actual); rows lacking `guidance_source_url` are excluded and labelled `pending_guidance_cite`.
- `confidence_tier` is present on every scored company; rankings contain only `established`/`deep`.
- Ledger is append-only: the same `(company_id, as_of, algorithm_id, dataset_version)` never has two values; a second change on the same day gets the next `dataset_version` (`YYYY-MM-DD.N`).
- Changelog row count ≥ number of distinct ledger `reason`+`as_of` groups since the last release.

## Ledger schema (`backend/app/data/score_ledger.jsonl`)

```json
{"company_id":"infy","as_of":"2026-09-28","algorithm_id":"gci_scoring_v4","dataset_version":"2026-09-28.1",
 "gci":88.2,"prior_gci":48.2,"confidence_tier":"established","reason":"flag_change",
 "note":"Withdrawal flag removed after re-review; op-margin FY25 row added","by":"analyst:nv"}
```

## Changelog row template

`| YYYY-MM-DD | <reason> | <what changed, which companies, before → after, why> |`

## Do not

- Change `INTELLENS_GCI_VERSION` or a constant in `gci_scoring.py` without a ledger + changelog row for every moved company.
- Fix a number "quietly" because it looks wrong — log the correction; that log is the product.
- Publish a rank for a `provisional` company, or any Δ for a non-citeable series.
