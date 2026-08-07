---
name: intellens-aws
description: >-
  Deploys and operates IntelLens on AWS (ECS, ECR, ALB). Use when the user asks
  to deploy, wake, idle, or verify the cloud stack, or edits deploy/aws or
  scripts/aws-*.sh.
---

# IntelLens AWS

## Steps

1. Read `docs/kb/11-deploy-aws.md` and `docs/AWS_DEPLOYMENT.md`.
2. Prefer existing scripts: `aws-deploy.sh`, `aws-app-url.sh`, `aws-idle.sh`, `aws-wake.sh`.
3. After deploy: wait services stable → curl `/health` and `/api/meta`.
4. Confirm UI routes (`/`, `/desk`, `/research`) return 200.
5. Note costs in `docs/AWS_COST.md` if changing capacity.

## Safety

- No terraform destroy / force-push / hard reset unless user explicitly requests.
- Do not claim “live” before health checks pass.
