/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: config.js
   Purpose: business configuration + route pricing data/model.
   - WhatsApp contact number + Formspree endpoint
   - Airport / province coordinate + label data
   - Vehicle tiers and pricing constants
   - Distance/price/duration estimation (haversineKm, estimateRoute)
   No dependencies.
   ============================================================ */

'use strict';

/* ---------- Configuration (edit these for the business) ---------- */
const CONFIG = {
  // WhatsApp number in international format, digits only.
  whatsappNumber: '18296277733',
  // Formspree endpoint for the cart's "Send via Email" checkout and the
  // "Email Us" contact dialog (js/cart.js, js/shell.js, submitBookingEmail()
  // in js/core.js) — delivers straight to the owner's inbox without opening
  // the visitor's own mail client. Dashboard: https://formspree.io/forms.
  // The 5 footers' mailto: links are separate static HTML with the contact
  // email hardcoded — update those too if it ever changes, see
  // DOCS/USER_MANUAL.md.
  formspreeEndpoint: 'https://formspree.io/f/xbdnzrez',
};

/* Every DR international airport, keyed by <select> value. Coordinates are
   approximate airport locations, used only to estimate route distance —
   nameKey resolves to a display name via t() (js/i18n.js). */
const AIRPORTS = {
  pop: { code: 'POP', nameKey: 'place.pop', lat: 19.7579, lng: -70.5700 },
  sti: { code: 'STI', nameKey: 'place.sti', lat: 19.4061, lng: -70.6047 },
  sdq: { code: 'SDQ', nameKey: 'place.sdq', lat: 18.4297, lng: -69.6689 },
  puj: { code: 'PUJ', nameKey: 'place.puj', lat: 18.5601, lng: -68.3725 },
  azs: { code: 'AZS', nameKey: 'place.azs', lat: 19.2670, lng: -69.7419 },
  lrm: { code: 'LRM', nameKey: 'place.lrm', lat: 18.4507, lng: -68.9111 },
  brx: { code: 'BRX', nameKey: 'place.brx', lat: 18.2411, lng: -71.1219 },
};

/* All 31 provinces + the National District, keyed by <select> value.
   Coordinates approximate each province's capital/main city. code is a
   short boarding-pass-style label — provinces that host one of our
   airports reuse that airport's code on purpose. */
const PROVINCES = {
  'distrito-nacional':      { code: 'SDQ', nameKey: 'province.distritoNacional',    lat: 18.4861, lng: -69.9312 },
  'azua':                   { code: 'AZU', nameKey: 'province.azua',               lat: 18.4539, lng: -70.7351 },
  'bahoruco':               { code: 'BAH', nameKey: 'province.bahoruco',           lat: 18.4763, lng: -71.4183 },
  'barahona':               { code: 'BAR', nameKey: 'province.barahona',           lat: 18.2085, lng: -71.1000 },
  'dajabon':                { code: 'DAJ', nameKey: 'province.dajabon',            lat: 19.5477, lng: -71.7089 },
  'duarte':                 { code: 'DUA', nameKey: 'province.duarte',             lat: 19.3008, lng: -70.2540 },
  'elias-pina':             { code: 'ELI', nameKey: 'province.eliasPina',          lat: 18.8756, lng: -71.6989 },
  'el-seibo':               { code: 'SEI', nameKey: 'province.elSeibo',            lat: 18.7686, lng: -69.0389 },
  'espaillat':              { code: 'ESP', nameKey: 'province.espaillat',          lat: 19.3961, lng: -70.5269 },
  'hato-mayor':             { code: 'HAT', nameKey: 'province.hatoMayor',          lat: 18.7601, lng: -69.2544 },
  'hermanas-mirabal':       { code: 'MIR', nameKey: 'province.hermanasMirabal',    lat: 19.3833, lng: -70.4167 },
  'independencia':          { code: 'IND', nameKey: 'province.independencia',      lat: 18.4922, lng: -71.8567 },
  'la-altagracia':          { code: 'ALT', nameKey: 'province.laAltagracia',       lat: 18.6141, lng: -68.7078 },
  'la-romana':              { code: 'LRM', nameKey: 'province.laRomana',           lat: 18.4273, lng: -68.9728 },
  'la-vega':                { code: 'VEG', nameKey: 'province.laVega',             lat: 19.2222, lng: -70.5292 },
  'maria-trinidad-sanchez': { code: 'MTS', nameKey: 'province.mariaTrinidadSanchez', lat: 19.3831, lng: -69.8461 },
  'monsenor-nouel':         { code: 'NOU', nameKey: 'province.monsenorNouel',      lat: 18.9375, lng: -70.4092 },
  'monte-cristi':           { code: 'MTC', nameKey: 'province.monteCristi',        lat: 19.8514, lng: -71.6467 },
  'monte-plata':            { code: 'MPL', nameKey: 'province.montePlata',         lat: 18.8083, lng: -69.7833 },
  'pedernales':             { code: 'PED', nameKey: 'province.pedernales',         lat: 18.0381, lng: -71.7442 },
  'peravia':                { code: 'PER', nameKey: 'province.peravia',            lat: 18.2792, lng: -70.3319 },
  'puerto-plata':           { code: 'POP', nameKey: 'province.puertoPlata',        lat: 19.7934, lng: -70.6884 },
  'samana':                 { code: 'AZS', nameKey: 'province.samana',             lat: 19.2058, lng: -69.3364 },
  'san-cristobal':          { code: 'SCR', nameKey: 'province.sanCristobal',       lat: 18.4167, lng: -70.1000 },
  'san-jose-de-ocoa':       { code: 'OCO', nameKey: 'province.sanJoseDeOcoa',      lat: 18.5433, lng: -70.5058 },
  'san-juan':               { code: 'SJN', nameKey: 'province.sanJuan',            lat: 18.8058, lng: -71.2295 },
  'san-pedro-de-macoris':   { code: 'SPM', nameKey: 'province.sanPedroDeMacoris',  lat: 18.4539, lng: -69.3082 },
  'sanchez-ramirez':        { code: 'SRA', nameKey: 'province.sanchezRamirez',     lat: 19.0567, lng: -70.1553 },
  'santiago':               { code: 'STI', nameKey: 'province.santiago',           lat: 19.4517, lng: -70.6970 },
  'santiago-rodriguez':     { code: 'STR', nameKey: 'province.santiagoRodriguez',  lat: 19.4756, lng: -71.3453 },
  'santo-domingo':          { code: 'SDO', nameKey: 'province.santoDomingo',       lat: 18.5001, lng: -69.8600 },
  'valverde':               { code: 'VAL', nameKey: 'province.valverde',           lat: 19.5511, lng: -71.0894 },
};

/* Vehicle tiers: capacity and surcharge added to the route base price.
   Order matters — smallest suitable vehicle is recommended first. */
const VEHICLES = [
  { id: 'car',     labelKey: 'vehicle.car',     capacity: 3,  surcharge: 0 },
  { id: 'minivan', labelKey: 'vehicle.minivan', capacity: 6,  surcharge: 15 },
  { id: 'van',     labelKey: 'vehicle.van',     capacity: 10, surcharge: 30 },
  { id: 'minibus', labelKey: 'vehicle.minibus', capacity: 15, surcharge: 55 },
];

/* Pricing model: with 7 airports × 32 provinces (224 possible routes), a
   hardcoded price table isn't maintainable — instead we estimate from
   straight-line distance, adjusted for winding roads, at a flat rate. */
const PRICE_BASE_USD = 18;
const PRICE_PER_KM_USD = 0.75;
const ROAD_WINDING_FACTOR = 1.35; // real DR roads vs. straight-line distance
const AVG_ROAD_SPEED_KMH = 55;    // blended highway/mountain/city average

/* Luggage surcharge: standard vehicles fit up to 10 bags without a trailer.
   Above that, cart.js adds one flat fee (not per extra bag) — see
   buildCartMessage()/cartTotal() in js/cart.js. */
const LUGGAGE_FREE_LIMIT = 10;
const LUGGAGE_EXTRA_FEE_USD = 15;

/* Fixed one-way fares FROM Puerto Plata Airport (POP) ONLY — owner-confirmed
   real prices (2026-07-21), not calculator-estimated. Covers up to
   FIXED_FARE_PAX_INCLUDED passengers regardless of vehicle (matches the
   source price sign's "1 to 6 person" note); calculator.js disables the
   vehicle select whenever one of these is the active destination and adds
   FIXED_FARE_EXTRA_PAX_FEE_USD per passenger beyond that count.
   - POP_PROVINCE_FIXED_FARES overrides estimateRoute()'s formula price for
     an existing PROVINCES entry, keyed by its slug (e.g. a same-city hop
     like POP→Puerto Plata has a real confirmed price, not a distance guess).
   - POP_FIXED_DESTINATIONS covers everything else: towns/resorts too
     fine-grained to be their own province, PLUS Sosúa/Cabarete (already
     used by the Popular Routes ticket rail — nameKey points at their
     existing place.* i18n keys instead of a literal name). Selectable in
     the calculator's Destination dropdown as `fixed:<slug>`. */
const FIXED_FARE_PAX_INCLUDED = 6;
const FIXED_FARE_EXTRA_PAX_FEE_USD = 5;

/**
 * Flat fixed-fare price plus the extra-passenger surcharge — shared by
 * js/calculator.js (building the boarding pass / cart item) and js/cart.js
 * (recomputing a fixedRoute item's price when the visitor edits its
 * passenger count in the cart), so the two never drift into charging
 * different amounts for the same passenger count.
 * @param {number} basePrice Flat price covering up to FIXED_FARE_PAX_INCLUDED.
 * @param {number} pax       Passenger count.
 * @returns {number} Base price plus FIXED_FARE_EXTRA_PAX_FEE_USD per passenger over the included count.
 */
function fixedFarePrice(basePrice, pax) {
  const extraPax = Math.max(0, pax - FIXED_FARE_PAX_INCLUDED);
  return basePrice + extraPax * FIXED_FARE_EXTRA_PAX_FEE_USD;
}

/**
 * Flat surcharge once a suitcase count exceeds LUGGAGE_FREE_LIMIT — shared
 * by the cart's whole-order luggage field (js/cart.js) and a single
 * fixedRoute transfer's own luggage count (js/calculator.js), same
 * threshold/fee either way.
 * @param {number} count Suitcase count.
 * @returns {number} LUGGAGE_EXTRA_FEE_USD if count exceeds the free limit, else 0.
 */
function luggageSurcharge(count) {
  return count > LUGGAGE_FREE_LIMIT ? LUGGAGE_EXTRA_FEE_USD : 0;
}

const POP_PROVINCE_FIXED_FARES = {
  'barahona': 298.50,
  'dajabon': 198.50,
  'la-vega': 108.50,
  'puerto-plata': 38.95,
  'samana': 178.50,
  'san-pedro-de-macoris': 218.50,
  'santiago': 98.50,
  'santo-domingo': 198.50,
  'valverde': 148.50,
  'monte-cristi': 178.50,
};

const POP_FIXED_DESTINATIONS = {
  'sosua': { nameKey: 'place.sosua', price: 23.95 },
  'cabarete': { nameKey: 'place.cabarete', price: 28.95 },
  'bahia-principe': { name: 'Bahía Príncipe', price: 78.50 },
  'blue-lagoon': { name: 'Blue Lagoon', price: 118.50 },
  'blue-moon': { name: 'Blue Moon', price: 28.50 },
  'boca-chica': { name: 'Boca Chica', price: 198.50 },
  'bonao': { name: 'Bonao', price: 128.50 },
  'cabrera': { name: 'Cabrera', price: 98.50 },
  'casa-linda': { name: 'Casa Linda', price: 8.50 },
  'castillo-la-isabela': { name: 'Castillo La Isabela', price: 128.50 },
  'coconut-palms': { name: 'Coconut Palms', price: 10.50 },
  'cofresi-costambar': { name: 'Cofresí · Costambar', price: 48.50 },
  'damajagua': { name: 'Damajagua', price: 98.50 },
  'gaspar-hernandez': { name: 'Gaspar Hernández', price: 28.50 },
  'hacienda-el-choco': { name: 'Hacienda el Choco', price: 13.50 },
  'hide-away-beach': { name: 'Hide Away Beach', price: 10.50 },
  'higuey': { name: 'Higüey', price: 398.50 },
  'jamao': { name: 'Jamao', price: 33.50 },
  'juan-dolio': { name: 'Juan Dolio', price: 218.50 },
  'la-cumbre-moca': { name: 'La Cumbre (Moca)', price: 58.50 },
  'la-galera': { name: 'La Galera', price: 198.50 },
  'las-terrenas': { name: 'Las Terrenas', price: 178.50 },
  'la-union': { name: 'La Unión', price: 18.50 },
  'luperon': { name: 'Luperón', price: 98.50 },
  'nagua': { name: 'Nagua', price: 118.50 },
  'playa-dorada': { name: 'Playa Dorada', price: 28.50 },
  'playa-grande': { name: 'Playa Grande', price: 98.50 },
  'playa-laguna': { name: 'Playa Laguna', price: 8.50 },
  'perla-marina': { name: 'Perla Marina', price: 10.50 },
  'punta-cana': { name: 'Punta Cana', price: 398.50 },
  'punta-rusia': { name: 'Punta Rusia', price: 198.50 },
  'rio-san-juan': { name: 'Río San Juan', price: 98.50 },
  'rio-merengue': { name: 'Río Merengue', price: 48.50 },
  'sabaneta': { name: 'Sabaneta', price: 18.50 },
  'san-francisco': { name: 'San Francisco', price: 128.50 },
  'sanchez': { name: 'Sánchez', price: 148.50 },
  'sea-horse-ranch': { name: 'Sea Horse Ranch', price: 10.50 },
  'celuisma': { name: 'Celuisma', price: 16.50 },
  'villa-caribick': { name: 'Villa Caribick', price: 8.50 },
};

/* Confirmed fixed fares FROM airports other than Puerto Plata (POP) — owner-
   confirmed real prices, mirroring the non-POP tickets already on the
   Popular Routes rail (transfers.html). Keyed by pickup airport code, then
   by the same destination-value format the calculator's Destination select
   uses: `fixed:<slug>` for a POP_FIXED_DESTINATIONS entry (reused here only
   for its name/nameKey — the price below always wins over that entry's POP
   price), or a bare PROVINCES slug. Airports with no entry here (LRM, BRX)
   have no confirmed routes yet — calculator.js shows a "request a quote"
   state instead of guessing a price for them. */
const OTHER_AIRPORT_FIXED_FARES = {
  sti: { 'fixed:sosua': 98.50, 'fixed:cabarete': 98.95 },
  sdq: { 'fixed:sosua': 198.50 },
  azs: { 'fixed:sosua': 148.50 },
  puj: { 'fixed:sosua': 425 },
};

/**
 * Great-circle distance between two coordinates (Haversine formula).
 * @param {number} lat1 @param {number} lng1 @param {number} lat2 @param {number} lng2
 * @returns {number} Distance in kilometers.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimates one-way price (USD, up to 3 guests) and duration (minutes)
 * between an airport and a province from their coordinates.
 * @param {{lat:number,lng:number}} airport
 * @param {{lat:number,lng:number}} province
 * @returns {{price:number, minutes:number}}
 */
function estimateRoute(airport, province) {
  const roadKm = haversineKm(airport.lat, airport.lng, province.lat, province.lng) * ROAD_WINDING_FACTOR;
  const price = Math.max(20, Math.ceil((PRICE_BASE_USD + roadKm * PRICE_PER_KM_USD) / 5) * 5);
  const minutes = Math.max(15, Math.round((roadKm / AVG_ROAD_SPEED_KMH) * 60 / 5) * 5);
  return { price, minutes };
}
