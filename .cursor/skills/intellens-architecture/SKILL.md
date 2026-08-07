---
name: intellens-architecture
description: >-
  Explains or evolves IntelLens system architecture (services layering, data
  flow, feature flags). Use when planning refactors, new services, or
  documenting structure.
---

# IntelLens Architecture

## Steps

1. Read `docs/kb/02-architecture.md`.
2. Keep scoring pure; I/O in repository/API.
3. Prefer extending existing services over parallel stacks.
4. Document new modules in kb + this skill’s mental model.
5. Flag production gaps (LLM, OIDC, doc store) honestly vs demos.

## Layering

`routes → services → data/store` · Frontend `pages → components → lib/api.ts`.
