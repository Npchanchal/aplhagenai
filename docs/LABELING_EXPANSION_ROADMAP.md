# Labeling expansion roadmap — Sensex → Nifty → IN1000 → NSE/BSE

**Product:** CiteAlpha · **Rule:** never invent actuals; `hand_labeled` requires `source_url` + `quote_span`.

## Current state (Aug 2026)

| Universe | Listed | `hand_labeled` | Citeable depth | Notes |
|---|---:|---:|---|---|
| **Sensex** | 30 | 30 | Shallow — most names have 1–2 outcomes, not 8 closed | Flag is HL; depth wave P2 |
| **Nifty 50** | 40 in product tab | 40 | Same shallow depth + **13 index members missing** from deep seed | P0 Nifty-extra done; P1 closes gap |
| **IN1000** | 1,000 | 40 (overlap) | 960 `listing_provisional` | P3+ waves |
| **NSE_ALL** | 2,364 | 40 (overlap) | ~2,324 provisional | Same queue as IN1000 priority |
| **BSE_ALL** | 4,928 | 40 (overlap) | ~4,888 provisional | BSE-only names after NSE overlap |

**Gold standard:** Cipla / Apollo / HDFC Life in `hand_labeled_nifty.py` — 8+ rows, official transcript URLs, closed actuals.

**CI guard:** `backend/tests/test_citation_universe_audit.py` — Sensex + Nifty50 must stay fully HL and citeable; bulk indexes stay majority provisional.

---

## Waves (execution order)

| Wave | Cohort | Count | Exit criteria | Batch CSV |
|---|---|---:|---|---|
| **P0** | Nifty-extra | 10 | Each ≥8 closed, HL | `batch_p0_nifty_extra.csv` ✅ done |
| **P1** | Missing Nifty-50 members | 13 | Add to deep seed + ≥8 closed HL | `batch_p1_nifty50_complete.csv` |
| **P2** | Deepen existing HL | 38 | Every current HL name ≥8 closed citeable outcomes | `batch_p2_sensex_nifty_depth.csv` |
| **P3** | IN1000 wave 1 | 60 | Top-liquidity names beyond Nifty → HL | `batch_p3_in1000_wave1.csv` |
| **P4** | IN1000 waves 2–17 | 900 | 60 names / month × 15 months | Generate per wave |
| **P5** | NSE/BSE long tail | 6k+ | Ingest → extract → classify until `listed_only` is 0. `no_quantified_guidance` after lookback. Promote via Desk only for human gold (`hand_labeled`) | `python -m app.jobs.classify_india_coverage --cohort all` |

**Do not** flip `data_quality` without real sourced outcomes. Provisional scores are navigation only.

---

## Per-company process

Same as [LABELING_RUNBOOK.md](LABELING_RUNBOOK.md):

1. Fill `outcome_row_template.csv` rows from IR / transcripts.
2. Peer review (`review_status=reviewed`).
3. Merge into `hand_labeled.py` / `hand_labeled_nifty.py` (or accept via Desk drafts).
4. Delete `store.json`, run pytest, rebuild citations:
   ```bash
   cd backend && python -m app.jobs.build_universe_gci_depth
   ```
5. Mark Desk queue item `done`.

---

## Ops commands

```bash
# Status
./scripts/labeling-status.sh

# Enqueue a wave from batch CSV (high priority)
./scripts/labeling-enqueue-batch.sh docs/labeling/batch_p1_nifty50_complete.csv
./scripts/labeling-enqueue-batch.sh docs/labeling/batch_p2_sensex_nifty_depth.csv https://citealpha.com "$INTELLENS_API_KEY"

# CSV import → Desk drafts (needs write API key)
curl -sS -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"csv":"'"$(cat docs/labeling/outcome_row_template.csv)"'"}' \
  "$API/api/labeling/import-csv"
```

---

## Effort model (honest)

| Target | Analyst effort | Calendar @ 2 names/week |
|---|---|---|
| P1 (13 names) | ~104 closed outcomes | ~7 weeks |
| P2 (38 names deepen) | ~250+ new rows | ~19 weeks |
| P3 (60 names) | ~480 closed outcomes | ~30 weeks |
| Full IN1000 (960 net new) | ~7,680 outcomes | Multi-year without team |

**Recommendation:** finish **P1 + P2** before sales claims “Nifty-50 deep GCI.” Start **P3** only after P2 exit.

---

## What we need from you

1. **Analyst bandwidth** — 1–2 people × 4–8 hrs/week minimum for P1/P2.
2. **Wave priority** — confirm P1 → P2 → P3 order (or reprioritize a sector).
3. **IR access** — company sites, BSE/NSE filings, broker transcript PDFs (no invented quotes).
4. **Review pairing** — second reviewer for two-person accept rule on Desk drafts.
5. **Optional:** NSE official Nifty-50 CSV for index membership sync (we currently infer from public lists).

---

## Missing Nifty-50 members (P1)

| Ticker | `company_id` |
|---|---|
| ADANIENT | `nse_adanient` |
| BAJAJ-AUTO | `nse_bajaj_auto` |
| BEL | `nse_bel` |
| ETERNAL | `nse_eternal` |
| HINDALCO | `nse_hindalco` |
| INDIGO | `nse_indigo` |
| JIOFIN | `nse_jiofin` |
| MAXHEALTH | `nse_maxhealth` |
| ONGC | `nse_ongc` |
| SBILIFE | `nse_sbilife` |
| SHRIRAMFIN | `nse_shriramfin` |
| TATACONSUM | `nse_tataconsum` |
| TRENT | `nse_trent` |

These exist in NSE listings as `listing_provisional` today.
