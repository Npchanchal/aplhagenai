# CiteAlpha

**Guidance Credibility Index (GCI)** — score whether Indian listed-company management delivered on stated guidance.

**Product:** CiteAlpha · **Legal entity:** Ocotillo Innovation Private Limited · **Live:** https://citealpha.com

## Docs

- [Knowledge base](docs/kb/README.md) — agent/human memory (start here)
- [Agent routing](AGENTS.md) — specialist agents + skills map
- [Business plan](docs/BUSINESS_PLAN.md)
- [Product definition](docs/PRODUCT_DEFINITION.md)
- [User stories](docs/USER_STORIES.md)
- [Pitch deck (HTML)](docs/PITCH_DECK.html) · [narrative](docs/PITCH_DECK.md)
- [Competitive landscape](docs/COMPETITIVE_LANDSCAPE.md) — Marvin, FinCatch, Tijori, AlphaSense, path to GCI
- [Regional markets](docs/REGIONAL_MARKETS.md) — Global / US / EU / India / Japan
- [Accuracy assessment](docs/ACCURACY_ASSESSMENT.md) — what is/isn’t accurate in the MVP
- [Gaps & way forward](docs/GAPS_AND_ROADMAP.md) — G01–G23 fixed one-by-one (v0.3)
- [AWS deployment](docs/AWS_DEPLOYMENT.md) — separate ECS/ALB stack (not local Docker)
- [Domain / HTTPS](docs/DOMAIN_HTTPS.md) — citealpha.com cutover

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

Open http://127.0.0.1:5173 (dev) or http://127.0.0.1:8080 (Docker).

## Docker Compose

```bash
docker compose up --build -d
curl -sf http://127.0.0.1:8000/health
```

## Demo API key

```
X-API-Key: intellens-demo
```

## Copyright

© Ocotillo Innovation Private Limited. All rights reserved. CiteAlpha is a product of Ocotillo Innovation Private Limited. Not investment advice.
