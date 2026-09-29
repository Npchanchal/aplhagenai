---
name: citealpha-expert-ux
description: >-
  Designs and rewrites CiteAlpha public surfaces (homepage, GCI Screener, company
  dossier, Public Snapshot, Package, Methodology) so a Head of Research, PM, analyst,
  IR officer or journalist understands each number in one read. Use when touching
  public pages, dossier layout, screener columns, alerts copy, package/pricing copy,
  metric names, tooltips, or when a reviewer calls copy "engineer-voiced".
---

# Expert-level UX for CiteAlpha

Target reader: a domain expert with 30 seconds. They will trust one clearly cited, dated number over ten panels. Rules: `frontend-ux`, `public-copy-voice`, `index-integrity`.

## Before coding

1. Read `docs/PLAN_WORLDCLASS_GCI.md` → workstream **W3 (dossier)** / **W4 (screener & snapshot)** / **W6 (copy)** for the acceptance criteria.
2. Grep the page's `en.json` keys; list every string a guest sees.
3. Decide what is **public** vs **Workbench-only** using the anatomy below. Move, don't delete.

## Public dossier anatomy (`/companies/:id`, guest)

| # | Panel | Must contain | Never |
|---|---|---|---|
| 1 | Header | Company, ticker, sector · **GCI** big · confidence tier chip · "Data as of dd Mon yyyy" · "Reviewed by analyst, dd Mon yyyy" · one-sentence record | WoW/MoM chips, peer rank vs a 97.6 sector avg, Watch star for guests |
| 2 | Delivery record | Chips: n met · n exceeded · n missed · n pending; per-metric mini-rows (metric display name, closed periods, metric score) | raw metric ids |
| 3 | Evidence table | Period · Metric · Guided band · Actual · Outcome · Points · **Promise source** · **Actual source** (both links, both dates, both quotes on expand) | `[85:{o.span_end}]`, doc hashes, "Run extract", "Accept/reject" |
| 4 | Revision trail | Opening band → in-year revisions → final; outcome vs final as context | "RESOLVED_EXCEEDED"-style enums |
| 5 | How this score is calculated | Same component as homepage (`example-calc`): per-metric score, weighting, deductions, pending excluded | formulas without the worked numbers |
| 6 | Footer links | Methodology · Changelog (this company's entries) · Cite this page (permalink + markdown) · Report an error · Disclaimer | Package upsell blocks |

Workbench-only (pilot seat): extract/review, Ledger PDF, IR mirror, Radar diff, PIT export, analytics (experimental), wordmap, vernacular, notes, IC dossier.

## Screener anatomy (`/tracker`)

Columns: ☆ · Company · Sector · **GCI** · **Tier** · Closed results (n) · Last filing (date) · Record (met/exceeded/missed mini-chips). Δ column only when citeable. Default filter: scored companies; toggle "show not-yet-scored". Unscored rows sort last. Kicker: "Covers Indian listed companies · Sensex scored · Nifty 50 in progress". No market dropdown for scaffold markets. Alerts: display names + guided vs reported numbers.

## Public Snapshot anatomy (`/rankings`)

Until ≥ 20 companies are `established`: a **delivery-record table** (company · tier · met/exceeded/missed · last filing), sorted by closed-results count, no "Top/Lowest". Each row badge + tier. Export CSV + permalink with as-of date.

## Copy rewrite procedure

1. Read the string aloud as a results-release sentence. If it names a system, a file, a flag, or a stage, rewrite.
2. Replace ids with `metricDisplayName()`; add units and the base of every %.
3. One ⓘ maximum where a definition is genuinely needed; link to `/methodology` otherwise.
4. Add the term to `test_public_copy_hygiene.py` banned list if it was jargon.

## Checklist

- [ ] Guest sees ≤ 6 panels on a dossier; each has a heading a PM would use
- [ ] Every number: unit, as-of, tier, source link
- [ ] No synthetic Δ / tape / analytics on public pages
- [ ] Unscored rows sort last; "Not yet scored" explains *why* (no analyst-reviewed guidance yet)
- [ ] Canonical names only; banned terms grep returns nothing
- [ ] Mobile 390 px: header + record readable without horizontal scroll; tables scroll
- [ ] E2E testids preserved (`company-table`, `evidence-table`, `gci-score`, `landing-worked-example`)
- [ ] `cd frontend && npm run build` and `e2e` for the touched route
