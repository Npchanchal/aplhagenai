# 07 — Research Terminal

Product: **Intellens Research** at `/research` — primary-source workbench beside GCI, not a Bloomberg clone.

## Modes

| Tab (`?tab=`) | Behavior |
|---|---|
| `search` | Doc search + type chips + company filter |
| `chat` | Cite-only answers; refuse when no evidence |
| `desk` | Snapshot: tape (demo), GCI+Δ, fundamentals MoM/QoQ/YoY, estimates, transcripts, brief |
| `news` | Chronological feed |
| `watch` | Watchlist with GCI Δ → click to snapshot |

## Rules

- Citations required for chat answers; no hallucinated filings.
- Demo tape labeled as demo.
- Numbers: absolute secondary; **incremental changes** primary.
- Backend: `services/research.py` + `/api/research/*`.

## Depth roadmap

Real document store + LLM extract: Phases 2–3 in `docs/IMPLEMENTATION_PLAN.md`. Do not fake live IR crawl in UI copy.

## Docs

`docs/RESEARCH_TERMINAL.md`
