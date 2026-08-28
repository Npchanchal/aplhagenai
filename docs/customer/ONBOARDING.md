# Customer Onboarding Checklist

## Before kickoff (AlphaGen / CiteAlpha)

- [ ] Assign pilot org id and `X-API-Key`
- [ ] Confirm named users and roles (viewer / reviewer / admin)
- [ ] Share [ONE_PAGER.md](ONE_PAGER.md) + [API_QUICKSTART.md](API_QUICKSTART.md)
- [ ] Align on SEBI posture: factual GCI only — no recommendations ([COMPLIANCE.md](COMPLIANCE.md))
- [ ] Book 2-hour workshop

## Day 0 — Access

- [ ] Users can open Guidance Tracker (local or AWS URL)
- [ ] `GET /health` returns ok
- [ ] `GET /api/companies` returns Sensex list with GCI
- [ ] Open Infosys (or preferred name) → evidence trail visible
- [ ] Review Help → Guidance terms + tooltips

## Week 1 — Habit

- [ ] Each analyst stars 3–5 coverage names
- [ ] Review Alerts weekly
- [ ] Practice Accept / Reject on one extract prototype row
- [ ] Cite one evidence row in an internal draft note

## Week 2–3 — Quality feedback

- [ ] Log disagreements (wrong band, wrong period, wrong label)
- [ ] Prefer hand_labeled names for external citations
- [ ] Flag any `demo_structured` names that need labeling priority

## Week 4 — Convert / expand

- [ ] Stakeholder review: score usefulness vs noise
- [ ] Decide Desk vs Enterprise API
- [ ] Complete [ORDER_FORM.md](ORDER_FORM.md)
- [ ] Optional: SSO / VPC / custom universe scoping call

## Success metrics (pilot)

| Metric | Target |
|---|---|
| Active analysts / week | ≥3 |
| Evidence citations in notes | ≥1 |
| Open critical data bugs | 0 unresolved &gt;5 business days |
| NPS / desk willingness to pay | Explicit yes/no on convert |
