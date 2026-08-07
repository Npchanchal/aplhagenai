---
name: intellens-close-gaps
description: >-
  Implements IntelLens GCI gap closures from docs/GAPS_AND_ROADMAP.md — scorer v2,
  Sensex-30 sources, extract/match, review loop, peers, trends, alerts, auth, import.
  Use when fixing product gaps G01–G18 or extending the guidance pipeline.
---

# Close GCI Gaps

## Before coding

1. Read `docs/GAPS_AND_ROADMAP.md` and note gap IDs.
2. Skim `docs/kb/04-pipeline.md` and `docs/kb/03-scoring.md`.
3. Prefer extending `gci_scoring.py`, `extraction.py`, `matching.py`, `repository.py`.
4. Add/adjust tests named after gap or user story IDs.

## Checklist

- [ ] Scorer: ranges, labels, asymmetric beats, dropped
- [ ] Evidence: source_url / quote_span
- [ ] API: trend, peers, PIT history, alerts
- [ ] Auth on write paths (`X-API-Key`)
- [ ] Review Accept/Edit/Reject persists corrections
- [ ] `data_quality` flag remains honest
- [ ] `pytest` + relevant E2E green

## Do not

- Ship Buy/Hold recommendations
- Claim hand-audited accuracy without Phase 0 labeling
- Remove gap IDs from `/api/meta` without updating the roadmap doc
