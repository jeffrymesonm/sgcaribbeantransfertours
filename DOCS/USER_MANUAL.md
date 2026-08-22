# USER_MANUAL — SG Caribbean Transfers & Tours site

> Last updated: 2026-08-12 UTC (sosua.html destination page added — SEO / AI-answer page)
> Audience: the business owner / content editor. No coding experience assumed
> beyond opening a file in a text editor.

## What the site does
The site is now **six pages**: a home page (`index.html`), one page per
service — `transfers.html`, `excursions.html`, `cruises.html` — a
"Meet the team" page (`nosotros.html`), and a Sosúa destination page
(`sosua.html`, see "The Sosúa page" below). Visitors land
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
  page. Clicking it opens the drawer with each item and its price. **Every
  item carries its own trip details** (reworked 2026-07-23): each airport
  transfer has its own **passengers** (± stepper), **flight number**,
  **flight/pickup date** and **suitcase count**; each excursion has its own
  **guests** (± stepper) and **excursion date**. So two transfers on
  different days, with different flights, are filled in independently right
  on their own cart rows — nothing is shared across items or hidden behind
  the send step.
- Changing the quantity updates the price instantly and correctly: an
  excursion steps through its real guest-count prices (4/5/6), a transfer
  steps its passenger count — flat for up to 6 people, then a small
  per-extra-passenger charge above that, the same rule the price calculator
  uses. Each transfer's suitcase count adds a flat **US$15** fee to **that
  transfer** when it's more than 10 bags (each vehicle needs its own
  trailer), shown right in that item's price. To change the free limit or fee
  amount, edit `LUGGAGE_FREE_LIMIT` / `LUGGAGE_EXTRA_FEE_USD` in
  `js/config.js`.
- Below the items, the cart **asks how they want to send it** — "WhatsApp" or
  "Email". Only after picking one does the last step appear: **full name**
  (required), an **email address** (only for the Email choice — WhatsApp
  skips it), and one send button labeled for that channel ("Send via
  WhatsApp" / "Send via Email"; a "← Change method" link goes back). Both
  channels send the exact same message, which lists every item with its own
  passengers/guests, flight, dates and suitcases.
- Sending via WhatsApp opens `wa.me` in a new tab with one message listing
  the name and every item with its own details (passengers/guests, flight,
  dates, suitcases), then empties the cart. Sending via Email asks for the
  visitor's email address (required — that's how you reply to them) and
  submits the same message straight to your inbox through Formspree, without
  the visitor needing their own mail app open; the cart panel shows
  "Sending…" then a success/error message in place, and only empties the cart
  on success (on error it stays intact so they can retry or use WhatsApp
  instead). Either way, you reply to confirm availability and take payment
  details however you normally do (cash on arrival, per the site's copy).
- The email checkout posts to `CONFIG.formspreeEndpoint` in `js/config.js`
  (`https://formspree.io/f/xbdnzrez`) — manage which inbox receives these from
  your Formspree dashboard (formspree.io), not from this file.
- The **"Email Us"** button (in the booking section near the bottom of every
  page, next to "Chat on WhatsApp") opens a short pop-up form — name, email,
  what service they're interested in, and a free-text reason — instead of
  opening the visitor's own mail app (updated 2026-07-23). It posts to the
  same Formspree endpoint as the cart, with the same "Sending…"/success/error
  feedback in place. The 5 footers' plain `mailto:` links still open a normal
  email to the company address.
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
   is `sg.caribbeantransferstours@gmail.com`.
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
   use `https://caribbeansgtransferstours.com/` (set 2026-07-20).
6. **Reviews** — replace the four sample testimonials (on the home page)
   with real guest quotes.

## Changing prices
> **Puerto Plata City Tour, 2026-08-21:** su precio pasó de 100/125/150 a
> **260/325/390 (US$65 por persona)**, confirmado por ti. Vive en tres sitios y
> los tres ya están al día: el `data-prices` de `#exc4` en `excursions.html`,
> el de `#cruise2` en `cruises.html` (es el mismo tour para cruceristas) y la
> fila de `llms.txt`. Si vuelve a cambiar, los tres juntos.

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
  2026-07-20. As of 2026-08-21 a static table is back, for the reason in the
  next bullet.
- **⚠️ Transfers — the new price table on the page (`#fares`, added
  2026-08-21):** below the calculator, `transfers.html` now shows **"Every
  fixed fare from Puerto Plata Airport"** — two plain tables listing all 25
  POP fares and the 5 fares from the other airports. This is a **third place
  the same numbers appear**, and it is on purpose: Google and the AI
  assistants (ChatGPT, Gemini, Perplexity) never click your calculator, so
  before this table existed they could not see — and could not quote — any
  of those 25 prices. It is a copy for machines to read, not a second price
  list you manage separately.

  **So when you change a fare, change it in three places, always together:**
  1. `js/config.js` (the real number that gets charged),
  2. the matching row in the `#fares` tables in `transfers.html`,
  3. the same row in `llms.txt` at the root of the project.

  If they disagree, the site charges one price and an AI assistant quotes
  another to your customer.
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

## Tu ficha de Google (conectada 2026-08-12)
El botón **"Lee nuestras reseñas en Google"** ya aparece bajo las reseñas de la
home y de las páginas de Transfers, Excursions y Cruises. Sale de
`js/config.js`, donde ahora hay **tres enlaces distintos de la misma ficha —
no los intercambies**:

- `googleReviewsUrl` → adonde lleva el botón "Lee nuestras reseñas". Es la
  **ficha**, para que se puedan leer sin iniciar sesión.
- `googleWriteReviewUrl` → el enlace para **escribir** reseña. Este es el que
  debes mandar por WhatsApp a un cliente satisfecho. Si lo pusieras en el botón
  de "leer", el visitante caería en una pantalla de login de Google.
- `googlePlaceId` → identifica el negocio ante Google. Aparece también dentro
  de los datos estructurados de las 6 páginas.

`googleReviewCount` está **vacío a propósito**: el botón dice "Lee nuestras
reseñas en Google" sin número, que siempre es cierto. Si quieres que diga
"Lee las 47 reseñas", mira el número real en tu ficha y escríbelo ahí — pero
tiene que coincidir, porque el visitante lo comprueba de un clic.

**Los testimonios del sitio siguen siendo de ejemplo.** Ahora que la ficha está
conectada, cambiarlos por reseñas reales de tus clientes es la mejora de
credibilidad más barata que te queda. No hemos marcado las reseñas en los datos
estructurados justamente porque son inventadas: hacerlo con reseñas falsas es
spam ante Google y puede costar una penalización manual.

## Dos reglas nuevas al editar textos
1. **Si cambias una frase en `js/i18n.js`, cámbiala también en el HTML.** La
   página muestra siempre lo que dice `js/i18n.js`, pero Google lee el texto
   que está escrito dentro del archivo `.html`. Si los dos no dicen lo mismo,
   Google indexa una frase que ningún cliente llega a ver. (Había 4 casos así;
   ya están arreglados.)
2. **Las preguntas frecuentes están escritas dos veces**: la lista visible y una
   copia invisible arriba del archivo que es la que lee Google. Si editas una
   pregunta o una respuesta, edita las dos para que digan exactamente lo mismo.

## Las páginas de destino (6 en total) — completadas 2026-08-21

Ahora hay una página por destino, todas con la misma estructura:

| Página | Destino | Tarifa publicada desde POP |
|---|---|---|
| `sosua.html` | Sosúa | US$23.95 |
| `cabarete.html` | Cabarete | US$33.95 |
| `puerto-plata.html` | Puerto Plata y Playa Dorada | US$38.95 |
| `cofresi.html` | Cofresí y Costambar (Ocean World) | US$48.50 |
| `rio-san-juan.html` | Río San Juan y Playa Grande | US$98.50 |
| `las-terrenas.html` | Las Terrenas y Samaná | US$178.50 |

Todas están enlazadas desde la nueva columna **Destinations** del pie de página,
en las 11 páginas del sitio.

**Dos cosas que necesito de ti para sacarles todo el partido:**

1. ~~Tarifas desde Santiago, Santo Domingo y Punta Cana~~ **✅ Puestas el
   2026-08-22.** Me dijiste que usara las mismas que ya cobras a Sosúa, así que
   ahora se publican **US$98.50 desde Santiago, US$219 desde Santo Domingo y
   US$425 desde Punta Cana** a Cabarete, Puerto Plata, Cofresí, Río San Juan y
   Las Terrenas. De 18 casillas vacías quedaron **12 con precio**.

   **Las 6 que siguen en "On request", y por qué:**

   - **Santiago → Río San Juan** y **Santiago → Las Terrenas.** Aquí paramos a
     propósito. Santiago está **más lejos** de esos dos sitios que Puerto Plata,
     así que ponerles el precio de Sosúa habría publicado un viaje más largo por
     menos dinero que el de Puerto Plata, en la misma tabla y a dos líneas de
     distancia. Tu propio precio de Cabarete ($98.95 frente a $98.50 de Sosúa)
     dice que sí subes por distancia desde Santiago.
   - **Las cuatro de Samaná (AZS)**, en Cabarete, Puerto Plata, Cofresí y Río
     San Juan.

   **Me confirmaste el 2026-08-22 que esas seis se quedan en "On request".** No
   son un hueco pendiente: son la respuesta. El cliente que las pida recibe un
   precio por WhatsApp el mismo día, y la página se lo dice claramente. Si algún
   día quieres publicarlas, solo tienes que pasarme el número.

   Los precios entraron en los cuatro sitios a la vez: la calculadora, la tabla
   grande de `transfers.html`, la tabla de cada destino y el `llms.txt` que leen
   ChatGPT y compañía. No hay que tocarlos por separado.
2. ~~Fotos reales~~ **✅ Hecho el 2026-08-22.** Los seis destinos tienen ya su
   foto de verdad: Sosúa, Puerto Plata (el Cristo del Pico Isabel de Torres),
   Cabarete (los kitesurfistas), Río San Juan (la cala), Las Terrenas (el
   letrero) y Cofresí (la aérea de Ocean World con la bahía y el pico detrás).
   Las renombré sin espacios y las pasé a JPEG para que las tarjetas de WhatsApp
   y Facebook no fallen.

   **La de Cofresí venía espejada**: el rótulo del parque se leía al revés
   (`blroW naecO`) y la costa estaba invertida con él. La volteé antes de
   ponerla, así que el letrero ahora se lee bien. Si alguna vez me mandas una
   aérea con letreros, échale un ojo a eso — pasa fácil al exportar.

   **Y bajé la altura del hero** (2026-08-22), que era lo que hacía que en el
   móvil se comieran media foto: la caja era tan alta como la pantalla, y la
   foto se ampliaba hasta llenarla dejando solo una franja del centro. Ahora en
   el teléfono se ve **casi el doble de la foto** y sin ampliarla, y en
   escritorio la caja también es algo más baja, así que se ve más nítida.

   Queda una sola pega de encuadre: la de **Cabarete es muy panorámica**
   (mucho más ancha que alta), así que en móvil sigue viéndose una franja. Ha
   mejorado, pero si tienes una versión más vertical de esa misma escena, con
   el cielo lleno de cometas, esa página gana bastante.

## El sitio ahora está de verdad en tres idiomas — 2026-08-22

Antes el sitio **parecía** trilingüe pero no lo era del todo. Existía una sola
página por sección, en inglés, y al pulsar ES o FR el navegador cambiaba los
textos al vuelo. Para el visitante funcionaba. Para Google no: solo había **una
dirección** por página y lo que se servía en ella era siempre inglés, así que
**el español y el francés no se podían posicionar**. Alguien buscando en español
"transfer aeropuerto Puerto Plata a Sosúa" no tenía nada tuyo que encontrar.

Ahora cada página existe **tres veces, en tres direcciones**:

| Idioma | Dirección |
|---|---|
| Inglés | `caribbeansgtransferstours.com/transfers.html` |
| Español | `caribbeansgtransferstours.com/**es**/transfers.html` |
| Francés | `caribbeansgtransferstours.com/**fr**/transfers.html` |

Son **33 páginas** en total. Las inglesas **no cambiaron de dirección**, así que
ningún enlace que hayas compartido se rompe y no pierdes nada de lo que ya
tenías posicionado.

Cada versión le dice a Google que las otras dos existen y que son la misma
página en otro idioma (eso se llama `hreflang`). Así no compiten entre ellas ni
cuentan como contenido duplicado: Google le sirve la española a quien busca en
español y la francesa a quien busca en francés.

**El botón EN/ES/FR ahora es un enlace de verdad**, no un cambio en la misma
página. Si estás en la española y pulsas FR, vas a la francesa. Y mientras
navegas dentro de `/es/`, todo el sitio se queda en español solo.

### Lo único que tienes que saber para no romperlo

**Las carpetas `es/` y `fr/` se generan solas.** No las edites nunca: se
reescriben enteras cada vez que se corre el generador y cualquier cambio a mano
se pierde. Si hay que cambiar un texto, se cambia en la página inglesa o en el
diccionario `js/i18n.js`, y luego se vuelve a generar. Cada archivo generado
lleva un aviso arriba diciendo justo esto.

Las traducciones no se escribieron dos veces: salen del mismo diccionario que ya
usaba el sitio para el cambio de idioma, así que todo el español y el francés
que ya estaba escrito es lo que se publica.

**Los textos de las fotos también están traducidos** (2026-08-22). Son los que
lee un lector de pantalla, y los que lee Google cuando no puede ver la imagen —
cuentan para posicionar. Cada foto se describe **una sola vez** y esa
descripción se reutiliza en todas las páginas donde aparece, así que las 78
imágenes del sitio son 41 textos, no 78. La descripción que se usa al compartir
en WhatsApp o Facebook es ahora la misma que la de la foto en la página; antes
había dos fotos donde no coincidían.

Las imágenes decorativas —el logo de la cabecera y la banda de fondo del cierre—
**se quedan a propósito sin texto**: un lector de pantalla debe saltárselas, no
leer un relleno inventado.

**Una decisión que verás en Las Terrenas:** la página dice abiertamente que **no
se puede visitar en una escala de crucero en Puerto Plata**, y explica que si
una naviera te vende Samaná es porque el barco atraca en la bahía de Samaná, que
es otro puerto. Está puesto a propósito: es mejor perder una reserva imposible
que tener un cliente enfadado en el muelle.

## The Cabarete page (`cabarete.html`) — added 2026-08-21

Es la hermana de la página de Sosúa: misma estructura, mismas secciones, mismo
funcionamiento. Se hizo para que la gente que busca "how to get to Cabarete"
o "POP airport to Cabarete" encuentre tu sitio y no el de otro.

**Esta página no publica distancias ni duraciones de trayecto** (decisión tuya,
2026-08-21). Solo Cabarete–Sosúa estaba confirmada, así que en vez de dar
números calculados la página describe dónde está cada sitio ("justo al este de
Sosúa", "al oeste de Puerto Plata") y manda al visitante a WhatsApp si quiere
saber cuánto tarda. La tabla de aeropuertos tampoco tiene columnas de distancia
ni de duración. **No añadas un kilómetro ni un minuto ahí sin dármelo tú antes.**

**Dos cosas que aún me faltan de ti:**

1. **Tarifas de Samaná, Santo Domingo y Punta Cana a Cabarete.** No existen en
   `js/config.js`, así que la tabla dice **"On request"** en vez de inventar un
   precio. En cuanto me des los números, los pongo.
2. ~~Una foto de Cabarete~~ **✅ Hecha el 2026-08-22** — `img/cabarete.jpg`,
   los kitesurfistas. Lo único: es una foto muy apaisada, así que en el móvil se
   ve una franja del centro y se pierde parte del cielo con las cometas. Si
   aparece un encuadre más vertical de lo mismo, lo cambio en un minuto.

## The Sosúa page (`sosua.html`) — added 2026-08-12
This one is different from the other five: it exists to be **found**, and to
be **quoted** by Google and by AI assistants like ChatGPT when someone asks
"how do I get from Puerto Plata airport to Sosúa". Everything on it is
arranged so a machine can lift a clean, correct answer out of it.

It is reached from the **Services column of the footer on every page**
("Transfers to Sosúa"), not from the top menu — the top menu was already
full.

**The one rule for this page: never put a number on it you can't stand
behind.** Its whole value is that a search engine trusts it. Specifically:

- **Prices are written out as plain text on this page**, in the airport
  table, in the "in 30 seconds" box, in the FAQ, and inside the invisible
  data block at the top of the file. They are *not* pulled from
  `js/config.js` automatically. So **when you change a fare, you must change
  it on `transfers.html`, in `js/config.js`, AND on this page.** Search for
  the old number (e.g. `23.95`) in `sosua.html` and `js/i18n.js` and fix
  every hit.
- **The FAQ is written twice**: once as the visible accordion (in
  `js/i18n.js`, keys `sosua.faq.q1`–`q10` / `sosua.faq.a1`–`a10`) and once
  inside `sosua.html`'s invisible `FAQPage` block near the top of the file.
  Google reads the invisible copy. **If you edit a question or an answer,
  edit both copies so they match word for word** — if they disagree, Google
  may ignore the block entirely.
- **Distances and drive times are approximations** (9 km / ~10–15 min from
  POP, ~50 min from Taino Bay, ~60 min from Amber Cove — corrected by the
  operator on 2026-08-13). They are labelled as approximate on the page. If
  you know a figure is wrong, correct it — a wrong number here is worse than
  no page. `cruises.html` (`cruisesFaq.a4`) now quotes the same 50 / 60 min,
  so if you change one, change the other.
- **The cruise section quotes no price on purpose**, because the cruise
  cards on `cruises.html` still have placeholder prices. Once those are
  real, a price can be added here too.
- **All the text is translated** like every other page: keys starting with
  `sosua.` in `js/i18n.js`, in all three of `en`, `es` and `fr`.

If you ever want the same kind of page for **Cabarete** or **Puerto Plata**,
the recipe is in `DOCS/DEVELOPER_GUIDE.md` under "Destination pages" — copy
`sosua.html` and swap the place, the distances and the fares.

## Adding a new airport or province to the calculator
1. In `transfers.html`, add an `<option>` to the Pickup or Destination select
   (give it a `data-i18n="..."` key and a plain-text fallback).
2. In `js/config.js`, add a matching entry to `AIRPORTS` or `PROVINCES` with
   its coordinates.
3. In `js/i18n.js`, add the same key to **all three** of the `en`, `es` and
   `fr` dictionaries.

## Editing FAQ / texts
The site is trilingual (English, Spanish and French) via a switcher in the
top-right of the header, present on all six pages. **The site always opens
in English** for a new visit — a visitor's language choice is only kept
while they're actively browsing (moving between pages in the same tab); it
resets to English the next time they open the site. Every piece of text
lives in **`js/i18n.js`**, in three matching blocks — `en: { ... }`,
`es: { ... }` and `fr: { ... }` — as `'key': 'text'` pairs. Find the key you
want to change (the English text is usually recognizable) and edit its
value in **all three** blocks. Do not rename keys or remove the
`data-i18n="..."` attributes in any of the six HTML pages — those are what
connect each key to its spot on the page.

If you add a brand-new sentence that doesn't exist yet, add a matching entry
to **all three** of `en`, `es` and `fr` in `js/i18n.js`, or it will silently
fall back to English wherever the other language is missing it. Each page's
browser-tab title and meta description are also translated text — they live
under `meta.home.*`, `meta.transfers.*`, `meta.excursions.*`,
`meta.cruises.*`, `meta.nosotros.*` and `meta.sosua.*` in the same file.
