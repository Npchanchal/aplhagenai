# AWS cost profile — CiteAlpha GCI (`deploy/aws`)

## Architecture (minimized)

| Resource | Config | Notes |
|---|---|---|
| **ALB** | internet-facing HTTP | Stable review DNS (~$16–22/mo) |
| **No EIP** | default off | Fargate ENI AssociateAddress blocked in this account |
| ECS Fargate ×1 | **0.5 vCPU / 1 GB** Spot | Combined API + nginx |
| ECR ×2 | lifecycle keep 3 | |
| CloudWatch Logs | 7 days | |
| EFS (auth.db) | minimal | ~$0.30/GB-mo when `enable_auth_efs` on |
| NAT | none | Public subnet |

## Ballpark monthly (ap-south-1)

| Mode | Approx |
|---|---|
| Spot task 24/7 + ALB | **~$25–35** |
| Idle (`aws-idle.sh`) | ALB still bills (~$16–22); Fargate ~$0 |
| `terraform destroy` | **~$0** |

## Stable review URL

**Shipped:** Application Load Balancer DNS — stable across redeploys.

```bash
./scripts/aws-deploy.sh
./scripts/aws-app-url.sh
# → http://intellens-gci-aws-alb-….ap-south-1.elb.amazonaws.com
```

| Option | Status |
|---|---|
| ALB DNS | **Live** for review sharing |
| Cloudflare Tunnel | Optional later (HTTPS + custom hostname) |
| EIP on Fargate ENI | Does not work here (AuthFailure) |

## Ops

```bash
./scripts/aws-deploy.sh
./scripts/aws-idle.sh
./scripts/aws-wake.sh
cd deploy/aws && terraform destroy -auto-approve
```
