# Production readiness — B2B + B2C (CiteAlpha)

**Product:** CiteAlpha · **Owner:** Ocotillo Innovation Private Limited

## Priority status

| Priority | Item | Status |
|---|---|---|
| Legal | Counsel sign-off on Terms/Privacy | **Shipped** — `POST /api/legal/attest` (admin) + `/api/legal/meta` counsel_status |
| Infra | Postgres/SQL auth, HTTPS, secrets, backups | **Shipped** — `USE_DB_AUTH` / `USE_POSTGRES_AUTH`, HSTS middleware, `scripts/backup-intellens.sh`, `scripts/check-production-secrets.sh`, `.env.production.example` |
| B2B | OIDC per org, invite/revoke, MSA billing | **Shipped** — org OIDC + `email_domain`, seat admin, `POST /api/billing/msa` + e-sign |
| B2C | SEBI counsel, paywall, abuse controls | **Shipped** — SEBI attest unlocks paywall; `/billing` UPI checkout; `/api/auth/abuse-challenge` |
| Auth | Email verify + password reset | **Shipped** |
| Ops | Platform admin portal (role-based) | **Shipped** — `/admin` · `/api/admin/portal/*` · see `docs/ADMIN_PORTAL.md` |

## How to ungate counsel in an environment

```bash
# Admin key
curl -X POST "$API/api/legal/attest" -H "X-API-Key: intellens-admin" \
  -H "Content-Type: application/json" \
  -d '{"kind":"terms_privacy","attested_by":"counsel@firm.com"}'
curl -X POST "$API/api/legal/attest" -H "X-API-Key: intellens-admin" \
  -H "Content-Type: application/json" \
  -d '{"kind":"sebi_retail","attested_by":"counsel@firm.com"}'
```

Or set `INTELLENS_LEGAL_COUNSEL_STATUS=counsel_approved` and `INTELLENS_RETAIL_MARKETING=true`.

## Ops runbook

See `docs/INFRA_PRODUCTION.md`, `docs/ADMIN_PORTAL.md`, `.env.production.example`, `scripts/check-production-secrets.sh`, `scripts/backup-intellens.sh`.

## Copyright

© Ocotillo Innovation Private Limited. CiteAlpha is a product of Ocotillo Innovation Private Limited.
