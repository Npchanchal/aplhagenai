#!/usr/bin/env bash
# Run after Hostinger NS point at Route53 zone Z02357723BV5SHKJM147J
# (ns-1337.awsdns-39.org ns-2040.awsdns-63.co.uk ns-454.awsdns-56.com ns-802.awsdns-36.net)
set -euo pipefail
export AWS_PROFILE="${AWS_PROFILE:-ocotillo}"
export AWS_REGION="${AWS_REGION:-ap-south-1}"
export AWS_DEFAULT_REGION="$AWS_REGION"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/deploy/aws"

echo "== Waiting for ACM ISSUED =="
CERT_ARN="$(terraform output -raw acm_certificate_arn_effective)"
for i in $(seq 1 60); do
  ST="$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --query Certificate.Status --output text)"
  echo "  $i: $ST"
  [[ "$ST" == "ISSUED" ]] && break
  # nudge validation resource
  if [[ "$i" -eq 1 || "$i" -eq 10 ]]; then
    terraform apply -input=false -auto-approve \
      -target=aws_acm_certificate_validation.app \
      -target=aws_lb_listener.https_managed \
      -target=aws_lb_listener_rule.www_to_apex_https_managed || true
  fi
  sleep 30
done

echo "== Full apply for HTTPS listeners =="
TF_FULL_APPLY=1 terraform apply -input=false -auto-approve

echo "== Verify =="
curl -sf "https://citealpha.com/health"
echo
curl -sf "https://citealpha.com/api/meta" | python3 -m json.tool | head -20
echo "HTTPS cutover complete"
