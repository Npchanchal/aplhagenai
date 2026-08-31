#!/usr/bin/env bash
# Production go-live helper — verify live stack, ensure secrets, optional counsel attest.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="${INTELLENS_PUBLIC_URL:-https://citealpha.com}"
ENV_FILE="${INTELLENS_ENV_FILE:-$ROOT/.env}"

usage() {
  cat <<'EOF'
Usage: scripts/production-go-live.sh [command]

Commands:
  setup       Generate INTELLENS_API_KEY + INTELLENS_ABUSE_SECRET in .env if missing
  verify      Curl health/meta/legal + run local secret checks
  attest      Record counsel attestation (requires counsel sign-off + admin key in .env)
  deploy      Run scripts/aws-deploy.sh (build, terraform apply, ECS redeploy)
  all         setup → deploy → verify

Attest examples (after counsel signs Terms/Privacy):
  ATTESTED_BY=counsel@firm.com scripts/production-go-live.sh attest terms
  ATTESTED_BY=counsel@firm.com scripts/production-go-live.sh attest sebi   # retail only

EOF
}

_ensure_env_key() {
  local key="$1"
  local gen
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null && [[ -n "$(grep "^${key}=" "$ENV_FILE" | cut -d= -f2-)" ]]; then
    echo "OK: $key already set in $ENV_FILE"
    return 0
  fi
  gen="$(openssl rand -hex 24)"
  if [[ ! -f "$ENV_FILE" ]]; then
    touch "$ENV_FILE"
  fi
  echo "${key}=${gen}" >>"$ENV_FILE"
  echo "Created $key in $ENV_FILE (save a copy — needed for admin attest)"
}

cmd_setup() {
  _ensure_env_key INTELLENS_API_KEY
  _ensure_env_key INTELLENS_ABUSE_SECRET
  if ! grep -q '^USE_DB_AUTH=' "$ENV_FILE" 2>/dev/null; then
    echo 'USE_DB_AUTH=1' >>"$ENV_FILE"
    echo "Added USE_DB_AUTH=1"
  fi
  if ! grep -q '^AUTH_SQLITE_PATH=' "$ENV_FILE" 2>/dev/null; then
    echo 'AUTH_SQLITE_PATH=/data/auth.db' >>"$ENV_FILE"
    echo "Added AUTH_SQLITE_PATH=/data/auth.db"
  fi
  echo ""
  echo "Next: set real SMTP (Hostinger) in .env, then: scripts/production-go-live.sh deploy"
}

cmd_verify() {
  echo "=== Live checks ($API) ==="
  curl -sf "${API}/health" | python3 -m json.tool
  echo ""
  curl -sf "${API}/api/legal/meta" | python3 -m json.tool
  echo ""
  curl -sf "${API}/api/infra/postgres" | python3 -m json.tool
  echo ""
  python3 - <<'PY' "$API"
import json, sys, urllib.request
api = sys.argv[1]
meta = json.load(urllib.request.urlopen(f"{api}/api/meta", timeout=15))
infra = meta.get("infra", {}).get("postgres", {})
print("meta auth_backend:", infra.get("auth_backend"))
print("hand_labeled:", meta.get("hand_labeled_count"))
print("counsel:", meta.get("pending_depth", {}).get("conversion", {}).get("counsel_status"))
PY
  echo ""
  if [[ -f "$ROOT/scripts/check-production-secrets.sh" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE" 2>/dev/null || true
    set +a
    "$ROOT/scripts/check-production-secrets.sh" || true
  fi
  echo ""
  echo "Manual: confirm AWS SNS alarm subscription email (alarm_email in terraform.tfvars)"
  echo "Manual: switch SMTP from Mailtrap to Hostinger for real verify/reset mail"
}

cmd_attest() {
  local kind="${1:-terms}"
  local attested_by="${ATTESTED_BY:-}"
  local admin_key=""
  if [[ -f "$ENV_FILE" ]]; then
    admin_key="$(grep '^INTELLENS_API_KEY=' "$ENV_FILE" | cut -d= -f2- || true)"
  fi
  if [[ -z "$admin_key" ]]; then
    echo "FAIL: INTELLENS_API_KEY not in $ENV_FILE — run: scripts/production-go-live.sh setup"
    exit 1
  fi
  if [[ -z "$attested_by" ]]; then
    echo "FAIL: set ATTESTED_BY=counsel@firm.com (counsel must have signed Terms/Privacy offline)"
    exit 1
  fi
  case "$kind" in
    terms|terms_privacy) api_kind="terms_privacy" ;;
    sebi|sebi_retail) api_kind="sebi_retail" ;;
    *) echo "Unknown kind: $kind (use terms|sebi)"; exit 1 ;;
  esac
  echo "Attesting kind=$api_kind attested_by=$attested_by on $API"
  curl -sf -X POST "${API}/api/legal/attest" \
    -H "X-API-Key: ${admin_key}" \
    -H "Content-Type: application/json" \
    -d "{\"kind\":\"${api_kind}\",\"attested_by\":\"${attested_by}\"}" | python3 -m json.tool
  echo ""
  curl -sf "${API}/api/legal/meta" | python3 -m json.tool
}

cmd_deploy() {
  "$ROOT/scripts/aws-deploy.sh"
}

CMD="${1:-verify}"
case "$CMD" in
  setup) cmd_setup ;;
  verify) cmd_verify ;;
  attest) cmd_attest "${2:-terms}" ;;
  deploy) cmd_deploy ;;
  all)
    cmd_setup
    cmd_deploy
    cmd_verify
    ;;
  -h|--help|help) usage ;;
  *) usage; exit 1 ;;
esac
