# 09 — i18n, Auth & Markets

## Markets

- Deep GCI: **IN + SENSEX** (and labeled Sensex names).
- Other markets/indexes may be **scaffold** — show honest banner; do not fake GCI depth.
- Preferences: default market/index via session prefs.

## i18n

- UI strings: `frontend/src/i18n/`
- Vernacular GCI blurbs: `GET /api/vernacular/{id}?lang=` (en/hi/ta/gu/mr/ja templates)
- Always pair vernacular with disclaimer.

## Auth

- Register / login / guest continue — **Terms + Privacy acceptance required** (`accept_terms`).
- Account types: `retail` (B2C personal tenant) · `b2b` (new org from `org_name`).
- Write APIs: session Bearer **or** `X-API-Key` (org-scoped). Effective access = **intersection** of org plan features and user role (`GET /api/entitlements/me`).
- Plans: `guest` · `retail` · `pilot` · `desk` · `enterprise` · `onestop`. Roles: `guest` · `viewer` · `analyst` · `labeler` · `reviewer` · `admin` · `owner`.
- Guest: Tracker + dossier read (15 dossier opens / session) then a **paywall modal** (`guest_dossier_cap`). Register always; `/package` `/billing` only when retail marketing is counsel-approved (`INTELLENS_RETAIL_MARKETING` / sebi_retail attest). No Desk writes, chat, labeling, or feedback. Register merges `guest_token` prefs.
- Seat admin assigns **role per invite**; design-partner invite → viewer + feedback, 60-day token.
- SSO: stub/OIDC (`/api/auth/sso/*`) — production OIDC is ops follow-up.
- Orgs/seats: `GET /api/orgs/{id}`, `GET /api/orgs/me` · legal: `/api/legal/*`.
- Platform admin portal: `/admin` · `/api/admin/portal/*` · roles `super|ops|compliance|billing|support` — see `docs/kb/15-admin-portal.md`.
- Owner: **Ocotillo Innovation Private Limited** (see footer / `/api/legal/meta`).

## Docs

`docs/I18N_AUTH_MARKETS.md`, `docs/PRODUCTION_B2B_B2C.md`, `docs/prompts/I18N_AUTH_MARKETS_PROMPT.md`, `docs/REGIONAL_MARKETS.md`
