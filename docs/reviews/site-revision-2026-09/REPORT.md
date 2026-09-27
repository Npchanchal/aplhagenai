# CiteAlpha — Response to the Site Revision Proposal

**Prepared for:** the reviewer of *"CiteAlpha — Site Revision Proposal" (as of 25 Sep 2026)*
**Status as of:** 27 Sep 2026 · all changes below are live on [citealpha.com](https://citealpha.com)
**Screenshots:** captured from production on 27 Sep 2026 at 1280 px desktop width

---

## 1. Summary

We accepted the proposal's central call. The homepage is now a **category-definition + proof page** whose job is to earn a "show me more" from a Head of Research, not to explain five products.

- **Every P0 item is done**: the worked example, coverage precision, PIT/API claims and a single primary call to action.
- **Every P1 item is done**: descriptors under each surface, a methodology strip and a persona routing line.
- **P2** is partly done: the full IA restructure is live; the onboarding walkthrough and the snapshot-vs-screener polish are deferred (section 6).

Three things went beyond the proposal:
1. **We found why the page read as it did.** Crawlers, link previews and AI tools see a static HTML version of the homepage, not the interactive React page, and the two had drifted apart. The review text matches that static version (for example the bare `/api/meta` link). Both versions now carry identical content.
2. **The worked example exposed a scoring problem.** With real Infosys data, a large beat of guidance scored about 1 point out of 100. We changed the methodology (scorer v4, section 5) so large beats are treated as imprecise guidance, not as failure.
3. **The copy rules are now enforced automatically.** A test in the suite fails if recommendation language or the retired claims come back into public copy.

![Full homepage](00-homepage-full.png)

*Figure 0. The revised homepage, top to bottom (full-page capture).*

---

## 2. The page order: before and after

| # | Before | After (live) |
|---|---|---|
| 1 | Descriptive H1 ("Guidance Credibility Index for Indian equity desks") | **Claim H1** + one primary CTA + persona routing |
| 2 | Five equal product cards (Tracker, Desk, Research, Sights, Rankings) | **Worked example**: Infosys, real data, cited |
| 3 | Five paragraphs explaining GCI | **Short definition** + outcome chips |
| 4 | "Live cohort" counts linking to `/api/meta` | **How we build a score** (methodology strip) |
| 5 | Pilot form | **Coverage today**: precise, including PIT/API status |
| 6 | Trust list | Pilot form (the conversion point) |
| 7 | Footer incl. bare `API meta` link | Product surfaces, **demoted**, with one-line descriptors |
| 8 | — | FAQ, trust links, disclaimer |

This follows the proposal's order ("hook + worked example → definition → methodology/trust → CTA → surfaces → footer"). The one difference is that coverage sits directly above the pilot form, because a desk decides whether to ask for a pilot based on coverage.

---

## 3. Item-by-item response

### P0 — before showing to any institutional prospect

| Proposal item | Status | Where |
|---|---|---|
| Add worked example with visible citations | **Done**, using real data instead of a mock-up | §4.2 |
| Fix coverage-claim precision (Sensex-30 vs Nifty framing) | **Done** | §4.5 |
| Confirm PIT/API claims match actual build state | **Done**, plus an API bug fix | §4.5 |
| Single primary CTA (pilot request), not five equal links | **Done** | §4.1 |

### P1 — before wider demo circulation

| Proposal item | Status | Where |
|---|---|---|
| Rename Desk/Sights/Research, **or** add one-line function descriptors | **Descriptors added**, names kept | §4.6 |
| Build the methodology/trust strip | **Done** | §4.4 |
| Add persona-based routing line under the hero | **Done** | §4.1 |

### P2 — once the core loop is validated

| Proposal item | Status | Where |
|---|---|---|
| Full IA restructure (surfaces demoted) | **Done** | §2, §4.6 |
| Onboarding walkthrough for Desk/Workbench | **Deferred**; existing guided tours were only reworded | §6 |
| Public snapshot vs full screener polish | **Deferred** | §6 |

### Content, trust and compliance items outside the P-list

| Proposal item | Status | Where |
|---|---|---|
| H1 as a claim, not a description | **Done** | §4.1 |
| Definition in 2–3 sentences; taxonomy as chips | **Done** | §4.3 |
| Surface "point-in-time" and "API access" as their own line | **Done** | §4.5 |
| Move "Not investment advice" out of trust-building copy | **Done** | §4.7 |
| Cut or substantiate platform-scale language ("OS") | **Cut everywhere** | §4.7 |
| `/api/meta` in the footer reads as a dev artifact | **Removed** from public pages | §4.7 |
| "No recommendation chrome" enforced beyond Rankings | **Done, and enforced by a test** | §4.8 |

---

## 4. What changed, section by section

### 4.1 Hero: a claim, one primary action, persona routing

![Hero](01-hero.png)

*Figure 1. Hero section (live).*

- **H1 is now the proposal's suggested claim:** "Did management deliver on what they promised? We check." The page title and meta description stay descriptive for search engines, as the review suggested.
- **The primary CTA** "See a scored company" opens a real evidence trail (Infosys). The secondary CTA is "Request a pilot".
  - We chose "see the proof" as the first action because the proposal frames the page's job as proof. The pilot request stays one click away and has its own section further down.
- **Persona routing line:** "Built for: Buy-side · Sell-side research · Quant / data · IR & compliance". Each persona links to its own pathway on the Products page. This is the lightweight version of the proposal's "three separate journeys".
- **The lede no longer ends with a disclaimer.** It is two sentences: what GCI compares, and that every score opens to its source.

> **Before:** *"Guidance Credibility Index for Indian equity desks"* followed by a lede ending *"…Factual research tooling — not investment advice."* and five equal links.

### 4.2 Worked example: real data, visible citations, above the definition

![Worked example](02-worked-example.png)

*Figure 2. Worked example (live). Every row links to the company's published guidance-vs-actuals page.*

The proposal supplied a mock-up and asked us to "swap in an actual tracked name before publishing". We went straight to a real one:

- **Company and metric:** Infosys Ltd., full-year revenue growth guidance in constant currency, FY22 to FY26.
- **Each row shows** the guided band, the reported actual, the outcome as a coloured chip (not a plain word), the points that row contributed, and a clickable source with the date reported.
- **Data is live**, not hard-coded. The card reads the same production API as the company dossier, so it cannot drift from what a user sees on the evidence trail.
- **Placement:** directly above the definition, as proposed (proof before definition).
- **A "Why doesn't a big beat score 100?" note** explains the one row a sceptical reader will question (section 5).
- **Link through:** "Open the full Infosys Ltd. evidence trail →" goes to the full dossier.

![Infosys dossier](08-infy-dossier.png)

*Figure 3. The dossier the worked example links to (live).*

### 4.3 Definition: shortened, with the taxonomy as chips

![Definition and outcome chips](03-definition.png)

*Figure 4. Short definition and outcome chips (live).*

- **The definition went from five paragraphs to two sentences:** "GCI is a 0–100 score of how closely a company's reported results matched its own quantified guidance — revenue bands, margins, volumes, capex. It tracks delivery, not sentiment or share price."
- **Outcome labels are chips:** met, exceeded, missed, dropped and pending, in the same colours used on the example rows and the dossier. Each chip has an ⓘ tooltip with its precise meaning, so the prose is gone but the detail is one tap away.

### 4.4 Methodology strip: "How we build a score"

![Methodology strip](04-methodology.png)

*Figure 5. Methodology strip (live).*

This covers the four points the proposal asked for:

| Proposal asked for | What the strip says |
|---|---|
| Data sources | NSE and BSE filings, company IR decks and guidance tables, earnings-call transcripts |
| What counts as guidance (formal vs informal) | A number or range for a named metric and period. Qualitative commentary is marked *unmapped* and left out of the score |
| Verification process | An analyst reviews every extracted row; each row keeps the quote, document link and date |
| Update latency, filing → score | Scores change **after a new filing is reviewed, not automatically**. We deliberately state this as a process rather than a number of days, because we have no measured SLA to publish yet |

The strip also names the scorer version (`gci_scoring_v4`), which is read live from the API. It links to the full methodology and to NSE, BSE and SEBI.

### 4.5 Coverage honesty, and PIT/API stated plainly

![Coverage today](05-coverage.png)

*Figure 6. Coverage panel (live counts from production).*

The proposal's concern was that "Sensex and Nifty" read as more than we have. The panel now says exactly what each tier is, and whether it is meant for citation:

- **43 companies hand-labeled with cited evidence (Sensex depth).** These are the only rows meant for citation.
- **10 companies with demo-structured data** (including early Nifty names): useful for walkthroughs, not for citation.
- **5,049 NSE/BSE listings** are browsable with provisional scores built from placeholder outcomes. The panel says "Not for citation" in so many words.
- **Nifty 50 hand-labeling is in progress.** Names move into the first line only after analyst review. We did not publish a target quarter because we won't commit to a date we can't back.
- **Point-in-time API (pit.v1):** available to design partners. Every point is as-of stamped and flagged citeable or not. The panel also admits that most hand-labeled names have only one or two scored periods so far, which is the qualifying or disqualifying detail a quant desk needs.

Every count is read live from production, so the panel can't go stale.

**PIT build-state check (proposal: "confirm PIT/API claims match actual build state").** While checking, we found the PIT API was under-counting citeable outcomes compared with the company dossier. That is exactly the kind of mismatch the review warned about.
- **Fix:** the API now counts from the same enriched outcomes the dossier uses. Infosys, for example, reports 8 citeable outcomes on both.
- **Guard:** a regression test now compares the dossier, PIT history and PIT bulk endpoints.

The retired phrasings are gone everywhere, including the static HTML, the page metadata and `llms.txt`:
- "Sensex → Nifty names" (implied Nifty was already covered)
- "Screen Sensex → Nifty names by guidance credibility"

### 4.6 Product surfaces: demoted, with one-line descriptors

![Explore the product](06-surfaces.png)

*Figure 7. Product surfaces, now a secondary section near the bottom (live).*

- **Position:** the surfaces moved from the top of the page to a secondary "Explore the product" section after the pilot form.
- **Descriptors, not renames.** The proposal offered either. We kept the names and gave each a literal descriptor of what you do there:

| Surface | Descriptor (live) |
|---|---|
| GCI Tracker | Screen covered companies by GCI score and change, with quality badges on every row. |
| Research | Search one company's filings and transcripts. Answers only when a source can be cited. |
| Sights | Compare disclosures across companies — themes, boards, and grids with cite-only answers. |
| Rankings | Public GCI snapshot by sector. No recommendation labels. |

- **Desk was removed from the homepage.** It is the paid review workspace, not a first-visit destination, and its old descriptor ("Ops console — review queue, corpus, PIT/API, reports, and CSM") implied PIT was part of a shipped workspace. In navigation and the glossary it is now "Desk (review & export workspace)", and the "CSM" jargon is gone.
- **Research vs Sights overlap:** the descriptors now separate them: *one company at a time* (Research) vs *across companies* (Sights).

**Navigation fix found during testing.** On desktop, hovering over "Sights" opened its menu, and the natural click that followed closed it again. This is fixed, and the menu now stays open on click:

![Sights menu](07-nav-sights-open.png)

*Figure 8. Sights menu open after a click (live).*

### 4.7 Disclaimer placement, "OS" language and the `/api/meta` link

- **Disclaimer:** "Not investment advice" no longer sits inside trust-building copy (the hero lede and pilot lede). It lives in three places:
  - a small persistent header badge (visible in Figure 8)
  - the site footer: "factual research product, not investment advice. No Buy / Hold / Sell."
  - a one-line footnote under the pilot form
- **"OS" and similar platform-scale language are cut** from the homepage, the Sights pages and help text, the glossary, the guided tours, page metadata and `llms.txt`. Sights is now described by what it does: "Compare Indian Company Disclosures".
- **The `/api/meta` link is removed** from all public pages, including the static HTML where the reviewer saw it. Machine-readable coverage counts remain available to integrators, labelled "Coverage counts (JSON)" in `llms.txt`, not as a footer link beside Packages and Pilot.

### 4.8 "No recommendation chrome", enforced across the product

The proposal warned that one stray "avoid this stock"-style phrase anywhere undermines the non-RA position. We made that rule executable:

- **A copy-hygiene test** (`backend/tests/test_public_copy_hygiene.py`) scans all public copy and fails on recommendation phrasing, while still allowing negations such as "not Buy/Hold/Sell". The copy it scans:
  - UI strings
  - page metadata
  - the glossary
  - guided tours
  - blog posts
  - the static HTML
  - `llms.txt`
- **The same test blocks the retired claims:** "Sensex → Nifty names", "research OS" and the `/api/meta` footer link.
- **It also pins the static worked-example lines to the backend data**, so the crawler version of the example can't drift from the real numbers.
- **Alarm-style labels were softened** on the Tracker, dossier and Products pages:
  - Severity pills now read "large change / change / note" instead of "high / medium / low".
  - The dossier heading "Red alerts" is now "Guidance flags".

### 4.9 Subpages (the proposal suggested auditing them with the same lens)

We did not do a full subpage audit, but we fixed the claims the same lens catches:
- **Tracker:** H1 "GCI Tracker: Sensex Guidance Credibility Scores", with text that says which scores are provisional.
- **Sights:** H1 "CiteAlpha Sights — Compare Indian Company Disclosures" (no "OS").
- **Blog:** one post that implied full Nifty coverage now says "hand-labeled Sensex companies … (other listings are provisional)".

---

## 5. Methodology change prompted by the worked example (scorer v4)

Publishing a real worked example surfaced something a mock-up would have hidden. Under the previous scorer (v3), a **large beat** decayed toward zero, exactly like a large miss:

| Infosys row | Guided | Actual | Outcome | v3 points | **v4 points (live)** |
|---|---|---|---|---|---|
| FY22 | 10–12% | 19.7% | exceeded | 1.1 | **60.4** |
| FY23 | 13–15% | 15.4% | exceeded | 89.5 | **95.8** |
| FY24 | 4–7% | 1.4% | missed | 29.8 | **29.8** (unchanged) |
| FY25 | 1–3% | 4.2% | exceeded | 64.4 | **85.8** |
| FY26 | 0–3% | 3.1% | exceeded | 98.8 | **99.5** |

A row saying "exceeded, 1 point" contradicts the headline claim ("did management deliver?"), and an institutional reader would stop at it. Awarding 100 for any beat would be wrong in the other direction, because it rewards sandbagging (guiding low on purpose). **v4 is the middle path:**

- **Beats:** `60 + 40·exp(−α·δ^β)`. A small beat scores close to 100; a large beat still shows the guidance was imprecise, so it decays, but never below 60.
- **In-band results and misses:** identical to v3. Misses still carry the γ = 1.4 penalty.
- **Consistency:** a beat always outscores a miss of the same distance.
- **Everything else is unchanged:** dropped guidance, pending periods, recency weighting and audit deductions.

Impact when v4 went live: 15 of 49 scored companies rose and none fell (e.g. Axis Bank 59.6 → 83.8; Infosys 40.7 → 48.1 after audit deductions). The change is documented with an effective date (27 Sep 2026) in the methodology changelog (`docs/kb/03-scoring.md`). The earlier scorers remain selectable for comparison. The homepage note, glossary and architecture page explain the rule in plain language.

---

## 6. What we deliberately did not do (yet), and why

| Item | Decision | Reason |
|---|---|---|
| Rename Desk / Sights / Research | Kept names, added descriptors | The proposal allowed either; renames can follow once usage shows what people call each tool, which is the proposal's own guidance |
| Three fully designed journeys | Persona routing line + per-desk pathways on Products | Full journey design depends on pilot feedback; the routing line gives each persona a first step now |
| Onboarding walkthrough for Desk | Deferred (P2) | Desk is not yet paid; existing guided tours were only reworded |
| Public snapshot vs screener polish | Deferred (P2) | Needs the core loop validated first, as the proposal suggests |
| Target quarter for Nifty expansion | Not published | We won't publish a date we can't commit to; the panel says "in progress" instead |
| Filing-to-score latency as a number | Stated as a process | No measured SLA yet; a number would be an unbacked claim |
| Non-English versions of the new copy | Pending | 16 other languages currently show the corrected English text until translated |

---

## 7. How this was verified

- **Automated tests:**
  - backend: 317 passed (unit + API)
  - frontend: 12 of 12 unit tests passed
  - end-to-end: 126 of 126 browser tests passed, including new checks that the page leads with the cited worked example and the honest coverage lines, and that the `/api/meta` link is gone
- **The only failing checks** are four source-verification tests that re-download company PDFs (IndusInd, Axis Bank, Tech Mahindra, Sun Pharma). The quoted passages are no longer found at those URLs, so those rows are queued for analyst re-verification. No values were changed or guessed.
- **Live checks on citealpha.com** after each deploy:
  - the static HTML contains the new H1 and the Infosys lines, and no `/api/meta` or "OS" wording
  - the production API reports `gci_scoring_v4`
  - the Infosys FY22 row shows 60.4 points
  - the PIT API and the dossier agree on citeable counts
  - all key routes return 200

---

## 8. Where to look

- **Live homepage:** [citealpha.com](https://citealpha.com)
- **Worked-example dossier:** [citealpha.com/companies/infy](https://citealpha.com/companies/infy)
- **Methodology:** [citealpha.com/about#how](https://citealpha.com/about#how)
- **Trust Center:** [citealpha.com/trust](https://citealpha.com/trust)
- **Code (for technical reviewers):** the changes are in commits `169917a` (homepage revision), `cf78062` (scorer v4) and the follow-up commits after them on `main`.

*CiteAlpha is a factual research product of Ocotillo Innovation Private Limited. Not investment advice. No Buy / Hold / Sell.*
