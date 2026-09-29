# CiteAlpha — Architecture & Design

**Product:** CiteAlpha · **Entity:** Ocotillo Innovation Private Limited  
**Visibility:** internal doc only — not published on citealpha.com  
**Kb summary:** [`docs/kb/02-architecture.md`](kb/02-architecture.md)

Detailed design reference with diagrams. Prefer this over chat folklore when changing stack boundaries.

---

## 1. Product wedge

```mermaid
flowchart LR
  terminal[Market_terminal_prices]
  citealpha[CiteAlpha_GCI_delivery]
  desk[Equity_desk]
  desk --> terminal
  desk --> citealpha
```

| In scope | Out of scope |
|---|---|
| Guidance ↔ subsequent actual + evidence trail | Sentiment as the product |
| India Sensex → Nifty | US-first rebuild |
| HITL extract review | Invented actuals |
| Factual GCI 0–100 | Retail Buy / Hold / Sell |

---

## 2. System context

```mermaid
flowchart TB
  users[Desks_pilots_API]
  dns[Route53_citealpha.com]
  alb[ALB_HTTPS_ACM]
  ecs[ECS_Fargate_Spot]
  web[nginx_SPA]
  api[FastAPI]
  data[JSON_data_store]
  fmp[FMP_context_only]
  mail[Hostinger_mail_DNS]

  users --> dns --> alb --> ecs
  ecs --> web
  ecs --> api
  web -->|/api| api
  api --> data
  api -.-> fmp
  mail -.-> dns
```

---

## 3. Product surfaces

```mermaid
flowchart TB
  track["/tracker"]
  desk["/desk"]
  research["/research"]
  dossier["/companies/:id"]

  track --> dossier
  desk --> dossier
  research --> dossier
```

---

## 4. Request path

```mermaid
flowchart LR
  browser[Browser]
  apiTs[lib/api.ts]
  routes[routes.py]
  svc[services]
  core[gci_scoring_or_store]
  browser --> apiTs --> routes --> svc --> core
```

---

## 5. Application layers

```mermaid
flowchart TB
  ui[UI_pages_components]
  client[lib/api.ts]
  http[api/routes.py]
  services[services]
  pure[gci_scoring_pure]
  data[data_JSON]
  ui --> client --> http --> services
  services --> pure
  services --> data
```

| Layer | May | Must not |
|---|---|---|
| `gci_scoring.py` | Pure math | DB, HTTP, wall-clock |
| `repository.py` | I/O store | Scoring policy |
| `routes.py` | Auth, validation | Business formulas |
| `lib/api.ts` | Typed fetch | Ad-hoc fetch elsewhere |

---

## 6. Guidance pipeline

```mermaid
flowchart LR
  i[Ingest] --> e[Extract] --> r[Review] --> c[Commit] --> m[Match] --> s[Score] --> t[Cite]
```

Pending until Accept. Match key: `(company_id, period, metric)`.  
IR crawl never auto-scores into GCI. See [`04-pipeline.md`](kb/04-pipeline.md).

---

## 7. Scoring

```mermaid
flowchart LR
  o[Closed_outcomes] --> l[Labels] --> w[Weights_recency] --> g[GCI_0_100]
```

Default **v3**. Labels: met / exceeded / missed / dropped; pending & unmapped excluded.  
Audits: withdrawal −15, definition shift −10. Detail: [`03-scoring.md`](kb/03-scoring.md).

---

## 8. Auth

```mermaid
flowchart LR
  client[Client] --> creds[Session_or_API_key] --> rbac[RBAC] --> mut[Mutations]
```

Demo: `X-API-Key: intellens-demo`. Optional OIDC.

---

## 9. AWS

```mermaid
flowchart TB
  r53[Route53] --> alb[ALB]
  acm[ACM] --> alb
  alb --> ecs[ECS_Spot_0.5_1GB]
  ecr[ECR] --> ecs
  ecs --> logs[CloudWatch_7d]
```

No NAT. Idle: `scripts/aws-idle.sh`. Cost: `docs/AWS_COST.md`.

---

## 10. Repo map

```
backend/app/api|services|data|jobs
frontend/src/pages|components|lib/api.ts
deploy/aws · scripts · e2e · docs/kb
```

---

## 11. UX principles

Paper/ink/teal · Source Serif 4 + IBM Plex Sans · evidence-first dossier · quality badges · no Buy/Hold · SEBI disclaimer on score surfaces.  
[`06-frontend-ux.md`](kb/06-frontend-ux.md).

---

## 12. Non-negotiables

1. Every GCI point → guidance + actual (date, metric, source).  
2. No retail recommendations without SEBI RA review.  
3. India beachhead; export later via API.  
4. Honest `data_quality`; never invent actuals.
