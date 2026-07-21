# Lessons

## 2026-07-14T17:20Z — Hidden layers under fixed headers still paint in Chrome
**What went wrong:** the closed mobile menu (`opacity:0; visibility:hidden`,
child of the fixed header) left a ghost/blur stripe painted over page content
on mobile. Cost several debugging rounds because computed styles all looked
correct.
**Why:** Chrome keeps compositing the promoted layer; `visibility:hidden`
does not reliably stop it (backdrop-filter earlier made it worse).
**Rule:** collapse overlays/menus with `display:none` and animate them with
`transition-behavior: allow-discrete` + `@starting-style` — never leave
"invisible but painted" layers under fixed elements.

## 2026-07-14T17:20Z — Count grid children, including decorative ones
**What went wrong:** `.boarding-pass` declared 2 columns for 3 children (a
divider div between main and stub) → the stub wrapped to a second row.
**Rule:** when a decorative element is a real DOM child of a grid, give it an
explicit track (`1.6fr 2px 1fr`) — or make it a pseudo-element.

## 2026-07-14T17:20Z — Verify against fresh assets, not the HTTP cache
**What went wrong:** two fixes appeared to fail because Chrome served stale
css/js after `location.reload()` during Playwright QA (python http.server).
**Rule:** after editing assets in live-browser QA, force
`fetch(url, {cache:'reload'})` before reloading, and only then judge the fix.

## 2026-07-14T17:20Z — Full-page screenshots lie on scroll-reveal pages
**What went wrong:** Playwright `fullPage` capture showed "empty"/duplicated
sections because stitching races IntersectionObserver reveals and lazy images.
**Rule:** QA scroll-reveal pages section by section with viewport screenshots
after real scrolling; use fullPage only for static pages.

## 2026-07-14T17:55Z — innerHTML decodes entities; setAttribute/document.title don't
**What went wrong:** an i18n dictionary value used `&amp;` (correct for
`data-i18n` targets rendered via `el.innerHTML`), but the same string was
also used for `document.title` and a meta `content` attribute — both render
the literal text "&amp;" instead of "&", since only `innerHTML` parses HTML
entities.
**Rule:** dictionary/config strings applied via `setAttribute()` or a plain
JS string property (`.title`, `.value`, `.textContent`) must use literal
characters (`&`, not `&amp;`). Reserve HTML entities for values that will
actually go through `innerHTML`.

## 2026-07-14T17:20Z — Generic link rules beat component classes
**What went wrong:** `.mobile-nav a { color: var(--ink) }` (0,1,1) overrode
`.btn-primary` (0,1,0) → dark text on dark button.
**Rule:** scope generic anchor styling with `:not(.btn)` (or lower
specificity) whenever a container can hold button-styled links.

## 2026-07-17T00:00Z — Un brief que reañade claves i18n crea duplicados silenciosos
**Qué salió mal (evitado a tiempo):** al dividir la home, Task 8 creó claves
`picker.*`; el brief de Task 9 (escrito antes) volvía a definir `picker.eyebrow`,
`picker.transfersDesc`, etc. con otros valores. Meterlas habría dado CLAVES
DUPLICADAS en el mismo objeto `en:{}`/`es:{}` — la segunda pisa a la primera en
silencio, rompiendo una de las dos superficies (sección de la home vs popup).
**Regla:** antes de añadir claves i18n desde un plan/brief, `grep` las claves ya
existentes; reutiliza las que ya están y añade SOLO las nuevas. Chequeo de
integridad: ninguna clave debe aparecer >2 veces (en+es), y en/es deben tener el
mismo recuento.

## 2026-07-17T00:00Z — Dividir un single-page deja anclas muertas entre páginas
**Qué salió mal:** al mover secciones a páginas propias, enlaces `href="#faq"`,
`#gallery`, `#excursions` seguían apuntando a secciones que ya no existían en esa
página (viven en la home). Copiar el shell verbatim los arrastró.
**Regla:** tras un split, inventaria los `id` de sección que existen en CADA
página y reapunta a `index.html#x` (u otra página) los anclas cuyo destino ya no
está local. Verificar con: `grep 'href="#x"'` contra `grep 'id="x"'` por archivo.

## 2026-07-17T00:00Z — CSS de secciones nuevas: no basta con el markup
**Qué salió mal:** el `#services-picker` de la home se añadió con clases
`.picker-grid/.picker-card/...` pero sin CSS → tarjetas sin estilo, SVGs a tamaño
por defecto. Justo la navegación principal y el fallback sin-JS del popup.
**Regla:** al crear una sección con clases nuevas, añadir su CSS en el mismo
cambio (o dejar tarea explícita). Verificar que cada clase nueva del markup tiene
regla en styles.css antes de dar por hecha la tarea.

## 2026-07-17T23:30Z — El dueño reemplaza fotos en vivo, en paralelo a la sesión
**Qué pasó:** mientras se descargaban placeholders a `img/`, el editor avisó
varias veces que archivos habían sido "modified on disk since you last read
it" (index.html, config.js, i18n.js, etc.) — no era un conflicto, era el
dueño moviendo/renombrando sus propias fotos de `Nueva carpeta/` en
paralelo, tal como dijo que haría. Un caso concreto rompió una referencia:
su copia de `cayo-arena.-puerto-plata.jpg` aterrizó en `img/` sin renombrar
a `exc-punta-rusia.jpg`, dejando esa tarjeta con una imagen rota hasta que
se detectó con un cross-check `img/` referenciado vs. `img/` existente.
**Regla:** en este proyecto, tras cualquier tanda de descargas/ediciones de
imágenes, correr un cross-check final (`grep` de cada `src="img/..."` en
las 4 páginas vs. `ls img/`) — no asumir que lo que se descargó sigue ahí
con ese nombre. Si aparece un archivo "de más" con un nombre distinto al
esperado y el mismo tamaño que algo en `Nueva carpeta/`, es casi seguro el
dueño reemplazándolo — renombrar para que coincida con el nombre esperado
en vez de tocar el HTML.
