#!/usr/bin/env bash
# Deploy IntelLens GCI to AWS: single Fargate Spot task (API+web), public IP, no ALB.
# Local docker-compose remains untouched.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AWS_DIR="$ROOT/deploy/aws"
REGION="${AWS_REGION:-ap-south-1}"
TAG="${IMAGE_TAG:-latest}"

# Load optional secrets from .env into TF_VAR_* (never printed).
_load_tf_env() {
  local envf="$1"
  [[ -f "$envf" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    case "$line" in
      ""|\#*) continue ;;
    esac
    local key="${line%%=*}"
    local val="${line#*=}"
    val="${val%\"}"
    val="${val#\"}"
    [[ -n "$val" ]] || continue
    case "$key" in
      INTELLENS_FMP_API_KEY|FMP_API_KEY)
        [[ -z "${TF_VAR_fmp_api_key:-}" ]] && export TF_VAR_fmp_api_key="$val"
        ;;
      SSO)
        v="$(printf '%s' "$val" | tr '[:upper:]' '[:lower:]')"
        case "$v" in true|1|yes|on) export TF_VAR_sso_enabled=true ;; esac
        ;;
      OIDC_CLIENT_ID)
        [[ -z "${TF_VAR_oidc_client_id:-}" ]] && export TF_VAR_oidc_client_id="$val"
        ;;
      OIDC_CLIENT_SECRET)
        [[ -z "${TF_VAR_oidc_client_secret:-}" ]] && export TF_VAR_oidc_client_secret="$val"
        ;;
      OIDC_ISSUER)
        [[ -z "${TF_VAR_oidc_issuer:-}" ]] && export TF_VAR_oidc_issuer="$val"
        ;;
      OIDC_REDIRECT_URI)
        [[ -z "${TF_VAR_oidc_redirect_uri:-}" ]] && export TF_VAR_oidc_redirect_uri="$val"
        ;;
      ALPHAHUNTER_API_URL|FACTS_API_URL)
        [[ -z "${TF_VAR_alphahunter_api_url:-}" ]] && export TF_VAR_alphahunter_api_url="$val"
        ;;
      ALPHAHUNTER_API_KEY|FACTS_API_KEY)
        [[ -z "${TF_VAR_alphahunter_api_key:-}" ]] && export TF_VAR_alphahunter_api_key="$val"
        ;;
      CSM_EMAIL)
        [[ -z "${TF_VAR_csm_email:-}" ]] && export TF_VAR_csm_email="$val"
        ;;
    esac
  done < "$envf"
}
_load_tf_env "$ROOT/.env"
_load_tf_env "$ROOT/backend/.env"

if [[ -n "${TF_VAR_fmp_api_key:-}" ]]; then
  echo "== FMP key detected (wiring INTELLENS_FMP_API_KEY into ECS task) =="
else
  echo "== No FMP key — market tape stays demo_deterministic =="
fi
if [[ "${TF_VAR_sso_enabled:-}" == "true" ]]; then
  echo "== SSO=true (OIDC env will be wired if CLIENT_ID/ISSUER/REDIRECT set) =="
fi
if [[ -n "${TF_VAR_alphahunter_api_url:-}" ]]; then
  echo "== AlphaHunter live URL detected =="
fi

echo "== AWS identity =="
aws sts get-caller-identity --region "$REGION"

echo "== Terraform init/apply (ALB + ECS) =="
cd "$AWS_DIR"
terraform init -input=false
terraform apply -input=false -auto-approve

ECR_API="$(terraform output -raw ecr_api_url)"
ECR_WEB="$(terraform output -raw ecr_web_url)"
ACCOUNT_ID="$(terraform output -raw account_id)"
CLUSTER="$(terraform output -raw ecs_cluster_name)"
SERVICE="$(terraform output -raw ecs_service_name)"

echo "== ECR login =="
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

BUILD_OPTS=(--platform linux/amd64 --provenance=false --sbom=false)

echo "== Build & push API image =="
docker build "${BUILD_OPTS[@]}" -t "${ECR_API}:${TAG}" "$ROOT/backend"
docker push "${ECR_API}:${TAG}"

echo "== Build & push Web image (nginx -> localhost:8000) =="
docker build "${BUILD_OPTS[@]}" -f "$ROOT/frontend/Dockerfile.aws" -t "${ECR_WEB}:${TAG}" "$ROOT/frontend"
docker push "${ECR_WEB}:${TAG}"

echo "== Force ECS redeploy =="
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" \
  --service "$SERVICE" --force-new-deployment >/dev/null

echo "== Waiting for ALB /health =="
APP_URL="$(cd "$AWS_DIR" && echo "http://$(terraform output -raw alb_dns_name)")"
for i in $(seq 1 60); do
  if curl -sf "${APP_URL}/health" >/dev/null 2>&1; then
    echo "Healthy after ~$((i * 5))s via ALB"
    break
  fi
  sleep 5
  if [[ "$i" -eq 60 ]]; then
    echo "Timed out waiting for ALB /health — try task IP via aws-app-url fallback"
    exit 1
  fi
done

echo ""
echo "AWS deployment ready (static ALB DNS)"
echo "  App:      ${APP_URL}"
echo "  Package:  ${APP_URL}/package"
echo "  Health:   ${APP_URL}/health"
echo "  API docs: ${APP_URL}/docs"
echo "  Meta:     ${APP_URL}/api/meta"
curl -sf "${APP_URL}/api/meta" | python3 -m json.tool | head -20
