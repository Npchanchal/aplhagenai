# AWS Deployment (separate from local Docker)

IntelLens GCI runs in **two environments**:

| Environment | How | URL |
|---|---|---|
| Local | `docker compose up` | http://127.0.0.1:8080 |
| **AWS** | Fargate Spot + **ALB** + ECR | `./scripts/aws-app-url.sh` (stable ALB DNS) |

## Architecture

```text
Internet → ALB :80 (stable DNS)
              → Task ENI :80
                 nginx (SPA + proxy /api|/health|/docs → 127.0.0.1:8000)
                 api (same Fargate task)
```

ALB DNS is stable across redeploys (share for review). Direct task public IP still works for ops.

## One-command deploy

```bash
chmod +x scripts/aws-*.sh
./scripts/aws-deploy.sh
# Share: $(./scripts/aws-app-url.sh)/package
```

## Idle / wake / destroy

```bash
./scripts/aws-idle.sh
./scripts/aws-wake.sh
cd deploy/aws && terraform destroy -auto-approve
```

## Secrets (FMP market tape)

Optional vendor prices (not GCI):

```bash
export INTELLENS_FMP_API_KEY=your_key   # or FMP_API_KEY
# local: copy .env.example → .env (gitignored)
```

ECS: add the same env var on the API task. Free FMP plans often allow US EOD (`AAPL`, `^GSPC`) but return 402 for India `.NS` — app falls back to demo series and stays honest in `history_kind` / notes.

## Cost

See [AWS_COST.md](AWS_COST.md). Spot + idle overnight ≈ cheapest demo posture.
