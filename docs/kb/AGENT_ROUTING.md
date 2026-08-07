# Agent routing

Use this map to pick the right **rule set**, **skill**, and **agent** for a task.

| User intent | Agent (`.cursor/agents/`) | Skill | Rules (also) | KB |
|---|---|---|---|---|
| Score / GCI API / Tracker | `gci-engineer` | `intellens-gci-dev` | gci-scoring, python-backend, api-contracts | 03, 05 |
| Close gaps G01–G23 / pipeline | `gci-engineer` | `intellens-close-gaps` | gci-pipeline | 04, GAPS doc |
| UI / UX / dossier / desk | `frontend-designer` | `intellens-frontend-ux` | frontend, frontend-ux | 06 |
| Research search/chat | `research-terminal` | `intellens-research` | research-terminal | 07 |
| Hand-label Sensex | `labeling-analyst` | `intellens-labeling` / phase0 | data-quality | 08 |
| Product / GTM / stories | `product-strategist` | `intellens-product` | intellens-core | 01, 13 |
| Tests / docker release | `qa-release` | `intellens-test-deploy` | testing-deploy | 10 |
| AWS / ECS | `devops-aws` | `intellens-aws` | aws-deploy | 11 |
| SEBI / disclaimer / claims | `compliance-reviewer` | `intellens-compliance` | compliance-sebi | 12 |
| Auth / i18n / markets | `gci-engineer` or frontend | — | i18n-auth | 09 |
| Architecture map | `architect` | `intellens-architecture` | python-backend, frontend | 02 |
| Update this kb | any | `intellens-kb` | docs-kb | README |

## Default session

1. Read `docs/kb/00-overview.md` if unfamiliar.
2. Apply always-on `intellens-core`.
3. Load the matching skill before coding.
4. Keep changes small and tested.
