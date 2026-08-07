# Commercial MSA checklist (product + process)

Product now exposes **CSM / SLA / VPC surfaces** in Desk + API. Contracted terms still live in the MSA / order form.

## Product surfaces (shipped)

| Surface | API / UI | Notes |
|---|---|---|
| Named CSM + seats | `GET /api/csm/{org}` · Desk → CSM | `CSM_EMAIL` env |
| SLA targets by plan | `GET /api/sla/{org}` | Observed meter is best-effort since process start |
| Support tickets | `POST /api/csm/{org}/tickets` | Sev 1–3 backlog for CS |
| VPC posture | `GET /api/vpc/posture` | Points at `deploy/aws/vpc-private.example.tf` |
| Nifty labeling milestones | `GET /api/universe/nifty/milestones` | M0–M4; no invented hand_labels |
| Production OIDC | `docs/OIDC.md` | IdP client env required |
| Live AlphaHunter | `ALPHAHUNTER_API_URL` | Else paste JSON import |

## Still MSA / ops (not automatic)

| Item | Owner | Notes |
|---|---|---|
| Contracted uptime / credits | Legal + DevOps | Reference `docs/customer/COVERAGE_AND_SLA.md` |
| VPC / private deploy delivery | DevOps | Customer VPC + NAT/endpoints — apply private template |
| QBR calendar | CS | Product shows cadence hint only |
| 2h onboarding workshop | CS | `docs/customer/ONBOARDING.md` if present |
| Redistribution / embed rights | Legal | Enterprise API |
| Year-2 badge white-label | Product | Factual badge only — not advice |

## Customer-provided secrets

| Item | How |
|---|---|
| HTTPS custom domain | Hostinger → Route53 NS (`docs/DOMAIN_HTTPS.md`) then `terraform apply` |
| Production OIDC | `SSO=true` + `OIDC_*` (see `docs/OIDC.md`) |
| Live India EOD | `INTELLENS_FMP_API_KEY` |
| Live AlphaHunter feed | Vendor URL + key in `.env` → ECS via `aws-deploy.sh` |
| Nifty deep GCI | Hand-label to milestones — never invent actuals |
