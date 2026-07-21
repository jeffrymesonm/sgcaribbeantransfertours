# Tres servicios (Transfers / Excursiones / Cruceros) + selector — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dividir la landing única de Sariel en home + `transfers.html` + `excursions.html` + `cruises.html`, recibir al visitante en la home con un popup selector de servicio, y repartir `js/main.js` en 8 módulos.

**Architecture:** Sitio estático (HTML/CSS/JS vanilla, sin build). Header/footer/carrito son shell compartido, duplicado como marcado real en cada HTML. El JS monolítico se reparte por responsabilidad; los datos y utilidades comunes cargan en todas las páginas, la lógica específica solo donde su marcado existe. El popup es un `<dialog>` nativo presente solo en la home.

**Tech Stack:** HTML5, CSS3, JavaScript ES2020 (vanilla, sin dependencias). Fuentes Google (Fraunces/Archivo/IBM Plex Mono). Imágenes Unsplash (placeholders). Conversión vía `wa.me`. QA con Playwright (MCP).

## Global Constraints

- **Sin build step, sin framework, sin dependencias npm.** No hay `package.json` ni runner de tests. La verificación es en **navegador real (Playwright)**, no unit tests — conforme a `CLAUDE.md` del usuario y a `memory/lessons.md`.
- **Bilingüe EN/ES.** Todo texto visible pasa por `js/i18n.js` (`data-i18n` / `data-i18n-attr` / `t()`). Idioma por defecto EN. Nunca texto hardcodeado en el marcado que deba traducirse.
- **Claves i18n aplicadas por `setAttribute`/`.title`/`.textContent` usan caracteres literales (`&`, no `&amp;`); reserva entidades HTML solo para valores que van por `innerHTML`.** (lessons.md 2026-07-14T17:55Z)
- **Overlays/paneles fijos:** cerrados deben ser `display:none` real o estar fuera del viewport (`translateX(100%)`), nunca `opacity:0`/`visibility:hidden` bajo un header fijo. (lessons.md 2026-07-14T17:20Z)
- **`prefers-reduced-motion`** respetado en toda animación nueva.
- **Storage keys con guion:** `sariel-lang`, `sariel-cart`, `sariel-service`, `sariel-service-picked`.
- **Todos los `<script>` con `defer`.** Orden de carga fijo (ver Task 2).
- **Paleta:** abyss `#06262E` / ocean `#0B5D6B` / lagoon `#17A398` / sand `#F3EDE2` / shell `#FCFAF5` / gold `#C2933E`. Firma visual boarding-pass. (decisions.md)
- **Placeholders de go-live intactos:** `CONFIG.whatsappNumber = '18095550000'`, dominio `sarieltransfers.com`, fotos Unsplash. No inventar valores reales.
- **QA:** forzar `fetch(url,{cache:'reload'})` antes de recargar; capturas por viewport sección a sección, nunca `fullPage`. (lessons.md 2026-07-14T17:20Z)

---

## Estructura de archivos

**Se crean:**
- `js/config.js` — `CONFIG`, `AIRPORTS`, `PROVINCES`, `VEHICLES`, constantes de precio, `haversineKm`, `estimateRoute`
- `js/core.js` — `prefersReducedMotion`, `animatePrice`, `formatDuration`, `whatsappLink`
- `js/cart.js` — estado del carrito, `describeCartItem`, render, checkout, `initCart`
- `js/shell.js` — `initHeader`, `initReveals`, `initParallax`, `initCounters`, `initFaq`, `initWhatsAppLinks`
- `js/calculator.js` — `initCalculator` (solo transfers)
- `js/tours.js` — `initTours` (excursiones y cruceros; antes `initExcursions`)
- `js/service-picker.js` — popup de la home
- `transfers.html`, `excursions.html`, `cruises.html`
- `sitemap.xml`, `robots.txt`
- `docs/superpowers/golden-prices.md` — línea base de verificación (Task 1)

**Se modifican:**
- `js/i18n.js` — meta por página; nuevas claves `meta.<page>.*`, `picker.*`, `cruise.*`, `nav.cruises`, textos de páginas nuevas
- `index.html` — se reduce a home (hero + selector + why + reviews + gallery + faq + book + footer + dialog); nuevos `<script>`; JSON-LD; `data-page="home"`
- `PROJECT_INFO.md`, `DOCS/*`, `tasks/todo.md`, `memory/*`

**Se elimina:**
- `js/main.js` (su contenido se reparte)

---

## Task 1: Línea base de precios dorados (red de seguridad del refactor)

El refactor de JS no puede cambiar ningún precio. Como no hay tests, capturamos los valores actuales **antes** de tocar nada y los comparamos después.

**Files:**
- Create: `docs/superpowers/golden-prices.md`

- [ ] **Step 1: Servir el sitio actual**

Run: `cd "c:/Users/jeffry/Desktop/sariel taxi" && python -m http.server 8734`
Dejar corriendo en segundo plano.

- [ ] **Step 2: Capturar precios de calculadora y excursiones con Playwright**

Navegar a `http://localhost:8734/`. En la consola del navegador (`browser_evaluate`), ejecutar y guardar la salida.

**Importante:** capturar desde las **funciones puras de precio** (`estimateRoute` + surcharge de cada vehículo), NO desde `bpAmount.textContent` — ese elemento se actualiza vía `animatePrice`, un tween asíncrono (rAF), así que leerlo tras disparar el evento devuelve el valor rancio. Las funciones puras son deterministas y síncronas, y son exactamente lo que Task 2 debe preservar al mover el cálculo a `config.js`.

```js
() => {
  // TODAS las rutas (pickup × dest) vía la función pura, + cada vehículo.
  const rows = [];
  const pickups = Object.keys(AIRPORTS);
  const dests = Object.keys(PROVINCES);
  for (const p of pickups) for (const d of dests) {
    const r = estimateRoute(AIRPORTS[p], PROVINCES[d]);
    const perVeh = VEHICLES.map((v) => `${v.id}:${r.price + v.surcharge}`).join(',');
    rows.push(`${p}|${d} => base=${r.price} min=${r.minutes} [${perVeh}]`);
  }
  // Excursiones: el data-prices crudo de cada panel.
  const exc = [];
  document.querySelectorAll('.exc').forEach((panel, i) => {
    exc.push(`exc${i}: ${panel.dataset.prices}`);
  });
  return rows.join('\n') + '\n---\n' + exc.join('\n');
}
```

- [ ] **Step 3: Guardar la salida literal en el doc**

Escribir la salida exacta en `docs/superpowers/golden-prices.md` bajo un encabezado con fecha. Este archivo es la referencia contra la que Task 2 verifica.

- [ ] **Step 4: Commit** (si el repo existe; si no, omitir todos los `git` del plan)

```bash
git add docs/superpowers/golden-prices.md
git commit -m "test: capturar precios dorados antes del refactor de JS"
```

---

## Task 2: Repartir `js/main.js` en módulos (sin cambio de comportamiento)

Mover código tal cual a archivos nuevos. **Sin cambios de lógica** salvo los explícitos de Task 3. La home debe seguir idéntica.

**Files:**
- Create: `js/config.js`, `js/core.js`, `js/cart.js`, `js/shell.js`, `js/calculator.js`, `js/tours.js`
- Modify: `index.html` (líneas 761-762: los `<script>`)
- Delete: `js/main.js`

**Interfaces:**
- Produces (globales, sin módulos ES — cargados por orden con `defer`):
  - `config.js` → `CONFIG`, `AIRPORTS`, `PROVINCES`, `VEHICLES`, `PRICE_BASE_USD`, `PRICE_PER_KM_USD`, `ROAD_WINDING_FACTOR`, `AVG_ROAD_SPEED_KMH`, `haversineKm(lat1,lng1,lat2,lng2)`, `estimateRoute(airport,province)→{price,minutes}`
  - `core.js` → `prefersReducedMotion`, `animatePrice(el,target,decimals=0)`, `formatDuration(minutes)→string`, `whatsappLink(message)→string`
  - `cart.js` → `addToCart(item)`, `openCart()`, `closeCart()`, `describeCartItem(item)→{title,meta,price}` (consumido por sí mismo; los productores de items son calculator.js/tours.js)
- Consumes: `i18n.js` provee `t()`, `getLang()`, evento `sariel:langchange`. Debe cargar antes que todo lo que llame a `t()`.

- [ ] **Step 1: Crear `js/config.js`**

Cabecera de propósito + mover **literalmente** desde `js/main.js`: `'use strict';`, el bloque `CONFIG` (líneas 14-19), `AIRPORTS` (24-37), `PROVINCES` (38-74), `VEHICLES` (75-84), las 4 constantes de precio (85-88), `haversineKm` (95-103) y `estimateRoute` (112-117). Copia exacta, sin editar valores.

- [ ] **Step 2: Crear `js/core.js`**

Cabecera + mover: `prefersReducedMotion` (línea 119), `animatePrice` (133-163), `formatDuration` (171-176), `whatsappLink` (183-185). `whatsappLink` usa `CONFIG` (de config.js, carga antes).

- [ ] **Step 3: Crear `js/cart.js`**

Cabecera + mover: `CART_STORAGE_KEY` (195), el bloque `cartItems`/try-catch (206-211), `saveCart` (214-216), `addToCart` (224-229), `removeFromCart` (236-240), `clearCart` (243-247), `describeCartItem` (256-276), `cartTotal` (279-281), `renderCart` (284-314), `openCart` (317-325), `closeCart` (328-336), `buildCartMessage` (343-352) y el IIFE `initCart` (715-756).
**Nota:** `EXCURSION_TITLE_KEYS` y su uso en `describeCartItem` se tocan en Task 3, no aquí. Aquí se copia tal cual.

- [ ] **Step 4: Crear `js/shell.js`**

Cabecera + mover los IIFE: `initHeader` (357-392), `initReveals` (397-433), `initParallax` (438-471), `initCounters` (638-683), `initFaq` (688-710), `initWhatsAppLinks` (761-793).

- [ ] **Step 5: Crear `js/calculator.js`**

Cabecera + mover el IIFE `initCalculator` (476-587) tal cual.

- [ ] **Step 6: Crear `js/tours.js`**

Cabecera + mover el IIFE `initExcursions` (592-633). Renombrar el IIFE a `initTours` (mismo cuerpo; selecciona `.exc`, que también usarán las tarjetas de crucero). Sin otros cambios aquí.

- [ ] **Step 7: Actualizar los `<script>` de `index.html`**

Reemplazar las líneas 761-762 (`i18n.js` + `main.js`) por, en este orden exacto:

```html
  <script src="js/i18n.js" defer></script>
  <script src="js/config.js" defer></script>
  <script src="js/core.js" defer></script>
  <script src="js/cart.js" defer></script>
  <script src="js/shell.js" defer></script>
  <script src="js/calculator.js" defer></script>
  <script src="js/tours.js" defer></script>
```

(La home aún contiene calculadora y excursiones en este punto; se recortan en Task 9. `service-picker.js` se añade en Task 10.)

- [ ] **Step 8: Borrar `js/main.js`**

```bash
rm "js/main.js"
```

- [ ] **Step 9: Verificar en navegador — consola limpia y precios idénticos**

Servir en `:8734`. Navegar a `http://localhost:8734/` forzando `fetch('js/config.js',{cache:'reload'})` etc. antes de recargar. Con `browser_console_messages`: **0 errores, 0 warnings**. Re-ejecutar el **mismo script de funciones puras** de Task 1 Step 2 vía `browser_evaluate` y **diff contra `golden-prices.md`**: debe ser idéntico (los globales `AIRPORTS`/`PROVINCES`/`VEHICLES`/`estimateRoute` ahora viven en `config.js` pero siguen siendo globales, así que el script funciona igual). Probar además la UI: cambiar pickup/dest/pax/vehículo → boarding pass actualiza, añadir un transfer y una excursión al carrito → checkout abre `wa.me` con mensaje.
Expected: precios iguales al dorado, consola limpia, carrito funcional.

- [ ] **Step 10: Commit**

```bash
git add js/ index.html
git commit -m "refactor: repartir main.js en config/core/cart/shell/calculator/tours"
```

---

## Task 3: Migración del carrito — `titleKey` en el item, sin `EXCURSION_TITLE_KEYS`

Que el item del carrito guarde su propia clave i18n, para que cruceros funcione sin ampliar ningún mapa. Versionar el carrito y descartar formas viejas.

**Files:**
- Modify: `js/cart.js`, `index.html` (los 5 botones `.exc-add`)

**Interfaces:**
- Produces: item de excursión/crucero ahora `{kind:'excursion', titleKey, serviceKey, guests, price}`. `addToCart` sin cambios de firma. `describeCartItem` resuelve `t(item.titleKey)`.
- Consumes: `tours.js` (Task 6 lo actualiza para leer `data-title-key`).

- [ ] **Step 1: Versionar el storage del carrito en `js/cart.js`**

Reemplazar el bloque de carga (actual líneas ~206-211) por versión + validación de forma:

```js
const CART_VERSION = 2; // v2: items de excursión guardan titleKey (no slug→mapa)
let cartItems = [];
try {
  const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
  // Formato nuevo: { v, items }. Cualquier otra forma (o versión previa) se descarta.
  if (raw && raw.v === CART_VERSION && Array.isArray(raw.items)) {
    cartItems = raw.items;
  }
} catch {
  cartItems = [];
}
```

- [ ] **Step 2: Actualizar `saveCart` para escribir el sobre versionado**

```js
/** Persiste el carrito con su versión de esquema. */
function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: CART_VERSION, items: cartItems }));
}
```

- [ ] **Step 3: Eliminar `EXCURSION_TITLE_KEYS` y usar `item.titleKey`**

Borrar el bloque `EXCURSION_TITLE_KEYS` (líneas 197-204). En `describeCartItem`, en la rama `excursion`, cambiar:

```js
  if (item.kind === 'excursion') {
    return {
      title: t(item.titleKey || item.serviceKey),
      meta: t(`exc.guest${item.guests}`),
      price: item.price,
    };
  }
```

- [ ] **Step 4: Añadir `data-title-key` a los 5 botones `.exc-add` de `index.html`**

Añadir el atributo junto al `data-service-key` ya presente (líneas 448, 476, 504, 532, 560):

| Línea | `data-service-key` | añadir `data-title-key` |
|---|---|---|
| 448 | `paradise-island` | `exc1.title` |
| 476 | `charcos-27` | `exc2.title` |
| 504 | `whale-watching` | `exc3.title` |
| 532 | `city-tour` | `exc4.title` |
| 560 | `beach-experience` | `exc5.title` |

Ejemplo (línea 448):
```html
<button type="button" class="btn btn-primary exc-add" data-service-key="paradise-island" data-title-key="exc1.title" data-i18n="cart.add">Add to Cart</button>
```

(`tours.js` empezará a leer `data-title-key` en Task 6. Hasta entonces el item se guarda sin `titleKey` pero `describeCartItem` cae en `serviceKey`, que sigue existiendo — sin regresión intermedia.)

- [ ] **Step 5: Verificar migración y render**

Servir, `cache:'reload'`. Sembrar en consola un carrito viejo y comprobar descarte:
```js
localStorage.setItem('sariel-cart', JSON.stringify([{id:'x',kind:'excursion',serviceKey:'city-tour',guests:3,price:150}]));
```
Recargar: el badge debe quedar en 0 (forma vieja descartada), consola limpia. Luego añadir una excursión desde la UI → aparece con su nombre traducido; cambiar idioma → el nombre se re-traduce; refrescar → persiste con el nuevo sobre `{v:2,items:[...]}` (verificar en Application → Local Storage).
Expected: viejo descartado, nuevo persiste y re-traduce.

- [ ] **Step 6: Commit**

```bash
git add js/cart.js index.html
git commit -m "refactor: item de carrito guarda titleKey; versionar y migrar sariel-cart"
```

---

## Task 4: `js/i18n.js` — meta por página

Resolver título y descripción por `data-page`, y añadir las claves nuevas de las 4 páginas.

**Files:**
- Modify: `js/i18n.js` (bloque `en` y bloque `es`; función `applyStaticTranslations`)
- Modify: `index.html` (`<body>` línea 69 → `data-page="home"`)

**Interfaces:**
- Produces: `applyStaticTranslations()` lee `document.body.dataset.page` (default `'home'`) y aplica `meta.<page>.title` / `meta.<page>.description`.
- Consumes: cada HTML declara `<body data-page="...">`.

- [ ] **Step 1: Renombrar las meta globales a `meta.home.*` y añadir las de servicio (EN)**

En el diccionario `en` (líneas 14-15), reemplazar `'meta.title'`/`'meta.description'` por:

```js
    'meta.home.title': 'Sariel — Private Transfers & Excursions in the Dominican Republic',
    'meta.home.description': 'Private airport transfers, transportation and excursions in Puerto Plata, Cabarete, Sosúa and the Dominican Republic north coast. Safe, comfortable, always on time. Book your transfer today.',
    'meta.transfers.title': 'Private Airport Transfers — Sariel | Dominican Republic',
    'meta.transfers.description': 'Private, door-to-door airport transfers across the Dominican Republic. Fixed prices, meet & greet, always on time. Get your instant fare and book on WhatsApp.',
    'meta.excursions.title': 'Private Excursions & Day Tours — Sariel | North Coast DR',
    'meta.excursions.description': 'Private excursions on the DR north coast: Paradise Island, 27 Charcos, whale watching, city tours and beaches. Your group, your pace, round-trip transport included.',
    'meta.cruises.title': 'Cruise Shore Excursions — Sariel | Amber Cove & Taino Bay',
    'meta.cruises.description': 'Private shore excursions for cruise passengers at Amber Cove and Taino Bay, Puerto Plata. Guaranteed return before departure. Reserve your tour on WhatsApp.',
```

- [ ] **Step 2: Igual en el diccionario `es`**

En el diccionario `es` (líneas 297-298):

```js
    'meta.home.title': 'Sariel — Transfers Privados y Excursiones en República Dominicana',
    'meta.home.description': 'Transfers aeroportuarios privados, transporte y excursiones en Puerto Plata, Cabarete, Sosúa y la costa norte de República Dominicana. Seguro, cómodo y siempre puntual. Reserva tu transfer hoy.',
    'meta.transfers.title': 'Transfers Privados de Aeropuerto — Sariel | República Dominicana',
    'meta.transfers.description': 'Transfers privados puerta a puerta en toda República Dominicana. Precios fijos, recepción en el aeropuerto y siempre puntuales. Calcula tu tarifa y reserva por WhatsApp.',
    'meta.excursions.title': 'Excursiones Privadas y Tours de Día — Sariel | Costa Norte RD',
    'meta.excursions.description': 'Excursiones privadas en la costa norte: Isla Paraíso, 27 Charcos, avistamiento de ballenas, city tours y playas. Tu grupo, tu ritmo, transporte de ida y vuelta incluido.',
    'meta.cruises.title': 'Excursiones para Cruceros — Sariel | Amber Cove y Taino Bay',
    'meta.cruises.description': 'Excursiones privadas para pasajeros de crucero en Amber Cove y Taino Bay, Puerto Plata. Regreso garantizado antes del zarpe. Reserva tu tour por WhatsApp.',
```

- [ ] **Step 3: Resolver meta por página en `applyStaticTranslations`**

En `applyStaticTranslations` (líneas 604-633), sustituir la línea 606 y el bloque 621-626 por resolución basada en `data-page`:

```js
  document.documentElement.lang = currentLang;
  const page = document.body.dataset.page || 'home';
  const titleKey = `meta.${page}.title`;
  const descKey = `meta.${page}.description`;
  document.title = t(titleKey);
```

y el bloque de metas:

```js
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', t(descKey));
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', t(titleKey));
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', t(descKey));
```

- [ ] **Step 4: `data-page="home"` en `index.html`**

Línea 69: `<body>` → `<body data-page="home">`.

- [ ] **Step 5: Verificar título y descripción de la home**

Servir, `cache:'reload'`. En la home: `document.title` = "Sariel — Private Transfers…"; cambiar a ES → título cambia a la versión ES; `meta[name=description]` coherente. Consola limpia.
Expected: título/desc correctos en ambos idiomas.

- [ ] **Step 6: Commit**

```bash
git add js/i18n.js index.html
git commit -m "feat(i18n): meta title/description por página vía data-page"
```

---

## Task 5: `transfers.html`

Página dedicada de transfers: hero propio + sección flota/servicios + calculadora + FAQ de transfers + franja de confianza + CTA + footer.

**Files:**
- Create: `transfers.html`
- Reference: `index.html` (copiar header 74-133, footer/FAB, secciones `#transfers` 180-295 y `#calculator` 296-415), `js/i18n.js` (claves existentes)

**Interfaces:**
- Consumes: shell scripts (i18n, config, core, cart, shell, calculator). Carga `calculator.js`; **no** `tours.js` ni `service-picker.js`.
- Produces: `<body data-page="transfers">`.

- [ ] **Step 1: Estructura base copiando el shell**

Crear `transfers.html` con: `<!doctype html>`, `<head>` clonado de `index.html` (líneas 1-68) pero **canonical** `https://sarieltransfers.com/transfers.html` y **JSON-LD** reemplazado (Step 4). `<body data-page="transfers">`. Copiar **verbatim** el header completo (74-133: brand, nav, lang-switch, cart-btn, mobile-nav, cart drawer). Copiar el footer + FAB + WhatsApp del final de `index.html`.

- [ ] **Step 2: Hero propio de transfers**

Insertar tras el header un `<section class="hero" id="top">` con imagen de banner (usar la de `index.html` o una Unsplash de carretera/van), `data-i18n` en título/subtítulo apuntando a nuevas claves `transfersHero.*` (añadir en Task 8-i18n abajo — ver Step 5). CTA hero → `#calculator`.

- [ ] **Step 3: Mover secciones de servicios y calculadora**

Copiar **verbatim** desde `index.html` la sección `#transfers` (líneas 180-295) y la sección `#calculator` (296-415), incluidos los `id` de los elementos del boarding pass (`bpFromCode`… `bpReserve`) — `calculator.js` depende de esos ids. Añadir tras la calculadora una **franja de confianza**: reutilizar 2 tarjetas de `#why` + 2 reseñas de `#reviews` (marcado clonado, `data-i18n` a claves ya existentes).

- [ ] **Step 4: JSON-LD `Service` + `BreadcrumbList`**

En `<head>`, sustituir los dos bloques `application/ld+json` de la home por:

```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Service","serviceType":"Airport transfer","provider":{"@type":"TravelAgency","name":"Sariel Transfers & Excursions","areaServed":"Dominican Republic"},"areaServed":"Dominican Republic","url":"https://sarieltransfers.com/transfers.html"}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://sarieltransfers.com/"},{"@type":"ListItem","position":2,"name":"Transfers","item":"https://sarieltransfers.com/transfers.html"}]}
</script>
```

- [ ] **Step 5: Añadir claves i18n del hero de transfers (EN y ES)**

En `js/i18n.js`, añadir a ambos diccionarios:

```js
// en
    'transfersHero.eyebrow': 'Airport & private transfers',
    'transfersHero.title': 'Your ride is <em>already waiting</em>',
    'transfersHero.lead': 'Private, door-to-door transfers anywhere in the Dominican Republic. Fixed price, no surprises. Calculate your fare below.',
    'transfersHero.cta': 'Calculate my fare',
// es
    'transfersHero.eyebrow': 'Transfers privados y de aeropuerto',
    'transfersHero.title': 'Tu transporte <em>ya te espera</em>',
    'transfersHero.lead': 'Transfers privados puerta a puerta en toda República Dominicana. Precio fijo, sin sorpresas. Calcula tu tarifa abajo.',
    'transfersHero.cta': 'Calcular mi tarifa',
```

- [ ] **Step 6: Cargar los `<script>` correctos**

Antes de `</body>`:

```html
  <script src="js/i18n.js" defer></script>
  <script src="js/config.js" defer></script>
  <script src="js/core.js" defer></script>
  <script src="js/cart.js" defer></script>
  <script src="js/shell.js" defer></script>
  <script src="js/calculator.js" defer></script>
```

- [ ] **Step 7: Verificar `transfers.html`**

Servir, `cache:'reload'` para todos los assets. Navegar a `http://localhost:8734/transfers.html`. Consola **0/0**. `document.title` = meta.transfers en EN, cambia en ES. Calculadora funciona; re-ejecutar el script de funciones puras de Task 1 Step 2 → diff contra `golden-prices.md` idéntico. Añadir transfer al carrito → aparece. Móvil 390: sin overflow horizontal. Sin `.exc` presentes → `tours.js` no cargado, sin errores.
Expected: página completa, calculadora intacta, consola limpia, EN/ES OK.

- [ ] **Step 8: Commit**

```bash
git add transfers.html js/i18n.js
git commit -m "feat: transfers.html con hero, calculadora, franja de confianza y JSON-LD"
```

---

## Task 6: `excursions.html` + `tours.js` lee `data-title-key`

Página dedicada de excursiones con las 5 tarjetas `.exc` actuales, y `tours.js` capturando `titleKey`.

**Files:**
- Create: `excursions.html`
- Modify: `js/tours.js` (leer `data-title-key`), `js/i18n.js` (hero de excursiones)
- Reference: `index.html` sección `#excursions` (416-566)

**Interfaces:**
- Consumes: `describeCartItem` (Task 3) espera `item.titleKey`.
- Produces: `initTours` añade `titleKey: addBtn.dataset.titleKey` al item.

- [ ] **Step 1: `tours.js` incluye `titleKey` al añadir al carrito**

En `js/tours.js`, en el handler de `addBtn` (el `addToCart` de excursión), añadir `titleKey`:

```js
        addToCart({
          kind: 'excursion',
          titleKey: addBtn.dataset.titleKey,
          serviceKey: addBtn.dataset.serviceKey,
          guests: parseInt(currentGuests, 10),
          price: prices[currentGuests],
        });
```

- [ ] **Step 2: Crear `excursions.html`**

`<body data-page="excursions">`. Header + footer + cart drawer verbatim (como Task 5 Step 1). Canonical `…/excursions.html`.

- [ ] **Step 3: Hero propio + mover las tarjetas**

Hero `#top` con claves `excursionsHero.*` (Step 6). Copiar **verbatim** la sección `#excursions` (416-566) con sus 5 `<article class="exc">` — incluidos los `data-title-key` añadidos en Task 3 Step 4. Añadir franja de confianza (2 why + 2 reviews) y CTA `#book` (o CTA directo WhatsApp con `id="bookDirectCta"` para que `initWhatsAppLinks` lo enlace).

- [ ] **Step 4: JSON-LD `ItemList` de `TouristTrip` + `BreadcrumbList`**

```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ItemList","itemListElement":[
{"@type":"ListItem","position":1,"item":{"@type":"TouristTrip","name":"Paradise Island","url":"https://sarieltransfers.com/excursions.html#exc1"}},
{"@type":"ListItem","position":2,"item":{"@type":"TouristTrip","name":"27 Charcos","url":"https://sarieltransfers.com/excursions.html#exc2"}},
{"@type":"ListItem","position":3,"item":{"@type":"TouristTrip","name":"Whale Watching","url":"https://sarieltransfers.com/excursions.html#exc3"}},
{"@type":"ListItem","position":4,"item":{"@type":"TouristTrip","name":"City Tour","url":"https://sarieltransfers.com/excursions.html#exc4"}},
{"@type":"ListItem","position":5,"item":{"@type":"TouristTrip","name":"Beach Experience","url":"https://sarieltransfers.com/excursions.html#exc5"}}]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://sarieltransfers.com/"},{"@type":"ListItem","position":2,"name":"Excursions","item":"https://sarieltransfers.com/excursions.html"}]}
</script>
```

- [ ] **Step 5: `<script>` correctos**

i18n, config, core, cart, shell, **tours** (no calculator, no service-picker).

- [ ] **Step 6: Claves i18n del hero de excursiones (EN y ES)**

```js
// en
    'excursionsHero.eyebrow': 'Signature private experiences',
    'excursionsHero.title': 'Days you\'ll <em>never forget</em>',
    'excursionsHero.lead': 'Every excursion is private: your group, your pace, your own guide. Round-trip transport always included.',
// es
    'excursionsHero.eyebrow': 'Experiencias privadas exclusivas',
    'excursionsHero.title': 'Días que <em>nunca olvidarás</em>',
    'excursionsHero.lead': 'Cada excursión es privada: tu grupo, tu ritmo, tu propio guía. Transporte de ida y vuelta siempre incluido.',
```

- [ ] **Step 7: Verificar `excursions.html`**

Servir, `cache:'reload'`. Consola 0/0. Selector de huéspedes cambia precio (diff vs `data-prices` dorado). Añadir excursión → carrito muestra **nombre traducido** (vía `titleKey`); cambiar idioma → se re-traduce; refrescar → persiste. **Prueba clave del reparto:** añadir excursión aquí, navegar a `transfers.html`, abrir carrito → item sigue con nombre y precio correctos. Móvil 390 sin overflow.
Expected: tarjetas OK, carrito con titleKey cross-página.

- [ ] **Step 8: Commit**

```bash
git add excursions.html js/tours.js js/i18n.js
git commit -m "feat: excursions.html; tours.js guarda titleKey en el item"
```

---

## Task 7: `cruises.html` — 3 tarjetas plantilla + captura barco/zarpe

Página de cruceros con promesa de regreso garantizado, 3 tarjetas plantilla y captura opcional de barco + hora de zarpe.

**Files:**
- Create: `cruises.html`
- Modify: `js/tours.js` (leer barco + hora si la tarjeta los tiene), `js/cart.js` (`describeCartItem` muestra barco/zarpe; `buildCartMessage` los incluye), `js/i18n.js` (claves `cruise.*`, `nav.cruises`, hero)

**Interfaces:**
- Consumes: `initTours` ya recorre `.exc`; las tarjetas de crucero usan la misma clase `.exc` + `data-prices`.
- Produces: item `{kind:'excursion', titleKey, serviceKey, guests, price, shipName?, departureTime?}`. Campos de crucero **opcionales**.

- [ ] **Step 1: `tours.js` captura barco + hora si existen en el panel**

En `initTours`, dentro del handler de `addBtn`, leer inputs opcionales del panel:

```js
      addBtn.addEventListener('click', () => {
        const shipEl = panel.querySelector('.cruise-ship');
        const timeEl = panel.querySelector('.cruise-departure');
        const extra = {};
        if (shipEl && shipEl.value.trim()) extra.shipName = shipEl.value.trim();
        if (timeEl && timeEl.value) extra.departureTime = timeEl.value;
        addToCart({
          kind: 'excursion',
          titleKey: addBtn.dataset.titleKey,
          serviceKey: addBtn.dataset.serviceKey,
          guests: parseInt(currentGuests, 10),
          price: prices[currentGuests],
          ...extra,
        });
        openCart();
      });
```

- [ ] **Step 2: `describeCartItem` añade barco/zarpe al meta**

En `js/cart.js`, rama `excursion`, componer el meta con los datos de crucero si están:

```js
  if (item.kind === 'excursion') {
    let meta = t(`exc.guest${item.guests}`);
    if (item.shipName) meta += ` · ${item.shipName}`;
    if (item.departureTime) meta += ` · ${t('cruise.departsAt')} ${item.departureTime}`;
    return {
      title: t(item.titleKey || item.serviceKey),
      meta,
      price: item.price,
    };
  }
```

(El `describeCartItem` resultante ya alimenta `buildCartMessage`, así que el mensaje de WhatsApp incluye barco/zarpe sin más cambios.)

- [ ] **Step 3: Crear `cruises.html`**

`<body data-page="cruises">`. Header + footer + cart drawer verbatim. Canonical `…/cruises.html`. Hero `#top` con claves `cruisesHero.*`. Tras el hero, un bloque **promesa de regreso garantizado** (`cruise.guarantee*`) como banda destacada.

- [ ] **Step 4: 3 tarjetas plantilla**

Tres `<article class="exc" data-prices='{"2":0,"3":0,"4":0,"5":0}'>` con estructura idéntica a las de excursiones **más** los dos inputs de crucero dentro de `.exc-booking`, antes del botón add:

```html
          <div class="cruise-fields">
            <label class="field">
              <span data-i18n="cruise.shipLabel">Cruise ship (optional)</span>
              <input type="text" class="cruise-ship" placeholder="e.g. Carnival Vista" data-i18n-attr="placeholder:cruise.shipPlaceholder" />
            </label>
            <label class="field">
              <span data-i18n="cruise.departureLabel">Departure time (optional)</span>
              <input type="time" class="cruise-departure" />
            </label>
          </div>
```

Botón add con `data-service-key="cruise-1|2|3"` y `data-title-key="cruise1.title|cruise2.title|cruise3.title"`. Textos placeholder de título/desc/duración con `data-i18n` a claves `cruise1.*`…`cruise3.*`. **`data-prices` a 0** hasta que el dueño ponga precios reales (documentado en USER_MANUAL).

- [ ] **Step 5: JSON-LD `ItemList`/`TouristTrip` + `BreadcrumbList`**

Igual que Task 6 Step 4 pero con 3 items de crucero y breadcrumb `Cruises` → `…/cruises.html`.

- [ ] **Step 6: Claves i18n (EN y ES)**

```js
// en
    'nav.cruises': 'Cruises',
    'cruisesHero.eyebrow': 'Cruise shore excursions',
    'cruisesHero.title': 'Off the ship, <em>into paradise</em>',
    'cruisesHero.lead': 'Private tours for cruise passengers docking at Amber Cove and Taino Bay.',
    'cruise.guaranteeTitle': 'Back before you sail — guaranteed',
    'cruise.guaranteeBody': 'We track your ship\'s departure and build every tour around it. You are always back at the port with time to spare.',
    'cruise.shipLabel': 'Cruise ship (optional)',
    'cruise.shipPlaceholder': 'e.g. Carnival Vista',
    'cruise.departureLabel': 'Departure time (optional)',
    'cruise.departsAt': 'departs',
    'cruise1.title': 'Shore Excursion 1', 'cruise1.desc': 'Description coming soon.', 'cruise1.duration': 'Half day',
    'cruise2.title': 'Shore Excursion 2', 'cruise2.desc': 'Description coming soon.', 'cruise2.duration': 'Half day',
    'cruise3.title': 'Shore Excursion 3', 'cruise3.desc': 'Description coming soon.', 'cruise3.duration': 'Full day',
// es
    'nav.cruises': 'Cruceros',
    'cruisesHero.eyebrow': 'Excursiones para cruceros',
    'cruisesHero.title': 'Del barco <em>al paraíso</em>',
    'cruisesHero.lead': 'Tours privados para pasajeros de crucero que llegan a Amber Cove y Taino Bay.',
    'cruise.guaranteeTitle': 'De vuelta antes de zarpar — garantizado',
    'cruise.guaranteeBody': 'Controlamos la hora de zarpe de tu barco y diseñamos cada tour en torno a ella. Siempre regresas al puerto con tiempo de sobra.',
    'cruise.shipLabel': 'Barco de crucero (opcional)',
    'cruise.shipPlaceholder': 'ej. Carnival Vista',
    'cruise.departureLabel': 'Hora de zarpe (opcional)',
    'cruise.departsAt': 'zarpa',
    'cruise1.title': 'Excursión 1', 'cruise1.desc': 'Descripción próximamente.', 'cruise1.duration': 'Medio día',
    'cruise2.title': 'Excursión 2', 'cruise2.desc': 'Descripción próximamente.', 'cruise2.duration': 'Medio día',
    'cruise3.title': 'Excursión 3', 'cruise3.desc': 'Descripción próximamente.', 'cruise3.duration': 'Día completo',
```

- [ ] **Step 7: `<script>` correctos**

i18n, config, core, cart, shell, tours (no calculator, no service-picker).

- [ ] **Step 8: Verificar `cruises.html`**

Servir, `cache:'reload'`. Consola 0/0. Rellenar barco="Carnival Vista" + zarpe="16:30", añadir → carrito muestra `… · Carnival Vista · departs 16:30`; checkout → mensaje WhatsApp incluye ambos. Añadir **sin** rellenar los campos → se añade igual (opcionales), meta sin barco/zarpe. Cambiar idioma → `departs`→`zarpa`. Móvil 390 sin overflow.
Expected: campos opcionales funcionan, aparecen en carrito y mensaje, bilingüe.

- [ ] **Step 9: Commit**

```bash
git add cruises.html js/tours.js js/cart.js js/i18n.js
git commit -m "feat: cruises.html con 3 plantillas y captura opcional barco/hora de zarpe"
```

---

## Task 8: Reducir `index.html` a home + nav de 3 servicios + `aria-current`

Recortar las secciones de servicio de la home, dejar el selector como sección real, y reapuntar el nav.

**Files:**
- Modify: `index.html`
- Modify: `js/i18n.js` (claves del selector de sección + nav)

**Interfaces:**
- Produces: sección `#services-picker` con 3 enlaces a las páginas.
- Consumes: nav de todas las páginas comparte el mismo marcado (se replica el cambio de nav en las 4).

- [ ] **Step 1: Nuevo nav en las 4 páginas**

En `index.html`, `transfers.html`, `excursions.html`, `cruises.html`, reemplazar los enlaces de `<nav class="site-nav">` y `<nav class="mobile-nav">` por:

```html
        <a href="transfers.html" data-i18n="nav.transfers">Transfers</a>
        <a href="excursions.html" data-i18n="nav.excursions">Excursions</a>
        <a href="cruises.html" data-i18n="nav.cruises">Cruises</a>
        <a href="index.html#reviews" data-i18n="nav.reviews">Reviews</a>
        <a href="index.html#faq" data-i18n="nav.faq">FAQ</a>
```

Se **elimina** el enlace "Prices". En cada página, marcar su propio enlace con `aria-current="page"` (transfers.html marca el de Transfers, etc.).

- [ ] **Step 2: Recortar secciones de servicio de la home**

En `index.html`, **borrar** la sección `#transfers` (180-295), `#calculator` (296-415) y `#excursions` (416-566). La home conserva: hero, (nuevo selector), why, reviews, gallery, faq, book, footer.

- [ ] **Step 3: Sección selector de servicios en la home**

Insertar tras el hero un `<section class="section services-picker" id="services-picker">` con 3 tarjetas-enlace (icono + nombre + línea de a-quién-sirve), cada una `<a href="transfers.html|excursions.html|cruises.html">`, con `data-i18n` a claves `picker.*` (compartidas con el popup — Task 10).

- [ ] **Step 4: Ajustar `<script>` de la home**

La home ya no tiene ni calculadora ni tarjetas `.exc`. **Quitar `calculator.js` y `tours.js`** de los `<script>` añadidos en Task 2 Step 7. Quedan exactamente, en orden:

```html
  <script src="js/i18n.js" defer></script>
  <script src="js/config.js" defer></script>
  <script src="js/core.js" defer></script>
  <script src="js/cart.js" defer></script>
  <script src="js/shell.js" defer></script>
```

(`service-picker.js` se añade en Task 9 Step 5.)

- [ ] **Step 5: Ajustar JSON-LD de la home**

Mantener `TravelAgency` + `FAQPage` (los dos bloques originales de `index.html`), verificando que las URLs de `FAQPage` siguen válidas.

- [ ] **Step 6: Verificar la home recortada**

Servir, `cache:'reload'`. Consola 0/0. La home ya no muestra calculadora ni tarjetas de excursión; muestra el selector de 3 tarjetas que enlazan a las 3 páginas. Nav lleva a las páginas; `#reviews`/`#faq` hacen scroll en la home. `aria-current` correcto. Sin errores por `calculator.js`/`tours.js` ausentes.
Expected: home limpia, nav de 3 servicios, selector enlaza correctamente.

- [ ] **Step 7: Commit**

```bash
git add index.html js/i18n.js
git commit -m "feat: home reducida a selector de servicios; nav de 3 servicios + aria-current"
```

---

## Task 9: `service-picker.js` — el popup `<dialog>` de la home

**Files:**
- Create: `js/service-picker.js`
- Modify: `index.html` (marcado `<dialog>` + `<script>`), `js/i18n.js` (`picker.*`), `css/styles.css` (estilos del dialog)

**Interfaces:**
- Consumes: `sessionStorage` `sariel-service-picked`, `sariel-service`.
- Produces: `initServicePicker()` IIFE.

- [ ] **Step 1: Marcado `<dialog>` real en `index.html`**

Antes de `</body>` (y de los scripts), añadir marcado estático (no generado por JS):

```html
  <dialog class="service-dialog" id="serviceDialog" aria-labelledby="serviceDialogTitle">
    <div class="service-dialog-inner">
      <button type="button" class="service-dialog-close" id="serviceDialogClose" data-i18n-attr="aria-label:picker.close" aria-label="Close">×</button>
      <p class="eyebrow" data-i18n="picker.eyebrow">Welcome</p>
      <h2 id="serviceDialogTitle" data-i18n="picker.title">What can we help you with?</h2>
      <div class="service-options">
        <a class="service-option" href="transfers.html" data-service="transfers">
          <span class="service-option-icon" aria-hidden="true">🚐</span>
          <span class="service-option-name" data-i18n="picker.transfers">Transfers</span>
          <span class="service-option-desc" data-i18n="picker.transfersDesc">Airport & private rides</span>
        </a>
        <a class="service-option" href="excursions.html" data-service="excursions">
          <span class="service-option-icon" aria-hidden="true">🏝️</span>
          <span class="service-option-name" data-i18n="picker.excursions">Excursions</span>
          <span class="service-option-desc" data-i18n="picker.excursionsDesc">Private day tours</span>
        </a>
        <a class="service-option" href="cruises.html" data-service="cruises">
          <span class="service-option-icon" aria-hidden="true">🛳️</span>
          <span class="service-option-name" data-i18n="picker.cruises">Cruises</span>
          <span class="service-option-desc" data-i18n="picker.cruisesDesc">Shore excursions</span>
        </a>
      </div>
      <button type="button" class="service-dialog-browse" id="serviceDialogBrowse" data-i18n="picker.browse">Browse everything</button>
    </div>
  </dialog>
```

- [ ] **Step 2: Crear `js/service-picker.js`**

```js
/* ============================================================
   Sariel — Service picker popup (home only)
   Abre un <dialog> nativo en la primera carga de la sesión y
   recuerda la elección para no repetir. Degrada limpio sin JS.
   ============================================================ */
'use strict';

(function initServicePicker() {
  const dialog = document.getElementById('serviceDialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const PICKED_KEY = 'sariel-service-picked';
  const SERVICE_KEY = 'sariel-service';

  // Ya preguntado en esta sesión → no molestar de nuevo.
  if (sessionStorage.getItem(PICKED_KEY)) return;

  /** Marca la sesión como ya-preguntada. */
  function markPicked() {
    try { sessionStorage.setItem(PICKED_KEY, '1'); } catch { /* modo privado */ }
  }

  // Guardar la elección y dejar que el <a> navegue normalmente.
  dialog.querySelectorAll('.service-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      try { sessionStorage.setItem(SERVICE_KEY, opt.dataset.service); } catch { /* */ }
      markPicked();
    });
  });

  // Cerrar sin elegir: X, botón "ver todo", Esc (evento cancel), clic en backdrop.
  document.getElementById('serviceDialogClose')?.addEventListener('click', () => dialog.close());
  document.getElementById('serviceDialogBrowse')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', markPicked);   // Esc
  dialog.addEventListener('close', markPicked);
  dialog.addEventListener('click', (e) => {
    // Clic en el backdrop (fuera de .service-dialog-inner) cierra.
    if (e.target === dialog) dialog.close();
  });

  // Abrir tras el primer render.
  requestAnimationFrame(() => dialog.showModal());
})();
```

- [ ] **Step 3: Estilos del dialog en `css/styles.css`**

Añadir al final. `<dialog>` cerrado ya es `display:none` nativo (cumple la lección de capas fantasma). Backdrop, tarjeta centrada, 3 opciones en grid, animación fade+scale con `@starting-style`, anulada bajo reduced-motion:

```css
/* ---------- Service picker dialog (home) ---------- */
.service-dialog { border: none; border-radius: 22px; padding: 0; max-width: 540px; width: calc(100% - 2rem);
  background: var(--shell); color: var(--abyss); box-shadow: 0 30px 80px rgba(6,38,46,.4); }
.service-dialog::backdrop { background: rgba(6,38,46,.55); backdrop-filter: blur(3px); }
.service-dialog-inner { padding: clamp(1.5rem, 4vw, 2.5rem); text-align: center; position: relative; }
.service-dialog-close { position: absolute; top: .75rem; right: 1rem; background: none; border: none;
  font-size: 1.75rem; line-height: 1; cursor: pointer; color: var(--ocean); }
.service-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; margin: 1.5rem 0; }
.service-option { display: flex; flex-direction: column; align-items: center; gap: .4rem; padding: 1.25rem .5rem;
  border: 1.5px solid rgba(11,93,107,.18); border-radius: 16px; text-decoration: none; color: inherit;
  transition: border-color .18s, transform .18s, box-shadow .18s; }
.service-option:hover { border-color: var(--lagoon); transform: translateY(-3px); box-shadow: 0 10px 24px rgba(6,38,46,.12); }
.service-option-icon { font-size: 2rem; }
.service-option-name { font-weight: 700; }
.service-option-desc { font-size: .8rem; color: var(--ocean); }
.service-dialog-browse { background: none; border: none; color: var(--ocean); text-decoration: underline;
  cursor: pointer; font: inherit; }
@media (max-width: 480px) { .service-options { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: no-preference) {
  .service-dialog[open] { animation: dialogpop .25s ease-out; }
  @keyframes dialogpop { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; } }
}
```

- [ ] **Step 4: Claves i18n `picker.*` (EN y ES)**

```js
// en
    'picker.eyebrow': 'Welcome',
    'picker.title': 'What can we help you with?',
    'picker.transfers': 'Transfers', 'picker.transfersDesc': 'Airport & private rides',
    'picker.excursions': 'Excursions', 'picker.excursionsDesc': 'Private day tours',
    'picker.cruises': 'Cruises', 'picker.cruisesDesc': 'Shore excursions',
    'picker.browse': 'Browse everything', 'picker.close': 'Close',
// es
    'picker.eyebrow': 'Bienvenido',
    'picker.title': '¿En qué podemos ayudarte?',
    'picker.transfers': 'Transfers', 'picker.transfersDesc': 'Aeropuerto y traslados privados',
    'picker.excursions': 'Excursiones', 'picker.excursionsDesc': 'Tours privados de día',
    'picker.cruises': 'Cruceros', 'picker.cruisesDesc': 'Excursiones de crucero',
    'picker.browse': 'Ver todo', 'picker.close': 'Cerrar',
```

- [ ] **Step 5: Cargar `service-picker.js` solo en la home**

En `index.html`, tras `shell.js`, añadir `<script src="js/service-picker.js" defer></script>`. No añadir en las otras páginas.

- [ ] **Step 6: Verificar el popup**

Servir, `cache:'reload'`. **Sesión nueva** (borrar `sariel-service-picked` de sessionStorage) → recargar home → popup aparece con fade. Clic en "Transfers" → navega a `transfers.html` y `sariel-service`="transfers", `sariel-service-picked`="1". Volver a la home en la misma sesión → **no** aparece. Cerrar por X, por Esc, por "Ver todo", y por clic en backdrop → todas cierran y marcan picked, sin capa fantasma ni scroll bloqueado (probar scroll tras cerrar). Cambiar idioma con el popup abierto → textos traducen. **Sin JS** (bloquear scripts) → home se ve entera con su sección selector. Móvil 390: 1 columna, sin overflow.
Expected: 1 vez por sesión, 4 vías de cierre limpias, bilingüe, degradación sin JS.

- [ ] **Step 7: Commit**

```bash
git add js/service-picker.js index.html js/i18n.js css/styles.css
git commit -m "feat: popup selector de servicio (<dialog> nativo, 1x por sesión)"
```

---

## Task 10: `sitemap.xml`, `robots.txt` y checklist de go-live

**Files:**
- Create: `sitemap.xml`, `robots.txt`
- Modify: `DOCS/DEPLOYMENT.md`

- [ ] **Step 1: `robots.txt`**

```
User-agent: *
Allow: /
Sitemap: https://sarieltransfers.com/sitemap.xml
```

- [ ] **Step 2: `sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://sarieltransfers.com/</loc><priority>1.0</priority></url>
  <url><loc>https://sarieltransfers.com/transfers.html</loc><priority>0.9</priority></url>
  <url><loc>https://sarieltransfers.com/excursions.html</loc><priority>0.9</priority></url>
  <url><loc>https://sarieltransfers.com/cruises.html</loc><priority>0.9</priority></url>
</urlset>
```

- [ ] **Step 3: Añadir a la checklist de go-live en `DOCS/DEPLOYMENT.md`**

Añadir ítems: reemplazar dominio `sarieltransfers.com` en `sitemap.xml`, `robots.txt`, canonicals y OG de las 4 páginas; poner precios reales en las 3 tarjetas de `cruises.html` (`data-prices`); número real de WhatsApp en `js/config.js`.

- [ ] **Step 4: Verificar**

`http://localhost:8734/sitemap.xml` y `/robots.txt` sirven sin error y son XML/txt válidos.

- [ ] **Step 5: Commit**

```bash
git add sitemap.xml robots.txt DOCS/DEPLOYMENT.md
git commit -m "chore: sitemap.xml, robots.txt y checklist de go-live"
```

---

## Task 11: QA integral en navegador + documentación

**Files:**
- Modify: `PROJECT_INFO.md`, `DOCS/DEVELOPER_GUIDE.md`, `DOCS/FOLDER_STRUCTURE.md`, `DOCS/USER_MANUAL.md`, `DOCS/PROOF_OF_WORK.md`, `tasks/todo.md`, `memory/decisions.md`, `memory/patterns.md`

- [ ] **Step 1: Matriz de QA Playwright (desktop 1440 + móvil 390, EN y ES)**

Recorrer las 4 páginas con `cache:'reload'` en cada asset y `browser_console_messages` **0/0** por página. Ejecutar las 10 pruebas del spec §"Plan de verificación":
1. Transfer añadido en `transfers.html` visible con aeropuerto+provincia correctos tras navegar a `excursions.html`.
2. Popup 1x/sesión.
3. Cierre del popup (X/Esc/scrim/browse) sin capa fantasma ni scroll bloqueado.
4. Sin JS: home íntegra con selector.
5. Idioma persiste home→cruises; popup bilingüe.
6. Carrito sobrevive navegación+refresh; re-render al cambiar idioma con panel abierto.
7. Carrito viejo sembrado se descarta.
8. Crucero: barco+zarpe en carrito y en mensaje WhatsApp.
9. Calculadora intacta en `transfers.html` (diff vs `golden-prices.md`).
10. `aria-current` por página; `prefers-reduced-motion` respetado.

Capturas por viewport sección a sección (nunca `fullPage`). Documentar cada resultado.

- [ ] **Step 2: Actualizar documentación**

- `PROJECT_INFO.md`: tabla de archivos (8 JS + 4 HTML + sitemap/robots), `config.js` como único archivo de datos que el dueño edita, `cruises.html data-prices` pendiente.
- `DOCS/DEVELOPER_GUIDE.md`: nueva arquitectura JS (qué carga en qué página), meta por `data-page`, versión de carrito, popup.
- `DOCS/FOLDER_STRUCTURE.md`: páginas y scripts nuevos.
- `DOCS/USER_MANUAL.md`: cómo editar contenido/precios de cruceros.
- `DOCS/PROOF_OF_WORK.md`: append con timestamp UTC, qué se pidió, archivos, cómo verificar.
- `tasks/todo.md`: fase nueva marcada completa.

- [ ] **Step 3: Actualizar memoria**

- `memory/decisions.md`: decisión de arquitectura multipágina + reparto de JS + popup `<dialog>`.
- `memory/patterns.md`: item de carrito guarda su propia `titleKey` (generaliza el patrón de claves); `<dialog>` nativo como cierre correcto de la clase de bug de capas fantasma.
- Actualizar `MEMORY.md` (auto-memoria en `.claude/projects/.../memory/`) con una línea sobre la división en 3 servicios.

- [ ] **Step 4: Commit final**

```bash
git add DOCS/ PROJECT_INFO.md tasks/todo.md memory/
git commit -m "docs: QA integral + documentación de la división en 3 servicios"
```

---

## Auto-revisión (cobertura del spec)

- Home + 3 páginas dedicadas → Tasks 5, 6, 7, 8. ✓
- Popup `<dialog>` 1x/sesión, 4 vías de cierre, degradación sin JS → Task 9. ✓
- Reparto de `js/main.js` en 8 módulos → Tasks 2, 9 (service-picker). ✓
- `config.js` único archivo de datos del dueño → Task 2, doc en Task 11. ✓
- `EXCURSION_TITLE_KEYS` eliminado; item guarda `titleKey`; carrito versionado y migrado → Task 3. ✓
- Ítems de crucero con barco + hora de zarpe (opcionales, en la tarjeta) → Task 7. ✓
- Nav de 3 servicios, sin "Prices", `aria-current` → Task 8. ✓
- JSON-LD repartido; `<title>`/desc/canonical/OG por página; meta por `data-page` → Tasks 4, 5, 6, 7, 8. ✓
- `sitemap.xml` + `robots.txt` + checklist go-live → Task 10. ✓
- Fuera de alcance (redirecciones de anclas viejas, URLs por idioma) → no se implementan. ✓
- Red de seguridad de precios dorados → Task 1, verificada en 2/5/11. ✓
- QA (10 pruebas) + documentación + memoria → Task 11. ✓
