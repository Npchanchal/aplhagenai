# GCI Methodology v1.0

**Product:** CiteAlpha Guidance Credibility Index (GCI)  
**Legal entity:** Ocotillo Innovation Private Limited  
**Public page:** https://citealpha.com/methodology  
**Status:** v1.0 engineering draft — external quant + compliance sign-off is outstanding (plan W9.1).

This document is the versioned methodology for the published index. The live product page (`/methodology`) is the reader-facing summary; scoring constants live in `backend/app/services/gci_scoring.py` and are pinned as `algorithm_id` on every published number.

## 1. Definitions

- **Guidance:** a quantified management statement (number or range) for a named metric and a named period, given in a filing, results release, or earnings transcript.
- **Actual:** the later reported figure for the same metric and period, from a primary source.
- **Closed result:** a dual-cited pair (promise + actual), reviewer-stamped, with both source URLs and quotes.
- **GCI:** a 0–100 evidence-weighted composite of closed results. Not sentiment. Not a Buy/Hold/Sell.

## 2. Eligibility

A company is scored only when `data_quality = hand_labeled` and at least one closed result meets dual-citation and reviewer rules (`score_policy.py`). Rows missing a guidance citation are `pending_guidance_cite` and are shown as context, not scored.

## 3. Confidence tiers

| Tier | Closed periods | Metrics with ≥1 closed result |
|---|---|---|
| Provisional | fewer than 3 | — |
| Established | ≥ 3 | ≥ 2 |
| Deep | ≥ 5 | ≥ 2 |

Public Snapshot ranks only Established and Deep, and only once at least 20 companies qualify.

## 4. Formula (summary)

GCI measures promise-keeping discipline, not forecast accuracy. A wide beat is scored on how reliable the promise was. Each closed result scores 0–100 against the opening guided range: in-range is 100; beats decay toward a floor of 60; misses decay 1.4× as fast and can reach 0. A miss one half-width outside the range scores about 59; a beat the same distance scores about 88. A point guide is a ±2% range. Withdrawal and restatement deduct 15 points each; conflicting guidance on the same period deducts 10. Recency weights are 1.0, 0.86, 0.74. These constants are design choices. A revenue-growth miss and a margin miss share the 0–100 scale when each is the same distance outside its own guided range. A wide range reaches 100 more easily than a tight one. Scores are not adjusted by sector; a sector average is the average of company scores. Metric weight = count of closed periods, capped at 5. Metrics with fewer than 2 closed periods are context-only. Company GCI is the evidence-weighted mean of composite metrics, after analyst-set audit deductions. Worked numbers: `/methodology` and the dossier “How this score is calculated” panel.

## 5. Revisions

In-year raises and cuts are stored on the row. The headline score uses the **opening** band; the revision trail shows every later band with its own filing.

## 6. Data sources

NSE/BSE filings, company IR releases, and earnings transcripts. Each scored row cites the promise source and the actual source.

## 7. Review process

A closed row counts when a fetch of the guidance filing and the results filing both contain the recorded quotes. The company page shows the date of that check (`reviewed_by` is the verifier job, `reviewed_at` is the check date). A quote that is not on the filing keeps the row out of the score. Nothing is queued for a person.

## 8. Latency

Target: published score within **5 India business days** of a results filing on or after 29 September 2026. Observed median is published on Methodology and Trust from instrumented dates.

## 9. Corrections and versioning

See `docs/index/CORRECTIONS_POLICY.md`. Every published-level change appends to the score ledger and appears on `/changelog` the same day.

## 10. Governance

Change control: methodology edits require an `algorithm_id` bump, ledger rows, and a public changelog entry. A governance committee and consultation process are to be named when the index is licensed. This draft references IOSCO Principles for Financial Benchmarks and SEBI (Index Providers) Regulations 2024 as the intended posture; they are not a registration claim.

## 11. External readers

Publication does not wait on an outside reader. This remains an engineering draft until the index is licensed; it is not a licensed benchmark statement.
