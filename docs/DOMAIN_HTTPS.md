# Custom domain HTTPS — ocotilloinnovation.in

**Goal:** `https://ocotilloinnovation.in` → IntelLens ALB (`ap-south-1`).

**ALB (interim HTTP):** http://intellens-gci-aws-alb-697275376.ap-south-1.elb.amazonaws.com  

**ACM cert:** `PENDING_VALIDATION` until DNS below is authoritative.

---

## Recommended: point Hostinger nameservers → Route53

In **Hostinger** → Domains → `ocotilloinnovation.in` → Nameservers → **Change nameservers** to:

| Nameserver |
|---|
| `ns-1196.awsdns-21.org` |
| `ns-1793.awsdns-32.co.uk` |
| `ns-381.awsdns-47.com` |
| `ns-769.awsdns-32.net` |

(Confirm anytime: `cd deploy/aws && terraform output route53_nameservers`)

Then run:

```bash
cd deploy/aws
# loads domain_name from local terraform.tfvars
terraform apply -auto-approve
```

Terraform waits for ACM **ISSUED**, attaches HTTPS :443, creates A/ALIAS for apex + `www`.

**Public URL:** https://ocotilloinnovation.in  

---

## Alternative: keep Hostinger NS (add ACM CNAMEs there)

Add these **CNAME** records in Hostinger DNS (name may be without the trailing apex):

| Host / Name | Type | Value |
|---|---|---|
| `_6c7cf72f7b98725db18b4382e88edffc` | CNAME | `_d4fc932150ac9ec3a7215e00da0ed8f3.jkddzztszm.acm-validations.aws.` |
| `_e85f8227d09ad8e43bdf232453d65205.www` | CNAME | `_8ec1d3409fc453a3a89696f556cd7b65.jkddzztszm.acm-validations.aws.` |

When certificate status is **ISSUED**, either finish Route53 NS cutover (recommended) or set `acm_certificate_arn` and point Hostinger A/ALIAS/`www` CNAME at:

`intellens-gci-aws-alb-697275376.ap-south-1.elb.amazonaws.com`

---

## Verify

```bash
dig NS ocotilloinnovation.in +short
aws acm describe-certificate --region ap-south-1 \
  --certificate-arn arn:aws:acm:ap-south-1:334296257878:certificate/e9356930-7e30-48fb-87fc-44dd51c72cb2 \
  --query 'Certificate.Status'
curl -sfI https://ocotilloinnovation.in/health
```

Note: apex currently points at Shopify parking (`shops.myshopify.com`) — cutover replaces that with IntelLens.
