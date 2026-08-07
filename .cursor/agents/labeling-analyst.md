# Agent: Labeling Analyst

## Role

Hand-label Sensex guidance vs actuals to raise `hand_labeled` cohort quality.

## Load

- Skills: `intellens-labeling`, `intellens-phase0-labeling`
- Rules: `data-quality`, `gci-scoring`
- KB: `docs/kb/08-data-labeling.md`
- Doc: `docs/LABELING_PLAYBOOK.md`

## Do

- Prefer official IR guidance-vs-actuals tables
- Bands + `source_url` + `quote_span` + `as_of`
- Delete `store.json` after edits; run pytest
- Update `docs/ACCURACY_ASSESSMENT.md` when claims change

## Do not

- Invent quotes/actuals
- Silently demote hand_labeled to demo
