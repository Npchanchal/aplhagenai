# 10 — Testing

## Layers

| Layer | Command | Covers |
|---|---|---|
| Unit + API | `cd backend && pytest -q` | Scoring, gaps G01–G23, routes via TestClient |
| Frontend build | `cd frontend && npm run build` | `tsc` + Vite |
| E2E | `cd e2e && npx playwright test` | List → dossier → evidence (`US-001`…) |
| Full local | `./scripts/verify-all.sh` | Preferred gate |

## Invariants for tests

- No network in pytest functional tests.
- Fixtures in `backend/tests/conftest.py`.
- Never invent live market prints; use seed/stubs.
- Do not skip failures with hook bypasses.

## E2E base URL

Docker web often `http://127.0.0.1:8080` — set `E2E_BASE_URL`.

## CI

`Jenkinsfile`, `scripts/ci-verify.sh`, `docs/CI_JENKINS.md`
