# Stepwise plan — pending depth work (2026-08-09)

Closes items from the pending backlog after G01–G23 / Tier E1–E10 / GCI v3.

**Rules:** Never invent financial actuals or fake hand_labeled promotions. Ops/commercial items ship as **runbooks + readiness APIs**, not pretend cutovers.

| Step | Item | Exit |
|---|---|---|
| **S0** | This plan + meta `pending_depth` report | Doc + `/api/meta` surface |
| **S1** | Real LLM extract provider (`OPENAI_API_KEY` / `INTELLENS_LLM_*`) with heuristic fallback | `extract_engine`: `llm_v1` \| `heuristic_v1`; always `needs_review` |
| **S2** | Embeddings retrieve for Research (OpenAI embeddings when keyed; TF-IDF local always) | Search `engine` reports embedding mode; chat uses same retrieve |
| **S3** | HTTPS / custom-domain cutover checklist + `scripts/check-domain-cutover.sh` | Ops gate; no fake DNS |
| **S4** | OIDC readiness hardening (`/api/auth/sso/status` checklist fields) | `ready` only when SSO+OIDC+HTTPS redirect |
| **S5** | Nifty M2: enqueue all `NIFTY_EXTRA` into labeling queue | Milestone M2 → `done`; M3/M4 stay open until real labels |
| **S6** | Period corpus depth: completeness SLA fields + Sensex IR catalog coverage report | API returns missing expected docs |
| **S7** | PIT: prefer citeable chronology; mark `demo_pit_extension` only when padding | `series_kind` honesty |
| **S8** | Consensus import polish + FMP deploy check in secrets script | Flags + docs |
| **S9** | Counsel / conversion readiness endpoints (attest status, pilot checklist) | Commercial still human |
| **S10** | Tests + `docs/PENDING_DEPTH_REPORT.md` | pytest green |

## Out of band (cannot close in-repo alone)

- Hostinger NS cutover (human DNS)
- Real IdP client secrets in production
- Hand-label Nifty M3/M4 (analyst labor)
- Counsel wet-ink MSA + SEBI RA
- First paid Desk conversion (sales)

## Flags

| Env | Default | Meaning |
|---|---|---|
| `INTELLENS_LLM_EXTRACT` | `true` when key present else off | Prefer LLM extract |
| `OPENAI_API_KEY` / `INTELLENS_LLM_API_KEY` | — | Chat Completions extract |
| `INTELLENS_LLM_BASE_URL` | OpenAI | Compatible gateway |
| `INTELLENS_LLM_MODEL` | `gpt-4o-mini` | Extract model |
| `INTELLENS_EMBEDDINGS` | `true` when key present | Prefer API embeddings |
| `INTELLENS_EMBED_MODEL` | `text-embedding-3-small` | Embed model |
| `RESEARCH_LLM` | `false` | Optional LLM rewrite of cite-only answers (still refuse without cites) |
| `INTELLENS_GCI_VERSION` | `v3` | Scorer |
| `SSO` + `OIDC_*` | — | Production SSO |
| `FORCE_HTTPS` | — | Redirect + HSTS with `ENABLE_HSTS` |
