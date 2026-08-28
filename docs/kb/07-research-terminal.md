# 07 — Research Terminal

Product: **Intellens Research** at `/research` — primary-source workbench beside GCI, not a Bloomberg clone.

## Modes

| Tab (`?tab=`) | Behavior |
|---|---|
| `search` | Doc search + type chips + company filter |
| `chat` | Cite-only answers; refuse when no evidence |
| `desk` | Snapshot: tape (demo), GCI+Δ, fundamentals MoM/QoQ/YoY, estimates, transcripts, brief |
| `news` | Chronological feed |
| `watch` | Editable watchlist (prefs ★) with GCI Δ → click to snapshot |

## Rules

- Citations required for chat answers; no hallucinated filings.
- Chat returns numbered `[n]` markers bound to citation objects (id, quote, URL, locator, bibliographic line).
- Clicking `[n]`, a citation card, or Open source opens the indexed document with the quote highlighted (plus original URL with `#:~:text=` / PDF `#search=`).
- Demo tape labeled as demo.
- Demo tape labeled as demo.
- Numbers: absolute secondary; **incremental changes** primary.
- Backend: `services/research.py` + `/api/research/*`.

## Depth roadmap

Real LLM extract + embeddings: `docs/PENDING_DEPTH_PLAN.md` / report `docs/PENDING_DEPTH_REPORT.md`.  
Set `OPENAI_API_KEY` for `llm_v1` / API embeddings; local TF-IDF always available. Cite-only chat still refuses without retrieved sources.

## Docs

`docs/RESEARCH_TERMINAL.md`
