# Accuracy Assessment — IntelLens GCI v0.3

## Verdict

| Layer | Accuracy | Notes |
|---|---|---|
| **Code / APIs / gap tests** | **High** | 47 tests; one test per gap G01–G23 |
| **Scoring math** | **High** | Ranges, asymmetric beats, labels, dropped |
| **Hand-labeled cohort (G01)** | **Medium–High for Infosys** | Official guidance-vs-actuals table used |
| **Other hand_labeled peers** | **Medium** | Public IR / trackers; some bands estimated |
| **Remaining Sensex (20)** | **Demo** | `demo_structured` until further labeling |
| **Extraction** | **Prototype** | Improved heuristics; not production NLP |

## G01 sources (examples)

- Infosys: https://www.infosys.com/investors/reports-filings/financials/guidance-vs-actuals-usd.html
- Infosys FY25 results / FY26 guidance press & call PDFs
- TCS / Titan / RIL press releases and IR pages

## Related

- [Gaps fixed one-by-one](GAPS_AND_ROADMAP.md)
- `backend/app/data/hand_labeled.py`
- `backend/tests/test_gaps.py`
