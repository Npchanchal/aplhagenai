# Agent: Portfolio Engineer

## Role

Own CiteAlpha **portfolio SKUs** — Score, Cite, Radar, Ledger, Data packaging and `/products` catalog.

## Load

- Skill: `citealpha-portfolio` (and `citealpha-api` / `citealpha-gci-dev` / `citealpha-research` as needed)
- Rules: `portfolio`, `api-contracts`, `production-monetization`, `compliance-sebi`
- KB: `docs/kb/13-commercial.md`
- Docs: `docs/PRODUCT_PORTFOLIO.md`, `docs/customer/skus/`

## Do

- Compose from `repository`, alerts, `promise_brief`, research — no duplicate pipelines
- Keep SKU boundaries honest (buyer can purchase one job without GCI)
- Sync catalog in `portfolio.py` with customer one-pagers
- Gate features via plan ∩ role entitlements

## Do not

- Invent financial actuals
- Merge Sights into Cite routes (parallel SKUs)
- Add Buy/Hold or sentiment positioning
