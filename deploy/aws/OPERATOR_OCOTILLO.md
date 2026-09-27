# OcotilloInnovation AWS (operator notes)

- **Account:** `884686184601`
- **Profile:** `ocotillo` (`AWS_PROFILE=ocotillo`)
- **Region:** `ap-south-1`
- **Domain:** `citealpha.com` (Route53 zone `Z02357723BV5SHKJM147J`)
- **ALB:** `intellens-gci-aws-alb-1856066055.ap-south-1.elb.amazonaws.com`
- **ECS:** cluster `intellens-gci-aws` / service `intellens-gci-aws-app`

## Hostinger NS (required for ACM/HTTPS)

See `HOSTINGER_NS_CUTOVER.txt`. Until registrar NS match the zone above, public DNS for `citealpha.com` SERVFAILs (old-account NS are dead) and ACM stays `PENDING_VALIDATION`.

## After Hostinger NS cutover

```bash
export AWS_PROFILE=ocotillo
./scripts/aws-finish-https-cutover.sh
# or wait for background ns-cutover waiter (deploy/aws/ns-cutover-wait.log)
curl -sf https://citealpha.com/health
curl -sf https://citealpha.com/api/meta | head
```

The exposed IAM key was deactivated/deleted; profile `ocotillo` uses a new key.

Do not commit `terraform.tfvars`, state, or credentials.
