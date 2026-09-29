# Product Gaps — Fixed One by One (v0.3.0)

Each gap has a dedicated pytest in `backend/tests/test_gaps.py` (`test_g01_…` … `test_g23_…`).

| ID | Status | How fixed |
|---|---|---|
| **G01** | Closed (cohort) | 10 companies `hand_labeled` from public IR; Infosys uses official [guidance vs actuals](https://www.infosys.com/investors/reports-filings/financials/guidance-vs-actuals-usd.html). Remaining 20 Sensex = `demo_structured`. |
| G02 | Closed | `POST /api/extract` + real Infosys sample transcript wording |
| G03 | Closed | `POST /api/match` |
| G04 | Closed | Sensex-30 universe |
| G05 | Closed | `source_url` / `source_ref` / `quote_span` |
| G06 | Closed | Asymmetric beat vs miss scoring |
| G07 | Closed | `guided_low` / `guided_high` |
| G08 | Closed | Labels: exceeded/met/missed/dropped/pending |
| G09 | Closed | `thread_id` + threads map |
| G10 | Closed | `trend[]` |
| G11 | Closed | Peer rank + sector avg |
| G12 | Closed | Dropped label + score 35 |
| G13 | Closed | `GET /api/companies/{id}/wordmap` entity vs industry |
| G14 | Closed | Accept/Edit/Reject + reviews corpus |
| G15 | Closed | Facts JSON import |
| G16 | Closed | `X-API-Key` + `GET /api/orgs/{id}` seats |
| G17 | Closed | PIT history endpoint |
| G18 | Closed | Alerts API + UI |
| G19 | Closed | Vernacular hi/ta/gu/mr/en templates |
| G20 | Closed | Badge JSON + SVG |
| G21 | Closed | SEBI note endpoint |
| G22 | Closed | EM factor export shape |
| G23 | Closed | Japanese vernacular template |

## Remaining work (not gaps — depth)

- Expand hand_labeled from 10 → full Sensex-30 with transcript-level quotes.
- Replace heuristic extract with LLM extract + human review at scale.
- Production auth (SSO) beyond shared API keys.

**Full stepwise plan (Phases 0–8):** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

**Status:** Phases 0–8 implemented in code (v0.4.0). Depth work continues (real LLM, live IR crawl, SSO OIDC wiring).

Coverage and score policy: use `GET /api/meta` (single live table). Do not copy counts from this file.
