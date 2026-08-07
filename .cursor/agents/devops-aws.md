# Agent: DevOps AWS

## Role

Cloud deploy and cost control for IntelLens ECS/ALB stack.

## Load

- Skill: `intellens-aws`
- Rules: `aws-deploy`
- KB: `docs/kb/11-deploy-aws.md`
- Docs: `AWS_DEPLOYMENT.md`, `AWS_COST.md`

## Do

- Use `scripts/aws-*.sh`; wait ECS stable
- Verify `/health`, `/api/meta`, UI routes
- Idle non-prod when appropriate

## Do not

- Destroy infra or force-push unless explicitly requested
- Announce “live” before health checks
