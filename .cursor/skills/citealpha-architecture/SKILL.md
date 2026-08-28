---
name: citealpha-architecture
description: >-
  Explains or evolves CiteAlpha system architecture (services layering, data
  flow, feature flags). Use when planning refactors, new services, or
  documenting structure.
---

# CiteAlpha Architecture

## Steps

1. Read `docs/kb/02-architecture.md`.
2. Keep scoring pure; I/O in repository/API.
3. Prefer extending existing services over parallel stacks.
4. Document new modules in kb + this skill’s mental model.
5. Flag remaining depth gaps (LLM doc store, live feeds) honestly vs demos; auth/billing/Postgres are shipped — see `citealpha-production`.

## Layering

`routes → services → data/store` · Frontend `pages → components → lib/api.ts`.
