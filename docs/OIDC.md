# Production OIDC (SSO)

CiteAlpha SSO is **OIDC authorization-code** → token → userinfo/email → desk session.

## Env (API task)

| Variable | Required | Notes |
|---|---|---|
| `SSO` | yes | `true` to enable endpoints |
| `OIDC_CLIENT_ID` | yes | IdP application client id |
| `OIDC_CLIENT_SECRET` | yes | confidential client |
| `OIDC_ISSUER` | yes | e.g. `https://accounts.google.com` or Azure/Okta issuer |
| `OIDC_REDIRECT_URI` | yes | Must match IdP + public URL, e.g. `https://citealpha.com/api/auth/sso/callback` |
| `OIDC_SCOPE` | no | default `openid email profile` |
| `OIDC_DISCOVERY_URL` / `OIDC_TOKEN_URL` / `OIDC_USERINFO_URL` | no | override discovery |
| `OIDC_FRONTEND_REDIRECT` | no | post-login path (default `/`) |
| `OIDC_DEMO_ASSERT` | **tests only** | allow `?email=` without code |

Wire via repo `.env` (gitignored) — `scripts/aws-deploy.sh` maps them to `TF_VAR_oidc_*` / `TF_VAR_sso_enabled`.

## Flow

1. `GET /api/auth/sso/status` — `enabled` / `configured` / `ready`
2. `GET /api/auth/sso/login` — `{ authorize_url }` or `config_required`
3. Browser → IdP → `GET /api/auth/sso/callback?code=&state=`
4. Callback exchanges code, reads email, issues session; HTML bridge writes `intellens.auth.token` and redirects

## Login UI

`/login` shows **Continue with SSO** when status is enabled; if env incomplete, shows config hint (not a fake login).

## Security notes

- Do not enable `OIDC_DEMO_ASSERT` in production.
- Redirect URI must be HTTPS in customer IdP (after domain NS cutover).
- Seat metering applies for first-time SSO users.
- Org mapping: set `email_domain` on the org (`PUT /api/orgs/{id}/oidc`) so SSO users land on that tenant instead of `demo`.
- Optional per-org `oidc_issuer` / `oidc_client_id` fields are stored for IdP inventory (global `OIDC_*` env still drives the authorize flow in MVP).
