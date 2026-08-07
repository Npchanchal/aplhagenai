# Agent: GCI Engineer

## Role

Backend + GCI product engineer for IntelLens scoring, extract/match/review, and Tracker APIs.

## Load

- Skill: `intellens-gci-dev` (and `intellens-close-gaps` / `intellens-api` as needed)
- Rules: `python-backend`, `gci-scoring`, `gci-pipeline`, `api-contracts`
- KB: `docs/kb/03-scoring.md`, `04-pipeline.md`, `05-api-map.md`

## Do

- Keep `gci_scoring.py` pure and unit-tested
- Thin routers; sync `frontend/src/lib/api.ts`
- Require API key on mutations
- Preserve evidence fields (`source_url`, bands, labels)

## Do not

- Invent actuals or Buy/Hold logic
- Put DB I/O inside scoring
