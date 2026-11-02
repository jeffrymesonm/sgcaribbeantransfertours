# DEVELOPER_GUIDE — SG Caribbean Transfers & Tours site

> Last updated: 2026-11-02 UTC (full-day driver section, payment methods, calculator cents)

## SEO / AEO invariants — read before editing content
Five rules the whole site now depends on. Breaking any of them silently
degrades indexing; none of them is enforced by a build step, because there
isn't one.

1. **The static HTML must equal the dictionary.** `applyStaticTranslations()`
   overwrites `innerHTML` for every `[data-i18n]` on load, so a visitor always
   sees `js/i18n.js`. The literal text left in the markup is what a non-JS
   crawler indexes. When they disagree, Google indexes copy no human ever
   sees — this was real on four keys before 2026-08-12. **Change a string in
   `js/i18n.js` and change the fallback in the HTML to match.**
2. **FAQ answers exist twice.** The visible accordion (`js/i18n.js`) and the
   `FAQPage` JSON-LD in that page's `<head>`. They must match **word for
   word**; if they disagree Google may discard the block. Pages with a FAQ:
   `index`, `transfers`, `excursions`, `cruises`, `sosua`.
3. **One business entity.** Every page carries the same `TravelAgency` block
   under `@id` = `https://caribbeansgtransferstours.com/#organization`.
   `provider` / `about` elsewhere reference that `@id` rather than restating
   the business. Edit the entity on all six pages together, or search engines
   stop resolving them to one organisation.
4. **Prices are duplicated as literal text.** `js/config.js` is the source of
   truth, but the same numbers appear in `transfers.html`'s ticket rail, in
   the `transfers.html#fares` tables (25 POP rows + 5 other-airport rows,
   added 2026-08-21), in `sosua.html`'s fare table, in `services.transferMeta`,
   in `llms.txt`, and inside JSON-LD `Offer`s. Grep the old number across
   `*.html`, `llms.txt` and `js/i18n.js` when a fare changes.

   The `#fares` tables deliberately restate what the calculator already
   computes. That is not redundancy to clean up: crawlers and answer engines
   do not run the calculator, so before this section existed ~25 fixed routes
   were unreachable to them. It supersedes the 2026-07-20 "exactly one place
   per route" decision. Keep it a mirror, never a second source.
5. **`llms.txt` is a published contract.** It repeats the entity facts, all 30
   fixed fares, the six tour prices and the key distances in plain text for
   generative engines. A stale `llms.txt` makes an answer engine quote a price
   the site no longer charges. Update it in the same commit as any fare, tour
   or contact change.

**Payment methods are duplicated the same way** (2026-11-02): cash, PayPal,
Cash App and Zelle on arrival, card on request. They appear in about 33 keys per
language, FAQ answers and their JSON-LD, the `Service` description on
`transfers.html`, `paymentAccepted` on all 12 pages (part of the shared entity in
rule 3), `llms.txt` and `privacy.collectPayment`. Grep `PayPal` before changing one.

**Testimonials are real Google reviews, word for word** (since 2026-11-01),
under `reviews.quote*` in `js/i18n.js`, kept in their original language in all
three dictionaries. Never edit, reword or invent
one, and never use a review by anyone who manages or works for the business.
Reviewer names are literal in each page's markup, first name plus initial.
**Do not add `Review` or `aggregateRating` JSON-LD** for reviews a business
publishes about itself: they do not qualify for rich results.

### Page-level content duplication
`cruises.html` reuses the `.exc` card markup from `excursions.html`, which
makes it easy to also reuse the *copy* — that happened, and drove a 73%
5-gram overlap between the two `<main>`s until 2026-08-12. Cruise cards now
describe the same activity **from the pier** (distance from Amber Cove /
Taino Bay, how it fits a port call). Keep it that way; measure with a 5-gram
overlap check if you add cards. Anything above ~50% is near-duplicate.
Each service page used to show a **different pair** of testimonials for the
same reason. With only two real reviews (2026-11-01) every page shows both, in a
varied order. Go back to different pairs once there are more.

## Architecture
Static **six-page** site, no dependencies, no build step. Every page shares
one header/cart-drawer/footer shell and one JS/i18n core; only the `<main>`
content and the per-page script list differ.

```
index.html         Home: hero + #services-picker + gallery + why-us +
                    reviews + FAQ + book CTA + service-picker <dialog> popup
transfers.html      Hero + services + Popular Routes ticket rail (9 tickets) +
                    full destination price list (50 fixed fares) +
                    boarding-pass price calculator + full-day driver + trust strip
excursions.html      Hero + 7 excursion cards + trust strip
cruises.html          Hero + guaranteed-return band + 3 template cruise cards + trust strip
nosotros.html          "Meet the team" (2026-07-20, split out of index.html's
                        old #about): hero banner + company intro + team grid +
                        fleet grid (real photos from img/) + book CTA
sosua.html              Sosúa destination hub (2026-08-12) — hero + quick-answer
                         block + airport fare table + arrival steps + cruise ports +
                         comparison table + nearby spots + 10-item FAQ + book CTA
css/styles.css      Design tokens + all styles (mobile-first)
js/i18n.js           EN/ES/FR dictionary + t()/getLang()/setLang() + per-page meta (loads first)
js/config.js         CONFIG (WhatsApp number) + AIRPORTS/PROVINCES/VEHICLES + pricing model
js/core.js            Shared utilities: animatePrice, formatDuration, whatsappLink, prefersReducedMotion
js/contact-choice.js   openContactChoice() — WhatsApp-or-email <dialog> for direct booking/quote buttons
js/cart.js             Cart state/panel/checkout (versioned localStorage)
js/shell.js              Header, mobile nav, reveals, parallax, counters, FAQ accordion, WhatsApp links
js/calculator.js          Transfer calculator (transfers.html only)
js/tours.js               Excursion/cruise guest-pricing + Add to Cart (excursions.html, cruises.html)
js/service-picker.js      Home-only first-visit service <dialog> (index.html only)
```

`js/main.js` (the pre-refactor 31 KB monolith) was **deleted** and its
responsibilities split across the 8 modules above — see "JS modules" and
"Per-page script loading" below.

### Site structure: 6 pages, 1 shared shell
Every page's `<body>` starts with the same header (brand, `site-nav`,
language switch, cart button, mobile-nav toggle), the same cart drawer
(`#cartScrim` / `#cartPanel`), and ends with the same footer + floating
WhatsApp button. Only `<main>` differs. This means:
- Cart state (`localStorage['sariel-cart']`) and language choice
  (`localStorage['sariel-lang']`) are shared across all 6 pages — add a
  transfer on `transfers.html`, then open the cart on `cruises.html`, and
  the item is still there.
- Any shell change (header markup, cart drawer markup, footer) must be
  applied to **all six** HTML files by hand — there's no templating/include
  mechanism. Keep them byte-for-byte identical outside the per-page bits
  (`data-page`, `aria-current`, JSON-LD, `<main>` content).

### Navigation + aria-current
`site-nav` (desktop) and `mobile-nav` (mobile) on all 6 pages link:
Transfers → `transfers.html`, Excursions → `excursions.html`,
Cruises → `cruises.html`, Meet the team → `nosotros.html`,
FAQ → `index.html#faq`. The old single-page "Prices" link is gone (prices
now live on `transfers.html`/`excursions.html`/`cruises.html` directly), and
the header "Reviews" link was replaced by "Meet the team" on 2026-07-17 —
reviews remain reachable via each page's footer (`#reviews` is a per-page
section, so the footer link stays local). **"Meet the team" pointed at
`index.html#about` until 2026-07-20**, when the team/fleet content moved to
its own page (`nosotros.html`) — the link now goes there directly on all 6
pages (including a self-referencing `aria-current="page"` link from
`nosotros.html` itself).
Each service page marks its own nav link `aria-current="page"` in both the
desktop and mobile nav (`transfers.html`/`excursions.html`/`cruises.html`/
`nosotros.html`); `index.html`'s nav has no self-link to mark (Reviews/FAQ
are anchors on the home page itself, not a "Home" link).
**The destination hubs are deliberately absent from the header nav**
(2026-08-12, reaffirmed 2026-08-21): the desktop nav already carries five
items and more crowd it at tablet widths. `sosua.html` and `cabarete.html`
are linked instead from the **footer Services column on every page**
(`footer.serviceSosua` / `footer.serviceCabarete`, each with
`aria-current="page"` on its own page), which is enough for crawl discovery,
plus contextual in-body links — including a reciprocal link between the two
hubs inside each one’s "what’s nearby" card for the other town.

### Destination pages (six hubs)
`sosua.html` established the pattern. `cabarete.html` was generated from it,
then rebuilt without distances; **`cabarete.html` is now the template** and
`puerto-plata.html`, `cofresi.html`, `rio-san-juan.html` and
`las-terrenas.html` (all 2026-08-21) were generated from that. All six share
the shell, the section order and the `.dest-*` styles; each owns a namespace
in `js/i18n.js` (`sosua.*`, `cabarete.*`, `puertoplata.*`, `cofresi.*`,
`riosanjuan.*`, `lasterrenas.*`) of ~140 keys × 3 languages.

They are built to be *quoted* by search and answer engines rather than merely
ranked. The rules for adding a seventh:
- **Quick-answer block first.** One factual paragraph plus a `<dl>` of hard
  numbers, directly under the hero. This is what AI Overviews and chat
  assistants lift verbatim, so it must stay factual — never let it drift
  into marketing prose.
- **Real numbers in real `<table>`s.** The fare table mirrors
  `js/config.js` (`OTHER_AIRPORT_FIXED_FARES`, `POP_FIXED_DESTINATIONS`) and
  the Popular Routes rail in `transfers.html`. **Prices are duplicated as
  literal text** — change a fare in `config.js` and you must change it here
  and in the page's `Service`/`OfferCatalog` JSON-LD too.
- **Four JSON-LD blocks**: `TouristDestination` (resolves the place as an
  entity), `Service` + `hasOfferCatalog` (the fares), `FAQPage` (mirrors the
  on-page FAQ **word for word** — edit one, edit the other), `BreadcrumbList`.
  All English-only, matching the served HTML, exactly as on the other pages.
- **No invented figures — and since 2026-08-21, no distances at all.** Only
  `sosua.html` publishes kilometres and drive times, because the owner
  confirmed those. Every other hub describes where a place is ("just east of
  Sosúa", "in the next bay") and sends the visitor to WhatsApp for a real
  journey time. The air table on those pages has no Distance or Drive column.
  Do not add either without a number from the owner.
- **Only confirmed fares are published.** Each hub prints the one POP fare
  that exists in `js/config.js` and shows **"On request"** for the other four
  airports rather than guessing. The copy turns that into a policy ("we only
  publish prices we have confirmed"), which is honest and routes to WhatsApp.
- **The cruise section is allowed to say no.** `las-terrenas.html` states
  outright that it does not fit a Puerto Plata port call. That is the most
  valuable paragraph on the page.
- **STI / SDQ / PUJ now carry the Sosúa fare on the other hubs** (owner
  decision, 2026-08-22): US$98.50 from Santiago, US$219 from Santo Domingo,
  US$425 from Punta Cana. **Two runs were deliberately excluded** —
  Santiago → Río San Juan and Santiago → Las Terrenas. Santiago is further from
  both than Puerto Plata is, so the Sosúa price would have printed a longer
  journey for less than the POP fare sitting beside it in the same table; the
  owner's own STI pricing already scales with distance (Cabarete US$98.95
  against Sosúa US$98.50). Those two, and the four AZS cells, stay "On request"
  — confirmed by the owner on 2026-08-22 as the settled answer, not a gap
  waiting on a number. **12 fares published, 6 quoted on request by policy.**
  Do not fill them from a pattern; only a fare the owner states goes in.
- **Las Terrenas does not offer Samaná El Catey (AZS) as a way in**
  (owner instruction, 2026-08-22). The airport row, the "nearest airport"
  fact and the AZS pickup FAQ were removed from that page; the page routes
  arrivals through Puerto Plata (POP) and Santo Domingo (SDQ). **AZS stays
  everywhere else** — `js/config.js` carries a confirmed AZS → Sosúa fare of
  US$148.50, so it is a real origin the business serves.
- **All six heroes are now real photos of their place** (owner-supplied,
  2026-08-22): `sosuabeach.jpg`, `cabarete.jpg`, `puerto-plata.jpg`,
  `rio-san-juan.jpg`, `las-terrenas.jpg`, `cofresi.jpg`. Their `alt` text names
  the place because it is true. If a hub ever falls back to stock, keep the old
  rule: describe what is in frame, never where it is.
- **Check supplied photos for a horizontal flip before installing them.** The
  Cofresi original arrived mirrored — the Ocean World sign on the point read
  `blroW naecO`, and the coastline was reversed with it. Any frame containing
  legible signage is worth a glance at 4x before it goes in; a mirrored aerial
  of a real place is a factual error, not a stylistic one.
- **Styles are namespaced `.dest-*`** in the last block of
  `css/styles.css`, so a destination page cannot regress the other five.
- Distances and drive times are approximate road figures, flagged as such in
  the page copy and in the `sosua.air.note` string.

### JS modules
| Module | Responsibility |
|--------|---------------|
| `js/i18n.js` | `I18N` dictionary, `t()`/`getLang()`/`setLang()`, `applyStaticTranslations()` (resolves per-page `meta.<page>.title/description` from `data-page`) |
| `js/config.js` | `CONFIG.whatsappNumber` (**edit before go-live**), `AIRPORTS`, `PROVINCES`, `VEHICLES`, pricing constants, `haversineKm()`, `estimateRoute()` |
| `js/core.js` | `animatePrice()` (blur + count tween, concurrency-safe via `el._priceToken`), `formatDuration()`, `whatsappLink()`, `prefersReducedMotion` |
| `js/contact-choice.js` | `openContactChoice(buildRequest)` + `initContactChoice` — the shared `#contactChoiceDialog` behind every "Book Directly"/"Ask for a Quote" button: step 1 picks WhatsApp or email, step 2 collects name + email and posts via `submitBookingEmail()`. Takes a **builder function**, not finished strings, so the pending request is rebuilt on `sariel:langchange` while the dialog is open. Falls back to opening WhatsApp directly when the dialog or `<dialog>` support is missing |
| `js/cart.js` | Cart state (`cartItems`, versioned `localStorage`), `addToCart`/`removeFromCart`/`clearCart`/`cartTotal`/`describeCartItem`/`renderCart`/`openCart`/`closeCart`/`buildCartMessage`, `bookDirect` (delegates to `openContactChoice`), drawer wiring (`initCart`) |
| `js/shell.js` | `initHeader` (solid-on-scroll + mobile nav), `initReveals`, `initParallax`, `initCounters`, `initFaq`, `initWhatsAppLinks` (FAB/footer/direct-chat CTA + year) |
| `js/calculator.js` | `initCalculator` — quote logic, auto vehicle upgrade, route-ticket sync, "Add to Cart" wiring (transfers only) |
| `js/tours.js` | `initTours` — guest-count pricing per `.exc` panel + "Add to Cart" wiring; reads optional `.cruise-ship`/`.cruise-departure` inputs when present (cruise cards reuse the excursion `.exc` markup) |
| `js/service-picker.js` | `initServicePicker` — home-only `<dialog>`, session-scoped |

### Per-page script loading
All `<script>` tags are `defer`, loaded in this order (later modules depend
on earlier ones — see each module's header comment):

| Page | Scripts |
|------|---------|
| `index.html` | i18n → config → core → contact-choice → cart → shell → **service-picker** |
| `transfers.html` | i18n → config → core → contact-choice → cart → shell → **calculator** |
| `excursions.html` | i18n → config → core → contact-choice → cart → shell → **tours** |
| `cruises.html` | i18n → config → core → contact-choice → cart → shell → **tours** |
| `nosotros.html` | i18n → config → core → contact-choice → cart → shell |
| `sosua.html` | i18n → config → core → contact-choice → cart → shell |

`i18n`, `config`, `core`, `contact-choice`, `cart` and `shell` are identical on
every page — only the last script (the page's own feature module) changes.
`contact-choice` and its `#contactChoiceDialog` markup are on all 6 pages —
including `index.html`/`nosotros.html`, which have no booking buttons today —
so the dialog behaves identically wherever such a button is added later.

## Trilingual content (EN/ES/FR)
The site is fully trilingual via a client-side switcher — no separate URLs
per language (see "Known limitation" below), one dictionary file
(`js/i18n.js`) shared by all six HTML documents. `SUPPORTED_LANGS = ['en',
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
  excursions|cruises|nosotros|sosua">`. `applyStaticTranslations()` reads that
  attribute (falling back to `"home"` if absent) and resolves
  `meta.<page>.title` / `meta.<page>.description` for `document.title`,
  `<meta name="description">` and the `og:title`/`og:description` tags.
  Adding another page means adding a new `meta.<newpage>.title`/`.description`
  pair to **all three** of `en`, `es` and `fr`.
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

### Hero height and the cover crop
`.hero` backgrounds are `object-fit: cover`, so **the box's proportions decide
how much of the photo survives**: filling a tall, narrow box means discarding
width and enlarging what is left. A flat `100svh` made that box as tall as the
viewport, which on a phone kept roughly a quarter of a landscape photo's width
and upscaled it ~1.6x past native. `.hero` is therefore capped at
`min(100svh, 50rem)`, with a `max-width: 599.98px` step that lets the hero text
set the height instead (`min-height: 34rem` floor, reduced `.hero-content`
padding). On a 390px phone that roughly doubles how much of the frame is
visible and puts the smaller sources back inside their native resolution.

Two consequences worth knowing before editing this:
- **The phone override must stay below `.hero-content` in the file.** Same
  specificity, and a media query adds none, so source order is what makes it
  win.
- **Very wide sources still crop hard on phones.** `cabarete.jpg` is 1800x562
  (ratio 3.2); no box height fixes a panorama in a portrait viewport. The fix
  there is a taller crop of the same scene, not more CSS.

### Three languages, three sets of URLs

Until 2026-08-22 the site was multilingual only in the browser: one set of
English pages whose text `js/i18n.js` swapped after load. Visitors got three
languages; search engines got one, because there was a single URL per page and
the HTML served at it was always English. A crawler cannot index a language it
is never served.

Now every page exists three times:

| Language | URL | Source |
|---|---|---|
| English | `/transfers.html` | hand-written, the original |
| Spanish | `/es/transfers.html` | generated |
| French | `/fr/transfers.html` | generated |

**The English pages did not move.** Every existing link, share and ranking
still resolves.

`python tools/build-langs.py` renders `/es/` and `/fr/` from the English page
plus the matching dictionary in `js/i18n.js` — the same dictionary the runtime
uses, so no string is ever translated twice. Per page it sets `<html lang>`,
every `[data-i18n]` innerHTML and `[data-i18n-attr]` attribute, the title and
description (from `meta.<page>.title` / `.description`), the canonical, the
Open Graph URL/locale, the hreflang cluster, the language switcher, and the
`../` prefix that shared assets need one directory down.

**Invariant #1 covers attributes too**, as of 2026-08-22: `aria-label`,
`placeholder` and image `alt` are compared against the dictionary just like
element text. Only text was ever checked before, which is how the cart panel's
`aria-label` sat on *"Your cart"* while the dictionary said *"Your Requests"*.

**Invariant #5 — the translated pages are build output.** Editing anything in
`es/` or `fr/` is lost on the next run. Change the English page, or change the
dictionary, then re-run. Each generated file opens with a banner saying so.

#### Which JSON-LD follows the language and which does not

- **`WebPage` and `BreadcrumbList` describe *this URL*.** They get the
  translated `@id`, `url`, `name`, `description`, `inLanguage`, and breadcrumb
  labels read out of the visible trail — a Spanish page whose markup says
  "Inicio" must not hand Google a JSON-LD that says "Home".
- **`TravelAgency`, `TouristDestination`, `Service` and the tour `ItemList`s
  describe real-world things**, which do not change when the page language
  does. They keep one stable `@id` and identical content across all three, so
  the three versions resolve to *one* business and *one* Sosúa rather than
  three of each. This is invariant #3 extended: the node is now byte-identical
  on 33 pages, not 11.
- **`FAQPage` is regenerated per language** from that language's visible
  accordion, because invariant #2 applies to each page independently.

#### The language switcher is links now

`.lang-btn` used to be a `<button>` calling `setLang()`. It is an `<a>` with a
real `href`, so a crawler can follow it and a visitor can open it in a new tab.
`js/i18n.js` therefore takes the active language from `document.documentElement
.lang` — the served document is the authority, not `sessionStorage`, which is
gone. Staying inside a language needs no state at all: every internal link is
relative, so a link on `/es/index.html` lands on `/es/transfers.html`.

`setLang()` survives as the programmatic path. It is what dispatches
`sariel:langchange`, the contract `calculator.js`, `cart.js`, `tours.js`,
`shell.js` and `contact-choice.js` all listen on to re-render JS-built content.

#### Hero framing is per photo

`object-fit: cover` keeps a column of the frame whose width the hero's
proportions decide, and `center` is only the right column when the subject is
centred. `cabarete.jpg` is a 3.2:1 panorama whose kitesurfer sits at 29% from
the left; centred, a phone showed **open water and no rider at all** — the
visible window was x 725–1075 of 1800 and the subject is at 517.

`[data-page="cabarete"] .hero-bg img { object-position: 24% 50%; }` puts him
mid-frame on a phone and a third in from the left on a desktop. Only the
horizontal component matters here: the box is proportionally taller than the
image, so the scale is driven by height and nothing overflows vertically.

Add a line for any hero whose subject is off-centre, and only then — the other
five destination photos are composed around their middle and need nothing.
`las-terrenas.jpg` cannot be helped this way: its sign spans the full width, so
no narrow column shows the whole name. Reducing the hero height was the only
lever there, and it has been pulled.

#### Image alt text

Closed 2026-08-22. Every image that says something says it from the dictionary,
under an `alt.*` key: `data-i18n-attr="alt:alt.heroMain"` on the `<img>`, and
`data-i18n-attr="content:alt.heroMain"` on that page's `og:image:alt`. The
generator and the runtime both already understood `data-i18n-attr`, so no new
mechanism was needed.

**One key per image, not per tag.** The same photo appears on several pages and
is described once — 78 `<img>` tags across the site reduce to 41 strings. A
page's `og:image:alt` reuses the key of the image it points at, which also
removed two places where the social card and the on-page image had drifted into
describing the same photo differently.

**Decorative images keep `alt=""` and get no key.** The logo lockup in the
header (22 occurrences) and the CTA band (11) are presentational; a screen
reader should skip them, not read invented text. `tools/verify.py` enforces
both halves: every non-empty `alt` must carry a key, and every keyed attribute
must equal its dictionary value.

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
  `animatePrice()` in `js/core.js` follows the same rule when no `decimals`
  argument is passed, which is how the calculator shows fares with cents.
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

**Full-day driver (2026-11-02):** `#full-day-driver` on `transfers.html` is
quote-only. With no confirmed price it has no cart item shape; `#driverDayQuote`
is wired in `js/calculator.js` to `openContactChoice()`, so WhatsApp and email
requests report the usual conversion. Text lives under `driverDay.*`. Publish
"up to 15 guests" (16 seats counting the driver), and never advertise "24 hours":
the driver works up to 14 hours per shift.

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
9. A modal opens on the first click of a double-click, so the second click can
   land on its backdrop. `js/contact-choice.js` checks `event.detail < 2` before
   closing; apply the same check to any new backdrop-click handler.

## Google Ads conversion tracking (2026-11-01 UTC)
Every booking or contact request reports one Google Ads conversion. The ID lives
in `CONFIG.googleAdsConversion` (`AW-<id>/<label>`), action
"SG - Solicitud de reserva", category Contact, count One.

- **Tag:** no second script in `<head>`. `js/core.js` adds the Ads destination to
  the GA4 `gtag` each page already defines, guarded by `typeof gtag` so pages
  without the snippet keep working.
- **Reporting:** `trackBookingConversion()` is the only place that fires it. New
  WhatsApp buttons call `openWhatsApp(message)`, not `window.open`, or they go
  unmeasured. Email paths get it from `submitBookingEmail()`, only when Formspree
  accepts the request, so failed sends never count.
- **General WhatsApp links** (`#whatsappFab`, `#footerWhatsApp`, `#bookDirectCta`)
  open in a new tab, set in `initWhatsAppLinks` (`js/shell.js`), because leaving
  the page in the same tab can cancel the hit.
- **No personal data:** the event carries only `send_to`. Enhanced conversions
  stay off, and `allow_ad_personalization_signals: false` keeps these visitors
  out of remarketing lists in an Ads account shared with Agendaterd.
- **Agendaterd's property `G-YWXJ54LH6S` stays blocked.** Never install that tag.
  The account's `AW-` Google tag also reports to it, so registering the AW
  destination alone sends this site's visits there. `js/consent.js` sets
  `window['ga-disable-G-YWXJ54LH6S'] = true` before anything loads, and
  `tools/verify.py` fails if that line goes. This site's GA4 is `G-P5B6J8Y75V`.
- **Not measured:** the `mailto:` footer links and the plain `wa.me` link on
  `404.html`, which loads no scripts.

## Cookie consent and the privacy page (2026-11-01 UTC)
`js/consent.js` runs Google Consent Mode. It is the one script that loads
**blocking, in `<head>`, above the gtag snippet**, because Google reads consent
in queue order. `tools/verify.py` section 12 enforces the order on every page.

- **Defaults:** denied in `CONSENT_REQUIRED_REGIONS` (EEA, UK, Switzerland,
  Quebec), granted elsewhere. Google resolves the region from the visitor's
  location, so this cannot be tested without a connection from one of them.
- **Choice:** stored in `localStorage['sg-cookie-consent']` and re-applied in
  `<head>` on every page. Rejecting also deletes existing `_ga*` and `_gcl*`.
- **Ad personalization** is always denied, whatever the visitor answers.
- **Rejected or unanswered in a required region:** no cookies, but gtag still
  sends cookieless pings (`gcs=G100`). `privacy.html` says so.
- **Markup:** `#consentBanner` before the scripts on every page, plus a
  `[data-cookie-settings]` button in `.footer-policy`. Any button with that
  attribute reopens the banner. Accept and Reject share one style on purpose.
- **WhatsApp button:** `--consent-offset` lifts it above the banner.

`privacy.html` is a normal page in `PAGES` (`tools/build-langs.py`), text under
`privacy.*`. **It describes what the code does:** a new cookie, provider or
collected field must be added there in the same change.
