# Infrastructure — production (Ocotillo / CiteAlpha)

## SQL auth (SQLite or Postgres)

```bash
# Local / compose — SQLite file backend
USE_DB_AUTH=1

# AWS ECS — SQLite on EFS (wired by deploy/aws; survives redeploys)
USE_DB_AUTH=1
AUTH_SQLITE_PATH=/data/auth.db
# After first deploy with empty EFS:
BOOTSTRAP_SUPER_EMAIL=ops@citealpha.com BOOTSTRAP_SUPER_PASSWORD=... ./scripts/aws-deploy.sh
# Or: python3 scripts/bootstrap-super-user.py --email ... --password ...

# Postgres
docker compose --profile postgres up -d db
DATABASE_URL=postgresql://intellens:intellens@localhost:5432/intellens
USE_POSTGRES_AUTH=1
# Apply schema (admin key)
curl -X POST http://localhost:8000/api/infra/db/migrate -H "X-API-Key: intellens-admin"
```

Status: `GET /api/infra/postgres` · `/api/meta` → `infra`

## HTTPS / HSTS

```bash
FORCE_HTTPS=1
ENABLE_HSTS=1
```

`SecurityHeadersMiddleware` redirects HTTP→HTTPS when `FORCE_HTTPS` and emits HSTS.

## Secrets & backups

```bash
./scripts/check-production-secrets.sh
./scripts/backup-intellens.sh
```

Template: `.env.production.example`

## Analytics (consent-gated)

Set `VITE_GA_MEASUREMENT_ID=G-…` (GA4) and/or `VITE_PLAUSIBLE_DOMAIN=citealpha.com` at **frontend image build** time. Scripts load only after the DPDP consent banner (`analytics_consent`). Funnel events: `guest_continue`, `register`, `open_dossier`, `open_citation`, `label_submit`, `feedback_submit`, `pilot_cta`, `billing_cta`. No emails or quote text.

CSP: `SecurityHeadersMiddleware` and SPA nginx emit `Content-Security-Policy` allowing `'self'` plus GTM / GA / Plausible hosts. Scripts still inject only after DPDP consent (`analytics.ts`). `GET /api/trust` → `security.csp`.

## Auth abuse

- `GET /api/auth/abuse-challenge` then pass `challenge_id` + `challenge_answer` on register/guest
- `INTELLENS_ABUSE_OFF=1` only for tests
- `AUTH_RATE_LIMIT_RPM` (default 20)

## Legal / retail

| Action | API |
|---|---|
| Attest Terms/Privacy | `POST /api/legal/attest` `{kind: terms_privacy}` admin key |
| Attest SEBI retail | `POST /api/legal/attest` `{kind: sebi_retail}` |
| Retail checkout | `POST /api/billing/retail/checkout` |
| MSA invoice + e-sign | `POST /api/billing/msa` → `/sign` |
