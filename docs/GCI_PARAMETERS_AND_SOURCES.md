# GCI parameters & sources

## What GCI scores

Only **quantified management guidance vs delivery**: (company, period, metric) with guided band/point and actual (or pending/dropped).

Company GCI = weighted average of scored outcomes. Pending excluded. Wordmap/sentiment is **not** in the score.

## Parameter catalog (~16)

Stable IDs via `GET /api/metrics` (`backend/app/data/metric_catalog.py`).

| Family | Examples |
|--------|----------|
| Growth | `revenue_growth_pct`, `revenue_growth_cc_pct`, `ebitda_growth_pct` |
| Margin | `operating_margin_pct`, `ebitda_margin_pct`, `net_margin_pct` |
| Capital | `capex_guidance`, `fcf_guidance` |
| Sector | `nim_pct`, `loan_growth_pct`, volume KPIs, `arpu_growth_pct`, … |

Unknown metrics on extract/import → **400** unless `allow_custom=true` (experimental).

## Sources — in vs out

| In (text → GCI) | Out of GCI |
|-----------------|------------|
| Transcripts, filing PDF text, IR HTML, PPT text, press releases | Raw audio/video scoring |
| ASR **transcript** text (after speech-to-text) | Technicians / charts / RSI |
| Reported financials as **actuals only** | Forensic shenanigans engines |
| | Buy / Hold / Sell |

`POST /api/ingest/media` is a **stub**: accepts audio/video metadata and tells you to upload ASR text via `/api/ingest/text`.

`POST /api/actuals/import` fills `actual_value` on existing guidance rows — not a fundamentals score.

## Policy string

See `/api/meta.gci_source_policy` and `source_policy` object.
