---
name: intellens-test-deploy
description: >-
  Runs IntelLens unit, functional, and E2E tests and deploys via Docker Compose.
  Use when the user asks to test, verify, deploy, or release the GCI product.
---

# IntelLens Test & Deploy

## Checklist

```
- [ ] Unit: cd backend && pytest -q
- [ ] Functional API: included in pytest (TestClient)
- [ ] Frontend build: cd frontend && npm run build
- [ ] Deploy local: docker compose up --build -d
- [ ] E2E: cd e2e && npx playwright test
- [ ] Health: curl -sf http://localhost:8000/health
```

Prefer `./scripts/verify-all.sh` when available. KB: `docs/kb/10-testing.md`.

## Commands

```bash
cd backend && python -m pytest -q
docker compose up --build -d
cd e2e && npx playwright test
```

## Failure handling

Fix root cause; re-run the failing layer only, then full checklist before claiming done.
