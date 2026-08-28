# Compliance & Product Posture

**Legal entity:** Ocotillo Innovation Private Limited owns and operates CiteAlpha.

## Factual product first

CiteAlpha GCI measures **management guidance vs subsequent actuals**. It does **not**:

- Recommend Buy / Hold / Sell  
- Provide personalized investment advice  
- Act as a SEBI-registered Research Analyst product in the MVP

Use `GET /api/compliance/sebi-note` for the live disclaimer text. Badge / vernacular endpoints restate the factual framing. End-user Terms and Privacy: `/terms`, `/privacy` (acceptance required at register / guest). Trust Center: `/trust`. Contact: sales@citealpha.com.

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
- Accept Terms of Use before guest or registered use

## Vendor responsibilities

- Maintain source linkage on outcomes where available  
- Separate demo seed data from labeled cohort in meta  
- Keep scoring rules documented (Help + product definition)
- Isolate B2B tenants (`org_id`) for reviews and seat metering

## Privacy

Named analyst review actions are customer content. Do not train public models on customer review comments without written consent.

## Copyright

© Ocotillo Innovation Private Limited. All rights reserved. CiteAlpha is a product of Ocotillo Innovation Private Limited.
