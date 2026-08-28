# i18n · Auth · Markets

CiteAlpha ships three product layers on top of India-first GCI:

1. **Language selector** — UI chrome for major Indian + global languages  
2. **Register / login / guest** — lightweight identity with preferences  
3. **Major markets → indexes → constituents** — navigation scaffolding  

GCI math is unchanged by language. Deep labeled GCI remains **India (SENSEX)**.

## Languages

| Code | Language | Group |
|------|----------|-------|
| `en` | English (default) | — |
| `hi` | Hindi | India |
| `ta` `te` `kn` `ml` `mr` `gu` `bn` `pa` | Other Indian | India |
| `ja` `zh` `ar` `es` `fr` `de` `pt` | Global desks | Global |

- Header `<LanguageSelect />` persists to `localStorage` and `PUT /api/auth/preferences` when authenticated.
- Phase 1 catalogs cover shell + kickers + common CTAs (`frontend/src/i18n/locales/`). **`en` + `hi` are full**; other codes fall back to English.
- `dir="rtl"` when `ar` is selected.
- GCI vernacular blurbs: `GET /api/vernacular/{id}?lang=` with `fallback: true` when a template is missing.
- Help glossary stays English (“glossary EN for now”).

## Auth modes

| Mode | Behavior |
|------|----------|
| Register | email + password (PBKDF2) + display name → Bearer session |
| Login | email + password → session |
| Guest | `POST /api/auth/guest` → ephemeral user; preferences in session; banner prompts register |
| API key | Existing `X-API-Key` for write/API (unchanged) |
| SSO | Stub only (`/api/auth/sso/*`) — “coming soon” |

**Endpoints:** `POST /api/auth/register|login|guest|logout`, `GET /api/auth/me`, `GET|PUT /api/auth/preferences`.

**Preferences:** `language`, `default_market`, `default_index`, `watchlist`, `show_demo_tape`, `density`.

Guest preferences merge into the registered account when `guest_token` is passed on register. Auth does **not** imply SEBI RA / advice entitlement — disclaimer remains visible.

## 5-year demo history

Deterministic monthly closes for every flagship index and constituent (`GET /api/markets/{id}/history`, `/api/indexes/{id}/history`, `/api/stocks/{id}/history`). Labeled demo — **not** live quotes and **not** GCI inputs. Meta: `history_years: 5`, `history_kind: demo_deterministic`.

## Top-1000 market universes

Each market ships a deterministic **top-1000** scaffold universe (`market_universe_size: 1000`). Primary indexes (e.g. SPX, FTSE100, IN1000) expose all 1000; India **SENSEX** stays the 30-name deep GCI path. Not official exchange membership files.

## Markets & indexes

| Market | Code | Flagship indexes |
|--------|------|------------------|
| India | `IN` | SENSEX, NIFTY 50, NIFTY Bank |
| United States | `US` | S&P 500, Dow, Nasdaq-100 |
| United Kingdom | `GB` | FTSE 100 |
| Japan | `JP` | Nikkei 225, TOPIX |
| Hong Kong | `HK` | Hang Seng |
| China | `CN` | CSI 300, Shanghai Composite |
| Eurozone | `EU` | Euro Stoxx 50, DAX, CAC 40 |
| Singapore | `SG` | STI |
| Australia | `AU` | ASX 200 |
| South Korea | `KR` | KOSPI 200 |
| Brazil | `BR` | Bovespa |
| Canada | `CA` | TSX 60 |

**APIs:** `GET /api/markets`, `GET /api/markets/{id}/indexes`, `GET /api/indexes/{id}/constituents`, `GET /api/companies?market=&index=`.

**Honesty:** Meta includes `gci_deep_markets: ["IN"]`. Non-India constituents use `data_quality: market_scaffold`. Tracker shows a scaffold banner outside India. Demo tape stays labeled demo — not live quotes.

## Non-goals

- Live exchange WebSockets / paid market-data contracts  
- Full S&P 500 / Nifty 500 hand-labeled GCI on day one  
- OAuth / email verification / password-reset SMTP  
- Translating the entire Help glossary into 16 languages in v1  
- Buy/Hold or portfolio OMS  
