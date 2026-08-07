# IntelLens — Business Plan (MVP)

## 1. Executive summary

IntelLens turns primary-source Indian equity research (filings + concalls) into a **Guidance Credibility Index (GCI)** — a 0–100 score of whether management delivered on quantified guidance. The MVP is an analyst workbench + API for buy-side / sell-side desks covering Sensex names, with a path to Nifty 500 and data licensing.

## 2. Problem

Analysts remember guidance anecdotally. Existing Indian tools score sentiment/tone, not multi-quarter accountability. Global guidance trackers (Marvin Labs, FinCatch) do not cover NSE/BSE disclosure formats or mixed-language concalls.

## 3. Solution

- Extract guidance statements (metric, range, timeframe, speaker).
- Match to subsequent actuals.
- Score delivery longitudinally → GCI 0–100 with evidence trail.
- Analyst Accept/Edit/Reject loop improves extraction over time (Phase 2).

## 4. Market

| Layer | Size (directional) |
|---|---|
| Global alt-data | ~$5–19B (2025) |
| India alt-data | ~$290M → $2–4B+ by 2030–33 |
| Beachhead | Indian institutional research + PMS/AIF + sell-side |

**GTM:** India institutional first → API to London/US EM desks → Japan localization → broker Trust Score badge later.

## 5. Business model

| Stream | Timing | Notes |
|---|---|---|
| Per-seat SaaS (Guidance Tracker) | Months 8–12 | Primary near-term ARR |
| API / data license | Months 8–12 | Highest ACV |
| Vernacular notes | Parallel | Distribution / retail funnel |
| Broker Trust Score badge | Year 2 | White-label, not standalone app |

## 6. Competition

- **Crowded:** sentiment dashboards (Trendlyne, StockEdge, etc.).
- **Near peer:** Tijori (filings metrics; funded).
- **Global category:** Marvin / FinCatch (US); AlphaSense consolidator.
- **Moat:** India-labeled guidance outcomes + analyst corrections corpus.

## 7. Go-to-market (18 months)

1. **Phase 0–1:** Sensex pilot scoring + automate extraction.
2. **Phase 2:** 15–20 pilot analysts; prove weekly habit.
3. **Phase 3:** Paid seats + 1–2 API contracts.
4. **Phase 4:** Nifty 500 + sector benchmarks.

## 8. Financial sketch (illustrative Year 1)

- Target: convert 30–40% of pilots; 1–2 institutional APIs.
- Cost focus: NLP extraction + analyst review labor, not ads.
- Capex-light: public filings/transcripts as inputs.

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Extraction accuracy | Human review loop; confidence weights |
| Cold-start credibility | Hand-score 8–10 names immediately |
| SEBI RA scope | Ship factual GCI first; no retail recommendations |
| Incumbent copy | Compound India-specific labeled history |

## 10. Ask (fundraising narrative)

India-first guidance accountability with compounding labeled data, proven category abroad, local comps (Tijori). Capital funds labeling depth + Nifty expansion + enterprise sales — not consumer CAC.

## Related docs

- [Pitch deck](PITCH_DECK.html) ([narrative](PITCH_DECK.md)) — seed fundraising slides
- [Competitive landscape](COMPETITIVE_LANDSCAPE.md)
- [Regional markets](REGIONAL_MARKETS.md)
- [Accuracy assessment](ACCURACY_ASSESSMENT.md)
- [Product definition](PRODUCT_DEFINITION.md)
- [Customer package](customer/README.md) — one-pager, pricing, onboarding, API, SLA, order form
- [Research Terminal](RESEARCH_TERMINAL.md) — Intellens Search + Intellens Desk (demo)
- [Gaps vs AlphaSense & Bloomberg](GAPS_VS_ALPHASENSE_BLOOMBERG.md) — B2B / B2C gap map
- [Implementation plan](IMPLEMENTATION_PLAN.md) — stepwise Phases 0–8
