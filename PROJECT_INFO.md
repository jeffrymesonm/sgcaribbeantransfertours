# PROJECT_INFO — SG Caribbean Transfers & Tours

> Last updated: 2026-07-20 UTC

## What it is
A small conversion-focused marketing **site** (five static pages, one shared
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
destinations), `excursions.html` (7
private day-tour panels: Punta Rusia, 27 Charcos, Whale Watching, City Tour,
Beach Experiences, ATV Adventure, Dune Buggy Adventure), `cruises.html` (3
shore-excursion cards for cruise passengers), `nosotros.html` ("Meet the
team": company story, driver team, fleet — split out of `index.html` on
2026-07-20).

## Stack
- Static site: HTML5 + CSS3 + vanilla JavaScript (ES2020). No framework, no build step.
- Fonts: Google Fonts — Fraunces (display), Archivo (body), IBM Plex Mono (ticket data).
- Images: all photos are local files in `img/` (team/fleet photos from the owner + stock photos for the remaining sections — see `DOCS/DEPLOYMENT.md` go-live checklist for which are still placeholders).
- No backend. Conversion channel is **WhatsApp deep links** (`wa.me`), number `+1 829-627-7733`.

## Files
| Path | Purpose |
|------|---------|
| `index.html` | Home page: hero, services-picker section, why-us, gallery, reviews, FAQ, book CTA, service-picker `<dialog>` popup (backdrop shows the logo as a watermark). SEO meta + JSON-LD (TravelAgency + FAQPage) |
| `transfers.html` | Hero + services + fixed-price Popular Routes ticket rail (9 tickets) + boarding-pass price calculator (also covers ~50 fixed fares from Puerto Plata Airport, via a "Fixed destinations" optgroup) + trust strip. JSON-LD (Service + BreadcrumbList) |
| `excursions.html` | Hero + 7 excursion cards (Punta Rusia, 27 Charcos, Whale Watching, City Tour, Beach Experiences, ATV Adventure, Dune Buggy Adventure) + trust strip. JSON-LD (ItemList/TouristTrip + BreadcrumbList) |
| `cruises.html` | Hero + guaranteed-return promise band + 3 template cruise cards (optional ship name + departure time) + trust strip. JSON-LD (ItemList/TouristTrip + BreadcrumbList) |
| `nosotros.html` | Hero banner + company-story intro (logo + copy) + driver team grid + fleet grid + book CTA. JSON-LD (BreadcrumbList) |
| `css/styles.css` | All styles — mobile-first, design tokens, animations |
| `img/` | All site photos: real team/fleet/logo/banner photos from the owner, plus stock photos for hero/gallery/cards still pending owner replacement (descriptive filenames — see DEPLOYMENT.md) |
| `js/i18n.js` | EN/ES/FR dictionary + language switcher, per-page meta (`meta.<page>.*` via `data-page`) — see DEVELOPER_GUIDE.md |
| `js/config.js` | Business config: `CONFIG.whatsappNumber`, `AIRPORTS`, `PROVINCES`, `VEHICLES`, pricing constants, `LUGGAGE_FREE_LIMIT`/`LUGGAGE_EXTRA_FEE_USD`, `haversineKm`/`estimateRoute` — **the single file to edit for numbers** |
| `js/core.js` | Shared utilities: `animatePrice`, `formatDuration`, `whatsappLink`, `prefersReducedMotion` |
| `js/cart.js` | Cart state/panel/checkout — versioned `localStorage` (`sariel-cart`, v3), per-item trip details (flight/date/luggage per transfer, date per excursion) + per-item quantity/luggage editing, `describeCartItem`, `buildCartMessage` |
| `js/shell.js` | Header, mobile nav, scroll reveals, parallax, counters, FAQ accordion, WhatsApp links — loaded on all 5 pages |
| `js/calculator.js` | Transfer price calculator — `transfers.html` only |
| `js/tours.js` | Guest-count pricing + Add to Cart for excursion/cruise cards — `excursions.html` and `cruises.html` |
| `js/service-picker.js` | Home-only first-visit service-picker `<dialog>` |
| `sitemap.xml` | 5 URLs (home + 4 service/company pages) |
| `robots.txt` | Allow-all + sitemap pointer |

`js/main.js` no longer exists — it was split into the 8 modules above.
See `DOCS/DEVELOPER_GUIDE.md` for the per-page script-loading table.

## Configuration
- `js/config.js` → `CONFIG.whatsappNumber`: real number `18296277733`
  (+1 829-627-7733). Single edit point; loaded on every page, so one change
  updates the WhatsApp link everywhere (FAB, footer, cart checkout,
  direct-chat CTA). Contact email `sg.caribbeantransferstours@gmail.com` is
  `CONFIG.contactEmail` (feeds the generic "Email Us" CTA) and also
  hardcoded in each page's footer (`mailto:` link) — update in all 5 HTML
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
- Canonical/OG URL (real domain, set 2026-07-20): `https://caribbeansgtransfertours.com/`
  (appears on all five pages, plus `sitemap.xml` and `robots.txt`).
- `js/i18n.js` → all page text (`en`/`es`/`fr` dictionaries) — see
  `DOCS/USER_MANUAL.md` for how to edit copy in any language.

## Scripts / How to run
No build. Open `index.html` directly, or serve locally:
```
python -m http.server 8734
```

## Deploy
Any static host (Netlify, Vercel, GitHub Pages, cPanel). See `DOCS/DEPLOYMENT.md`.
