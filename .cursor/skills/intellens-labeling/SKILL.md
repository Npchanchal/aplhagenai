---
name: intellens-labeling
description: Hand-label India equity guidance vs actuals for IntelLens GCI (Phase 1 playbook).
---

# IntelLens labeling

Follow `docs/LABELING_PLAYBOOK.md`.

When adding a company to `backend/app/data/hand_labeled.py`:

- Prefer official guidance-vs-actuals tables (Infosys-class).
- Always include `source_url`, `source_ref`, `quote_span`, `as_of`.
- Use bands (`guided_low`/`guided_high`) when disclosed.
- Do not invent Buy/Hold language — factual guidance delivery only.
- After edits, delete `backend/app/data/store.json` and re-run pytest.
