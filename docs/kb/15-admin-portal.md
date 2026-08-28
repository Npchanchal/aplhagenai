# 15 — Platform Admin Portal

Multi-tenant **platform** administration at `/admin` — separate from **org seat admin** on Desk (`OrgAdminPanel`).

## Two admin layers

| Layer | Who | Where | Scope |
|---|---|---|---|
| **Org admin** | `owner` / `admin` org role | Desk → Seat administration | One tenant: invites, revoke, API keys, OIDC |
| **Platform admin** | `platform_admin_role` on user or API key | `/admin` | Cross-tenant: orgs, users, legal, billing, feedback |

Org `admin` alone does **not** unlock `/admin`. User must have `platform_admin_role` set.

## Platform roles

| Role | Typical owner | Key permissions |
|---|---|---|
| `super` | Engineering lead | All — assign platform roles, system ops |
| `ops` | Customer success / ops | Orgs, pilot provision, feedback, audit |
| `compliance` | Counsel / compliance | Legal attestations, audit |
| `billing` | Finance / RevOps | Invoices, MSA, audit |
| `support` | Support desk | Feedback, users/orgs read, audit |

Permissions are enforced server-side per route (`backend/app/services/admin_portal.py`).

## APIs

Base: `/api/admin/portal/*` · Auth: session Bearer **or** `X-API-Key` with `platform_admin_role`.

| Method | Path | Permission |
|---|---|---|
| GET | `/me` | portal (any platform role) |
| GET | `/orgs` | `orgs.read` |
| GET | `/users` | `users.read` |
| PATCH | `/users/{id}/platform-role` | `users.write` (super) |
| GET/PATCH | `/feedback`, `/feedback/{id}` | `feedback.read` / `feedback.write` |
| GET/POST | `/legal`, `/legal/attest` | `legal.read` / `legal.write` |
| GET | `/billing` | `billing.read` |
| GET | `/audit` | `audit.read` |
| POST | `/pilot` | `pilot.manage` |

## Bootstrap

Demo super admin: `X-API-Key: intellens-admin` (seed `platform_admin_role: super`).

Grant a user:
```bash
curl -X PATCH "$API/api/admin/portal/users/{user_id}/platform-role" \
  -H "X-API-Key: intellens-admin" \
  -H "Content-Type: application/json" \
  -d '{"platform_admin_role":"ops"}'
```

Revoke: `"platform_admin_role": null`.

## Code

- Service: `backend/app/services/admin_portal.py`
- Routes: `backend/app/api/routes.py` (`/api/admin/portal/*`)
- UI: `frontend/src/pages/AdminPortalPage.tsx`
- Tests: `backend/tests/test_admin_portal.py`

## Full runbook

`docs/ADMIN_PORTAL.md`
