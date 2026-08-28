# Accuracy Assessment — CiteAlpha GCI v0.3

## Verdict

| Layer | Accuracy | Notes |
|---|---|---|
| **Code / APIs / gap tests** | **High** | 47 tests; one test per gap G01–G23 |
| **Scoring math** | **High** | Ranges, asymmetric beats, labels, dropped |
| **Hand-labeled cohort (G01)** | **Medium–High for Infosys** | Official guidance-vs-actuals table used |
| **Sensex-30 hand_labeled** | **Medium** | Core 10 stronger; extended Sensex reconstructed IR-style (P1 deepen) |
| **Nifty-extra (10)** | **HL in progress** | **Cipla + HDFC Life + Apollo promoted**; 7 remain `demo_structured` — wave P0 |
| **NSE/BSE universe** | **Provisional** | `listing_provisional` — not externally citeable |
| **Extraction** | **Prototype** | LLM/heuristic extract; always `needs_review` |

## G01 sources (examples)

- Infosys: https://www.infosys.com/investors/reports-filings/financials/guidance-vs-actuals-usd.html
- Infosys FY25 results / FY26 guidance press & call PDFs
- TCS / Titan / RIL press releases and IR pages

## Related

- [Labeling runbook](LABELING_RUNBOOK.md) · [P0 batch CSV](labeling/batch_p0_nifty_extra.csv)
- P0 labels: `backend/app/data/hand_labeled_nifty.py` (Cipla live; Britannia draft)
- [Gaps fixed one-by-one](GAPS_AND_ROADMAP.md)
- `backend/app/data/hand_labeled.py`
- `backend/tests/test_gaps.py`
