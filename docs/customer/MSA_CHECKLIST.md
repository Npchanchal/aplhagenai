# Commercial MSA checklist (not product code)

These Package / One-Stop lines stay **process & contract** — ship via order form / MSA, not the app.

| Item | Owner | Notes |
|---|---|---|
| Named CSM | Sales / CS | Desk CSM tab shows org stub + contact |
| Quarterly business reviews (QBR) | CS | Sensex → Nifty labeling milestones |
| 2h onboarding workshop | CS | See `docs/customer/ONBOARDING.md` if present |
| Contracted SLA / uptime | Legal + DevOps | Hosted SLA in COVERAGE_AND_SLA.md |
| VPC / private deploy | DevOps | Scoped in Enterprise / One-Stop MSA |
| Redistribution / embed rights | Legal | Enterprise API priced right |
| Year-2 badge white-label | Product | Factual badge only — not advice |

## Ops still customer-provided

| Item | How |
|---|---|
| HTTPS custom domain | Set `acm_certificate_arn` in `deploy/aws` (ACM in ap-south-1) + DNS → ALB |
| Production OIDC | `SSO=true` + `OIDC_CLIENT_ID` / `ISSUER` / `REDIRECT_URI` / `CLIENT_SECRET` |
| Live India EOD | `INTELLENS_FMP_API_KEY` (wired into ECS by `aws-deploy.sh` from `.env`) |
| Live AlphaHunter feed | Vendor contract — product supports Facts JSON import today |
| Nifty deep GCI | Hand-label milestones — not day-1 |

## Git

This workspace may not have a `.git` directory. Initialize or push from your canonical remote when ready.
