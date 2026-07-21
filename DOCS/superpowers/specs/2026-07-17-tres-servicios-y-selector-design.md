# Diseño — Tres servicios (Transfers / Excursiones / Cruceros) + selector de servicio

> Fecha: 2026-07-17 · Estado: aprobado en brainstorming, pendiente de plan de implementación

## Problema

La landing de Sariel es hoy una sola página (`index.html`, 57 KB) que mezcla transfers
y excursiones. El negocio tiene **tres** servicios y el dueño enviará contenido propio
para cada uno. Sin división, la página crece hasta ser inmanejable, ningún servicio se
puede anunciar por separado y el visitante no sabe cuál de los tres le corresponde.

## Objetivo

Dividir el sitio en tres servicios con página propia, y recibir al visitante en la home
con un popup que le pregunte cuál busca.

## Decisiones tomadas

| Decisión | Elegido | Descartado y por qué |
|---|---|---|
| Qué es "Cruceros" | Shore excursions para pasajeros que llegan a Amber Cove / Taino Bay, con regreso garantizado antes del zarpe | Venta de paquetes de crucero (otro negocio); solo transfers del puerto (sería un transfer más) |
| División | Página dedicada por servicio, URL propia | Página única con scroll a sección (se vuelve enorme, una sola URL); vista filtrada por JS (una sola URL → sin SEO ni anuncios por servicio) |
| Frecuencia del popup | Una vez por sesión (`sessionStorage`) | Cada carga (irrita al repetidor, máximo riesgo de rebote); solo primera visita |
| Shell compartido | Marcado duplicado en los 4 HTML | Inyección por JS (FOUC en header fijo + clase de bug ya documentada en `lessons.md`); build step (rompe la premisa de que el dueño edita archivos directo — ver `memory/decisions.md`) |

## Arquitectura de páginas

Nombres de archivo en inglés, siguiendo la convención existente (los `id` y claves de
nav ya son `transfers`/`excursions`; el idioma por defecto es EN para turista internacional).

### `index.html` — home
Hero · **selector de 3 servicios como sección real** · why · reviews · galería ·
FAQ general · CTA `#book` · footer · `<dialog>` del popup.

El selector vive en la página, no solo en el modal. Quien cierra el popup debe tener
salida, y Google no indexa opciones que solo existen dentro de un `<dialog>`.

### `transfers.html`
Hero propio · flota/servicios (sección `#transfers` actual) · calculadora boarding-pass
(`#calculator` actual: 7 aeropuertos × 32 provincias) · FAQ de transfers · franja de
confianza · CTA · footer.

### `excursions.html`
Hero propio · las 5 tarjetas `.exc` actuales · FAQ de excursiones · franja de
confianza · CTA · footer.

### `cruises.html`
Hero propio (Amber Cove / Taino Bay) · **promesa de regreso garantizado antes del zarpe
como elemento estructural** · **3 tarjetas plantilla** con la mecánica `data-prices` ·
FAQ de cruceros · franja de confianza · CTA · footer.

Contenido pendiente del dueño: se construyen las 3 tarjetas plantilla listas para
rellenar (título, foto, duración, `data-prices`, descripción). Si el contenido real trae
más o menos de 3, se clonan o borran tarjetas sin tocar lógica.

**Franja de confianza:** cada página de servicio cierra con why resumido + 2 reseñas,
para que funcione como landing autónoma y se pueda anunciar sin pasar por la home.

## El popup selector

- **`<dialog>` nativo.** Da focus trap, `Esc` e inertización del fondo sin código, y
  cerrado es `display:none` real — lo que exige la lección de `lessons.md` sobre capas
  fantasma compositadas bajo headers fijos en Chrome.
- **Marcado real en `index.html`**, no generado por JS. El JS solo llama `showModal()`.
  Sin FOUC; si el JS falla, la home se ve entera con su selector de secciones.
- **Solo en la home.** Nunca en las páginas de servicio: quien llega desde un anuncio
  ya eligió, y preguntarle de nuevo es hostil.
- Se abre en `DOMContentLoaded` con fade+scale corto, anulado bajo `prefers-reduced-motion`.
- Tres tarjetas: icono, nombre, una línea de a-quién-sirve. Al elegir → guarda
  `sariel-service` en `sessionStorage` y navega a la página.
- Salidas: X, `Esc`, clic en scrim, y enlace "Ver todo / Browse everything".
- Bandera de ya-preguntado: `sariel-service-picked` en `sessionStorage`.
- Textos en `js/i18n.js` bajo `picker.*`, EN/ES.
- A11y: `aria-labelledby`, foco al primer botón, foco restaurado al cerrar.

**No se añade** un control "cambiar servicio" para reabrir el popup: el nav ya lleva los
tres servicios como enlaces permanentes.

**Riesgo SEO aceptado:** un modal al cargar es lo que Google penaliza como *intrusive
interstitial* en móvil. Queda contenido porque vive solo en la home, y la home no pelea
las keywords de servicio — esas las pelean las tres páginas, que no tienen modal.

## Reorganización de JS

`js/main.js` (31 KB) no sobrevive: hoy hace calculadora + carrito + header + reveals +
parallax + FAQ + contadores en un archivo, viable con una sola página. En 4 páginas se
descarga entero en cada una y ejecuta código buscando elementos ausentes. Es refactor
real, causado por la decisión de páginas dedicadas.

| Archivo | Contenido | Carga en |
|---|---|---|
| `js/config.js` | `CONFIG` + `AIRPORTS` + `PROVINCES` + `VEHICLES` + constantes de precio | todas |
| `js/i18n.js` | diccionarios EN/ES + `t()`/`setLang()` (rol sin cambios) | todas |
| `js/core.js` | `animatePrice`, `formatDuration`, `whatsappLink`, `haversineKm`, `estimateRoute` | todas |
| `js/cart.js` | estado, render y checkout del carrito | todas |
| `js/shell.js` | header, nav móvil, reveals, parallax, FAQ, contadores | todas |
| `js/calculator.js` | UI del boarding pass | transfers |
| `js/tours.js` | precios por nº de huéspedes + añadir al carrito | excursions, cruises |
| `js/service-picker.js` | el popup | index |

Todos los `<script>` con `defer`, en el orden de la tabla.

`main.js` se elimina; su contenido se reparte.

### Por qué los datos de rutas van en `config.js` y no en `calculator.js`
El carrito los necesita: si el visitante añade un transfer en `transfers.html` y abre el
carrito en `excursions.html`, `describeCartItem` debe resolver aeropuerto y provincia.
El acoplamiento ya existe hoy oculto (lo insinúa el comentario de `main.js:187`).

### Beneficio colateral
`config.js` pasa a ser **el único archivo que el dueño edita** (número de WhatsApp,
precios, vehículos): datos sin lógica. Hoy `PROJECT_INFO.md` le pide editar `CONFIG`
dentro de un archivo de 31 KB.

### `EXCURSION_TITLE_KEYS` desaparece
Hoy mapea slug → clave i18n para que el carrito sepa el nombre. En su lugar, la tarjeta
lleva `data-title-key` y el ítem del carrito guarda su propia clave i18n. El mapa se
elimina, cruceros funciona sin añadir entradas, y se mantiene el patrón de `patterns.md`
(guardar claves de lookup, nunca texto renderizado).

**Migración:** `sariel-cart` gana un campo de versión; un carrito con forma desconocida
se descarta al cargar. El sitio está en placeholders, no hay usuarios reales afectados.

### Ítems de crucero
Capturan **nombre del barco y hora de zarpe**, y ambos viajan en el mensaje de WhatsApp.
Una shore excursion sin hora de zarpe no es accionable.

Dónde se capturan: **en la propia tarjeta de crucero**, junto al selector de huéspedes y
antes de añadir al carrito — no en el checkout. Motivo: el dato es por-tour (dos tarjetas
podrían ser de barcos distintos si viajan dos grupos) y pedirlo al final obligaría a
recordar a qué ítem pertenece. Ambos campos son **opcionales**: bloquear el añadido por
un dato que el visitante quizá no tenga a mano cuesta más conversión de la que salva.
Se guardan en el ítem como `shipName` (texto libre) y `departureTime` (`<input type="time">`).

## Navegación y SEO

**Nav nuevo:** `Transfers · Excursions · Cruises · Reviews · FAQ`. Los tres servicios a
sus páginas; reviews y FAQ a `index.html#reviews` / `index.html#faq`. `aria-current="page"`
marca la página activa.

**Se elimina "Prices"** del nav: apuntaba a `#calculator`, exclusivo de transfers. Con
tres servicios de precios distintos, un "Prices" global miente sobre su destino. La
calculadora vive dentro de `transfers.html`.

**JSON-LD repartido:**
- `index.html` — `TravelAgency` + `FAQPage`
- `transfers.html` — `Service` + `BreadcrumbList`
- `excursions.html` — `ItemList` de `TouristTrip` + `BreadcrumbList`
- `cruises.html` — `ItemList` de `TouristTrip` + `BreadcrumbList`

Cada página con su propio `<title>`, meta description, canonical y OG.

### `js/i18n.js` necesita meta por página (hallazgo tardío)
`applyStaticTranslations()` hoy hace `document.title = t('meta.title')` (i18n.js:606) y
rellena la meta description desde `meta.description` (i18n.js:621-626) — **claves globales
únicas**. Con 4 páginas, cada una sobrescribiría su título con el de la home, lo que hace
imposible el requisito de arriba.

Corrección: cada página declara `<body data-page="home|transfers|excursions|cruises">` y
`applyStaticTranslations()` resuelve `meta.<page>.title` / `meta.<page>.description`,
con `home` por defecto si el atributo falta. Las claves `meta.title`/`meta.description`
actuales se renombran a `meta.home.*` y se añaden las tres nuevas parejas en EN y ES.

**Se añaden `sitemap.xml` y `robots.txt`** (hoy no existen), con el dominio placeholder
`sarieltransfers.com`, y se suman a la checklist de `DOCS/DEPLOYMENT.md`.

## Fuera de alcance (decidido explícitamente)

**Redirecciones de anclas viejas** (`index.html#excursions` → `excursions.html`). El sitio
no está publicado — WhatsApp, fotos y dominio siguen en placeholder — así que no hay
enlaces externos ni marcadores que rescatar. Sería código muerto desde el día uno.

**URLs por idioma** (`/es/transfers.html`). El idioma se cambia por JS sobre la misma URL,
así que Google solo indexa la versión EN. **Es una limitación preexistente, no la
introduce este cambio.** Arreglarla significa duplicar las páginas; si algún día se
quieren pelear keywords en español, es una fase propia.

## Plan de verificación

Playwright en navegador real, desktop 1440 + móvil 390, EN y ES, consola limpia (0
errores, 0 warnings) en las 4 páginas, sin overflow horizontal a 390 px.

Dos lecciones ya pagadas en este proyecto y que aplican:
- Forzar `fetch(url, {cache:'reload'})` antes de recargar — assets rancios fingieron
  fallos en QA anteriores.
- Capturar por viewport sección a sección, nunca `fullPage` — los scroll-reveals rompen
  el stitching.

Pruebas que deciden si el diseño está bien:

1. **Valida el reparto de JS:** añadir transfer en `transfers.html` → navegar a
   `excursions.html` → abrir carrito → el ítem muestra aeropuerto y provincia correctos.
2. **Popup:** aparece en primera carga de home; al elegir navega; al volver en la misma
   sesión no aparece; en sesión nueva sí.
3. **Cierre del popup:** X, `Esc` y scrim, sin capa fantasma ni bloqueo de scroll residual.
4. **Sin JS:** la home se ve entera con su selector de secciones.
5. **Idioma:** cambiar a ES en home → navegar a cruceros → sigue en ES. Popup en ambos idiomas.
6. **Carrito:** sobrevive navegación y refresh; cambiar idioma con el carrito abierto lo re-renderiza.
7. **Migración:** carrito con forma vieja sembrado en `localStorage` se descarta sin romper.
8. **Crucero:** ítem captura barco + hora de zarpe y ambos salen en el mensaje de WhatsApp.
9. **Regresión:** calculadora intacta en `transfers.html` (7 aeropuertos × 32 provincias, upgrade de vehículo).
10. **Nav:** `aria-current` correcto en cada página; `prefers-reduced-motion` respetado.

## Documentación a actualizar

`PROJECT_INFO.md` (archivos, configuración), `DOCS/DEVELOPER_GUIDE.md` (arquitectura JS),
`DOCS/FOLDER_STRUCTURE.md` (páginas y scripts nuevos), `DOCS/USER_MANUAL.md` (editar
contenido de cruceros), `DOCS/DEPLOYMENT.md` (sitemap/robots en la checklist de go-live),
`DOCS/PROOF_OF_WORK.md` (append), `tasks/todo.md`, y `memory/` (decisions + patterns).
