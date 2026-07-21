/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: cart.js
   Purpose: cart state + panel + checkout (WhatsApp or email, visitor's choice).
   - Collects transfer/excursion requests across the page, persists them,
     and sends one consolidated message via whichever checkout button the
     visitor picks.
   - Items store raw ids (not rendered text) so everything the cart needs
     (AIRPORTS/PROVINCES/VEHICLES/estimateRoute/t) re-renders correctly
     after a language switch instead of going stale.
   Depends on: config.js (AIRPORTS/PROVINCES/VEHICLES/estimateRoute,
   LUGGAGE_FREE_LIMIT/LUGGAGE_EXTRA_FEE_USD), core.js (formatDuration,
   whatsappLink, emailLink), i18n.js (t()).
   ============================================================ */

'use strict';

const CART_STORAGE_KEY = 'sariel-cart';

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

/** Persiste el carrito con su versión de esquema. */
function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: CART_VERSION, items: cartItems }));
}

/**
 * Adds an item to the cart and re-renders the panel.
 * @param {Object} item One of {kind:'transfer', pickupKey, destKey, vehicleId, passengers},
 *                       {kind:'excursion', serviceKey, guests, price} or
 *                       {kind:'fixedRoute', fromKey, toKey, price}.
 * @returns {void}
 */
function addToCart(item) {
  const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  cartItems.push({ id, ...item });
  saveCart();
  renderCart();
}

/**
 * Removes one item from the cart by id and re-renders.
 * @param {string} id
 * @returns {void}
 */
function removeFromCart(id) {
  cartItems = cartItems.filter((item) => item.id !== id);
  saveCart();
  renderCart();
}

/** Empties the cart and re-renders. */
function clearCart() {
  cartItems = [];
  saveCart();
  renderCart();
}

/**
 * Resolves a cart item into display strings/price in the active language.
 * Transfer prices are recomputed from live constants (never go stale);
 * excursion and fixedRoute prices are snapshotted at add-time (not formula-derived).
 * @param {Object} item
 * @returns {{title:string, meta:string, price:number}}
 */
function describeCartItem(item) {
  if (item.kind === 'transfer') {
    const airport = AIRPORTS[item.pickupKey];
    const province = PROVINCES[item.destKey];
    const vehicle = VEHICLES.find((v) => v.id === item.vehicleId) || VEHICLES[0];
    const route = estimateRoute(airport, province);
    return {
      title: `${t(airport.nameKey)} → ${t(province.nameKey)}`,
      meta: `${t(vehicle.labelKey)} · ${t('cart.passengers', { n: item.passengers })} · ${formatDuration(route.minutes)}`,
      price: route.price + vehicle.surcharge,
    };
  }
  if (item.kind === 'fixedRoute') {
    // passengers is only set by the calculator's own reserve button (see
    // js/calculator.js) — Popular Routes ticket-rail adds have no passenger
    // input and stay flat "up to 6", so item.passengers is undefined there.
    const meta = item.passengers > FIXED_FARE_PAX_INCLUDED
      ? t('cart.passengers', { n: item.passengers })
      : t('routes.upTo6');
    return {
      title: `${t(item.fromKey)} → ${t(item.toKey)}`,
      meta,
      price: item.price,
    };
  }
  if (item.kind === 'excursion') {
    // Cruise cards optionally capture ship name + departure time (see
    // js/tours.js); when present they're appended to the guest-count meta
    // line so they surface in the cart panel and the WhatsApp message.
    let meta = t(`exc.guest${item.guests}`);
    if (item.shipName) meta += ` · ${item.shipName}`;
    if (item.departureTime) meta += ` · ${t('cruise.departsAt')} ${item.departureTime}`;
    return {
      title: t(item.titleKey || item.serviceKey),
      meta,
      price: item.price,
    };
  }
  return { title: '', meta: '', price: 0 };
}

/** @returns {number} Sum of every cart item's current price. */
function cartTotal() {
  const sum = cartItems.reduce((total, item) => total + describeCartItem(item).price, 0);
  return Math.round(sum * 100) / 100; // guards against float drift (e.g. 23.95 + 33.95)
}

/** @returns {number} Suitcase count from the checkout field (0 if empty/invalid). */
function getLuggageCount() {
  const input = document.getElementById('cartLuggage');
  const n = input ? parseInt(input.value, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** @returns {number} Flat surcharge when luggage exceeds LUGGAGE_FREE_LIMIT, else 0. */
function luggageFee() {
  return getLuggageCount() > LUGGAGE_FREE_LIMIT ? LUGGAGE_EXTRA_FEE_USD : 0;
}

/** Rebuilds the cart panel's DOM from the current cartItems state. */
function renderCart() {
  const list = document.getElementById('cartItems');
  if (!list) return;
  const empty = document.getElementById('cartEmpty');
  const badge = document.getElementById('cartBadge');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('cartCheckout');

  badge.textContent = String(cartItems.length);
  badge.hidden = cartItems.length === 0;
  empty.hidden = cartItems.length !== 0;
  checkoutBtn.disabled = cartItems.length === 0;

  list.innerHTML = cartItems
    .map((item) => {
      const { title, meta, price } = describeCartItem(item);
      return `<div class="cart-item" data-id="${item.id}">
        <div class="cart-item-info">
          <p class="cart-item-title">${title}</p>
          <p class="cart-item-meta">${meta}</p>
        </div>
        <div class="cart-item-actions">
          <p class="cart-item-price">US$${formatMoney(price)}</p>
          <button type="button" class="cart-item-remove" data-remove-id="${item.id}" aria-label="${t('cart.remove')}">×</button>
        </div>
      </div>`;
    })
    .join('');

  totalEl.textContent = `US$${formatMoney(cartTotal() + luggageFee())}`;
}

/** Opens the cart drawer. */
function openCart() {
  const panel = document.getElementById('cartPanel');
  const scrim = document.getElementById('cartScrim');
  const toggle = document.getElementById('cartToggle');
  if (!panel) return;
  panel.classList.add('is-open');
  scrim.classList.add('is-visible');
  toggle.setAttribute('aria-expanded', 'true');
}

/** Closes the cart drawer. */
function closeCart() {
  const panel = document.getElementById('cartPanel');
  const scrim = document.getElementById('cartScrim');
  const toggle = document.getElementById('cartToggle');
  if (!panel) return;
  panel.classList.remove('is-open');
  scrim.classList.remove('is-visible');
  toggle.setAttribute('aria-expanded', 'false');
}

/**
 * Builds the consolidated booking message for every item in the cart —
 * shared by both checkout paths (WhatsApp and email, see initCart).
 * @param {Object} details
 * @param {string} details.name          Traveler's full name (required — see initCart).
 * @param {string} details.flight        Optional flight number (airport pickups).
 * @param {string} details.flightDate    Optional flight/pickup date (YYYY-MM-DD).
 * @param {string} details.excursionDate Optional excursion date (YYYY-MM-DD) — kept
 *   separate from flightDate since a cart can hold both a transfer and an
 *   excursion on different days.
 * @returns {string}
 */
function buildCartMessage({ name, flight, flightDate, excursionDate }) {
  const lines = [t('whatsapp.greeting'), '', `${t('whatsapp.labelName')}: ${name}`];
  if (flight) lines.push(`${t('whatsapp.labelFlight')}: ${flight}`);
  cartItems.forEach((item, i) => {
    const { title, meta, price } = describeCartItem(item);
    lines.push('', `${i + 1}) ${title}`, meta, `US$${formatMoney(price)}`);
  });
  const luggageCount = getLuggageCount();
  const fee = luggageFee();
  if (luggageCount > 0) lines.push('', `${t('whatsapp.labelLuggage')}: ${luggageCount}`);
  if (fee > 0) lines.push(t('whatsapp.luggageFeeLine', { fee: formatMoney(fee) }));
  lines.push('', `${t('cart.total')}: US$${formatMoney(cartTotal() + fee)}`);
  if (flightDate) lines.push(`${t('whatsapp.labelFlightDate')}: ${flightDate}`);
  if (excursionDate) lines.push(`${t('whatsapp.labelExcursionDate')}: ${excursionDate}`);
  return lines.join('\n');
}

/* ============================================================
   Cart panel: open/close, remove items, checkout → WhatsApp
   ============================================================ */
(function initCart() {
  const toggle = document.getElementById('cartToggle');
  const panel = document.getElementById('cartPanel');
  if (!toggle || !panel) return;

  const closeBtn = document.getElementById('cartClose');
  const scrim = document.getElementById('cartScrim');
  const list = document.getElementById('cartItems');
  const checkoutBtn = document.getElementById('cartCheckout');
  const checkoutEmailBtn = document.getElementById('cartCheckoutEmail');
  const nameInput = document.getElementById('cartName');
  const flightInput = document.getElementById('cartFlight');
  const flightDateInput = document.getElementById('cartFlightDate');
  const excursionDateInput = document.getElementById('cartExcursionDate');
  const luggageInput = document.getElementById('cartLuggage');

  // Past dates make no sense for a transfer/excursion.
  const today = new Date().toISOString().split('T')[0];
  flightDateInput.min = today;
  excursionDateInput.min = today;

  // Luggage count isn't a cart item — recompute the displayed total (which
  // folds in the >10-bag surcharge) whenever it changes.
  luggageInput.addEventListener('input', renderCart);

  toggle.addEventListener('click', () => {
    if (panel.classList.contains('is-open')) closeCart();
    else openCart();
  });
  closeBtn.addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('is-open')) closeCart();
  });

  // Event delegation: item rows are re-rendered on every change, so a
  // single listener on the (stable) container avoids re-binding per row.
  list.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('[data-remove-id]');
    if (removeBtn) removeFromCart(removeBtn.dataset.removeId);
  });

  /**
   * Validates the required name field before checkout, focusing and
   * reporting it if empty. Shared by both checkout paths.
   * @returns {boolean} True if the cart is ready to send.
   */
  function canCheckout() {
    if (!cartItems.length) return false;
    if (!nameInput.value.trim()) {
      nameInput.setCustomValidity(t('cart.nameRequired'));
      nameInput.reportValidity();
      nameInput.setCustomValidity('');
      nameInput.focus();
      return false;
    }
    return true;
  }

  /** @returns {Object} Current traveler details, read fresh from the form. */
  function readCheckoutDetails() {
    return {
      name: nameInput.value.trim(),
      flight: flightInput.value.trim(),
      flightDate: flightDateInput.value,
      excursionDate: excursionDateInput.value,
    };
  }

  checkoutBtn.addEventListener('click', () => {
    if (!canCheckout()) return;
    window.open(whatsappLink(buildCartMessage(readCheckoutDetails())), '_blank', 'noopener');
    clearCart();
    closeCart();
  });

  checkoutEmailBtn.addEventListener('click', () => {
    if (!canCheckout()) return;
    window.location.href = emailLink(t('email.subject'), buildCartMessage(readCheckoutDetails()));
    clearCart();
    closeCart();
  });

  document.addEventListener('sariel:langchange', renderCart);

  renderCart();
})();
