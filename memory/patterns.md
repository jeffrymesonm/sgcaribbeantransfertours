# Patterns

## 2026-07-14T17:20Z — Concurrency-safe numeric tween
Rapidly re-triggered rAF tweens on the same element race each other. Proven
solution (js/main.js `animatePrice`): per-element monotonic token
(`el._priceToken`); each frame checks its captured token and bails if
superseded. Apply to any counter/price animation.

## 2026-07-14T17:20Z — Animated accordion without measuring heights
`<button aria-expanded>` + panel `display:grid; grid-template-rows: 0fr → 1fr`
with an `overflow:hidden` inner wrapper. Animates to auto content height,
fully accessible, no JS measurement. Used for FAQ.

## 2026-07-14T17:20Z — Scroll reveal with automatic stagger
One IntersectionObserver for all `.reveal` items; group siblings by parent and
set `--reveal-delay: i*70ms` (capped) so grids cascade without hand-written
delays. Unobserve after first entry.

## 2026-07-15T00:00Z — Off-screen transform beats opacity/visibility for drawers
A fixed-position panel toggled with `opacity:0`/`visibility:hidden` risks
Chrome still compositing a ghost layer in place (see the mobile-nav lesson).
For the cart drawer, used `transform: translateX(100%)` (closed) →
`translateX(0)` (open) instead — the element is genuinely outside the
viewport when closed, so there's nothing to ghost-paint, and it's a simpler
mental model than the display:none + allow-discrete + @starting-style
workaround the mobile-nav needed. Prefer this for any off-canvas panel.

## 2026-07-15T00:00Z — Cart items store ids, not rendered text
Cart/list items that must survive a language switch should store raw
lookup keys (`pickupKey`, `serviceKey`, etc.), not pre-rendered strings.
A `describe*(item)` function resolves display text via `t()` at render
time, so `renderCart()` can just re-run on `sariel:langchange` — same
principle as the calculator's boarding pass. Snapshot a value at add-time
only when it truly can't be recomputed later (e.g. an excursion's
guest-count price, which comes from a fixed table, not a formula).

## 2026-07-14T17:20Z — Verifying Unsplash placeholders
Unsplash photo IDs from memory are unreliable (≈1/3 wrong subject or 404).
Proven flow: curl each candidate at `?w=400&q=60`, then visually inspect the
downloaded files before committing URLs into markup.

## 2026-07-17T00:00Z — Multipágina estática con shell compartido, sin build
Sitio de 4 páginas (index/transfers/excursions/cruises) que comparten
header/cart/footer copiados verbatim en cada HTML, y un núcleo JS común cargado
por página con `defer`: i18n+config+core+cart+shell en todas; +calculator
(transfers), +tours (excursions/cruises), +service-picker (home). Meta por página
vía `<body data-page>` → `meta.<page>.*`. Ventaja: cada página se anuncia sola,
sin framework ni build. Coste: el shell duplicado hay que mantenerlo sincronizado
en 4 archivos (por eso los cambios de nav se replican a mano en los 4).

## 2026-07-17T00:00Z — Popup de bienvenida con <dialog> nativo, 1x por sesión
`<dialog>` estático en el HTML (no generado por JS); `service-picker.js` solo
llama `showModal()` en `requestAnimationFrame`. Cerrado es `display:none` nativo
(cumple la lección de capas fantasma bajo headers fijos — nada que compositar).
`sessionStorage['sariel-service-picked']` evita repetir; 4 vías de cierre (X,
botón "ver todo", Esc via evento `cancel`, clic en backdrop `e.target===dialog`).
Degrada sin JS: la home conserva su sección selector equivalente. Guard
`typeof dialog.showModal !== 'function'` para navegadores viejos.

## 2026-07-17T00:00Z — Red de seguridad sin git: SNAP/ + precios dorados
Proyecto sin repo git. Para un refactor grande: (1) copiar el proyecto a un
`SNAP/` en scratchpad = "último estado aprobado", diffs con `diff -ru SNAP proy`;
resincronizar SNAP tras aprobar cada tarea. (2) Antes de tocar lógica de precios,
capturar una LÍNEA BASE DORADA (las 224 rutas × 4 vehículos + 5 excursiones)
ejecutando las funciones puras, y comparar byte a byte tras cada cambio. Detecta
cualquier regresión de precio de un refactor de módulos al instante.
