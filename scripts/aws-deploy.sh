#!/usr/bin/env bash
# Deploy IntelLens GCI to AWS: single Fargate Spot task (API+web), public IP, no ALB.
# Local docker-compose remains untouched.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AWS_DIR="$ROOT/deploy/aws"
REGION="${AWS_REGION:-ap-south-1}"
TAG="${IMAGE_TAG:-latest}"

# Load optional FMP key for India EOD (never printed).
if [[ -z "${TF_VAR_fmp_api_key:-}" ]]; then
  for envf in "$ROOT/.env" "$ROOT/backend/.env"; do
    if [[ -f "$envf" ]]; then
      # shellcheck disable=SC1090
      set -a
      # Only export FMP-related lines
      while IFS= read -r line; do
        case "$line" in
          INTELLENS_FMP_API_KEY=*|FMP_API_KEY=*)
            key="${line%%=*}"
            val="${line#*=}"
            val="${val%\"}"
            val="${val#\"}"
            if [[ -n "$val" ]]; then
              export TF_VAR_fmp_api_key="$val"
            fi
            ;;
        esac
      done < "$envf"
      set +a
    fi
  done
fi
if [[ -n "${TF_VAR_fmp_api_key:-}" ]]; then
  echo "== FMP key detected (wiring INTELLENS_FMP_API_KEY into ECS task) =="
else
  echo "== No FMP key — market tape stays demo_deterministic =="
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
