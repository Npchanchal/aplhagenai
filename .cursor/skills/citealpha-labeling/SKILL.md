---
name: citealpha-labeling
description: Hand-label India equity guidance vs actuals for CiteAlpha GCI (Phase 1 playbook).
---

# CiteAlpha labeling

Follow `docs/LABELING_PLAYBOOK.md` and wave runbook `docs/LABELING_RUNBOOK.md` (P0 CSV + scripts).

When adding a company to `backend/app/data/hand_labeled.py`:

- Prefer official guidance-vs-actuals tables (Infosys-class).
- Always include `source_url`, `source_ref`, `quote_span`, `as_of`.
- Use bands (`guided_low`/`guided_high`) when disclosed.
- Do not invent Buy/Hold language — factual guidance delivery only.
- After edits, delete `backend/app/data/store.json` and re-run pytest.
