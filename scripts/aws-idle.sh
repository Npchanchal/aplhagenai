#!/usr/bin/env bash
# Scale combined ECS service to 0 (stops Fargate billing).
# Production stays on-demand (W8.6). This script refuses unless you opt in.
# EIP stays allocated (~\$3.65/mo if unassociated) so a review URL stays reserved.
set -euo pipefail
if [[ "${CITEALPHA_ALLOW_IDLE:-}" != "1" ]]; then
  echo "Refusing to idle. Production Fargate stays running." >&2
  echo "Set CITEALPHA_ALLOW_IDLE=1 only for a non-production review stack." >&2
  exit 1
fi
REGION="${AWS_REGION:-ap-south-1}"
CLUSTER="${ECS_CLUSTER:-intellens-gci-aws}"
SERVICE="${ECS_SERVICE:-$CLUSTER-app}"

aws ecs update-service --region "$REGION" --cluster "$CLUSTER" \
  --service "$SERVICE" --desired-count 0 >/dev/null
echo "Idled ${SERVICE} -> desired 0 (Fargate ~\$0 while idle; EIP may still bill if unassociated)"
