#!/usr/bin/env bash
# Scale combined ECS service to 0 (stops Fargate billing).
# EIP stays allocated (~\$3.65/mo if unassociated) so review URL stays reserved.
set -euo pipefail
REGION="${AWS_REGION:-ap-south-1}"
CLUSTER="${ECS_CLUSTER:-intellens-gci-aws}"
SERVICE="${ECS_SERVICE:-$CLUSTER-app}"

aws ecs update-service --region "$REGION" --cluster "$CLUSTER" \
  --service "$SERVICE" --desired-count 0 >/dev/null
echo "Idled ${SERVICE} -> desired 0 (Fargate ~\$0 while idle; EIP may still bill if unassociated)"
