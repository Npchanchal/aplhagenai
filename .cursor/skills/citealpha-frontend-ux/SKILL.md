---
name: citealpha-frontend-ux
description: >-
  Implements and polishes CiteAlpha institutional UI (Tracker, Desk, Research,
  dossier). Use when changing pages, styles, UX, evidence-first layout, tabs,
  toasts, mobile nav, or professional site redesigns.
---

# CiteAlpha Frontend UX

## Before coding

1. Read `docs/kb/06-frontend-ux.md` and `docs/prompts/PROFESSIONAL_SITE_PROMPT.md`.
2. Keep API access in `frontend/src/lib/api.ts` only.

## Workflow

1. Match existing tokens in `styles.css` (ink / teal / paper).
2. Preserve testids used by E2E (`company-table`, `evidence-table`, `gci-score`, …).
3. Desk/Research: `?tab=` URL sync; sticky picker when multi-tab.
4. Dossier: evidence near top; sticky TOC; Toast for review/extract.
5. Run `cd frontend && npm run build`.

## Checklist

- [ ] Level + Δ shown where history exists
- [ ] Quality badge visible
- [ ] Disclaimer on GCI / vernacular
- [ ] No Buy/Hold chrome
- [ ] Mobile nav usable
