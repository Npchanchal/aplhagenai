# 03 — GCI Scoring

## Definition

Company GCI = **confidence-weighted average** of scored closed outcomes. Range **0–100**. Higher = better historical delivery vs stated guidance.

## Labels

| Label | Meaning | Score behavior |
|---|---|---|
| `met` | Actual in band | 100 |
| `exceeded` | Beat above band | High (≥85), **not** a miss |
| `missed` | Below band | Decays with relative shortfall; ≥50% shortfall → 0 |
| `dropped` | Stopped reiterating | Fixed mid-low ≈ **35** (distinct from miss) |
| `pending` | Period open | **Excluded** from company average |

## Bands

Prefer `guided_low`–`guided_high`. Midpoint-only guidance is weaker; vague text → lower **confidence weight** (0.5–1.0), not silent zero.

## Invariants

- Deterministic: same inputs → same score.
- Pure function in `backend/app/services/gci_scoring.py` — no I/O.
- Outcomes should carry `source_url` / `source_ref` / `quote_span` when available.
- Threads: `thread_id` groups raise/lower/reiterate history.

## Tests

Edge cases in `backend/tests/` — empty, all-miss, all-beat, mixed, vague, dropped, pending excluded. Gap tests `test_g06`… in `test_gaps.py`.

## Do not

- Treat beats as misses.
- Score pending into the average.
- Invent actuals to “fill” a demo.
