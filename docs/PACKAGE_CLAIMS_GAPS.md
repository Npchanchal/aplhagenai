# Package Plans — claims vs product (audit + implementation plan)

**Audited:** 2026-08-07 · **Implemented:** 2026-08-07 (P0–P3 product gaps).

## Status (post-implementation)

| Area | Status |
|---|---|
| GCI + evidence + review | **Shipped** |
| Tier 1 corpus / citations | **Shipped** |
| Wordmap | **Shipped** — corpus themes + seed fallback (`source` / `citeable`) |
| MoM / QoQ / YoY | **Shipped** — prefers citeable PIT; warehouse labeled |
| Granger analytics | **Shipped** — prefers citeable ≥12; else `demo_pit_extension` |
| EM factor export | **Shipped** — JSON + CSV (+ Parquet/TSV fallback) |
| Facts / AlphaHunter import | **Shipped** — `/api/import/facts` + `/alphahunter` |
| Org seats / plan entitlements | **Shipped** — Pilot 5 / Desk 25 / One-Stop 40 |
| Soft API rate limits | **Shipped** — `RATE_LIMIT_RPM` (default 120) |
| SSO OIDC | **Shipped** — authorize/callback when env set; config_required otherwise |
| Labeling priority queue | **Shipped** — Desk tab + `/api/labeling/queue` |
| Research estimates | **Shipped** — no silent demo street (`ALLOW_DEMO_STREET`) |
| Charts / market tape | **Honest** — FMP when `INTELLENS_FMP_API_KEY` set on ECS; else demo |
| Nifty deep GCI | **Scaffold only** — API note forbids day-1 depth claim |
| HTTPS custom domain | **Ready** — set `acm_certificate_arn` in terraform |
| CSM / SLA / VPC / workshop | **Commercial-only** — see `docs/customer/MSA_CHECKLIST.md` |
| Git commit | **N/A here** — workspace has no `.git`; commit from your remote clone |

## Tests

`backend/tests/test_package_gaps.py` — `test_p11_*` … `test_p32_*`.

## Ops flags

| Env | Default | Meaning |
|---|---|---|
| `RATE_LIMIT_RPM` | 120 | Soft API rate limit |
| `SSO` | false | Enable SSO endpoints |
| `OIDC_CLIENT_ID` / `ISSUER` / `REDIRECT_URI` | — | Real OIDC |
| `OIDC_CLIENT_SECRET` | — | Token exchange |
| `OIDC_DEMO_ASSERT` | false | Test-only email → session |
| `ALLOW_DEMO_STREET` | false | Fabricated street consensus |
