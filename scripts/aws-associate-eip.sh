#!/usr/bin/env bash
# Associate the Terraform EIP with the running Fargate task ENI (static review URL).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGION="${AWS_REGION:-ap-south-1}"
CLUSTER="${ECS_CLUSTER:-intellens-gci-aws}"
SERVICE="${ECS_SERVICE:-$CLUSTER-app}"
AWS_DIR="$ROOT/deploy/aws"

ALLOC_ID="${EIP_ALLOCATION_ID:-}"
if [[ -z "$ALLOC_ID" ]]; then
  ALLOC_ID="$(cd "$AWS_DIR" && terraform output -raw eip_allocation_id 2>/dev/null || true)"
fi
if [[ -z "$ALLOC_ID" ]]; then
  echo "No EIP allocation id (run terraform apply in deploy/aws)" >&2
  exit 1
fi

TASK_ARN="$(aws ecs list-tasks --region "$REGION" --cluster "$CLUSTER" \
  --service-name "$SERVICE" --desired-status RUNNING \
  --query 'taskArns[0]' --output text)"
if [[ -z "$TASK_ARN" || "$TASK_ARN" == "None" ]]; then
  echo "No running task to associate EIP" >&2
  exit 1
fi

ENI="$(aws ecs describe-tasks --region "$REGION" --cluster "$CLUSTER" --tasks "$TASK_ARN" \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value|[0]' \
  --output text)"
if [[ -z "$ENI" || "$ENI" == "None" ]]; then
  echo "No ENI on task ${TASK_ARN}" >&2
  exit 1
fi

# Already associated to this ENI?
CUR_ENI="$(aws ec2 describe-addresses --region "$REGION" --allocation-ids "$ALLOC_ID" \
  --query 'Addresses[0].NetworkInterfaceId' --output text)"
if [[ "$CUR_ENI" == "$ENI" ]]; then
  IP="$(aws ec2 describe-addresses --region "$REGION" --allocation-ids "$ALLOC_ID" \
    --query 'Addresses[0].PublicIp' --output text)"
  echo "EIP already on ENI ${ENI}: http://${IP}"
  exit 0
fi

# Disassociate if stuck on an old ENI (idle/redeploy).
ASSOC="$(aws ec2 describe-addresses --region "$REGION" --allocation-ids "$ALLOC_ID" \
  --query 'Addresses[0].AssociationId' --output text)"
if [[ -n "$ASSOC" && "$ASSOC" != "None" ]]; then
  aws ec2 disassociate-address --region "$REGION" --association-id "$ASSOC" >/dev/null
  sleep 2
fi

aws ec2 associate-address --region "$REGION" \
  --allocation-id "$ALLOC_ID" --network-interface-id "$ENI" \
  --allow-reassociation >/dev/null

IP="$(aws ec2 describe-addresses --region "$REGION" --allocation-ids "$ALLOC_ID" \
  --query 'Addresses[0].PublicIp' --output text)"
echo "Associated EIP → http://${IP}"
