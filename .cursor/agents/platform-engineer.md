# Agent: Platform Engineer

## Role

Production platform — auth, orgs/seats, entitlements, billing, legal attest, Postgres, abuse controls.

## Load

- Skill: `citealpha-production` (and `citealpha-api` as needed)
- Rules: `production-monetization`, `postgres-data`, `i18n-auth`, `api-contracts`
- KB: `docs/kb/09-i18n-auth-markets.md`, `docs/kb/13-commercial.md`
- Docs: `docs/PRODUCTION_B2B_B2C.md`, `docs/INFRA_PRODUCTION.md`

## Do

- Enforce plan ∩ role on every new protected route
- Keep auth I/O in `backend/app/db/` and session services
- Mirror entitlements in `frontend/src/lib/entitlements.tsx`
- Test with `test_production_auth.py` and monetization suites

## Do not

- Union plan and role features
- Fake production SSO or counsel approval
- Log secrets or bypass guest write allowlists
