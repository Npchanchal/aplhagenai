#!/usr/bin/env bash
# Print stable review URL (ALB DNS), else reachable task public IP.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGION="${AWS_REGION:-ap-south-1}"
CLUSTER="${ECS_CLUSTER:-intellens-gci-aws}"
SERVICE="${ECS_SERVICE:-$CLUSTER-app}"
AWS_DIR="$ROOT/deploy/aws"

if ALB="$(cd "$AWS_DIR" && terraform output -raw alb_dns_name 2>/dev/null)"; then
  if [[ -n "$ALB" && "$ALB" != "None" ]]; then
    echo "http://${ALB}"
    exit 0
  fi
fi

TASK_ARN="$(aws ecs list-tasks --region "$REGION" --cluster "$CLUSTER" \
  --service-name "$SERVICE" --desired-status RUNNING \
  --query 'taskArns[0]' --output text)"
if [[ -z "$TASK_ARN" || "$TASK_ARN" == "None" ]]; then
  echo "No running task" >&2
  exit 1
fi

ENI="$(aws ecs describe-tasks --region "$REGION" --cluster "$CLUSTER" --tasks "$TASK_ARN" \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value|[0]' \
  --output text)"
IP="$(aws ec2 describe-network-interfaces --region "$REGION" --network-interface-ids "$ENI" \
  --query 'NetworkInterfaces[0].Association.PublicIp' --output text)"
if [[ -z "$IP" || "$IP" == "None" ]]; then
  echo "No public IP on ENI ${ENI}" >&2
  exit 1
fi

echo "http://${IP}"
