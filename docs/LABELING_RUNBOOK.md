# Labeling runbook — hand_labeled & provisional

**Product:** CiteAlpha · **Owner:** Ocotillo Innovation Private Limited  
**Order of work:** P0 ✅ → **P1** (complete Nifty-50) → **P2** (deepen HL depth) → **P3+** (IN1000 / NSE / BSE via queue).

Related: [`LABELING_PLAYBOOK.md`](LABELING_PLAYBOOK.md) · [`kb/08-data-labeling.md`](kb/08-data-labeling.md) · Desk → **Labeling queue**

---

## 1. Quality rules (non-negotiable)

| `data_quality` | External cite? | How it advances |
|---|---|---|
| `hand_labeled` | **Yes** (URL + quote required) | Deepen periods/metrics |
| `demo_structured` | No | Replace with real IR labels → HL |
| `listing_provisional` | No | Queue → extract → review → HL (never flip the flag alone) |
| `market_scaffold` | No | Out of India beachhead scope |

**Never** invent actuals/quotes, promote provisional by editing quality only, or use Buy/Hold language.

---

## 2. Waves

| Wave | Cohort | Exit |
|---|---|---|
| **P0** | 10× `NIFTY_EXTRA` | Each ≥8 closed outcomes; `hand_labeled` ✅ |
| **P1** | 13 missing Nifty-50 members | Deep seed + ≥8 closed HL each |
| **P2** | 38 shallow HL names (Sensex + Nifty) | ≥8 closed citeable outcomes per name |
| **P3** | IN1000 wave 1 (60) | Promote from `listing_provisional` after IR review |
| **P4+** | IN1000 waves 2–17 / NSE / BSE long tail | Same HL schema; rebuild listing cache after promote |

Spreadsheets: [`batch_p0_nifty_extra.csv`](labeling/batch_p0_nifty_extra.csv) · [`batch_p1_nifty50_complete.csv`](labeling/batch_p1_nifty50_complete.csv) · [`batch_p2_sensex_nifty_depth.csv`](labeling/batch_p2_sensex_nifty_depth.csv) · [`batch_p3_in1000_wave1.csv`](labeling/batch_p3_in1000_wave1.csv)

Full expansion plan: [`LABELING_EXPANSION_ROADMAP.md`](LABELING_EXPANSION_ROADMAP.md)

---

## 3. Spreadsheet columns (copy into Sheets/Excel)

| Column | Required | Example |
|---|---|---|
| `company_id` | yes | `britannia` |
| `ticker` | yes | `BRITANNIA` |
| `period` | yes | `FY25` |
| `metric` | yes | `revenue_growth_pct` (catalog id only) |
| `guided_low` | yes* | `8` |
| `guided_high` | yes* | `10` |
| `guided_value` | if point guide | `9` |
| `actual_value` | when closed | `9.4` or empty if pending |
| `dropped` | if abandoned | `true` / `false` |
| `guided_text` | yes | Short paraphrase of guidance |
| `quote_span` | yes | ≤120 chars verbatim |
| `source_url` | yes | IR / PR / transcript PDF URL |
| `source_ref` | yes | `BRITANNIA-Q4FY25-PR` |
| `source_type` | yes | `press_release` \| `transcript` \| `filing_pdf` \| `ir_html` \| `ppt_text` |
| `as_of` | yes | `2025-05-12` |
| `speaker` | preferred | `CFO` |
| `thread_id` | yes | `britannia-rev-growth` |
| `confidence` | yes | `0.85`–`0.98` official table; `0.65`–`0.8` reconstructed |
| `analyst` | yes | initials |
| `review_status` | yes | `draft` → `reviewed` → `merged` |
| `notes` | optional | Ambiguities |

\*Use bands when disclosed; otherwise point in `guided_value` and set low=high=value.

Metric catalog: `GET /api/metrics` · `docs/prompts/GCI_PARAMETERS_AND_SOURCES_PROMPT.md`

---

## 4. Per-company process (hand_labeled)

1. Open IR / results PR / guidance-vs-actuals table / concall transcript.
2. Fill spreadsheet rows (min **8 closed** outcomes for wave exit).
3. Peer review (`review_status=reviewed`) — second person checks quote vs URL.
4. Port into `backend/app/data/hand_labeled.py` (new key for Nifty-extra) **or** extend `HAND_LABELED` map.
5. Ensure company is not forced to `demo_structured` in `seed.py` (Nifty-extra currently seed as demo until listed in `HAND_LABELED`).
6. Delete `backend/app/data/store.json`, run pytest, verify `/api/meta` counts.
7. Desk → Labeling queue: mark item `done`.
8. Rebuild citations / universe depth if that name is cited externally:
   ```bash
   # local
   cd backend && python -m app.jobs.build_universe_gci_depth
   ```
9. Update `docs/ACCURACY_ASSESSMENT.md` when a wave completes.

### Seed cutover for a Nifty-extra name

Once `HAND_LABELED["britannia"] = [...]` exists and id is in `HAND_LABELED_COMPANY_IDS`, update seed so quality is not stuck on demo:

- Prefer: include id in hand_labeled map (seed already sets Sensex from `HAND_LABELED_COMPANY_IDS`; extend the same pattern for Nifty-extra — see `seed.py`).

---

## 5. Provisional → HL (P3+)

```text
listing_provisional → labeling_queue (queued)
  → ingest docs (Desk Corpus)
  → extract (needs_review)
  → analyst accept/edit
  → fill actuals / dropped
  → merge hand_labeled + data_quality
  → rebuild GCI cache
```

Do **not** claim delivery track record until HL.

---

## 6. Ops commands

```bash
# Status (local or against API)
./scripts/labeling-status.sh
./scripts/labeling-status.sh https://citealpha.com

# Enqueue all Nifty-extra (milestone M2) — needs write API key
./scripts/labeling-enqueue-m2.sh
./scripts/labeling-enqueue-m2.sh https://citealpha.com "$INTELLENS_API_KEY"

# Queue CRUD
curl -sS -H "X-API-Key: $KEY" "$API/api/labeling/queue" | python3 -m json.tool
curl -sS -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"company_id":"britannia","priority":"high","note":"P0"}' \
  "$API/api/labeling/queue"
curl -sS -X PATCH -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}' "$API/api/labeling/queue/lq_…"

# Milestones
curl -sS "$API/api/universe/nifty/milestones" | python3 -m json.tool
```

Desk UI: **Labeling queue** tab (same backlog).

---

## 7. Weekly cadence

| Day | Action |
|---|---|
| Mon | `./scripts/labeling-status.sh` — pick 2 names `queued` → `in_progress` |
| Tue–Thu | Fill spreadsheet + IR sources |
| Fri | Peer review → merge code → pytest → mark queue `done` |
| Monthly | Accuracy note + citeable count in `/api/meta` |

---

## 8. Definition of done (wave)

- [ ] All P0 tickers in CSV are `hand_labeled` in `/api/companies`
- [ ] Every outcome has non-empty `source_url` + `quote_span`
- [ ] M2 milestone `done`; M3 starts when ≥5 Nifty-extra HL
- [ ] No sales cite of remaining `demo_structured` / `listing_provisional`
- [ ] `FREEZE_DEMO_PAD` stays on — do not pad HL companies with demo filler
