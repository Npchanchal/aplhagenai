#!/usr/bin/env bash
# Restore combined ECS service after aws-idle.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGION="${AWS_REGION:-ap-south-1}"
CLUSTER="${ECS_CLUSTER:-intellens-gci-aws}"
SERVICE="${ECS_SERVICE:-$CLUSTER-app}"
COUNT="${DESIRED_COUNT:-1}"

aws ecs update-service --region "$REGION" --cluster "$CLUSTER" \
  --service "$SERVICE" --desired-count "$COUNT" >/dev/null
echo "Woke ${SERVICE} -> desired ${COUNT}"

echo "Waiting for ALB health..."
for i in $(seq 1 40); do
  if APP_URL="$("$ROOT/scripts/aws-app-url.sh" 2>/dev/null)"; then
    if curl -sf "${APP_URL}/health" >/dev/null 2>&1; then
      echo "Healthy: ${APP_URL}"
      exit 0
    fi
  fi
  sleep 10
done
echo "Timed out - check ECS tasks / ALB target health"
exit 1
