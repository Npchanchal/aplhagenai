---
name: Cursor Assets Index
description: Map of IntelLens rules, skills, agents, and knowledge base for maintainers
---

# Cursor assets (IntelLens)

## Rules (`.cursor/rules/`)

| File | Scope |
|---|---|
| `intellens-core.mdc` | Always |
| `python-backend.mdc` | `backend/**/*.py` |
| `gci-scoring.mdc` | `backend/app/services/**` |
| `gci-pipeline.mdc` | `backend/app/**` |
| `frontend.mdc` | Frontend TS/CSS |
| `frontend-ux.mdc` | UX polish |
| `api-contracts.mdc` | API + `api.ts` |
| `testing-deploy.mdc` | Tests / docker |
| `aws-deploy.mdc` | AWS scripts/terraform |
| `research-terminal.mdc` | Research |
| `i18n-auth.mdc` | i18n / auth / markets |
| `data-quality.mdc` | Seed / labels |
| `compliance-sebi.mdc` | Compliance surfaces |
| `docs-kb.mdc` | `docs/kb/**` |

## Skills (`.cursor/skills/`)

`intellens-gci-dev`, `intellens-close-gaps`, `intellens-api`, `intellens-frontend-ux`, `intellens-research`, `intellens-labeling`, `intellens-phase0-labeling`, `intellens-product`, `intellens-test-deploy`, `intellens-aws`, `intellens-compliance`, `intellens-architecture`, `intellens-kb`

## Agents (`.cursor/agents/`)

See root `AGENTS.md`.

## Knowledge base

`docs/kb/` — start at `README.md`.
