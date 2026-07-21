# Sariel — Landing Page (Private Transfers & Excursions, DR)

## Plan
- [x] 1. Verificar imágenes Unsplash (descarga + inspección visual) — 20 verificadas, 14 seleccionadas
- [x] 2. Definir sistema de diseño (tokens: color, tipografía, firma visual "boarding pass")
- [x] 3. Construir `index.html` (9 secciones + header/footer/FAB, SEO + JSON-LD)
- [x] 4. Construir `css/styles.css` (mobile-first, animaciones premium, reduced-motion)
- [x] 5. Construir `js/main.js` (calculadora, precios dinámicos, reveals, FAQ, contadores, parallax, WhatsApp)
- [x] 6. QA en navegador real (Playwright): desktop 1440 + móvil 390, consola limpia, interacciones y estrés
- [x] 7. Documentación (DOCS/, PROJECT_INFO.md) + memoria (decisions/lessons/patterns)

## Decisiones
- Sitio estático (HTML/CSS/JS vanilla): máxima velocidad, SEO, sin build step.
- Firma visual: tarjetas de transfer estilo "boarding pass" (mundo aeroportuario del cliente).
- Marca: "Sariel — Transfers & Excursions" (Puerto Plata, North Coast DR).
- WhatsApp/teléfono: placeholder configurable en `js/main.js` (CONFIG al inicio).
- Fotos: Unsplash hotlink (licencia libre) como placeholders premium — reemplazables.

## Plan (fase 2 — bilingüe)
- [x] 8. Sistema de traducción EN/ES: diccionario `js/i18n.js`, selector en header
- [x] 9. Migrar contenido dinámico (calculadora, WhatsApp) a claves traducibles
- [x] 10. QA en ambos idiomas (desktop + móvil), corregir bug de `&amp;` en `document.title`

## Review
**Completado 2026-07-14 17:20 UTC.** Página de 9 secciones conforme al spec.
Bugs encontrados y corregidos durante QA en vivo:
1. Grid del boarding pass (2 columnas para 3 hijos → stub en 2ª fila) → `1.6fr 2px 1fr`.
2. Franja fantasma sobre contenido móvil: capa del menú oculto seguía pintándose
   (Chrome) → `display:none` + `allow-discrete` + `@starting-style`.
3. "Book Now" partido en 2 líneas en móvil → `white-space: nowrap` en `.btn`.
4. Botón del menú móvil con texto invisible (especificidad) → `.mobile-nav a:not(.btn)`.
5. Carrera de animaciones de precio con clics rápidos → token por elemento.
6. Muescas del ticket mal posicionadas → `calc(-1.3rem - 7px)`.

Verificado: consola 0 errores/0 warnings, sin overflow horizontal en 390px,
calculadora/upgrade/duraciones correctas, wa.me con mensaje estructurado,
FAQ exclusivo accesible, contadores, estrés de interacción rápida OK.

Pendiente para publicar (dueño): número real de WhatsApp, fotos reales,
dominio real, testimonios reales (checklist en DOCS/DEPLOYMENT.md).

## Plan (fase 4 — About Us / equipo)
- [x] 11. Procesar fotos reales (`Nueva carpeta/` → `img/`): resize, EXIF/GPS fuera, orientación
- [x] 12. Sección `#about` en la home: 4 tarjetas de choferes (Leuris = placeholder monograma) + franja de flota
- [x] 13. CSS (team-grid/fleet-grid, hover con gate, reveals con stagger existente)
- [x] 14. 9 claves i18n `about.*` en EN + ES (304 totales, balanceadas)
- [x] 15. Enlace "Meet the team" en el footer de las 4 páginas
- [x] 16. QA estático + navegador (EN/ES, móvil 390, consola 0/0) + DOCS actualizados

## Review (fase 4)
**Completado 2026-07-17 ~22:20 UTC.** Sección About Us con fotos reales de
Saul, Sariel y Luis + 3 fotos de la flota Hiace; Leuris con placeholder de
marca hasta tener su foto (instrucciones de swap en DOCS/USER_MANUAL.md).
Verificado en navegador: imágenes cargan, reveals, EN↔ES en vivo, sin
overflow a 390px, consola limpia.

**Fase 2 completada 2026-07-14 17:55 UTC — bilingüe EN/ES.** Selector de
idioma en el header (EN/ES), diccionario completo en `js/i18n.js` (~150
claves), calculadora y mensajes de WhatsApp completamente traducidos y
reactivos al cambio de idioma. Bug encontrado y corregido: `document.title`
no decodifica `&amp;` (solo `innerHTML` lo hace) — corregido usando `&`
literal. Verificado en navegador real en ambos idiomas, desktop y móvil,
sin errores de consola. Detalle completo en DOCS/PROOF_OF_WORK.md.

**Fase 3 completada 2026-07-14 23:35 UTC — todos los aeropuertos/provincias.**
Calculadora ampliada a 7 aeropuertos de RD (pickup) × 32 provincias
(destination). Con 224 combinaciones posibles, se reemplazó la tabla de
precios fija por un cálculo basado en distancia real (coordenadas +
Haversine + factor de carretera). Verificado en todo el rango de precios.

**Fase 4 completada 2026-07-15 00:00 UTC — carrito de compras.** Todos los
botones "Reservar"/"Book This Experience" ahora agregan al carrito (ícono
en el header con badge) en vez de ir al formulario. El carrito persiste en
localStorage, se re-traduce en vivo, y el checkout envía UN mensaje de
WhatsApp consolidado con todos los items + fecha opcional + total. La
sección final "Solicitar Reserva" se simplificó: ya no es un formulario,
ahora es un CTA directo "Chatear por WhatsApp" para quien prefiera hablar
sin usar el carrito. Verificado exhaustivamente en navegador real, ambos
idiomas, desktop y móvil, sin errores de consola.

## Fase 5 — rebranding, precios reales y fotos (2026-07-17 ~23:30 UTC)

**Solicitado por el dueño:** nombre real de la empresa "SG Caribbean
Transfers & Tours", precios reales de transfers (POP/STI/SDQ/PUJ →
Sosúa/Cabarete/Puerto Plata), precios de City Tour/ATV/Buggies, nuevo
precio de Punta Rusia (por persona, escalonado por tamaño de grupo, incluye
bote+buffet+bebidas), nuevo texto "por qué elegirnos" (6 diferenciadores),
WhatsApp y email reales, y descargar las fotos actuales del sitio a una
carpeta con nombres descriptivos para que el dueño sepa cuál reemplazar
manualmente.

**Decisiones consultadas con el dueño antes de implementar** (afectan
dinero/arquitectura): tabla de precios fijos para las rutas populares
*junto con* la calculadora existente (no la reemplaza); City
Tour/ATV/Buggies usan el mismo widget de selector de huéspedes existente en
vez de una UI nueva; Punta Rusia elimina las opciones de 2-3 huéspedes (el
mínimo real es 4, sin inventar precios).

**Completado:**
- [x] Rebranding completo "Sariel" → "SG Caribbean Transfers & Tours" (marca)
      en las 4 páginas + `js/i18n.js`, preservando "Sariel" donde nombra al
      chofer (tarjeta del equipo, reseña).
- [x] `js/config.js`: WhatsApp real (+1 829-627-7733); footers: email real.
- [x] `transfers.html`: 8 tickets de precio fijo reemplazan los 4 de
      demostración; nuevo `kind:'fixedRoute'` en el carrito
      (`js/cart.js`/`js/calculator.js`) porque Sosúa/Cabarete no son
      provincias que la calculadora conozca.
- [x] `excursions.html`: Punta Rusia repreciada (4-6 personas,
      $123.95/persona, `data-decimals="2"`); City Tour a precio fijo $65
      hasta 6 personas; 2 tarjetas nuevas (ATV $65/persona, Buggies
      $100/persona) con el mismo patrón de las 5 existentes.
- [x] `js/core.js`: nuevo `formatMoney()` para que los centavos no se
      trunquen (495.80 no debe verse como "495.8"); `cartTotal()` redondea
      para evitar errores de punto flotante al sumar decimales.
- [x] 21 fotos descargadas a `img/` con nombres descriptivos (19 placeholders
      existentes + 2 nuevas para ATV/Buggies), todas las referencias a
      Unsplash eliminadas. El dueño ya empezó a reemplazar algunas
      manualmente en paralelo (como dijo que haría) — se corrigió una que
      quedó con el nombre de archivo incorrecto (`exc-punta-rusia.jpg`).
- [x] Verificación estática: `node --check` en todo `js/`, paridad de
      claves EN/ES (327/327), todas las rutas `img/` e `data-i18n`
      resueltas, sin restos de "Sariel" como marca ni de Unsplash.
- [x] DOCS/ actualizados (PROOF_OF_WORK, DEVELOPER_GUIDE, FOLDER_STRUCTURE,
      USER_MANUAL, DEPLOYMENT) + PROJECT_INFO.md.

**Pendiente (dueño):** terminar de reemplazar las fotos placeholder
restantes en `img/` (mismo nombre de archivo, sin tocar código); precios
reales de las 3 tarjetas de crucero; dominio real; reseñas reales; foto de
Leuris.

## Fase 6 — nombre/vuelo en el carrito, 2 tarjetas de crucero reales (2026-07-17 ~23:55 UTC)

**Solicitado:** capturar nombre y vuelo al agendar una recogida de
aeropuerto; capturar nombre al agendar una excursión; las excursiones del
crucero son City Tour y 27 Charcos de Damajagua.

**Completado:**
- [x] Carrito: nuevos campos "Nombre completo" (obligatorio) y "Número de
      vuelo" (opcional) en el drawer del carrito — uno solo para todo el
      pedido (no uno por ítem), mismo patrón que el campo de fecha
      existente. Se agregan al inicio del mensaje de WhatsApp.
- [x] `cruises.html`: `#cruise1` = 27 Charcos de Damajagua, `#cruise2` =
      Puerto Plata City Tour (mismo contenido/precio que en
      `excursions.html`); `#cruise3` queda como plantilla a pedido del
      dueño (confirmado con pregunta).
- [x] Verificación estática: sintaxis JS, paridad de claves EN/ES
      (332/332), referencias `img/` y `data-i18n` resueltas, balance de
      tags.
- [x] DOCS/ actualizados.

## Fase 7 — foto de Leuris, galería de flota ampliada, logo/favicon reales (2026-07-19 ~14:15 UTC)

**Solicitado:** la foto de Leuris no aparecía en el equipo (ya estaba en
`img/` pero el HTML seguía con el placeholder); mostrar las diferentes
Toyotas y el interior de cada una; usar `logo favicon.jpeg` como logo y
favicon de la página.

**Completado:**
- [x] Leuris: reemplazado el placeholder por su foto real; CSS muerto del
      placeholder eliminado.
- [x] Flota: de 3 a 8 fotos (1 foto de grupo + 4 vans individuales + 3
      interiores) — procesadas con el mismo pipeline de resize+EXIF de
      sesiones anteriores.
- [x] Logo/favicon reales en las 4 páginas (ícono de pestaña, header y
      footer) — recortados a círculo por CSS.
- [x] Verificación estática completa, EN/ES 337/337, DOCS/ actualizados.

## Fase 8 — inglés por defecto siempre + francés (2026-07-19 ~15:00 UTC)

**Solicitado:** la página siempre debe empezar en inglés; agregar francés a
los idiomas seleccionables.

**Completado:**
- [x] Cambiado el guardado del idioma de `localStorage` a `sessionStorage`:
      el idioma elegido se mantiene mientras se navega entre páginas en la
      misma sesión, pero cada visita nueva siempre empieza en inglés.
- [x] Traducción completa al francés (337 claves, paridad 100% con EN/ES).
- [x] Botón "FR" agregado al selector de idioma en las 4 páginas.
- [x] Verificación estática: sintaxis JS, paridad EN/ES/FR 337/337/337,
      sin restos de `localStorage` para el idioma, botón FR presente en
      las 4 páginas.
- [x] DOCS/ actualizados.

## Fase 9 — mínimo 4 personas, fechas separadas, email/WhatsApp, CTA (2026-07-19 ~15:30 UTC)

**Solicitado:** mínimo 4 personas en todas las excursiones; fecha de vuelo
y de excursión son diferentes; las reservas se pueden enviar por correo o
WhatsApp (decide el cliente); 20+ años de experiencia (antes 12); 10 mil+
viajeros felices (antes 15 mil); cambiar "Reservar" por "Cotizar".

**Completado:**
- [x] Mínimo 4 personas en las 7 tarjetas de excursión + 3 de crucero
      (antes solo Punta Rusia lo tenía); claves i18n `exc.guest2`/`guest3`
      eliminadas por quedar sin uso.
- [x] Carrito: fecha de vuelo/recogida y fecha de excursión ahora son 2
      campos separados (antes 1 solo "fecha preferida").
- [x] Nuevo botón "Enviar por Correo" junto a "Enviar por WhatsApp" en el
      carrito — mismo mensaje, el cliente elige el canal.
- [x] Estadísticas: 20+ años, 10,000+ viajeros felices.
- [x] "Reservar"/"Book Now" → "Cotizar"/"Get a Quote" en el botón principal
      del header y el CTA del hero, en los 3 idiomas.
- [x] Verificación estática completa (339/339/339, sin `data-prices` con
      claves 2/3, botones de carrito presentes en las 4 páginas).
- [x] DOCS/ actualizados (y corregidas 3 menciones desactualizadas de la
      Fase 6 sobre las tarjetas de crucero).

## Fase 10 — cantidad manual en excursiones + botón de correo en el CTA final (2026-07-19 ~16:00 UTC)

**Solicitado:** agregar la opción de escribir la cantidad de personas
manualmente en todas las excursiones; agregar "enviar por correo" también
en la sección final "Ready to explore..." (antes solo tenía WhatsApp).

**Decisión consultada:** la mayoría de las tarjetas solo tienen precio
exacto para 4 y 5 personas (no hay fórmula segura para extrapolar a 6, 8,
10...). Se preguntó al dueño y confirmó: para cantidades sin precio exacto,
mostrar "Contáctanos para cotizar" en vez de inventar un número.

**Completado:**
- [x] Campo numérico manual agregado junto a los botones de 4/5(/6)
      personas en las 10 tarjetas (7 excursiones + 3 cruceros).
- [x] Si el número escrito coincide con un precio conocido, funciona igual
      que antes. Si no, la tarjeta muestra "Contáctanos para cotizar" y el
      botón cambia a "Solicitar Cotización" — abre WhatsApp con el nombre
      de la excursión y la cantidad de personas ya escritos.
- [x] Botón "Enviar por Correo" agregado junto a "Chat on WhatsApp" en la
      sección final de las 4 páginas.
- [x] Verificación estática completa (344/344/344 en los 3 idiomas).
- [x] DOCS/ actualizados.
