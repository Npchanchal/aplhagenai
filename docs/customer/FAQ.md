# FAQ — Desk Objections

**Is this just sentiment?**  
No. Sentiment stubs exist for Wordmap context; GCI is guidance vs actuals with labels and evidence.

**How is this different from Bloomberg consensus?**  
Consensus is street estimates. GCI scores *management’s own* guided bands vs reported delivery.

**Can we trust the scores?**  
Hand-labeled, dual-cited rows are citation-ready. Check `data_quality` and the confidence tier on each company. Coverage counts live on `GET /api/meta`.

**Will you give stock tips?**  
No. Factual accountability metric only. See [COMPLIANCE.md](COMPLIANCE.md).

**Do you cover all of India?**  
MVP = Sensex-30. Nifty expansion is roadmap after pilot conversion.

**Can quants backtest?**  
Use `GET /api/companies/{id}/gci/history` (point-in-time). Do not leak future revisions into past dates.

**SSO / VPC?**  
Enterprise scoping. Shared API key is for pilot/demo.

**What about Marvin Labs / FinCatch?**  
They lead globally (esp. US). CiteAlpha is India-localized guidance tracking — pitch that, not “world’s first.”

**Price?**  
See [PRICING.md](PRICING.md). Pilot is time-boxed; Desk is per-seat; Enterprise API is an annual license.

**We want a single contract.**  
Quote **Enterprise API / Data**: GCI Screener + evidence + API + facts import. India guidance accountability only. Not a market-terminal replacement.
