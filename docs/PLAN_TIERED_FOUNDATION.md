# Tiered foundation plan — IntelLens GCI

**Status:** Planning truth (supersedes “Done” claims in `PLAN_TRACKER_DEPTH.md` for quality bar).  
**Date:** 2026-08-02  
**Wedge unchanged:** Guidance Credibility Index — evidence-linked delivery scores. Not a price terminal. No Buy/Hold.  
**Screenshot walkthrough:** [`TIER_FEATURES_WITH_SCREENSHOTS.md`](./TIER_FEATURES_WITH_SCREENSHOTS.md) · in-app: `/about/tiers`

---

## Evaluation vs product (honest)

### Verdict on the three-tier framing

**Agree with the dependency chain.** Tier 1 is one pipeline, not three features:

```
automatic ingest → structure preserved → entity searchable → every GCI cell citable
```

Citability is **not** separable from the ingestion rebuild. A `quote_span` field and an edit form are HITL chrome; they only become product-grade when every citeable score point resolves to `{doc_id, source_url, char/page span, as_of, review_status}` that survived ingest without ad-hoc paste as the primary path.

What we shipped under asks #1–#11 is mostly **Tier 2/3 UI and API scaffolding on a thin Tier 1**. Useful for demos; **not** the institutional bar.

| Ask | Demo / scaffold today | Institutional Tier bar |
|---|---|---|
| #1 Entity search | Masters + provisional GCI for NSE/BSE | Search returns entities with **doc coverage + citeable outcomes**, not score-only shells |
| #4/#5 Auto ingest | Sensex IR crawl every 6h + paste auto-extract | Period-complete IR/transcript corpus per covered name; pending→HITL→commit; paste is **exception**, not the product |
| #6 Citability | `quote_span` on seed / hand_labeled; editable | Stable citation IDs; provisional never presented as citeable; no invented quotes |
| #2/#3 Deltas + charts | ChangeTriple + horizon bars | Horizons computed only where PIT series exist; missing → “—” not fake WoW |
| #7 GCI↔price | Dual overlay + Pearson | **Descriptive only**; no forecast line; sample N + window disclosed; SEBI copy in-panel |
| #10/#11 Notes / reports | API-key notes + MD templates | Notes stay private; reports only embed **citeable** outcomes |
| #8/#9 Lead/lag / impact | Corr matrix + impact bars on **score proxies** | **Gated** until Granger+LASSO on real series + min sample; else hide or mark experimental |

### Answers to the explicit questions

**1. Does ingest → structure → search → cite match build order?**  
**Yes.** That is the correct build order for IntelLens. Treat search and citability as **consumers** of the doc store, not parallel epics. Rebuild Tier 1 first; freeze polish on Tier 3 until the citation graph is real.

**2. Is #7 descriptive pattern or predictive signal?**  
**Descriptive pattern only** — product decision locked:

- Show historical co-movement / rolling correlation.
- Analyst owns any forecast (notes / report).
- UI must not imply prediction: no extrapolated trend, no “predicted GCI”, no “signal strength → buy”.
- Copy + visual design both say “observed correlation, not a forecast.”

**3. Tier 3 methodology?**  
**Ship path matches the recommendation:**

| Phase | Method | Role |
|---|---|---|
| Now (prep) | Stationarity checks, differencing, sample-size gates | Don’t show bad stats |
| Tier 3 v1 | **LASSO variable selection → Granger causality** on stationary series | Recognizable to institutional PMs/analysts |
| Tier 3 v2 | VAR/VECM when ≥N quarters of citable series per entity | Multi-factor impact map |
| Out of scope (near term) | Transfer entropy, PC/DAG causal discovery | High distrust risk |

**CCF** may appear as a simple lag chart *under* Granger results (interpretation aid), not as the causal claim.

---

## Product invariants (non-negotiable)

1. Every **citeable** GCI contribution → guidance statement + actual + dates + source.
2. `listing_provisional` / demo scores are **non-citeable**; UI quality badge must block “Cite” / report export of those rows.
3. No Buy/Hold/Sell; #7/#8/#9 stay factual research.
4. India beachhead (Sensex depth first → Nifty → broader listings as ingest catches up).
5. Never invent actuals or quote spans for citeable paths.

---

## Tier 1 — Foundation pipeline (must be real)

### T1.0 Citation model (schema first)

Introduce a first-class **Citation** object used by outcomes, extracts, and reports:

```
Citation {
  citation_id,
  company_id,
  doc_id,
  source_url,          // canonical IR / filing / transcript URL
  source_type,         // transcript | filing | ir_html | asr_text
  quote_span,          // exact excerpt
  span_start, span_end // char offsets in stored text (optional page_no)
  retrieved_at,
  review_status,       // pending | accepted | rejected
  period, metric       // when bound to an outcome
}
```

**Acceptance:** `GET` outcome → always returns `citation_id` or `citeable: false` with reason (`provisional` | `pending_review` | `missing_source`).

### T1.1 Automatic ingestion (rebuild #4/#5)

| Work | Detail |
|---|---|
| Coverage contract | Per company+period: expected doc types (concall transcript, results release, IR guidance page) |
| Sensex depth | Live crawl + extract queue already scheduled; make **period completeness** visible (missing / pending / accepted) |
| Expand carefully | Nifty-50 IR catalog next; do **not** pretend NSE_ALL is ingested |
| Structure preserve | Store raw text + normalized text; keep offsets for spans; hash content for dedupe |
| HITL gate | Auto-extract → pending only; Accept still required before GCI math |
| Paste box | Demote to “exception ingest”; primary UX = “documents already here for period” |

**Acceptance:** For Sensex hand_labeled names, dossier Docs shows period rows with status; ≥1 accepted doc per recent FY with citation link.

### T1.2 Entity search on covered + ingested (#1)

| Work | Detail |
|---|---|
| Search facets | Exchange, sector, `data_quality`, `doc_count`, `citeable_outcomes` |
| Ranking | Prefer hand_labeled / deep ingest over provisional shells |
| Empty honesty | “Listed, not yet in GCI corpus” vs “GCI available” |

**Acceptance:** Search for a Sensex name returns docs count + citeable flag; provisional listings clearly labeled.

### T1.3 Citability end-to-end (#6)

| Work | Detail |
|---|---|
| Evidence table | Quote + URL + “Open source” + copy citation_id |
| HITL edit | Edit span/URL creates review audit row; never silent overwrite |
| Report / chat | Only embed citeable outcomes; refuse or footnote provisional |
| Kill invented quotes | Provisional GCI must not fabricate `quote_span` that looks real |

**Acceptance:** Analyst can click every scored hand_labeled cell → source. E2E test US-cite-001.

### Tier 1 sequencing (build order)

```
Week A: Citation schema + citeable flag + strip fake provisional quotes
Week B: Period doc completeness API + dossier Docs UX (auto corpus first)
Week C: Search facets + ranking by coverage
Week D: HITL citation edit audit + report/chat cite-only filter
Gate:   Sensex pilot — 100% hand_labeled outcomes citeable; crawl lag SLA visible
```

**Do not** invest in Granger UI until this gate passes.

---

## Tier 2 — Workflow enrichment (after Tier 1 gate)

All of these stay; rebuild quality where scaffolding lied.

### T2.1 Multi-horizon deltas (#2) + charts (#3)

- Compute WoW/MoM/QoQ/YoY only from real PIT / period series.
- Missing horizon → null (show “—”), never 0.
- Charts: historical bars/lines only; unit-test calendar logic (FY vs calendar).

### T2.2 GCI vs stock — descriptive only (#7)

| Do | Don’t |
|---|---|
| Dual historical series + rolling corr | Extrapolate future |
| Show N, window (e.g. last 12 PIT points) | “Predicted GCI” / “alpha signal” |
| In-panel disclaimer + link to methodology | Imply causality |
| Optional: cite GCI as_of dates under chart | Overlay forecast cones |

**SEBI:** Same factual-research posture as GCI scores; visual design reinforces “observed pattern.”

### T2.3 Private notes (#10)

- Keep actor-scoped store (API key / user id).
- Never mix into org reports unless user explicitly exports.
- Optional later: org-shared notes as separate product surface.

### T2.4 Report templates (#11)

- Templates by role (PM / RA / sector) stay.
- Generator **filters** to citeable outcomes only; list excluded provisional counts.
- Output: Markdown + citation appendix (`citation_id`, URL, quote).

### Tier 2 sequencing

```
After T1 gate → harden deltas/charts → #7 disclaimer redesign → notes polish → cite-only reports
```

---

## Tier 3 — Frontier (methodology-gated)

### Current risk

Today’s corr matrix / “impact factors” use **metric score pads** and short series. Showing that confidently to institutional users is the **destroy trust** path. Treat current Analytics panel as **experimental / hide by default** until T3.1 ships.

### T3.0 Data prerequisites

- Per entity: min length (propose **≥12** aligned periods for bivariate Granger; **≥24** before VAR).
- Series: GCI PIT, metric delivery scores or guided/actual series, price returns — all with as_of.
- Stationarity: ADF (or equivalent) + differencing/detrend before tests.
- Publish methodology card in UI (lag windows, N, p-value, what Granger does **not** mean).

### T3.1 v1 engine (recommended)

```
candidates (metrics, returns, …)
    → LASSO / Elastic Net selection (shrink irrelevant)
    → Granger causality on stationary pairs (GCI as target or bidirectional display)
    → UI: lag table + p-values + N + “predictive precedence ≠ causation”
```

CCF plot optional as appendix under each tested pair.

### T3.2 Impact factor map (#9)

- v1: directed edges only where Granger passes FDR-controlled threshold; edge weight = lag / strength.
- Label: “Statistical precedence (Granger), not proven cause.”
- No DAG discovery / transfer entropy in v1.

### T3.3 Phase 2

- VAR/VECM when sample supports multivariate model.
- Sector-level panels (pooled) only with clear pooling methodology.

### Tier 3 sequencing

```
Freeze public Tier 3 claims
→ T3.0 series warehouse + sample gates
→ LASSO + Granger service (unit-tested, synthetic fixtures)
→ UI behind flag `analytics_granger_v1`
→ VAR only after coverage review
```

---

## What to demote / change in the current app (immediately)

| Surface | Action |
|---|---|
| `PLAN_TRACKER_DEPTH.md` “Done” | Relabel: scaffold vs Tier-complete (this doc is source of truth) |
| Analytics (#8/#9) | Badge “Experimental — not methodology-complete” or feature-flag off for external demos |
| Provisional `quote_span` | Stop looking like IR quotes; mark non-citeable |
| Desk paste | Secondary CTA; primary = crawl status / period docs |
| #7 overlay | Add N + window + stronger “not a forecast” in-chart |

---

## Implementation epics (engineering)

| Epic | Owner modules | Exit criteria | Status |
|---|---|---|---|
| **E1 Citation core** | `citations.py`, schemas, EvidenceTable | Citeable flag + citation_id on hand_labeled; provisional quotes stripped | **Done** |
| **E2 Auto corpus** | `period_completeness`, dossier Docs | Sensex period matrix + exception paste UX | **Done (v1)** → **gate helper** `ensure-citations` |
| **E2b Doc binding** | `citation_corpus.py`, `doc_id`+spans | Hand_labeled outcomes bound to accepted period docs | **Done** |
| **E3 Search coverage** | `search_entities` | Facets + honesty for non-ingested | **Done** |
| **E4 Delta honesty** | `changes`, Charts | Null horizons; no fake 0 bars | **Done** |
| **E5 Descriptive #7** | Charts, Analytics panel | N/window + not-a-forecast copy | **Done** |
| **E6 Notes/Reports cite-only** | `reports.py` | Reports refuse non-citeable body rows | **Done** |
| **E7 Granger v1** | `granger_analytics.py`, flag | Scaffold + sample gates; UI behind `ANALYTICS_GRANGER_V1` | **Done** — LASSO CD + Granger F-test + FDR impact map; PIT warehouse ≥16 |
| **E8 PIT warehouse** | `pit_warehouse.py` | ≥12 quarterly non-citeable series for Sensex HL | **Done** (`demo_pit_extension`) |
| **E9 Period types** | `citation_corpus.py` | transcript/results/ir_guidance per FY | **Done** |
| **E10 Search facets** | `search_entities` | exchange/sector/quality/corpus filters | **Done** |

Prefer small PRs: E1 → E2 → E3, then E4–E6, then E7.

**Shipped 2026-08-02:** see tests in `backend/tests/test_citations_tier1.py`.  
**Tier 1 follow-up (same day):** `POST /api/ingest/ensure-citations` binds Sensex hand_labeled outcomes → accepted period docs + `span_start/end`; dossier Docs shows `tier1_gate`.

**Shipped 2026-08-03:** PIT warehouse + real Granger/LASSO + expected doc types + search facets + cite-only report appendix. Bootstrap: `POST /api/ingest/tier-foundation` (API key). Flags: `ANALYTICS_GRANGER_V1=true` (default), `ANALYTICS_EXPERIMENTAL_UI=false` (proxy panel off).

---

## Success metrics

- **Tier 1:** % Sensex outcomes with resolvable citation_id ≥ 95%; ingest lag dashboard; zero provisional rows in “Cite” export.
- **Tier 2:** Desk time-to-evidence ↓; report generation used in HITL loop without compliance flags.
- **Tier 3:** Analyst trust survey / design partners accept Granger panel; zero SEBI-adjacent “prediction” copy in UI audit.

---

## Decision log

| Decision | Choice |
|---|---|
| Tier 1 shape | Pipeline, not parallel features |
| Citability vs ingest | Coupled; rebuild ingest first |
| #7 framing | Descriptive correlation only |
| Tier 3 v1 | LASSO → Granger; hold VAR; skip TE/DAG |
| Current #8/#9 | Experimental until E7 |
