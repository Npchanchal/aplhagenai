# User Stories — CiteAlpha GCI MVP

## US-001 — List companies
**As a** buy-side analyst  
**I want** to see covered companies with their GCI scores  
**So that** I can spot weak guidance track records quickly.

**Acceptance**
- Given the API is running with seed data  
- When I open the home page or `GET /api/companies`  
- Then I see multiple companies each with `id`, `name`, `ticker`, and `gci_score`

## US-002 — View company GCI detail
**As a** buy-side analyst  
**I want** to open a company and see score breakdown and evidence  
**So that** I can trust and audit the number.

**Acceptance**
- Given a valid company id  
- When I open its detail page or `GET /api/companies/{id}/gci`  
- Then I see overall score, metric breakdown, and a list of outcomes with guided vs actual

## US-003 — Evidence trail
**As a** sell-side associate  
**I want** each outcome to show guidance text and delta  
**So that** I can cite it in research.

**Acceptance**
- Given a company with ≥1 outcome  
- When I view the evidence table  
- Then each row includes period, metric, guided_value, actual_value, delta_pct, and guided_text

## US-004 — Deterministic scoring
**As a** product engineer  
**I want** GCI scoring to be pure and tested  
**So that** scores do not drift silently.

**Acceptance**
- Given fixed outcome fixtures  
- When `compute_company_gci` runs (default **v3**; legacy via `INTELLENS_GCI_VERSION=v2`)  
- Then the score matches the golden expected value in unit tests (`test_gci_scoring*.py`)

## US-005 — Health / deploy readiness
**As an** operator  
**I want** a health endpoint and containerized deploy  
**So that** I can run the stack locally and in CI.

**Acceptance**
- Given containers are up  
- When I `GET /health`  
- Then I receive `{"status":"ok"}` and the UI loads

## US-006 — Empty / edge company
**As a** system  
**I want** companies with no outcomes to return a clear empty state  
**So that** the UI does not crash.

**Acceptance**
- Given a company with zero outcomes  
- When GCI is requested  
- Then score is `null` or explicit `insufficient_data` and UI shows an empty message

---

## Portfolio SKUs (parallel products)

## US-P01 — Product catalog
**As a** prospect or desk lead  
**I want** to see CiteAlpha’s parallel product lines  
**So that** I can buy the job I need (not only GCI seats).

**Acceptance**
- Given the API is running  
- When I `GET /api/products` or open `/products`  
- Then I see Score, Cite, Radar, Ledger, and Data with status and endpoints

## US-P02 — Radar feed
**As a** portfolio manager  
**I want** a guidance change / miss / drop feed  
**So that** I catch accountability events without rereading every transcript.

**Acceptance**
- Given seeded outcomes and alerts  
- When I `GET /api/radar/feed`  
- Then I receive severity-ranked items with company, kind, and message (no trading signals)

## US-P03 — Promise ledger
**As a** compliance or credit analyst  
**I want** a company promise ledger  
**So that** I can audit what was promised vs delivered with sources.

**Acceptance**
- Given a valid company id  
- When I `GET /api/ledger/{id}`  
- Then I see closed outcomes and open promises with source fields and a factual disclaimer

## US-P04 — Data catalog
**As a** quant buyer  
**I want** a discoverable export catalog  
**So that** I know which PIT / factor endpoints to license.

**Acceptance**
- Given the API is running  
- When I `GET /api/data/catalog`  
- Then I see export ids, paths, and formats without invented actuals

## US-P05 — Guidance diff brief
**As a** portfolio manager  
**I want** QoQ guided band deltas on a company  
**So that** I see language/range changes without rereading transcripts.

**Acceptance**
- Given a valid company id  
- When I `GET /api/radar/diff/{id}`  
- Then I receive diffs with metric, periods, and band_delta when applicable

## US-P06 — Radar calendar & digest
**As a** desk lead  
**I want** a calendar of open promises and a digest preview  
**So that** the team can receive weekly Radar without opening Tracker.

**Acceptance**
- When I `GET /api/radar/calendar` then I see companies with open promises  
- When I `GET /api/radar/digest/preview` then I receive a factual email body  
- When `RADAR_DIGEST=0`, `POST /api/radar/digest/send` returns disabled

## US-P07 — Ledger PDF & IR Mirror
**As a** compliance analyst  
**I want** a downloadable ledger PDF and optional IR Mirror view  
**So that** I can ship board packs without the Score UI.

**Acceptance**
- With API key, `GET /api/ledger/{id}/pdf` returns application/pdf  
- With `IR_MIRROR=1`, mirror endpoint returns peer context and mirror copy

## US-P08 — Bulk data export & vernacular digest
**As a** quant / distributor  
**I want** bulk outcomes export and factual vernacular digests  
**So that** I can license Data and Cite SKUs separately.

**Acceptance**
- CSV export requires API key  
- Vernacular digest includes hi + en text and source links when available
