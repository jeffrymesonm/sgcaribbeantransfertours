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
domain (owner-confirmed: `caribbeansgtransfertours.com`).

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
