#!/usr/bin/env bash
# Check custom-domain HTTPS cutover readiness (does not change DNS).
set -euo pipefail
fail=0
warn() { echo "WARN: $*"; }
ok() { echo "OK: $*"; }
die() { echo "FAIL: $*"; fail=1; }

DOMAIN="${INTELLENS_PUBLIC_DOMAIN:-citealpha.com}"
PUBLIC_URL="${INTELLENS_PUBLIC_URL:-}"
REDIRECT="${OIDC_REDIRECT_URI:-}"

echo "=== Domain cutover check ($DOMAIN) ==="

if [[ -n "$PUBLIC_URL" ]]; then
  if [[ "$PUBLIC_URL" == https://* ]]; then
    ok "INTELLENS_PUBLIC_URL is HTTPS ($PUBLIC_URL)"
  else
    die "INTELLENS_PUBLIC_URL must be https://… (got $PUBLIC_URL)"
  fi
else
  warn "INTELLENS_PUBLIC_URL unset — set after cutover"
fi

if [[ -n "$REDIRECT" ]]; then
  if [[ "$REDIRECT" == https://* ]]; then
    ok "OIDC_REDIRECT_URI is HTTPS"
  else
    die "OIDC_REDIRECT_URI must use https after cutover"
  fi
else
  warn "OIDC_REDIRECT_URI unset"
fi

[[ "${FORCE_HTTPS:-}" == "1" || "${FORCE_HTTPS:-}" == "true" ]] && ok "FORCE_HTTPS on" || warn "FORCE_HTTPS not set"
[[ "${ENABLE_HSTS:-}" == "1" || "${ENABLE_HSTS:-}" == "true" ]] && ok "ENABLE_HSTS on" || warn "ENABLE_HSTS not set"

if command -v dig >/dev/null 2>&1; then
  NS=$(dig +short NS "$DOMAIN" 2>/dev/null | tr '\n' ' ' || true)
  if echo "$NS" | grep -qi awsdns; then
    ok "Nameservers look like Route53 ($NS)"
  elif [[ -n "$NS" ]]; then
    warn "NS for $DOMAIN: $NS — expect awsdns-* after Hostinger→Route53 cutover (docs/DOMAIN_HTTPS.md)"
  else
    warn "Could not resolve NS for $DOMAIN"
  fi
else
  warn "dig not installed — skip NS probe"
fi

echo "Manual steps: docs/DOMAIN_HTTPS.md (Hostinger NS → Route53, then terraform apply)"
if [[ "$fail" -ne 0 ]]; then
  echo "Domain cutover check FAILED"
  exit 1
fi
echo "Domain cutover check OK (ops cutover may still be pending)"
