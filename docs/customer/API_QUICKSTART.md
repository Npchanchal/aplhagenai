# API Quickstart

Base URL: your deploy host (local `http://127.0.0.1:8080` or `https://citealpha.com`).

Public reads under `/api/v1` do not need a key. `GET /openapi.json` lists that contract only (40 paths or fewer). Auth, billing, labeling, and ops routes still run; they are not in the public spec.

Python and TypeScript clients: `sdk/`. Changelog RSS: `GET /api/v1/index/changelog.rss`. Weekly ledger email: set `INTELLENS_LEDGER_DIGEST_TO` and run `python -m app.jobs.ledger_digest`.

## Core reads

```bash
curl -s "$BASE/health"
curl -s "$BASE/api/meta"
curl -s "$BASE/api/v1/companies" | jq '.[0:3]'
curl -s "$BASE/api/v1/companies/infy/gci" | jq '{name,gci_score,confidence_tier,as_of}'
curl -s "$BASE/api/v1/companies/infy/gci/history"
curl -s "$BASE/api/v1/rankings" | jq '{universe_n}'
curl -s "$BASE/api/public/gci-rankings?limit=10" | jq '{universe_n}'
curl -s "$BASE/api/v1/index/ledger?company_id=infy" | jq '{count}'
curl -s "$BASE/api/v1/index/changelog" | jq '{count}'
curl -s "$BASE/api/v1/index/changelog.rss"
curl -s "$BASE/api/v1/index/files" | jq '{count,latest:(.files[-1])}'
curl -s "$BASE/api/v1/index/digest" | jq '{move_count,subject}'
curl -s "$BASE/api/compliance/sebi-note"
```

Frozen files (`gci_levels_YYYYMMDD.csv`, `.parquet`, `.sha256`) download from `/api/v1/index/files/{name}`. When `INTELLENS_INDEX_S3_BUCKET` is set, the same objects are uploaded under the `index/` prefix.

## Interactive docs

Open `$BASE/docs` for the public OpenAPI spec, or the site page `/developers`.
