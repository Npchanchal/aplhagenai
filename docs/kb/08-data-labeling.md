# 08 — Data & Labeling

## Quality flags

| Flag | Meaning | External cite? |
|---|---|---|
| `hand_labeled` | Human-audited guidance vs actuals + sources | Yes |
| `demo_structured` | Synthetic-but-realistic seed | Demo only |
| `market_scaffold` | Universe row without deep GCI | No dossier depth |

## In-product workbench

Desk `?tab=labeling` (feature `labeling`): draft → submit → second reviewer accept. APIs under `/api/labeling/drafts`. When `USE_DB_AUTH` is on, drafts persist in `intellens_label_drafts` (SQLite/Postgres); otherwise JSON store. Accept merges outcomes and may promote `demo_structured` / `listing_provisional` → `hand_labeled` only when `source_url` + `quote_span` exist. Does **not** rewrite `hand_labeled.py`. Two-person rule: submitter ≠ accepter unless admin/owner. Trust Center and Desk CSM show submitter/reviewer **ids** (no emails).

Quality partner feedback (`wrong_band` / `wrong_period` / `wrong_label` / `missing_source`) enqueues a high-priority labeling-queue item. **GCI is not mutated** by feedback.

Priority enqueue `POST /api/labeling/queue` remains ops SLA (Desk), not HL promotion.

CSV import uses `docs/labeling/outcome_row_template.csv` columns and still creates drafts.

## Hand-label workflow (repo)

1. Follow `docs/LABELING_PLAYBOOK.md` and the wave runbook `docs/LABELING_RUNBOOK.md`.
2. P0 batch (10 Nifty-extra `demo_structured`): `docs/labeling/batch_p0_nifty_extra.csv`.
3. Outcome sheet columns: `docs/labeling/outcome_row_template.csv`.
4. Enqueue M2: `./scripts/labeling-enqueue-m2.sh` · status: `./scripts/labeling-status.sh`.
5. Edit `backend/app/data/hand_labeled.py` (Nifty-extra ids promote when present; `seed.py` sets `hand_labeled`).
6. Prefer official IR guidance-vs-actuals tables when available.
7. Always: bands, `source_url`, `source_ref`, `quote_span`, `as_of`.
8. Delete `backend/app/data/store.json` after edits; re-run pytest.
9. Update `docs/ACCURACY_ASSESSMENT.md` when cohort quality changes.

## Provisional

`listing_provisional` = coverage only. Promote only via labeling queue → extract/review → real outcomes (never quality-flag flip).

## Never

- Invent actuals or quotes.
- Silently overwrite hand_labeled with demo generators.
- Ship Buy/Hold language in labels.

## Skills

`citealpha-labeling`, `citealpha-phase0-labeling`
