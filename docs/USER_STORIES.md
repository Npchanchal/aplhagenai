# User Stories — IntelLens GCI MVP

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
- When `compute_company_gci` runs  
- Then the score matches the golden expected value in unit tests

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
