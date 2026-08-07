---
name: intellens-api
description: >-
  Adds or changes IntelLens FastAPI routes and keeps frontend lib/api.ts in
  sync. Use when creating endpoints, Pydantic models, or OpenAPI contract work.
---

# IntelLens API

## Workflow

1. Skim `docs/kb/05-api-map.md`.
2. Add/adjust Pydantic models in `backend/app/models/`.
3. Implement service logic (no scoring I/O in `gci_scoring.py`).
4. Thin route in `backend/app/api/routes.py`.
5. Mirror types + fetch helpers in `frontend/src/lib/api.ts`.
6. Pytest with `TestClient`; update kb API map.
7. Write paths: require `X-API-Key`.

## Checklist

- [ ] Deterministic where scoring involved
- [ ] No invented actuals
- [ ] Frontend compiles against new types
