# Prompt — Implement GCI parameter catalog + source scope

**Status:** Not implemented yet (no `metric_catalog`, no formal source matrix in code).  
Copy everything below the line into Cursor Agent to implement.

---

## Role

You are implementing product depth for **CiteAlpha GCI** in `/Users/navin/AlphaGenAI`. Do **not** turn GCI into a full stock-analysis suite. Implement a **formal guided-metric catalog** and **source-scope rules** so every GCI parameter is quantified guidance vs actuals — with MoM/QoQ/YoY on series — and ingest stays text-first.

## Product decisions (locked)

### What GCI scores
Only outcomes where management gave a **quantified** guidance (point or band) for a **period** and we can attach an **actual** (or pending/dropped).

### Parameter count
- Ship a **core catalog of ~12–15** first-class metrics (stable IDs).
- Allow **sector extensions** (bank NIM, volume KPIs, etc.) registered in the same catalog.
- Reject / flag free-text metrics that are not in the catalog unless `allow_custom=true` on admin import.
- Company GCI remains the weighted average of scored outcomes (pending excluded).

### Sources — in vs out

| Source | GCI role | Implement? |
|--------|----------|--------------|
| Transcripts (text) | Primary guidance extract | Yes — first-class ingest + search |
| PDF / PPT text / IR HTML / filings | Primary guidance + actuals | Yes — text extract adapters |
| Audio / video concalls | **ASR → transcript only**; never score from tone/voice | Stub endpoint + doc; no full ASR provider required in MVP |
| Fundamentals / reported financials | **Actuals feed only** (match to guidance) | Yes — actuals join; not a separate “fundamentals score” inside GCI |
| Street consensus | Research / estimates context | Already partial — keep out of GCI math |
| Wordmap / sentiment | Context only | Already stub — keep **out** of GCI math |
| Technicians / charts / RSI / price patterns | Out of scope | Explicit refuse in docs + meta |
| Financial shenanigans / forensic QI | Out of GCI; optional Research later | Do **not** build now |
| Buy / Hold / Sell | Forbidden | Keep compliance note |

## Core metric catalog (use these IDs)

Implement as data + validation (exact labels OK to tweak display names):

**Universal**
1. `revenue_growth_pct`
2. `revenue_growth_cc_pct` (constant currency)
3. `operating_margin_pct`
4. `ebitda_margin_pct`
5. `ebitda_growth_pct`
6. `pat_margin_pct` / `net_margin_pct`
7. `capex` or `capex_guidance` (units documented)
8. `fcf` / `fcf_guidance` (optional Tier-2)

**Sector extensions (register with `sectors: [...]`)**
9. `nim_pct` — banks/NBFCs  
10. `loan_growth_pct` — banks  
11. `underlying_volume_growth_pct` — staples/discretionary  
12. `same_store_sales_pct` — retail (optional)  
13. `arpu_growth_pct` — telecom (optional)  
14. `jewelry_ebitda_margin_pct` — specialty (keep if already in seed)

Each catalog entry must define:
- `id`, `display_name`, `unit` (`pct` | `inr_cr` | `bps` | …)
- `family` (`growth` | `margin` | `volume` | `capital` | `sector`)
- `sectors` (empty = all)
- `aliases` for extract/normalization
- `tier` (`core` | `sector` | `experimental`)
- whether bands are preferred

## Implementation tasks (do in order)

### 1. Catalog module
- Add `backend/app/data/metric_catalog.py` (or JSON + loader) exporting `CORE_METRICS`, `get_metric(id)`, `normalize_metric(raw) -> id | None`, `list_metrics(sector=None)`.
- Add `GET /api/metrics` and `GET /api/metrics/{id}` returning catalog + counts of outcomes using each metric in current store.
- Add `GET /api/meta` field: `gci_metric_count`, `gci_source_policy` summary.

### 2. Validation on write paths
- On extract / AlphaHunter import / merge / hand-label ingest: normalize metric via catalog.
- Unknown metrics → `400` with suggestion list **or** store under `experimental` only if flag set.
- Unit tests for normalize + reject.

### 3. Source policy module + docs
- Add `backend/app/data/source_policy.py` describing allowed `source_type`:  
  `transcript` | `filing_pdf` | `ir_html` | `ppt_text` | `press_release` | `asr_transcript` | `reported_actuals`
- Disallowed for GCI score: `audio_raw`, `video_raw`, `technical`, `shenanigan`, `sentiment_only`
- Document in `docs/GCI_PARAMETERS_AND_SOURCES.md` (short): parameter list + in/out sources.
- Update `docs/LABELING_PLAYBOOK.md` to require catalog metric IDs.
- Update Help glossary with “GCI parameter” tip.

### 4. Ingest adapters (text-first; video/audio stub)
- Ensure paste/text/PDF-text/URL ingest tags `source_type` on documents.
- Add stub `POST /api/ingest/media` that accepts metadata `{company_id, media_type: audio|video, note}` and returns  
  `{status: "accepted_stub", next: "provide ASR transcript via /api/ingest/text", scored_from: "transcript_only"}`  
  — **do not** download or process binary media in this pass.
- Research search already over doc store — ensure guidance docs remain citeable.

### 5. Actuals from fundamentals (not a new score)
- Clarify in API/docs: financial statement fields used only to fill `actual_value` for matched (period, metric).
- Optional: `POST /api/actuals/import` CSV/JSON `{company_id, period, metric, actual_value, source_ref}` validated against catalog.
- Do **not** create a parallel “fundamentals GCI.”

### 6. UI (minimal, professional)
- **Help** or **Desk**: “GCI parameters” panel listing core + sector metrics from `/api/metrics`.
- Company evidence / extract: metric dropdown from catalog (not free text) where UI already edits metrics.
- Research Desk: keep fundamentals with MoM/QoQ/YoY as **context**, labeled “not part of GCI.”
- Tracker: no technicals, no shenanigans screens.

### 7. Honesty in meta / Package
- `data_quality_note` or `gci_source_policy`:  
  “GCI uses quantified guidance vs actuals from text sources (transcripts, filings, IR). Audio/video are ASR→text only. Technicians and forensic shenanigans are out of scope.”

## Explicit non-goals (this prompt)

- Live ASR vendor integration (Whisper/cloud) — stub only  
- Video scene analysis / slide OCR pipelines  
- Charting / technical indicators  
- Beneish/M-score / shenanigans engine  
- Buy/Hold models  
- Expanding universe beyond current Sensex scaffolding unless needed for tests  

## Acceptance criteria

- [ ] `/api/metrics` returns ≥12 catalog entries with ids/units/families  
- [ ] Import/extract rejects or normalizes unknown metrics  
- [ ] Docs state source in/out clearly; media ingest is stub that points to transcript  
- [ ] Seed metrics map into catalog (aliases cover existing seed strings)  
- [ ] `pytest` green; frontend build green if UI touched  
- [ ] GCI math unchanged except validation — still guidance vs actuals only  

## Repo pointers

- Outcomes / metrics today: `backend/app/data/hand_labeled*.py`, `seed.py`  
- Extract / import: `backend/app/api/routes.py`, `services/extraction.py`, `services/matching.py`  
- Changes/trends: `backend/app/services/changes.py`  
- Research (context, not GCI): `services/research.py`, `/research` UI  
- Prior site prompt (separate): `docs/prompts/PROFESSIONAL_SITE_PROMPT.md`

## Done definition

Catalog + validation + source policy docs + media stub + metrics API + minimal UI list. No kitchen-sink “analyse everything” product.

---

## Short form

> Implement CiteAlpha **GCI parameter catalog (~12–15 core + sector metrics)** with normalize/validate on extract/import, `GET /api/metrics`, and a **source policy**: transcripts/PDF/IR/filings in; audio/video only as ASR→transcript stub; fundamentals as actuals only; Wordmap out of score; technicals & shenanigans out. Document in `docs/GCI_PARAMETERS_AND_SOURCES.md`. Do not change GCI into full-stock analysis.

---

## Implementation status

**Done (2026-07-21):** catalog, source policy, `/api/metrics`, media stub, actuals import, validation on AlphaHunter, docs, Desk → Parameters, Help glossary. See gaps G24/G25 on `/api/meta`.
