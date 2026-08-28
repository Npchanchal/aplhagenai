# Implementation Plan — Close B2B Gaps (stepwise)

Plan derived from [GAPS_VS_ALPHASENSE_BLOOMBERG.md](GAPS_VS_ALPHASENSE_BLOOMBERG.md).  
Goal: deepen **CiteAlpha GCI + Intellens Research** for India desks — not clone [AlphaSense](https://www.alpha-sense.com/) or Bloomberg Terminal.

**Status (2026-07-20):** Phases **0–8 implemented in codebase** (API v0.4.0). Production hardening (real LLM providers, OIDC, Cloudflare hostname) remains ops follow-up.

**Out of scope (never in this plan):** live quotes/OMS, Tegus-scale expert marketplace, B2C newsroom, Buy/Hold retail app.

---

## How to use this plan

- Each **Phase** has ordered **Steps**, **Owner skill**, **Exit criteria**, and **Tests**.
- Do not start Phase *N+1* until Phase *N* exit criteria pass (except noted parallel tracks).
- Ship behind feature flags where noted (`RESEARCH_LLM`, `CONSENSUS_IMPORT`, `SSO`).

---

## Phase 0 — Freeze scope & instrumentation (1 week)

| Step | Work | Exit |
|---|---|---|
| 0.1 | Confirm pitch: “Terminal for prices; Intellens for guidance delivery” | One-pager + Package page aligned |
| 0.2 | Tag every company `data_quality`: `hand_labeled` \| `demo_structured` | Visible in UI + `/api/meta` |
| 0.3 | Add product analytics stub: search queries, chat asks, GCI opens (log only) | Events in CloudWatch / local log |
| 0.4 | Stable customer URL decision: Cloudflare Tunnel **or** EIP IAM **or** cheap ALB | Written choice in `AWS_COST.md` |

**Exit:** Pilot customers see honest demo vs labeled; URL strategy chosen.

---

## Phase 1 — Data depth (Sensex labeling) (3–6 weeks)

*Closes the #1 trust gap vs any research platform.*

| Step | Work | Exit |
|---|---|---|
| 1.1 | Labeling playbook: IR table → band → actual → source URL → quote | Doc in `docs/` + Cursor skill |
| 1.2 | Hand-label next **10** Sensex names (→ 20/30) | `hand_labeled_count >= 20` in `/api/meta` |
| 1.3 | Each labeled outcome has `source_url` + `quote_span` | pytest coverage |
| 1.4 | UI badge: “Hand-labeled” vs “Demo” on list + detail | E2E check |
| 1.5 | Hand-label remaining **10** (→ 30/30) | `hand_labeled_count == 30` |
| 1.6 | Freeze demo generators for Sensex (no silent overwrite of labels) | Seed path guarded |

**Parallel (optional):** Nifty-50 shortlist for Phase 5.

**Exit:** Full Sensex-30 citation-ready for external notes.

---

## Phase 2 — Ingest pipeline (filings + concalls) (4–8 weeks)

*Makes Intellens Search real content, not a toy index.*

| Step | Work | Exit |
|---|---|---|
| 2.1 | Document store schema: `doc_id`, company, type, date, text, url, hash | Migration / JSON→SQLite or S3+index |
| 2.2 | Ingest adapters: (a) pasted transcript (b) PDF text (c) IR HTML fetch allowlist | 3 adapters + tests |
| 2.3 | Nightly/on-demand job: pull allowlisted IR pages for Sensex | ≥1 doc/company for top 10 |
| 2.4 | Wire Research Search to **document store** (not only outcomes) | Search returns real filings |
| 2.5 | Dedupe by content hash; retain version history | No duplicate spam in UI |
| 2.6 | Human review queue for new docs (Accept/Reject already exists — extend) | Reviewer can drop bad ingest |

**Exit:** Search over real India IR/transcript text for labeled names.

---

## Phase 3 — Extract & match at quality (4–6 weeks)

*Replaces heuristic extract; feeds GCI automatically.*

| Step | Work | Exit |
|---|---|---|
| 3.1 | LLM extract prompt: metric, band, period, speaker, quote offsets | Golden set ≥50 statements |
| 3.2 | Confidence + “needs_review” flag; default **not** auto-scored | Only accepted rows enter GCI |
| 3.3 | Match service: statement ↔ actual from results filings | Precision/recall logged |
| 3.4 | Analyst UI: extract → review → commit to outcomes | E2E path |
| 3.5 | Regression: Infosys official guidance-vs-actuals unchanged | Golden test |

**Exit:** New guidance can enter GCI via LLM+human, not only hand CSV.

---

## Phase 4 — Intellens Search & Chat (AI layer) (3–5 weeks)

*AlphaSense-like UX on **our** corpus only.*

| Step | Work | Exit |
|---|---|---|
| 4.1 | Embeddings index (e.g. OpenAI/Voyage + local fallback) over doc store | Semantic search API |
| 4.2 | Hybrid retrieval: keyword + vector; filter by company/type/date | Better than Phase 2 keyword |
| 4.3 | Chat: LLM answers **only** from retrieved chunks; refuse if empty | Mandatory citations in JSON |
| 4.4 | UI: citation click → highlight snippet + link to GCI outcome if linked | Research page updated |
| 4.5 | Eval harness: 30 India questions with expected cite IDs | ≥80% cite hit rate |
| 4.6 | Feature flag `RESEARCH_LLM`; heuristic remains fallback | Deploy safe |

**Exit:** Chat never invents numbers without a citation from our store.

---

## Phase 5 — Enterprise readiness (3–5 weeks)

*Required to convert Desk / One-Stop vs “demo IP”.*

| Step | Work | Exit |
|---|---|---|
| 5.1 | Multi-tenant orgs: org_id on keys, data isolation | Org A cannot read Org B reviews |
| 5.2 | SSO (OIDC: Google Workspace / Azure AD) | Pilot desk login without shared key |
| 5.3 | Roles: viewer / reviewer / admin | Enforced on review + ingest |
| 5.4 | Custom domain + TLS (Cloudflare or ACM) | `https://app.…` |
| 5.5 | Audit log: who accepted/rejected what | Exportable CSV |
| 5.6 | SLA dashboard: uptime, ingest lag | Shown to Enterprise |

**Exit:** Signed Desk order form can be fulfilled without demo caveats.

---

## Phase 6 — Estimates next to GCI (optional, 2–4 weeks)

*Bloomberg-adjacent without becoming Bloomberg.*

| Step | Work | Exit |
|---|---|---|
| 6.1 | Consensus import schema (CSV/API): ticker, period, metric, street value, as_of | Import endpoint |
| 6.2 | Replace synthetic street in `/api/research/estimates` when import present | UI shows “licensed/imported” vs “demo” |
| 6.3 | Chart: guidance band vs street vs actual vs GCI label | Desk tab |
| 6.4 | **Do not** ship live quotes; link “open in your terminal” only | Copy audited |

**Exit:** Estimates tab is honest and useful beside GCI.

---

## Phase 7 — Universe expansion (ongoing)

| Step | Work | Exit |
|---|---|---|
| 7.1 | Nifty-50 coverage plan + labeling capacity | SOW template |
| 7.2 | Sector GCI benchmarks (already stubbed — deepen) | Published sector pages |
| 7.3 | EM factor feed productionized (history, PIT, versioning) | 1 paying API pilot |

---

## Phase 8 — Light B2C-adjacent (only if compliant) (optional, later)

| Step | Work | Exit |
|---|---|---|
| 8.1 | Vernacular **factual** GCI blurbs (already stubbed) — polish | hi/ta/en quality bar |
| 8.2 | Broker badge (factual SVG) under One-Stop Year-2 | Legal sign-off |
| 8.3 | **No** news homepage, **no** tips, **no** retail portfolio | Counsel checklist |

---

## Stepwise timeline (illustrative)

```text
Week 0        Phase 0  scope + URL
Week 1–6      Phase 1  Sensex labeling (can overlap early Phase 2)
Week 3–10     Phase 2  ingest store
Week 8–14     Phase 3  LLM extract + review
Week 12–17    Phase 4  semantic search + cite-only chat
Week 14–19    Phase 5  SSO / tenant / HTTPS   ← start when first paid pilot looms
Week 18–22    Phase 6  consensus import (optional)
Week 20+      Phase 7  Nifty / API pilots
Later         Phase 8  vernacular / badge only
```

---

## Definition of done (program)

- [ ] Sensex-30 all `hand_labeled` with sources  
- [ ] Search/chat over real IR/transcript store with citations  
- [ ] LLM extract → human accept → GCI update path live  
- [ ] SSO + HTTPS customer URL  
- [ ] At least one Desk or API paid conversion  
- [ ] Explicit refusal of Terminal/newsroom scope in Package + sales FAQ  

---

## Tracking

| Artifact | Use |
|---|---|
| This file | Master stepwise plan |
| [GAPS_VS_ALPHASENSE_BLOOMBERG.md](GAPS_VS_ALPHASENSE_BLOOMBERG.md) | Why (competitive) |
| [GAPS_AND_ROADMAP.md](GAPS_AND_ROADMAP.md) | Historical G01–G23 |
| `/api/meta` | Runtime coverage counters |
| Customer Package `/package` | What we sell vs don’t |

**Suggested sprint cadence:** 2-week sprints; each sprint closes ≥1 Step with pytest + UI check + meta bump when counts change.
