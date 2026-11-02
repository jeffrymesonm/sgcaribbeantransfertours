# PROJECT_INFO — SG Caribbean Transfers & Tours

> Last updated: 2026-11-02 UTC

## What it is
A small conversion-focused marketing **site** (six static pages, one shared
shell) for **SG Caribbean Transfers & Tours**, a private transfers & tours
company in Puerto Plata, Dominican Republic (north coast). Target audience:
international tourists arriving at POP/STI/SDQ/PUJ/AZS airports, plus cruise
passengers docking at Amber Cove / Taino Bay. **Trilingual (English /
Español / Français)** via a header language switch that works identically
on every page. Always opens in English on a new visit — the visitor's
choice is remembered only for the rest of that browser session (see
`js/i18n.js`).

Pages: `index.html` (home — hero, services picker, gallery, why-us,
reviews, FAQ, talk-to-us CTA, first-visit service-picker popup),
`transfers.html` (fixed-price Popular Routes ticket rail + airport transfer
price calculator, which also covers ~50 more fixed Puerto-Plata-Airport
destinations, plus the quote-only full-day driver service), `excursions.html` (7
private day-tour panels: Punta Rusia, 27 Charcos, Whale Watching, City Tour,
Beach Experiences, ATV Adventure, Dune Buggy Adventure), `cruises.html` (3
shore-excursion cards for cruise passengers), `nosotros.html` ("Meet the
team": company story, driver team, fleet — split out of `index.html` on
2026-07-20), `sosua.html` (Sosúa destination hub, added 2026-08-12 — the
site's SEO / answer-engine page: quick-answer fact block, airport-to-Sosúa
fare table, arrival steps, cruise-port section, 4-way comparison table,
nearby attractions, 10-item FAQ).

## Stack
- Static site: HTML5 + CSS3 + vanilla JavaScript (ES2020). No framework.
- **One generated step:** `python tools/build-langs.py` renders `/es/` and `/fr/` from the English pages plus the dictionary in `js/i18n.js`, and rewrites `sitemap.xml`. Nothing else is generated; the English pages stay hand-written.
- Fonts: Google Fonts — Fraunces (display), Archivo (body), IBM Plex Mono (ticket data).
- Images: all photos are local files in `img/` (team/fleet photos from the owner + stock photos for the remaining sections — see `DOCS/DEPLOYMENT.md` go-live checklist for which are still placeholders).
- No backend. Conversion channel is **WhatsApp deep links** (`wa.me`), number `+1 829-627-7733`.
- Measurement: GA4 `G-P5B6J8Y75V` in each page's `<head>`, plus Google Ads conversion `AW-18346905448` set in `CONFIG.googleAdsConversion` (`js/config.js`).

## Files
| Path | Purpose |
|------|---------|
| `index.html` | Home page: hero, services-picker section, why-us, gallery, reviews, FAQ, book CTA, service-picker `<dialog>` popup (backdrop shows the logo as a watermark). SEO meta + JSON-LD (TravelAgency + FAQPage) |
| `transfers.html` | Hero + services + fixed-price Popular Routes ticket rail (9 tickets) + boarding-pass price calculator (also covers ~50 fixed fares from Puerto Plata Airport, via a "Fixed destinations" optgroup) + quote-only full-day driver section (`#full-day-driver`) + **static "Every fixed fare" tables (`#fares`, 25 POP rows + 5 other-airport rows)** + trust strip. JSON-LD (Service with a 30-offer OfferCatalog + BreadcrumbList + FAQPage). **The `#fares` tables are literal text — keep in sync with `js/config.js`** |
| `excursions.html` | Hero + 7 excursion cards (Punta Rusia, 27 Charcos, Whale Watching, City Tour, Beach Experiences, ATV Adventure, Dune Buggy Adventure) + trust strip. JSON-LD (ItemList/TouristTrip + BreadcrumbList) |
| `cruises.html` | Hero + guaranteed-return promise band + 3 template cruise cards (optional ship name + departure time) + trust strip. JSON-LD (ItemList/TouristTrip + BreadcrumbList) |
| `nosotros.html` | Hero banner + company-story intro (logo + copy) + driver team grid + fleet grid + book CTA. JSON-LD (BreadcrumbList) |
| `privacy.html` | Privacy policy: data collected, cookie table, providers, rights. Linked from every footer |
| `puerto-plata.html` | Puerto Plata / Playa Dorada hub — the airport city and cruise city. POP US$38.95 confirmed; other airports "On request". Hero: `img/puerto-plata.jpg`, the Christ statue on Pico Isabel de Torres over the city |
| `cofresi.html` | Cofresí / Costambar hub — Ocean World, resort strip west of the city. POP US$48.50 confirmed. **The only hub without a real photo of its place** — hero is a generic resort shot |
| `rio-san-juan.html` | Río San Juan / Playa Grande hub — Gri-Gri lagoon, Atlantic beaches. POP US$98.50 confirmed |
| `las-terrenas.html` | Las Terrenas / Samaná hub — nearest airport is AZS but only the POP fare (US$178.50) is confirmed; page says so. States plainly that it does **not** fit a Puerto Plata port call |
| `cabarete.html` | Cabarete destination hub (SEO/AEO/GEO), added 2026-08-21 — same structure as `sosua.html`, generated from it. Fares: POP US$33.95 and STI US$98.95 confirmed; AZS/SDQ/PUJ shown as "On request" because no fare is confirmed. **Publishes no distances or drive times** (owner decision 2026-08-21) — places are described by position and character instead. Hero image is a placeholder, not a photo of Cabarete |
| `sosua.html` | Sosúa destination hub (SEO/AEO/GEO): hero + quick-answer fact block + 5-airport fare table + 3 arrival steps + Amber Cove/Taino Bay section + 4-way comparison table + 6 nearby attractions + 10-item FAQ + book CTA. JSON-LD (TouristDestination + Service/OfferCatalog + FAQPage + BreadcrumbList). **Fares are literal text — keep in sync with `js/config.js` and `transfers.html`** |
| `css/styles.css` | All styles — mobile-first, design tokens, animations |
| `img/` | All site photos: real team/fleet/logo/banner photos from the owner, plus stock photos for hero/gallery/cards still pending owner replacement (descriptive filenames — see DEPLOYMENT.md) |
| `js/i18n.js` | EN/ES/FR dictionary + language switcher, per-page meta (`meta.<page>.*` via `data-page`) — see DEVELOPER_GUIDE.md |
| `js/config.js` | Business config: `CONFIG.whatsappNumber`, `AIRPORTS`, `PROVINCES`, `VEHICLES`, pricing constants, `LUGGAGE_FREE_LIMIT`/`LUGGAGE_EXTRA_FEE_USD`, `haversineKm`/`estimateRoute` — **the single file to edit for numbers** |
| `js/core.js` | Shared utilities: `animatePrice`, `formatDuration`, `whatsappLink`, `prefersReducedMotion` |
| `js/consent.js` | Google Consent Mode defaults and cookie banner. Blocking script in `<head>`, above gtag. Also blocks Agendaterd's GA4 property |
| `js/cart.js` | Cart state/panel/checkout — versioned `localStorage` (`sariel-cart`, v3), per-item trip details (flight/date/luggage per transfer, date per excursion) + per-item quantity/luggage editing, `describeCartItem`, `buildCartMessage` |
| `js/shell.js` | Header, mobile nav, scroll reveals, parallax, counters, FAQ accordion, WhatsApp links — loaded on all 6 pages |
| `js/calculator.js` | Transfer price calculator — `transfers.html` only |
| `js/tours.js` | Guest-count pricing + Add to Cart for excursion/cruise cards — `excursions.html` and `cruises.html` |
| `js/service-picker.js` | Home-only first-visit service-picker `<dialog>` |
| `sitemap.xml` | 6 URLs (home + 4 service/company pages + `sosua.html`) |
| `robots.txt` | Allow-all + explicit allow blocks for the answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended…) + sitemap pointer |
| `llms.txt` | Plain-text brief for generative engines: entity facts, every fixed fare, tour prices, distances, page index. **Keep in sync with `js/config.js`** |
| `404.html` | Branded not-found page (GitHub Pages serves it automatically). Self-contained — no i18n/cart/shell scripts, `noindex, follow` |

`js/main.js` no longer exists — it was split into the 8 modules above.
See `DOCS/DEVELOPER_GUIDE.md` for the per-page script-loading table.

## Configuration
- `js/config.js` → `CONFIG.whatsappNumber`: real number `18296277733`
  (+1 829-627-7733). Single edit point; loaded on every page, so one change
  updates the WhatsApp link everywhere (FAB, footer, cart checkout,
  direct-chat CTA). Contact email `sg.caribbeantransferstours@gmail.com` is
  `CONFIG.contactEmail` (feeds the generic "Email Us" CTA) and also
  hardcoded in each page's footer (`mailto:` link) — update in all 6 HTML
  files if it ever changes.
- `js/config.js` → `CONFIG.formspreeEndpoint`: `https://formspree.io/f/xbdnzrez`
  — where the cart's "Send via Email" checkout button posts (see
  `submitBookingEmail()` in `js/core.js`). Delivers straight to the owner's
  inbox with no visitor mail client required; manage the recipient address
  from the Formspree dashboard, not from this file.
- `js/config.js` → `AIRPORTS` / `PROVINCES` / `VEHICLES` / pricing constants
  (`PRICE_BASE_USD`, `PRICE_PER_KM_USD`, `ROAD_WINDING_FACTOR`,
  `AVG_ROAD_SPEED_KMH`): distance-estimated price/duration model used by the
  calculator (`transfers.html`) for any airport→province route not covered
  by a fixed Popular Route ticket, and by the cart when re-pricing a
  `kind:'transfer'` line item.
- `transfers.html` → the **Popular Routes ticket rail** (`.routes`) holds 9
  real fixed prices (not calculator-derived) for the routes the business
  actually sells: POP/STI/SDQ/PUJ/AZS → Sosúa/Cabarete/Puerto Plata, all 1–6
  guests. Each ticket button carries `data-fixed-from`/`data-fixed-to`
  (i18n place keys) + `data-fixed-price` (literal USD, may include cents,
  e.g. `5.50`). `js/calculator.js` reads these and calls
  `addToCart({kind:'fixedRoute', ...})` — see `js/cart.js` `describeCartItem`.
  To add/change a route, edit the ticket markup directly (no calculator
  formula involved).
- `js/config.js` → `POP_PROVINCE_FIXED_FARES` / `POP_FIXED_DESTINATIONS`:
  ~50 more confirmed fixed fares from Puerto Plata Airport only, merged
  directly into the calculator's Destination dropdown (a "Fixed
  destinations" `<optgroup>` in `transfers.html`) rather than a separate
  list — `resolveFixedFare()` in `js/calculator.js` checks these before
  falling back to the distance formula. See `DOCS/USER_MANUAL.md`
  "Changing prices".
- `js/config.js` → `LUGGAGE_FREE_LIMIT` (10) / `LUGGAGE_EXTRA_FEE_USD` (15):
  each transfer's own suitcase count adds this flat fee **to that transfer's
  price** when it exceeds the free limit (per vehicle, not per order) — via
  the shared `luggageSurcharge()` helper, folded in by `describeCartItem()`.
- `excursions.html` → excursion prices live in each `<article class="exc">`'s
  `data-prices` attribute (guest count → total USD). Guest count range
  varies per card (e.g. Punta Rusia is 4–6 only, City Tour/others are 2–6).
  Add `data-decimals="2"` on the `<article>` when prices carry cents (e.g.
  Punta Rusia's $123.95/person tiers) — `js/tours.js` reads it to format
  the animated price correctly.
- `cruises.html` → the 3 cruise cards use the same `data-prices` attribute,
  currently all placeholder `0`s — **fill with real per-guest totals before
  going live** (see `DOCS/USER_MANUAL.md`).
- `js/core.js` → `formatMoney(n)`: shared USD formatter — whole numbers
  render bare (`"65"`), amounts with cents always show 2 decimals
  (`"23.95"`, never `"23.9"`). Used everywhere a cart/total price is
  rendered as text (`js/cart.js`).
- Per-page SEO meta: `js/i18n.js` keys `meta.<page>.title` / `meta.<page>.description`,
  resolved from each page's `<body data-page="home|transfers|excursions|cruises|nosotros">`.
- Canonical/OG URL (real domain, set 2026-07-20): `https://caribbeansgtransferstours.com/`
  (appears on all six pages, plus `sitemap.xml` and `robots.txt`).
- `js/i18n.js` → all page text (`en`/`es`/`fr` dictionaries) — see
  `DOCS/USER_MANUAL.md` for how to edit copy in any language.

## Scripts / How to run
Open `index.html` directly, or serve locally:
```
python -m http.server 8734
```

After editing any English page or any string in `js/i18n.js`:
```
python tools/build-langs.py     # re-render /es/ and /fr/ + sitemap.xml
python tools/verify.py          # 30+ static checks across all three languages
```
`build-langs.py` needs Node on PATH (it evaluates the dictionary literal). Both are safe to re-run: the output is identical if nothing changed.

## Deploy
Any static host (Netlify, Vercel, GitHub Pages, cPanel). See `DOCS/DEPLOYMENT.md`.
