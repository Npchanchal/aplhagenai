# AGENTS.md — IntelLens

Instructions for Cursor agents working in this repository.

## Mission

Ship a credible **Guidance Credibility Index (GCI)** for Indian equity desks: factual, evidence-linked management delivery scores — not sentiment, not Buy/Hold.

## Always

1. Read `docs/kb/00-overview.md` when context is cold.
2. Follow always-on rule `.cursor/rules/intellens-core.mdc`.
3. Pick a specialist from `.cursor/agents/` using `docs/kb/AGENT_ROUTING.md`.
4. Load the matching `.cursor/skills/*/SKILL.md` before multi-step work.
5. Prefer small, tested changes; never invent financial actuals.

## Specialist agents

| Agent file | Use for |
|---|---|
| [gci-engineer](.cursor/agents/gci-engineer.md) | Scoring, APIs, pipeline, Tracker backend |
| [frontend-designer](.cursor/agents/frontend-designer.md) | UI/UX, dossier, Desk/Research chrome |
| [research-terminal](.cursor/agents/research-terminal.md) | Search, cite-only chat, snapshots |
| [labeling-analyst](.cursor/agents/labeling-analyst.md) | Hand-labeled Sensex outcomes |
| [product-strategist](.cursor/agents/product-strategist.md) | Scope, GTM, user stories, pitch |
| [qa-release](.cursor/agents/qa-release.md) | pytest, Playwright, docker verify |
| [devops-aws](.cursor/agents/devops-aws.md) | ECS deploy, idle/wake, health checks |
| [compliance-reviewer](.cursor/agents/compliance-reviewer.md) | SEBI disclaimer, claim hygiene |
| [architect](.cursor/agents/architect.md) | Layering, refactors, system map |

## Knowledge base

Canonical memory: [`docs/kb/README.md`](docs/kb/README.md).

## Demo write key

`X-API-Key: intellens-demo`
