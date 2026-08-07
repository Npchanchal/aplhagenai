# Prompt — Full professional site (GCI · Desk · Research)

Copy everything below the line into Cursor (or another agent) when you want a full professional UI rebuild. Keep API contracts; redesign the product shell and the three primary surfaces.

---

## Role

You are a senior product designer + frontend engineer. Rebuild **IntelLens** into a **full professional institutional research site** for Indian equity desks. Ship production-quality React/TypeScript UI that feels like a credible sell-side / buy-side workbench — not a marketing landing page, not a generic SaaS dashboard.

## Brand & product

- **Brand:** IntelLens (wordmark: Intel + Lens accent)
- **Pitch:** Keep your market terminal for prices; use IntelLens for **guidance delivery**.
- **Core score:** Guidance Credibility Index (**GCI**) 0–100 — management guidance vs actuals, with an evidence trail.
- **Audience:** PMS / AIF / sell-side research / EM quant desks (India Sensex → Nifty path).
- **Compliance:** Factual product only. **Never** Buy / Hold / Sell. Always show a short SEBI-oriented disclaimer where scores or vernacular blurbs appear.
- **Do not** clone or name AlphaSense / Bloomberg as product features. Competitor names may appear only in internal docs, not in UI chrome.

## Scope — three primary products (nav)

Build one cohesive app shell with these three as first-class destinations (plus secondary Package / Help):

### 1. Guidance Credibility Index (`/` and `/companies/:id`)

Professional **Guidance Tracker** workbench:

- Universe table (Sensex-30): company, ticker, sector, **GCI level**, **Δ GCI (YoY/QoQ/PoP)**, data quality badge (Hand-labeled vs Demo), peer rank, sector avg.
- Alerts rail (misses, dropped guidance).
- Company detail as an **evidence-first dossier**:
  - Hero: name, ticker, sector, GCI + Δ, quality badge, peer context.
  - GCI trend with period levels **and** incremental changes.
  - Metric change trends (MoM / QoQ / YoY where series allow).
  - PIT history table with Δ.
  - Wordmap context (entity vs industry) clearly labeled as tone stub, not GCI math.
  - Vernacular blurb language switcher + factual disclaimer.
  - **Evidence trail** table: period, metric, band, actual, **Δ Actual**, label, delta vs guide, source, Accept/Reject.
  - Analyst extract action.

### 2. Desk (`/desk`) — One-Stop desk

Tabbed institutional desk for the One-Stop SKU capabilities:

| Tab | Job |
|-----|-----|
| Tracker | Jump into GCI coverage for a selected name |
| Evidence | Evidence table for selected company |
| API / PIT | PIT history + Δ, try API, link to OpenAPI `/docs` |
| AlphaHunter | Facts JSON import & merge UI |
| Wordmap | Entity vs industry themes |
| Vernacular | Lang blurbs + trust badge preview/embed |
| CSM | Org / seats / named CSM stub + contact |

Desk must feel like an **ops console for analysts**, not a settings page.

### 3. Research (`/research`) — Intellens Research Terminal

Professional research terminal with clear sub-modes:

- **Search** — primary-source document search with type chips, citations, company filter.
- **AI Chat** — cite-only answers; refuse when no evidence; show citations.
- **Desk snapshot** — quote tape (demo) + GCI + fundamentals as **level + MoM/QoQ/YoY**; estimates table with Δ Street / Δ Guide / Δ Actual; transcripts; link to GCI evidence.
- **News & filings** — chronological feed.
- **Watchlist** — last, MoM/QoQ/YoY, GCI, Δ GCI; click-through to desk snapshot.

**Design rule for all numbers:** absolute values are secondary; **incremental changes (MoM, QoQ, YoY, PoP)** are the primary desk signal. Always show both.

## Secondary surfaces (keep, elevate)

- `/package` — commercial One-Stop / Desk / API plans; CTA into Desk.
- `/help` — glossary + tooltips vocabulary (GCI, band, labels, PIT, MoM/QoQ/YoY, evidence).

## Technical constraints (must respect)

- Stack: existing **React 18 + TypeScript + Vite** frontend; FastAPI backend already running.
- Reuse existing APIs under `/api/*` (companies, gci, history, research/*, desk import, vernacular, badge, orgs). Do not invent fake endpoints without wiring them.
- Keep `X-API-Key: intellens-demo` for write paths.
- Preserve routes and SPA `try_files` behavior.
- Mobile: usable; desktop-first for desks (wide tables OK with horizontal scroll).
- Accessibility: keyboard nav, focus states, contrast for scores/Δ chips.
- Performance: no unnecessary re-fetch thrash; company switch should feel instant.

## Visual direction (professional, distinctive)

Apply these hard rules:

1. **One composition** per viewport — not a widget dashboard.
2. **Brand first** — IntelLens is a hero-level signal in the shell; product area names are clear but don’t overpower the brand.
3. **Typography:** expressive, purposeful fonts (not Inter / Roboto / Arial / system default stacks). Serif for brand/headings, refined sans for data.
4. **Atmosphere:** subtle paper/research texture or soft gradients — not flat white; not neon fintech glow.
5. **Avoid AI-default looks:** no purple-on-white, no cream+terracotta brochure, no broadsheet newspaper clone, no dark-mode-by-default, no glow, no pill spam, no emoji.
6. **Cards:** default no cards; use cards only for interactive containers. Prefer panels, rules, and typographic hierarchy.
7. **Data UI:** dense but calm tables; clear score colors (good / warn / bad); compact **Δ chips** labeled MoM/QoQ/YoY.
8. **Motion:** 2–3 intentional transitions (nav active, panel enter, score reveal) — presence, not noise.
9. **Color:** define CSS variables. Suggest a confident India-research palette (deep ink + restrained green/teal accent + warm paper ground) — refine, don’t copy the current MVP if you can improve it.
10. **Empty / demo honesty:** Hand-labeled vs Demo badges always visible; demo tape labeled as demo.

## Information architecture

```
IntelLens
├── Guidance Credibility Index   → Tracker + company dossier
├── Desk                         → One-Stop analyst console
├── Research                     → Search / Chat / Snapshot / News / Watch
├── Package                      → Commercial
└── Help                         → Glossary
```

Global header: brand left; primary nav right; optional subtle “Not investment advice” microcopy.

## Deliverables

1. Redesigned shell + the three primary surfaces (and Package/Help polish).
2. Shared components: `ChangeChip` / `ChangeTriple`, score pills, quality badges, evidence table, company picker, tab bars.
3. Responsive CSS with design tokens.
4. Wire all screens to existing APIs; no broken buttons.
5. Short note in PR/commit description: what changed visually + any API fields relied on.
6. `npm run build` green; backend tests still pass if you touch APIs.

## Explicit non-goals

- Live exchange feeds, OMS, portfolio, options.
- Buy/Hold/Sell or “stock tips.”
- Replacing Bloomberg / AlphaSense positioning in marketing copy inside the UI.
- B2C newsroom or retail app chrome.

## Acceptance criteria

- [ ] A buy-side analyst can screen Sensex GCI, open evidence, and cite a source in under 60 seconds.
- [ ] Every numeric parameter that has history shows **level + change trend**.
- [ ] Desk covers Tracker, Evidence, PIT/API, AlphaHunter, Wordmap, Vernacular, CSM without leaving `/desk`.
- [ ] Research Search/Chat/Desk/News/Watch all work and look like one product family.
- [ ] Brand test: remove the nav text — the first viewport still reads as IntelLens, not a generic template.
- [ ] Disclaimer visible on GCI and vernacular surfaces.
- [ ] Desktop and mobile both load cleanly.

## Starting point in this repo

- Frontend: `frontend/src/` (`App.tsx`, `pages/*`, `styles.css`, `lib/api.ts`)
- Product docs: `docs/PRODUCT_DEFINITION.md`, `docs/RESEARCH_TERMINAL.md`, `docs/customer/ONE_PAGER.md`
- APIs: `backend/app/api/routes.py`

Begin by auditing current pages, then implement the professional shell and the three surfaces end-to-end. Prefer refining the existing React app over a greenfield rewrite unless structure blocks quality.

---

## Optional one-liner (short form)

> Redesign IntelLens into a professional institutional site with three equal products — **Guidance Credibility Index** (tracker + evidence dossier), **Desk** (One-Stop console: PIT, AlphaHunter, Wordmap, vernacular, CSM), and **Research** (search, cite-only chat, desk snapshot, news, watchlist). Always show absolute levels **and** MoM/QoQ/YoY changes; factual GCI only, no Buy/Hold; distinctive research typography and paper atmosphere; keep existing FastAPI routes.
