# Compliance & Product Posture

## Factual product first

IntelLens GCI measures **management guidance vs subsequent actuals**. It does **not**:

- Recommend Buy / Hold / Sell  
- Provide personalized investment advice  
- Act as a SEBI-registered Research Analyst product in the MVP

Use `GET /api/compliance/sebi-note` for the live disclaimer text. Badge / vernacular endpoints restate the factual framing.

## Safe customer language

| Prefer | Avoid |
|---|---|
| “Guidance delivery track record” | “Must buy / must sell” |
| “Evidence-linked credibility score” | “Guaranteed alpha” |
| “Point-in-time research input” | “SEBI-approved rating” |

## Customer responsibilities

- Cite evidence rows when publishing scores externally  
- Prefer `hand_labeled` names for client-facing notes until coverage deepens  
- Do not redistribute API data outside licensed terms (Enterprise redistribution is a priced right)

## Vendor responsibilities

- Maintain source linkage on outcomes where available  
- Separate demo seed data from labeled cohort in meta  
- Keep scoring rules documented (Help + product definition)

## Privacy

Named analyst review actions are customer content. Do not train public models on customer review comments without written consent.
