# Coverage & SLA

## Universe (current)

| Tier | Coverage | Data quality |
|---|---|---|
| Product default | Sensex-30 | Mix of `hand_labeled` (~10) and `demo_structured` (remainder) |
| Roadmap | Nifty 500 + sector benchmarks | Labeling expansion |

Always check `GET /api/meta` → `hand_labeled_count`, `data_quality_note`.

## Refresh

| Layer | Cadence (MVP) |
|---|---|
| Seed / hand-labeled tables | Manual / batch on release |
| Extract prototype | On-demand API |
| Alerts | Computed on request from current store |
| Production NLP ingest | Phase 1+ (not live concall firehose yet) |

## Availability targets (illustrative — contract in Enterprise)

| Class | Target |
|---|---|
| Pilot / Desk hosted | 99.0% monthly (excludes planned maintenance) |
| Enterprise API | 99.5%+ with maintenance windows |

## Support

| Plan | Channel | Response (business hours IST) |
|---|---|---|
| Pilot | Email | &lt; 2 business days |
| Desk | Email + optional Slack | &lt; 1 business day |
| Enterprise | Named CSM + Slack | &lt; 4 hours Sev-1 |

## Severity

| Sev | Example |
|---|---|
| 1 | Workbench or API down for all users |
| 2 | Wrong score on hand_labeled name without evidence |
| 3 | UI polish / glossary / tooltip |

## Data retention

Review corpus and API access logs retained per customer DPA. Demo reset (`POST /api/admin/reset-demo`) is for shared demos only — not production customer tenants.
