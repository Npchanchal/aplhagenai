# CiteAlpha Platform Admin Portal

**Product:** CiteAlpha · **Legal entity:** Ocotillo Innovation Private Limited

Operator guide for the platform admin portal — cross-tenant operations, role-based access, and API usage.

---

## Overview

The admin portal is a **platform-level** console for CiteAlpha operators. It is intentionally separate from **org seat administration** (inviting analysts, revoking seats, minting org API keys), which remains on **Desk** under *Seat administration*.

| Surface | URL | Audience |
|---|---|---|
| Platform admin portal | `/admin` | Users with `platform_admin_role` |
| Org seat admin | `/desk` (admin tab) | Org `owner` or `admin` |
| Legal attest (legacy API key) | `POST /api/legal/attest` | Admin API key (still supported) |

---

## Access model

### Platform admin vs org admin

```
┌─────────────────────────────────────────────────────────────┐
│  User session (Bearer token) or API key (X-API-Key)         │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   platform_admin_role set?          org role owner/admin?
            │                               │
            ▼                               ▼
   /admin + /api/admin/portal/*     Desk seat admin only
   (cross-tenant)                    (single org_id)
```

- **Org role** (`viewer`, `analyst`, `admin`, `owner`, …) gates product features via **plan ∩ role** (`GET /api/entitlements/me`).
- **Platform admin role** (`super`, `ops`, `compliance`, `billing`, `support`) gates the admin portal only.
- A user can be org `admin` **and** platform `ops` — the roles are independent.

### Authentication

The portal accepts either:

1. **Session** — `Authorization: Bearer <token>` after login/register
2. **API key** — `X-API-Key: <key>` where the key row includes `platform_admin_role`

Session users see **Admin portal** in the account menu when `platform_admin_role` is present on their profile.

---

## Platform roles and permissions

Defined in `backend/app/services/admin_portal.py`.

| Platform role | Organizations | Users | Feedback | Legal | Billing | Pilot | Audit | System |
|---|---|---|---|---|---|---|---|---|
| `super` | read/write | read/write | read/write | read/write | read/write | manage | read | ops |
| `ops` | read/write | read | read/write | — | — | manage | read | — |
| `compliance` | read | — | — | read/write | — | — | read | — |
| `billing` | read | — | — | — | read/write | — | read | — |
| `support` | read | read | read/write | — | — | — | read | — |

Permission strings (enforced per route): `orgs.read`, `orgs.write`, `users.read`, `users.write`, `feedback.read`, `feedback.write`, `legal.read`, `legal.write`, `billing.read`, `billing.write`, `pilot.manage`, `audit.read`, `system.ops`.

Only **`super`** can assign or revoke platform roles (`users.write`).

---

## UI sections

Route: `/admin?section=<id>`

| Section ID | Label | Visible when |
|---|---|---|
| `overview` | Overview | Always (any platform role) |
| `orgs` | Organizations | `orgs.read` |
| `users` | Users | `users.read` |
| `feedback` | Feedback | `feedback.read` |
| `legal` | Legal | `legal.read` |
| `billing` | Billing | `billing.read` |
| `audit` | Audit | `audit.read` |
| `system` | System | `system.ops` (super only) |

Non-admins see an access-denied screen with a link back to Desk.

---

## API reference

Base path: `/api/admin/portal`

All endpoints require platform admin auth. Missing or invalid auth returns `401`; valid auth without platform role returns `403`.

### `GET /api/admin/portal/me`

Returns current platform role, flat permission list, and UI section map.

```json
{
  "platform_admin_role": "ops",
  "permissions": ["audit.read", "feedback.read", "feedback.write", "orgs.read", "orgs.write", "pilot.manage", "portal.access", "users.read"],
  "source": "session",
  "email": "ops@desk.example",
  "sections": [
    { "id": "overview", "label": "Overview" },
    { "id": "orgs", "label": "Organizations" }
  ]
}
```

### `GET /api/admin/portal/orgs`

Lists all org snapshots (plan, seats, account type). Requires `orgs.read`.

### `GET /api/admin/portal/users`

Lists registered users (no password fields). Requires `users.read`.

### `PATCH /api/admin/portal/users/{user_id}/platform-role`

Assign or revoke platform admin role. Requires `users.write` (**super only**).

```json
{ "platform_admin_role": "compliance" }
```

Revoke:

```json
{ "platform_admin_role": null }
```

Valid values: `super`, `ops`, `compliance`, `billing`, `support`, or `null`.

### `GET /api/admin/portal/feedback`

All partner feedback across orgs. Optional `?status=open`. Requires `feedback.read`.

### `PATCH /api/admin/portal/feedback/{item_id}`

Update feedback status (`open` | `ack` | `closed`). Requires `feedback.write`.

```json
{ "status": "ack" }
```

### `GET /api/admin/portal/legal`

Legal counsel snapshot (same shape as `legal_attest.snapshot()`). Requires `legal.read`.

### `POST /api/admin/portal/legal/attest`

Record counsel attestation. Requires `legal.write`.

```json
{
  "kind": "terms_privacy",
  "attested_by": "counsel@firm.com",
  "note": "Optional note"
}
```

Kinds: `terms_privacy` | `sebi_retail`.

### `GET /api/admin/portal/billing`

All invoices (cross-org). Requires `billing.read`.

### `GET /api/admin/portal/audit`

Aggregate counters: orgs, users, open feedback, reviews, pending extracts. Requires `audit.read`.

### `POST /api/admin/portal/pilot`

Provision a new pilot org. Requires `pilot.manage`.

```json
{ "name": "Acme Research Desk" }
```

---

## Bootstrap and operations

### Demo / local environment

Seed data includes a super-admin API key:

```
X-API-Key: intellens-admin
```

(`backend/app/data/seed.py` — `platform_admin_role: super`)

### Grant platform access to a user

1. Register or identify the user (`GET /api/admin/portal/users` as super).
2. Assign role:

```bash
export API=http://localhost:8000

curl -X PATCH "$API/api/admin/portal/users/{USER_ID}/platform-role" \
  -H "X-API-Key: intellens-admin" \
  -H "Content-Type: application/json" \
  -d '{"platform_admin_role":"ops"}'
```

3. User signs in (or refreshes session). **Admin portal** appears in the account menu.
4. Open `/admin`.

### Revoke access

```bash
curl -X PATCH "$API/api/admin/portal/users/{USER_ID}/platform-role" \
  -H "X-API-Key: intellens-admin" \
  -H "Content-Type: application/json" \
  -d '{"platform_admin_role":null}'
```

### Production checklist

- [ ] Rotate `intellens-admin` — set `INTELLENS_API_KEY` to a non-demo value; remove demo key from production seed/deploy.
- [ ] Grant `super` to at most 1–2 break-glass operator accounts (not shared mailboxes).
- [ ] Use least-privilege roles (`compliance`, `billing`, `support`) for day-to-day work.
- [ ] Legal attest changes are logged in `legal_attestations` (SQL) and seed `legal_attestations` (JSON fallback).
- [ ] Portal does not expose password hashes or raw API keys except org key mint on Desk.

See also: `docs/PRODUCTION_B2B_B2C.md`, `docs/INFRA_PRODUCTION.md`, `.env.production.example`.

---

## Security notes

- Platform permissions are **not** unioned with org entitlements — separate concern.
- Feedback and legal actions do **not** mutate GCI scores; they route to ops/legal workflows only.
- `POST /api/admin/reset-demo` remains a separate legacy endpoint (API key); super `system.ops` section documents it but does not auto-expose destructive actions in UI.
- Do not grant `super` to customer org users; platform roles are for Ocotillo operators only.

---

## Development

| Artifact | Path |
|---|---|
| RBAC service | `backend/app/services/admin_portal.py` |
| Routes | `backend/app/api/routes.py` |
| Pydantic | `PlatformAdminRoleRequest` in `backend/app/models/schemas.py` |
| Session field | `platform_admin_role` on user; exposed in `_public_user()` |
| Frontend page | `frontend/src/pages/AdminPortalPage.tsx` |
| API client | `frontend/src/lib/api.ts` (`fetchAdminPortal*`) |
| Tests | `backend/tests/test_admin_portal.py` |

Run tests:

```bash
cd backend && pytest tests/test_admin_portal.py -q
```

KB summary: `docs/kb/15-admin-portal.md`
