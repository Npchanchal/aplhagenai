# GCI corrections and restatement policy

**Public:** `/changelog` · **Internal:** score ledger (`backend/app/data/score_ledger.jsonl`)

A published GCI is an index level. It is never silently overwritten.

## When we restate

| Reason | Example |
|---|---|
| `data_correction` | Wrong actual, mis-read band, broken citation replaced |
| `new_filing` | Period closed; dual-cited row accepted |
| `methodology` | Algorithm or weighting change (`algorithm_id` bump) |
| `flag_change` | Analyst-set audit flag applied or removed |

## What happens the same day

1. Append a ledger row `(company_id, as_of, algorithm_id, dataset_version, gci, confidence_tier, reason)`.
2. Add a public `/changelog` entry with before/after and reason.
3. Licensees (when a feed is live) are emailed from the ledger delta.

## What we do not do

- Back-fill synthetic history.
- Rank companies below the Established threshold on the Public Snapshot.
- Change a number without a ledger row.

Linked from Methodology and Trust.
