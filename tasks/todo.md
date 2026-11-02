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

## Plan (fase 6 — SEO / AEO / GEO, tanda rápida)
Auditoría 2026-08-21. Se descarta `aggregateRating`/`review` en JSON-LD:
el dueño confirma que los testimonios de la home NO son reales, así que
marcarlos violaría las guidelines de Google (riesgo de acción manual).

- [x] 1. Tabla completa de tarifas fijas POP + otros aeropuertos (transfers.html)
       — 25 rutas que hoy solo existen en js/config.js (invisibles al crawler)
- [x] 2. Enriquecer TravelAgency en las 6 páginas (knowsLanguage, contactPoint,
       hasOfferCatalog, slogan) — entidad para knowledge graph / GEO
- [x] 3. TouristTrip con offers/image/description/duración (excursions + cruises)
- [x] 4. Rendimiento: width/height en las 52 imágenes + recomprimir >300 KB
       + mover GA4 debajo de title/meta
- [x] 5. Menores: 404.html, llms.txt, robots.txt con AI crawlers,
       og:image:alt, dateModified en sosua, sitemap lastmod, Person schema
- [x] 6. Verificación estática (JSON-LD parseable, i18n completo, sin enlaces rotos)
- [x] 7. Actualizar DOCS/ + PROJECT_INFO.md

## Plan (fase 7 — pendientes de la auditoría SEO)
- [x] 1. FAQ 24/7 visible en index.html (acordeón + FAQPage + 3 idiomas)
       — el schema afirmaba 24/7 sin que la página lo dijera
- [x] 2. Resincronizar el FAQPage de index.html con las respuestas visibles
       (invariante #2 rota: 5 de 5 respuestas divergían)
- [x] 3. Breadcrumbs visibles en las 5 páginas que ya tenían BreadcrumbList
- [x] 4. cabarete.html — segundo hub de destino, generado desde sosua.html
       (152 claves × 3 idiomas, 5 bloques JSON-LD, sitemap, llms.txt, footer)
- [x] 5. Suite de verificación ampliada: ahora cubre las 4 invariantes
       del DEVELOPER_GUIDE (37 checks, 0 fallos)
- [x] 6. Cabarete sin distancias (decisión del dueño 2026-08-21): 36 claves
       reescritas ×3, 36 eliminadas, tabla de 5 a 3 columnas, 2 FAQs reformuladas
- [ ] 7. 4 hubs restantes — YA NO BLOQUEADO por distancias: el patrón
       "describir el lugar, no medirlo" quita esa dependencia. Solo hacen falta
       tarifas, y las que falten van como "On request"
- [ ] 8. Multiidioma real (/es/, /fr/ + hreflang) — decisión del dueño
- [ ] 9. sameAs: URLs de Facebook y TripAdvisor
- [ ] 10. Foto real de Cabarete para el hero

## Plan (fase 8 — los 4 hubs restantes)
- [x] 1. puerto-plata.html (POP US$38.95) — ciudad del aeropuerto y de los muelles
- [x] 2. cofresi.html (POP US$48.50) — Ocean World, Costambar
- [x] 3. rio-san-juan.html (POP US$98.50) — laguna Gri-Gri, Playa Grande
- [x] 4. las-terrenas.html (POP US$178.50) — dice abiertamente que NO cabe
       en una escala de crucero de Puerto Plata
- [x] 5. Footer: columna "Destinations" con los 6 hubs en las 11 páginas + CSS a 5 columnas
- [x] 6. sitemap.xml a 11 URLs, llms.txt con sección de destinos
- [x] 7. Verificación: 47 checks, 0 fallos (las 4 invariantes cubiertas)
- [ ] 8. Tarifas STI/AZS/SDQ/PUJ a los 5 destinos — 20 celdas "On request"
       esperando números del dueño. Prioridad: AZS → Las Terrenas
- [ ] 9. Fotos reales de Cabarete, Cofresí, Río San Juan y Las Terrenas
- [x] 10. Multiidioma real (/es/, /fr/ + hreflang) — hecho el 2026-08-22
- [ ] 11. sameAs: URLs de Facebook y TripAdvisor

## Plan (fase 9 — fotos reales de los heroes, 2026-08-22)
- [x] 1. 4 fotos del dueño instaladas: puerto-plata, cabarete, rio-san-juan, las-terrenas
- [x] 2. Normalizadas: nombres con guiones (sin %20) + JPEG (og:image seguro) + ≤1800px q82
- [x] 3. Por página: hero <img>, og:image/alt/width/height y 2 nodos JSON-LD
- [x] 4. Alt reescritos: ahora sí pueden nombrar el lugar porque es cierto
- [x] 5. Foto de Cofresí instalada el 2026-08-22 (venía espejada, se volteó)
- [ ] 6. Encuadre: cabarete.jpg es 3.2 de ratio (recorte fuerte en móvil);
       puerto-plata.jpg es vertical y solo 1080px de ancho

## Plan (fase 10 — foto de Cofresí + altura del hero, 2026-08-22)
- [x] 1. img/cofresi.jpg: aérea de Ocean World, des-espejada, 1600x1200 q82
- [x] 2. cofresi.html: hero, og:image x4, 2 nodos JSON-LD, dateModified, comentario
- [x] 3. .hero acotado a min(100svh, 50rem) — menos ampliado en pantallas altas
- [x] 4. Paso móvil (<600px): altura la marca el texto, padding reducido
- [x] 5. Bug propio corregido: el @media iba encima de .hero-content y perdía
- [x] 6. Medido: en móvil escala <=1.08x en todas (antes hasta 1.68x)
- [x] 7. Cabarete reencuadrada con object-position 24% (el rider entra en movil)

## Plan (fase 11 — AZS fuera de Las Terrenas + multiidioma real, 2026-08-22)
- [x] 1. las-terrenas.html: fila AZS, dato de aeropuerto, entradilla, nota y Service
- [x] 2. FAQ 10 -> 9 preguntas, renumeradas; FAQPage regenerado desde el HTML visible
- [x] 3. AZS intacto en el resto del sitio (config.js confirma AZS -> Sosua 148.50)
- [x] 4. tools/build-langs.py: renderiza /es/ y /fr/ desde el diccionario existente
- [x] 5. hreflang reciproco + canonical propio + og:locale en las 33 paginas
- [x] 6. JSON-LD: WebPage y Breadcrumb siguen al idioma; las entidades no
- [x] 7. Selector de idioma = enlaces reales; el idioma lo decide <html lang>
- [x] 8. tools/verify.py: 24 comprobaciones sobre 34 paginas, 3 idiomas
- [x] 9. Idempotencia verificada: tres pasadas, archivos identicos
- [x] 10. alt de imagenes y og:image:alt traducidos (41 claves x 3 idiomas)
- [ ] 11. sameAs: URLs de Facebook y TripAdvisor (pendiente del dueno)

## Plan (fase 12 — alt de imagenes en tres idiomas, 2026-08-22)
- [x] 1. 41 claves alt.* x 3 idiomas en js/i18n.js (82 cadenas nuevas)
- [x] 2. 45 <img> y 11 og:image:alt marcados con data-i18n-attr
- [x] 3. Una clave por imagen: 78 etiquetas -> 41 cadenas
- [x] 4. og:image:alt reutiliza la clave de la imagen a la que apunta
- [x] 5. Decorativas (logo, cta-band) siguen con alt="" y sin clave
- [x] 6. verify.py: invariante #1 cubre atributos (669) y alt sin clave
- [x] 7. es/ y fr/ regeneradas; 26 comprobaciones, 0 fallos

## Plan (fase 13 — tarifas STI/SDQ/PUJ a los cinco hubs, 2026-08-22)
- [x] 1. config.js: OTHER_AIRPORT_FIXED_FARES de 5 a 17 tarifas
- [x] 2. transfers.html#fares: tabla de otros aeropuertos regenerada (5 -> 17 filas)
- [x] 3. 12 celdas "On request" pasan a precio en los 5 hubs
- [x] 4. Service JSON-LD: descripcion + una Offer por tarifa nueva
- [x] 5. Las 5 notas al pie reescritas x 3 idiomas (nombran las que quedan)
- [x] 6. llms.txt: tabla + parrafos de Cabarete y Las Terrenas
- [x] 7. verify.py: filas esperadas derivadas de config.js, no fijas en 30
- [x] 8. Calculadora verificada en Node: 12 dan precio, 6 caen a cotizacion
- [x] 9. STI -> Rio San Juan y STI -> Las Terrenas: on request definitivo (dueno, 2026-08-22)
- [x] 10. Las 4 tarifas desde Samana (AZS): on request definitivo (dueno, 2026-08-22)

## Plan (fase 14 — cierre de tarifas y encuadre, 2026-08-22)
- [x] 1. Las 6 celdas restantes pasan a politica declarada, no a deuda
- [x] 2. Documentado: no rellenarlas por patron, solo con precio del dueno
- [x] 3. cabarete.jpg: object-position 24% — el kitesurfista entra en movil
- [x] 4. Medido antes/despues en movil, portatil y escritorio
- [x] 5. Documentado que las-terrenas.jpg no se arregla por encuadre
- [ ] 6. sameAs: URLs de Facebook y TripAdvisor (unico pendiente del dueno)

## 2026-11-01 — Conversión de Google Ads
- [x] Medir WhatsApp y correo con `SG - Solicitud de reserva`
- [x] Probar en navegador con Formspree y wa.me simulados
- [x] Actualizar DOCS y memoria
- [x] Publicar en `master`
- [ ] Confirmar la conversión con un clic real desde producción
- [x] Página de privacidad y aviso de cookies en 3 idiomas
- [ ] Revisar la política de privacidad con el dueño
- [ ] Confirmar el aviso desde una conexión real en la UE o Reino Unido

**Revisión:** cada envío válido suma una conversión; los inválidos y fallidos, ninguna.

## 2026-11-02 — Chofer todo el día
- [x] Sección `#full-day-driver` en `transfers.html`, en EN/ES/FR
- [x] Botón de cotización por WhatsApp o correo, sin carrito
- [x] Describir el servicio en `llms.txt`
- [x] Corregir el doble clic que cerraba el diálogo de contacto
- [x] Probar en navegador con Google y Formspree bloqueados o simulados
- [x] Actualizar DOCS y memoria
- [ ] Publicar en `master`, cuando se pida
- [x] Corregir el redondeo de la calculadora: mostraba 39 para US$38.95
- [x] Agregar PayPal, Cash App y Zelle en los 3 idiomas, JSON-LD, `llms.txt` y privacidad
- [ ] Confirmar que se acepta Zelle: el pedido decía "zeller"
- [x] City Tour a US$20 por persona (80/100/120) en excursiones y cruceros
- [x] Quitar el teleférico del City Tour

**Revisión:** `tools/verify.py` da TODO OK. La sección funciona en los 3 idiomas, en escritorio y en móvil. Las 126 combinaciones probadas de la calculadora coinciden con `js/config.js`.
