# USER_MANUAL — SG Caribbean Transfers & Tours site

> Last updated: 2026-07-20 UTC (competitor-based price list, luggage fee, "Meet the team" moved to its own page)
> Audience: the business owner / content editor. No coding experience assumed
> beyond opening a file in a text editor.

## What the site does
The site is now **five pages**: a home page (`index.html`), one page per
service — `transfers.html`, `excursions.html`, `cruises.html` — and a
"Meet the team" page (`nosotros.html`). Visitors land
on whichever page fits them (a first-time visitor to the home page is asked
which service they want — see "The service-picker popup" below), browse that
service, add whatever they want to a **cart** (top-right of the header — the
shopping-cart icon, present on every page), and send everything in **one
pre-written WhatsApp message** from the cart drawer. Because the cart is
shared across pages, someone can add a transfer on `transfers.html`, then
browse to `excursions.html` and add a tour, and both show up together at
checkout. People who'd rather skip that and just talk to someone can go to
the home page and tap "Chat on WhatsApp" at the bottom. Either way, you
confirm by replying on WhatsApp — there is no backend, no database, nothing
to maintain.

## How the cart works
- Every "Add to Cart" button (on a route ticket, the transfer calculator, an
  excursion, or a cruise card) adds one line to the cart — it does **not**
  book anything automatically or charge anyone. Visitors can add several
  things (a transfer + two excursions, for example) before sending.
- The cart icon in the header shows how many items are inside, on every
  page. Clicking it opens the drawer: each item, its price, a total,
  **full name** (required to send), **flight number** (optional — for
  airport pickups), a **flight/pickup date** and a separate **excursion
  date** (both optional — kept as two fields on purpose, since a flight
  date and an excursion date are often different days), and two send
  buttons: **"Send via WhatsApp"** and **"Send via Email"** — the visitor
  picks whichever they prefer, both send the exact same message. Name,
  flight and both dates apply once to the whole message, not per item —
  there's one visitor filling the cart, so these cover everything they
  added, even if it's a transfer plus an excursion together.
- There's also an optional **"Number of suitcases"** field (added
  2026-07-20) in that same drawer. If the visitor enters **more than 10**,
  a flat **US$15 luggage fee** is added to the total shown and to the
  WhatsApp/email message automatically — you don't have to calculate it. To
  change the free limit or the fee amount, edit `LUGGAGE_FREE_LIMIT` /
  `LUGGAGE_EXTRA_FEE_USD` in `js/config.js` (same file as the other pricing
  constants).
- Sending (either button) opens WhatsApp or the visitor's email app with one
  message listing everything requested (name, flight number and both dates
  right at the top, so you don't have to ask), then empties the cart. You
  reply to confirm availability and take payment details however you
  normally do (cash on arrival, per the site's copy). The email option sends
  to **`sg.caribbeantrasferstours@gmail.com`** (`CONFIG.contactEmail` in
  `js/config.js` — see "Things you MUST change before going live" if this
  ever changes, and also update the 4 footers' contact links to match).
- The cart is saved in the visitor's own browser, so it's still there if
  they close the tab and come back later, or move between pages — but it's
  specific to their device/browser, not shared with you until they hit send.

## The service-picker popup (home page only)
The first time someone visits the home page in a given browser session, a
pop-up window asks which service they're interested in — Transfers,
Excursions, or Cruises — and clicking one takes them straight to that page.
There's also a "Browse everything" option and an × to close it without
choosing; either way, the visitor still sees the same three options as
regular cards further down the home page, so nothing is hidden. It only
asks once per session (closing it, or picking a service, both count as
"asked" — it won't pop up again until the visitor opens a fresh browser
session). There's nothing to configure here day-to-day; the wording is
edited the same way as any other page text (see "Editing FAQ / texts"
below) — the
popup and the home page's own service cards share the same translation keys,
so editing one updates both.

## The "Meet the team" page (`nosotros.html`)
**Moved here from the home page on 2026-07-20** — it used to be a section
(`#about`) inside `index.html`; now it's its own page, linked from "Meet the
team" in the header/footer nav on every page. It starts with a hero banner
(`img/banner nosotros.jpeg`) and a short "who we are" company story next to
the logo, then the team photo card for each driver — **all four now have
real photos**: Saul, Sariel, Luis and Leuris. Below the team there's a fleet
gallery with 8 photos: 1 group shot, 4 individual vans, and 3 interiors.

- **The hero banner**: replace `img/banner nosotros.jpeg` (keep the same
  file name **and extension** — `nosotros.html`'s `<img src>` points at
  that exact name; if a replacement photo lands with a different extension,
  either rename it to match or update the `src`) to change the photo — no
  other HTML edit needed. The company-story
  text (eyebrow, heading, paragraph) is the `about.introEyebrow`/
  `about.introHeading`/`about.introBody` keys in `js/i18n.js` (`en`/`es`/`fr`).
- The photos live in the **`img/`** folder: `team-saul.jpg`, `team-sariel.jpg`,
  `team-luis.jpg`, `team-leuris.jpg` (drivers); `fleet-vans.jpg` (group shot),
  `fleet-van-1.jpg` through `fleet-van-4.jpg` (each van individually),
  `fleet-interior-1.jpg` through `fleet-interior-3.jpg` (interiors — there are
  4 vans but only 3 interior shots available, so they're shown as their own
  group rather than forced into pairs). They were prepared from the originals
  in `Nueva carpeta/` — resized for the web and stripped of hidden phone
  metadata (like GPS location), so always prefer updating `img/` rather than
  pointing the site at `Nueva carpeta/`.
- **To add a 5th van or a 4th interior later:** process the photo the same
  way (resize + strip EXIF — see `memory/decisions.md` for the exact
  PowerShell approach used), save it in `img/` with the next number in the
  sequence, then copy one of the existing `<figure class="masonry-item
  fleet-item reveal">` blocks in `nosotros.html`'s fleet-grid, point its
  `<img src>` at the new file, and add a matching `about.fleetN` key to
  **all three** of `en`, `es` and `fr` in `js/i18n.js` for its caption.
- **To swap any driver, van or interior photo:** overwrite the matching file
  in `img/` keeping the same file name — no HTML edit needed.
- Names are plain text in `nosotros.html` (they're the same in every
  language); all other wording uses the `about.*` keys in `js/i18n.js`
  (`en`/`es`/`fr`).

## The logo and favicon
The real "SG Caribbean Tours & Transfers" circular logo (from your
`Nueva carpeta/logo favicon.jpeg`) is now used everywhere a brand mark
appears: the browser tab icon (favicon), the header logo, the footer
logo, and the "Meet the team" page's company-intro photo, on all five
pages — plus as a centered watermark behind the home page's "choose your
experience" popup (`.service-dialog::backdrop` in `css/styles.css`).
Processed files live in `img/`: `logo.jpg` (the
header/footer mark, shown as a circle via CSS), `favicon-32.png` (browser
tab) and `favicon-180.png` (phone home-screen icon, e.g. when someone saves
the site to their iPhone). **To change the logo:** replace `img/logo.jpg`
with your new logo (a photo with the design centered and filling most of the
frame works best, since the header/footer crop it into a circle), then
re-generate the two favicon PNGs at 32×32 and 180×180 from the same image —
ask Claude Code to do this, it's a couple of PowerShell commands (see
`memory/decisions.md`).

## Where visitors can contact you
- The cart's "Send via WhatsApp" **or** "Send via Email" buttons (after
  adding one or more items, visitor picks the channel) — works the same on
  every page.
- "Chat on WhatsApp" **and** "Email Us" near the bottom of whichever page
  they're on (for people who want to talk directly instead of using the
  cart) — every page has its own copy of this section, both buttons send a
  generic "I'd like more information" message.
- The floating green WhatsApp button (appears after scrolling past the hero,
  on every page).
- "WhatsApp us" in the footer.

## Things you MUST change before going live
1. **WhatsApp number** — done. `js/config.js` now has your real number
   (`18296277733`, i.e. +1 829-627-7733). This one file controls the number
   everywhere (all five pages, the floating WhatsApp button, footer link,
   and cart checkout) — there is nowhere else to change it.
2. **Contact email** — done. The footer's `mailto:` link on all five pages
   is `sg.caribbeantrasferstours@gmail.com`.
3. **Cruise card prices** — 2 of 3 cruise cards are filled in (27 Charcos,
   City Tour). `#cruise3` still ships with placeholder
   `data-prices='{"4":0,"5":0}'` (see "Editing the cruise cards" below) —
   fill in real totals once a third cruise excursion is confirmed, or
   visitors will see $0.
4. **Photos** — the "Meet the team" page (`nosotros.html`) and the Punta
   Rusia card and cruise hero already use your real photos (in `img/`). The
   rest of the site (main hero, gallery, transfer trust images, the other
   excursion/cruise cards) still uses stock placeholders, all downloaded
   into `img/` with descriptive names so you can swap them yourself:
   **just save your own photo over the existing file in `img/`, using the
   exact same file name — no HTML editing needed.** Full list of filenames
   still pending your photos is in `DOCS/DEPLOYMENT.md`'s go-live checklist.
5. **Domain** — done. All five pages, `sitemap.xml` and `robots.txt` now
   use `https://sgcaribbeantransfertours.com/` (set 2026-07-20).
6. **Reviews** — replace the four sample testimonials (on the home page)
   with real guest quotes.

## Changing prices
- **Transfers — Popular Routes (fixed prices):** near the top of
  `transfers.html`, the "Popular routes" ticket rail shows your 9 real,
  hand-typed prices (Puerto Plata/Santiago/Santo Domingo/Punta Cana/Samaná
  airports → Sosúa/Cabarete/Puerto Plata), each good for 1–6 guests. To
  change one, find its `<article class="ticket">` block and edit two
  things together so they stay in sync: the visible price
  (`<strong>US$5.50</strong>`) and the button's
  `data-fixed-price="5.50"` attribute (the number actually charged —
  the visible text is just for display, so both must match). To add a new
  route, copy one whole `<article class="ticket">...</article>` block and
  change its airport/town labels, `data-fixed-from`/`data-fixed-to` (see
  the `place.*` keys in `js/i18n.js`) and price.
- **Transfers — fixed fares from Puerto Plata Airport, inside the
  calculator:** the price calculator further down `transfers.html` also
  handles ~50 more destinations with a real confirmed price (Bahía
  Príncipe, Boca Chica, Las Terrenas, Punta Cana, etc.) — pick "Puerto
  Plata Airport" as pickup and any of them under the **"Fixed destinations"**
  group in the Destination dropdown, and it shows the exact price instead
  of an estimate (the vehicle dropdown grays out for these — the price is
  flat, it doesn't change by vehicle). These live in **`js/config.js`**, not
  in the HTML: `POP_FIXED_DESTINATIONS` (an object, one entry per
  destination: `{ name: 'Bahía Príncipe', price: 78.50 }`) and
  `POP_PROVINCE_FIXED_FARES` (for destinations whose name matches one of
  your existing provinces exactly, e.g. Santiago or Santo Domingo — just a
  `province-slug: price` number). To change a price, edit the number in
  whichever of the two it's in. To add a brand-new destination that isn't
  already a province, add a new line to `POP_FIXED_DESTINATIONS`, then add
  a matching `<option value="fixed:your-slug">Name</option>` inside the
  "Fixed destinations" `<optgroup>` in `transfers.html`'s `calcDest`
  dropdown (both need the same slug). These prices were originally set on
  2026-07-20 by matching a competitor's posted price sign, undercutting
  every price by US$1.50, and confirming with you that they're real
  Puerto-Plata-Airport prices (not the competitor's own local short-hop
  prices) — see `memory/decisions.md` for that reasoning if you ever want
  to redo the comparison. **This used to be a separate list on the page**
  (below the ticket rail) but was merged directly into the calculator on
  2026-07-20 so there's only ever one place a price is shown for a given
  trip.
- **Transfers — everything else (calculator):** any route *not* in the
  Popular Routes list is priced by the calculator further down
  `transfers.html`, which estimates price and duration from real distance
  instead of a per-route number. In **`js/config.js`**:
  - `AIRPORTS` / `PROVINCES` — the list of pickup airports and destination
    provinces (with approximate coordinates used only for the distance
    estimate).
  - `VEHICLES` — extra cost per vehicle size, added on top of the
    distance-based price.
  - The constants just above `estimateRoute()` (`PRICE_BASE_USD`,
    `PRICE_PER_KM_USD`, `AVG_ROAD_SPEED_KMH`) control the pricing formula
    itself — raise `PRICE_PER_KM_USD` to increase prices everywhere at once.
- **Excursions:** `excursions.html` → each excursion block starts with
  `data-prices='{"4":235,"5":270}'` — the number after each guest count is
  the total USD price. **Minimum group size is 4 on every card** — don't
  re-add `"2"`/`"3"` keys or guest buttons, that's an intentional business
  rule, not a leftover. Cards go up to 5 or 6 depending on what's offered
  (flat-price cards like City Tour go to 6 since the price doesn't change
  by headcount). Also update the visible default price
  (`<span class="exc-amount">235</span>`) to match whichever guest button
  has `is-active`. If a price has cents (like Punta Rusia's
  $123.95/person), make sure the card's `<article>` also has
  `data-decimals="2"` or the animated price will round off the cents.
  **Bigger groups than the buttons show:** every card also has a "type
  your own number" field next to the preset buttons (for parties of 8, 10,
  12...). If the number someone types matches one of your `data-prices`
  keys, it prices normally; if it doesn't (which is most of the time, since
  you've usually only priced 4 and 5), the card shows "Contact us for a
  quote" and the button becomes "Ask for a Quote" — clicking it opens
  WhatsApp with the excursion name and group size already filled in, so you
  can quote them directly rather than the site guessing a price. **You
  don't need to do anything to enable this** — it just works from the
  `data-prices` you already have. If you want a bigger group to price
  automatically instead of asking you, add its exact number as a new key
  (e.g. `"8":420`) to that card's `data-prices`.
- **Cruises:** same mechanism as excursions, on `cruises.html` — see
  "Editing the cruise cards" below.

## Editing the cruise cards (`cruises.html`)
There are 3 cruise cards, each built from the same markup as an excursion
panel plus two extra optional fields (ship name + departure time). Two are
filled in with real tours (`#cruise1` = 27 Charcos de Damajagua, `#cruise2`
= Puerto Plata City Tour — same content/pricing as their `excursions.html`
counterparts); `#cruise3` is still the placeholder template
(`data-prices='{"4":0,"5":0}'`) waiting for a third real cruise excursion.
To fill one in with a real tour:
1. **Title / description / duration** — these are translated text, so edit
   them in `js/i18n.js` under the keys `cruise1.title` / `cruise1.desc` /
   `cruise1.duration` (and `cruise2.*` / `cruise3.*` for the other two
   cards) — in **all three** of the `en`, `es` and `fr` blocks. Don't edit
   the text directly in `cruises.html`; it will be overwritten by the
   translation on page load.
2. **Photo** — replace the `<img src="...">` inside that card's
   `<figure class="exc-media">` in `cruises.html` with your own photo URL,
   and update its `alt` text to describe the new image.
3. **Prices** — update the card's `data-prices='{"4":0,"5":0}'` attribute
   with real totals per guest count (same pattern as excursions, above —
   minimum group size is 4, don't add `"2"`/`"3"` keys), and update the
   visible default (`<span class="exc-amount">0</span>`) to match the
   4-guest value.
4. **Ship name / departure time inputs** — these two fields are already
   built into every cruise card and work automatically; you don't need to
   configure anything. If a visitor fills them in, they're carried into the
   cart and the final WhatsApp message; if left blank, they're simply
   omitted — no broken message either way.

## Adding a new airport or province to the calculator
1. In `transfers.html`, add an `<option>` to the Pickup or Destination select
   (give it a `data-i18n="..."` key and a plain-text fallback).
2. In `js/config.js`, add a matching entry to `AIRPORTS` or `PROVINCES` with
   its coordinates.
3. In `js/i18n.js`, add the same key to **all three** of the `en`, `es` and
   `fr` dictionaries.

## Editing FAQ / texts
The site is trilingual (English, Spanish and French) via a switcher in the
top-right of the header, present on all four pages. **The site always opens
in English** for a new visit — a visitor's language choice is only kept
while they're actively browsing (moving between pages in the same tab); it
resets to English the next time they open the site. Every piece of text
lives in **`js/i18n.js`**, in three matching blocks — `en: { ... }`,
`es: { ... }` and `fr: { ... }` — as `'key': 'text'` pairs. Find the key you
want to change (the English text is usually recognizable) and edit its
value in **all three** blocks. Do not rename keys or remove the
`data-i18n="..."` attributes in any of the four HTML pages — those are what
connect each key to its spot on the page.

If you add a brand-new sentence that doesn't exist yet, add a matching entry
to **all three** of `en`, `es` and `fr` in `js/i18n.js`, or it will silently
fall back to English wherever the other language is missing it. Each page's
browser-tab title and meta description are also translated text — they live
under `meta.home.*`, `meta.transfers.*`, `meta.excursions.*` and
`meta.cruises.*` in the same file.
