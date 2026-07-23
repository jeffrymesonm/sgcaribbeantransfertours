# DEVELOPER_GUIDE — SG Caribbean Transfers & Tours site

> Last updated: 2026-07-19 UTC (manual/custom group size + quote-request fallback on excursion cards)

## Architecture
Static **five-page** site, no dependencies, no build step. Every page shares
one header/cart-drawer/footer shell and one JS/i18n core; only the `<main>`
content and the per-page script list differ.

```
index.html         Home: hero + #services-picker + gallery + why-us +
                    reviews + FAQ + book CTA + service-picker <dialog> popup
transfers.html      Hero + services + Popular Routes ticket rail (9 tickets) +
                    full destination price list (50 fixed fares) +
                    boarding-pass price calculator + trust strip
excursions.html      Hero + 7 excursion cards + trust strip
cruises.html          Hero + guaranteed-return band + 3 template cruise cards + trust strip
nosotros.html          "Meet the team" (2026-07-20, split out of index.html's
                        old #about): hero banner + company intro + team grid +
                        fleet grid (real photos from img/) + book CTA
css/styles.css      Design tokens + all styles (mobile-first)
js/i18n.js           EN/ES/FR dictionary + t()/getLang()/setLang() + per-page meta (loads first)
js/config.js         CONFIG (WhatsApp number) + AIRPORTS/PROVINCES/VEHICLES + pricing model
js/core.js            Shared utilities: animatePrice, formatDuration, whatsappLink, prefersReducedMotion
js/cart.js             Cart state/panel/checkout (versioned localStorage)
js/shell.js              Header, mobile nav, reveals, parallax, counters, FAQ accordion, WhatsApp links
js/calculator.js          Transfer calculator (transfers.html only)
js/tours.js               Excursion/cruise guest-pricing + Add to Cart (excursions.html, cruises.html)
js/service-picker.js      Home-only first-visit service <dialog> (index.html only)
```

`js/main.js` (the pre-refactor 31 KB monolith) was **deleted** and its
responsibilities split across the 8 modules above — see "JS modules" and
"Per-page script loading" below.

### Site structure: 5 pages, 1 shared shell
Every page's `<body>` starts with the same header (brand, `site-nav`,
language switch, cart button, mobile-nav toggle), the same cart drawer
(`#cartScrim` / `#cartPanel`), and ends with the same footer + floating
WhatsApp button. Only `<main>` differs. This means:
- Cart state (`localStorage['sariel-cart']`) and language choice
  (`localStorage['sariel-lang']`) are shared across all 5 pages — add a
  transfer on `transfers.html`, then open the cart on `cruises.html`, and
  the item is still there.
- Any shell change (header markup, cart drawer markup, footer) must be
  applied to **all five** HTML files by hand — there's no templating/include
  mechanism. Keep them byte-for-byte identical outside the per-page bits
  (`data-page`, `aria-current`, JSON-LD, `<main>` content).

### Navigation + aria-current
`site-nav` (desktop) and `mobile-nav` (mobile) on all 5 pages link:
Transfers → `transfers.html`, Excursions → `excursions.html`,
Cruises → `cruises.html`, Meet the team → `nosotros.html`,
FAQ → `index.html#faq`. The old single-page "Prices" link is gone (prices
now live on `transfers.html`/`excursions.html`/`cruises.html` directly), and
the header "Reviews" link was replaced by "Meet the team" on 2026-07-17 —
reviews remain reachable via each page's footer (`#reviews` is a per-page
section, so the footer link stays local). **"Meet the team" pointed at
`index.html#about` until 2026-07-20**, when the team/fleet content moved to
its own page (`nosotros.html`) — the link now goes there directly on all 5
pages (including a self-referencing `aria-current="page"` link from
`nosotros.html` itself).
Each service page marks its own nav link `aria-current="page"` in both the
desktop and mobile nav (`transfers.html`/`excursions.html`/`cruises.html`/
`nosotros.html`); `index.html`'s nav has no self-link to mark (Reviews/FAQ
are anchors on the home page itself, not a "Home" link).

### JS modules
| Module | Responsibility |
|--------|---------------|
| `js/i18n.js` | `I18N` dictionary, `t()`/`getLang()`/`setLang()`, `applyStaticTranslations()` (resolves per-page `meta.<page>.title/description` from `data-page`) |
| `js/config.js` | `CONFIG.whatsappNumber` (**edit before go-live**), `AIRPORTS`, `PROVINCES`, `VEHICLES`, pricing constants, `haversineKm()`, `estimateRoute()` |
| `js/core.js` | `animatePrice()` (blur + count tween, concurrency-safe via `el._priceToken`), `formatDuration()`, `whatsappLink()`, `prefersReducedMotion` |
| `js/cart.js` | Cart state (`cartItems`, versioned `localStorage`), `addToCart`/`removeFromCart`/`clearCart`/`cartTotal`/`describeCartItem`/`renderCart`/`openCart`/`closeCart`/`buildCartMessage`, drawer wiring (`initCart`) |
| `js/shell.js` | `initHeader` (solid-on-scroll + mobile nav), `initReveals`, `initParallax`, `initCounters`, `initFaq`, `initWhatsAppLinks` (FAB/footer/direct-chat CTA + year) |
| `js/calculator.js` | `initCalculator` — quote logic, auto vehicle upgrade, route-ticket sync, "Add to Cart" wiring (transfers only) |
| `js/tours.js` | `initTours` — guest-count pricing per `.exc` panel + "Add to Cart" wiring; reads optional `.cruise-ship`/`.cruise-departure` inputs when present (cruise cards reuse the excursion `.exc` markup) |
| `js/service-picker.js` | `initServicePicker` — home-only `<dialog>`, session-scoped |

### Per-page script loading
All `<script>` tags are `defer`, loaded in this order (later modules depend
on earlier ones — see each module's header comment):

| Page | Scripts |
|------|---------|
| `index.html` | i18n → config → core → cart → shell → **service-picker** |
| `transfers.html` | i18n → config → core → cart → shell → **calculator** |
| `excursions.html` | i18n → config → core → cart → shell → **tours** |
| `cruises.html` | i18n → config → core → cart → shell → **tours** |

`i18n`, `config`, `core`, `cart` and `shell` are identical on every page —
only the last script (the page's own feature module) changes.

## Trilingual content (EN/ES/FR)
The site is fully trilingual via a client-side switcher — no separate URLs
per language (see "Known limitation" below), one dictionary file
(`js/i18n.js`) shared by all four HTML documents. `SUPPORTED_LANGS = ['en',
'es', 'fr']` at the top of `js/i18n.js` is the single source of truth for
which languages exist — `setLang()` validates against it and `t()`'s
fallback chain (`I18N[currentLang][key] ?? I18N.en[key] ?? key`) means a
key missing from `fr` silently shows English rather than breaking, so
always cross-check key counts after editing (see "To add a new trilingual
string" below).

- **Static text** (headings, buttons, FAQ, etc.): tagged with
  `data-i18n="key"` in each page's markup. `applyStaticTranslations()` in
  `js/i18n.js` sets `el.innerHTML = t(key)` for every such element — the
  dictionary value may contain safe inline markup (`<em>`, `<br>`, `<strong>`)
  since it's a trusted static source, never user input.
- **Attributes** (aria-label, placeholder): `data-i18n-attr="attr:key"`,
  or `"attr1:key1|attr2:key2"` for more than one. These go through
  `setAttribute()`, which does **not** decode HTML entities — dictionary
  values used this way (and `meta.<page>.title`, set via `document.title`)
  must use literal `&`, never `&amp;`. Values that go through `innerHTML`
  are the only place `&amp;` is correct.
- **Per-page meta**: each page declares `<body data-page="home|transfers|
  excursions|cruises">`. `applyStaticTranslations()` reads that attribute
  (falling back to `"home"` if absent) and resolves `meta.<page>.title` /
  `meta.<page>.description` for `document.title`, `<meta name="description">`
  and the `og:title`/`og:description` tags. Adding a 5th page means adding a
  new `meta.<newpage>.title`/`.description` pair to **all three** of `en`,
  `es` and `fr`.
- **JS-generated content** (calculator, cart, WhatsApp messages): any module
  calls the global `t(key, vars)` — `vars` interpolates `{token}` placeholders,
  e.g. `t('calc.upgradeNote', { pax, vehicle })`. `AIRPORTS`/`PROVINCES` store
  a `nameKey`, `VEHICLES` store a `labelKey` (all in `js/config.js`), resolved
  via `t()` at render time instead of hardcoded strings.
- **Language switch**: three `.lang-btn` elements (`data-lang="en"/"es"/"fr"`)
  in `.header-actions`, wired in `js/i18n.js`, present identically on all
  four pages. Clicking calls `setLang()`, which persists the choice to
  `sessionStorage['sariel-lang']` (**not** `localStorage`), re-runs
  `applyStaticTranslations()`, and dispatches `sariel:langchange` on
  `document` — `js/cart.js` (`renderCart`), `js/shell.js` (mobile-menu
  aria-label, WhatsApp FAB/footer/direct-chat links) and `js/calculator.js`
  (`update()`) all listen for that event and re-render. Default language is
  always English — matches the non-JS markup (avoids a flash on first load)
  and, per an explicit owner request, every *new* visit/session must greet
  the visitor in English regardless of any earlier choice. `sessionStorage`
  is what makes both true at once: the choice still follows the visitor
  across all four pages while they browse (shared key, same tab), but a
  closed tab or a new day starts fresh in English again — `localStorage`
  would have remembered a language forever instead.
- **Cart item slugs**: excursion/cruise "Add to Cart" buttons carry a stable
  `data-service-key` (e.g. `paradise-island`, `cruise-1`) plus a
  `data-title-key` (e.g. `exc1.title`, `cruise1.title`) that `js/tours.js`
  reads into the cart item; `describeCartItem()` in `js/cart.js` resolves
  the title via `t(item.titleKey || item.serviceKey)` — language-independent
  and always re-translates correctly, including after a language switch
  while the cart drawer is open.
- **JSON-LD stays English-only** — it matches each page's default rendered
  language; translating structured data dynamically isn't worth the complexity.
- To add a new trilingual string: add the key to **all three** of `en`, `es`
  and `fr` in `js/i18n.js`, then reference it via `data-i18n`/`data-i18n-attr`
  in HTML or `t('your.key')` in the relevant JS module. French place/province
  names stay in Spanish spelling (e.g. "Sosúa", "Puerto Plata") — standard
  practice in French-language Caribbean tourism material, only the generic
  administrative words translate (e.g. "Distrito Nacional" → "District
  National").

### Known limitation: one URL, three languages
Language is switched entirely client-side on the same URL (no `/es/`/`/fr/`
path, no `?lang=` param) — an intentional simplicity trade-off for this
build, but it means search engines only ever see and index the **English**
version of each page (the default, non-JS-rendered markup). Per-language
URLs are explicitly out of scope for this build; if SEO for Spanish- or
French-speaking search traffic becomes a priority, that would require a
separate routing/build decision, not a small patch to `js/i18n.js`.

## Design system (css/styles.css `:root`)
| Token | Value | Use |
|-------|-------|-----|
| `--abyss` | #06262E | dark sections, primary buttons, headers |
| `--ocean` | #0B5D6B | brand teal, headings accent |
| `--lagoon` | #17A398 | links, eyebrows, checkmarks |
| `--sand` | #F3EDE2 | alternating section background |
| `--shell` | #FCFAF5 | page background, text on dark |
| `--gold` | #C2933E | stars, prices, accents on dark |

Type: **Fraunces** (display, weights 340/420/560 + italic), **Archivo** (body),
**IBM Plex Mono** (`.mono` — ticket data, eyebrows, stats labels).

Signature element: **boarding-pass motif** — route tickets (`.ticket`) and the
calculator result (`.boarding-pass`) with dashed perforation + edge notches.

### Local images (img/)
The home `#about` section is the first to use **real photos** instead of
Unsplash hotlinks. They live in `img/` and are web-prepared copies of the
owner's originals in `Nueva carpeta/`: resized (≤1500px long side), re-encoded
at JPEG q82 and **EXIF-stripped** (phone originals carry GPS) via a PowerShell
System.Drawing pass that also bakes in EXIF orientation. Never reference
`Nueva carpeta/` from markup — process into `img/` instead. Team cards crop to
a uniform `aspect-ratio: 4/5` (`object-fit: cover`), fleet cards to `4/3`; all
`<img>` tags carry `width`/`height` (no CLS) + `loading="lazy"`. Leuris' card
is a `.team-photo-placeholder` monogram (no photo yet — swap instructions in
USER_MANUAL). The fleet figures reuse `.masonry-item` (caption overlay + hover
zoom) inside a `.fleet-grid`, normalized by `.fleet-item`.

## Motion rules (from Emil Kowalski's design-engineering skill)
- Custom curves only: `--ease-out: cubic-bezier(0.23,1,0.32,1)`,
  `--ease-in-out: cubic-bezier(0.77,0,0.175,1)`.
- Enter animations use ease-out; UI transitions ≤300 ms; marketing reveals ≤900 ms.
- Only `transform`/`opacity` animated on scroll paths; hover effects gated by
  `@media (hover: hover) and (pointer: fine)`; `:active { scale(0.97) }` on buttons.
- `prefers-reduced-motion`: reveals become static, parallax/zoom disabled.

## Cart
Every "add"/"reserve" action across the site (route tickets, the calculator,
excursion/cruise cards) adds a line item to a cart instead of navigating
anywhere — there is no per-item booking form. The cart is the single path to
a WhatsApp conversion; each page's own `#book` section is just a "talk
directly" fallback (`#bookDirectCta`) for visitors who'd rather not use the
cart at all. The cart drawer itself is part of the shared shell, so it's
identical and shared (via `localStorage`) across all four pages.

- **State**: top-level `cartItems` array in `js/cart.js`, persisted as a
  **versioned envelope** in `localStorage['sariel-cart']`:
  `{ v: CART_VERSION, items: [...] }` (`CART_VERSION = 2`). On load, anything
  that isn't `{v: 2, items: [...]}` — including the old unversioned v1 array
  shape — is discarded and the cart starts empty, rather than risking a
  crash on stale/malformed data. Bump `CART_VERSION` and adjust the load
  guard in `js/cart.js` any time the item shape changes again.
- **Item shapes**:
  `{kind:'transfer', pickupKey, destKey, vehicleId, passengers}` (price is
  *not* stored — recomputed live via `estimateRoute()`, so it never goes
  stale); `{kind:'excursion', titleKey, serviceKey, guests, price,
  shipName?, departureTime?}` (price *is* snapshotted — excursion/cruise
  pricing is a fixed table, not formula-derived); and
  `{kind:'fixedRoute', fromKey, toKey, price}` (also snapshotted — the
  Popular Routes tickets on `transfers.html`, e.g. POP→Sosúa $23.95. Exists
  *because* some of those destinations, like Sosúa/Cabarete, aren't
  provinces `estimateRoute()` knows about, so they can't use `kind:'transfer'`).
  `titleKey` replaced the old `EXCURSION_TITLE_KEYS` lookup map — the i18n key
  now travels with the item itself instead of being re-derived from
  `serviceKey` at render time.
  `shipName`/`departureTime` are optional, cruise-only fields (read from the
  `.cruise-ship`/`.cruise-departure` inputs on `cruises.html` — see
  `DOCS/USER_MANUAL.md` for how the owner fills in each card) that flow
  straight into the WhatsApp message when present.
- **Money formatting**: `formatMoney()` in `js/core.js` renders whole
  numbers bare (`"65"`) and amounts with cents at 2 decimals (`"23.95"`,
  `"495.80"`) — plain string interpolation would print `495.8` and drop the
  trailing zero. `describeCartItem()`'s callers (cart panel rows, cart
  total, `buildCartMessage()`) all go through it; `cartTotal()` also rounds
  its sum to 2 decimals to avoid float drift when adding decimal prices.
- **Core functions** (all top-level in `js/cart.js`, callable from any other
  module once `cart.js` has loaded): `addToCart`, `removeFromCart`,
  `clearCart`, `cartTotal`, `describeCartItem` (resolves an item to
  `{title, meta, price}` via `t()` — this is what makes the cart re-translate
  live, and what appends the ship/departure-time meta line for cruise items),
  `renderCart`, `openCart`/`closeCart`, `buildCartMessage`.
- **Wiring**: `initCart()` (bottom of `js/cart.js`) handles the drawer's
  open/close/Escape/scrim, delegated remove-button clicks, and checkout. The
  ticket/calculator "Add to Cart" buttons are wired inside `js/calculator.js`
  (`initCalculator`); the excursion/cruise "Add to Cart" buttons are wired
  inside `js/tours.js` (`initTours`) — each already has the relevant DOM refs
  and pricing data in scope, and just calls the top-level `addToCart()` +
  `openCart()`.
- **Per-item trip details** (reworked 2026-07-23, `CART_VERSION` bumped to
  3): flight number, flight/pickup date and suitcase count live **on each
  transfer item**, and an excursion date **on each excursion item** — edited
  inline in that item's cart row, not in the checkout footer. A cart can hold
  two transfers on different days with different flights, so one shared set
  of cart-level fields was wrong. `renderCart()` builds the inputs via
  `itemFieldsHtml(item)`; each input carries `data-field-id`/`data-field`
  (`flight`/`date`/`luggage`), and a single delegated `change` listener on
  `#cartItems` writes the value back to the item. `flight`/`date` save
  without a re-render (no price impact, so the input keeps its value/focus);
  `luggage` re-renders because it changes that item's price. Values are
  escaped via `escapeHtml()` before going into the row's `innerHTML`. The
  checkout footer now only collects `#cartName` (+ `#cartEmail` for the email
  path); `readCheckoutDetails()` returns just `{name, email}`. `#cartName`
  uses `canCheckout()` (native `required` + `reportValidity()` +
  `cart.nameRequired`).
- **Per-item luggage fee** (reworked 2026-07-23): there is no cart-level
  luggage field or `luggageFee()` anymore. Each transfer's own suitcase
  count folds one flat `luggageSurcharge(count)` (config.js:
  `LUGGAGE_FREE_LIMIT` 10 / `LUGGAGE_EXTRA_FEE_USD` 15, >10 → +$15) into
  **that item's** price inside `describeCartItem()` — physically each vehicle
  needs its own trailer, so two transfers each over 10 bags each add $15.
  `cartTotal()` is just the sum of item prices; no separate fee line. (This
  also removed a latent double-count: the old cart-level fee could stack on
  top of a calculator transfer that already had luggage baked in.)
- **Per-item quantity editing** (reworked 2026-07-23): each transfer/
  excursion row shows a labeled ±1 stepper (`miniStepper()`/`stepperHtml()`/
  `changeItemQty()`, `data-qty-minus`/`data-qty-plus` on the delegated click
  listener). `kind:'excursion'` steps its guest count, bounded to the keys
  its own snapshotted `prices` map has an exact rate for
  (`excursionGuestOptions()` — `js/tours.js`'s `buildItem()` carries the
  whole `prices`/`decimals` so the cart can reprice from any page).
  `kind:'fixedRoute'` steps its passenger count (1..`FIXED_ROUTE_PAX_MAX`
  15); the shown stepper appears only when `item.passengers != null`, which
  is now **every** fixedRoute — the calculator's Reserve flow sets the real
  count, and the Popular Routes ticket rail defaults it to 1 (see
  `js/calculator.js`). All fixedRoute items also carry `baseFare`, so
  `describeCartItem()` recomputes their price live as
  `fixedFarePrice(baseFare, passengers) + luggageSurcharge(luggage)` — the
  same shared config.js helpers the calculator prices with, flat for 1–6 and
  +per-passenger above 6 (consistent, since some ticket routes like
  Sosúa/Cabarete are also priced by the calculator). The `miniStepper`
  wrapper is a `<div>`, **not** a `<label>` — a label wrapping the buttons
  would forward its text-clicks to the first labelable descendant (the −
  button) and double-fire. The vestigial `kind:'transfer'` (no current UI
  path creates one; the calculator only ever produces `'fixedRoute'`, see
  the 2026-07-20 "La lista de 50 precios..." entry in
  `memory/decisions.md`) gets no stepper.
- **Checkout — 2-step, channel first, then its own fields**: `#cartPanelFooter`
  has two mutually-exclusive steps toggled via `[hidden]`. Step 1
  (`#cartChannelStep`, always shown when the cart opens — `resetChannel()` in
  `initCart()` resets to it) is just `#cartChooseWhatsApp`/`#cartChooseEmail`;
  clicking either calls `selectChannel('whatsapp'|'email')`, which hides step
  1, reveals step 2 (`#cartDetailsStep` — just the name field + total + one
  `#cartSend` button now that trip details are per-item), toggles
  `#cartEmailField`'s `hidden` (visible only for the email channel, since
  WhatsApp never needs it) and relabels `#cartSend`
  (`cart.checkout`/`cart.checkoutEmail`). `#cartChannelBack` calls
  `resetChannel()` to go back to step 1. `checkoutChannel` (module-local
  state in `initCart()`) drives all of this, including what `#cartSend`'s
  single click handler does: `'whatsapp'` opens `whatsappLink(...)` in a new
  tab; `'email'` posts to Formspree via
  `submitBookingEmail({name, email, subject, message})` in `js/core.js`
  (`async`/`await` + `fetch`, stays on the page). Both branches call
  `buildCartMessage({name, email})`, which lists every item with its own
  detail lines (`itemDetailLines()`: passengers/guests, flight, dates,
  luggage) — so the sent message mirrors exactly what the cart rows show.
  `readCheckoutDetails()` only reads `#cartEmail` when
  `checkoutChannel === 'email'` (empty string otherwise, so a WhatsApp send
  never carries a stale email value from a previous email attempt). `CONFIG.formspreeEndpoint` in `js/config.js`
  (`https://formspree.io/f/xbdnzrez`) is where the email checkout posts — the
  email input is validated inline only for that path (sent as Formspree's
  `_replyto` so the owner can reply straight to the visitor). The same
  endpoint also backs the "Email Us" contact dialog (js/shell.js); the 5
  footers' static `mailto:` links have the address hardcoded in HTML.
  `#cartStatus`
  (`role="status" aria-live="polite"`, `.cart-status.is-sending/.is-success/
  .is-error` in `css/styles.css`) shows inline "Sending…"/success/error
  feedback for the email path instead of navigating away — on success the
  cart clears in place; on error it's left intact so the visitor can retry or
  go back and pick WhatsApp instead. `.btn-outline` (CSS class) is the
  secondary-button style used for the "Email" channel option — `.btn-ghost`
  exists but is tuned for dark hero overlays, not the light cart-panel
  surface.
- To add a new "addable" item elsewhere on a page: give the button
  `type="button"` (not a link), read whatever local state it needs, call
  `addToCart({...})` + `openCart()`. Don't reintroduce a per-item form.

## Pricing model
Transfers: `AIRPORTS` (7 DR airports) × `PROVINCES` (all 31 + Distrito
Nacional) = 224 possible routes — too many to hand-maintain, so
`estimateRoute()` in `js/config.js` computes price/duration from each pair's
coordinates instead of a lookup table: Haversine distance × `ROAD_WINDING_FACTOR`
(1.35, straight-line → real road distance) → price (`PRICE_BASE_USD` +
`PRICE_PER_KM_USD`/km, rounded up to $5, $20 floor) and duration (at
`AVG_ROAD_SPEED_KMH`, 15 min floor), then `+ VEHICLES[tier].surcharge`. The
calculator (`transfers.html`) calls this on every input change, and
`describeCartItem()` in `js/cart.js` calls it again on every cart render —
so a transfer's price is always live, never stale, even if it sits in the
cart across a page navigation. To recalibrate pricing, tune the constants
above `estimateRoute()` in `js/config.js` — don't add per-route overrides
to `config.js`, that reintroduces the maintenance problem this formula
replaced. For the *specific* routes the business actually sells day to day
(north-coast towns + a few long-distance specials), `transfers.html` has a
separate **Popular Routes ticket rail** (`.routes`, above the calculator)
with 9 literal fixed prices instead — see "Cart" above (`kind:'fixedRoute'`).
The two systems coexist deliberately: the calculator covers the long tail
(any of 7 airports × 32 provinces), the ticket rail gives exact pricing for
the routes that matter most, including destinations like Sosúa/Cabarete
that aren't provinces at all.

**Fixed fares from Puerto Plata Airport, merged INTO the calculator**
(2026-07-20, revised same day): originally shipped as a separate static
`#price-list` table below the ticket rail, then **removed** — the owner
pointed out it produced two different prices for the same trip (the
calculator's formula vs. the list's fixed number for the same
POP→destination) and asked for exactly one place a price is shown, not two
systems that can disagree. All ~50 fixed POP fares now live in
`js/config.js` as two lookup tables, checked by `resolveFixedFare()` in
`js/calculator.js`:
- `POP_PROVINCE_FIXED_FARES` — overrides `estimateRoute()`'s formula price
  for an existing `PROVINCES` entry, keyed by its slug, **only when
  `calcPickup` is `'pop'`**. Covers destinations whose name is (near-)
  identical to a real province: Barahona, Dajabón, La Romana, La Vega,
  Puerto Plata, Samaná, San Pedro de Macorís, Santiago, Santo Domingo,
  Valverde, Monte Cristi.
- `POP_FIXED_DESTINATIONS` — everything else: towns/resorts too
  fine-grained to be their own province, keyed by a slug, selectable in
  `calcDest` as a new `<option value="fixed:<slug>">` inside a "Fixed
  destinations" `<optgroup>` (the existing 31 provinces got their own
  "Provinces" `<optgroup>`, `calc.provincesGroup`/`calc.fixedDestGroup`
  labels). Two entries — `sosua`/`cabarete` — use `nameKey` pointing at the
  existing `place.sosua`/`place.cabarete` i18n keys (they're also on the
  ticket rail); the other ~37 use a literal `name` string, same treatment
  as before (Dominican place names don't change across en/es/fr).

`resolveFixedFare(pickupVal, destVal)` returns `{price, name, code}` or
`null`. When non-null, `update()` in `calculator.js` treats it as a **flat**
fare — no vehicle surcharge, capped at 6 passengers (`paxEl.max = 6`), the
vehicle `<select>` is `disabled` (so it can't visually imply a price change
it won't produce), and the boarding pass hides duration (`—`, we have no
real distance data for these). Selecting a `fixed:` destination also
force-resets `calcPickup` back to `'pop'`, since these fares only exist from
that airport. Add-to-Cart for a resolved fixed fare goes in as
`kind:'fixedRoute'` (snapshotted), **not** `kind:'transfer'` — a `'transfer'`
item would ignore the override and re-derive the (wrong) formula price the
next time `describeCartItem()` runs.

Price *amounts* were sourced from a competitor's posted price sign ("Taxi
Sosúa-Cabarete") on 2026-07-20, undercut by a flat **$1.50**, then
owner-confirmed as real POP-origin prices (including the very cheap entries
like Sosúa $5.50 and Cabarete $13.50 — initially suspected as the
competitor's own *local* short-hop prices, not airport transfers, but the
owner confirmed they're real). That confirmation also fixed 3 pre-existing
Popular Routes tickets that had been contradicting the list: POP→Sosúa
($23.50→$5.50), POP→Cabarete ($33.95→$13.50), POP→Puerto Plata province
($38.95→$33.50). STI/SDQ/PUJ/AZS-origin tickets are unrelated (the sign is
POP-only) and were left untouched. See the project's own
`memory/decisions.md` (2026-07-20 entries) for the full reasoning, including
why the list was framed as Sosúa/Cabarete-origin initially and had to be
corrected to POP-origin before this merge even started.
Excursions/cruises: per-panel `data-prices='{"4":235,...}'` totals (private,
per group) on `excursions.html`/`cruises.html`. **Minimum group size is 4 on
every excursion/cruise card** (owner requirement — no excursion is sold to
groups smaller than 4), so `data-prices` and the guest-picker buttons only
ever go down to `"4"` — never re-add `"2"`/`"3"` keys or buttons. Cards go
up to 5 or 6 depending on what's actually offered (e.g. flat-price cards
like City Tour offer 4/5/6 since the price doesn't change by headcount).
Punta Rusia (`exc1`) needs `data-decimals="2"` on the `<article>` since its
rate has cents ($123.95/person) — `js/tours.js` reads that attribute to
pass the right `decimals` arg into `animatePrice()`. Cruise card `#cruise3`
currently ships with placeholder `{"4":0,"5":0}` values (see
`DOCS/USER_MANUAL.md`).

**Manual/custom group size, and the "request a quote" fallback:** every
card also has a `.guest-manual-input` (free-typed number, `min="4"`)
alongside the `.guest-btn` presets — for parties bigger than what's priced.
`js/tours.js`'s `selectGuests(n)` is the single path both a preset click
and manual typing go through: if `n` is an exact key in `data-prices`, it
behaves exactly like clicking that preset; if not, the card switches to a
"contact us for a quote" state (`.exc-price-amount`/`.exc-price-quote`
toggle via `hidden`, **not** an invented price — most cards only have exact
totals for 4 and 5 guests, and the per-guest rate usually isn't flat, so
extrapolating would risk quoting a wrong number) and the Add-to-Cart button
re-labels itself (`exc.requestQuote`) and, on click, opens
`whatsappLink(t('whatsapp.quoteRequest', {excursion, n}))` instead of
calling `addToCart()` — this bypasses the cart entirely for unpriced
counts rather than adding an item with a fake price. `renderAddBtnLabel()`
also re-runs on `sariel:langchange` since the button's label is set purely
in JS (not `data-i18n`) once a panel has toggled into the quote state.

## Service-picker dialog (home only)
`index.html` includes a native `<dialog id="serviceDialog">` (markup at the
end of the page, wired by `js/service-picker.js`) that asks first-time
visitors which service they want, then routes them to the matching page.

- **Shows once per session**: guarded by `sessionStorage['sariel-service-picked']`
  — if that key is already set, `initServicePicker()` returns immediately and
  the dialog never opens. It opens via `dialog.showModal()` on the frame
  after first render (`requestAnimationFrame`), so it doesn't compete with
  the initial paint.
- **Choosing a service**: each `.service-option` is a real `<a href="transfers.html
  |excursions.html|cruises.html">` — clicking one stores the pick in
  `sessionStorage['sariel-service']` and marks the session as asked, then lets
  the browser navigate normally (no `preventDefault()`).
- **Closing without choosing**: the × button, the "Browse everything" button,
  Esc (native `<dialog>` `cancel` event) and a backdrop click (checked via
  `event.target === dialog`, since the backdrop is the dialog element itself)
  all close the dialog and mark the session as asked — none of them navigate,
  since the copy below (`#services-picker`) is still visible on the home page.
- **No-JS / no-`<dialog>`-support degradation**: `initServicePicker()` bails
  out immediately if `dialog.showModal` isn't a function, and the popup
  markup itself has no fallback rendering — visitors simply never see it and
  land on the always-present `#services-picker` section instead, which offers
  the same three destinations as plain links. Nothing is lost, just the
  proactive prompt.
- Copy for the popup and the `#services-picker` section share the same
  `picker.*` i18n keys, so editing one place's translation updates both
  surfaces.

## Gotchas learned during QA (do not regress)
1. `.boarding-pass` grid is `1.6fr 2px 1fr` — the divider is a real column;
   removing it wraps the stub to a second row.
2. `.mobile-nav` must be `display:none` when closed (animated via
   `allow-discrete` + `@starting-style`). A hidden-but-painted layer
   (`opacity:0; visibility:hidden`) under the fixed header left a ghost
   stripe over content in Chrome.
3. `.mobile-nav a:not(.btn)` — the plain-link rule must not override
   `.btn-primary` text color (specificity).
4. `animatePrice` (now in `js/core.js`) cancels older tweens via
   `el._priceToken`; keep the token check when touching it (rapid
   stepper/guest-picker clicks).
5. Local dev: Chrome caches css/js aggressively even on reload — verify with
   `fetch(url, {cache:'reload'})` + reload, or DevTools "Disable cache".
6. `document.title` and `setAttribute()` do **not** decode HTML entities —
   only `innerHTML` does. A dictionary value with `&amp;` used for a
   `meta.<page>.title` rendered the literal text "&amp;" in the browser tab.
   Keep `&amp;` only in values applied via `data-i18n` (innerHTML); use a
   literal `&` everywhere else (`document.title`, `data-i18n-attr`).
7. Script load order matters on every page: `config.js` defines `CONFIG`/
   `AIRPORTS`/`PROVINCES`/`VEHICLES`/`estimateRoute` that `core.js`, `cart.js`,
   `calculator.js` and `tours.js` all read at IIFE-run time — moving `config.js`
   after any of them (or dropping it from a new page) throws a
   `ReferenceError` before the page finishes initializing.
8. A cart item added on one page and re-rendered on another still needs that
   page's own `config.js`/`cart.js`/`i18n.js` loaded — since all four pages
   load the identical shared set, this holds today, but if a future page ever
   omits one of them, cross-page cart rendering breaks silently (no console
   error, just a wrong/blank cart row).
