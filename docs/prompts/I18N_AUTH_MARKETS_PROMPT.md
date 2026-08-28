# Prompt — i18n language selector · auth (login / register / guest) · global markets & indexes

**Status today:**
- UI i18n: header language selector + `en`/`hi` catalogs (`docs/I18N_AUTH_MARKETS.md`)
- Auth: register / login / guest + preferences (`/api/auth/*`); SSO remains stub
- Markets: 12 markets · flagship indexes · constituents; GCI depth `["IN"]`

Copy everything below the line into Cursor Agent to implement (or extend).

---

## Role

You are extending **CiteAlpha** (`/Users/navin/AlphaGenAI`) with three product capabilities:

1. **Language selector** — major Indian + global languages for UI chrome (and keep GCI vernacular blurbs in sync where templates exist).
2. **Login / registration / guest** — lightweight identity with **preferences** (language, default market, watchlist, theme).
3. **Major markets** — markets → flagship indexes → constituent stocks (scaffolding + navigation). **GCI depth remains India-first**; other markets ship as universe/demo until labeled.

Do **not** turn CiteAlpha into a live global terminal (no real-time quotes OMS, no Buy/Hold). Prefer scaffolding + honest `data_quality` badges.

## Locked product decisions

### A. Language selector

**UI languages (ship selector + string catalog for chrome):**

| Code | Language | Region note |
|------|----------|-------------|
| `en` | English | Default |
| `hi` | Hindi | India |
| `ta` | Tamil | India |
| `te` | Telugu | India |
| `kn` | Kannada | India |
| `ml` | Malayalam | India |
| `mr` | Marathi | India |
| `gu` | Gujarati | India |
| `bn` | Bengali | India |
| `pa` | Punjabi | India |
| `ja` | Japanese | Global / EM desks |
| `zh` | Chinese (Simplified) | Global |
| `ar` | Arabic | Global |
| `es` | Spanish | Global |
| `fr` | French | Global |
| `de` | German | Global |
| `pt` | Portuguese | Global |

**Rules:**
- Selector in **global header** (next to nav). Persist to `localStorage` + user preferences when logged in.
- Phase 1: translate **shell + page kickers/ledes + common buttons/labels** via a small `i18n` dict (JSON or TS modules). Do not machine-translate entire Help glossary in one pass — keep glossary English with note “glossary EN for now” unless easy.
- GCI vernacular blurbs: extend `/api/vernacular` templates for any new lang that is trivial; otherwise fall back to `en` with `fallback: true`.
- `dir="rtl"` when `ar` selected.
- Language does **not** change GCI math.

### B. Auth: register · login · guest + preferences

**Modes:**

| Mode | Behavior |
|------|----------|
| **Register** | email + password (hashed) + display name → session |
| **Login** | email + password → session |
| **Guest** | one-click “Continue as guest” → ephemeral session id; can set preferences; prompt to register to persist across devices |
| **API key** | keep existing `X-API-Key` for write/API (desk/org) — link session org later |

**Preferences (guest + registered):**
- `language` (UI lang code)
- `default_market` (e.g. `IN`, `US`)
- `default_index` (e.g. `SENSEX`, `NIFTY50`, `SPX`)
- `watchlist` (company ids)
- `show_demo_tape` (bool)
- `density` optional (`comfortable` | `compact`)

**Implementation sketch:**
- Backend: JSON-backed `users.json` / `sessions.json` (or extend seed store) — bcrypt or pbkdf2 hash; httpOnly cookie **or** `Authorization: Bearer <token>` returned to frontend.
- Endpoints:
  - `POST /api/auth/register` `{email, password, name}`
  - `POST /api/auth/login` `{email, password}`
  - `POST /api/auth/guest` `{}` → guest session
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - `GET/PUT /api/auth/preferences`
- Frontend: `/login`, `/register` routes + header avatar menu (Guest / email · Language · Market · Logout).
- Guest banner: “You’re browsing as guest — register to sync preferences.”
- Keep SEBI disclaimer; auth does not imply advice entitlement.
- **Out of scope this pass:** full OIDC/SAML (keep SSO stub as “coming soon”), email verification, password reset SMTP (stub “contact admin”).

### C. Major markets · indexes · stocks

**Markets to scaffold (at minimum):**

| Market | Code | Flagship indexes (examples) |
|--------|------|-----------------------------|
| India | `IN` | SENSEX, NIFTY 50, NIFTY Bank |
| United States | `US` | S&P 500, Dow Jones, Nasdaq-100 |
| United Kingdom | `GB` | FTSE 100 |
| Japan | `JP` | Nikkei 225, TOPIX |
| Hong Kong | `HK` | Hang Seng |
| China | `CN` | CSI 300, Shanghai Composite |
| Eurozone | `EU` | Euro Stoxx 50, DAX (DE), CAC 40 (FR) |
| Singapore | `SG` | STI |
| Australia | `AU` | ASX 200 |
| South Korea | `KR` | KOSPI 200 |
| Brazil | `BR` | Bovespa |
| Canada | `CA` | TSX 60 |

**Data model:**
```
Market { id, name, currency, timezone }
Index { id, market_id, name, ticker, constituent_count }
Stock { id, market_id, index_ids[], name, ticker, sector, data_quality }
```

**Rules:**
- **India SENSEX** remains the deep GCI / hand_labeled path (existing).
- Other indexes: ship **constituent lists** (top N per index is OK for MVP — e.g. 30–50 names, not full 500 on day one) with `data_quality: market_scaffold` or `demo_structured`.
- UI: Market switcher (header or Tracker filter) → Index chips → company table filtered to that index.
- APIs:
  - `GET /api/markets`
  - `GET /api/markets/{id}/indexes`
  - `GET /api/indexes/{id}/constituents`
  - Extend `GET /api/companies?market=&index=` 
- Research/Desk company pickers respect selected market/index preference.
- Demo quotes may remain synthetic; label **Demo tape**.
- Do **not** claim live global coverage or full GCI for non-India names until labeled.
- Meta: `markets_count`, `indexes_count`, `gci_deep_markets: ["IN"]`.

## Implementation tasks (order)

### 1. i18n foundation
- `frontend/src/i18n/locales/{lang}.json` + `useI18n()` / `t(key)`
- Header `<LanguageSelect />` with Indian group + Global group
- Persist language; apply `document.documentElement.lang` and `dir`
- Wire shell strings (nav, kickers, common CTAs)

### 2. Auth + preferences
- Backend auth routes + session/token store
- Pages `/login`, `/register`; guest button
- Header session menu; preferences panel (language, market, index, watchlist)
- Guest → register merge preferences on signup when possible
- Tests: register/login/guest/preferences round-trip

### 3. Markets data
- `backend/app/data/markets.py` (+ JSON seed for indexes/constituents)
- Seed India from existing Sensex/Nifty; add other markets’ flagship indexes with representative constituents
- APIs listed above; update `/api/meta`

### 4. Tracker / Research / Desk UI
- Market + index filters on Guidance Credibility Index home
- Persist selection in preferences
- Empty states: “GCI depth is India-first; this market is scaffolded”

### 5. Docs
- `docs/I18N_AUTH_MARKETS.md` — languages, auth modes, market list, honesty about GCI depth
- Update Help glossary: language selector, guest, market, index
- Update Package one-liner if needed

## Explicit non-goals

- Live exchange WebSocket feeds / paid market-data contracts  
- Full Nifty 500 / S&P 500 hand-labeled GCI on day one  
- OAuth Google/Microsoft (optional stub only)  
- Translating every Help term into 16 languages in v1  
- Buy/Hold or portfolio OMS  

## Acceptance criteria

- [ ] Header language selector lists Indian + global langs; UI chrome switches for `en` + at least `hi` fully; others fall back gracefully  
- [ ] Register, login, logout, guest work; preferences persist for registered users; guest prefs in session/local  
- [ ] `GET /api/markets` returns ≥8 markets; each has ≥1 index; indexes return constituents  
- [ ] Tracker can filter by market/index; India Sensex GCI still works  
- [ ] Meta documents `gci_deep_markets: ["IN"]`  
- [ ] `pytest` green; `npm run build` green  
- [ ] Disclaimer still visible; no investment-advice copy  

## Repo pointers

- Vernacular API: `backend/app/api/routes.py` (`/api/vernacular`)  
- Auth stub: `backend/app/services/rbac.py`, `/api/auth/sso/*`  
- Universe: `backend/app/data/universe.py`, `/api/universe/nifty`  
- Shell: `frontend/src/App.tsx`  
- Prior prompts: `docs/prompts/PROFESSIONAL_SITE_PROMPT.md`, `docs/prompts/GCI_PARAMETERS_AND_SOURCES_PROMPT.md`

## Done definition

Language selector usable · guest/register/login with preferences · multi-market index navigation with India GCI depth preserved and honest scaffolding elsewhere.

---

## Short form

> Add CiteAlpha **(1)** header language selector for major Indian + global languages with i18n chrome, **(2)** register/login/guest auth with preferences (language, market, index, watchlist), **(3)** major world markets with flagship indexes and constituent stocks for navigation — India SENSEX stays deep GCI; other markets scaffolded/`demo_structured`. No live global terminal or Buy/Hold.
