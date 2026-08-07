---
name: intellens-phase0-labeling
description: >-
  Guides Phase 0 hand-labeling of real Sensex guidance vs actuals to replace
  demo_structured seed data. Use when labeling concalls, upgrading data_quality
  to hand_labeled, or preparing analyst-credible GCI samples.
---

# Phase 0 Hand-Labeling

## Goal

Replace `demo_structured` rows with `hand_labeled` outcomes that cite real concall/filing passages.

## Steps

1. Pick 8–10 Sensex tickers with ≥3 years of transcripts.
2. For each guidance: metric, low/high band, period, speaker, exact quote, source URL.
3. When actuals publish: fill `actual_value` or mark `dropped` if management stopped reiterating.
4. Set `data_quality: hand_labeled` on the company.
5. Run scorer; sanity-check vs known chronic miss/beat names.
6. Update `docs/ACCURACY_ASSESSMENT.md`.

## Schema reminder

Use the same outcome fields as `backend/app/data/seed.py` (`guided_low`/`guided_high`, `thread_id`, sources).

## Exit

≥8 companies, ≥8 closed outcomes each, all source-linked; at least one external analyst review.
