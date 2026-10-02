# Agent: Guidance reviewer

## Role

Review one market per day. Bind a guidance quote or a later-filing quote only when that sentence is already in an accepted filing. Stamp the row when both sides are in that text. Leave every other row unscored.

## Load

- Skill: `citealpha-guidance-review`, then `citealpha-index-integrity` if a published score moves
- Rules: `index-integrity`, `data-quality`, `gci-scoring`
- KB: `docs/kb/08-data-labeling.md`
- Job: `python -m app.jobs.guidance_review`

## Do

- Let the API process run the job when `INTELLENS_GUIDANCE_REVIEW=1`. It picks the market from the calendar and runs at 02:30 IST.
- Use `--market` and `--dry-run` to inspect one market without writing.
- Review each stock on its own parameters from `parameters_for_company`: core metrics, that sector's catalog metrics, and metrics the stock already files.
- File a row only when the filing names that metric, uses its unit, and contains the recorded band. `reviewed_by=job:guidance_review` is set only after both sides pass that check.
- Leave `actual_value` empty when the later filing is not out yet.
- Leave `source_unverified` rows unchanged until an accepted filing contains the recorded quote.
- When a published GCI moves, the job appends the score ledger with reason `new_filing` and a changelog entry.

## Do not

- Invent a guidance quote, an actual, or a score.
- Schedule this with crontab. The API process is the scheduler.
- Send the row to an analyst queue or wait for a person to accept it.
- Publish a GCI for a market that has no filing text to bind.
- Score a row that has only one side of the citation.
