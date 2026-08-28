# 12 — Compliance

## Product stance

CiteAlpha is a **factual research / data product** on guidance delivery. It is **not** investment advice.

**Legal entity:** Ocotillo Innovation Private Limited owns and operates CiteAlpha.

## UI requirements

- Short SEBI-oriented disclaimer on GCI and vernacular surfaces (`Disclaimer` component / `/api/compliance/sebi-note`).
- Terms of Use + Privacy Notice (`/terms`, `/privacy`) with accept gate on register and guest. Show counsel status honestly (pending vs attested). Public contact: `sales@citealpha.com`.
- Trust Center (`/trust`, `GET /api/trust`) — security (including CSP allowing GTM/GA/Plausible after consent), residency (`ap-south-1`), subprocessors, citation posture, labeling two-person ids; not marketing claims.
- Privacy copy covers DPDP-oriented rights, optional Plausible analytics, and optional LLM extract.
- Site footer copyright: © Ocotillo Innovation Private Limited.
- No Buy / Hold / Sell badges or “tips.”
- Do not name competitors as product features in chrome (AlphaSense/Bloomberg only in internal docs — not glossary, Help, or Trust UI).

## Data honesty

- `hand_labeled` vs `demo_structured` must remain visible.
- Do not present scaffold markets as deep GCI coverage.

## Customer pack

`docs/customer/COMPLIANCE.md`, FAQ, coverage/SLA — keep aligned when changing claims.
Production checklist: `docs/PRODUCTION_B2B_B2C.md`.
