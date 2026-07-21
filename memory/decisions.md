# Architectural decisions

## 2026-07-14T17:20Z — Static vanilla site, no framework
Landing page for a transfer company: chose plain HTML/CSS/JS (3 files) over
React/Next. Rationale: zero build step, fastest load (conversion page), any
host works, the owner can edit prices in one config block. Revisit only if a
booking backend is ever added.

## 2026-07-14T17:20Z — WhatsApp as the only conversion channel
No backend/database. Every CTA builds a prefilled `wa.me` deep link
(`CONFIG.whatsappNumber` in js/main.js). This matches how DR transfer
companies actually close bookings.

## 2026-07-14T17:20Z — Design signature: boarding-pass motif
Route cards and the calculator result are styled as airline boarding passes
(IBM Plex Mono data, airport codes, dashed perforation, edge notches, gold
van glyph). Chosen to ground the design in the airport-transfer world and
avoid generic template look. Palette: abyss #06262E / ocean #0B5D6B /
lagoon #17A398 / sand #F3EDE2 / shell #FCFAF5 / gold #C2933E.
Type: Fraunces + Archivo + IBM Plex Mono.

## 2026-07-14T17:20Z — Pricing model
Transfers: route base price (per vehicle, ≤3 pax) + vehicle-tier surcharge
(Minivan +15, Van +30, Minibus +55), auto-upgrade when the chosen vehicle is
too small. Excursions: total per group via `data-prices` JSON per guest count
(2–5), per the client spec (Paradise Island 180/240/290/330).

## 2026-07-17T00:00Z — Split en 4 páginas dedicadas (transfers/excursiones/cruceros)
El negocio tiene 3 servicios con contenido propio. Se pasó de una sola página a
4 (home + una por servicio), cada una con URL, `<title>`/meta, JSON-LD y contenido
propios, para poder anunciarlas por separado y no inflar una única página.
Descartado: página única con scroll (una sola URL, se vuelve enorme) y vista
filtrada por JS (sin SEO por servicio). "Cruceros" = shore excursions para pasajeros
de crucero (Amber Cove/Taino Bay) con regreso garantizado antes del zarpe, NO venta
de paquetes de crucero. La home recibe con un popup `<dialog>` que pregunta qué
servicio busca (1x por sesión).

## 2026-07-17T00:00Z — main.js roto en módulos; config.js como único punto de edición
Con 4 páginas, el monolito js/main.js (31 KB) se descargaba entero en cada una y
buscaba elementos ausentes. Se dividió por responsabilidad (config/core/cart/shell/
calculator/tours/service-picker) cargados por página. Los datos de ruta viven en
config.js (no en calculator.js) porque el CARRITO los necesita para describir un
transfer al abrirlo en cualquier página. Efecto secundario buscado: config.js queda
como el único archivo que el dueño edita (número WhatsApp, precios, vehículos).

## 2026-07-17T00:00Z — Carrito versionado + titleKey en el item
Se eliminó el mapa `EXCURSION_TITLE_KEYS`: cada tarjeta lleva `data-title-key` y el
item guarda su propia clave i18n. `sariel-cart` gana envelope `{v,items}` con
`CART_VERSION=2`; un carrito de forma desconocida se descarta al cargar (sin usuarios
reales aún, coste nulo). Items de crucero añaden `shipName`/`departureTime` opcionales
que viajan en el mensaje de WhatsApp.

## 2026-07-17T22:20Z — Fotos reales: pipeline "Nueva carpeta/" → img/ (nunca hotlink del original)
Las fotos que entrega el dueño caen en `Nueva carpeta/` (originales de móvil:
pesados, con EXIF/GPS y nombres con espacios). Decisión: el sitio solo
referencia copias procesadas en `img/` — resize a ≤1500px lado largo, JPEG
q82, re-encode con System.Drawing (elimina EXIF/GPS: privacidad) aplicando
antes la orientación EXIF a píxeles. Nombres ASCII estables (`team-*.jpg`,
`fleet-*.jpg`) para poder reemplazar una foto sobrescribiendo el archivo sin
tocar HTML. Chofer sin foto (Leuris): tarjeta placeholder de marca
(monograma + ola, `.team-photo-placeholder`), no un "coming soon" — se ve
intencional y el swap está documentado en USER_MANUAL.

## 2026-07-17T23:30Z — Rebranding: "Sariel" es persona, no la marca
El sitio original usaba "Sariel" como nombre de la empresa Y como nombre de
uno de los 4 choferes reales (Saul, Sariel, Luis, Leuris). Al renombrar la
empresa a "SG Caribbean Transfers & Tours" se decidió (sin preguntar, por
ser una distinción semántica clara) reemplazar SOLO las menciones de marca
(título, header/footer, JSON-LD, meta) y dejar intactas las menciones a
Sariel-persona (tarjeta del equipo, alt text, reseña de cliente). Regla para
futuras ediciones: antes de un find-and-replace de "Sariel", revisar caso
por caso — no es un simple rename global.

## 2026-07-17T23:30Z — Rutas populares de precio fijo, separadas de la calculadora
Los precios reales que dio el dueño (ej. POP→Sosúa $23.95) son por
ciudad/pueblo (Sosúa, Cabarete), no por provincia — la calculadora de
`estimateRoute()` solo conoce provincias. En vez de forzar Sosúa/Cabarete
dentro de `PROVINCES` (rompería el propósito de esa lista, que es para las
32 provincias reales), se creó un sistema paralelo: la tabla "Popular
Routes" en `transfers.html` con `data-fixed-from/to/price` literales y un
nuevo `kind:'fixedRoute'` en el carrito. La calculadora por distancia sigue
existiendo para todo lo demás (aeropuertos↔provincias no cubiertos por una
ruta popular). Confirmado con el dueño antes de implementar (afecta cómo se
calcula dinero).

## 2026-07-19T15:30Z — Checkout dual (WhatsApp/email) comparte un solo builder de mensaje
En vez de dos rutas de código independientes para armar el mensaje según el
canal, `buildCartMessage()` en cart.js quedó como la ÚNICA función que arma
el contenido; los dos botones ("Enviar por WhatsApp" / "Enviar por Correo")
solo difieren en qué link abren (`whatsappLink()` vs `emailLink()`, ambos en
core.js, misma forma). Igual con la validación de nombre requerido
(`canCheckout()`) y la lectura del formulario (`readCheckoutDetails()`) —
compartidas por ambos botones. Motivo: si el WhatsApp y el email pudieran
divergir en contenido, sería un bug esperando pasar (ej. alguien edita el
mensaje de WhatsApp y se olvida del de email).

## 2026-07-19T15:30Z — Fecha de vuelo y fecha de excursión: 2 campos, no 1
El carrito tenía un solo campo "fecha preferida" compartido por todo el
pedido. El dueño señaló que un carrito puede tener un transfer (con fecha
de vuelo) Y una excursión (con su propia fecha) en días distintos — un
campo compartido era ambiguo. Se separó en `#cartFlightDate` +
`#cartExcursionDate`, ambos opcionales, ambos a nivel de carrito (no por
ítem) porque sigue siendo UN visitante llenando UN carrito.

## 2026-07-19T15:30Z — formatMoney(): los precios con centavos necesitan formato explícito
Antes de esta sesión todos los precios del sitio eran enteros, así que
`US$${price}` nunca fallaba. Los nuevos precios con centavos (23.95,
495.80) sí fallan: `495.80` en JS se imprime como `"495.8"` (pierde el cero
final), lo cual se ve como un error tipográfico en una página que cobra
dinero real. Se agregó `formatMoney()` en `core.js` (entero → sin
decimales, con centavos → siempre 2 decimales) y se usa en todos los
lugares donde el carrito imprime un precio como texto.

## 2026-07-19T14:10Z — Logo circular: crop por CSS, no por máscara de píxeles
El logo real (`Nueva carpeta/logo favicon.jpeg`) es un JPEG cuadrado con una
insignia circular que toca los 4 bordes del lienzo (mínimo margen blanco en
las esquinas). En vez de editar el canal alfa para recortar el círculo a
nivel de píxel (requeriría lienzo transparente + PNG), se usó
`border-radius: 50%` + `object-fit: cover` en `.brand-mark` — el navegador
recorta las esquinas blancas automáticamente. Válido solo porque el círculo
ya casi llena el cuadrado; si el dueño sube un logo con más margen blanco
alrededor, este truco dejaría ver un cuadrado con círculo adentro en vez de
un círculo limpio — en ese caso sí haría falta recortar el PNG con canal
alfa. Favicon (`favicon-32.png`/`favicon-180.png`) generado directamente
desde `logo.jpg` con `System.Drawing` (mismo pipeline de
resize+strip-EXIF ya documentado arriba, sin pasos extra).

## 2026-07-19T16:00Z — Cantidad manual: "cotizar" en vez de extrapolar precio
Las tarjetas de excursión solo tienen precio EXACTO para 4 y 5 personas
(ej. 27 Charcos: $235/$270 — no es una tarifa plana por persona, así que no
hay fórmula segura para 6, 8, 10...). En vez de inventar un número (riesgo
real: cobrar de más o de menos a un cliente), se preguntó al dueño y se
implementó: cantidad sin precio exacto → la tarjeta muestra "Contáctanos
para cotizar" y el botón abre WhatsApp con el nombre + cantidad ya
escritos, en vez de agregar al carrito con un precio adivinado. Encontrado
de paso: bug de especificidad CSS — `.exc-price-amount{display:flex}` le
ganaba al `[hidden]{display:none}` del navegador por tener la misma
especificidad pero declararse después; se corrigió con
`.exc-price-amount[hidden]{display:none}`.

## 2026-07-20T00:00Z — Precios de ~50 destinos: tabla estática, no 50 tickets nuevos
El dueño mandó una foto del cartel de un competidor ("Taxi Sosúa-Cabarete")
con ~50 precios y pidió igualar esa lista con cada precio -$1.50. Antes de
construirlo se preguntó al dueño cómo mostrar tantos destinos: ¿tickets
boarding-pass como los 9 existentes, o una tabla compacta? Eligió la tabla
(`#price-list` en transfers.html, `.price-list-grid`/`.price-item`, SIN
botón "Add to Cart" — es solo referencia). Los tickets boarding-pass
existentes se reservan para las rutas que el negocio realmente destaca; una
tabla de 50 tarjetas grandes habría sido excesiva. Los 4 precios de
aeropuerto del mismo cartel SÍ se integraron al ticket rail (no a la tabla)
porque ya tenían formato de ticket: se actualizaron POP/STI/SDQ→Sosúa a los
valores del cartel (-$1.50) y se agregó un ticket nuevo AZS(Samaná)→Sosúa.
PUJ→Sosúa ($425) no está en el cartel y quedó sin tocar, igual que las
variantes POP/STI→Cabarete/Puerto-Plata-provincia (el cartel da una sola
tarifa plana por aeropuerto, no hay valor 1:1 para reemplazarlas).

**Corrección del dueño en vivo:** el cartel del competidor enmarca esos ~50
precios como "desde Sosúa/Cabarete" (la base de ESE negocio). Pero
SG Caribbean cobra todo desde el Aeropuerto de Puerto Plata (ya lo dice
`services.transferMeta`: "From US$25"). Se corrigió solo el texto de origen
(`transfers.priceListLead` en los 3 idiomas) a "desde el Aeropuerto de
Puerto Plata (POP)" — los nombres de destino y los precios en sí NO
cambiaron, solo el marco de referencia. Lección: cuando una fuente externa
(cartel, competidor, dato de un tercero) trae también su propio contexto de
negocio implícito (origen, moneda, condiciones), ese contexto no se hereda
automáticamente — hay que verificar contra cómo opera realmente el negocio
propio antes de copiar la data.

## 2026-07-20T00:00Z — Cargo de equipaje: un solo fee plano a nivel de carrito
El dueño pidió permitir indicar cuántas maletas trae el cliente en los
transfers, con un cargo extra de $15 si son más de 10. Se decidió NO
agregar esto como parte de cada `kind:'transfer'`/`kind:'fixedRoute'` item
(complicaría el shape del item y CART_VERSION), sino como un campo suelto
a nivel de checkout (`#cartLuggage`, junto a nombre/vuelo/fechas) leído en
vivo por `getLuggageCount()`/`luggageFee()` en cart.js — igual que el resto
de esos campos, no se persiste como item, solo se lee al renderizar/enviar.
El fee es plano ($15 una sola vez si son >10 maletas), no por maleta extra,
tal como lo pidió el dueño.

## 2026-07-20T00:15Z — "Meet the team" pasa de sección a página propia (nosotros.html)
El dueño pidió que el equipo/flota fuera "una sección aparte" con el logo y
un nuevo banner que subió a `img/`. Se preguntó si eso significaba mejorar
la sección `#about` existente en `index.html` o crear una página nueva —
eligió página nueva. Se creó `nosotros.html` (5ª página, mismo shell
header/carrito/footer que las otras 4) con: hero banner (foto del dueño) →
intro de empresa (logo + texto `about.introBody`, nuevo) → grid de equipo +
flota (movidos tal cual desde el viejo `#about` de index.html) → CTA de
reserva. Nav/footer "Meet the team" en las 5 páginas ahora apunta a
`nosotros.html` (antes `index.html#about`); la sección vieja se borró de
index.html. `sitemap.xml` ganó una 5ª URL.

**Incidente durante la sesión:** el dueño reemplazó `img/banner
nosotros.jpeg` VARIAS VECES mientras la sesión seguía corriendo — mismo
comportamiento ya documentado en `memory/lessons.md` (2026-07-17). Pasó por
al menos 3 estados: `.jpeg` original → `.png` sin procesar (2.1 MB) →
`.jpg` re-codificado por esta sesión (resize+strip-EXIF, ≤1500px, JPEG
q82) → de vuelta a `.jpeg` (el dueño lo volvió a reemplazar). Cada cambio
de extensión rompía el `<img src>` de `nosotros.html`; se fue
re-sincronizando cada vez que se detectaba, y el paso final de la sesión
fue una auditoría completa `img/` referenciado-vs-existente para confirmar
que el estado quedara consistente. Archivo final: `img/banner
nosotros.jpeg` (126 KB, ya de tamaño razonable — no necesitó reproceso).
El `.jpg` que esta sesión generó ya no existe en disco (el dueño lo
sobrescribió/reemplazó de nuevo); no se persigue más — el archivo es del
dueño y él lo sigue gestionando en su propio explorador de archivos.

## 2026-07-20T01:00Z — La lista de 50 precios se elimina y se fusiona DENTRO de la calculadora
El dueño vio el resultado (tabla de referencia separada + calculadora con
formula por distancia) y notó la inconsistencia: la calculadora mostraba
$35 para POP→Puerto Plata mientras la tabla decía $33.50 para el mismo
viaje — dos sistemas de precio para la misma ruta, mostrando números
distintos. Pidió explícitamente: "todos los precios deberian estar en el
calculo no aparte". Se eliminó la sección `#price-list` por completo y se
fusionaron sus ~50 destinos DENTRO del `<select id="calcDest">` de la
calculadora existente, en dos tablas nuevas de `js/config.js`:
`POP_PROVINCE_FIXED_FARES` (sobrescribe la fórmula para una provincia
existente cuando el nombre coincide, ej. "Puerto Plata", "Santiago",
"Santo Domingo" — 11 provincias) y `POP_FIXED_DESTINATIONS` (los ~39
restantes, lugares que no son su propia provincia, más Sosúa/Cabarete que
ya usaban ticket propio). `resolveFixedFare()` en calculator.js decide cuál
aplica; si hay una tarifa fija, el precio es plano (sin recargo de
vehículo, tope de 6 pasajeros, select de vehículo deshabilitado) — el
propio cartel de origen dice "1 to 6 person" para todos sus precios, así
que ningún destino fijo debía tener recargo de vehículo tampoco. Al
agregar al carrito, una tarifa fija ahora entra como `kind:'fixedRoute'`
(snapshot), nunca `kind:'transfer'` — si entrara como `'transfer'`,
`describeCartItem()` volvería a calcular con la fórmula y mostraría el
precio equivocado la próxima vez que el carrito se re-renderice.

**Segunda corrección del dueño, más importante:** antes de implementar esto
se le preguntó si los precios "baratos" del cartel (Sosúa $5.50, Cabarete
$13.50, Casa Linda $8.50, etc.) eran realmente tarifas reales desde el
aeropuerto de Puerto Plata, porque contradecían tickets ya existentes
(POP→Sosúa ya estaba en $23.50, un precio real confirmado en una sesión
anterior). El dueño confirmó: SÍ son precios reales desde POP. Esto obligó
a corregir 3 tickets pre-existentes que quedaban contradictorios: POP→Sosúa
$23.50→$5.50, POP→Cabarete $33.95→$13.50, POP→Puerto Plata (provincia)
$38.95→$33.50. Lección reforzada (ya estaba en la entrada anterior sobre el
mismo cartel): nunca copiar datos de una fuente externa sin cruzarlos
primero contra los precios que el sitio YA tiene confirmados — un cartel de
competidor puede fácilmente contradecir un precio que el dueño ya validó en
una sesión anterior, y sin ese cruce el sitio habría mostrado dos precios
distintos para el mismo viaje sin que nadie lo notara hasta que un cliente
real preguntara por qué no coinciden.

Verificado con Node (sin navegador, `vm.Script` cargando config.js real):
las 39 opciones `fixed:` del `<select>` coinciden 1:1 con las claves de
`POP_FIXED_DESTINATIONS`; las 11 claves de `POP_PROVINCE_FIXED_FARES`
existen todas en `PROVINCES`; los 3 tickets corregidos coinciden con los
valores de config.js.

## 2026-07-20T01:15Z — Bug encontrado por el dueño: el fondo del popup con el logo no aparecía
El cambio de `.service-dialog::backdrop` (fondo con el logo detrás del
popup "Choose your experience") se había marcado como completo, pero el
dueño reportó "no hay fondo de nada" con captura mostrando solo el tinte
oscuro plano, sin logo. Causa: `url('img/logo.jpg')` en `css/styles.css`
— las rutas `url()` en CSS se resuelven relativas al ARCHIVO .css, no a la
raíz del proyecto como los `src`/`href` del HTML. `css/styles.css` está
dentro de `css/`, así que `img/logo.jpg` apuntaba a `css/img/logo.jpg`
(no existe) en vez de `img/logo.jpg` en la raíz. Corregido a
`url('../img/logo.jpg')`.

**Falla en mi propia verificación:** el script de auditoría de imágenes que
corrí antes de dar el trabajo por terminado SÍ revisaba `url(...)` dentro de
`css/styles.css`, pero resolvía la ruta relativa a la raíz del proyecto
(donde se ejecuta el comando), no relativa a `css/` — por eso "pasó" la
verificación aunque el navegador real habría fallado. Regla para el futuro
en este proyecto: cualquier auditoría de referencias de imagen debe resolver
las rutas `url()` de `css/styles.css` con `css/` como base, no la raíz del
proyecto — son dos sistemas de resolución de rutas distintos (HTML: relativo
al documento; CSS: relativo a la hoja de estilos) y hay que tratarlos por
separado, nunca con el mismo regex/base.

**Corrección de diseño (mismo hilo):** el pedido original "usa el logo como
fondo aqui" se interpretó como fondo del `::backdrop` (detrás del popup,
tapando la página). El dueño aclaró: quería la página de fondo COMO ANTES
(el `::backdrop` original con blur, sin tocar) y el logo como marca de agua
DENTRO de la tarjeta blanca del popup (`.service-dialog`), no detrás de
ella. Revertido `::backdrop` a `rgba(6,38,46,.55)` + `blur(3px)` (como
estaba antes de esta sesión) y movido el logo a `.service-dialog` mismo,
con un tinte del color `--shell` encima para que el texto/tarjetas sigan
legibles (opacidad, tamaño y posición del logo se afinaron varias veces
más tras esto a pedido del dueño — ver historial de la conversación, no
vale la pena loggear cada ajuste de píxeles individualmente aquí).

## 2026-07-20T01:30Z — Dominio real: sgcaribbeantransfertours.com
El dueño confirmó el dominio real. Se reemplazó el placeholder
`sarieltransfers.com` por `sgcaribbeantransfertours.com` en las 5 páginas
(`<link rel="canonical">` + Open Graph), `sitemap.xml` (5 `<loc>`) y
`robots.txt` (línea `Sitemap:`), vía `sed` global sobre esos 7 archivos
(no se tocaron los artefactos de QA en `.playwright-mcp/` ni los documentos
históricos de planificación en `DOCS/superpowers/` — son registro histórico,
no contenido vivo del sitio). `DOCS/DEPLOYMENT.md` y `DOCS/USER_MANUAL.md`
marcados como completos en sus checklists de "antes de salir en vivo".
También se detectó que `nosotros.html` solo tenía el JSON-LD de
BreadcrumbList (sin un tipo de contenido propio, a diferencia de las otras
4 páginas) — se agregó un bloque `AboutPage` para igualar el patrón.
