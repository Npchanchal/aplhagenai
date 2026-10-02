# 12 — Compliance

## Product stance

CiteAlpha is positioned as a **factual research / data product** on guidance delivery. It is **not** marketed as investment advice or a SEBI-registered Research Analyst product unless counsel + registration (or another approved pathway) say otherwise.

**Legal entity:** Ocotillo Innovation Private Limited owns and operates CiteAlpha.

> Naming hygiene (no Buy/Hold/tips) is **necessary but not sufficient**. Whether Score / Rankings / GCI is a “research report” under the SEBI RA Regulations, 2014 (incl. 2024–2025 amendments) is a **counsel determination**. See `docs/customer/COMPLIANCE.md` → *Open regulatory question*.

## UI requirements

- Short SEBI-oriented disclaimer on GCI and vernacular surfaces (`Disclaimer` component / `/api/compliance/sebi-note`).
- Terms of Use + Privacy Notice (`/terms`, `/privacy`) with accept gate on register and guest. Counsel status stays **pending** until counsel attests (do not self-attest). Public contact: `sales@citealpha.com`.
- Individual (B2C) signup and checkout stay **off** until a written SEBI RA memo and `sebi_retail` attest (W8.1 / D1). Register is desk-only. Public rankings remain factual delivery records.
- Trust Center (`/trust`, `GET /api/trust`) — security (including CSP allowing GTM/GA/Plausible after consent), residency (`ap-south-1`), subprocessors, citation posture, labeling status. Published scores count when a fetch of both filings contains the recorded quotes. A missing quote keeps the row out of the score. Not marketing claims.
- Privacy copy covers DPDP-oriented rights, optional Plausible analytics, and optional LLM extract.
- Site footer copyright: © Ocotillo Innovation Private Limited.
- No Buy / Hold / Sell badges or “tips.”
- Do not name competitors as product features in chrome (AlphaSense/Bloomberg only in internal docs — not glossary, Help, or Trust UI).

## Data honesty

- `hand_labeled` vs `demo_structured` must remain visible.
- Do not present scaffold markets as deep GCI coverage.

## Nomenclature

Approved nav / SKU / UI names: `docs/customer/COMPLIANCE.md` → **Approved nomenclature**.
Keep CiteAlpha / GCI / Score / Cite / Radar / Ledger / Data / Sights / Tracker / Desk / Research. Avoid Buy/Hold/Sell, tips, signals, alpha-finder, and competitor product names in chrome.

## Customer pack

`docs/customer/COMPLIANCE.md`, FAQ, coverage/SLA — keep aligned when changing claims.
Production checklist: `docs/PRODUCTION_B2B_B2C.md` (counsel attest gates).
