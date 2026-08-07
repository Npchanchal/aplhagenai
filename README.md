# IntelLens GCI

Guidance Credibility Index — score whether Indian listed-company management delivered on stated guidance.

## Docs

- [Knowledge base](docs/kb/README.md) — agent/human memory (start here)
- [Agent routing](AGENTS.md) — specialist agents + skills map
- [Business plan](docs/BUSINESS_PLAN.md)
- [Product definition](docs/PRODUCT_DEFINITION.md)
- [User stories](docs/USER_STORIES.md)
- [Competitive landscape](docs/COMPETITIVE_LANDSCAPE.md) — Marvin, FinCatch, Tijori, AlphaSense, path to GCI
- [Regional markets](docs/REGIONAL_MARKETS.md) — Global / US / EU / India / Japan
- [Accuracy assessment](docs/ACCURACY_ASSESSMENT.md) — what is/isn’t accurate in the MVP
- [Gaps & way forward](docs/GAPS_AND_ROADMAP.md) — G01–G23 fixed one-by-one (v0.3)
- [AWS deployment](docs/AWS_DEPLOYMENT.md) — separate ECS/ALB stack (not local Docker)

## Quick start

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- UI: http://127.0.0.1:5173  
- API docs: http://127.0.0.1:8000/docs  

## Test & deploy

```bash
chmod +x scripts/verify-all.sh
./scripts/verify-all.sh
```

Or stepwise:

```bash
# Unit + functional
cd backend && source .venv/bin/activate && pytest -q

# Docker
docker compose up --build -d

# E2E
cd e2e && npm install && npx playwright install chromium
E2E_BASE_URL=http://127.0.0.1:8080 npx playwright test
```

## Cursor

| Asset | Path |
|---|---|
| Rules | `.cursor/rules/*.mdc` |
| Skills | `.cursor/skills/*/SKILL.md` |
| Agents | `.cursor/agents/*.md` + [`AGENTS.md`](AGENTS.md) |
| Index | [`.cursor/README.md`](.cursor/README.md) |
| Knowledge base | [`docs/kb/`](docs/kb/README.md) |

Skills include: `intellens-gci-dev`, `intellens-api`, `intellens-frontend-ux`, `intellens-research`, `intellens-test-deploy`, `intellens-aws`, `intellens-product`, `intellens-close-gaps`, `intellens-labeling`, `intellens-phase0-labeling`, `intellens-compliance`, `intellens-architecture`, `intellens-kb`.

## MVP scope

Sensex-30 Guidance Tracker: GCI score, labels, ranges, threads, sources, trend, peers, alerts, review loop, extract/match/import APIs. Demo data quality until Phase 0 labeling (G01).

Default API key for write endpoints: `intellens-demo`
