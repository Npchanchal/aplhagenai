# API Quickstart

Base URL: your deploy host (e.g. local `http://127.0.0.1:8080` or AWS ALB).

Auth: send header `X-API-Key: <your-key>` on write/admin routes. Demo key: `intellens-demo`.

## Core reads

```bash
# Health
curl -s "$BASE/health"

# Universe + scores
curl -s "$BASE/api/companies" | jq '.[0:3]'

# Company detail + evidence
curl -s "$BASE/api/companies/infy/gci" | jq '{name,gci_score,label_counts,outcomes:(.outcomes|length)}'

# Point-in-time history
curl -s "$BASE/api/companies/infy/gci/history"

# Alerts
curl -s "$BASE/api/alerts"

# Product meta / coverage note
curl -s "$BASE/api/meta"
```

## Analyst write paths

```bash
# Extract prototype
curl -s -X POST "$BASE/api/extract" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $KEY" \
  -d '{"company_id":"infy"}'

# Review outcome
curl -s -X POST "$BASE/api/review" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $KEY" \
  -d '{"company_id":"infy","outcome_index":0,"action":"accept"}'
```

## Enterprise shapes

```bash
# Org seats stub
curl -s "$BASE/api/orgs/demo-org"

# Vernacular blurb
curl -s "$BASE/api/vernacular/infy?lang=hi"

# Badge JSON / SVG
curl -s "$BASE/api/badge/INFY"
curl -s "$BASE/api/badge/INFY/svg" -o badge.svg

# EM factor export shape (honest series_kind)
curl -s "$BASE/api/export/em-factor/infy" | jq '{series_kind,citeable,contract_version}'

# PIT v1 contract (design-partner quant)
curl -s "$BASE/api/v1/pit/contract" | jq .
curl -s "$BASE/api/v1/pit/companies/infy/history" | jq '{series_kind,citeable,n:(.points|length)}'
curl -s "$BASE/api/v1/pit/bulk?ids=infy,tcs" | jq '.count'

# IC audit dossier (JSON / PDF)
curl -s -X POST "$BASE/api/reports/generate" \
  -H "Content-Type: application/json" -H "X-API-Key: $KEY" \
  -d '{"company_id":"infy","template_id":"ic_audit","format":"json"}' | jq '.citeable_count,.schema'

curl -s -X POST "$BASE/api/reports/generate" \
  -H "Content-Type: application/json" -H "X-API-Key: $KEY" \
  -d '{"company_id":"infy","template_id":"ic_audit","format":"pdf"}' -o ic-audit-infy.pdf

# Public citeable GCI rankings
curl -s "$BASE/api/public/gci-rankings?limit=10" | jq '{universe_n,top:(.top|length)}'

# Pilot checklist
curl -s "$BASE/api/orgs/demo/pilot-checklist" -H "X-API-Key: $KEY" | jq .progress

# Compliance note
curl -s "$BASE/api/compliance/sebi-note"
```

## Interactive docs

Open `$BASE/docs` (OpenAPI / Swagger UI) when the API container is reachable.

## Integration tips

1. Cache `/api/companies` for list views; refresh GCI detail on demand.
2. Prefer `data_quality == "hand_labeled"` **and** `citeable == true` for published / IC research.
3. Treat `pending` outcomes as non-scoring.
4. Store `as_of` from PIT history for backtests — do not use “today’s” score for past dates.
5. Respect `series_kind`: never backtest `demo_pit_extension` as production alpha; require `citeable_pit` in MSA feeds.
