# Pending depth — implementation report (updated 2026-08-21)

**Plan:** [`PENDING_DEPTH_PLAN.md`](./PENDING_DEPTH_PLAN.md) · gap close: Desk corpus / consensus / SSO / billing readiness  
**API:** `GET /api/ops/pending-depth` · `POST /api/ops/pending-depth/bootstrap` · `GET /api/ops/corpus-coverage` · `GET /api/meta` → `pending_depth`  
**Version:** API meta `0.5.2+`

---

## Summary

| Step | Item | Code status | Live / human |
|---|---|---|---|
| S1 | Real LLM extract | Shipped; TF wires `OPENAI_API_KEY` | Needs key on ECS |
| S2 | Embeddings Research | Shipped; auto when keyed | Needs key on ECS |
| S3 | HTTPS / domain | TF `force_https` + `INTELLENS_PUBLIC_URL` | Hostinger NS lock |
| S4 | OIDC readiness | Desk CSM checklist + `/trust` | IdP registration |
| S5 | Nifty M2 queue | Done + Desk filter | M3/M4 hand_labels |
| S6 | Corpus depth Desk | Coverage + crawl + Accept/Reject | Analyst accept volume |
| S7 | PIT citeable | Prefer citeable | — |
| S8 | Consensus import UX | Demo-gated sample + Desk import | Licensed street |
| S9 | Pilot → MSA | `from_pilot` + billing page path | Counsel / PSP |
| — | Billing demo gate | Rejects `upi-demo` unless `BILLING_DEMO=1` | Razorpay later |

**Honesty:** Scaffold ≠ institutional bar. Coverage rate, labels, and secrets remain the debt.

## Desk surfaces (2026-08-21)

- **Corpus** — coverage metrics, dry/live crawl, pending doc Accept/Reject, pending-depth bootstrap  
- **Facts import** — consensus JSON + sample fixture (`sample_import`, `?demo=true`)  
- **Labeling** — Nifty filter via `nifty_extra_ids` + milestones  
- **CSM** — SSO checklist  
- **Billing** — Pilot→Desk MSA; retail confirm honesty (`BILLING_DEMO`)  
- **Trust** — SSO + LLM configured flags (`LLM_CONFIGURED`)
