# 14 — CiteAlpha Sights

Parallel SKU: India disclosure research OS at `/sights/*`.

## Rule

Own brands only. Public IR + CiteAlpha labels + licensed APIs we pay for. No competitor trademarks in UI. No unlicensed broker PDF firehose. No expert-call marketplace.

## Surfaces

| Path | Name |
|---|---|
| `/sights` | Hub |
| `/sights/search` | Sights Search |
| `/sights/ask` | Sights Ask |
| `/sights/boards` | Sights Boards |
| `/sights/themes` | Delivery Themes |
| `/sights/street` | Street Context |
| `/sights/field` | Field Evidence |
| `/sights/grid` | Compare Grid |
| `/sights/deep-dive` | Deep Dive |
| `/sights/fundamentals` | Fundamentals Strip |
| `/sights/agents` | Desk Agents |
| `/sights/export` | Cite Export |
| `/sights/settings` | Enterprise links |

## Legal-safe variants (internal — never put competitor names in UI)

| Market-intel job (category) | CiteAlpha Sights variant | Legal tweak |
|---|---|---|
| Generative Search–style Q&A | **Sights Ask** | Cite-only over *our* India IR; refuse if empty |
| Generative Grid–style comps | **Compare Grid** | Prompts × *our* companies/docs; cite cells |
| Deep multi-doc reports | **Deep Dive** | Multi-step cite synthesis; no invented actuals |
| Broker / Wall Street Insights library | **Street Context** | Public filings + consensus APIs we license — **no** broker PDF host/proxy |
| Expert Insights / Tegus network | **Field Evidence** | Hand-labeled guidance↔actuals + citations — **no** expert-call brokerage |
| Sentiment / theme OS | **Delivery Themes** | met/miss/drop/pending labels only |
| Smart synonyms | **Business Lexicon** | India IR synonym expand |
| Watchlists | **Sights Boards** | Watchlist + saved queries |
| Add-ins / connectors | **Cite Export** + **Notify Hooks** | MD/CSV/PDF + email/webhook first |

**Refuse forever (without counsel + written license):** competitor trademarks in chrome · unlicensed sell-side PDF corpus · expert-interview marketplace · “we replace [global market-intel OS]” · 500M+ doc claims · Buy/Hold.

## APIs

`/api/sights/meta`, `search`, `ask`, `themes`, `street/{id}`, `field/{id}`, `grid`, `deep-dive`, `fundamentals/{id}`, `agents`, `agents/run`, `hooks`, `export/{id}`, `enterprise`

Flags: `SIGHTS`, `SIGHTS_DEEP_DIVE`, `SIGHTS_GRID`, `SIGHTS_AGENTS`, `SIGHTS_WEB_ASSIST` (off by default).

## Related

- One-pager: `docs/customer/skus/SIGHTS.md`
- Portfolio: `docs/PRODUCT_PORTFOLIO.md`
- Cite Research Terminal remains `/research` (Cite SKU)
