# CiteAlpha — Production go-live checklist

**Site:** https://citealpha.com  
**Entity:** Ocotillo Innovation Private Limited  
**Verified:** 2026-08-23 (live HTTPS + ECS `ap-south-1`)

## Verdict (executive)

| Audience | Ready? | Notes |
|---|---|---|
| **Public marketing / soft demo** | **Conditional YES** | HTTPS live, Tracker/Desk reachable, SEBI meta disclaimer present, retail paywall gated off |
| **Paying B2B design partners** | **NO — close blockers first** | JSON auth on Spot (ephemeral), counsel unsigned, SMTP unset, secrets in plaintext task env, no alarms/backups |
| **B2C retail customers** | **NO** | `counsel_status=scaffold_pending_counsel_signoff`, `retail_marketing_allowed=false`, SEBI retail pending |

**Bottom line:** citealpha.com is a **live pilot / preview**, not a durable production customer platform yet.

---

## How to re-verify

```bash
# Live surface
curl -sS https://citealpha.com/health
curl -sS https://citealpha.com/api/meta | python3 -m json.tool | head
curl -sS https://citealpha.com/api/legal/meta | python3 -m json.tool

# Local env templates (does not read ECS)
./scripts/check-domain-cutover.sh
./scripts/check-production-secrets.sh   # needs prod env exported
```

---

## A. DNS / TLS / edge

| # | Check | Pass criteria | Status 2026-08-23 |
|---|---|---|---|
| A1 | Apex resolves | A records → ALB | **PASS** `13.235.234.28`, `13.234.252.226` |
| A2 | NS on Route 53 | `awsdns-*` | **PASS** |
| A3 | ACM certificate | ISSUED for apex+www | **PASS** (valid → 2027-03-05) |
| A4 | HTTPS 443 | ALB HTTPS listener | **PASS** |
| A5 | HTTP→HTTPS | 301 to https | **PASS** |
| A6 | HSTS | `Strict-Transport-Security` | **PASS** `max-age=31536000; includeSubDomains; preload` |
| A7 | www | Serves / redirects | **PASS** HTTP/2 200 |
| A8 | Mail MX | Hostinger MX if using Hostinger mail | **PASS** mx1/mx2.hostinger.com |
| A9 | CSP | Content-Security-Policy present | **PASS in code** (API middleware + SPA nginx allow GTM/GA/Plausible; scripts still consent-gated). Re-verify live ALB after deploy |

---

## B. Availability / compute

| # | Check | Pass criteria | Status |
|---|---|---|---|
| B1 | ECS service ACTIVE | desired=running | **PASS** 1/1, rollout COMPLETED |
| B2 | Target healthy | ALB TG healthy | **PASS** |
| B3 | `/health` | `{"status":"ok"}` | **PASS** v0.5.2 |
| B4 | Container health check | ECS healthCheck on :8000 | **PASS** |
| B5 | Capacity resilience | Not Spot-only for paid SLA | **FAIL** Fargate Spot only (interruptible) |
| B6 | Durable volume | EFS/bind for auth + JSON data | **FAIL** no volumes / no EFS |
| B7 | CloudWatch alarms | ALB 5xx / unhealthy host | **FAIL** none found |
| B8 | Backups scheduled | `backup-intellens.sh` / snapshots | **FAIL** not evidenced on AWS |

---

## C. Security / secrets

| # | Check | Pass criteria | Status |
|---|---|---|---|
| C1 | `FORCE_HTTPS` / `ENABLE_HSTS` | true on task | **PASS** |
| C2 | `INTELLENS_PUBLIC_URL` | https://citealpha.com | **PASS** |
| C3 | API keys in Secrets Manager | not plaintext task `environment` | **FAIL** FMP + LLM keys in plain env |
| C4 | Rotate demo write key | `INTELLENS_API_KEY` ≠ `intellens-demo` | **WARN** key not set on task (defaults unknown); demo rejected for legal attest (403) |
| C5 | `INTELLENS_AUTH_DEV_TOKENS` off | unset/false | **PASS** (unset) |
| C6 | Security headers | nosniff, DENY frame, referrer, CSP | **PASS in code** (live re-verify after deploy) |
| C7 | Abuse challenge | `/api/auth/abuse-challenge` works | **PASS** |

**Action:** Move vendor keys to Secrets Manager/SSM and **rotate** any keys that have appeared in task-definition describes or logs.

---

## D. Auth / tenancy / mail

| # | Check | Pass criteria | Status |
|---|---|---|---|
| D1 | SQL auth backend | Postgres or durable SQLite on volume | **FAIL** `auth_backend=json`, postgres not configured |
| D2 | Session durability | Survives task recycle | **FAIL** ephemeral task FS |
| D3 | SMTP for verify/reset | `SMTP_HOST` set | **FAIL** unset on task |
| D4 | SSO (if sold) | `pending_depth.sso.production_ready` | **N/A / FAIL** SSO=false, not configured |
| D5 | Org invite / revoke | Manual pilot OK without SSO | **WARN** code shipped; not fully ops-verified live |

---

## E. Legal / compliance / claims

| # | Check | Pass criteria | Status |
|---|---|---|---|
| E1 | Terms/Privacy counsel | `counsel_status=counsel_approved` | **FAIL** `scaffold_pending_counsel_signoff` |
| E2 | SEBI retail gate | Attest before retail marketing | **PASS gate** `retail_marketing_allowed=false` |
| E3 | Public “not advice” copy | Meta / landing | **PASS** |
| E4 | No Buy/Hold/Sell claims | Package / pitch hygiene | **WARN** re-check marketing before ads |
| E5 | Honest data quality | Cite hand_labeled only externally | **PASS messaging** in `/api/meta` — enforce in sales |

Attest when counsel signs (admin key):

```bash
curl -X POST https://citealpha.com/api/legal/attest \
  -H "X-API-Key: $ADMIN_KEY" -H "Content-Type: application/json" \
  -d '{"kind":"terms_privacy","attested_by":"counsel@…"}'
# retail only after SEBI counsel:
# {"kind":"sebi_retail","attested_by":"…"}
```

---

## F. Product / data honesty

| # | Check | Pass criteria | Status |
|---|---|---|---|
| F1 | Sensex hand_labeled | ≥20 (target 30) | **PASS** 30/40 hand_labeled |
| F2 | Remaining demo_structured | Prefer 0 for external cite | **WARN** 10 demo_structured |
| F3 | India universe cache | Scores present | **PASS** 5053 scored (mostly provisional) |
| F4 | Citeability | Provisional ≠ external cite | **WARN** sales must say provisional |
| F5 | FMP configured | Market tape non-demo when possible | **PASS** `fmp_configured=true` |
| F6 | GCI algorithm | v3 live | **PASS** |
| F7 | Alerts API | Returns structured alerts | **PASS** |
| F8 | Core SPA routes | /, /tracker, /about, /trust, legal | **PASS** 200 |
| F9 | Nifty depth milestones | M2+ done if selling Nifty depth | **FAIL** M2–M4 open |

---

## G. Billing / monetization

| # | Check | Pass criteria | Status |
|---|---|---|---|
| G1 | Retail checkout ungated only after SEBI | Currently gated | **PASS** (correctly blocked) |
| G2 | `BILLING_DEMO` off | Not stub-confirm in prod | **WARN** unset (confirm not defaulting on) |
| G3 | MSA / e-sign path | For B2B invoices | **WARN** endpoint exists; not end-to-end verified |
| G4 | UPI / payment provider live keys | Real PSP | **FAIL** not verified |

---

## H. Go / no-go matrix

### Soft-launch (pilot) — allowed if all true

- [x] HTTPS + health OK  
- [x] Retail marketing remains off  
- [x] Customers told: Sensex hand_labeled citeable; rest provisional  
- [x] No SLA / no guaranteed uptime (Spot)  
- [ ] Written pilot MSA + counsel-reviewed Terms accepted offline  

### Full production (paying customers) — required before “good to go”

- [ ] Counsel attest Terms/Privacy  
- [ ] Durable auth (Postgres or SQLite on EFS) + backup script in cron  
- [ ] Secrets Manager for API keys; rotate exposed keys  
- [ ] SMTP live (verify + reset)  
- [ ] Mixed capacity (Fargate base + Spot) or reserved  
- [ ] CloudWatch alarms + on-call  
- [ ] Payment path verified (B2B MSA and/or retail after SEBI)  
- [ ] CSP + API key rotation confirmed  

---

## Verified live snapshot (2026-08-23)

| Signal | Value |
|---|---|
| Health | `ok` · version `0.5.2` |
| GCI | v3 · Sensex cohort 40 (30 hand_labeled) · universe 5053 |
| Legal | counsel pending · retail marketing **false** |
| Auth | JSON · no Postgres |
| Infra | ECS 1×0.5 vCPU / 1 GB Spot · ALB HTTPS · ACM ISSUED |
| SSO | disabled |

---

## Related docs

- `docs/PRODUCTION_B2B_B2C.md`  
- `docs/INFRA_PRODUCTION.md`  
- `docs/DOMAIN_HTTPS.md`  
- `docs/PACKAGE_CLAIMS_GAPS.md`  
- `.env.production.example`  
