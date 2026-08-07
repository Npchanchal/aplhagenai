# 11 — Deploy & AWS

## Local

```bash
docker compose up --build -d
# API :8000 · web :8080 (or Vite :5173 in dev)
curl -sf http://127.0.0.1:8000/health
```

## AWS

- Stack: `deploy/aws/` (ECS Fargate Spot + ECR + **ALB**).
- Scripts: `aws-deploy.sh`, `aws-app-url.sh`, `aws-idle.sh`, `aws-wake.sh`.
- Region default historically `ap-south-1`.
- **Static review URL:** ALB DNS via `./scripts/aws-app-url.sh`.
- Package claims audit: `docs/PACKAGE_CLAIMS_GAPS.md`.
- Cost notes: `docs/AWS_COST.md`; procedure: `docs/AWS_DEPLOYMENT.md`.

## Rules

- Do not force-push or destroy infra unless explicitly requested.
- After web/API image push, wait for ECS stable before claiming live.
- Verify `/health`, `/api/meta`, and UI asset hash when checking deploys.

## Idle / wake

Use idle/wake scripts to control cost on non-prod; document URL changes if EIP/ALB shifts.
