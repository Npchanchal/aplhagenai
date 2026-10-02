# 06 — Frontend UX

## Surfaces

| Page | File | Job |
|---|---|---|
| GCI Screener (`/tracker`) | `HomePage.tsx` | Universe table first; search/sort; alerts rail |
| Dossier | `CompanyDetailPage.tsx` | **Evidence-first**; sticky TOC; toast on review |
| Analyst Workbench (`/desk`) | `DeskPage.tsx` + `DeskConsole.tsx` | Sticky company + `?tab=` · **Console** = multi-pane GCI terminal |
| Filing Search (`/research`) | `ResearchPage.tsx` | Modes via `?tab=`; cite-only chat |
| Package / Help | `PackagePage`, `HelpPage` | Commercial + operator hub (tours, glossary, source policy) |
| About / Trust | `AboutPage`, `TrustPage` | Company story · procurement posture |
| Nav | `NavMenu.tsx` | Top: GCI Screener · Analyst Workbench · Filing Search · Disclosure Explorer (overview, search, ask, boards, themes, street, field, grid, deep dive, fundamentals, agents, export) · More (products, plans, billing, tiers, desks, blog, methodology, changelog, about, help, Public Snapshot, Trust) |
| Blog | `BlogIndexPage`, `BlogPostPage` | SEO research articles (`/blog`) |

## Design rules (institutional)

1. One composition per viewport — not widget soup.
2. Brand **CiteAlpha** is a hero-level mark in the shell.
3. Fonts: Source Serif 4 + IBM Plex Sans (not Inter/Roboto defaults).
4. Paper/ink palette — no purple SaaS glow, no Buy/Hold chrome.
5. Cards only for interactive containers; prefer panels + typography.
6. Always show **level + Δ** (MoM/QoQ/YoY/PoP) when history exists.
7. Quality badges always visible (Hand-labeled vs Demo).
8. SEBI-oriented disclaimer on GCI and vernacular surfaces.

## Shared components

`EvidenceTable`, `ChangeChip`/`ChangeTriple`, `TabBar`, `CompanyPicker`, `QualityBadge`, `ScoreReveal`, `Toast`, `Skeleton`, `InfoTip`, `Disclaimer`, `CitationCard`, `SourceViewer` (citation click → highlighted document).

## API

Only via `lib/api.ts`. Styles: `styles.css` design tokens.

## Prompt for rebuilds

`docs/prompts/PROFESSIONAL_SITE_PROMPT.md`
