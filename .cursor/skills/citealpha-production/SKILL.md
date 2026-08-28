---
name: citealpha-production
description: >-
  Implements CiteAlpha production auth, billing, entitlements, legal attest,
  and Postgres persistence. Use when working on login, orgs, seats, paywall,
  billing, guest limits, or docs/PRODUCTION_B2B_B2C.md.
---

# CiteAlpha Production / Monetization

## Steps

1. Read `docs/PRODUCTION_B2B_B2C.md`, `docs/INFRA_PRODUCTION.md`, `docs/kb/09-i18n-auth-markets.md`, `docs/kb/13-commercial.md`.
2. Entitlements: edit `backend/app/services/entitlements.py` — plan ∩ role, never union.
3. Auth/session: `session_auth.py`, `auth_db.py`, `postgres.py`; mirror in `frontend/src/lib/auth.tsx`.
4. Billing/legal: `billing.py`, `legal.py`, `legal_attest.py`; UI in Billing/Register/Terms pages.
5. Guest abuse: `guest_lock.py`, `abuse.py`, `rate_limit.py` — keep caps honest.
6. Env: `.env.production.example` · verify with `scripts/check-production-secrets.sh`.
7. Tests: `test_production_auth.py`, `test_entitlements_access.py`, `test_phase1_monetization.py`, `test_admin_portal.py`.
8. Platform admin portal: `docs/ADMIN_PORTAL.md` · kb `docs/kb/15-admin-portal.md`.

## Checklist

- [ ] Plan ∩ role enforced on new routes (backend + frontend gate)
- [ ] Guest write paths limited to `GUEST_WRITE_ALLOW`
- [ ] No secrets in logs or committed `.env`
- [ ] Counsel gates documented when adding B2C surfaces
- [ ] API types synced in `frontend/src/lib/api.ts`

## Counsel ungate (ops)

```bash
curl -X POST "$API/api/legal/attest" -H "X-API-Key: intellens-admin" \
  -H "Content-Type: application/json" \
  -d '{"kind":"sebi_retail","attested_by":"counsel@firm.com"}'
```

Or set `INTELLENS_LEGAL_COUNSEL_STATUS=counsel_approved` and `INTELLENS_RETAIL_MARKETING=true`.
