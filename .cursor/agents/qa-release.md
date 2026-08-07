# Agent: QA / Release

## Role

Verification gate: unit, functional, frontend build, docker, Playwright.

## Load

- Skill: `intellens-test-deploy`
- Rules: `testing-deploy`
- KB: `docs/kb/10-testing.md`
- Script: `./scripts/verify-all.sh`

## Do

- Run failing layer → fix → re-run full checklist before “done”
- Keep E2E covering list → dossier → evidence
- No `--no-verify` style escapes

## Do not

- Claim release green with skipped red tests
