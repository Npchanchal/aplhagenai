#!/usr/bin/env bash
# Fail if production-critical secrets look like demo defaults.
set -euo pipefail
fail=0
warn() { echo "WARN: $*"; }
die() { echo "FAIL: $*"; fail=1; }

[[ "${INTELLENS_API_KEY:-intellens-demo}" == "intellens-demo" ]] && die "Rotate INTELLENS_API_KEY away from intellens-demo"
[[ "${INTELLENS_AUTH_DEV_TOKENS:-}" == "1" || "${INTELLENS_AUTH_DEV_TOKENS:-}" == "true" ]] && die "INTELLENS_AUTH_DEV_TOKENS must be off in production"
[[ -z "${OIDC_CLIENT_SECRET:-}" && "${SSO:-}" == "true" ]] && die "SSO=true but OIDC_CLIENT_SECRET empty"
[[ -z "${INTELLENS_ABUSE_SECRET:-}" ]] && warn "Set INTELLENS_ABUSE_SECRET"
[[ -z "${SMTP_HOST:-}" ]] && warn "SMTP_HOST unset — verify/reset mail will stub"
[[ "${FORCE_HTTPS:-}" != "true" && "${FORCE_HTTPS:-}" != "1" ]] && warn "FORCE_HTTPS not set — enable behind public ALB"
[[ -z "${DATABASE_URL:-}" && "${USE_DB_AUTH:-}" != "1" && "${USE_POSTGRES_AUTH:-}" != "1" ]] && warn "No SQL auth backend configured"
[[ -z "${INTELLENS_FMP_API_KEY:-}${FMP_API_KEY:-}" ]] && warn "FMP key unset — market tape stays demo (set INTELLENS_FMP_API_KEY on ECS)"
[[ -z "${OPENAI_API_KEY:-}${INTELLENS_LLM_API_KEY:-}" ]] && warn "LLM key unset — extract/embeddings use local fallback"
[[ -z "${INTELLENS_PUBLIC_URL:-}" ]] && warn "INTELLENS_PUBLIC_URL unset — set https://citealpha.com on ECS"
[[ "${BILLING_DEMO:-}" == "1" || "${BILLING_DEMO:-}" == "true" ]] && warn "BILLING_DEMO is on — disable in production"
redir="${OIDC_REDIRECT_URI:-}"
if [[ "${SSO:-}" == "true" && -n "$redir" && "$redir" != https://* ]]; then
  die "SSO=true but OIDC_REDIRECT_URI is not HTTPS"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "Production secrets check failed"
  exit 1
fi
echo "Production secrets check OK (warnings may remain)"
