# 06 — Frontend UX

## Surfaces

| Page | File | Job |
|---|---|---|
| Tracker | `HomePage.tsx` | Universe table first; search/sort; alerts rail |
| Dossier | `CompanyDetailPage.tsx` | **Evidence-first**; sticky TOC; toast on review |
| Desk | `DeskPage.tsx` | Sticky company + `?tab=` URL sync |
| Research | `ResearchPage.tsx` | Modes via `?tab=`; cite-only chat |
| Package / Help | `PackagePage`, `HelpPage` | Commercial + glossary search |

## Design rules (institutional)

1. One composition per viewport — not widget soup.
2. Brand **IntelLens** is a hero-level signal in the shell.
3. Fonts: Source Serif 4 + IBM Plex Sans (not Inter/Roboto defaults).
4. Paper/ink palette — no purple SaaS glow, no Buy/Hold chrome.
5. Cards only for interactive containers; prefer panels + typography.
6. Always show **level + Δ** (MoM/QoQ/YoY/PoP) when history exists.
7. Quality badges always visible (Hand-labeled vs Demo).
8. SEBI-oriented disclaimer on GCI and vernacular surfaces.

## Shared components

`EvidenceTable`, `ChangeChip`/`ChangeTriple`, `TabBar`, `CompanyPicker`, `QualityBadge`, `ScoreReveal`, `Toast`, `Skeleton`, `InfoTip`, `Disclaimer`.

## API

Only via `lib/api.ts`. Styles: `styles.css` design tokens.

## Prompt for rebuilds

`docs/prompts/PROFESSIONAL_SITE_PROMPT.md`
