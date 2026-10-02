# Coverage & SLA

## Universe (current)

| Tier | Coverage | Data quality |
|---|---|---|
| Product default | Sensex-30 | Mix of `hand_labeled` and not-yet-scored listings |
| Scored set | Whatever the filing check has confirmed | Live counts on the homepage |
| Later | Nifty 500 + sector benchmarks | Not dated |

Always check `GET /api/meta` → `hand_labeled_count`, `data_quality_note`.

## Filing-to-score (W2.8)

A published score is updated **within 5 business days** of the results filing (India Monday–Friday; filing date = the actual's `as_of`). The clock starts on filings dated **on or after 29 September 2026**.

Observed median (live sample vs historical backfill) is on `/methodology` and `GET /api/meta` → `filing_to_score`. Historical Sensex rows were batch-reviewed on 29 September 2026; that pass is reported as backfill and is not the 5-day target.

Refresh records `filing_seen` when a new IR document lands; `accept_draft` records `review` → `publish`.

## Refresh

| Layer | Cadence |
|---|---|
| Seed / hand-labeled tables | Manual / batch on release |
| IR crawl + extract queue | Every 6 hours; a score still requires both quotes on the cited filings |
| Source-link verification | Nightly on live refresh (at most once per 24 h) |
| Alerts | Computed on request from current store |

## Availability

Uptime percentages are not published until 90 days of measured production. Hosted availability is currently best-effort. Any contracted uptime lives in the MSA, not on this page.

## Support (response aim, not a contracted SLA)

| Plan | Channel | Response aim (business hours IST) |
|---|---|---|
| Pilot | Email | 2 business days |
| Desk | Email + optional Slack | 1 business day |
| Enterprise | Named CSM + Slack | 4 hours Sev-1 |

## Severity

| Sev | Example |
|---|---|
| 1 | Workbench or API down for all users |
| 2 | Wrong score on hand_labeled name without evidence |
| 3 | UI polish / glossary / tooltip |

## Data retention

Review corpus and API access logs retained per customer DPA. Demo reset (`POST /api/admin/reset-demo`) is for shared demos only — not production customer tenants.
