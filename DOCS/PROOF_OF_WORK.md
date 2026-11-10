# PROOF_OF_WORK — append-only log

---

## 2026-07-17 UTC — Split into three service pages + service-picker popup

**Requested:** the business has three distinct services (airport transfers,
private excursions, cruise shore excursions) and the owner will send
service-specific content separately for each; a single growing page mixing
all three no longer scales, can't be advertised per-service, and gives the
visitor no clear "which of these three is for me" moment. Design brainstorm
(`DOCS/superpowers/specs/2026-07-17-tres-servicios-y-selector-design.md`)
and implementation plan (`DOCS/superpowers/plans/2026-07-17-tres-servicios-y-selector.md`)
were written first; this entry covers the implementation.

**Delivered:**
- **Split into 4 pages sharing one header/cart-drawer/footer shell**:
  `index.html` (home — hero, `#services-picker` section, why, gallery,
  reviews, FAQ, book CTA, service-picker `<dialog>` popup), `transfers.html`
  (hero + services + boarding-pass calculator + trust strip),
  `excursions.html` (hero + 5 excursion cards + trust strip), `cruises.html`
  (hero + guaranteed-return promise band + 3 template cruise cards with
  optional ship-name + departure-time inputs + trust strip). Shell markup
  (header/nav/cart drawer/footer/FAB) is duplicated identically across the
  four HTML files by design — no build step, no include mechanism, so the
  owner can keep editing plain files directly.
- **`js/main.js` deleted**, split into 8 focused modules: `js/config.js`
  (business config — `CONFIG.whatsappNumber`, `AIRPORTS`, `PROVINCES`,
  `VEHICLES`, pricing constants, `haversineKm`/`estimateRoute`), `js/core.js`
  (`animatePrice`, `formatDuration`, `whatsappLink`, `prefersReducedMotion`),
  `js/cart.js` (cart state/panel/checkout), `js/shell.js` (header, mobile
  nav, reveals, parallax, counters, FAQ accordion, WhatsApp links),
  `js/calculator.js` (transfers-only calculator), `js/tours.js`
  (excursions + cruises guest-pricing/Add to Cart), `js/service-picker.js`
  (home-only popup). `js/i18n.js` kept its existing role. Per-page `<script>`
  loading (all `defer`): home = i18n, config, core, cart, shell,
  service-picker; transfers = i18n, config, core, cart, shell, calculator;
  excursions/cruises = i18n, config, core, cart, shell, tours.
  `js/config.js` is now the single file the owner edits for the WhatsApp
  number, prices and vehicles.
- **Per-page i18n meta**: each page sets `<body data-page="home|transfers|
  excursions|cruises">`; `applyStaticTranslations()` in `js/i18n.js` resolves
  `meta.<page>.title`/`meta.<page>.description` from it (falls back to
  `"home"` if the attribute is missing) instead of one fixed page title.
- **Cart storage versioned**: `localStorage['sariel-cart']` now stores
  `{v: CART_VERSION, items: [...]}` (`CART_VERSION = 2`) instead of a bare
  array; a stored cart of any other shape (including the old v1 array) is
  discarded on load rather than risking a crash. Excursion/cruise cart items
  now carry an i18n `titleKey` captured at add-time (the old
  `EXCURSION_TITLE_KEYS` lookup map was removed). Cruise items additionally
  carry optional `shipName`/`departureTime`, which flow into the cart panel
  meta line and the final WhatsApp message when the visitor fills them in.
- **Nav**: `site-nav`/`mobile-nav` on all 4 pages now link Transfers →
  `transfers.html`, Excursions → `excursions.html`, Cruises → `cruises.html`,
  Reviews → `index.html#reviews`, FAQ → `index.html#faq`; the old single-page
  "Prices" link is gone. Each service page marks its own nav link
  `aria-current="page"` (desktop + mobile) — `index.html` has no self-link to
  mark.
- **Service-picker popup**: a native `<dialog id="serviceDialog">` on the
  home page only, opened via `showModal()` after first render. Shows once
  per browser session (`sessionStorage['sariel-service-picked']`); picking a
  service stores it in `sessionStorage['sariel-service']` and lets the link
  navigate normally; closing via the × button, "Browse everything", Esc
  (`cancel` event) or a backdrop click all mark the session as asked without
  navigating. Degrades cleanly with no JS / no `<dialog>` support — the home
  page's always-present `#services-picker` section offers the same three
  destinations as plain links either way. Popup and section copy share the
  same `picker.*` i18n keys.
- **New root files**: `sitemap.xml` (4 URLs) and `robots.txt`. JSON-LD is now
  per page: TravelAgency + FAQPage (home), Service + BreadcrumbList
  (transfers), ItemList/TouristTrip + BreadcrumbList (excursions, cruises).
- **Known limitation documented, not fixed**: language is switched
  client-side on one URL per page (no `/es/` paths), so search engines only
  index the English-rendered version of each page — per-language URLs were
  explicitly scoped out of this refactor (see `DOCS/DEVELOPER_GUIDE.md`).

**Verification:** live browser QA (Playwright) was **deferred to the owner**
for this refactor — not run this session. Static verification was performed
instead and passed: `node --check` on every `.js` module (no syntax errors),
a golden-price parity check against a pre-refactor pricing baseline captured
before the split (`DOCS/superpowers/golden-prices.md` — every
airport×province×vehicle combination plus all 5 excursion price tables,
confirmed unchanged after moving `estimateRoute`/`AIRPORTS`/`PROVINCES`/
`VEHICLES` into `js/config.js`), and a grep-based integrity pass confirming
no page references the deleted `js/main.js`, every `<script>` tag on every
page resolves to a real file in `js/`, and no leftover references to removed
symbols (`EXCURSION_TITLE_KEYS`, old booking-form ids) remain. Before
go-live, the owner should still open each page in a live browser, click
between pages via the nav, add a transfer on one page and confirm it appears
in the cart on another, and trigger the service-picker popup in a fresh
(private/incognito) session to confirm the first-visit flow end-to-end —
see the go-live checklist in `DOCS/DEPLOYMENT.md`.

**Files created:** `transfers.html`, `excursions.html`, `cruises.html`,
`js/config.js`, `js/core.js`, `js/cart.js`, `js/shell.js`, `js/calculator.js`,
`js/tours.js`, `js/service-picker.js`, `sitemap.xml`, `robots.txt`,
`DOCS/superpowers/specs/2026-07-17-tres-servicios-y-selector-design.md`,
`DOCS/superpowers/plans/2026-07-17-tres-servicios-y-selector.md`,
`DOCS/superpowers/golden-prices.md`.
**Files modified:** `index.html` (rebuilt around the shared shell +
services-picker + popup), `css/styles.css` (shell, services-picker, service
dialog, trust strip, guarantee band, cruise fields), `js/i18n.js` (per-page
meta keys, `cruise*`/`picker.*` keys).
**Files deleted:** `js/main.js`.
**Documentation updated in this pass:** `PROJECT_INFO.md`,
`DOCS/DEVELOPER_GUIDE.md`, `DOCS/FOLDER_STRUCTURE.md`, `DOCS/USER_MANUAL.md`
(`DOCS/DEPLOYMENT.md` was already updated for this refactor prior to this
documentation pass).

---

## 2026-07-15 00:00 UTC — Shopping cart replaces per-item booking form

**Requested:** "pon un cart y que en vez de reservar se agregue al cart con
la información y luego se envie al whatsapp, y la última parte que sea si
quieren hablar directo" — add a cart; every "reserve" action adds to it
instead of opening the booking form; checkout sends one WhatsApp message;
the old final-CTA form becomes a "talk directly" option instead.

**Delivered:**
- **Cart button + drawer**: new icon button in the header (badge shows item
  count) opens a right-side drawer (`#cartPanel`) listing every added item
  with its route/excursion, details, price and a remove (×) button, an
  optional "preferred date" field, a running total, and one
  "Send via WhatsApp" checkout button. Persists in
  `localStorage['sariel-cart']` — survives a reload. Re-renders instantly
  in the active language (items store raw ids, not frozen text, same
  pattern as the calculator).
- **Every reserve/book action now adds to the cart** instead of scrolling to
  a form: the 4 route tickets, the calculator's own button, and all 5
  excursion buttons — all relabeled "Add to Cart" / "Agregar al Carrito".
  Clicking a ticket still visually syncs the calculator to that route first
  (kept from the previous behavior), then adds it.
- **Checkout** builds one message listing every item (title, details, price)
  plus a grand total and the optional date, opens WhatsApp, then clears the
  cart.
- **Final section (`#book`) simplified**: removed the 6-field booking form
  entirely; replaced with a single-column "prefer to talk to a real person?"
  message and one large "Chat on WhatsApp" button (reuses the same general
  inquiry message as the floating FAB/footer link). Kept the eyebrow,
  heading and reassurance bullets (free cancellation / pay on arrival /
  instant confirmation) — still accurate regardless of channel.
- Removed the now-fully-unused dictionary keys tied to the old form
  (`book.formTitle/labelName/labelWhats/labelDate/labelPax/labelService/
  error/submit/submitting`, `service.airportTransfer/privateTransportation`,
  `whatsapp.labelName/labelWhats/labelService/labelPassengers/flexible`) and
  their CSS (`.book-form`, `.book-form-title`, `.field-row`, `.form-error`).
- Converted the affected `<a href="#book">` reserve links to `<button
  type="button">` (they no longer navigate anywhere); added a `border:0;
  cursor:pointer` reset to the shared `.btn` and `.ticket-reserve` classes
  since native buttons carry a default border anchors never had.
- Mobile header fix: with lang switch + cart icon + Book Now + hamburger all
  competing for space, the standalone "Book Now" button is now hidden below
  460px (the hamburger menu already has its own).

**Verification (live browser, Playwright, desktop 1440 + mobile 390, both
languages):**
- Added a transfer (ticket) and an excursion (5 guests): both appeared in
  the drawer with correct route/title, meta and price; total summed
  correctly; removing one item updated the total and badge live.
- Checkout produced the exact expected consolidated `wa.me` message
  (verified full decoded text, including per-item lines and the date);
  cart correctly emptied (`localStorage` → `[]`) and panel closed after.
- Cart survived a full page reload (badge showed the persisted count on
  fresh load).
- Switching language while the drawer was open re-translated the item text
  in place without losing the item.
- Empty-cart state: message shown, checkout button disabled, badge hidden.
- `#bookDirectCta` href verified to be the correct WhatsApp info-message link.
- Mobile: no horizontal overflow; header fits lang switch + cart (with
  badge) + hamburger; cart drawer takes full width and is fully usable.
- Console: 0 errors/0 warnings throughout.

**Files modified:** `index.html`, `js/main.js`, `js/i18n.js`, `css/styles.css`.

---

## 2026-07-14 23:35 UTC — Calculator: all DR airports + all provinces

**Requested:** "pon todos los aeropuertos de república dominicana en pickup
location y destination todas las provincias" — expand pickup to every DR
airport and destination to every province.

**Delivered:**
- `js/main.js`: replaced the hand-written `ROUTES`/`DESTINATIONS` town-level
  table with `AIRPORTS` (7: POP, STI, SDQ, PUJ, AZS, LRM, BRX) and
  `PROVINCES` (all 31 provinces + Distrito Nacional), each with approximate
  coordinates. With 7×32 = 224 possible combinations, a hardcoded price table
  wasn't maintainable, so pricing is now **distance-estimated**: Haversine
  great-circle distance × a 1.35 road-winding factor → price
  ($18 base + $0.75/km, rounded up to the nearest $5, $20 floor) and duration
  (at an assumed 55 km/h blended average, 15 min floor). Every combination
  therefore always has a sensible value — no missing-entry risk.
  Removed the old "Puerto Plata City / Hotel" pickup option (out of scope —
  the request was specifically airports).
- `index.html`: `#calcPickup` now lists the 7 airports; `#calcDest` lists
  all 32 provinces (alphabetical). Rebuilt the 4 illustrative "popular
  routes" ticket cards with real airport→province pairs (STI→Espaillat,
  STI→Puerto Plata, POP→La Vega, POP→Samaná), chosen to avoid two tickets
  showing the same 3-letter code on both ends (a few provinces intentionally
  reuse their local airport's code, e.g. Puerto Plata province = "POP" —
  fitting in the live calculator, but confusing in a curated example).
- `js/i18n.js`: added `place.sdq/puj/azs/lrm/brx` + matching
  `option.pickupX` entries, and 31 `province.*` keys (mostly identical
  EN/ES proper nouns; "Distrito Nacional" → "National District" in English).
  Removed the now-unused town-level keys (`place.cabarete/sosua/playaDorada/
  cofresi/lasTerrenas/city`, `option.destX`, `option.pickupCity`).

**Verification (live browser, Playwright, desktop + mobile):**
- Confirmed 7 pickup options and 32 destination options render correctly.
- Sampled 7 pickup/destination combinations spanning the full range (short
  in-province hops to the farthest corner of the country) and confirmed
  price/duration scale sensibly: e.g. POP→Puerto Plata $35/20min,
  BRX→Barahona $25/15min, POP→La Altagracia $255/5h45, POP→Pedernales
  $250/5h35.
- Ticket "Reserve Now" → calculator sync and booking-form prefill re-tested
  with the new province slugs (POP→Samaná ticket correctly set calculator to
  $165 and prefilled the booking form). Console clean throughout, both
  languages, both viewport sizes.

**Files modified:** `index.html`, `js/main.js`, `js/i18n.js`.

---

## 2026-07-14 23:20 UTC — Fix: van animation barely moved

**Requested:** the van should complete the whole trip from one city to the
other (user reported it looked stuck near the start).

**Root cause:** `.ticket-point` had no `flex` value (defaulted to
`flex: 0 1 auto`), so its width was driven by its content — the place name
span (`max-width: 9rem`, e.g. "Aeropuerto de Puerto Plata" in Spanish). That
squeezed `.ticket-path` (the van's track) down to ~35px in a ~235px-wide
route row, leaving the van only ~13px to travel — technically a full loop
of its (tiny) container, but visually it looked like it never left the start.

**Fix:** `css/styles.css` — capped `.ticket-point` at `flex: 0 1 34%` and
gave `.ticket-path` `flex: 1 1 auto; min-width: 64px`, guaranteeing the path
a real share of the row regardless of place-name length; `.ticket-place`'s
`max-width` changed from a fixed `9rem` to `100%` of its now-capped parent.

**Verification:** measured `.ticket-path` width before/after (34.7px → 64px,
~5x more travel room) and sampled the van's computed `left` every ~250ms
across a full 4.4s cycle — confirmed it runs 0 → 42px (full path width minus
its own 22px) with the expected ease-in-out curve and fade at the loop
point. Visually confirmed in both English and Spanish (longer Spanish place
names still truncate legibly, e.g. "Puerto Plata…" / "Aeropuerto …"). Console
clean.

**Files modified:** `css/styles.css`.

---

## 2026-07-14 23:15 UTC — Route tickets: ambient van animation + Reserve Now

**Requested:** make the van glyph on the route tickets travel automatically
(not just on hover), and add a "Reserve" action to each ticket that fills
the booking form.

**Delivered:**
- `css/styles.css`: `.ticket-van` now runs a continuous `ticket-van-drive`
  keyframe loop (fade in → travel → fade out before reset, so the loop point
  is invisible), replacing the hover-only interaction. Each of the 4 tickets
  gets a different `animation-delay` (`nth-child`) so they don't move in
  sync. Respects `prefers-reduced-motion` (parked at center, static).
- Added a "Reserve Now" / "Reservar Ahora" button (`.ticket-reserve`) to
  each of the 4 route tickets in `index.html`, each carrying
  `data-service-key="airport-transfer"`, `data-passengers="3"` and its own
  `data-pickup`/`data-dest` (matching the ticket's route).
- `js/main.js` (`initCalculator`): new listener on `[data-pickup][data-dest]`
  syncs the calculator's pickup/destination selects and re-renders the
  boarding pass when a ticket's Reserve button is clicked. The existing
  `data-service-key` listener (already in `initBookingForm`) fills the
  booking form's Service + Passengers fields; the `href="#book"` anchor
  handles the scroll.

**Verification (live browser, Playwright, desktop 1440 + mobile 390):**
- Visually confirmed all 4 tickets show the Reserve button and the van at
  different animation phases (staggered loop working).
- Clicked the Playa Dorada ticket's Reserve button: calculator switched to
  POP → Playa Dorada (US$25), booking form Service = "Transfer aeroportuario"
  / Passengers = 3, page scrolled to `#book` — all confirmed via DOM read
  and screenshot.
- Console: 0 errors/0 warnings.

**Files modified:** `index.html`, `css/styles.css`, `js/main.js`.

---

## 2026-07-14 17:55 UTC — Bilingual EN/ES support

**Requested:** "agrega español también" (add Spanish too) — full bilingual
support, not just a translated copy of the page.

**Delivered:**
- New `js/i18n.js`: complete EN/ES dictionary (~150 keys), `t(key, vars)`
  with `{token}` interpolation, `getLang()`, `setLang()` (persists to
  `localStorage['sariel-lang']`, dispatches `sariel:langchange`).
- `index.html`: every static string tagged `data-i18n`/`data-i18n-attr`
  (nav, hero, services, route tickets, calculator labels/options, all 5
  excursions, gallery captions, why-us cards, reviews, FAQ, booking form,
  footer, WhatsApp FAB). Added a compact EN/ES segmented toggle in the header
  (`.lang-switch`), visible on both mobile and desktop.
- `js/main.js`: `ROUTES`/`DESTINATIONS`/`VEHICLES` now store `nameKey`/`labelKey`
  resolved via `t()`; calculator re-renders on language change; the mobile
  menu's aria-label, the WhatsApp FAB/footer links and the booking-form
  WhatsApp message are all built from `t()` and refresh on language change.
- Refactored booking prefill from fragile English-text matching to stable
  `data-service-key` slugs (e.g. `paradise-island`) mirrored in
  `<option value="...">` — language-independent, and the WhatsApp message now
  sends the visible (translated) service label instead of a raw slug/string.
- `css/styles.css`: `.lang-switch`/`.lang-btn` styles (gold active pill,
  adapts to solid/transparent header).

**Bug caught and fixed during verification:** `document.title` and
`setAttribute()` don't decode HTML entities (only `innerHTML` does) — the
`meta.title` dictionary value used `&amp;`, which rendered as the literal
text "&amp;" in the browser tab. Fixed by using a literal `&` for values
applied outside `innerHTML`. Documented in DEVELOPER_GUIDE.md so it isn't
reintroduced.

**Verification (live browser, Playwright, desktop 1440 + mobile 390):**
- Console: 0 errors/0 warnings in both languages.
- Hero, services, excursions, FAQ, footer visually confirmed correct in
  both languages (screenshots reviewed, not just DOM checks).
- Calculator: place names, vehicle label, capacity/duration/upgrade-note
  all correctly localized and reactive to language switching mid-session.
- Booking form: WhatsApp message body fully in Spanish when ES is active
  (verified exact decoded `wa.me` URL text); "Book This Experience" /
  "Reserve Now" prefill verified with the new slug system.
- Rapid language toggling (12 clicks) produced no console errors and left
  the UI in the correct final state.
- Mobile header (390px) fits the language switch + Book Now/Reservar +
  hamburger with no horizontal overflow in either language (English is the
  longer-text case, explicitly checked).
- `localStorage` persistence confirmed across a page reload.

**Files created:** `js/i18n.js`.
**Files modified:** `index.html`, `js/main.js`, `css/styles.css`,
`DOCS/DEVELOPER_GUIDE.md`, `DOCS/FOLDER_STRUCTURE.md`, `DOCS/USER_MANUAL.md`.

---

## 2026-07-14 17:20 UTC — Initial build: full landing page

**Requested:** Premium "Luxury Caribbean Travel" landing page for a private
transfers & excursions company in the Dominican Republic (detailed 9-section
spec provided by the user), using the `emilkowalski/skill` animation skills.

**Delivered:**
1. Hero — full-bleed aerial Caribbean photo, masked line-reveal headline,
   Ken Burns zoom, parallax, dual CTAs, trust strip, scroll indicator.
2. Services — 3 premium cards (Airport Transfers / Private Transportation /
   Excursions) + signature **boarding-pass route tickets** (POP→CBT etc.)
   with a gold van glyph that drives across the dashed route on hover.
3. Transfer Price Calculator — pickup/destination/passengers/vehicle inputs;
   result rendered as an animated boarding pass (price ticker with blur
   "reprint", auto vehicle recommendation & upgrade note, duration, capacity).
4. Excursions showcase — 5 full-width storytelling panels (Paradise Island,
   27 Charcos, Whale Watching, City Tour, Beach Experiences) with 2–5 guest
   pickers and animated dynamic pricing (Paradise Island: 180/240/290/330 per spec).
5. Gallery — masonry (CSS columns), scroll fade-in, hover zoom + captions.
6. Why Choose Us — 5 cards with line SVG icons, staggered reveal, animated
   counters (12+ / 15,000+ / 4.9 / 0).
7. Reviews — 4 testimonial cards (stars, name, country).
8. FAQ — accessible animated accordion (button + `grid-template-rows`),
   exclusive open, all 5 spec questions.
9. Final booking CTA — sunset parallax background, form (Name / WhatsApp /
   Date / Service / Passengers) → prefilled WhatsApp deep link; validation,
   date min = today; "Book This Experience" buttons prefill service + pax.
10. Header (transparent→solid), mobile nav, footer, floating WhatsApp button,
    SEO meta + JSON-LD (TravelAgency, FAQPage), skip link, reduced-motion support.

**Files created:** `index.html`, `css/styles.css`, `js/main.js`,
`PROJECT_INFO.md`, `DOCS/*`, `tasks/todo.md`.
**Files modified during QA:** `css/styles.css` (boarding-pass grid columns fix,
btn nowrap, mobile-nav display:none + allow-discrete fix, ticket notch position,
van hover animation cleanup), `js/main.js` (animatePrice concurrency token).

**Verification (live browser, Playwright — desktop 1440×900 & mobile 390×844):**
- Console: 0 errors, 0 warnings across the whole session.
- Calculator: 3→5 pax = US$55 Minivan; forced Car with 5 pax auto-upgrades
  with note; POP→Las Terrenas shows "≈ 3 h 45", US$235.
- Rapid-interaction stress test (12 stepper clicks + 6 guest-picker clicks):
  final state correct (Minibus US$95 / US$330), no stuck blur.
- Booking form: empty submit shows error + focuses name; valid submit builds
  correct `wa.me/18095550000?text=…` message (verified URL content).
- FAQ exclusive accordion + aria-expanded verified.
- Counters animate to 12+ / 15,000+ / 4.9 / 0 on scroll.
- No horizontal overflow at 390px; mobile nav opens/closes (display grid/none).

**Known placeholders for go-live:** WhatsApp number, domain URL in
canonical/OG, Unsplash photos → real photos, review names.

**Images:** 20 Unsplash candidates downloaded and visually inspected; 14 used
(hero aerial beach, plane wing, resort pool, sailboat cay, waterfall, whale
breach, colonial flags, palm beach, surfer, scuba, wave sunset, coach at
sunset, overwater villas, sunrise beach, golden ridge, sunset beach CTA).


---

## 2026-07-17 ~22:20 UTC — About Us / Meet the Team (home page)

**Requested:** create the About Us section with photos of the drivers
(Saul, Sariel, Luis, Leuris) and the vehicles, following the Emil Kowalski
design-engineering skill.

**Done:**
1. `img/` created — 6 real photos processed from `Nueva carpeta/` originals
   (PowerShell System.Drawing: resize <=1500px, JPEG q82, EXIF/GPS stripped,
   orientation baked): team-saul/team-sariel/team-luis.jpg (86-189 KB) +
   fleet-vans/fleet-van/fleet-interior.jpg (175-274 KB).
2. `index.html`: new `#about` section between #why and #reviews — section
   head (about.* i18n keys), 4-card `.team-grid` (4:5 portraits, hover zoom
   700ms --ease-out gated by hover:hover, width/height attrs + lazy loading),
   Leuris as branded `.team-photo-placeholder` (abyss->ocean gradient, gold
   italic "L", lagoon wave) until his photo arrives, plus `.fleet-grid` strip
   (3 photos reusing .masonry-item caption/hover inside a grid). Section
   comments renumbered; stale top structure comment fixed.
3. `css/styles.css`: new "11b. About us" block (team-grid/team-photo/
   placeholder/fleet-*), transform/opacity only, reveals reuse .reveal stagger.
4. `js/i18n.js`: 9 new `about.*` keys in both en + es (304 total, balanced).
5. Footer "Company" column on all 4 pages: new "Meet the team" link
   (#about on home, index.html#about elsewhere) reusing about.eyebrow.
6. DOCS updated: USER_MANUAL (new About section + Leuris swap instructions,
   photos item updated), DEPLOYMENT (checklist split: remaining Unsplash +
   Leuris photo), FOLDER_STRUCTURE (img/, Nueva carpeta role), DEVELOPER_GUIDE
   (structure + "Local images" subsection), PROJECT_INFO (pages/stack/files).

**Verification:**
- Static: all i18n keys exactly 2x (en+es); every new CSS class has a rule;
  all 6 img files exist; anchors verified (id="about" on home, 3 pages link
  index.html#about; #why/#reviews exist per-page — no dead anchors).
- Live browser (Playwright, python http.server): all 6 images load, 9/9
  reveals fire, EN->ES switch translates every about.* string live, footer
  link translated; mobile 390x844: 2-col team grid, no horizontal overflow
  (scrollW 375); console 0 errors / 0 warnings. Screenshots: desktop EN/ES +
  mobile ES (scratchpad, not committed to the project).

**Files created:** `img/team-saul.jpg`, `img/team-sariel.jpg`,
`img/team-luis.jpg`, `img/fleet-vans.jpg`, `img/fleet-van.jpg`,
`img/fleet-interior.jpg`.
**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `css/styles.css`, `js/i18n.js`, `DOCS/USER_MANUAL.md`,
`DOCS/DEPLOYMENT.md`, `DOCS/FOLDER_STRUCTURE.md`, `DOCS/DEVELOPER_GUIDE.md`,
`PROJECT_INFO.md`, `tasks/todo.md`, `memory/decisions.md`.
**Pending (owner):** Leuris photo -> img/team-leuris.jpg (placeholder swap
documented in USER_MANUAL).


---

## 2026-07-17 ~22:40 UTC — Header nav: "Reviews" -> "Meet the team"

**Requested:** remove "Reviews/Opiniones" from the header and put "Meet the
team" there instead.

**Done:** in the desktop `site-nav` AND `mobile-nav` of all 4 pages, the
`index.html#reviews` link (nav.reviews) was replaced by
`index.html#about` (about.eyebrow -> "Meet the team" / "Conoce al equipo").
Footer "Reviews" links untouched (each page has its own #reviews section, so
reviews stay reachable from the footer). No i18n changes needed (nav.reviews
is still used by the footers; about.eyebrow already existed).

**Verification (live browser, Playwright):** desktop nav on transfers.html
shows Transfers/Excursions/Cruises/Meet the team/FAQ; clicking navigates to
index.html#about with the section in view; ES switch renders "Conoce al
equipo" in both navs; mobile nav (390px) correct; console 0 errors/0 warnings.

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html` (2 nav links each), `DOCS/DEVELOPER_GUIDE.md` (nav map).

---

## 2026-07-17 ~23:30 UTC — Rebrand to SG Caribbean Transfers & Tours, real
pricing, new tour types, remaining photos localized

**Requested (owner, Spanish):** company/page name is "SG Caribbean Transfers
& Tours"; real prices for POP/STI/SDQ/PUJ -> Sosúa/Cabarete/Puerto Plata
transfers; City Tour, ATV and Buggy pricing; new Punta Rusia pricing
(per-person, tiered by group size, includes boat+buffet+drinks); new "why
us" copy (6 differentiators); real WhatsApp (+1 829-627-7733) and email
(sg.caribbeantransferstours@gmail.com); download the site's current (stock)
photos into a named folder so the owner can tell which file to replace —
owner clarified: put them in `img/` with descriptive names, they'll swap
files in manually.

**Scoped via brainstorming + AskUserQuestion before implementing** (money
flow + architecture decisions): (1) fixed-price Popular Routes table added
*alongside* the existing distance-based calculator, not replacing it; (2)
City Tour/ATV/Buggies forced into the existing guest-picker widget rather
than a new UI (City Tour = flat price, ATV/Buggies = per-person scaling);
(3) Punta Rusia's 2-3 guest options removed (real minimum is 4 people, no
invented pricing below that).

**Done:**
- **Rebrand:** "Sariel" -> "SG Caribbean Transfers & Tours" (full name) /
  "SG Caribbean" (short form, header/footer brand lockup + boarding-pass
  label + WhatsApp greeting) everywhere it names the *business* — titles,
  meta/OG, JSON-LD, header+footer brand mark, "why us" eyebrow, footer
  legal line — across all 4 HTML pages + `js/i18n.js` (EN+ES, 327 keys
  each, full parity verified). Left untouched everywhere "Sariel" names
  the *driver* (team card, alt text, review quote) — confirmed via review
  of `about.lead`/team markup before editing. One indirect miss caught in
  verification: `reviews.quote2` was a honeymoon testimonial about
  "Paradise Island" with "just the two of us" — reassigned to "Beach
  Experiences" since Punta Rusia (renamed from Paradise Island) now has a
  4-guest minimum and a couple could no longer book it.
- **Contact:** `CONFIG.whatsappNumber` -> `18296277733`; footer
  `mailto:` -> `sg.caribbeantransferstours@gmail.com` on all 4 pages.
- **Transfers pricing:** replaced the 4 illustrative demo tickets in the
  `.routes` ticket-rail with the 8 real fixed-price routes (POP/STI->
  Sosúa/Cabarete/Puerto Plata, SDQ/PUJ->Sosúa), all 1-6 guests. New
  `data-fixed-from`/`data-fixed-to`/`data-fixed-price` attributes (can't
  reuse the existing `data-pickup`/`data-dest` pattern — Sosúa/Cabarete
  aren't provinces the calculator's `estimateRoute()` knows about). New
  click handler in `js/calculator.js` adds a `kind:'fixedRoute'` cart item;
  new case in `js/cart.js` `describeCartItem()` renders it
  (`${t(fromKey)} -> ${t(toKey)}`, price snapshotted, not formula-derived).
- **Excursions repricing:** Punta Rusia (was "Paradise Island") ->
  $123.95/person for groups of 4-6 (2/3-guest buttons removed, card copy
  notes 7+ gets $108.95/person via WhatsApp), `data-decimals="2"` added so
  the animated price shows cents correctly; City Tour -> flat $65 for any
  group up to 6 (all `data-prices` values identical, guest buttons just
  don't change the total — copy clarifies "flat price for your whole
  group"). Two new cards added: ATV Adventure ($65/person x 2-5 guests)
  and Dune Buggy Adventure ($100/person x 2-5 guests), matching the
  existing card markup/pricing-widget pattern exactly. `excursions.html`
  JSON-LD ItemList extended from 5 to 7 entries.
- **Money formatting fix:** new `formatMoney()` in `js/core.js` (whole
  numbers stay bare, e.g. "65"; amounts with cents always show 2 decimals,
  e.g. "495.80" — without this, `495.8.toString()` would silently drop the
  trailing zero and read as a typo). Used in `js/cart.js` for the cart
  item price, cart total and the WhatsApp message lines.
  `cartTotal()` also now rounds to 2 decimals to guard against float
  drift when summing decimal prices (e.g. `23.95 + 33.95`).
- **Photos:** downloaded the 19 Unsplash placeholders still in use (hero
  x2, CTA band, 8 gallery images, 3 transfer trust images, 5 excursion/
  cruise card images) plus 2 new ones for ATV/Buggies into `img/` with
  descriptive filenames (verified each ATV/buggy photo's actual content
  before committing — two blind Unsplash-ID guesses were wrong content,
  found the right ones via WebSearch + WebFetch). Every `<img>` across all
  4 pages now points at `img/`, no more `images.unsplash.com` requests;
  removed the now-unneeded `<link rel="preconnect" href="https://images.
  unsplash.com">` from all 4 `<head>`s. Mid-session the owner started
  manually swapping in their own photos from "Nueva carpeta" (as they'd
  said they would) — `hero-cruises.jpg` was already correctly replaced;
  `exc-punta-rusia.jpg` came in under the wrong filename
  (`cayo-arena.-puerto-plata.jpg`, landed loose in `img/`, leaving the
  expected file missing) and was renamed to fix the broken reference —
  the resulting real Cayo Arena aerial photo is a strict improvement over
  the Unsplash placeholder it replaced, so alt text was updated to match.

**Verification (static — no Playwright this session, see
`memory/lessons.md`):** `node --check` on every `js/*.js` file; every
`img/` path referenced in the 4 HTML files cross-checked against actual
files on disk (no missing, no orphaned); every `data-i18n`/`data-i18n-attr`
key referenced in the 4 HTML files cross-checked against `js/i18n.js` (none
missing); EN/ES key sets diffed (327/327, full parity); `<article>` open/
close tag counts balanced on all 4 pages; grepped for leftover `unsplash`,
old WhatsApp placeholder, old email, and stray brand-name "Sariel" refs
(zero survivors outside legitimate driver-name mentions). Live-browser QA
is the owner's to run per their instruction not to use Playwright this
session.

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `js/i18n.js`, `js/config.js`, `js/core.js`, `js/cart.js`,
`js/calculator.js`, `js/tours.js`, `css/styles.css`, `PROJECT_INFO.md`,
`DOCS/DEPLOYMENT.md`, `DOCS/FOLDER_STRUCTURE.md`, `DOCS/DEVELOPER_GUIDE.md`,
`tasks/todo.md`.
**Files created:** `img/hero-main.jpg`, `img/hero-cruises.jpg`,
`img/cta-band.jpg`, `img/gallery-1..8-*.jpg`, `img/transfer-trust-
airport/resort/beach.jpg`, `img/exc-waterfalls.jpg`,
`img/exc-whale-watching.jpg`, `img/exc-city-tour.jpg`,
`img/exc-beach-day.jpg`, `img/exc-atv.jpg`, `img/exc-buggies.jpg`.
**Files renamed:** `img/cayo-arena.-puerto-plata.jpg` -> `img/exc-punta-
rusia.jpg` (owner's own photo, landed under the wrong name mid-session).
**Pending (owner):** swap remaining stock photos in `img/` for real ones
(same-filename replacement, no code needed — see updated go-live checklist
in `DOCS/DEPLOYMENT.md`); real domain; real cruise-card prices; real
testimonials; Leuris' photo.

---

## 2026-07-17 ~23:55 UTC — Traveler name + flight capture, 2 real cruise cards

**Requested (owner, Spanish):** capture the traveler's name and flight
number when booking an airport pickup; capture name when booking an
excursion; the cruise page's excursions are City Tour and 27 Charcos de
Damajagua.

**Scoped via one AskUserQuestion** (the only real ambiguity): the cruise
page has 3 template cards but the owner only named 2 real tours — confirmed
keep the 3rd as a placeholder for a future addition rather than removing it.

**Done:**
- **Name/flight capture — cart-level, not per-item.** Considered adding
  separate Name(+Flight) inputs to every ticket/calculator/card (~20 spots
  across 4 pages) but rejected it: the cart already consolidates everything
  into ONE checkout/ONE WhatsApp message for one visitor, so one shared
  name (and one shared flight number) covers the whole booking exactly like
  the existing "preferred date" field already does — adding it once to the
  cart-panel-footer (all 4 pages, identical markup/IDs since checkout can
  happen from any page) avoids ~20x duplication for zero loss of
  information. `#cartName` (required) + `#cartFlight` (optional, labeled
  "if picking up at the airport") sit above the existing date field.
- **Validation:** checkout is blocked (native `reportValidity()` bubble,
  custom message via new `cart.nameRequired` key, focuses the field) if
  name is empty — no reactive disabled-state wiring needed. Flight stays
  optional since it's irrelevant for excursion-only carts.
- **`buildCartMessage(date, name, flight)`** (was `(date)` only): now
  prints Name right after the greeting and Flight (if provided) directly
  under it, before the itemized list — so the owner sees who to look for
  without having to ask back over WhatsApp.
- **Cruise cards:** `#cruise1` -> 27 Charcos de Damajagua (same
  description/`data-prices` as `excursions.html` exc2; swapped its photo
  from the Cayo Arena placeholder it had inherited to `exc-waterfalls.jpg`
  to actually match); `#cruise2` -> Puerto Plata City Tour (same flat-$65
  pricing as `excursions.html` exc4, including the 6th guest button so the
  real up-to-6 capacity is represented); `#cruise3` untouched (stays the
  "Shore Excursion 3" / $0 placeholder template, owner's choice). Updated
  `cruises.html`'s JSON-LD ItemList entries 1 and 2 to match.
- New i18n keys (EN+ES, parity verified): `cart.nameLabel`,
  `cart.flightLabel`, `cart.nameRequired`, `whatsapp.labelName`,
  `whatsapp.labelFlight`.

**Verification (static):** `node --check` on every `js/*.js`; EN/ES key
parity (332/332); every `data-i18n`/`data-i18n-attr` key resolves; every
`img/` reference resolves to an existing file with no orphans; `<article>`
tag balance on all 4 pages; grepped for leftover "Shore Excursion" text —
only `#cruise3` (the intentional placeholder) still has it.

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html` (cart-panel-footer + cruise1/cruise2 cards + JSON-LD),
`js/cart.js`, `js/i18n.js`, `DOCS/DEVELOPER_GUIDE.md`, `DOCS/USER_MANUAL.md`.

---

## 2026-07-19 ~14:15 UTC — Leuris photo, expanded fleet gallery, real logo/favicon

**Requested (owner, Spanish):** Leuris' photo is already in `img/` but
doesn't show on the team section; show the different Toyotas and each
one's interior; use `logo favicon.jpeg` as the page's logo and favicon.

**Found before acting:** `img/team-leuris.jpg` already existed (the owner
had added it, presumably in a session between 2026-07-17 and today) — the
bug was that `index.html` still had the `.team-photo-placeholder` `<div>`
from before his photo existed; nothing was actually reading the file.
`Nueva carpeta/` had 4 distinct van exteriors (`guagua1-4.jpeg`) and 3
distinct interiors (`interior/2/3.jpeg`) — checked each visually first;
`guagua1.jpeg` turned out to be the exact source of the already-in-use
`fleet-van.jpg` and `interior.jpeg` of `fleet-interior.jpg` (compared
photo content, not just filenames), so only `guagua2-4` and `interior2-3`
were genuinely new material.

**Done:**
- **Leuris:** swapped the placeholder `<div class="team-photo-placeholder">`
  for a real `<img src="img/team-leuris.jpg">` (real dimensions 523×1139,
  read via PowerShell/System.Drawing rather than guessed); removed the now-
  dead `.team-photo-placeholder`/`.team-initial`/`.team-wave` CSS rules
  (only the removed placeholder used them).
- **Fleet gallery, 3 → 8 photos:** renamed the existing `fleet-van.jpg` →
  `fleet-van-1.jpg` and `fleet-interior.jpg` → `fleet-interior-1.jpg` for
  consistent numbering, processed `guagua2-4.jpeg` → `fleet-van-2/3/4.jpg`
  and `interior2-3.jpeg` → `fleet-interior-2/3.jpg` (resize ≤1500px long
  side + EXIF-orientation-correct + strip EXIF/GPS via PowerShell
  System.Drawing, same pipeline as the original team/fleet photos — see
  `memory/decisions.md`). 4 vans but only 3 interiors, so presented as two
  groups (not forced 1:1 pairs) in the existing masonry `fleet-grid` —
  confirmed the grid's `auto`/3-column CSS handles 8 items with no changes
  needed. Added `about.fleet4`-`about.fleet8` i18n keys (EN+ES) for the 5
  new captions.
- **Real logo + favicon:** processed `Nueva carpeta/logo favicon.jpeg` (a
  circular "SG Caribbean Tours & Transfers" badge design) into `img/logo.jpg`
  (800px, q90) plus `favicon-32.png`/`favicon-180.png` (System.Drawing,
  square crop). Replaced the inline-SVG `<link rel="icon">` and all 8
  `<svg class="brand-mark">` instances (header+footer × 4 pages) with
  `<link rel="icon">`/`<link rel="apple-touch-icon">` and
  `<img class="brand-mark" src="img/logo.jpg">`. Since the source JPEG has
  no alpha channel and the circular badge already touches all 4 edges of
  its square canvas, used `border-radius:50% + object-fit:cover` on
  `.brand-mark` to crop the white corners in CSS rather than editing pixel
  alpha — cheaper and sufficient here specifically because of how tightly
  the circle already inscribes the square (documented as a conditional
  decision in `memory/decisions.md`, since a logo with more white margin
  would need real alpha-channel cropping instead).

**Verification (static):** `node --check` on every `js/*.js`; every `img/`
reference in the 4 HTML files resolves to an existing file (only 2
unrelated owner-added files in `img/` are unreferenced —
`hero-cruiser.png` and a stray `logo favicon.jpeg` copy — left alone, not
mine to delete); EN/ES i18n parity (337/337); every `data-i18n` key used
in HTML resolves; both `brand-mark` occurrences present on all 4 pages;
grepped for leftover `team-photo-placeholder` — none.

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html` (favicon links + brand-mark ×2 per page; index.html also:
About section team-grid + fleet-grid), `js/i18n.js`, `css/styles.css`
(`.brand-mark`, removed placeholder rules), `DOCS/USER_MANUAL.md`,
`DOCS/DEPLOYMENT.md`, `DOCS/FOLDER_STRUCTURE.md`, `memory/decisions.md`.
**Files created:** `img/fleet-van-2.jpg`, `img/fleet-van-3.jpg`,
`img/fleet-van-4.jpg`, `img/fleet-interior-2.jpg`,
`img/fleet-interior-3.jpg`, `img/logo.jpg`, `img/favicon-32.png`,
`img/favicon-180.png`.
**Files renamed:** `img/fleet-van.jpg` → `img/fleet-van-1.jpg`,
`img/fleet-interior.jpg` → `img/fleet-interior-1.jpg`.

---

## 2026-07-19 ~15:00 UTC — Always-English default + French language

**Requested (owner, Spanish):** the page must always start in English; add
French to the selectable languages.

**"Always start in English" — interpreted as per-session, not per-page-load.**
The existing code already defaulted to English unless `localStorage` had a
saved `'es'`; taken completely literally, "always starts in English" would
mean the language resets on every single page navigation too, which would
undo a visitor's own selection map-blank browsing on the site. Re-read as
the far more common intent — don't let the site "remember me" across
separate visits/days — and implemented with `sessionStorage` instead of
`localStorage`: a choice survives multi-page navigation *within* one
browser tab session (same UX as before), but a closed tab, new tab, or
later visit always starts fresh in English again. This mirrors the pattern
already used for the service-picker popup's "asked once per session" flag,
so it's consistent with an existing decision in this codebase, not a new
pattern.

**French translation — full parity, not a partial/machine pass.** Wrote
all 337 keys in French from scratch (matching the EN source content
exactly, section by section) rather than leaving gaps to silently fall
back to English via `t()`'s fallback chain — a partial translation would
have been invisible in casual testing (missing keys just show English) but
would read as broken/unfinished to an actual French-speaking visitor.
Kept Dominican place/province names in their Spanish spelling (e.g.
"Sosúa", "Puerto Plata", "Distrito Nacional" → "District National" only
for the generic administrative word) — standard practice in French-language
Caribbean tourism material, not a translation gap.

**Built via JSON intermediate, not hand-typed JS.** Wrote the French
dictionary as a JSON file first (apostrophe-heavy French text — l', d',
qu', n', j' — needs no escaping in JSON, but would be extremely error-prone
typed directly as ~170 hand-quoted JS object lines), then a small Node
script converted it to properly-quoted JS lines (double-quotes when a
value contains `'` and no `"`, matching the existing file's own
convention), verified 337/337 key parity against `en` before insertion,
and verified again after. One string-replace bug during insertion left a
stray `$` character on the last line (an artifact of naively escaping `$`
for `String.replace`'s special replacement-pattern syntax) — caught by
`node --check` failing immediately, fixed with a single-line edit,
re-verified clean.

**Done:**
- `js/i18n.js`: added `fr: { ... }` (337 keys, full EN parity); added
  `SUPPORTED_LANGS = ['en','es','fr']` as the single source of truth for
  valid languages (`setLang()` now validates against it instead of a
  hardcoded `!== 'en' && !== 'es'` check); switched language persistence
  from `localStorage` to `sessionStorage` (see above); updated the module
  header comment and `getLang()`/`setLang()` JSDoc.
- Added a 3rd `.lang-btn` (`data-lang="fr"`, labeled "FR") to the
  `.lang-switch` group on all 4 pages, plus the group's `aria-label`
  ("Language / Idioma / Langue"). No CSS changes needed — `.lang-switch`/
  `.lang-btn` were already a generic flex row with no 2-button assumption.
- No other JS files needed changes — `getLang()`/`t()`/the `.lang-btn`
  query-selectors are all already language-count-agnostic; grepped for any
  hardcoded `'es'`-only branching elsewhere and found none.

**Verification (static):** `node --check` on every `js/*.js`; EN/ES/FR key
parity confirmed 337/337/337 via a Node script that `require()`s the
dictionary directly (not just visual inspection); confirmed no stray `$`
or quote-escaping artifacts anywhere in the file after the JSON→JS
generation step; confirmed the FR button exists on all 4 pages; confirmed
no remaining `localStorage` reads/writes for the language key. Manually
exercising the language switcher and confirming a closed/reopened tab
resets to English is the owner's to verify live in a browser, per this
session's no-Playwright instruction.

**Files modified:** `js/i18n.js`, `index.html`, `transfers.html`,
`excursions.html`, `cruises.html` (lang-switch markup ×4),
`PROJECT_INFO.md`, `DOCS/DEVELOPER_GUIDE.md`, `DOCS/USER_MANUAL.md`,
`DOCS/FOLDER_STRUCTURE.md`.

---

## 2026-07-19 ~15:30 UTC — Min-4 group sizes, dual dates, email checkout, quote CTA

**Requested (owner, Spanish, terse bullet list):** minimum 4 people on all
excursions; flight date and excursion date are different [things]; bookings
can be sent by email or WhatsApp, customer's choice; 20+ years experience
(was 12); 10,000+ happy travelers (was 15,000); change "Reservar" to
"Cotizar".

**Interpretation calls made (no clarifying questions asked — all had a
clear, low-risk correct reading from context already in this session):**
- "Minimum 4 in all excursions" → literally every excursion/cruise card
  (7+3), not just Punta Rusia which already had it. Removing the 2/3-guest
  options everywhere is a straightforward, unambiguous mechanical change.
- "Flight date and excursion date are different" → the cart's single
  shared "Preferred date" field was ambiguous once a cart could hold both a
  transfer and an excursion on different days; split into two fields
  (`#cartFlightDate`, `#cartExcursionDate`) rather than reading it as
  "add a 2nd unrelated field" — this is the reading that actually resolves
  the stated problem.
- "Email or WhatsApp, customer decides" → two checkout buttons, not a
  toggle/radio — simpler, no extra state to manage, and both fire from the
  exact same `buildCartMessage()` output so the two channels can never
  drift out of sync with each other.
- "Reservar → Cotizar" → applied to the two clearest "book/reserve" CTAs a
  visitor sees (header `nav.bookNow` "Reservar"→"Cotizar", home hero
  `hero.ctaPrimary` "Reserva Tu Transfer"→"Cotiza Tu Transfer") across
  **all three languages** for consistency (EN "Book Now"→"Get a Quote",
  FR "Réserver"→"Demander un Devis") — left `footer.serviceBooking` and
  `faq.a2`'s "confirmar tu reserva" untouched since those describe a
  *result* (a request that becomes a booking once confirmed), not the
  action of asking for one, so "cotizar" doesn't fit there grammatically.

**Done:**
- **Excursions/cruises minimum group = 4, everywhere.** Removed the 2- and
  3-guest buttons and `data-prices` keys from all 7 excursion cards and all
  3 cruise cards (Punta Rusia already had this from an earlier session);
  reset each card's default active guest button + visible price to the new
  4-guest value. Removed the now-fully-unused `exc.guest2`/`exc.guest3`
  i18n keys (EN/ES/FR — verified zero remaining references in any HTML
  file before deleting).
- **Two cart date fields instead of one.** New `cart.flightDateLabel`/
  `cart.excursionDateLabel` (labels) and `whatsapp.labelFlightDate`/
  `whatsapp.labelExcursionDate` (message lines) replace the old single
  `cart.dateLabel`/`whatsapp.labelDate`. `buildCartMessage()`'s signature
  changed from positional args to a `{name, flight, flightDate,
  excursionDate}` object (4 params was the threshold where positional args
  stop being readable at the call site).
- **Email checkout, mirroring WhatsApp exactly.** New `emailLink(subject,
  body)` in `js/core.js` (same shape as `whatsappLink()`); new
  `CONFIG.contactEmail` in `js/config.js` (the 4 footers' own `mailto:`
  links stay static HTML, untouched — this is only for the new cart
  button). `js/cart.js` refactored the shared "is checkout allowed" name
  validation into `canCheckout()` and the "read the form" logic into
  `readCheckoutDetails()`, called by both button handlers so WhatsApp and
  email can never send different content. New `.btn-outline` CSS class —
  the existing `.btn-ghost` secondary style is tuned for dark hero photo
  overlays and would have been nearly invisible on the cart panel's light
  background.
- **Stats:** `why.stat1` counter `data-target` 12→20, `why.stat2` 15000→
  10000 (index.html only — the only page with the stats block). Confirmed
  `js/shell.js`'s counter animation already comma-formats large numbers
  (`10000`→"10,000"), no JS changes needed.
- **CTA wording**, all 3 languages (see interpretation notes above) — both
  the `data-i18n` dictionary values and every hardcoded HTML fallback text
  instance (8× `nav.bookNow` across the 4 pages' desktop+mobile nav, 1×
  `hero.ctaPrimary` on the home hero).
- Caught and fixed 3 documentation spots left stale by an *earlier* entry
  in this same session (Fase 6, cruise cards): USER_MANUAL.md's go-live
  checklist and cruise-card-editing instructions still described all 3
  cruise cards as `data-prices='{"2":0,...}'` placeholders after 2 of them
  had already been filled in with real content.

**Verification (static):** `node --check` on every `js/*.js`; EN/ES/FR key
parity 339/339/339; every `data-i18n` key used in the 4 HTML files
resolves; every `img/` reference resolves; `<article>` tag balance on all
4 pages; grepped every `data-prices` attribute in `excursions.html`/
`cruises.html` to confirm zero `"2":`/`"3":` keys remain; confirmed
`#cartCheckoutEmail`/`#cartFlightDate`/`#cartExcursionDate` exist on all 4
pages. Live interaction (does the email client actually open with the
right content, does the date-picker UX read clearly) is the owner's to
check in a browser, per this session's no-Playwright instruction.

**Files modified:** `excursions.html`, `cruises.html` (9 cards),
`index.html`, `transfers.html` (cart-panel-footer + nav CTA text ×4 pages),
`js/i18n.js`, `js/cart.js`, `js/core.js`, `js/config.js`, `css/styles.css`,
`DOCS/DEVELOPER_GUIDE.md`, `DOCS/USER_MANUAL.md`.

---

## 2026-07-19 ~15:45 UTC — Email option on the final "book" CTA band too

**Requested (owner, via screenshot of the page-bottom "Ready to explore the
Dominican Republic?" band):** add a "send us an email" option there too —
that section only had the single "Chat on WhatsApp" button, unlike the
cart which already got a WhatsApp/email choice earlier this session.

**Done:** added a second button, `#bookDirectCtaEmail` ("Email Us" /
"Escríbenos por Correo" / "Écrivez-nous par Email"), next to
`#bookDirectCta` on all 4 pages' final CTA band. Both live inside a new
`.book-direct-ctas` flex row (replacing the old single-button
`.book-direct-cta` margin rule). Used `.btn-ghost` (not the `.btn-outline`
added earlier for the cart panel) since this band has the same dark
photo-overlay background as a hero section — exactly what `.btn-ghost` was
already built for; `.btn-outline` would have been the wrong choice here.
`js/shell.js`'s `initWhatsAppLinks()` now also sets the email button's
`href` via `emailLink(t('email.subject'), t('whatsapp.info'))` — same
`CONFIG.contactEmail` and subject line as the cart's email checkout,
re-run on every language switch alongside the other WhatsApp links.

**Verification (static):** `node --check` on every `js/*.js`; EN/ES/FR
parity 340/340/340; `#bookDirectCtaEmail` present on all 4 pages;
`<article>`/`<div>` tag balance on all 4 pages.

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html` (book CTA band), `js/i18n.js`, `js/shell.js`,
`css/styles.css`.

---

## 2026-07-19 ~16:00 UTC — Manual group-size entry on every excursion card

**Requested (owner, screenshot of a "5 Guests" preset pill):** add the
option to type the group size manually, on all excursions.

**The real design question wasn't the input field — it was what price to
show for a typed number that isn't one of the presets.** Checked the actual
`data-prices` on every card first: most only have exact totals for 4 and 5
guests (e.g. 27 Charcos: $235/$270), and the per-guest rate isn't flat
across those two points (235÷4=58.75 vs 270÷5=54), so there's no formula to
safely extrapolate a price for 6, 8, 12, etc. — only Punta Rusia, City
Tour, ATV and Buggies happen to have a genuine flat/linear per-person rate.
Rather than guess (or silently apply a different rule to different cards,
which would be inconsistent and confusing to audit later), asked the owner
directly: **confirmed "Contact us for a quote" for any typed count without
an exact price** — no invented numbers, matches the site's existing "final
price confirmed by our team" disclaimer already on the cart.

**Done:**
- Added `.guest-manual-input` (free-typed number, `min="4"`) next to the
  preset `.guest-btn` pills on all 10 cards (7 excursions + 3 cruises) via
  a small Node script (safer than 10 near-identical manual edits — each
  card's price amount differs but the surrounding structure is identical,
  exactly the kind of transform a regex-based script gets right where
  repeated manual edits risk a copy-paste slip).
- `js/tours.js` rewritten around one shared `selectGuests(n)` — called by
  both a preset click and manual typing, so the two input methods can
  never disagree about the resulting price/state. Exact match → prices
  normally (identical to before). No match → toggles the card into a
  "contact us" state: `.exc-price-amount`/`.exc-price-quote` swap via
  `hidden` (found and fixed a latent CSS specificity bug while wiring this
  — `.exc-price-amount` sets `display:flex`, which was silently winning
  over the browser's default `[hidden]{display:none}` at equal
  specificity; added `.exc-price-amount[hidden]{display:none}` to force
  it), and the Add-to-Cart button re-labels to "Ask for a Quote" and opens
  a prefilled WhatsApp message (`whatsapp.quoteRequest`, new key with
  `{excursion}`/`{n}` placeholders) instead of adding a priced cart item.
- Button re-labeling required an extra `sariel:langchange` listener in
  tours.js (`renderAddBtnLabel`) — the label is now sometimes set from JS
  state rather than purely from `data-i18n`, so it needs to survive a
  language switch on its own.
- New i18n keys (EN/ES/FR, parity verified): `exc.manualLabel`,
  `exc.priceOnRequest`, `exc.requestQuote`, `whatsapp.quoteRequest`.

**Verification (static):** `node --check` on every `js/*.js`; EN/ES/FR
parity 344/344/344; every `data-i18n` key used in HTML resolves; manual
input + quote-state markup present on all 10 cards (`grep` count);
`<article>`/`<div>` tag balance on all 4 pages; every `img/` reference
resolves. Live interaction (typing a number, watching the price/button
swap states, confirming the WhatsApp message content) is the owner's to
check in a browser, per this session's no-Playwright instruction.

**Files modified:** `excursions.html`, `cruises.html` (10 cards),
`js/tours.js`, `js/i18n.js`, `css/styles.css`, `DOCS/DEVELOPER_GUIDE.md`,
`DOCS/USER_MANUAL.md`.

---

## 2026-07-20 UTC — Competitor-based price list, luggage fee, "Meet the team" split to its own page

**Requested (owner, photo of a competitor's "Taxi Sosúa-Cabarete" price
sign):** update the site's airports/cities pricing to match the sign, with
every price reduced by US$1.50; add a luggage-count option on transfers
(11+ suitcases = +US$15 flat fee); make the team section its own page using
the logo and a new "banner nosotros" image, plus real company-story copy.

**Clarified with the owner before building** (3 questions, all answered):
the ~50 extra destinations from the sign should render as a compact
reference **table**, not 50 more boarding-pass tickets (which would have
made the page enormous); "Meet the team" becomes a **new page**
(`nosotros.html`), not just a restyle of the existing `#about` section on
`index.html`; one illegible entry on the sign (obscured by a watermark, next
to "La Galera $200") was confirmed as **La Romana $300**.

**Corrected mid-build (owner, live):** the sign framed all ~50 prices as
"from Sosúa/Cabarete" (its own business's base) — but SG Caribbean's fixed
prices are POP-based throughout the site, so the new list's "from" copy was
corrected to **Puerto Plata Airport (POP)**, not Sosúa/Cabarete. Destination
names/prices were unaffected, only the framing text
(`transfers.priceListLead`). Also caught mid-session: the owner replaced
`img/banner nosotros.jpeg` with a new file **repeatedly, while this session
was running** — same live-photo-swap behavior noted in the project's own
`memory/lessons.md`. It cycled through at least 3 states during the
session (`.jpeg` → an unprocessed 2.1 MB `.png` → a re-encoded `.jpg` this
session produced → back to a `.jpeg` again, landed by the owner), breaking
the `<img src>` reference each time it changed extension. `nosotros.html`
was re-synced to match current disk state each time (final state: `img/banner
nosotros.jpeg`, 126 KB, already reasonably sized — no reprocessing needed
for the final file); a full `img/`-reference-vs-disk audit was run as the
last step specifically to catch any final mismatch. Also asked (unprompted)
to swap the service-picker `<dialog>`'s backdrop from the blurred hero photo
to a centered logo watermark on a dark tint — done in
`.service-dialog::backdrop`.

**Delivered:**
- **Luggage fee**: `LUGGAGE_FREE_LIMIT`/`LUGGAGE_EXTRA_FEE_USD` (10 / $15) in
  `js/config.js`; `#cartLuggage` optional number field in the cart drawer's
  checkout fieldset (all 5 pages, identical markup); `getLuggageCount()`/
  `luggageFee()` in `js/cart.js` read it live (not a cart item, no
  `CART_VERSION` bump needed) and fold the flat $15 into the displayed
  total and `buildCartMessage()`'s WhatsApp/email text whenever count > 10.
- **Popular Routes ticket rail**: POP/STI/SDQ→Sosúa prices updated to the
  sign's figures (−$1.50): $23.50 / $98.50 / $198.50; added a 9th ticket,
  AZS (Samaná Airport)→Sosúa, $148.50 (new route, wasn't on the site before).
  PUJ→Sosúa and the POP/STI→Cabarete/Puerto-Plata-province variants were
  left untouched — no 1:1 source value existed for them on the sign.
- **New `#price-list` section on `transfers.html`**: static two-column
  reference table, 50 destinations, each the sign's price −$1.50, framed as
  one-way from Puerto Plata Airport. Plain HTML (no cart wiring, no
  `data-i18n` on destination names — they're literal Dominican place names,
  same treatment as `place.sosua`/`place.cabarete`).
- **`nosotros.html`** (new 5th page): hero banner (owner's photo) → company
  intro (logo + `about.introBody` story copy) → the team grid + fleet grid
  moved verbatim from `index.html`'s old `#about` → book CTA. Nav/footer
  "Meet the team" link updated on **all 5 pages** (was `index.html#about`);
  `index.html`'s old `#about` section removed; `sitemap.xml` gained a 5th
  URL.
- **16 new i18n keys × 3 languages** (EN/ES/FR parity verified, 360/360/360):
  `meta.nosotros.*`, `nosotrosHero.*`, `about.intro*`, `cart.luggage*`,
  `whatsapp.labelLuggage`/`whatsapp.luggageFeeLine`, `transfers.priceList*`.

**Verification (static):** `node --check` on every `js/*.js`; EN/ES/FR key
parity 360/360/360 confirmed via a small Node script; every `data-i18n`/
`data-i18n-attr` key used across all 5 HTML pages resolves in the EN
dictionary; every `meta.<page>.title`/`.description` pair present for all 5
`data-page` values; `<section>` tag balance on all 5 pages; every `img/`
reference across HTML+CSS resolves to a real file on disk (this is what
caught the banner path breakage above). Live interaction (cart total with
the luggage fee applied, language switching on the new page, the dialog
backdrop) is the owner's to check in a browser, per this session's
no-Playwright instruction.

**Files modified:** `js/config.js`, `js/cart.js`, `js/i18n.js`,
`css/styles.css`, `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `sitemap.xml`. **Files created:** `nosotros.html`.
`img/banner nosotros.jpeg` was replaced by the owner directly, several
times, over the course of this session — not a file this session created
or needs to maintain going forward.

---

## 2026-07-20 UTC — Merged the 50-destination price list into the calculator, fixed 3 contradicting ticket prices

**Requested (owner, screenshots of the calculator quoting $35 for POP→Puerto
Plata against the reference list's $33.50 for the same trip):** "todos los
precios deberian estar en el calculo no aparte" — every price should be in
the calculator, not a separate list.

**Blocked on a real data conflict before implementing:** the reference
list's cheapest entries (Sosúa $5.50, Cabarete $13.50, Casa Linda $8.50,
etc.) directly contradicted prices already confirmed in an earlier session
(the POP→Sosúa ticket was $23.50) — asked the owner whether the cheap
entries were genuine Puerto-Plata-Airport fares or the competitor's own
local Sosúa/Cabarete short-hops before writing any code that would bake in
a possibly-wrong price. **Confirmed: they're real POP-origin prices.**

**Delivered:**
- Removed the standalone `#price-list` section entirely (HTML + its 4 now-
  unused i18n keys × 3 languages, 12 keys removed, parity re-verified at
  358/358/358).
- Added `POP_PROVINCE_FIXED_FARES` (11 entries — destinations whose name
  matches an existing province exactly: Barahona, Dajabón, La Romana, La
  Vega, Puerto Plata, Samaná, San Pedro de Macorís, Santiago, Santo
  Domingo, Valverde, Monte Cristi) and `POP_FIXED_DESTINATIONS` (39 more —
  towns/resorts too specific to be a province, plus Sosúa/Cabarete via
  their existing `place.*` i18n keys) to `js/config.js`.
- `transfers.html`'s `calcDest` dropdown gained a "Fixed destinations"
  `<optgroup>` (39 new `<option value="fixed:<slug>">` entries) alongside
  the existing 31 provinces, now under their own "Provinces" `<optgroup>`.
- `js/calculator.js`: new `resolveFixedFare(pickup, dest)` — returns the
  confirmed price when one exists, else `null` (formula path unchanged).
  When a fixed fare applies: no vehicle surcharge, passengers capped at 6,
  the vehicle `<select>` disabled (price doesn't change with it), duration
  hidden (no real distance data for these), and selecting a `fixed:`
  destination auto-resets pickup to Puerto Plata Airport (the only airport
  these prices are valid from). Add-to-Cart for a fixed fare now goes in as
  `kind:'fixedRoute'` (snapshotted) instead of `kind:'transfer'` — a
  `'transfer'` item would silently re-derive the wrong formula price the
  next time the cart re-renders.
- Fixed 3 Popular Routes tickets that contradicted the (now-confirmed) list:
  POP→Sosúa $23.50→**$5.50**, POP→Cabarete $33.95→**$13.50**, POP→Puerto
  Plata (province) $38.95→**$33.50**. STI/SDQ/PUJ/AZS-origin tickets are
  unrelated (the sign is POP-only) and untouched.

**Verification (static, via Node `vm.Script` loading the real `config.js`,
plus the usual checks):** every `fixed:` option value in `transfers.html`
resolves in `POP_FIXED_DESTINATIONS` and vice versa (39/39, no orphans in
either direction); every `POP_PROVINCE_FIXED_FARES` key exists in
`PROVINCES` (11/11); the 3 corrected ticket prices match their
`config.js` counterparts exactly; `node --check` on every `js/*.js`; EN/ES/FR
key parity 358/358/358; every `img/` reference resolves. Live interaction
(picking a fixed destination, watching the vehicle select grey out and the
price stay flat, checking the cart total after adding one) is the owner's
to confirm in a browser, per this session's no-Playwright instruction.

**Files modified:** `js/config.js`, `js/calculator.js`, `js/i18n.js`,
`transfers.html`, `DOCS/DEVELOPER_GUIDE.md`, `DOCS/USER_MANUAL.md`,
`PROJECT_INFO.md`, `DOCS/FOLDER_STRUCTURE.md`.

---

## 2026-07-20 UTC — SEO audit, AboutPage JSON-LD, real domain live

**Requested:** confirm every page has SEO essentials, then set the real
domain (owner-confirmed: `caribbeansgtransferstours.com`).

**Delivered:**
- Audited all 5 pages for title, meta description, canonical, Open Graph,
  favicon, JSON-LD and `sitemap.xml` presence — all present except
  `nosotros.html`, which had only a `BreadcrumbList` (no page-type block
  like the other 4 pages' `TravelAgency`/`Service`/`ItemList`). Added an
  `AboutPage` JSON-LD block to match.
- Replaced the `sarieltransfers.com` placeholder with the real domain
  across all 5 pages (canonical + Open Graph), `sitemap.xml` (5 `<loc>`)
  and `robots.txt` (`Sitemap:` line). Left historical files untouched
  (`.playwright-mcp/` QA snapshots, `DOCS/superpowers/` planning docs from
  the 2026-07-17 refactor) — not live site content.
- Updated the go-live checklists in `DOCS/DEPLOYMENT.md` and
  `DOCS/USER_MANUAL.md` to mark the domain item done, and fixed several
  stale "four pages"/"About Us section" references left over from the
  `nosotros.html` split earlier this session.

**Verification (static):** re-grepped all target files for the old domain
string (zero remaining) and the new one (present in all 7); `<section>`
tag balance unchanged on all 5 pages after the `sed` pass (transfers.html
correctly shows 6, down from 7, from the earlier price-list-section
removal — not a regression from this change).

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `nosotros.html`, `sitemap.xml`, `robots.txt`,
`PROJECT_INFO.md`, `DOCS/USER_MANUAL.md`, `DOCS/DEPLOYMENT.md`.

## 2026-07-25 UTC — Channel choice (WhatsApp / email) on every direct-booking button

**Requested:** every "Book Directly" and "Ask for a Quote" button should ask
whether to continue by WhatsApp or by email — WhatsApp sends straight through,
email collects an address first.

**Problem:** those buttons opened `wa.me` immediately, so any visitor without
WhatsApp (or on a desktop with no WhatsApp Web session) hit a dead tab. The
email channel already existed and worked — Formspree via
`submitBookingEmail()` — but was only reachable from the cart checkout and the
footer "Email Us" CTA, never from these 19 buttons.

**Delivered:**
- New `js/contact-choice.js` exposing `openContactChoice(buildRequest)`, plus a
  shared `#contactChoiceDialog` (native `<dialog>`) added to all 5 pages. Step 1
  picks a channel; step 2 (email only) collects name + address and posts to the
  same Formspree endpoint as the cart. Reuses `whatsappLink()`,
  `submitBookingEmail()`, the `.contact-dialog` styling and the cart's
  email-validation pattern rather than adding new mechanisms.
- Rewired the 3 functions all 19 buttons funnel through: `bookDirect()`
  (`js/cart.js`), `requestQuote()` (`js/tours.js`) and the calculator's
  no-fixed-route quote CTA (`js/calculator.js`). The last one changed from an
  `<a href>` built in `update()` to a `<button>` whose message is built on
  click, which removed the mutable `bpQuoteWhatsapp.href` state entirely.
- `openContactChoice` takes a *builder*, not finished strings, so the pending
  request is rebuilt on `sariel:langchange` — the dialog stays open long enough
  for a language switch, which the old click-and-go path never allowed.
- 9 new `choice.*` keys in en/es/fr. Renamed `calc.requestQuoteBtn` from
  "Request a Quote on WhatsApp" to "Ask for a Quote" (3 languages) since that
  button is no longer WhatsApp-only.
- Falls back to opening WhatsApp directly when the dialog is absent or
  `<dialog>` is unsupported, so no button can become a dead end.

**Bug found and fixed during QA:** the new `.contact-choice-*-step
{ display: grid }` rules outranked the UA's `[hidden]` rule (equal specificity,
later wins), so both steps rendered at once. Added the companion
`.contact-choice-channel-step[hidden], .contact-choice-details-step[hidden]
{ display: none; }` — the same pattern `.cart-channel-step` already uses.

**Verification (live browser, Playwright, local server):** ticket Book Directly,
excursion Book Directly, excursion Ask-for-a-Quote at a manual group size of 32,
cruise card (ship name + departure time reach the message), and the calculator
quote CTA for Barahona/La Romana. Confirmed for both channels: the `wa.me` URL
and decoded message, and the exact Formspree JSON payload (`fetch` stubbed so no
real mail was sent). Edge cases: empty name and malformed email both blocked
with focus returned to the offending field; Escape and backdrop click close
while a click inside the content does not; reopening after a successful send
returns to step 1 with a cleared form and a fresh summary; switching language
mid-dialog re-translates both the summary and the sent message. Regression:
the cart's own 2-step checkout still sends correctly. Console clean (0 errors,
0 warnings) on all 5 pages, desktop 1280×900 and mobile 390×844.

**Files created:** `js/contact-choice.js`.
**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `nosotros.html`, `css/styles.css`, `js/i18n.js`, `js/cart.js`,
`js/tours.js`, `js/calculator.js`.

## 2026-07-25 UTC — Owner price corrections + waterfalls copy tweak

**Requested:** POP→Cabarete 28.95 → 33.95; SDQ→Sosúa 198.50 → 219; drop the
"27" from the Charcos de Damajagua blurb.

**Delivered:**
- POP→Cabarete: `POP_FIXED_DESTINATIONS.cabarete` (`js/config.js`) plus the
  ticket's displayed price and both `data-fixed-price` attributes
  (`transfers.html`). STI→Cabarete (98.95) deliberately untouched.
- SDQ→Sosúa: `OTHER_AIRPORT_FIXED_FARES.sdq['fixed:sosua']` (`js/config.js`)
  plus the same three spots in `transfers.html`. The five other `198.50`
  entries (Dajabón, Santo Domingo province, Boca Chica, La Galera, Punta
  Rusia) are different routes and were left alone.
- Removed "27" from `exc2.desc` and `cruise1.desc` in all three languages
  (`js/i18n.js`) and from the two matching HTML fallbacks
  (`excursions.html`, `cruises.html`) — 8 strings total. Other "27 Charcos"
  mentions were left as-is: they use it as the tour's proper name
  (`service.charcos27`, the excursions meta description, the `charcos-27`
  service key) or sit inside a customer testimonial (`reviews.quote4`).

**Verification (live browser, Playwright):** ticket rail renders US$33.95 and
US$219 with matching `data-fixed-price`; the calculator (which reads
`js/config.js` independently of the rail) returns 34/44 for POP→Cabarete at
2/8 pax and 219/229 for SDQ→Sosúa, with the +US$5-per-extra-passenger rule
still applying; STI→Cabarete (99) and POP→Sosúa (24) unchanged. Cart carries
the exact unrounded amounts (33.95 + 219 = 252.95) — the boarding pass's
whole-dollar display is pre-existing `animatePrice` behaviour. Waterfalls
copy verified in EN/ES/FR with no "27 natural"/"27 cascad" left anywhere.

**Not done — already present:** the request also asked to add the Charcos tour
to the excursions page. It is already there as `#exc2` in `excursions.html`
(prices 235/270/324, includes list, guest picker, both CTAs) and has been
since before this session. Flagged to the owner rather than duplicated.

**Pre-existing issue found (not introduced here):** `img/hero-main.mov` and
`img/hero-main.mp4` were deleted outside this session and `img/hero-main.jpg`
replaced with a 2880×2160 version, but the `<video>` elements in
`index.html:157-158` and `transfers.html:136-137` still list both files, so
both pages log a 404. The hero still renders — it falls back to the poster —
but the dead `<source>` tags need removing or repointing.

**Files modified:** `js/config.js`, `transfers.html`, `js/i18n.js`,
`excursions.html`, `cruises.html`.

## 2026-07-25 UTC — Retired 13 calculator destinations + excursions hero swap

**Requested:** remove Hacienda el Choco, Coconut Palms, Hide Away Beach, Sea
Horse Ranch, Villa Caribick, Celuisma, Perla Marina, Playa Laguna, Playa
Dorada, Río Merengue, Sabaneta, Jamao and La Cumbre (Moca) from the transfer
calculator; use `img/hero-excursion.jpg` as the excursions hero.

**Delivered:**
- Dropped all 13 from `POP_FIXED_DESTINATIONS` (`js/config.js`) *and* their
  `<option value="fixed:…">` in `transfers.html`. Both sides are required:
  `filterDestinationOptions()` (`js/calculator.js`) only hides options missing
  from the fare map, so removing the config entry alone would have left 13
  permanently-hidden dead options in the markup. Destination count 49 → 36.
- Existing carts are unaffected: `buildCalcItem()` stores the *resolved* place
  name and `baseFare` on the item, never the config slug, so a saved
  `fixedRoute` row for a retired destination still renders and re-prices.
- `excursions.html` hero `img/hero-main.jpg` → `img/hero-excursion.jpg`, with
  the `alt` rewritten (the old one described the previous photo) and
  `og:image` pointed at the new hero to match the per-page convention
  `cruises.html`/`nosotros.html` already follow.

**Verification (live browser, Playwright):** destination select shows 36
options with none of the 13 present in the DOM at all; all 7 pickup airports
re-filter correctly (POP 36, STI 2, SDQ 1, PUJ 1, AZS 1) and LRM/BRX still
fall through to the quote CTA; prices unchanged on survivors (POP→Puerto Plata
39, STI→Sosúa 99, SDQ→Sosúa 219, PUJ→Sosúa 425, AZS→Sosúa 149). `js/config.js`
passes `node --check` and both edited files still decode as valid UTF-8 with
accented neighbours intact (Cofresí, Gaspar Hernández, Río San Juan). New
excursions hero loads (2500×1666), console clean on that page.

**Left deliberately:** "Playa Dorada" still appears in `index.html`'s
`areaServed` JSON-LD and in the gallery caption `gallery.caption8` — a served
area and a photo caption, not bookable destinations.

**Known issue, still open:** `index.html:157-158` and `transfers.html:136-137`
still reference the deleted `img/hero-main.mov`/`.mp4`, so both pages log a
404. Hero renders via its poster; owner to decide whether to drop the
`<video>` or supply new files.

**Files modified:** `js/config.js`, `transfers.html`, `excursions.html`.

## 2026-07-25 UTC — Fixed hero 404: <video> → <img> on index + transfers

**Problem:** `img/hero-main.mov` and `img/hero-main.mp4` had been deleted and
`img/hero-main.jpg` replaced with a 2880×2160 fleet photo, but the `<video>`
elements in `index.html` and `transfers.html` still listed both files. Chrome
skips the QuickTime source, requests the MP4, and gets a 404 — the only
console error left on the site. The hero still rendered (it fell back to its
`poster`), so the breakage was invisible except in devtools.

**Delivered:**
- Replaced both `<video>` blocks with a plain `<img src="img/hero-main.jpg"
  fetchpriority="high">`, matching the markup `excursions.html`/`cruises.html`
  already use. Wrote a real `alt` describing the actual photo (three white
  fleet minivans) — the `<video>` had been `aria-hidden`, and the old hero
  `alt` on other pages described a beach that is no longer the image.
- Removed the now-dead `initHeroVideo()` IIFE from `js/shell.js` (it queried
  `.hero-bg video` to pause autoplay under `prefers-reduced-motion`; zero
  `<video>` elements remain site-wide) and dropped `.hero-bg video` from the
  two `css/styles.css` rules that still targeted it.

**Verification (live browser, Playwright):** console clean (0 errors, 0
warnings) on all 5 pages — previously 1 error on index and transfers. Hero
`<img>` loads at its full 2880×2160 on both pages and renders sharply at
1280×900. On a 390×844 viewport the cover scale is 0.49× — the source is
being downscaled, not stretched, so the earlier low-resolution hero complaint
is resolved by the owner's new image. `js/shell.js` passes `node --check`.

**Files modified:** `index.html`, `transfers.html`, `js/shell.js`,
`css/styles.css`.

## 2026-07-25 UTC — New cruises hero (img/hero-cruises.jpeg)

**Requested:** point the cruises hero at the newly added `img/hero-cruises.jpeg`.

**Delivered:** updated `src` and `og:image` in `cruises.html`, and rewrote the
`alt` — the old one ("Cruise ship docked in a turquoise Caribbean port") no
longer matched the photo, which shows a brightly painted hull at Taino Bay with
colorful beach chairs in the foreground. Kept the `.jpeg` extension as the
owner supplied it; the project already mixes `.jpg`/`.jpeg`.

**Verification (live browser, Playwright):** loads at 900×1200, console clean.
Cover-scale measured on both breakpoints — 390×844 mobile: **0.87× (downscaled,
sharp)**; 1280×900 desktop: **1.41× (upscaled)**. The portrait source suits
mobile well and is the weaker fit on desktop, where it still reads acceptably
but is softer than the old landscape file was proportionally.

**Orphaned:** `img/hero-cruises.jpg` (1024×576, 463 KB) is now unreferenced.
Left in place pending the owner's call.

**Files modified:** `cruises.html`.

## 2026-07-25 UTC — Retired 11 more destinations + Boca Chica repriced

**Requested:** remove Bahía Príncipe, Blue Moon, Sánchez, Bonao, Casa Linda,
Gaspar Hernández, Valverde, La Vega, San Francisco, Nagua and La Unión from
the calculator; set Boca Chica to US$260.

**Delivered:**
- Nine (Bahía Príncipe, Blue Moon, Sánchez, Bonao, Casa Linda, Gaspar
  Hernández, San Francisco, Nagua, La Unión) dropped from
  `POP_FIXED_DESTINATIONS` + their `<option value="fixed:…">`.
- **Valverde and La Vega are provinces, not fixed destinations** — they live in
  `POP_PROVINCE_FIXED_FARES` (the fare) *and* in `PROVINCES` (the master list
  with coordinates, consumed by `estimateRoute()`). Only the fare entry and the
  `<option>` were removed; the `PROVINCES` records are untouched, asserted
  in-script after the edit. A blind slug match would have deleted both copies
  and broken the distance-estimation data.
- `POP_FIXED_DESTINATIONS['boca-chica'].price` 198.50 → 260. It has no ticket
  on the Popular Routes rail, so `js/config.js` was the only place to change.

**Verification (live browser, Playwright):** destination select down to 25
options, every one of them visible for POP and none of the 11 present in the
DOM — zero hidden-but-present options, i.e. `js/config.js` and `transfers.html`
are exactly in sync. POP→Boca Chica returns 260 at 2 pax and 270 at 8 (the
+US$5-per-extra-passenger rule intact); POP→Sosúa (24) and the POP→Santiago
province route (99) unchanged. All 7 pickups re-filter correctly (POP 25, STI 2,
SDQ 1, PUJ 1, AZS 1; LRM/BRX still fall through to the quote CTA). Console
clean, `node --check` passes.

**Files modified:** `js/config.js`, `transfers.html`.

## 2026-07-25 UTC — More price updates + "destination not listed" escape hatch

**Requested:** Punta Cana 425, Santo Domingo 219; add a prompt so a visitor
whose destination isn't listed can write in, choosing WhatsApp or email.

**Delivered:**
- `POP_FIXED_DESTINATIONS['punta-cana']` 398.50 → 425. Note
  `OTHER_AIRPORT_FIXED_FARES.puj` was already 425 and is a different route
  (PUJ airport → Sosúa) — untouched.
- `POP_PROVINCE_FIXED_FARES['santo-domingo']` 198.50 → 219, i.e. POP → Santo
  Domingo province. The other Santo Domingo fare (SDQ airport → Sosúa) was
  already set to 219 earlier today and is unrelated.
- New always-visible line under the Destination select in `transfers.html`:
  "Don't see your destination? **Write to us**". The button reuses
  `openContactChoice()` (`js/contact-choice.js`), so it opens the same
  WhatsApp-or-email chooser every booking button uses — no new dialog, no new
  email plumbing. Wired in `js/calculator.js` next to the existing quote CTA.
  Message is built lazily and names the currently selected pickup airport, so
  it re-renders on language change like every other request.
- Added a generic `.link-btn` to `css/styles.css` (text-styled but a real
  `<button>`, since it opens a dialog rather than navigating).
- 3 new i18n keys (`calc.missingDest`, `calc.missingDestCta`,
  `calc.missingDestMessage`) across en/es/fr.

**Why an always-visible prompt:** the existing `#bpQuoteCta` only appears for
airports with *zero* fixed routes (LRM/BRX). After today's removals the POP list
is down to 25 destinations, so a visitor heading somewhere unlisted from a
covered airport previously had no prompt at all.

**Verification (static, per owner's request to stop using Playwright):**
`node --check` passes on `js/config.js`, `js/calculator.js`, `js/i18n.js`; the
3 new keys appear exactly 3× each (one per language); `#calcMissingDest`
resolves 1:1 between `transfers.html` and `js/calculator.js`; `.link-btn` is
defined in CSS; and `contact-choice.js` loads before `calculator.js` on that
page, so `openContactChoice` is defined when the handler binds.

**Files modified:** `js/config.js`, `js/calculator.js`, `js/i18n.js`,
`transfers.html`, `css/styles.css`.

---

## 2026-07-29T00:00:00.000Z — Google Analytics 4 (gtag.js) en todo el sitio

**Solicitado:** implementar Google Analytics en la página (propiedad
`G-P5B6J8Y75V`).

**Hecho:** se insertó el snippet oficial de gtag.js en el `<head>` de las 5
páginas HTML, inmediatamente después del `<meta name="viewport">` y antes del
`<title>`, para que cargue lo más temprano posible sin bloquear el render
(`async`). No se usó un archivo JS compartido porque el sitio es HTML estático
sin sistema de plantillas y Google recomienda el tag inline al inicio del head.

**Verificación (estática, sin navegador):** `G-P5B6J8Y75V` aparece 3× en cada
uno de los 5 archivos (src del script + `config`), `git diff --stat` muestra
+10 líneas por archivo y ningún otro cambio. La validación real del flujo de
datos se hace en GA4 → Informes en tiempo real tras el deploy.

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `nosotros.html`.

---

## 2026-07-29T00:00:00.000Z — `<lastmod>` en sitemap.xml

**Contexto:** Search Console reportó 3 URLs en "Descubierta: actualmente sin
indexar" (`cruises.html`, `excursions.html`, `transfers.html`, último rastreo
N/D) y 1 en "Página con redirección" (`http://www.` → 301 → apex https).

**Diagnóstico:** ningún problema técnico. Se verificó en vivo: `robots.txt`
permite todo, no hay meta `noindex`, las 5 canonicals son autorreferenciales y
correctas, el sitemap devuelve 200 `application/xml`, las 3 páginas están
enlazadas desde `index.html`, y el contenido está en el HTML (0 elementos
`data-i18n` vacíos — el i18n reemplaza texto, no lo inyecta). El redirect
`http://www` → `https://` apex es el comportamiento deseado, no un error.
La causa es que el dominio se detectó el 25/7/26 y Google aún no ha asignado
presupuesto de rastreo.

**Hecho:** se añadió `<lastmod>2026-07-29</lastmod>` a las 5 entradas de
`sitemap.xml` para dar a Google una señal de priorización de rastreo. Se
documentó en un comentario del propio archivo que el campo es manual (sitio
estático en GitHub Pages) y que no debe bumpearse por cambios cosméticos.

**Verificación (estática, sin navegador):** el XML parsea correctamente con
`xml.dom.minidom`; 5 `<url>` y 5 `<lastmod>`; `git diff --stat` = +13/-1 en un
solo archivo.

**Files modified:** `sitemap.xml`.

---

## 2026-08-11T17:51:20.000Z — Nitidez de las fotos de los heroes

**Contexto:** se reportó que las fotos de los heroes se ven pixeladas y se pidió
reducirlas un 20%.

**Diagnóstico:** el pixelado es real pero solo en 2 de las 5 páginas, y la causa
no es el tamaño de visualización sino la resolución de origen. El hero mide
`100svh` y `.hero-bg` tenía `inset: -12% 0`, así que la caja que `object-fit:
cover` debe llenar era 124% del alto del viewport (1920×1339 en 1080p). Escalas
medidas: `hero-main.jpg` 2880×2160 → 0.667× (reduce, nítida), `hero-excursion.jpg`
2500×1666 → 0.804× (reduce, nítida), `hero-cruises.jpeg` 900×1200 → **2.133×**
(amplía), `banner nosotros.jpeg` 1161×574 → **2.333×** (amplía). El "-20%"
literal no era viable: `cover` redimensiona para llenar la caja, así que un
`scale(0.8)` destapa el fondo en los 4 bordes, y 2.333× → 1.866× seguiría siendo
ampliación. No hay ninguna otra imagen en `img/` con ancho suficiente para
reemplazar las dos malas (solo `hero-main` y `hero-excursion` superan 1800px).

**Hecho:** se atacó la ampliación por el lado de la caja, sin tocar `cover`.
1. `.hero-bg`: `inset: -12% 0` → `inset: 0 0 -12%`. El parallax del hero solo se
   desplaza hacia arriba, por lo que el sangrado superior era altura muerta que
   la imagen tenía que ampliarse para llenar sin beneficio alguno. La caja pasa
   de 124% a 112% del alto.
2. `@keyframes hero-zoom`: `scale(1.12)` → `scale(1.04)`, para no sumar un 12%
   extra de ampliación durante los segundos de apertura.
3. `js/shell.js` `initParallax()`: se añadió `bleedTop`/`bleedBottom` por capa y
   un clamp del desplazamiento a esos límites. Necesario porque quitar el
   sangrado superior dejaba expuesto el borde de arriba, y además corrige una
   fuga preexistente: el recorrido era 18% del alto contra un sangrado de 12%,
   de modo que al hacer scroll profundo se destapaban hasta 64.8px de fondo
   oscuro bajo el hero.

**Verificación (estática, sin navegador):** script de cálculo sobre las
dimensiones reales de los archivos. Escala de `cover` antes → después:
nosotros 2.333 → 2.107 (**−9.7%**), excursions 0.804 → 0.768 (−4.5%),
index/transfers 0.667 → 0.667 (sin regresión), cruises 2.133 → 2.133 (**sin
cambio**: su límite es el ancho, no el alto). Simulación del parallax en todo el
rango de scroll (0→1080px): hueco máximo 0.0px arriba y 0.0px abajo, contra
64.8px abajo antes del fix. `node --check js/shell.js` OK; llaves de
`styles.css` balanceadas (573/573).

**Pendiente (no resuelto por este cambio):** `cruises.html` sigue amplificando
2.13× y `nosotros.html` 2.11×. Ningún ajuste de CSS lo arregla — hacen falta
fotos horizontales de ≥2400px de ancho para `img/hero-cruises.jpeg` (hoy 900×1200,
vertical) y `img/banner nosotros.jpeg` (hoy 1161×574).

**Files modified:** `css/styles.css`, `js/shell.js`.

---

## 2026-08-11T18:06:15.000Z — SEO: orientar el sitio a Sosúa + Puerto Plata

**Contexto:** auditoría de SEO con el objetivo de captar turistas que visitan
Sosúa. Se acordó ejecutar solo los "quick wins" (sin página nueva de Sosúa y sin
URLs por idioma), apuntando a Sosúa **y** Puerto Plata a la vez.

**Diagnóstico:** el SEO técnico estaba sano (canonicals, sitemap, robots, JSON-LD,
HTML semántico) pero el sitio apuntaba a "Puerto Plata" y "Dominican Republic",
no a Sosúa. Menciones antes del cambio: index 3 (meta description, `areaServed`
y un pie de foto), excursions **0**, cruises **0**, nosotros 4. Ningún `<title>`
ni ningún `<h1>` contenía "Sosúa". Las 24 menciones de transfers.html eran casi
todas atributos (`data-fixed-to="place.sosua"`), no texto indexable.

**Hallazgo crítico de implementación:** `applyStaticTranslations()` corre en cada
carga (js/i18n.js:1469) y sobrescribe `document.title`, `meta[name=description]`,
`og:title` y `og:description` desde las claves `meta.{page}.{title,description}`,
además del `innerHTML` de todo `[data-i18n]`. Como Googlebot renderiza JS, **las
cadenas de i18n.js son el SEO real**; editar solo el HTML no habría tenido ningún
efecto. Se actualizaron ambos y se verificó la sincronía para evitar parpadeo.

**Hecho:**
1. `js/i18n.js`: reescritos los 10 pares `meta.*.title` / `meta.*.description` en
   los 3 idiomas (30 cadenas), con Sosúa y Puerto Plata al frente y el precio
   real POP→Sosúa ($23.95, tomado de `data-fixed-price` en transfers.html).
2. `js/i18n.js` + los 5 HTML: reescritos 7 textos de hero (eyebrows y leads de
   excursions/cruises) en los 3 idiomas (21 cadenas) para meter geografía en el
   texto visible bajo el H1.
3. Los 5 HTML: `<title>`, description, `og:title` y `og:description` sincronizados
   con las cadenas EN de i18n.js por construcción (el script las lee del propio
   i18n.js, no las duplica).
4. **Bug corregido:** `og:image` era una ruta relativa en las 5 páginas, lo que
   rompe la vista previa al compartir por WhatsApp — el canal de reserva del
   negocio. Ahora es URL absoluta. Añadidos también `og:url`, `og:site_name` y
   `twitter:card` (antes 0 en las 5 páginas).
5. Schema: `areaServed` de index.html ampliado con Sosúa al frente + POP, Amber
   Cove y Taino Bay; añadidos `telephone` (+1-829-627-7733, tomado de
   `js/config.js`) e `image` absoluta. En transfers.html el `Service` pasó de
   `areaServed: "Dominican Republic"` a la lista de localidades y se le añadió un
   `Offer` con el precio real de POP→Sosúa.
6. `sitemap.xml`: los 5 `<lastmod>` a 2026-08-11 (cambio real de contenido).

**No se hizo, deliberadamente:**
- **`aggregateRating`**: se había ofrecido, pero es incorrecto aquí. Google ignora
  el `aggregateRating` autoasignado en `LocalBusiness`/`TravelAgency` (reseñas
  self-serving no son elegibles para rich results) y marcar valoraciones no
  verificables es riesgo de acción manual. Las estrellas de un negocio local
  salen del Google Business Profile, que el cliente ya tiene.
- **`geo`, `openingHours`, `streetAddress`**: no constan en el código y no se
  inventaron. Deben copiarse del Google Business Profile para que el NAP coincida.
- **Reescritura de los `<h1>`**: siguen siendo copy de marca sin palabras clave
  ("Your ride is already waiting"). Cambiarlos es una decisión de diseño, no un
  quick win.

**Verificación (estática, sin navegador):** script `verify-seo.js`, 0 fallos.
Menciones de Sosúa por página después: index 10, transfers 34, excursions 6,
cruises 6, nosotros 7 (antes: 3 / 24 / 0 / 0 / 4). Longitud de títulos 62-65 y de
descriptions 150-158 caracteres. Los 10 bloques JSON-LD parsean con `JSON.parse`.
`og:image` absoluta y `twitter:card` presentes en las 5. HTML idéntico a las
cadenas EN de i18n.js en las 5 páginas (sin parpadeo). `node --check js/i18n.js`
OK. `sitemap.xml` parsea con `xml.dom.minidom`: 5 `<url>`, 5 `<lastmod>`.

**Files modified:** `js/i18n.js`, `index.html`, `transfers.html`,
`excursions.html`, `cruises.html`, `nosotros.html`, `sitemap.xml`.

---

## 2026-08-11T18:14:06.000Z — CTA a las reseñas de Google Business Profile (andamiaje)

**Contexto:** se pidió mostrar las reseñas del Google Business Profile en el
sitio. Se evaluaron tres vías: la API oficial de Places (máximo 5 reseñas, key
pública en un sitio estático, requiere facturación y prohíbe cachear el texto
más de 30 días), un widget de terceros (script externo, no se traduce a ES/FR y
rompe el lenguaje visual) y curaduría manual con enlace a la ficha. Se eligió la
tercera: el clic hacia el perfil aporta más al posicionamiento local que
incrustar el texto, y encaja con el sistema i18n y el diseño existentes.

**Hecho (parte que no depende de datos del cliente):**
1. `js/config.js`: nuevas claves `googleReviewsUrl` y `googleReviewCount`,
   documentadas junto a `whatsappNumber`. Mientras la URL esté vacía el CTA no
   se renderiza, así que la sección sigue comportándose como antes.
2. `index.html`: contenedor `.reviews-cta` con un `<a id="googleReviewsLink">`
   bajo `.review-grid`. Sin `data-i18n` a propósito: la etiqueta interpola el
   contador, y `applyStaticTranslations()` la sobrescribiría con la plantilla
   sin sustituir.
3. `css/styles.css`: estilos de `.reviews-cta` en la sección 12 (Reviews).
4. `js/i18n.js`: `reviews.readOnGoogle` y `reviews.readOnGoogleCount` en los 3
   idiomas (6 cadenas). La segunda usa el token `{count}` que ya soporta `t()`.
5. `js/shell.js`: `initGoogleReviewsLink()`, siguiendo el patrón de
   `initWhatsAppLinks()` — se re-renderiza con el evento `sariel:langchange`.

**Pendiente (requiere datos del cliente, no se inventan):** el texto de las
reseñas reales y sus autores, la URL de la ficha, y la calificación y el conteo
verdaderos. Los 4 testimonios actuales (`reviews.quote1-4`) siguen en su sitio.

**Riesgo señalado al cliente:** el hero declara "4.9 · 350+ reviews"
(`hero.trustReviews`, js/i18n.js) sin que esa cifra esté respaldada por ninguna
fuente en el código. Al enlazar la ficha real, ambos números quedan a un clic de
ser contrastados: si no coinciden, el efecto es el contrario al buscado. Debe
verificarse contra el perfil antes de publicar el CTA.

**Verificación (estática, sin navegador):** `node --check` OK en i18n.js,
config.js y shell.js. Script `verify-reviews.js`, 0 fallos: 2 claves nuevas × 3
idiomas; `{count}` interpola correctamente en en/es/fr; y la lógica del CTA
simulada en 3 escenarios — config vacía → oculto, solo URL → visible con
etiqueta sin contador, URL + contador → visible con "Read all 350 reviews on
Google". Ningún caso produce un enlace visible con href muerto.

**Files modified:** `js/config.js`, `js/i18n.js`, `js/shell.js`, `index.html`,
`css/styles.css`.

---

## 2026-08-11T18:18:58.000Z — Instagram en el footer y en el schema

**Contexto:** se pidió publicar el Instagram del negocio en la página. La URL
entregada traía el parámetro de rastreo de compartición
(`?igsh=MTZrcnNnMXd1OW53Yw==`), que es un token por-compartición y no forma parte
de la dirección del perfil; se guardó la URL limpia.

**Hecho:**
1. Los 5 HTML: enlace en la columna "Contact" del footer, justo tras el
   `mailto:`, con icono SVG en el mismo estilo de trazo que el resto de iconos
   del sitio (`fill="none" stroke="currentColor" stroke-width="1.8"`) y el handle
   `@sg.caribbean_transfers_tours`. Lleva `target="_blank" rel="noopener"`.
2. `css/styles.css`: `.footer-instagram` en la sección del footer — `inline-flex`
   para que el icono y el handle queden alineados y el texto pueda partirse en
   pantallas estrechas sin desplazar el icono.
3. Schema `sameAs` — la pieza que había quedado pendiente en la auditoría de SEO
   del 2026-08-11. Añadida al `TravelAgency` de index.html, al `provider` del
   `Service` de transfers.html y al `about` del `AboutPage` de nosotros.html.
   `sameAs` es la señal con la que Google vincula el sitio con los perfiles
   sociales de la misma entidad. En nosotros.html se añadió también `telephone`.

**Nota:** excursions.html y cruises.html no llevan `sameAs` porque sus bloques
JSON-LD son `ItemList` + `BreadcrumbList` y no declaran la entidad del negocio.
Marcarla ahí sería duplicar la entidad sin aportar señal.

**Verificación (estática, sin navegador):** script `verify-instagram.js`, 0
fallos. 1 sola instancia del enlace por página en las 5, URL correcta, sin
rastro de `igsh=`, y `target`/`rel` presentes. Los 10 bloques JSON-LD siguen
parseando con `JSON.parse` y 3 contienen el `sameAs`. Llaves de `styles.css`
balanceadas (577/577).

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `nosotros.html`, `css/styles.css`.

---

## 2026-08-12 UTC — Página de destino Sosúa (SEO / AEO / GEO)

**Requested:** una página de Sosúa optimizada para SEO, AEO y GEO que explique
por qué quien piensa venir a Sosúa —en avión o en crucero— debe elegirnos, con
libertad para crear páginas adicionales si ayudaban.

**Decisión de alcance (confirmada con el usuario antes de implementar):** una
sola página, `sosua.html`, hecha a fondo, en vez de tres o cuatro páginas de
destino más finas. Los motores generativos citan páginas densas, no muchas
páginas superficiales, y tres páginas de destino gemelas sin diferenciación
real se canibalizan entre sí. Enlace de navegación **solo en el footer** (no en
el header): el nav de escritorio ya lleva 5 ítems y un sexto lo aprieta en
anchos de tablet.

**Delivered:**
- **`sosua.html` (nueva, 6.ª página)** — shell idéntico al de las otras cinco
  (header, cart drawer, footer, FAB, ambos `<dialog>`), `data-page="sosua"`,
  mismos 6 scripts que `nosotros.html`. `<main>` en 8 secciones, cada una con
  una función concreta:
  1. Hero propio (`img/gallery-4-aerial-coast.jpg`).
  2. **Bloque de respuesta rápida** (`#quick-answer`) — un párrafo factual de
     ~70 palabras más un `<dl>` de 6 datos duros, justo debajo del hero. Es el
     bloque que los motores de respuesta levantan literal, así que se mantiene
     factual a propósito y no debe convertirse en copy de marketing.
  3. **Llegada en avión** (`#by-air`) — `<table>` con los 5 aeropuertos hacia
     Sosúa: distancia, duración y **el precio fijo real** (POP $23.95, STI
     $98.50, AZS $148.50, SDQ $219, PUJ $425), más 3 pasos de "qué pasa el día
     que aterrizas".
  4. **Llegada en crucero** (`#by-cruise`) — Taino Bay (~35 min) y Amber Cove
     (~40–45 min) más la cuenta del all-aboard. **Sin precio, a propósito**:
     las tarjetas de `cruises.html` siguen con `data-prices="0"` placeholder,
     así que citar una cifra sería inventarla.
  5. **Comparativa** (`#why-us`) — `<table>` de 6 filas × 4 columnas contra
     taxi de aeropuerto, shuttle compartido y carro de alquiler. Redactada de
     forma neutral y matizada ("normalmente", "rara vez"): una tabla injusta es
     deshonesta y además el visitante la desmiente al llegar.
  6. **Qué hay alrededor** (`#around`) — 6 tarjetas con distancias reales, una
     de ellas el Museo Judío y el asentamiento de refugiados de 1940, dato
     distintivo que ninguna página competidora repite.
  7. **FAQ** de 10 preguntas, reutilizando el acordeón existente
     (`.faq-item` → `initFaq` en `js/shell.js`, ya genérico — sin tocar JS).
  8. CTA de reserva con copy propio (`sosua.book.*`).
- **4 bloques JSON-LD**: `TouristDestination` (resuelve Sosúa como entidad, con
  `geo` e `includesAttraction`), `Service` + `hasOfferCatalog` con las 5 tarifas
  como `Offer`, `FAQPage` con las 10 preguntas y `BreadcrumbList`.
- **`js/i18n.js`** — **151 claves `sosua.*` nuevas en cada uno de `en`, `es` y
  `fr`** (453 en total), más `meta.sosua.title`/`.description` y
  `footer.serviceSosua` en los tres idiomas.
- **`css/styles.css`** — bloque nuevo "Destination pages (sosua.html)" al final
  del archivo. **Todos los selectores llevan prefijo `.dest-`**, así que la
  página nueva no puede provocar regresiones en las otras cinco. Nada de lo ya
  existente se modificó.
- **Las 5 páginas anteriores** — una sola línea añadida a la columna Services
  del footer (`sosua.html` / `footer.serviceSosua`), entre "Cruises" y "Request
  booking". Sin tocar el header nav ni el grid del footer (añadir una 5.ª
  columna habría roto el layout entre 760 y 1039 px, donde la columna Contact
  ya va justa con el email largo).
- **`sitemap.xml`** — 6.ª URL, `priority` 0.9, `lastmod` 2026-08-12.

**Verificación (estática, sin navegador):**
- `node --check js/i18n.js` — sintaxis válida.
- Paridad de claves: las 151 `sosua.*` existen en `en`, `es` y `fr`; 0 claves
  sobrantes. (Quedan 13–14 huecos **preexistentes** ajenos a este cambio:
  `about.point1..6Title/Desc`, `about.pointsHeading` en es/fr y
  `cart.luggageCount` en es — caen a inglés por el fallback de `t()`.)
- Las 218 claves `data-i18n` / `data-i18n-attr` de `sosua.html` resuelven, y
  también las de las otras 5 páginas (0 claves rotas en todo el sitio).
- Los 151 elementos `sosua.*` tienen un fallback estático **idéntico** al valor
  del diccionario inglés, así que el HTML servido al crawler coincide con el
  render post-JS.
- Los 4 bloques JSON-LD parsean con `JSON.parse`, y las 10 preguntas/respuestas
  del `FAQPage` coinciden **palabra por palabra** con `sosua.faq.q1..q10` /
  `a1..a10` del diccionario.
- Enlaces internos: 0 rotos en las 6 páginas (archivo + ancla verificados). Dos
  se corrigieron durante la implementación: `transfers.html#routes` no existe
  (→ `#transfers`) e `index.html#about` ya no existe (→ `#why-us`, ancla local,
  como hacen transfers/excursions/cruises).
- Balance de etiquetas HTML: las 6 páginas cierran correctamente.
- `css/styles.css`: llaves balanceadas (633/633).

**Pendiente de confirmar por el dueño antes de publicar:** las distancias y
duraciones (POP ~19 km/~25 min, STI ~85 km/~1 h 30, AZS ~155 km/~2 h 30, SDQ
~245 km/~4 h, PUJ ~300 km/~4 h 45, Amber Cove ~32 km, Taino Bay ~27 km) son
cifras aproximadas de carretera, etiquetadas como tales en la página. Los
precios sí salen de `js/config.js` / `transfers.html`.

**Files created:** `sosua.html`.
**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `nosotros.html`, `js/i18n.js`, `css/styles.css`, `sitemap.xml`,
`PROJECT_INFO.md`, `DOCS/DEVELOPER_GUIDE.md`, `DOCS/FOLDER_STRUCTURE.md`,
`DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`.
**Files deleted:** none.

---

## 2026-08-12 UTC — Diagnóstico de indexación + optimización SEO/AEO/GEO del sitio

**Requested:** optimizar todo el sitio para SEO, AEO y GEO, y averiguar por qué
`transfers.html`, `excursions.html` y `cruises.html` aparecen en Search Console
como **"Descubierta: actualmente sin indexar"** con **Último rastreo: N/D**.

### Diagnóstico (evidencia, no suposiciones)

**No existe ningún bloqueo técnico.** Comprobado contra el sitio en vivo:

| Comprobación | Resultado |
|---|---|
| HTTP de las 3 páginas | `200`, 0.18–0.30 s |
| Googlebot (User-Agent real) | `200`, 50 KB completos, 0.18 s |
| `noindex` / `nofollow` | ninguno en todo el repo |
| Canonicals | correctos, auto-referenciados |
| `robots.txt` | allow-all + puntero al sitemap |
| `www` → apex / `http` → `https` | `301` correctos |
| Dominio viejo mal escrito `caribbeansgtransfertours.com` (commit `d146f7d`) | no resuelve — sin contenido duplicado |

**"Último rastreo: N/D" significa que Google nunca descargó esas URLs**, así que
ningún factor on-page pudo causarlo — Google no las ha visto. La causa es la
edad del dominio: el `CNAME` se creó el **2026-07-23** (commit `51ab3e7`, con el
dominio mal escrito; corregido el mismo día en `ee4ba47`), y la gráfica de GSC
muestra las 3 páginas apareciendo entre el 19 y el 30 de julio. Un dominio de
días sin backlinks consigue que se rastree la home y se **encolen** las
subpáginas. Es el comportamiento esperado, no una avería. Se corrige con tiempo,
señales de autoridad y solicitud manual de indexación (acción del dueño en GSC).

**Lo que sí era un problema real, medido:** solapamiento de 5-gramas del `<main>`
entre páginas. `cruises.html` era prácticamente un duplicado de
`excursions.html` — sus 4 tarjetas eran copia **palabra por palabra** de
`exc2`/`exc4`/`exc6`/`exc7`. Cuando Google por fin rastreara, era candidata
directa a caer como duplicada.

| Par | Antes | Después |
|---|---|---|
| excursions ↔ cruises | **73%** | **24%** |
| transfers ↔ cruises | 40% | 16% |
| index ↔ transfers | 22% | 23% |

Segundo hallazgo: los H1 de esas 3 páginas no contenían ninguna palabra clave
(*"Your ride is already waiting"*, *"Days you'll never forget"*, *"Off the ship,
into paradise"*), mientras la palabra clave estaba desperdiciada en el eyebrow.

### Delivered

- **Google Business Profile conectado** (`js/config.js`). El enlace que aportó el
  dueño (`g.page/r/CTyfgd3ZE2wPEBM/review`) es el de **escribir** reseña: rebota
  a un login de Google, así que es incorrecto para un CTA de "leer reseñas". Se
  guarda como `googleWriteReviewUrl` y el CTA usa la ficha real. Resueltos por
  redirección: **Place ID `ChIJV_SML-x-iykRPJ-B3dkTbA8`**, CID `1111285034498760508`.
  `search.google.com/local/reviews?placeid=…` **da 404** — no usar.
  `googleReviewCount` se deja vacío a propósito: nadie ha verificado el número real.
- **H1 con palabra clave** en las 3 páginas, sin perder la voz de marca: el
  eyebrow y el H1 **intercambian contenido**. Cero copy nuevo, cero cambio de
  maquetación, y el H1 pasa a decir "Airport transfers in Puerto Plata & Sosúa" /
  "Private day tours from Sosúa & Puerto Plata" / "Amber Cove & Taino Bay shore
  excursions".
- **`cruises.html` de-duplicada**: las 4 descripciones reescritas desde el punto
  de vista del crucerista (distancia desde cada muelle, cómo encaja en la escala,
  planificación hacia atrás desde el all-aboard) en los 3 idiomas.
- **Bloques AEO en las 3 páginas**: bloque de respuesta rápida (párrafo factual +
  `<dl>` de 5 datos duros) justo tras el hero, y **FAQ propia de 6 preguntas** con
  su `FAQPage` JSON-LD. **El JSON-LD se genera desde el diccionario**, así que la
  copia invisible que lee Google no puede desincronizarse de la visible.
  Reutiliza los componentes `.dest-*` de `sosua.html` y `.faq-*` — **sin CSS nuevo**.
  Contenido de `<main>`: transfers 647→987 palabras, excursions 724→1014,
  cruises 483→857.
- **Entidad de negocio unificada**: antes el negocio se describía de 3 formas
  distintas y `excursions.html`/`cruises.html` no lo declaraban. Ahora las 6
  páginas llevan el mismo bloque `TravelAgency` bajo un `@id` estable
  (`…/#organization`), con `geo` (coords de `PROVINCES['puerto-plata']`),
  `hasMap`, `email`, `currenciesAccepted`, `paymentAccepted` y el perfil de
  Google en `sameAs`; `provider`/`about` ahora referencian ese `@id`.
  **No se declaran horarios**: no están indicados en ninguna parte del sitio e
  inventarlos sería adivinar.
- **Rese\u00f1as distintas por p\u00e1gina** (antes las mismas 2 citas en 3 p\u00e1ginas):
  transfers `[1,3]`, excursions `[2,4]`, cruises `[4,1]`. **No se inventó ningún
  testimonio** — solo se redistribuyeron los 4 existentes. Añadido el CTA de
  reseñas de Google bajo la sección de reseñas de las 3 páginas.
- **Claims obsoletos corregidos** en los 3 idiomas: `services.transferMeta` decía
  "From US$25" cuando la tarifa real más barata es **US$23.95** (POP→Sosúa en
  `js/config.js`), y `services.excursionsMeta` decía "5 signature experiences"
  cuando hay **6**. Un precio que contradice el ticket rail es exactamente lo que
  un motor de respuesta le devolvería al visitante.
- **Fallback estático sincronizado con el diccionario en las 6 páginas.**
  `applyStaticTranslations()` reescribe el `innerHTML` de todo `[data-i18n]` al
  cargar, así que el visitante siempre ve el diccionario; el texto literal del
  HTML es lo que indexa un crawler sin JS. Había **4 divergencias reales
  preexistentes** — `transfersHero.lead`, `exc4.desc` (¡diferencia de precio!),
  `about.introHeading`, `about.introBody` — donde Google indexaba texto que
  ningún humano llegaba a ver. Los 1046 elementos `[data-i18n]` del sitio
  coinciden ahora exactamente con el diccionario.
- **Enlace de FAQ del nav** repuntado al `#faq` local en las páginas que ahora
  tienen uno propio (transfers, excursions, cruises, sosua), igual que `#reviews`.
- **`sitemap.xml`**: `lastmod` 2026-08-12 en las 6 URLs.
- **`js/i18n.js`**: 78 claves nuevas × 3 idiomas (234 strings).

**Verificación (estática, sin navegador):** `node --check` en `i18n.js` y
`config.js`; paridad de las 78 claves nuevas en `en`/`es`/`fr`; las 1046 claves
`data-i18n` del sitio resuelven; **fallback estático == diccionario en los 1046
elementos**; los 22 bloques JSON-LD parsean; los 3 `FAQPage` coinciden palabra
por palabra con el diccionario; 0 enlaces internos rotos; etiquetas balanceadas
en las 6 páginas; 1 solo `<h1>` por página.

### Pendiente — acciones que no puedo hacer yo

1. **Desplegar** (nada de esto está en producción todavía) y **reenviar el
   sitemap** en Search Console.
2. **Solicitar indexación** a mano para las 3 URLs (Inspección de URLs →
   Solicitar indexación). Es lo único que salta la cola de rastreo.
3. **Testimonios reales.** Los 4 actuales siguen siendo placeholders
   (`DOCS/DEPLOYMENT.md` línea 49 sin marcar) y ahora están en un sitio indexado.
   Con la ficha de Google ya conectada, sustituirlos por reseñas reales es la
   mejora de credibilidad más barata que queda. **No se ha añadido `Review` ni
   `aggregateRating` a JSON-LD** — marcar reseñas inventadas es spam de datos
   estructurados y expone a una acción manual.
4. **Verificar `googleReviewCount`** en la ficha y rellenarlo en `js/config.js`.
5. **Confirmar tiempos/distancias** de las tarjetas de crucero (hedgeados como
   aproximados, mismo criterio que `sosua.html`).

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `nosotros.html`, `sosua.html`, `js/i18n.js`, `js/config.js`,
`sitemap.xml`, `DOCS/PROOF_OF_WORK.md`, `DOCS/DEVELOPER_GUIDE.md`,
`DOCS/USER_MANUAL.md`, `DOCS/DEPLOYMENT.md`.
**Files created / deleted:** none.

---

## 2026-08-13 12:15 UTC — sosua.html: distancias, tiempos e idiomas corregidos por el operador

**Lo que se pidió (datos reales del operador, no estimaciones):**

1. Muelles de crucero → Sosúa: **Taino Bay ~50 min**, **Amber Cove ~60 min**
   (antes 35 / 40–45).
2. Los choferes hablan **solo inglés y español** — se retira el francés como
   idioma de conducción (la interfaz del sitio sigue siendo trilingüe EN/ES/FR).
3. POP → Sosúa: **~9 km, 10 a 15 min** (antes 19 km / 20–30 min).
4. Excursión **Charcos de Damajagua**: se quita el "27" del nombre y la duración
   pasa a **~1 h 30** (antes ~45 min).

**Cambios en `sosua.html`** — el dato viejo estaba repetido en 14 sitios, incluida
la capa que leen los motores de respuesta:

- `<meta name="description">` y `og:description` (19 km / 25 min → 9 km / 15 min).
- JSON-LD `TouristDestination.description` (19 km → 9 km).
- JSON-LD `FAQPage`: respuestas 1, 3 y 5 reescritas para que sigan coincidiendo
  palabra por palabra con el FAQ visible — si divergen, Google descarta el bloque.
- Hero, párrafo de respuesta rápida, ficha "Nearest airport", ficha "Nearest
  cruise piers", ficha "Driver languages", tabla POP (km y tiempo), tarjetas de
  Taino Bay y Amber Cove, nota de la sección comparativa y tarjeta de Charcos.
- Dos frases derivadas que quedaban falsas con los tiempos nuevos:
  `cruise.lead` ("within an hour" → "about an hour", porque Amber Cove ahora es
  exactamente una hora) y `cruise.timingBody` (ida y vuelta 1 h 15 → **2 horas**;
  con 8–9 h de escala sigue dejando seis horas o más en tierra).

**Cambios en `js/i18n.js`** — 16 claves `sosua.*` × 3 idiomas (48 strings). Sin
esto, la página se veía corregida en inglés y volvía a los datos viejos al
cambiar a español o francés, porque `applyStaticTranslations()` reescribe todo
`[data-i18n]` al cargar.

**Verificación (estática, sin navegador):**
- `node --check js/i18n.js` → OK.
- Los **5 bloques JSON-LD** de `sosua.html` parsean.
- 0 apariciones residuales de `19 km`, `25 min`, `~35 min`, `~40`, `40 to 45`,
  `20 to 30`, `Français`, `and French`, `27 Charcos` ni `~45 min` en `sosua.html`.
- 0 residuos equivalentes (EN/ES/FR) en las claves `sosua.*` de `i18n.js`.
- Valores nuevos presentes en las tres tandas de idioma del diccionario.

### Segunda pasada (mismo día) — alineado el resto del sitio

El usuario confirmó propagar el dato a las demás páginas, porque la misma
afirmación operativa se contradecía entre páginas:

- **`cruisesFaq.a4`** (`cruises.html` visible + su `FAQPage` JSON-LD + `i18n.js`
  ×3): "About 35 minutes from Taino Bay and 40 to 45 minutes from Amber Cove" →
  **50 / 60 min**, igual que `sosua.html`.
- **`cruise1.desc`** (`cruises.html` + ×3): Damajagua "around 40 minutes from
  either pier" → **"about an hour from either pier"**. ⚠️ **Número derivado, no
  dado por el operador:** sale de sus propios datos (Sosúa→Damajagua 1 h 30,
  Sosúa→Puerto Plata 30 min ⇒ muelle→Damajagua ≈ 1 h). **Confirmar.** La frase
  "sits comfortably inside a normal port call" sigue siendo cierta a 1 h por
  trayecto dentro de una escala de 8–9 h.
- **"27 Charcos" → "Charcos de Damajagua"** en `meta.excursions.description`
  (×3 + las dos metas de `excursions.html`), `excursionsFaq.a5` (×3 + visible +
  JSON-LD) y `service.charcos27` (×3). Los títulos de tarjeta (`exc2.title`,
  `cruise1.title`) y el `ItemList` JSON-LD ya venían sin el "27".
- **No se tocó** el `data-service-key="charcos-27"` de
  [excursions.html:294](excursions.html#L294) — es el id interno del carrito, no
  texto visible; renombrarlo rompería el mapeo de servicios.
- **No se tocó** `reviews.quote4` ("27 Charcos with Sariel…") en las 3 páginas
  que lo muestran: es la cita literal de un cliente.

**Verificación de la segunda pasada (estática, sin navegador):**
- `node --check js/i18n.js` → OK; los **22 bloques JSON-LD** del sitio parsean.
- **Paridad de fallback estático: 1046 elementos `[data-i18n]` comparados contra
  el diccionario `en`, 0 divergencias reales** (38 diferencias son artefacto del
  regex en headings con `<em>` interno).
- Diff del diccionario perfectamente simétrico: **22 claves × 3 idiomas**, 66
  líneas fuera y 66 dentro — no se añadió ni se borró ninguna clave.
- Sin residuos de `35 minut` / `40 to 45` / `40 à 45` / `Around 40 minutes` /
  `27 Charcos` en ninguna página salvo `reviews.quote4` (intencional).
- Nota preexistente, ajena a este cambio: `es` (640) y `fr` (641) tienen menos
  claves que `en` (654) — faltan `cart.luggageCount` y el bloque `about.point*`.

**Files modified:** `sosua.html`, `cruises.html`, `excursions.html`,
`js/i18n.js`, `DOCS/PROOF_OF_WORK.md`, `DOCS/USER_MANUAL.md`.
**Files created / deleted:** none.

---

## 2026-08-21 — Auditoría SEO / AEO / GEO + tanda rápida de correcciones

**Pedido:** "revisa las paginas y busca oportunidad para mejorar el seo aeo y geo".
Tras la auditoría el usuario confirmó dos cosas:

1. **Los testimonios de la home NO son reales.** Por tanto **se descartó** añadir
   `aggregateRating` / `review` al JSON-LD: marcar reseñas inventadas viola las
   guidelines de datos estructurados de Google y expone el dominio a una acción
   manual. La sección `#reviews` y el "4.9" del hero **no se tocaron**.
2. Ejecutar la tanda que no cambia arquitectura ni URLs.

### 1. Tarifas fijas ahora rastreables — `transfers.html#fares`

`js/config.js` definía 25 tarifas fijas desde POP (`POP_FIXED_DESTINATIONS` +
`POP_PROVINCE_FIXED_FARES`) y 5 desde otros aeropuertos
(`OTHER_AIRPORT_FIXED_FARES`), pero en HTML solo existían las 8 del ticket rail:
**todo lo demás solo aparecía si el visitante usaba la calculadora**. Los
crawlers de respuesta (GPTBot, ClaudeBot, PerplexityBot) no ejecutan JS, así que
~25 rutas de intención comercial alta ("how much is a taxi from POP to Las
Terrenas") no tenían respuesta indexable.

- Nueva sección 4 `#fares`: dos tablas estáticas (25 filas POP + 5 de otros
  aeropuertos), reutilizando las clases `.dest-table*` ya creadas para
  `sosua.html`. Solo los encabezados llevan `data-i18n`; los nombres de destino
  son nombres propios y quedan sin traducir.
- **11 claves `fares.*` × 3 idiomas** en `js/i18n.js`.
- CSS: `.fares-subhead` y `.fares-note` al final de `css/styles.css`.
- El JSON-LD `Service` pasó de 1 oferta suelta a **`hasOfferCatalog` con 30
  `Offer`** + `AggregateOffer` (lowPrice 23.95 / highPrice 425), más `@id`,
  `name`, `description`, `availableLanguage` y `areaServed` ampliado.
- ⚠️ **Esto revierte deliberadamente la decisión del 2026-07-20** ("una sola
  fuente visible por ruta"). `js/config.js` sigue siendo la única fuente de
  verdad; la tabla es un **espejo rastreable**, no una segunda fuente. El
  comentario de la sección 3 documenta el porqué. **Al cambiar una tarifa hay
  que tocar `js/config.js`, `transfers.html#fares` y `llms.txt`.**

### 2. Entidad enriquecida para el knowledge graph (las 6 páginas)

El nodo `TravelAgency` (idéntico en las 6 páginas) pasó de 1.213 a 2.471 bytes:
`alternateName`, `knowsLanguage` (`en`, `es` — lo que el propio sitio afirma en
`nosotros.html` y en la FAQ de Sosúa), `contactPoint` con el enlace de WhatsApp,
y `hasOfferCatalog` con las tres líneas de servicio y su URL.
**No se añadió** `openingHoursSpecification`, `foundingDate` ni `founder`: no hay
dato confirmado y no se inventan.

### 3. `TouristTrip` con precio real (`excursions.html`, `cruises.html`)

Los `ItemList` solo llevaban `name` + `url`. Ahora cada viaje lleva
`description`, `image`, `provider`, `duration` (solo donde la tarjeta declara
horas exactas) y **`offers` como `AggregateOffer`** con el rango 4→6 huéspedes
copiado de su `data-prices`. Nombres alineados con los de la tarjeta
("Beach Experience" → "Beach Experiences", "City Tour" → "Puerto Plata City Tour").

### 4. Rendimiento

- **58 `<img>`: los 44 que no lo tenían ya declaran `width`/`height`** leídos del
  archivo real → elimina el CLS. Se añadió `height: auto` a la regla base `img`
  de `css/styles.css` para que los atributos actúen como pista de ratio y no como
  tamaño fijo (las reglas específicas con `height:100%` ganan por especificidad y
  no cambian).
- **36 JPEG recomprimidos** (lado largo ≤1800 px, calidad 82 progresivo, EXIF
  fuera, y solo se conserva si pesa menos): **`img/` 10.820 KB → 7.746 KB (−28 %)**.
  Los peores: `exc-city-tour.jpg` 1.054→280 KB, `exc-atv.jpg` 960→268 KB,
  `hero-cruises.jpg` 462→120 KB, `exc-punta-rusia.jpg` y `hero-excursion.jpg`
  749→387 KB (2500→1800 px). Originales recuperables desde git.
- **GA4 movido al final de `<head>`** en las 6 páginas. Estaba por encima de
  `<title>`, abriendo conexión a googletagmanager antes de descubrir el CSS y las
  fuentes. Sigue siendo `async`: la medición no cambia.

### 5. Menores

- **`404.html` creado.** GitHub Pages servía su 404 genérico. Autocontenido (sin
  i18n/cart/shell: una URL rota no puede fallar dos veces), `noindex, follow`.
- **`llms.txt` creado** — brief en texto plano para motores generativos: datos de
  la entidad, las 30 tarifas fijas, precios de los 6 tours, distancias e índice
  de páginas.
- **`robots.txt`**: bloques `Allow` explícitos para GPTBot, OAI-SearchBot,
  ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot,
  Perplexity-User, **Google-Extended** (controla si Gemini / AI Overviews pueden
  fundamentar respuestas en este contenido), Applebot-Extended y Bingbot.
- **`og:image:alt` + `og:image:width/height`** en las 6 páginas.
- **`cruises.html`: `og:image` cambiado** de `hero-cruises.jpeg` (900×1200,
  vertical — se recortaba mal en `summary_large_image`) a `hero-cruises.jpg`
  (1024×576, ya en el repo pero sin usar): aérea de Puerto Plata con el crucero
  atracado en Taino Bay, la Fortaleza San Felipe y el Pico Isabel de Torres.
- **`nosotros.html`**: nodo `TravelAgency` parcial que comparte el `@id` del sitio
  y adjunta los 4 choferes como `employee` (`Person` con nombre, foto, `jobTitle`
  e idiomas) — la señal E-E-A-T que la página ya se ganaba visualmente.
- **`sosua.html`**: nodo `WebPage` con `datePublished` 2026-08-12 /
  `dateModified` 2026-08-21, `inLanguage`, `isPartOf` → `WebSite`,
  `primaryImageOfPage` y `about` → el `TouristDestination` (al que se le añadió su
  `@id`). La frescura es señal directa para una guía "how to get to X".
- **`sitemap.xml`**: los 6 `lastmod` a 2026-08-21 (cambio de contenido real).

### 6. Bug de contenido corregido de paso

`meta.excursions.description` (×3 idiomas + las dos metas de `excursions.html`)
prometía **"whale watching"**, un tour que **ya no está en la página** (no existe
tarjeta `exc3`; `img/exc-whale-watching.jpg` quedó huérfana). Un snippet que
promete más de lo que la página entrega lo reescribe Google y rebota al
visitante. Sustituido por los dos que sí existen: ATV y buggies.

**Verificación (estática, sin navegador):**

- `node --check` sobre los 9 archivos de `js/` → OK.
- **Los 26 bloques JSON-LD de las 7 páginas parsean** y las **50 referencias
  `@id` resuelven** a un nodo definido.
- **Balance de etiquetas correcto en las 7 páginas** (`html.parser`).
- **542 claves `data-i18n` usadas, 0 ausentes en `en` / `es` / `fr`.**
- **Todas las rutas locales (`href` / `src`) existen**; los **58 `<img>` tienen
  `width`, `height` y `alt`**.
- **Paridad de tarifas: los 30 precios de `js/config.js` aparecen en
  `transfers.html#fares` (30 filas) y en `llms.txt`, y ninguna de las dos inventa
  un precio que no esté en `config.js`.**
- `sitemap.xml` valida contra el esquema de sitemaps.

**Pendiente / requiere dato del dueño:**

- `exc4` se contradice consigo mismo: la descripción dice **"US$65 per person, up
  to 6 guests"** (×3 idiomas) mientras su propio widget cobra
  **100/125/150 = US$25 por persona**. No se tocó porque no sé cuál es el precio
  bueno. Un motor de respuesta citará uno de los dos.
- ¿La operación es **24/7**? Si se confirma, toca añadir
  `openingHoursSpecification` al `TravelAgency`.
- Faltan perfiles para `sameAs` (Facebook, TripAdvisor): solo hay Instagram y
  Google Maps.
- 4 imágenes huérfanas en el repo (`hero-cruiser.png` 924 KB,
  `exc-whale-watching.jpg`, `hero-cruises.jpeg`, `logo favicon.jpeg`). No afectan
  al SEO (no se sirven), pero inflan el repo.

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `nosotros.html`, `sosua.html`, `css/styles.css`, `js/i18n.js`,
`robots.txt`, `sitemap.xml`, 36 archivos de `img/`, `PROJECT_INFO.md`,
`DOCS/FOLDER_STRUCTURE.md`, `DOCS/DEVELOPER_GUIDE.md`, `DOCS/USER_MANUAL.md`,
`DOCS/PROOF_OF_WORK.md`, `tasks/todo.md`.
**Files created:** `404.html`, `llms.txt`.
**Files deleted:** none.

### Segunda pasada (mismo día) — 24/7 confirmado y precio del City Tour corregido

El dueño respondió las dos preguntas abiertas de la entrada anterior:

**1. La operación es 24/7.** Añadido `openingHoursSpecification` al nodo
`TravelAgency` de las 6 páginas, en la forma que Google documenta para
operación continua: los 7 días, `opens` `00:00`, `closes` `23:59`. Es la señal
detrás del "abierto ahora" en resultados locales y detrás de que un motor de
respuesta conteste que sí a "can they pick me up at 2 AM".
⚠️ **Pendiente de contenido:** el 24/7 ahora está en el schema pero **no se
afirma en ninguna parte visible del sitio**. Conviene que aparezca en la FAQ o
en la franja de confianza, porque el dato marcado debe reflejar lo que la
página dice.

**2. El Puerto Plata City Tour cuesta US$65 por persona**, no los US$25 que
implicaba su widget. La descripción (`exc4.desc`, ×3 idiomas) siempre dijo lo
correcto; el que estaba mal era el mapa de precios. Corregido
**100/125/150 → 260/325/390** en:

- `excursions.html` `#exc4`: `data-prices`, el fallback visible estático
  (`exc-amount` 100→260, `exc-per-person-amount` 25→65) y el `AggregateOffer`
  de su `TouristTrip` (lowPrice/highPrice → 260.00/390.00).
- `cruises.html` `#cruise2`: el mismo tour vendido como shore excursion —
  idénticos tres cambios.
- `llms.txt`: la fila de la tabla de tours.

No se tocó `exc4.desc` en `js/i18n.js`: ya decía US$65 por persona y ahora es
verdad. Tampoco hubo que tocar `js/config.js` (los precios de excursión viven
en los `data-prices` del HTML, no ahí).

⚠️ **Nota para el dueño:** con este cambio el City Tour cuesta **exactamente lo
mismo que el ATV Adventure** (`exc6`, también 260/325/390 = US$65/persona). Fue
justo esa coincidencia la que hizo sospechar que la frase "US$65 per person"
estaba copiada de la tarjeta del ATV. El dueño confirmó los US$65, así que se
aplicó — pero si el número correcto era otro, este es el punto a revisar.

**Verificación:**
- Coherencia total/por-persona comprobada en las **10 tarjetas** de las dos
  páginas: el fallback estático visible coincide con el `data-prices` del
  tamaño de grupo activo por defecto en cada tarjeta (`exc1` arranca en 5
  huéspedes, el resto en 4).
- 0 apariciones residuales de `"4":100` o `US$100` como precio del City Tour.
- Los **26 bloques JSON-LD** siguen parseando y las **50 referencias `@id`**
  resolviendo; 542 claves i18n sin ausencias; paridad de tarifas de transfer
  intacta.

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `nosotros.html`, `sosua.html`, `llms.txt`,
`DOCS/PROOF_OF_WORK.md`.
**Files created / deleted:** none.

**Sigue pendiente (no se hizo, por alcance):**
- **Hubs de destino** (Cabarete, Puerto Plata/Playa Dorada, Las Terrenas/Samaná,
  Cofresí/Ocean World, Río San Juan/Playa Grande) replicando la plantilla de
  `sosua.html`. Es la mayor oportunidad de tráfico que queda.
- **Breadcrumbs visibles en la UI** — existen en el `BreadcrumbList` JSON-LD de
  5 páginas pero no se muestran al visitante.
- **Multiidioma real** (`/es/`, `/fr/` + `hreflang`): hoy el i18n es client-side
  sobre una sola URL, así que ES y FR no se indexan.
- Perfiles para `sameAs` (Facebook, TripAdvisor).

### Tercera pasada (mismo día) — pendientes: FAQ 24/7, breadcrumbs visibles y el hub de Cabarete

#### 1. `index.html`: las 5 respuestas del `FAQPage` no coincidían con las visibles

Auditando antes de tocar nada apareció que **la home violaba la invariante #2**
del DEVELOPER_GUIDE: las cinco respuestas del JSON-LD eran un borrador anterior,
más corto, que el que lee el visitante. `transfers`, `excursions`, `cruises` y
`sosua` sí coincidían — la home era la excepción, probablemente por ser la más
antigua. Google puede descartar un bloque `FAQPage` que no refleja la página.

Corregido regenerando el bloque **desde el HTML visible**, no copiándolo a mano,
de modo que en esta pasada no pueden divergir.

#### 2. FAQ del 24/7 (visible + JSON-LD + 3 idiomas)

El `openingHoursSpecification` de la pasada anterior afirmaba 24/7 en el schema
sin que la página lo dijera en ninguna parte. Añadida `faq.q6` / `faq.a6`
("Do you operate at night and on weekends?") a la home: acordeón visible,
`FAQPage` JSON-LD y las tres tandas del diccionario. Ahora el dato marcado
tiene respaldo visible, que es lo que Google espera.

#### 3. Breadcrumbs visibles

Las 5 páginas con `BreadcrumbList` declaraban una ruta que ningún visitante
podía ver. Añadido un `<nav class="crumbs">` justo debajo del hero en
`transfers`, `excursions`, `cruises`, `nosotros` y `sosua` (el `<h1>` vive
dentro del hero a sangre, así que una barra encima quedaría sobre la foto).
Las etiquetas reutilizan las claves `nav.*` existentes para que ninguna página
se invente un segundo nombre para sí misma. Nuevas claves `crumbs.*` ×3 y un
bloque CSS `.crumbs` al final de `css/styles.css`.

#### 4. `cabarete.html` — segundo hub de destino

Generado desde `sosua.html` con un script de un solo uso (no se versiona: el
sitio no tiene build step y la página se mantiene a mano de aquí en adelante).
Misma cáscara, mismo orden de secciones, mismas clases `.dest-*`, y un espejo
`cabarete.*` del árbol de 151 claves de `sosua.*` — **456 entradas nuevas en
`js/i18n.js`, 152 claves × 3 idiomas**, más `meta.cabarete.*`,
`crumbs.cabarete` y `footer.serviceCabarete`.

Contenido propio de Cabarete, no traducido de Sosúa: tabla de aeropuertos,
sección de cruceros, tabla comparativa a 4 columnas, 6 lugares cercanos
(Kite Beach, Playa Encuentro, Cabarete Bay, El Choco y las cuevas, Sosúa,
Damajagua) y **10 preguntas frecuentes**, dos de ellas específicas del público
objetivo: *"Can you carry kiteboards, surfboards and windsurf gear?"* y
*"Do you drive late at night or very early?"*.

**5 bloques JSON-LD**: `TouristDestination` (con `includesAttraction` y
`touristType`), `Service` + `hasOfferCatalog` con las 2 tarifas confirmadas,
`FAQPage` (10 preguntas, espejo literal de las visibles), `BreadcrumbList` y
`WebPage` con `dateModified`. El nodo `TravelAgency` se copia byte a byte de las
otras páginas para no romper la invariante #3.

Registrada en `sitemap.xml` (7 URLs), en `llms.txt` (sección de distancias y
tarifas propias) y en el footer de las 7 páginas. Además, **enlace recíproco
entre los dos hubs** dentro de la tarjeta que cada uno dedica al otro pueblo.

⚠️ **Tres límites deliberados de esta página, todos documentados en su
comentario de cabecera:**

1. **Solo 2 tarifas confirmadas.** POP US$33.95 y STI US$98.95 salen de
   `js/config.js`. **AZS, SDQ y PUJ no tienen tarifa confirmada a Cabarete**, así
   que la tabla dice "On request" en vez de inventar un número. La nota de la
   tabla y la FAQ 4 lo explican como política ("solo publicamos precios que
   hemos confirmado"), que además empuja al contacto por WhatsApp.
2. **Solo una distancia es del dueño.** Cabarete↔Sosúa (~8 km / ~15 min) está
   confirmada en `sosua.html`. **Todas las demás distancias y duraciones de la
   página son aritmética sobre las cifras de Sosúa que el dueño ya confirmó**
   (POP ~17 km/~25 min, STI ~93 km/~1 h 45, AZS ~147 km/~2 h 20, SDQ ~253 km/
   ~4 h 15, PUJ ~308 km/~5 h, Taino Bay ~65 min, Amber Cove ~75 min) y están
   **pendientes de confirmación**. Ojo con AZS: Cabarete queda *más cerca* de
   Samaná que Sosúa, no más lejos — la resta va en sentido contrario que en el
   resto de rutas.
3. **La foto del hero no es de Cabarete.** `img/cta-band.jpg` es una playa
   caribeña genérica; su `alt` no afirma ningún lugar, precisamente para no
   mentir. Reemplazar por una foto real de Kite Beach en cuanto el dueño la dé.

#### 5. Suite de verificación estática ampliada

La verificación anterior no comprobaba la invariante #1 (HTML estático ==
diccionario). Al añadirla saltaron **8 fallbacks corruptos en `cabarete.html`**:
el regex del generador paraba en la primera etiqueta interna, así que los
valores con `<em>` o `<br />` conservaban medio texto de Sosúa — incluido un CTA
de reserva que aún decía *"Let's get you to Sosúa"* en la página de Cabarete.
Corregido con un extractor de `innerHTML` que sigue el anidamiento de verdad.

**Verificación final — 37 comprobaciones, 0 fallos:**
- `node --check` sobre los 9 archivos de `js/`.
- **30 bloques JSON-LD en 8 páginas parsean; 55 referencias `@id` resuelven.**
- Etiquetas balanceadas en las 8 páginas.
- Diccionarios evaluados en Node: en=826, es=812, fr=813 claves.
  **701 claves usadas en el HTML, 0 ausentes en ninguno de los tres idiomas.**
- **Invariante #1: 701 fallbacks comparados contra el diccionario EN,
  0 divergencias** (antes ni se medía).
- **Invariante #2: las 6 páginas con FAQ coinciden pregunta por pregunta y
  respuesta por respuesta con su `FAQPage`.**
- **Invariante #3: el nodo `TravelAgency` es idéntico en las 7 páginas.**
- **Invariante #4: las 30 tarifas de `config.js` están en `transfers.html#fares`
  y en `llms.txt`, sin precios inventados; los precios de las 10 tarjetas de
  tour coinciden con `llms.txt`.**
- Todas las rutas locales existen; los 62 `<img>` llevan `width`, `height` y `alt`.
- `sitemap.xml` valida y coincide exactamente con las páginas indexables
  (`404.html` queda fuera por su `noindex`).

**Files modified:** `index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `nosotros.html`, `sosua.html`, `css/styles.css`, `js/i18n.js`,
`sitemap.xml`, `llms.txt`, `PROJECT_INFO.md`, `DOCS/DEVELOPER_GUIDE.md`,
`DOCS/FOLDER_STRUCTURE.md`, `DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`,
`tasks/todo.md`.
**Files created:** `cabarete.html`.
**Files deleted:** none.

**Sigue pendiente:**
- **4 hubs más** (Puerto Plata/Playa Dorada, Las Terrenas/Samaná,
  Cofresí/Ocean World, Río San Juan/Playa Grande). La plantilla ya está probada
  dos veces; el freno real es que **hacen falta distancias y tarifas
  confirmadas** para cada destino, igual que en Cabarete.
- **Multiidioma real** (`/es/`, `/fr/` + `hreflang`). Sigue siendo el mayor
  techo de tráfico sin explotar y el único cambio que altera la estructura de
  URLs — decisión del dueño antes de empezar.
- `sameAs`: faltan las URLs de Facebook y TripAdvisor.
- Foto real de Cabarete para el hero.

### Cuarta pasada (mismo día) — Cabarete sin distancias

**Instrucción del dueño:** *"no uses distancia, solo informacion sobre los
lugares"*, en respuesta a la petición de confirmar las distancias derivadas de
`cabarete.html`.

Decisión correcta: de los datos geográficos de esa página solo Cabarete↔Sosúa
estaba confirmado; el resto era aritmética sobre las cifras de Sosúa. Publicar
un cálculo como si fuera un hecho es exactamente lo que un motor de respuesta
citaría y lo que un cliente comprobaría en el carro. **`cabarete.html` ya no
publica ninguna distancia ni duración de trayecto.**

En su lugar la página sitúa cada lugar por posición y carácter — "sobre la
carretera costera justo al este de Sosúa", "Taino Bay está dentro de la ciudad
de Puerto Plata", "Amber Cove está en Maimón, al oeste" — y manda a WhatsApp a
quien quiera un tiempo real de trayecto.

Cambios:
- **36 claves reescritas × 3 idiomas** y **36 eliminadas** (`air.thDistance`,
  `air.thTime` y los 10 pares `xxxKm`/`xxxTime`).
- **La tabla de aeropuertos pasó de 5 a 3 columnas**: Aeropuerto · Código ·
  Precio fijo. Sin columnas de distancia ni de duración.
- Las 6 tarjetas de lugares cambiaron su línea `mono` de "~3 km · ~5 min" a una
  etiqueta descriptiva: *Kitesurfing*, *Surf break*, *In town*,
  *Nature reserve*, *Neighbouring town*, *Full-day excursion*.
- Las tarjetas de muelle igual: "Inside Puerto Plata city" y
  "In Maimón, west of Puerto Plata".
- **Dos preguntas de la FAQ reformuladas** porque pedían un número por
  definición: *"How far is Cabarete from POP?"* → **"Where exactly is
  Cabarete?"**, y *"How far is Sosúa from Cabarete?"* → **"What is the
  difference between Cabarete and Sosúa?"** — esta última es mejor pregunta:
  responde a la duda real (mar abierto y viento frente a bahía protegida y
  agua calma) y no a una métrica.
- Reescritos también `hero.lead`, `answer.lead`, `air.lead`, `air.note`,
  `cruise.lead`, `cruise.timingBody`, `compare.lead` y `spots.s3Body`
  (se le escapaba un "in about one kilometre").
- `meta description`, `og:description` y tres bloques JSON-LD
  (`TouristDestination`, `FAQPage`, `WebPage`) regenerados en consecuencia.
- Sección de Cabarete en `llms.txt` reescrita sin cifras de distancia.

**`sosua.html` no se tocó:** sus distancias las confirmó el dueño el
2026-08-12 (corrigiendo 19 km→9 km y 25 min→15 min), así que ahí los números
son un activo, no un riesgo.

**Verificación: 37 comprobaciones, 0 fallos.** Diccionarios en=814, es=800,
fr=801; **689 fallbacks comparados contra el diccionario EN, 0 divergencias**;
las 10 preguntas visibles de Cabarete siguen coincidiendo literalmente con su
`FAQPage`; barrido de patrones (`km`, `kilomet`, `mile`, `min`, `minute`,
`\d+ h`) sobre el texto visible: **ninguna distancia ni duración de trayecto**
—solo la escala de crucero de 8–9 h, el 24/7 y la cancelación gratuita hasta
24 h antes, que no son distancias.

**Files modified:** `cabarete.html`, `js/i18n.js`, `llms.txt`,
`PROJECT_INFO.md`, `DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`.
**Files created / deleted:** none.

### Quinta pasada (mismo día) — los 4 hubs de destino restantes

El dueño dio luz verde a continuar. Se crearon **`puerto-plata.html`,
`cofresi.html`, `rio-san-juan.html` y `las-terrenas.html`**, con lo que el sitio
pasa de 7 a 11 páginas indexables y de 2 a **6 hubs de destino**.

#### Cómo se generaron

Plantilla: **`cabarete.html`**, no `sosua.html` — ya lleva el diseño sin
distancias (tabla de 3 columnas, etiquetas descriptivas en las tarjetas). El
generador (`gen_hub.py`, herramienta de un solo uso, no se versiona) toma una
especificación por destino y produce la página + su bloque i18n.

El diccionario se partió en tres capas para no repetir texto ni voz:
- **SHARED** (~55 claves): idénticas en todos los hubs — encabezados de tabla,
  CTAs, la rejilla comparativa entera, los pasos de llegada.
- **TEMPLATE** (~20 claves): la misma frase con `{town}` y `{price}`
  sustituidos.
- **BESPOKE** (~45 claves): todo lo que dice algo concreto de un lugar — hero,
  respuesta rápida, sección de cruceros, las 6 tarjetas de lugares y 6 de las
  10 preguntas frecuentes.

Total: **~140 claves × 3 idiomas × 4 páginas = 1.680 cadenas nuevas.**

#### Decisiones de contenido

- **Solo se publica la tarifa confirmada.** Cada hub imprime su única tarifa POP
  de `js/config.js` (38.95 / 48.50 / 98.50 / 178.50) y pone **"On request"** en
  los otros cuatro aeropuertos. La nota de la tabla lo convierte en política
  declarada — "solo publicamos precios que hemos confirmado" — lo que es honesto
  y empuja al WhatsApp.
- **Cero distancias**, siguiendo la instrucción del dueño. Los lugares se
  describen por posición y carácter. Barrido final de patrones sobre las 5
  páginas: **ninguna métrica de trayecto**.
- **La sección de cruceros puede decir que no.** `las-terrenas.html` afirma sin
  rodeos que **no cabe en una escala de Puerto Plata**, y explica que si una
  naviera vende Samaná es porque el barco atraca en la bahía de Samaná, que es
  otro puerto. Es el párrafo más valioso de esa página: responde a una confusión
  real y evita una venta que acabaría en queja.
- `rio-san-juan.html` hace lo mismo en tono más suave: desde los muelles es un
  día entero, no medio.
- **`puerto-plata.html` es el único con foto real del lugar**
  (`img/hero-cruises.jpg`, aérea de la ciudad con la fortaleza y el Pico Isabel
  de Torres). Los otros tres usan playas genéricas cuyo `alt` no afirma ningún
  lugar, igual que Cabarete.

#### Dos errores propios detectados y corregidos en verificación

1. **Provincia falsa en el hero.** La plantilla fijaba
   `{town} · Puerto Plata · Dominican Republic`, correcto para Cabarete y
   Cofresí pero **falso para Río San Juan** (María Trinidad Sánchez) y
   **Las Terrenas** (Samaná), y absurdo para Puerto Plata ("Puerto Plata ·
   Puerto Plata"). Corregido en los tres, en los tres idiomas.
2. **Dos frases con métrica** que sobrevivieron: *"the airport is minutes from
   the city"* en Puerto Plata y *"kilometres of sand"* en Las Terrenas.
   Reescritas.

#### Footer reorganizado

Con seis hubs, dejarlos en la columna Services la habría convertido en una lista
de diez ítems. Se creó una **columna "Destinations"** con los seis, etiquetados
solo con el nombre del pueblo, y con `aria-current="page"` en el propio. Cada
hub enlaza ahora a los otros cinco desde todas las páginas — un clúster temático
limpio. `css/styles.css`: el footer pasa de 4 a 5 columnas con dos escalones
intermedios (560 px → 2 columnas, 900 px → 3, 1120 px → 5) para que ninguna
quede más estrecha que un nombre de pueblo.

`sitemap.xml` pasa a **11 URLs**; `llms.txt` gana una sección "Destinations
covered in detail" con los seis y sus tarifas.

**Verificación: 47 comprobaciones, 0 fallos.**
- `node --check` sobre los 9 archivos de `js/`.
- **54 bloques JSON-LD en 12 páginas parsean**; todas las referencias `@id`
  resuelven.
- Etiquetas balanceadas en las 12 páginas.
- **1.258 claves comparadas contra el diccionario EN, 0 divergencias**
  (invariante #1).
- Las **6 páginas con FAQ** coinciden literalmente con su `FAQPage`
  (invariante #2) — 4 hubs nuevos × 10 preguntas incluidas.
- El nodo `TravelAgency` sigue idéntico en las 11 páginas (invariante #3).
- Las 30 tarifas de `config.js` siguen en `transfers.html#fares` y `llms.txt`
  sin inventos (invariante #4).
- Todas las rutas locales existen; todos los `<img>` con `width`/`height`/`alt`.
- `sitemap.xml` valida y coincide exactamente con las páginas indexables.

**Files created:** `puerto-plata.html`, `cofresi.html`, `rio-san-juan.html`,
`las-terrenas.html`.
**Files modified:** las 7 páginas anteriores (footer), `css/styles.css`,
`js/i18n.js`, `sitemap.xml`, `llms.txt`, `PROJECT_INFO.md`,
`DOCS/DEVELOPER_GUIDE.md`, `DOCS/FOLDER_STRUCTURE.md`, `DOCS/USER_MANUAL.md`,
`DOCS/PROOF_OF_WORK.md`, `tasks/todo.md`.
**Files deleted:** none.

**Sigue pendiente:**
- **Tarifas confirmadas desde STI / AZS / SDQ / PUJ** a los cinco destinos que
  no son Sosúa. Hoy son 20 celdas "On request" que podrían ser 20 precios.
  Especialmente **AZS → Las Terrenas**, que es la ruta natural de ese destino.
- **Fotos reales** de Cabarete, Cofresí, Río San Juan y Las Terrenas.
- **Multiidioma real** (`/es/`, `/fr/` + `hreflang`) — el mayor techo que queda,
  y ahora con 11 páginas × 3 idiomas el coste de no tenerlo es mayor.
- `sameAs`: URLs de Facebook y TripAdvisor.

## 2026-08-22 — Fotos reales en los heroes de cuatro hubs

**Pedido:** *"te guarde foto nuevos para los head"*. El dueño dejó cuatro fotos en
`img/`, cada una del lugar que ilustra de verdad.

| Origen | Destino | Qué muestra |
|---|---|---|
| `puerto plata.jpg` | `img/puerto-plata.jpg` | El Cristo Redentor del Pico Isabel de Torres sobre la ciudad, la bahía y un crucero al fondo |
| `cabarete.webp` | `img/cabarete.jpg` | Kitesurfistas con el cielo lleno de cometas, palmeras y edificios de playa detrás |
| `rio san juan.webp` | `img/rio-san-juan.jpg` | Cala turquesa entre promontorios boscosos |
| `las terrenas.webp` | `img/las-terrenas.jpg` | El letrero de colores LAS TERRENAS en el malecón |

**Normalizadas al pipeline del sitio** en vez de usarse tal cual:
- **Nombres con guiones.** Los originales tenían espacios, que se convierten en
  `%20` en cada URL que los referencia — `<img src>`, `og:image` y dos nodos
  JSON-LD por página. Ya hubo un caso así en el repo (`banner nosotros.jpeg`).
- **Convertidas a JPEG.** Tres venían en WebP. El resto del sitio es JPEG, y
  sobre todo: `og:image` lo leen scrapers cuyo soporte de WebP sigue siendo
  desigual — una tarjeta de WhatsApp o Facebook sin imagen es pérdida directa de
  conversión. El ahorro de WebP sobre estos tamaños no compensa ese riesgo.
- Lado largo ≤1800 px, calidad 82 progresivo, metadatos fuera.

Por página se actualizaron cinco referencias: el `<img>` del hero (con
`width`/`height` reales), `og:image`, `og:image:alt`, `og:image:width/height`, y
las dos del JSON-LD (`TouristDestination.image` y `WebPage.primaryImageOfPage`).
El comentario de cabecera de cada página deja de decir "placeholder".

**Textos alternativos reescritos** para describir lo que hay en cuadro. Las
anteriores no afirmaban lugar porque las fotos eran genéricas; estas sí pueden
nombrarlo porque ahora es cierto.

**`cofresi.html` no recibió foto** y conserva `transfer-trust-resort.jpg`, un
resort genérico cuyo `alt` sigue sin afirmar ningún lugar. Es ahora el único hub
sin foto real.

**Verificación: 49 comprobaciones, 0 fallos.** JSON-LD parsea y resuelve, las
cuatro invariantes en verde, todas las rutas locales existen, todos los `<img>`
con `width`/`height`/`alt`.

⚠️ **Dos observaciones sobre el encuadre** (el hero es `min-height: 100svh` con
`object-fit: cover`, es decir una caja **alta**):
- **`cabarete.jpg` es un panorama de 1800×562 (ratio 3.2).** En escritorio queda
  bien: se escala a la altura y muestra la franja central, que es donde está el
  kitesurfista. **En móvil el recorte es fuerte** — se ve una banda vertical
  estrecha del centro. Sigue siendo un kitesurfista sobre agua turquesa, pero se
  pierde el cielo lleno de cometas, que es lo mejor de la foto. Si el dueño tiene
  un encuadre más alto de la misma escena, mejora bastante.
- **`puerto-plata.jpg` es vertical (1080×1225)** y solo 1080 px de ancho: en
  escritorio se sube de escala y pierde algo de nitidez bajo el scrim. Aceptable,
  pero una versión más ancha sería mejor.

**Nota aparte:** quedan **4 imágenes huérfanas** en el repo (1.45 MB):
`hero-cruiser.png` (924 KB), `exc-whale-watching.jpg`, `logo favicon.jpeg` y
`hiking.jpg`. No se sirven, así que no afectan al SEO — pero engordan el
repositorio. No se borran porque son archivos del dueño.

**Files created:** `img/puerto-plata.jpg`, `img/cabarete.jpg`,
`img/rio-san-juan.jpg`, `img/las-terrenas.jpg`.
**Files deleted:** `img/puerto plata.jpg`, `img/cabarete.webp`,
`img/rio san juan.webp`, `img/las terrenas.webp` (renombradas/convertidas).
**Files modified:** `puerto-plata.html`, `cabarete.html`, `rio-san-juan.html`,
`las-terrenas.html`, `PROJECT_INFO.md`, `DOCS/DEVELOPER_GUIDE.md`,
`DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`, `tasks/todo.md`.

## 2026-08-22 — Foto de Cofresí y altura del hero acotada

**Lo pedido:** *"en telefono las fotos son muy grandes y se pierde parte del
nombre y de la vista, arreglalo; tambien en la web hazla un poco mas pequeña
para que no pierdan tanta calidad"* y, a mitad de la tarea, *"ya agregue la foto
de cofresi"*.

### 1. `img/cofresi.jpg` — el último hub deja el placeholder

Aérea de Ocean World: las lagunas del parque sobre la punta rocosa, la ensenada
y la franja de resorts detrás, y el Pico Isabel de Torres al fondo. 1600×1200,
q82 progresivo, EXIF eliminado, 490 KB.

**Venía espejada.** El rótulo del parque se leía `blroW naecO` y la costa estaba
invertida con él. Se volteó horizontalmente antes de procesarla, con lo que el
letrero se lee y la geografía queda en su orientación real. Verificado
recortando el rótulo a 5x antes y después.

Actualizado en `cofresi.html`: hero `<img>` (src/width/height/alt), `og:image`,
`og:image:alt`, `og:image:width|height`, `TouristDestination.image`,
`WebPage.primaryImageOfPage`, `dateModified` → 2026-08-22 y el comentario
`HERO IMAGE:` de cabecera. **Los seis hubs tienen ya foto real de su lugar.**

`transfer-trust-resort.jpg` sigue en uso en `transfers.html`, así que no se
queda huérfana.

### 2. La causa real del recorte en móvil: la altura del hero

`.hero` era `min-height: 100svh` y el fondo es `object-fit: cover`. Cuanto más
alta y estrecha es la caja respecto a la foto, **más ancho se tira y más se
amplía lo que queda**. En un teléfono de 390×844 la caja era de 390×945 (con el
sangrado del parallax): una foto apaisada de 1024×577 se escalaba a 1459 px de
ancho para llenarla, de los que se veían 390. De ahí que del letrero de Las
Terrenas solo se viera una letra.

```css
.hero { min-height: min(100svh, 50rem); }

@media (max-width: 599.98px) {
  .hero { min-height: 34rem; }
  .hero-content { padding-block: 5.5rem 4rem; }
}
```

En móvil la altura la marca ahora el texto del hero (34rem es solo suelo), y el
`padding` baja para que el bloque siga cabiendo. Medido, ancho visible de la
foto y factor de escala, antes → después:

| Foto | Móvil 390×844 | Escala | Desktop 1920×990 | 27" 2560×1350 |
|---|---|---|---|---|
| `las-terrenas.jpg` | 23% → **36%** | 1.64x → **1.06x** | 98% → 100% | 95% → 100% |
| `cofresi.jpg` | 31% → **48%** | 0.79x → **0.51x** | 100% | 100% |
| `puerto-plata.jpg` | 47% → **73%** | 0.77x → **0.50x** | 100% | 100% |
| `rio-san-juan.jpg` | 28% → **43%** | 0.95x → **0.61x** | 100% | 100% |
| `cabarete.jpg` | 13% → **20%** | 1.68x → **1.08x** | 54% → **67%** | 53% → **89%** |
| `hero-main.jpg` | 31% → **48%** | 0.70x → **0.45x** | 100% | 100% |

Lecturas honestas de esa tabla:

- **En móvil el ampliado desaparece.** Todas pasan a escala ≤1.08x, es decir
  tamaño nativo o menos. Eso es nitidez real, no percibida.
- **En portátil 1440×820 el cambio es casi nulo** (el tope de 50rem = 800 px
  apenas recorta 20 px). El efecto se nota en pantallas altas: en un 27" el
  hero pasa de 1350 a 800 px y `cabarete.jpg` deja de ampliarse 2.69x.
- **`cabarete.jpg` sigue siendo el caso malo en móvil.** Es un panorama de ratio
  3.2 dentro de una pantalla vertical; ninguna altura de caja arregla eso. Se
  necesita otro encuadre de la misma escena.
- Las dos fotos de 1024 px de ancho (`las-terrenas.jpg`, `hero-cruises.jpg`)
  siguen ampliándose ~2.5x en un 27". Es límite de resolución del original, no
  de CSS, y los originales ya no existen (se convirtieron y se borraron).

**Un error propio, detectado y corregido antes de terminar:** el bloque
`@media` se escribió inicialmente **encima** de la regla base `.hero-content`.
Misma especificidad y una media query no añade ninguna, así que el
`padding-block` móvil habría perdido por orden de origen. Reubicado debajo.

### Verificación

**49 comprobaciones, 0 fallos.** JSON-LD parsea y las 75 referencias `@id`
resuelven; las cuatro invariantes en verde; 1258 claves i18n sin divergencia;
todas las rutas locales existen; todos los `<img>` con `width`/`height`/`alt`.
`node --check` sobre los 9 archivos de `js/`. Llaves de `css/styles.css`
balanceadas (648/648).

**Files created:** `img/cofresi.jpg`.
**Files modified:** `cofresi.html`, `css/styles.css`,
`DOCS/DEVELOPER_GUIDE.md`, `DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`,
`tasks/todo.md`.
**Files deleted:** ninguno.

**Sigue pendiente:**
- **20 casillas "On request"**: tarifas desde STI / AZS / SDQ / PUJ a los cinco
  destinos que no son Sosúa. La más importante, **AZS → Las Terrenas**.
- **Un encuadre más vertical de Cabarete** (único punto débil de encuadre que
  queda).
- **Multiidioma real** (`/es/`, `/fr/` + `hreflang`) — decisión del dueño.
- **`sameAs`**: URLs de Facebook y TripAdvisor.
- Corrección de un dato anterior: las imágenes huérfanas son **3 (1.417 KB)** —
  `hero-cruiser.png` (924 KB), `exc-whale-watching.jpg` (283 KB) y
  `logo favicon.jpeg` (210 KB). `hiking.jpg` sí se usa. No se borran porque son
  archivos del dueño.

## 2026-08-22 — Las Terrenas sin AZS, y el sitio realmente en tres idiomas

**Lo pedido:** *"no ponga vuelos desde las terenas, repara lo de multidioma y
las url queda pendiente"* — las URLs de Facebook/TripAdvisor (`sameAs`) siguen
en espera a propósito.

### 1. Samaná El Catey (AZS) deja de ser una vía de entrada a Las Terrenas

**El alcance se limitó a `las-terrenas.html` deliberadamente.** `js/config.js`
tiene una tarifa **confirmada AZS → Sosúa de US$148.50**, así que AZS es un
origen real que la empresa sirve: quitarlo del sitio entero habría borrado una
ruta con precio confirmado. Lo que se quita es el relato de que se puede volar
a la península para llegar a Las Terrenas.

Cambiado en esa página: la fila AZS de la tabla de aeropuertos, el dato
"aeropuerto más cercano" del bloque de respuesta rápida (ahora *"aeropuerto por
el que llegar"* → POP), la entradilla de la sección aérea, la nota de la tabla,
la descripción del nodo `Service`, el comentario de cabecera y el párrafo de
`llms.txt`.

Dos preguntas del FAQ se vuelven una: *"¿Cuál es el aeropuerto más cercano?"*
pasa a *"¿Por qué aeropuerto conviene llegar?"* y se responde con POP/SDQ; la de
recogida en AZS desaparece. La página baja de 10 a **9 preguntas**, renumeradas,
y el `FAQPage` JSON-LD se regeneró **desde el HTML visible** (invariante #2).

Siete claves reescritas en los tres idiomas, tres borradas, dos renombradas.

### 2. Multiidioma real: 11 páginas → 33

**El problema.** El sitio *parecía* trilingüe pero no lo era para un buscador:
existía una sola URL por página y el HTML servido en ella era **siempre
inglés**. `js/i18n.js` cambiaba los textos después de cargar. El visitante veía
tres idiomas; Google veía uno. El español y el francés no podían posicionar —
en un país hispanohablante y con Las Terrenas llena de francófonos.

**La solución.** `/es/` y `/fr/` como páginas reales pre-renderizadas:

| Idioma | URL | Origen |
|---|---|---|
| Inglés | `/transfers.html` | escrita a mano, la original |
| Español | `/es/transfers.html` | generada |
| Francés | `/fr/transfers.html` | generada |

**Las páginas inglesas no se movieron de dirección**, así que ningún enlace ni
posicionamiento existente se ve afectado.

#### Herramientas nuevas, versionadas en `tools/`

Se decidió **versionar el generador** en vez de dejarlo como script de un solo
uso: 33 páginas mantenidas a mano se desincronizan sin remedio. Es el único paso
generado del proyecto, y está documentado como tal en `PROJECT_INFO.md`.

- **`tools/build-langs.py`** — renderiza `/es/` y `/fr/` desde la página inglesa
  más el diccionario de `js/i18n.js` (**el mismo que usa el runtime, así que
  ninguna cadena se traduce dos veces**). Por página fija: `<html lang>`, cada
  innerHTML `[data-i18n]` y cada atributo `[data-i18n-attr]`, el `<title>` y la
  meta description (de `meta.<page>.title`/`.description`), el canonical, la URL
  y el locale de Open Graph, el bloque `hreflang`, el selector de idioma y el
  prefijo `../` de los assets. También escribe el `hreflang` en las páginas
  inglesas y regenera `sitemap.xml`.
- **`tools/verify.py`** — sustituye al suite de scratchpad: **24 comprobaciones**
  sobre las 34 páginas, comparando cada una contra el diccionario de **su**
  idioma.
- **`tools/_html.py`** — el recorredor de etiquetas que ambos comparten (el
  regex ingenuo `data-i18n="k">(.*?)<` se detiene en la primera etiqueta
  interna; ya causó fallbacks a medio escribir en agosto).
- **`tools/dump-dict.js`** — evalúa el literal del diccionario para Python.

#### Qué JSON-LD sigue al idioma y qué no

- **`WebPage` y `BreadcrumbList` describen *esta URL***: reciben `@id`, `url`,
  `name`, `description` e `inLanguage` traducidos, y las etiquetas de miga de
  pan salen **del rastro visible** — una página en español cuyo HTML dice
  "Inicio" no puede entregarle a Google un JSON-LD que diga "Home".
- **`TravelAgency`, `TouristDestination`, `Service` y los `ItemList` de tours
  describen cosas del mundo real**, que no cambian porque cambie el idioma de la
  página. Conservan un `@id` estable y contenido **idéntico** en los tres
  idiomas, para que las tres versiones resuelvan a **un** negocio y **una**
  Sosúa, no a tres de cada. Es la invariante #3 extendida: el nodo es ahora
  idéntico en 33 páginas, no en 11.
- **`FAQPage` se regenera por idioma** desde el acordeón visible de ese idioma.

#### El selector de idioma pasa a ser enlaces

`.lang-btn` era un `<button>` que llamaba a `setLang()`. Ahora es un `<a>` con
`href` real: un rastreador puede seguirlo y un visitante puede abrirlo en otra
pestaña. En consecuencia `js/i18n.js` toma el idioma de
`document.documentElement.lang` — **manda el documento servido**, no
`sessionStorage`, que se eliminó. Quedarse dentro de un idioma no necesita
estado: todos los enlaces internos son relativos, así que desde `/es/index.html`
se llega a `/es/transfers.html`.

`setLang()` se conserva como vía programática: es lo que dispara
`sariel:langchange`, el contrato que escuchan `calculator.js`, `cart.js`,
`tours.js`, `shell.js` y `contact-choice.js` para re-renderizar su contenido
generado por JS. Eliminarlo habría dejado seis listeners muertos en cinco
archivos.

#### Errores propios detectados y corregidos durante la construcción

1. **El bloque `hreflang` se acumulaba.** El generador borraba los `<link>`
   anteriores pero no su comentario, así que cada pasada añadía otra copia.
   Detectado al inspeccionar la salida, no por un test. Corregido y **verificada
   la idempotencia**: tres pasadas seguidas producen archivos byte a byte
   idénticos.
2. **`og:locale` con doble indentación.**
3. **Los nombres de las migas de pan seguían en inglés** en el JSON-LD de las
   páginas traducidas.
4. **`verify.py` mezclaba separadores de ruta** en Windows (`es\\transfers.html`
   frente a `es/transfers.html`) y trataba `404.html` como parte del clúster de
   idiomas, cuando no lo es: GitHub Pages la sirve en la raíz para cualquier
   ruta y no tiene canonical ni traducciones.

Efecto secundario útil: el generador también corrigió atributos que llevaban
tiempo desviados del diccionario — el `aria-label` del carrito decía *"Your
cart"* cuando el diccionario dice *"Your Requests"*, y varios `aria-label` con
un `&` sin escapar. `sync_fallbacks` nunca cubrió los atributos.

### Verificación

**24 comprobaciones, 0 fallos** (`python tools/verify.py`):
- 34 páginas, **162 bloques JSON-LD** parsean; todas las referencias `@id`
  resuelven.
- Etiquetas balanceadas en las 34.
- **1.255 claves × 3 idiomas, 0 faltantes.**
- **Invariante #1 por idioma**: 34 páginas comparadas contra el diccionario de
  la suya, **0 divergencias**.
- **Invariante #2**: 30 páginas con FAQ (10 × 3 idiomas), todas coinciden.
- **Invariante #3**: el nodo `TravelAgency` idéntico en las 33.
- **Invariante #4**: las 30 filas y los 17 precios de `config.js` presentes en
  `transfers.html#fares` **en los tres idiomas**.
- `<html lang>` coincide con la carpeta en las 33; cada canonical apunta a su
  propia URL; las 3 alternates + `x-default` son **recíprocas** en todas.
- Todas las rutas locales existen (resolviendo `../` desde cada carpeta).
- `sitemap.xml`: **33 URLs**, sin duplicados, exactamente las páginas
  indexables.
- `node --check` sobre los 9 archivos de `js/`.

**Files created:** `tools/build-langs.py`, `tools/verify.py`, `tools/_html.py`,
`tools/dump-dict.js`, `es/` (11 páginas), `fr/` (11 páginas).
**Files modified:** las 11 páginas inglesas (hreflang, selector, comentarios de
cabecera, atributos), `las-terrenas.html` (AZS), `js/i18n.js`, `css/styles.css`,
`sitemap.xml`, `llms.txt`, `PROJECT_INFO.md`, `DOCS/DEVELOPER_GUIDE.md`,
`DOCS/FOLDER_STRUCTURE.md`, `DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`,
`tasks/todo.md`.
**Files deleted:** ninguno.

**Sigue pendiente:**
- **`sameAs`: URLs de Facebook y TripAdvisor** — en espera por decisión del
  dueño.
- **`alt` de las imágenes y `og:image:alt` siguen en inglés en los tres
  idiomas.** Son atributos planos sin clave de diccionario, así que el generador
  no tiene de dónde traducirlos; el conmutador de idioma anterior tampoco los
  traducía nunca. Son ~80 claves × 3 idiomas: trabajo de redacción, no de
  código.
- **18 casillas "On request"** (antes 20; Las Terrenas perdió AZS y Cabarete ya
  tenía una menos).
- **Un encuadre más vertical de Cabarete.**

## 2026-08-22 — Textos alternativos de imagen en los tres idiomas

**Lo pedido:** *"repara los textos alternativos se puede poner que aparesca en
los 3 idiomas"*. Era el hueco que quedó documentado en la pasada anterior.

### El problema

Los `alt` de las imágenes y los `og:image:alt` eran atributos planos escritos a
mano en el HTML, sin clave de diccionario. Ni el conmutador de idioma antiguo ni
el generador de `/es/` y `/fr/` tenían de dónde traducirlos, así que una página
en español servía descripciones en inglés — que son justo lo que lee un lector
de pantalla y lo que indexa Google cuando no puede interpretar la imagen.

### La solución: el mecanismo que ya existía

No hizo falta inventar nada. `data-i18n-attr` ya traducía atributos, tanto en el
runtime (`applyStaticTranslations`) como en el generador (`translate_attrs`), y
funciona igual sobre un `<img>` que sobre un `<meta>`:

```html
<img src="img/hero-main.jpg" alt="Three white minivans…"
     data-i18n-attr="alt:alt.heroMain" />
<meta property="og:image:alt" content="Three white minivans…"
      data-i18n-attr="content:alt.heroMain" />
```

**Una clave por imagen, no por etiqueta.** La misma foto aparece en varias
páginas y se describe una sola vez: **78 etiquetas `<img>` se reducen a 41
cadenas**. El `og:image:alt` de cada página reutiliza la clave de la imagen a la
que apunta.

Total: **41 claves × 3 idiomas = 123 cadenas**, de las que 82 son nuevas. El
español y el francés se escribieron para esta pasada; no había nada que
reutilizar.

### Dos correcciones que salieron al hacerlo

1. **La tarjeta social y la imagen de la página se describían distinto.** En
   `nosotros.html` y en `sosua.html`, el `og:image:alt` tenía una redacción más
   rica que el `alt` de la misma foto. Al unificarlos bajo una clave se adoptó
   la mejor de las dos en ambos sitios.
2. **`cruises.html` usa dos imágenes distintas** — `hero-cruises.jpeg` como
   hero (el crucero atracado en Taino Bay) y `hero-cruises.jpg` como imagen
   social (la aérea de la ciudad). Son fotos diferentes y conservan claves
   diferentes; no se forzó una sola descripción para las dos.

### Las decorativas siguen mudas, a propósito

El logo de la cabecera (22 apariciones) y la banda del cierre (11) llevan
`alt=""` y **no reciben clave**. Son presentación: un lector de pantalla debe
saltárselas. Rellenarlas con texto habría empeorado la accesibilidad, no
mejorado el SEO. 78 imágenes − 33 decorativas = 45 etiquetas marcadas.

### La invariante #1 ahora cubre atributos

Hasta hoy `verify.py` comparaba contra el diccionario **solo el texto** de los
elementos, nunca los atributos. Eso es exactamente por lo que el `aria-label`
del panel del carrito llevaba tiempo diciendo *"Your cart"* mientras el
diccionario decía *"Your Requests"*: no había nada comprobándolo. Se añadieron
dos comprobaciones:

- cada atributo con `data-i18n-attr` debe igualar su valor de diccionario **en
  el idioma de su página** — 669 atributos comparados;
- ningún `alt` no vacío puede quedarse sin clave, para que un `alt` nuevo escrito
  a mano no se cuele en inglés en las tres versiones.

### Verificación

**26 comprobaciones, 0 fallos** (`python tools/verify.py`):
- 34 páginas, 162 bloques JSON-LD parsean; todas las referencias `@id` resuelven.
- **Invariante #1**: 0 divergencias de texto, **0 de las 669 divergencias de
  atributo**, ningún `alt` fuera del diccionario.
- Invariantes #2, #3 y #4 en verde en los tres idiomas.
- 1.296 claves × 3 idiomas, 0 faltantes.
- `<html lang>`, canonical y hreflang recíprocos en las 33.
- `node --check` sobre los 9 archivos de `js/`.

**Files modified:** las 11 páginas inglesas, `js/i18n.js` (+123 cadenas),
`tools/verify.py`, `es/` y `fr/` (regeneradas), `DOCS/DEVELOPER_GUIDE.md`,
`DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`, `tasks/todo.md`.
**Files created / deleted:** ninguno.

**Sigue pendiente:**
- **`sameAs`: URLs de Facebook y TripAdvisor** — en espera del dueño.
- **18 casillas "On request"** (tarifas desde STI / SDQ / PUJ).
- **Un encuadre más vertical de Cabarete.**

### Nota de correccion (2026-08-22)

Las dos entradas anteriores decian "30" y "32 comprobaciones". El numero real es
el de lineas que imprime `tools/verify.py`: **24** antes de esta pasada y **26**
despues (se anadieron dos: atributos y alt sin clave). Varios `check()` viven
dentro de bucles, asi que contar las llamadas en el fuente da menos que las
comprobaciones ejecutadas; el numero correcto es el de la salida.

## 2026-08-22 — Tarifas desde Santiago, Santo Domingo y Punta Cana

**Lo pedido:** *"18 casillas las tarfias desde santigo santo domigno y punta
cana usa las misma que hacia sosua"*.

### Lo que se aplicó

Las tarifas confirmadas a Sosúa desde esos tres aeropuertos —**STI US$98.50,
SDQ US$219, PUJ US$425**— se extienden a los otros cinco hubs. **12 de las 18
casillas** pasan de "On request" a precio.

### Dos rutas excluidas, con el visto bueno del dueño

**Santiago → Río San Juan** y **Santiago → Las Terrenas** se quedan en "On
request". Santiago está más lejos de ambos que Puerto Plata, así que el precio
de Sosúa habría publicado **un viaje más largo por menos dinero que la tarifa
desde POP impresa dos líneas más arriba en la misma tabla**: Las Terrenas
mostraría POP US$178.50 y STI US$98.50.

El argumento decisivo no es la distancia estimada sino el propio precio del
dueño: **STI → Cabarete cuesta US$98.95 frente a US$98.50 de Sosúa**. Esos 45
centavos demuestran que sí escala por distancia desde Santiago, luego una tarifa
plana en los tramos largos habría sido un descuido, no una política. Se consultó
antes de tocar nada y el dueño eligió dejarlas pendientes.

**AZS no se tocó**: el dueño nombró tres aeropuertos. Las cuatro celdas de
Samaná conservan su "On request".

**Balance: 12 publicadas, 6 pendientes** (2 × STI + 4 × AZS).

### Dónde entró cada precio

Un precio nuevo tiene que aparecer en cuatro sitios o la invariante #4 se rompe:

1. **`js/config.js`** — `OTHER_AIRPORT_FIXED_FARES` pasa de 5 a **17 tarifas**.
   Verificado evaluando el literal en Node: las 12 rutas nuevas devuelven precio
   y las 6 excluidas caen al flujo de "pedir cotización", que es justo el
   comportamiento correcto de la calculadora.
2. **`transfers.html#fares`** — la segunda tabla se regeneró entera desde
   `config.js`: de 5 a **17 filas**, y la página pasa de 30 a **42 filas** en
   total.
3. **Las cinco páginas de destino** — la celda de cada aeropuerto, el nodo
   `Service` (descripción de aeropuertos servidos + una `Offer` nueva por
   tarifa) y la nota al pie de la tabla.
4. **`llms.txt`** — la tabla de otros aeropuertos y los párrafos de Cabarete y
   Las Terrenas.

Las cinco notas al pie se reescribieron **en los tres idiomas** (15 cadenas).
Antes decían que las demás tarifas no se publicaban "porque solo publicamos
precios confirmados"; sigue siendo la política, pero ahora cada nota **nombra
exactamente cuáles quedan** en vez de generalizar.

### Una comprobación que dejó de ser frágil

`tools/verify.py` exigía `rows == 30` a fuego. Con eso, publicar una tarifa sin
añadirla a la tabla habría hecho fallar la comprobación por el motivo
equivocado, o peor, alguien habría subido el número a mano. Ahora **deriva el
total esperado de `config.js`** (destinos POP + provincias POP + tarifas no-POP
= 42) y compara. Además, la extracción de precios ya no busca solo claves
`'fixed:…'`: `OTHER_AIRPORT_FIXED_FARES` mezcla esas con slugs de provincia
sueltos como `'puerto-plata'`, que antes se le escapaban.

### Un desliz propio, corregido

El generador escribió `98.5` y `148.5` en `config.js` en lugar de `98.50` y
`148.50` — mismo valor en JavaScript, pero rompía el estilo del archivo.
Corregido antes de seguir.

### Verificación

**26 comprobaciones, 0 fallos** (`python tools/verify.py`):
- **Invariante #4 en los tres idiomas**: `transfers.html`, `es/transfers.html` y
  `fr/transfers.html` con **42/42 filas y los 17 precios de `config.js`**, sin
  inventar ninguno.
- `llms.txt` cubre todas las tarifas de `config.js`.
- Invariantes #1, #2 y #3 en verde; 669 atributos comparados.
- 34 páginas, 162 bloques JSON-LD parsean; `@id` resuelven.
- `node --check` sobre los 9 archivos de `js/`.

**Files modified:** `js/config.js`, `js/i18n.js`, `transfers.html`,
`cabarete.html`, `puerto-plata.html`, `cofresi.html`, `rio-san-juan.html`,
`las-terrenas.html`, `es/` y `fr/` (regeneradas), `llms.txt`,
`tools/verify.py`, `DOCS/DEVELOPER_GUIDE.md`, `DOCS/USER_MANUAL.md`,
`DOCS/PROOF_OF_WORK.md`, `tasks/todo.md`.
**Files created / deleted:** ninguno.

**Sigue pendiente:**
- **STI → Río San Juan** y **STI → Las Terrenas**: dos números del dueño.
- **Las cuatro tarifas desde Samaná (AZS)** a Cabarete, Puerto Plata, Cofresí y
  Río San Juan.
- **`sameAs`: URLs de Facebook y TripAdvisor.**
- **Un encuadre más vertical de Cabarete.**

## 2026-08-22 — Las seis tarifas restantes son politica, y Cabarete reencuadrado

**Lo pedido:** *"eso precios ponlos en on request y encuadra cabarete"*, en
respuesta punto por punto a la lista de pendientes de la pasada anterior.

### 1. Las seis celdas dejan de ser un hueco

STI → Rio San Juan, STI → Las Terrenas y las cuatro de Samana (AZS) **se quedan
en "On request" como respuesta definitiva**, no como algo a la espera de un
numero. No cambia nada en las paginas —ya estaban asi— pero si en la
documentacion: dejan de figurar como deuda del dueno y pasan a ser politica
declarada, con una nota explicita de **no rellenarlas por patron**.

Las notas al pie de las tablas ya lo decian bien ("no vamos a poner una
suposicion en una pagina publica"), asi que el texto visible no se toco.

### 2. El encuadre de Cabarete: el problema no era el tamano

`cabarete.jpg` mide 1800x562. La caja del hero es alta, asi que `object-fit:
cover` conserva una columna estrecha del fotograma y tira el resto. El
kitesurfista —el sujeto de la foto— esta en **x=517, el 29% desde la
izquierda**. Con el recorte centrado, la ventana visible en un telefono era
**x 725–1075**: agua abierta, sin jinete. La foto perdia justo aquello de lo
que trata.

```css
[data-page="cabarete"] .hero-bg img { object-position: 24% 50%; }
```

Medido, la ventana visible antes y despues:

| Pantalla | Centrado | Rider | Al 24% | Rider |
|---|---|---|---|---|
| Movil 390 | x 725–1075 | **NO** | x 348–698 | **SI**, centrado |
| Portatil 1440 | x 448–1352 | si | x 215–1118 | si, al tercio |
| Escritorio 1920 | x 298–1502 | si | x 143–1347 | si, al tercio |

Solo importa la componente horizontal: la caja es proporcionalmente mas alta
que la imagen, asi que la escala la manda la altura y no hay desbordamiento
vertical.

**`las-terrenas.jpg` no se puede arreglar asi** y conviene dejarlo escrito: su
letrero ocupa el ancho completo del fotograma, de modo que ninguna columna
estrecha muestra el nombre entero. Ahi la unica palanca era bajar la altura del
hero, y ya se bajo.

La regla queda documentada como excepcion por foto: se anade una linea **solo**
para un hero cuyo sujeto este descentrado. Las otras cinco fotos de destino
estan compuestas alrededor de su centro y no necesitan nada.

### Verificacion

**26 comprobaciones, 0 fallos.** Llaves de `css/styles.css` balanceadas
(649/649). Las ventanas de recorte se calcularon con la formula de `cover` en
vez de a ojo, y se genero una comparacion visual del recorte movil antes/despues
para el dueno.

**Files modified:** `css/styles.css`, `DOCS/DEVELOPER_GUIDE.md`,
`DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`, `tasks/todo.md`.
**Files created / deleted:** ninguno.

**Sigue pendiente:** solo **`sameAs`: las URLs de Facebook y TripAdvisor.**

## 2026-11-01T03:30:00.000Z — Medicion de conversiones de Google Ads

**Pedido:** medir las solicitudes que trae la campana "Transfers EN" (empieza el
1 de noviembre de 2026). El sitio no registraba ninguna conversion: solo tenia
GA4, y los botones principales abren WhatsApp con `window.open`, que la medicion
automatica de clics salientes de GA4 no detecta.

**Hecho:**
- `CONFIG.googleAdsConversion` guarda la conversion `SG - Solicitud de reserva`.
- `js/core.js` registra el destino `AW-18346905448` sobre el GA4 que ya carga
  cada pagina, con `allow_ad_personalization_signals: false`.
- `trackBookingConversion()` y `openWhatsApp()` en `js/core.js`. Las tres
  llamadas repetidas a `window.open` (dialogo, respaldo sin dialogo y carrito)
  ahora pasan por `openWhatsApp()`.
- `submitBookingEmail()` reporta la conversion solo si Formspree acepta el
  envio, lo que cubre el dialogo, el carrito y "Email Us" en un solo sitio.
- Boton flotante, enlace del pie y `#bookDirectCta` reportan el clic y abren en
  pestana nueva: navegar en la misma pestana podia cancelar el envio.

**No se instalo `G-YWXJ54LH6S`**, el codigo que ofrecia Google: es la etiqueta de
Agendaterd, que comparte esta cuenta de Ads. Sus visitas se habrian mezclado.

### Verificacion

Navegador real (Playwright) contra `python -m http.server`, con Formspree y
`wa.me` simulados para no enviar solicitudes reales al dueno.

| Escenario | Conversiones |
|---|---|
| Cargar la pagina | 0 |
| Dialogo → WhatsApp | 1 |
| Dialogo correo: sin nombre / correo invalido / Formspree 500 | 0 |
| Dialogo correo aceptado | 1 |
| Carrito WhatsApp sin nombre | 0 |
| Carrito WhatsApp / carrito correo | 1 / 1 |
| CTA directo / enlace del pie / "Email Us" | 1 / 1 / 1 |
| Boton flotante pulsado 3 veces seguidas | 3 (la accion cuenta "Una") |
| Movil 390 px en `es/transfers.html` | 1 |

Destino AW presente en las 9 paginas revisadas (`en`, `es`, `fr`). `404.html` no
carga GA ni core.js y sigue igual, sin errores. Consola limpia salvo el 500
simulado a proposito. Con la senal de personalizacion apagada desaparecieron
`rmkt/collect` y `1p-user-list`; `googleadservices.com/pagead/conversion` sigue
saliendo. `python tools/verify.py`: TODO OK.

**Sin probar todavia:** un clic real de anuncio en produccion. Las pruebas locales
llevan el evento a Google pero no tienen `gclid`, asi que no cuentan como
conversiones de la campana.

**Files modified:** `js/config.js`, `js/core.js`, `js/contact-choice.js`,
`js/cart.js`, `js/shell.js`, `DOCS/PROOF_OF_WORK.md`, `DOCS/DEVELOPER_GUIDE.md`,
`DOCS/USER_MANUAL.md`, `DOCS/DEPLOYMENT.md`, `PROJECT_INFO.md`,
`memory/decisions.md`, `tasks/todo.md`.
**Files created / deleted:** ninguno.

**Sigue pendiente:** aviso de privacidad y consentimiento de cookies. El sitio no
tiene ninguno y la campana puede llegar a visitantes de la UE y el Reino Unido.

## 2026-11-01T03:45:00.000Z — Politica de privacidad y aviso de cookies

**Pedido:** "haz privacidad y cookies". El sitio tenia GA4 y Google Ads sin aviso
ni politica, y la campana puede llegar a la UE y el Reino Unido.

**Hecho:**
- `js/consent.js`: Consent Mode, por defecto denegado en EEE, Reino Unido, Suiza y
  Quebec, y activo en el resto. Guarda la eleccion y borra `_ga*`/`_gcl*` al rechazar.
- Aviso en las 36 paginas, con Aceptar y Rechazar en igualdad, y "Configurar cookies"
  en el pie para cambiar de opinion.
- `privacy.html` en EN/ES/FR, con tabla de cookies y empresas implicadas.
- `tools/verify.py`, seccion 12: consent.js antes de gtag, aviso y pie en todas.
- `tools/build-langs.py`: la pagina nueva entra en `PAGES`.

**Correccion a la entrada anterior:** decia que no se instalo `G-YWXJ54LH6S`. Es
cierto, pero estaba incompleto. La prueba con cookies mostro `_ga_YWXJ54LH6S`: la
etiqueta `AW-18346905448` tambien reporta a esa propiedad de Agendaterd. Antes del
arreglo salieron 2 envios a esa propiedad en una sola carga de pagina. Ahora
`window['ga-disable-G-YWXJ54LH6S'] = true` la bloquea, y `verify.py` lo vigila.
Mis pruebas locales previas pudieron dejar unas pocas visitas en esa propiedad.
Nada de esto se llego a publicar.

**Tambien:** la sombra del carrito cerrado se veia en el borde derecho de todas las
paginas sobre fondos claros. Ahora solo aparece con el carrito abierto.

### Verificacion

Navegador real con Formspree y `wa.me` simulados.

| Prueba | Resultado |
|---|---|
| Orden de la cola | `consent default` x2 antes de `js` y `config` |
| Primera visita | Aviso visible, sin robar el foco |
| Rechazar | Sin cookies Google tras recargar, `gcs=G100` |
| Rechazar y enviar solicitud | Sin cookies, evento cookieless |
| Configurar cookies | Reabre, foco en Aceptar, luego vuelve al boton |
| Aceptar | `_ga`, `_ga_P5B6J8Y75V`, `_gcl_au`, `gcs=G111` |
| Rechazar tras aceptar | Cookies borradas |
| Propiedades GA con el bloqueo | Solo `G-P5B6J8Y75V`; conversion con su etiqueta |
| Regresion de conversiones | 7 validas = 7 envios; invalidas y fallidas = 0 |
| Home con selector de servicio | Conviven aviso y dialogo |
| Carrito abierto | Cubre el aviso |
| 390 px en frances | Sin scroll horizontal; boton de WhatsApp sobre el aviso |
| `es`/`fr` de privacidad | Idioma, titulo y textos correctos, sin claves vacias |

`python tools/verify.py`: TODO OK, 36 paginas mas 404.

**Sin probar:** el valor por defecto por region, porque depende de la ubicacion real
del visitante, y un clic real de anuncio. La politica no es asesoria legal.

**Files created:** `privacy.html`, `es/privacy.html`, `fr/privacy.html`, `js/consent.js`.
**Files modified:** las 11 paginas en ingles, sus 22 versiones `es/` y `fr/`,
`js/i18n.js`, `js/config.js`, `css/styles.css`, `sitemap.xml`,
`tools/build-langs.py`, `tools/verify.py`, `PROJECT_INFO.md`, `tasks/todo.md`,
`memory/decisions.md`, `memory/lessons.md` y los documentos de `DOCS/`.

## 2026-11-01T04:10:00.000Z — Publicado y comprobado en produccion

**Pedido:** publicar la medicion, la politica y el aviso de cookies.

**Hecho:** commits `fab3193`, `a633402` y `17e2197` en `master`, en vivo en GitHub Pages.

**Verificado en `caribbeansgtransferstours.com`,** con Formspree y `wa.me` simulados:
aviso visible en la primera visita; `G-YWXJ54LH6S` bloqueada; rechazar no deja cookies;
aceptar crea `_ga`, `_ga_P5B6J8Y75V`, `_gcl_au` y `_gcl_aw`; la conversion sale con su
etiqueta; 9 envios a GA4, todos a `G-P5B6J8Y75V`; privacidad responde 200 en los tres
idiomas; sin errores en consola ni recursos rotos.

`_gcl_aw` se comprobo con un `gclid` inventado, y esa prueba envio una conversion con
ese ID falso, que no corresponde a ningun clic real.

**Sin probar:** un clic real de anuncio y el aviso desde la UE o el Reino Unido.

## 2026-11-01T04:20:00.000Z — Dos fotos menos en la galeria de la portada

**Pedido:** quitar las fotos "Ridge walk" y la de las villas sobre el agua.

**Hecho:** se quitaron `gallery-5-hiking.jpg` y `gallery-7-overwater-villas.jpg` de
`index.html` y de `img/`, junto con sus 12 textos en `js/i18n.js`. `es/` y `fr/` se
regeneraron. En escritorio la galeria pasa de 4 a 3 columnas, porque 6 fotos en 4
columnas quedaban 1, 1, 2 y 2.

**Verificacion:** 6 fotos en EN/ES/FR, ninguna rota; 3 columnas de 2 fotos en
1280 px y 820 px, 2 columnas de 3 en 390 px. `python tools/verify.py`: TODO OK.

**Files modified:** `index.html`, `es/index.html`, `fr/index.html`, `js/i18n.js`,
`css/styles.css`, `DOCS/FOLDER_STRUCTURE.md`, `DOCS/DEPLOYMENT.md`,
`DOCS/PROOF_OF_WORK.md`.
**Files deleted:** `img/gallery-5-hiking.jpg`, `img/gallery-7-overwater-villas.jpg`.

## 2026-11-01T14:00:00.000Z — Resenas reales y sin calificacion inventada

**Pedido:** cambiar las resenas inventadas por 3 reales de Google, y quitar
"4.9 ★ · 350+ reviews" de la portada.

**Hecho:** portada con 3 resenas; transfers, excursions y cruises con pares distintos.
El texto es literal y sigue en ingles en los tres idiomas, con "Google review"
traducido debajo. Los nombres van como nombre e inicial. Portada a 3 columnas.
Fuera `reviews.quote4`, `hero.trustReviews` y los estilos que solo usaba la calificacion.

**Decision del dueno:** la tercera resena es de "Jeffry O. Meson M.", el mismo
nombre del perfil de pagos de Google Ads. El dueno fue avisado del riesgo de publicarla
sin aclarar esa relacion y decidio mantener las 3.

**Files modified:** `index.html`, `transfers.html`, `excursions.html`, `cruises.html`,
sus versiones `es/` y `fr/`, `js/i18n.js`, `css/styles.css`,
`DOCS/DEVELOPER_GUIDE.md`, `DOCS/DEPLOYMENT.md`, `DOCS/USER_MANUAL.md`,
`DOCS/PROOF_OF_WORK.md`.

## 2026-11-01T15:00:00.000Z — Politica de privacidad completada

**Pedido:** completar la politica con los datos del dueno.

**Hecho:** negocio familiar en Sosua, Puerto Plata; sin operadores externos; base de cada
uso; transferencia fuera del pais con la excepcion de contrato de la Ley 172-13 (art. 80);
sin base de datos de clientes: las solicitudes quedan en WhatsApp y correo, y se borran si
el cliente lo pide (se descarto un plazo fijo porque el negocio no borra mensajes por
rutina y seria una promesa falsa); plazos de 5 y 10 dias habiles (arts. 10 y 8). Los tres puntos tecnicos quedaron como estaban, por
decision del dueno.

**Sin resolver:** el negocio no esta registrado, asi que la politica no puede dar un
nombre legal. El dueno confirmo que tienen licencia y seguro, asi que "Licensed & insured"
se mantiene en el sitio y en el anuncio.

**Files modified:** `privacy.html`, `es/privacy.html`, `fr/privacy.html`, `js/i18n.js`,
`DOCS/DEPLOYMENT.md`, `DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`.

## 2026-11-01T16:00:00.000Z — Resena de quien gestiona la pagina retirada

**Pedido:** borrar la resena de Jeffry M. Quien pidio el cambio gestiona el sitio y la
cuenta de Ads, pero el negocio no es suyo, asi que su opinion no es la de un cliente.
Las entradas anteriores llaman "dueno" a esa persona; corrige ese termino.

**Hecho:** quedan 2 resenas, Donald C. y Daniela, en todas las paginas con resenas. Fuera
`reviews.quote3` y la regla CSS de 3 columnas.

**Files modified:** `index.html`, `transfers.html`, `excursions.html`, `cruises.html`,
sus versiones `es/` y `fr/`, `js/i18n.js`, `css/styles.css`, `DOCS/DEVELOPER_GUIDE.md`,
`DOCS/DEPLOYMENT.md`, `DOCS/PROOF_OF_WORK.md`.

## 2026-11-02T17:11:00.000Z — Servicio de chofer todo el dia en transfers

**Pedido:** agregar en transfers el servicio de chofer todo el dia, con el texto entregado.

**Decidido por quien gestiona el sitio:** sin precio publicado, solo cotizacion; hasta 15
pasajeros (la van tiene 16 asientos contando al chofer); "de dia o de noche, hasta 14 horas
por jornada" en lugar de "24 horas"; otros destinos se cotizan aparte.

**Hecho:** seccion `#full-day-driver` entre la calculadora y `#fares`, en EN/ES/FR. El boton
abre `openContactChoice()` y no pasa por el carrito. `llms.txt` describe el servicio.
Tambien se corrigio `js/contact-choice.js`: el segundo clic de un doble clic ya no cierra
el dialogo.

**Como verificar:** abrir `/es/transfers.html`, ir a "Chofer todo el dia" y pulsar
"Solicitar Cotizacion". `python tools/verify.py` da TODO OK. En navegador, con Google y
Formspree bloqueados o simulados: los 3 idiomas, WhatsApp, correo con campos vacios,
invalidos y validos, doble clic, clics repetidos, Esc, clic fuera, movil a 390 px y ticket
al carrito. La consola solo mostro el bloqueo de Google hecho por la prueba.

**Sin resolver, ajeno a este cambio:** la calculadora redondea los centavos
(`js/calculator.js:150`), asi que muestra 39 para una tarifa de US$38.95.

**Files modified:** `transfers.html`, `es/transfers.html`, `fr/transfers.html`,
`js/i18n.js`, `js/calculator.js`, `js/contact-choice.js`, `css/styles.css`, `llms.txt`,
`PROJECT_INFO.md`, `DOCS/DEVELOPER_GUIDE.md`, `DOCS/USER_MANUAL.md`,
`DOCS/PROOF_OF_WORK.md`, `memory/decisions.md`, `tasks/todo.md`.

## 2026-11-02T17:19:00.000Z — Centavos en la calculadora y nuevos metodos de pago

**Pedido:** corregir el redondeo de la calculadora y agregar PayPal, Cash App y Zelle como
opciones de pago, porque el sitio solo decia efectivo. El pedido decia "zeller"; se
interpreto como Zelle.

**Hecho:** `animatePrice()` usa por defecto la misma regla que `formatMoney()`: sin decimales
en enteros y 2 con centavos. El valor estatico de `#bpAmount` pasa de 40 a 38.95, la tarifa
real de la ruta inicial. Los pagos se actualizaron en 33 claves por idioma, en las 12 paginas
en ingles y en `llms.txt`. Se mantienen "sin pago anticipado" y la tarjeta a solicitud.
`paymentAccepted` y las respuestas FAQ del JSON-LD coinciden con lo visible. La politica de
privacidad menciona esos servicios y su fecha pasa al 2 de noviembre.

**Como verificar:** `python tools/verify.py` da TODO OK y ninguna frase del negocio deja solo
efectivo. En navegador: 126 combinaciones de ruta y pasajeros coinciden con `js/config.js`,
cambios rapidos seguidos terminan en 38.95, y 7 pasajeros con 11 maletas dan US$58.95 en la
calculadora y en el carrito. El boleto no se desborda en EN/ES/FR a 1440 y 390 px. La consola
solo mostro el bloqueo de Google hecho por la prueba.

**Files modified:** las 12 paginas en ingles que llevan JSON-LD, sus versiones `es/` y `fr/`,
`js/core.js`, `js/i18n.js`, `llms.txt`, `DOCS/DEVELOPER_GUIDE.md`, `DOCS/USER_MANUAL.md`,
`DOCS/PROOF_OF_WORK.md`, `memory/decisions.md`, `tasks/todo.md`.

## 2026-11-02T17:29:00.000Z — City Tour a US$20 por persona, sin teleferico

**Pedido:** el City Tour es US$20 por persona; quitar tambien los boletos de teleferico.

**Hecho:** 80/100/120 en `#exc4` y `#cruise2`, que es el mismo tour para cruceristas, con
total, monto por persona, descripcion en EN/ES/FR, JSON-LD y `llms.txt`. Se quito la linea
de boletos (`exc4.include2`). Tambien se quito el teleferico de las descripciones del tour,
porque seguian prometiendolo. Las guias de destino no cambian: hablan del lugar.

**Como verificar:** `python tools/verify.py` da TODO OK. En navegador, en los 3 idiomas y en
las 2 paginas: 4, 5 y 6 personas dan 80, 100 y 120, siempre con US$20 por persona; 7 pide
cotizacion; 6 personas suman US$120 en el carrito; el ATV sigue en 260/325/390. Sin
desbordes a 390 px. La consola solo mostro el bloqueo de Google hecho por la prueba.

**Files modified:** `excursions.html`, `cruises.html`, sus versiones `es/` y `fr/`,
`js/i18n.js`, `llms.txt`, `DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`,
`memory/decisions.md`, `tasks/todo.md`.

## 2026-11-02T18:09:00.000Z — Chofer todo el dia: un solo viaje a Puerto Plata

**Pedido:** el viaje a Puerto Plata no es por dia, es solo uno.

**Hecho:** `driverDay.inc5` en EN/ES/FR y `llms.txt` dicen ahora un solo viaje de ida y
vuelta. Se mantiene "ida y vuelta", como en el texto original del servicio.

**Como verificar:** `python tools/verify.py` da TODO OK. En `/es/transfers.html`, la seccion
"Chofer todo el dia" dice "Un solo viaje de ida y vuelta a Puerto Plata".

**Files modified:** `transfers.html`, `es/transfers.html`, `fr/transfers.html`, `js/i18n.js`,
`llms.txt`, `DOCS/PROOF_OF_WORK.md`.

## 2026-11-02T18:10:00.000Z — Chofer todo el dia: texto del viaje a Puerto Plata

**Pedido:** quitar "solo", porque suena a poco.

**Hecho:** la linea dice "Un viaje de ida y vuelta a Puerto Plata" en EN/ES/FR y en
`llms.txt`. Sigue sin "por dia", asi que incluye un viaje en total.

**Como verificar:** `python tools/verify.py` da TODO OK. En `/es/transfers.html`, la seccion
"Chofer todo el dia" muestra la linea nueva.

**Files modified:** `transfers.html`, `es/transfers.html`, `fr/transfers.html`, `js/i18n.js`,
`llms.txt`, `DOCS/PROOF_OF_WORK.md`.

## 2026-11-10T13:44:00.000Z — Pagina de traslados pensada para quien llega del anuncio

**Pedido:** aplicar las mejoras de prioridad alta del analisis de la pagina: subir las
rutas, mejorar el hero y mostrar "Licensed & insured". Las resenas quedan fuera.

**Hecho:** las rutas con precio y la calculadora van ahora justo debajo del hero; el
resumen y las tres tarjetas de servicios bajan. El hero muestra precio desde US$23.95,
pago al llegar, cancelacion gratuita y licencia y seguro, con fondo mas oscuro y el
texto visible en 0,45 s. `#transfers` apunta ahora a las rutas y las tarjetas pasan a
`#services`. Se quito `.reveal` de las rutas porque dejaba una franja en blanco.

**Como verificar:** `python tools/verify.py` da TODO OK. En navegador a 375 px, la
primera ruta empieza en 757 px (antes 3.346) y la calculadora en 2.686 px (antes 5.423).
"Book Directly" abre el dialogo con la ruta y "Add to Cart" la anade al carrito. ES y FR
muestran la lista traducida, sin desbordes y sin errores en consola. A 1024 px la lista
cabe en una linea y no toca el indicador de scroll.

**Files modified:** `transfers.html`, `es/transfers.html`, `fr/transfers.html`,
`js/i18n.js`, `css/styles.css`, `DOCS/DEVELOPER_GUIDE.md`, `DOCS/PROOF_OF_WORK.md`.
**Files created:** `.claude/launch.json` (servidor local de vista previa, sin versionar).
