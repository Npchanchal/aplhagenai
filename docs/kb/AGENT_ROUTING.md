# Agent routing

Use this map to pick the right **rule set**, **skill**, and **agent** for a task.

| User intent | Agent (`.cursor/agents/`) | Skill | Rules (also) | KB |
|---|---|---|---|---|
| Score / GCI API / Tracker | `gci-engineer` | `citealpha-gci-dev` | gci-scoring, python-backend, api-contracts | 03, 05 |
| Close gaps G01–G23 / pipeline | `gci-engineer` | `citealpha-close-gaps` | gci-pipeline | 04, GAPS doc |
| UI / UX / dossier / desk | `frontend-designer` | `citealpha-frontend-ux` | frontend, frontend-ux | 06 |
| Research search/chat | `research-terminal` | `citealpha-research` | research-terminal | 07 |
| Hand-label Sensex | `labeling-analyst` | `citealpha-labeling` / phase0 | data-quality | 08 |
| Product / GTM / stories | `product-strategist` | `citealpha-product` | citealpha-core, seo-marketing | 01, 13 |
| Tests / docker release | `qa-release` | `citealpha-test-deploy` | testing-deploy | 10 |
| AWS / ECS | `devops-aws` | `citealpha-aws` | aws-deploy | 11 |
| SEBI / disclaimer / claims | `compliance-reviewer` | `citealpha-compliance` | compliance-sebi | 12 |
| Auth / i18n / markets | `platform-engineer` or frontend | `citealpha-production` | i18n-auth, production-monetization | 09 |
| Billing / paywall / legal attest | `platform-engineer` | `citealpha-production` | production-monetization, compliance-sebi | 09, 13 |
| Sights SKU | `sights-engineer` | `citealpha-sights` | sights, compliance-sebi | 14 |
| Portfolio SKUs (Score/Cite/Radar/Ledger/Data) | `portfolio-engineer` | `citealpha-portfolio` | portfolio, api-contracts | 13, PRODUCT_PORTFOLIO |
| Platform admin portal | `platform-engineer` | `citealpha-production` | production-monetization | 15, ADMIN_PORTAL |
| Architecture map | `architect` | `citealpha-architecture` | python-backend, frontend | 02 |
| Update this kb | any | `citealpha-kb` | docs-kb | README |

## Default session

1. Read `docs/kb/00-overview.md` if unfamiliar.
2. Apply always-on `citealpha-core`.
3. Load the matching skill before coding.
4. Keep changes small and tested.
