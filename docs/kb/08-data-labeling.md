# 08 — Data & Labeling

## Quality flags

| Flag | Meaning | External cite? |
|---|---|---|
| `hand_labeled` | Human-audited guidance vs actuals + sources | Yes |
| `demo_structured` | Synthetic-but-realistic seed | Demo only |
| `market_scaffold` | Universe row without deep GCI | No dossier depth |

## Hand-label workflow

1. Follow `docs/LABELING_PLAYBOOK.md`.
2. Edit `backend/app/data/hand_labeled.py` (or seed paths as documented).
3. Prefer official IR guidance-vs-actuals tables when available.
4. Always: bands, `source_url`, `source_ref`, `quote_span`, `as_of`.
5. Delete `backend/app/data/store.json` after edits; re-run pytest.
6. Update `docs/ACCURACY_ASSESSMENT.md` when cohort quality changes.

## Never

- Invent actuals or quotes.
- Silently overwrite hand_labeled with demo generators.
- Ship Buy/Hold language in labels.

## Skills

`intellens-labeling`, `intellens-phase0-labeling`
