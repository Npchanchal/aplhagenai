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

- Register / login / guest continue.
- Write APIs: `X-API-Key`.
- SSO: stub status/login (`/api/auth/sso/*`) — production OIDC is ops follow-up.
- Orgs/seats: `GET /api/orgs/{id}` CSM stub.

## Docs

`docs/I18N_AUTH_MARKETS.md`, `docs/prompts/I18N_AUTH_MARKETS_PROMPT.md`, `docs/REGIONAL_MARKETS.md`
