# Accuracy Assessment — CiteAlpha GCI v0.3

## Verdict

| Layer | Accuracy | Notes |
|---|---|---|
| **Code / APIs / gap tests** | **High** | 47 tests; one test per gap G01–G23 |
| **Scoring math** | **High** | Ranges, asymmetric beats, labels, dropped |
| **Hand-labeled cohort (G01)** | **Medium–High for Infosys** | Official guidance-vs-actuals table used |
| **Sensex-30 hand_labeled** | **Medium (shallow)** | All 30 flagged HL; most have 1–2 outcomes — **P2 depth wave** (target ≥8 closed) |
| **Nifty-50 tab (50)** | **Medium (shallow + P1 started)** | 40 HL + 10 demo; P1 promoted Trent/ONGC/Hindalco; 10 P1 names queued |
| **IN1000 / NSE / BSE** | **Not yet scored** | Exchange listings without dual-cited, reviewed guidance — **P3+** milestone-gated |
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
