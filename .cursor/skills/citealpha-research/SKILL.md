---
name: citealpha-research
description: >-
  Builds or fixes the CiteAlpha Research Terminal (search, cite-only chat,
  snapshot, news, watchlist). Use when working on /research, research APIs,
  or docs/RESEARCH_TERMINAL.md.
---

# CiteAlpha Research Terminal

## Steps

1. Read `docs/kb/07-research-terminal.md` and `docs/RESEARCH_TERMINAL.md`.
2. Backend changes in `backend/app/services/research.py` + routes.
3. Frontend: `ResearchPage.tsx` via `lib/api.ts`.
4. Chat must cite or refuse — never invent filings.
5. Label demo tape; show MoM/QoQ/YoY with levels.
6. `pytest` research-related tests + `npm run build`.

## Non-goals

Live OMS, expert marketplace clone, competitor feature naming in UI.
