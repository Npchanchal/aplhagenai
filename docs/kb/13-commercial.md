# 13 — Commercial

## Access tiers (how you buy)

| Plan | Role |
|---|---|
| Retail (B2C) | Individual micro-tenant · tracker/research |
| Pilot | Complimentary evaluation (B2B) |
| Desk | Seat ARR for research teams |
| Enterprise API | PIT / factor embed |
| One-Stop | Desk + API + AlphaHunter + Wordmap bundle |

## Job SKUs (what you buy)

| SKU | Role |
|---|---|
| Score | GCI + peers |
| Cite | Citations + Research |
| Radar | Change feed |
| Ledger | Promise dossier |
| Data | PIT / factor license |
| Sights | India disclosure research OS (`/sights`) |

Effective access is plan **intersect** role (never union). Tracker read is on every plan including guest. Research chat / Desk writes start at Pilot. Label workbench: One-Stop, or Desk/Enterprise **reviewer+**, or Pilot when `labeling_granted`. EM/Data file export: Enterprise / One-Stop. Partner feedback: Pilot+.

See `backend/app/services/entitlements.py` and `/package`.
Details: `docs/PRODUCT_PORTFOLIO.md`, `docs/customer/skus/`, `docs/customer/PRICING.md`, Package UI `/package`.
Multi-tenant + production gates: `docs/PRODUCTION_B2B_B2C.md`.

## Legal entity

CiteAlpha is a product of **Ocotillo Innovation Private Limited**.

## GTM

India PMS / AIF / sell-side / EM quant desks first; retail B2C as research tooling (not advice). See `docs/BUSINESS_PLAN.md` and `docs/MARKETING_PLAN.md` (SEO, blog, outbound).

## Do not

- Over-claim accuracy vs hand-labeled cohort size.
- Promise live exchange feeds or OMS in commercial copy.
- Sell Buy/Hold or sentiment dashboards as CiteAlpha SKUs.
