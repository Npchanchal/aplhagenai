# Gaps vs AlphaSense & Bloomberg — IntelLens (AlphaGenAI)

Sources: [AlphaSense](https://www.alpha-sense.com/), Bloomberg Asia / Terminal franchise, IntelLens product as of Research Terminal + GCI MVP.

**Rule:** Do not try to “become AlphaSense” or “become Bloomberg.” Close only gaps that strengthen **India guidance accountability** or adjacent research workflows buyers already ask for.

---

## Positioning snapshot

| | [AlphaSense](https://www.alpha-sense.com/) | Bloomberg (Asia site + Terminal) | **IntelLens** |
|---|---|---|---|
| Core job | AI market intelligence search + workflows over premium content | News (B2C Asia) + institutional market data / terminal (B2B) | **GCI** — management guidance vs delivery + evidence |
| Buyer | IB, HF, PE, AM, corporates, consulting | Consumers (news) + institutions (Terminal/data) | India buy-side / sell-side / EM API |
| Content scale | 500M+ docs, Tegus experts, broker research, internal content | Global news, quotes, estimates, economics | Sensex-30 seed; hand-labeled cohort partial |
| AI | Deep Research, GenAI with sentence-level citations | Terminal analytics / news AI (product family) | Heuristic research chat + GCI (demo) |
| Moat today | Content licensing + expert network + enterprise graph | Market data monopoly + brand | **India GCI / labels / evidence** (whitespace) |

---

## B2B gaps (institutional)

### A. Where AlphaSense is ahead of IntelLens

| Gap | AlphaSense has | IntelLens today | Priority for us |
|---|---|---|---|
| **Content firehose** | Filings, broker research, 500M+ docs, partners | Small demo index + guidance corpus | High — ingest NSE/BSE filings + concalls at scale |
| **Expert network** | Tegus Expert Insights / live calls | Stub “expert” notes | Low — partner later; don’t rebuild Tegus |
| **Enterprise search quality** | Smart synonyms, ranking, firm internal content | Keyword demo search | High — vector + synonym search on India IR |
| **GenAI depth** | Deep Research, slide/Excel/PPT add-ins, anti-hallucination claims | Heuristic chat citing seed docs | Medium — LLM cite-only over *our* corpus |
| **Vertical solutions** | IB, HF, PE, AM, life sciences, energy… | One India equity research desk | Low — stay India equity GTM |
| **Trust / scale proof** | 7,000+ enterprises, case studies | Pilot packaging | Medium — 15–20 pilot desks |
| **Security / SSO / admin** | Enterprise Intelligence, Trust Center | API key demo | High before Desk convert |

### B. Where Bloomberg (Terminal / data) is ahead of IntelLens

| Gap | Bloomberg has | IntelLens today | Priority for us |
|---|---|---|---|
| **Live market data** | Quotes, depth, FX, rates | Demo tape only | **Don’t build** — integrate or “bring your terminal” |
| **Consensus estimates** | Street EE / broker mashup | Synthetic street vs real guidance | Medium — license or import consensus; keep GCI as differentiator |
| **News wire** | Global + Asia news franchise | Demo news/filings cards | Low — link-out or partner; not a newsroom |
| **Portfolio / OMS / analytics** | Full terminal workflow | None | **Don’t build** |
| **Asia macro / geopolitics desk** | Asia homepage themes, policy, markets | None | Low for MVP |
| **Distribution** | Ubiquitous on buyside desks | AWS demo IP / seats model | High — SSO, stable URL, procurement pack |

### C. Where IntelLens is ahead (defend / deepen)

| IntelLens advantage | AlphaSense | Bloomberg |
|---|---|---|
| **Scored guidance delivery (GCI 0–100)** | Not productized as India GCI | Not a management-credibility *index* |
| **Labels: met / exceeded / missed / dropped / pending** | Search/snippets, not longitudinal accountability score | Estimates ≠ management promise tracking |
| **Auditable evidence trail tied to score** | Citations in GenAI; different job | Data cells, not GCI |
| **India disclosure / IR-native beachhead** | Global content; India not the wedge | Global; India is one region |
| **SEBI-aware factual posture** | US-centric enterprise AI | News + terminal; different compliance story |

---

## B2C gaps (retail / consumer)

Bloomberg’s [Asia](https://www.bloomberg.com/asia) surface is largely **B2C news + engagement**; AlphaSense is **not B2C**.

| Gap | Bloomberg Asia / consumer | AlphaSense | IntelLens |
|---|---|---|---|
| Free/paid news site | Strong | N/A | None (by design) |
| Retail app / alerts | Brand + apps | N/A | Explicit non-goal in MVP |
| Social / newsletter funnel | Strong | Light (events/content marketing) | Weak |
| SEBI RA / advice risk | News editorial | N/A | **Must stay factual — no Buy/Hold retail** |

**B2C recommendation:** Do **not** chase Bloomberg Asia’s newsroom or a retail trading app. Optional later: vernacular **factual** GCI blurbs / broker badge (Year-2), still not advice.

---

## Gap map — what to close vs ignore

```text
CLOSE (builds moat)
  India filings/concall ingest → better Search
  LLM cite-only over labeled guidance corpus
  Full Sensex → Nifty hand labels
  SSO / VPC / stable customer URL
  Real consensus import (optional) next to GCI

COMPLEMENT (partner / integrate)
  Live quotes, deep news, Tegus-like experts
  Excel/PPT add-ins after desk habit exists

IGNORE (red ocean / wrong category)
  Replace AlphaSense content universe
  Replace Bloomberg Terminal
  B2C news portal or tip app
```

---

## Commercial implication

| Buyer says | Don’t sell | Do sell |
|---|---|---|
| “We need AlphaSense” | Fake content scale | **Intellens Search + GCI** on India names they cover |
| “We need Bloomberg” | Fake quotes/OMS | **GCI + estimates-vs-guidance** beside their Terminal |
| “One-stop research” | One-stop *market data* | **One-Stop Platform** = guidance accountability stack only |

---

## Near-term product backlog (from this gap analysis)

1. **Depth:** hand-label remaining Sensex; real transcript/filing ingest.  
2. **Search/Chat:** LLM + embeddings over own corpus with mandatory citations.  
3. **Enterprise:** SSO, tenant isolation, custom domain (EIP/ALB or Cloudflare).  
4. **Estimates:** replace synthetic street with licensed/imported consensus where possible.  
5. **B2C:** skip newsroom; optional vernacular factual cards only.

**Stepwise plan:** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) (Phases 0–8).

## Implementation status (code)

Phases **0–8 scaffolded in repo** (v0.4.0): Sensex-30 hand_labeled coverage, document store + ingest, extract→commit, hybrid cite-only chat, feature flags, audit/SSO stub, consensus import, Nifty scaffold, sector benchmarks. See `/api/meta.implementation_phases`.
