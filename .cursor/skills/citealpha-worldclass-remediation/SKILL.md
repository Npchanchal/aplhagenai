---
name: citealpha-worldclass-remediation
description: >-
  Executes workstreams from docs/PLAN_WORLDCLASS_GCI.md (Round-3 site review
  findings R3-xx): synthetic-history removal, confidence tiers, score ledger and
  changelog, guidance-side citations, labeling governance, dossier/screener rework,
  copy voice, SEO indexing, package rewrite, legal/enterprise hardening, index
  governance. Use when the user asks to implement, continue, or verify any R3 finding
  or W1–W9 workstream.
---

# World-class GCI remediation

Source of truth: `docs/PLAN_WORLDCLASS_GCI.md`. Findings are `R3-nn`; workstreams are `W1–W9`. Do not re-audit; execute.

## Picking work

1. Open the plan; take the **lowest-numbered open task** in the current phase unless the user names one.
2. Load the workstream's specialist and skill (table in the plan → "Owner").
3. Read the task's *Acceptance* line — that is the definition of done, plus tests green.

## Per-task loop

```
- [ ] Reproduce the finding on the local stack (docker compose up: web :8080, api :8000)
- [ ] Write/extend the failing test first (backend/tests or e2e/tests) — negative tests for leaks
- [ ] Implement the smallest change that passes; keep scoring pure, API via lib/api.ts
- [ ] If a published number moves → follow skill citealpha-index-integrity (ledger + changelog)
- [ ] Update copy through en.json; run test_public_copy_hygiene.py; other locales get the English string until translated
- [ ] Update docs/kb page named in the task; tick the task in the plan with commit hash
- [ ] Verify on http://localhost:8080 as guest AND as pilot seat; screenshot to docs/reviews/<date>/ when the task says so
```

## Verification commands

```bash
cd backend && PYTHONPATH=. .venv/bin/pytest -q                    # all
cd backend && PYTHONPATH=. .venv/bin/pytest -q tests/test_index_integrity.py tests/test_score_consistency.py tests/test_public_copy_hygiene.py
cd frontend && npm run build && npm test
cd e2e && E2E_BASE_URL=http://127.0.0.1:8080 npx playwright test --reporter=line
curl -s localhost:8000/api/public/gci-rankings | python3 -m json.tool | head -40
```

## Phase gates (do not skip ahead)

| Gate | Passes when |
|---|---|
| **G-A** (stop the bleeding) | W1 complete: zero synthetic numbers on any public response; tiers shown; ledger + `/changelog` live; Infosys 48.2→88.2 logged |
| **G-B** (trustworthy page) | W2 + W3 + W4: dual citations on all scored rows or excluded; dossier anatomy shipped; screener/snapshot reworked; reviewer stamps visible |
| **G-C** (findable & sellable) | W5 + W6 + W7: dossiers indexed; copy sweep done; package page = 3 plans; billing labelled honestly |
| **G-D** (enterprise) | W8: counsel attest, session TTL, MFA/SAML plan, durable infra, grievance officer, GA4 disclosed |
| **G-E** (index) | W9: governance charter, frozen index files, licence pack, verification audit published |

## Reporting

At the end of a session, update the plan's **Status** column and write a 5-line note under "Progress log" (date, tasks closed, tests run, numbers moved + ledger ids, open risks).

## Do not

- Delete a panel the plan says to *move* to the Workbench.
- Rename URLs (display names only).
- Publish dates for Nifty coverage unless the user provides them.
- Touch brand assets (rule `brand-assets`).
