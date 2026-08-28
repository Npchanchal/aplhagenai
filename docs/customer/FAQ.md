# FAQ — Desk Objections

**Is this just sentiment?**  
No. Sentiment stubs exist for Wordmap context; GCI is guidance vs actuals with labels and evidence.

**How is this different from Bloomberg consensus?**  
Consensus is street estimates. GCI scores *management’s own* guided bands vs reported delivery.

**Can we trust the scores?**  
Hand-labeled cohort (e.g. Infosys official guidance-vs-actuals) is citation-ready. Remaining Sensex names may be `demo_structured` until labeled — check `data_quality` on each company.

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
See [PRICING.md](PRICING.md). Pilot is time-boxed; Desk is per-seat; API is annual license; One-Stop is the bundled platform SKU.

**We want a one-stop solution.**  
Sell **One-Stop Platform**: single contract for Tracker + API + import + Wordmap context + CSM — India guidance accountability only. Not a Bloomberg replacement. See [ONE_STOP.md](ONE_STOP.md).
