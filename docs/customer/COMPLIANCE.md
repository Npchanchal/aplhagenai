# Compliance & Product Posture

**Legal entity:** Ocotillo Innovation Private Limited owns and operates CiteAlpha.

> **Not legal advice.** This document is an internal product/compliance hygiene guide. Characterization under the SEBI (Research Analysts) Regulations, 2014 (as amended, including the Dec 2024 / Jan 2025 RA framework updates) requires **written sign-off from securities counsel**. Word choices in the UI do **not** by themselves determine whether CiteAlpha is a “research report” or requires RA registration.

## Factual product first (product intent)

CiteAlpha GCI measures **management guidance vs subsequent actuals** (quantified promise → matched actual → outcome label → primary source). Product **intent** for MVP:

- Do not recommend Buy / Hold / Sell  
- Do not provide personalized investment advice  
- Do not market CiteAlpha as a SEBI-registered Research Analyst product unless/until RA registration (or another counsel-approved pathway) is in place  

Live disclaimer: `GET /api/compliance/sebi-note`. Terms/Privacy: `/terms`, `/privacy`. Trust Center (shows counsel status honestly): `/trust`. Contact: sales@citealpha.com.

### Open regulatory question (do not paper over)

Avoiding “buy/sell/tip/recommendation” language is **marketing hygiene**, not a conclusive RA carve-out.

Under the RA Regulations, a **research report** can include written or electronic communications that include research analysis, research recommendation, or an **opinion concerning securities** that provides a **basis for investment decision** — with limited carve-outs (e.g. general market commentary, certain statistical summaries, internal communications, technical demand/supply analysis). That definition is **broader than explicit Buy/Hold language**.

A scored/ranked **Guidance Credibility Index** for specific listed companies, published to external clients and used in diligence workflows, may still be argued to be evaluative (not a mere statistical data dump). Whether Rankings / Score / Tracker fall inside or outside the regime depends on **how the product is sold, used, and presented**, not only on nav labels.

**Required before treating this posture as final for paying clients or public rankings:**

1. Securities counsel memo on RA Regulations applicability (incl. 2024–2025 amendments) to GCI Score, Rankings, Radar, and public marketing.  
2. Counsel attest on Terms/Privacy (`POST /api/legal/attest` / Trust Center `counsel_status`).  
3. Explicit go / no-go on: public company rankings, retail marketing (`sebi_retail` attest), and any “diligence / IC input” sales claims.  

Until counsel attests, Trust Center must keep showing **pending / scaffold** counsel status — do not claim “SEBI-cleared.”

## Safe customer language (hygiene — necessary, not sufficient)

| Prefer | Avoid |
|---|---|
| “Guidance delivery track record” | “Must buy / must sell” |
| “Evidence-linked credibility score” | “Guaranteed alpha” |
| “Point-in-time research input” | “SEBI-approved rating” / “RA opinion” |

## Approved nomenclature (nav, SKUs, UI)

Use **factual research / disclosure / evidence** language. This reduces tipster optics and trademark risk. It does **not** replace counsel’s RA characterization.

### Naming rule

| Prefer | Avoid in product chrome |
|---|---|
| guidance, delivery, evidence, citation, disclosure, filings, trail, ledger, review, score history | buy, sell, hold, tip, pick, alpha, signal, recommendation, conviction, outperform, underperform, overweight, “SEBI-approved”, “RA opinion” |

### Canonical product names (keep)

| Surface / SKU | Approved name | Safe subtitle / framing |
|---|---|---|
| Brand | **CiteAlpha** | Product of Ocotillo Innovation Private Limited |
| Core metric | **Guidance Credibility Index (GCI)** | Evidence-linked management guidance vs delivery |
| Nav | **GCI Tracker** | Screen coverage by guidance credibility |
| Nav | **Desk** / **Review Desk** | Review queue and human-in-the-loop workflows |
| Nav | **Research** / **Filings Research** | Cite-only filings and transcript search |
| Nav / SKU | **Sights** | India disclosure research OS |
| SKU | **CiteAlpha Score** | Company GCI + evidence trail (not marketed as a stock rating) |
| SKU | **CiteAlpha Cite** | Primary-source citations and cite-only answers |
| SKU | **CiteAlpha Radar** | Guidance-change / miss / drop alerts (not trade alerts) |
| SKU | **CiteAlpha Ledger** | Promise ledger / accountability dossier |
| SKU | **CiteAlpha Data** | Point-in-time guidance-outcome dataset / API |
| Public | **GCI Rankings** | Peer delivery comparison — counsel must clear public ranking posture |
| Diligence | **Trust Center** | Security, legal, and citation posture (honest counsel status) |
| Commercial | **Packages** / **Pilot** | Commercial evaluation — not investment advice |

### Safe UI / marketing phrases

- “Evidence-linked guidance delivery”
- “Guidance vs actuals”
- “Primary-source citations”
- “Hand-labeled evidence”
- “Factual research tooling — not investment advice” (disclaimer still required)
- “Disclosure research”

### Do not use (even if industry-popular)

- Stock screener / stock picker / alpha finder (as product identity)
- Buy/Sell signals / trade alerts / conviction score
- AI recommendations / smart tips
- Research Analyst opinion / SEBI RA report (unless RA registration is obtained)
- Competitor product names in UI, glossary, Help, Trust, or SEO chrome

### Data-quality labels (required honesty)

| Badge | Meaning |
|---|---|
| `hand_labeled` | Preferred for client-facing citation |
| `demo_structured` | Provisional / demo — do not over-claim |
| `listing_provisional` / scaffold | Navigable listing — not deep GCI coverage |

Always show the disclaimer on GCI and vernacular surfaces (`Disclaimer` / `/api/compliance/sebi-note`).

## Customer responsibilities

- Cite evidence rows when publishing scores externally  
- Prefer `hand_labeled` names for client-facing notes until coverage deepens  
- Do not redistribute API data outside licensed terms (Enterprise redistribution is a priced right)
- Accept Terms of Use before guest or registered use
- Do not treat GCI as a substitute for their own RA / investment process

## Vendor responsibilities

- Maintain source linkage on outcomes where available  
- Separate demo seed data from labeled cohort in meta  
- Keep scoring rules documented (Help + product definition)
- Isolate B2B tenants (`org_id`) for reviews and seat metering
- Keep counsel status honest in Trust Center; do not ship “cleared” claims without attest
- Escalate RA / research-report characterization to securities counsel before expanding retail or public rankings claims

## Privacy

Named analyst review actions are customer content. Do not train public models on customer review comments without written consent.

## Copyright

© Ocotillo Innovation Private Limited. All rights reserved. CiteAlpha is a product of Ocotillo Innovation Private Limited.
