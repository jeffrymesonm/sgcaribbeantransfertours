/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: cart.js
   Purpose: cart state + panel + per-item trip details + checkout.
   - Collects transfer/excursion requests across the page, persists them,
     and sends one consolidated message via whichever channel the visitor
     picks in a 2-step checkout: step 1 (#cartChannelStep) is just the
     WhatsApp/Email choice, step 2 (#cartDetailsStep) then asks only for the
     name (+ email for the email path) and sends. WhatsApp opens wa.me in a
     new tab; email submits to Formspree in the background (see
     submitBookingEmail in core.js) and shows an inline status message.
   - Trip details live PER ITEM, edited inline in each cart row (not in the
     checkout footer): every transfer/fixedRoute row has its own flight
     number, flight/pickup date and suitcase count; every excursion row has
     its own excursion date. A cart can hold two transfers on different days
     with different flights, so one shared set of fields would be wrong.
   - Quantity is editable per row too (stepperHtml/changeItemQty): an
     excursion's guest count (clamped to the keys its own snapshotted
     `prices` map has an exact rate for, carried from js/tours.js) and a
     fixedRoute's passenger count (recomputed via fixedFarePrice() using its
     `baseFare`). Luggage is per item: each transfer with more than
     LUGGAGE_FREE_LIMIT bags adds one flat luggageSurcharge() to ITS OWN
     price (each vehicle needs its own trailer), folded in by describeCartItem
     so the total is just the sum of item prices — there is no cart-level
     luggage fee anymore.
   - Items store raw ids/base fares (not rendered text or final prices) so
     everything the cart needs re-renders correctly in the active language
     and recomputes correctly when a quantity/luggage count is edited.
   Depends on: config.js (AIRPORTS/PROVINCES/VEHICLES/estimateRoute,
   LUGGAGE_FREE_LIMIT, FIXED_FARE_PAX_INCLUDED, fixedFarePrice,
   luggageSurcharge), core.js (formatDuration, formatMoney, whatsappLink,
   submitBookingEmail), i18n.js (t()).
   ============================================================ */

'use strict';

const CART_STORAGE_KEY = 'sariel-cart';

// v3: trip details (flight/date/luggage/excursion-date) moved from cart-level
// to per-item; fixedRoute items now carry baseFare so their price recomputes
// when passengers/luggage change in the cart. Older carts are discarded.
const CART_VERSION = 3;
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
 * Escapes a string for safe injection into HTML text or a double-quoted
 * attribute — used for visitor-entered values (flight number, cruise ship)
 * that end up in the innerHTML the cart panel builds.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @returns {string} Today's date as YYYY-MM-DD (min for date inputs). */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Adds an item to the cart and re-renders the panel.
 * @param {Object} item One of:
 *   {kind:'transfer', pickupKey, destKey, vehicleId, passengers},
 *   {kind:'fixedRoute', fromKey, toKey, baseFare, passengers, luggage} or
 *   {kind:'excursion', titleKey, serviceKey, guests, price, prices, decimals}.
 *   Per-item trip details (flight, date, luggage for transfers; date for
 *   excursions) start empty and are filled inline in the cart.
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
 * Resolves a cart item into display strings + its live price in the active
 * language. Transfer/fixedRoute prices are recomputed from their stored
 * base fare + current passenger/luggage counts (so editing either in the
 * cart updates the price correctly); excursion prices come from the
 * snapshotted per-guest-count `prices` map.
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
      meta: `${t(vehicle.labelKey)} · ${formatDuration(route.minutes)}`,
      price: route.price + vehicle.surcharge + luggageSurcharge(item.luggage || 0),
    };
  }
  if (item.kind === 'fixedRoute') {
    const base = item.baseFare != null ? item.baseFare : item.price; // legacy fallback
    const passengers = item.passengers != null ? item.passengers : FIXED_FARE_PAX_INCLUDED;
    return {
      title: `${t(item.fromKey)} → ${t(item.toKey)}`,
      meta: item.passengers != null ? '' : t('routes.upTo6'),
      price: fixedFarePrice(base, passengers) + luggageSurcharge(item.luggage || 0),
    };
  }
  if (item.kind === 'excursion') {
    // Cruise cards optionally capture ship name + departure time (see
    // js/tours.js); when present they surface as the meta line.
    let meta = '';
    if (item.shipName) meta += escapeHtml(item.shipName);
    if (item.departureTime) meta += `${meta ? ' · ' : ''}${t('cruise.departsAt')} ${item.departureTime}`;
    return {
      title: t(item.titleKey || item.serviceKey),
      meta,
      price: item.price,
    };
  }
  return { title: '', meta: '', price: 0 };
}

/** @returns {number} Sum of every cart item's live price (luggage included per item). */
function cartTotal() {
  const sum = cartItems.reduce((total, item) => total + describeCartItem(item).price, 0);
  return Math.round(sum * 100) / 100; // guards against float drift (e.g. 23.95 + 33.95)
}

/**
 * Sorted list of guest counts this excursion item has an exact price for
 * (its data-prices map, carried since js/tours.js's buildItem()).
 * @param {Object} item An item with kind:'excursion'.
 * @returns {number[]}
 */
function excursionGuestOptions(item) {
  return Object.keys(item.prices || {}).map(Number).sort((a, b) => a - b);
}

const FIXED_ROUTE_PAX_MAX = 15; // matches js/calculator.js's own paxMax

/**
 * Applies a ±1 quantity change to one cart item in place and re-renders.
 * Excursions step through their `prices` map's guest counts; fixedRoutes
 * step their passenger count (price recomputed by describeCartItem from
 * baseFare). Anything else (the vestigial 'transfer' kind) is ignored.
 * @param {string} id
 * @param {1|-1} direction
 * @returns {void}
 */
function changeItemQty(id, direction) {
  const item = cartItems.find((i) => i.id === id);
  if (!item) return;

  if (item.kind === 'excursion' && item.prices) {
    const options = excursionGuestOptions(item);
    const newIndex = Math.min(Math.max(options.indexOf(item.guests) + direction, 0), options.length - 1);
    item.guests = options[newIndex];
    item.price = item.prices[String(item.guests)];
  } else if (item.kind === 'fixedRoute' && item.passengers != null) {
    item.passengers = Math.min(Math.max(item.passengers + direction, 1), FIXED_ROUTE_PAX_MAX);
  } else {
    return;
  }
  saveCart();
  renderCart();
}

/**
 * A labeled ± stepper for a cart row's editable quantity.
 * @param {string} id
 * @param {string} label
 * @param {number} value
 * @param {boolean} minusDisabled
 * @param {boolean} plusDisabled
 * @returns {string}
 */
function miniStepper(id, label, value, minusDisabled, plusDisabled) {
  // A <div>, not a <label>: a <label> wrapping the buttons would forward
  // clicks on its text to the first labelable descendant (the − button),
  // double-firing the stepper.
  return `<div class="cart-mini-field">
    <span>${label}</span>
    <div class="cart-item-qty">
      <button type="button" class="stepper-btn" data-qty-minus="${id}" aria-label="${t('cart.qtyMinusAria')}" ${minusDisabled ? 'disabled' : ''}>−</button>
      <span class="cart-item-qty-value">${value}</span>
      <button type="button" class="stepper-btn" data-qty-plus="${id}" aria-label="${t('cart.qtyPlusAria')}" ${plusDisabled ? 'disabled' : ''}>+</button>
    </div>
  </div>`;
}

/**
 * The quantity stepper for a row, or '' where quantity isn't editable.
 * @param {Object} item
 * @returns {string}
 */
function stepperHtml(item) {
  if (item.kind === 'excursion' && item.prices) {
    const options = excursionGuestOptions(item);
    const index = options.indexOf(item.guests);
    return miniStepper(item.id, t('cart.guestsLabel'), item.guests, index <= 0, index >= options.length - 1);
  }
  if (item.kind === 'fixedRoute' && item.passengers != null) {
    return miniStepper(item.id, t('cart.passengersLabel'), item.passengers, item.passengers <= 1, item.passengers >= FIXED_ROUTE_PAX_MAX);
  }
  return '';
}

/**
 * The inline per-item trip-detail fields for a cart row: quantity stepper +
 * (transfers) flight/date/luggage or (excursions) excursion date. Each input
 * carries data-field-id/data-field so the delegated `change` listener in
 * initCart() can write it back to the item. Empty for anything else.
 * @param {Object} item
 * @returns {string}
 */
function itemFieldsHtml(item) {
  const today = todayISO();
  if (item.kind === 'excursion') {
    return `<div class="cart-item-fields">
      ${stepperHtml(item)}
      <label class="cart-mini-field">
        <span>${t('cart.excursionDateLabel')}</span>
        <input type="date" min="${today}" data-field-id="${item.id}" data-field="date" value="${item.date || ''}" />
      </label>
    </div>`;
  }
  if (item.kind === 'transfer' || item.kind === 'fixedRoute') {
    return `<div class="cart-item-fields">
      ${stepperHtml(item)}
      <label class="cart-mini-field">
        <span>${t('cart.flightLabel')}</span>
        <input type="text" data-field-id="${item.id}" data-field="flight" value="${escapeHtml(item.flight || '')}" />
      </label>
      <label class="cart-mini-field">
        <span>${t('cart.flightDateLabel')}</span>
        <input type="date" min="${today}" data-field-id="${item.id}" data-field="date" value="${item.date || ''}" />
      </label>
      <label class="cart-mini-field">
        <span>${t('cart.luggageLabel')}</span>
        <input type="number" min="0" inputmode="numeric" data-field-id="${item.id}" data-field="luggage" value="${item.luggage || ''}" />
      </label>
    </div>`;
  }
  return '';
}

/** Rebuilds the cart panel's DOM from the current cartItems state. */
function renderCart() {
  const list = document.getElementById('cartItems');
  if (!list) return;
  const empty = document.getElementById('cartEmpty');
  const badge = document.getElementById('cartBadge');
  const totalEl = document.getElementById('cartTotal');
  const sendBtn = document.getElementById('cartSend');

  badge.textContent = String(cartItems.length);
  badge.hidden = cartItems.length === 0;
  empty.hidden = cartItems.length !== 0;
  if (sendBtn) sendBtn.disabled = cartItems.length === 0;

  list.innerHTML = cartItems
    .map((item) => {
      const { title, meta, price } = describeCartItem(item);
      return `<div class="cart-item" data-id="${item.id}">
        <div class="cart-item-head">
          <div class="cart-item-info">
            <p class="cart-item-title">${title}</p>
            ${meta ? `<p class="cart-item-meta">${meta}</p>` : ''}
          </div>
          <div class="cart-item-actions">
            <p class="cart-item-price">US$${formatMoney(price)}</p>
            <button type="button" class="cart-item-remove" data-remove-id="${item.id}" aria-label="${t('cart.remove')}">×</button>
          </div>
        </div>
        ${itemFieldsHtml(item)}
      </div>`;
    })
    .join('');

  totalEl.textContent = `US$${formatMoney(cartTotal())}`;
}

/**
 * Per-item detail lines for the booking message — passenger/guest count,
 * flight, dates, luggage — built from the item's own stored fields so the
 * message mirrors exactly what each cart row shows.
 * @param {Object} item
 * @returns {string[]}
 */
function itemDetailLines(item) {
  const lines = [];
  if (item.kind === 'excursion') {
    lines.push(`${t('whatsapp.labelGuests')}: ${item.guests}`);
    if (item.shipName) lines.push(item.shipName);
    if (item.departureTime) lines.push(`${t('cruise.departsAt')} ${item.departureTime}`);
    if (item.date) lines.push(`${t('whatsapp.labelExcursionDate')}: ${item.date}`);
    return lines;
  }
  // transfer / fixedRoute
  const passengers = item.passengers != null ? item.passengers : t('routes.upTo6');
  lines.push(`${t('whatsapp.labelPassengers')}: ${passengers}`);
  if (item.flight) lines.push(`${t('whatsapp.labelFlight')}: ${item.flight}`);
  if (item.date) lines.push(`${t('whatsapp.labelFlightDate')}: ${item.date}`);
  if (item.luggage > 0) lines.push(`${t('whatsapp.labelLuggage')}: ${item.luggage}`);
  return lines;
}

/**
 * Opens WhatsApp with a message for a single service, bypassing the cart —
 * the "Book Directly" action shown next to every "Add to Cart" button.
 * @param {Object} item Same shape accepted by addToCart().
 * @returns {void}
 */
function bookDirect(item) {
  const { title, price } = describeCartItem(item);
  const lines = [t('whatsapp.greeting'), '', title];
  itemDetailLines(item).forEach((l) => lines.push(l));
  lines.push(`US$${formatMoney(price)}`);
  window.open(whatsappLink(lines.join('\n')), '_blank', 'noopener');
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
 * Builds the consolidated booking message for every item in the cart, each
 * with its own detail lines (see itemDetailLines) — shared by both checkout
 * paths (WhatsApp and email, see initCart).
 * @param {Object} details
 * @param {string} details.name  Traveler's full name (required — see initCart).
 * @param {string} details.email Optional email (only set for the email path).
 * @returns {string}
 */
function buildCartMessage({ name, email }) {
  const lines = [t('whatsapp.greeting'), '', `${t('whatsapp.labelName')}: ${name}`];
  if (email) lines.push(`${t('whatsapp.labelEmail')}: ${email}`);
  cartItems.forEach((item, i) => {
    const { title, price } = describeCartItem(item);
    lines.push('', `${i + 1}) ${title}`);
    itemDetailLines(item).forEach((l) => lines.push(`   ${l}`));
    lines.push(`   US$${formatMoney(price)}`);
  });
  lines.push('', `${t('cart.total')}: US$${formatMoney(cartTotal())}`);
  return lines.join('\n');
}

/* ============================================================
   Cart panel: open/close, remove items, edit item fields, checkout
   ============================================================ */
(function initCart() {
  const toggle = document.getElementById('cartToggle');
  const panel = document.getElementById('cartPanel');
  if (!toggle || !panel) return;

  const closeBtn = document.getElementById('cartClose');
  const scrim = document.getElementById('cartScrim');
  const list = document.getElementById('cartItems');
  const channelStep = document.getElementById('cartChannelStep');
  const detailsStep = document.getElementById('cartDetailsStep');
  const chooseWhatsAppBtn = document.getElementById('cartChooseWhatsApp');
  const chooseEmailBtn = document.getElementById('cartChooseEmail');
  const channelBackBtn = document.getElementById('cartChannelBack');
  const sendBtn = document.getElementById('cartSend');
  const emailField = document.getElementById('cartEmailField');
  const statusEl = document.getElementById('cartStatus');
  const nameInput = document.getElementById('cartName');
  const emailInput = document.getElementById('cartEmail');

  // Which channel the visitor picked in step 1 ('whatsapp'|'email'|null —
  // null means still on the channel-choice step, see selectChannel below).
  let checkoutChannel = null;

  /**
   * Shows an inline status message under the send button.
   * @param {string} text
   * @param {'sending'|'success'|'error'|null} state
   * @returns {void}
   */
  function setCartStatus(text, state) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = 'cart-status' + (state ? ` is-${state}` : '');
    statusEl.hidden = !text;
  }

  /**
   * Moves the checkout form back to step 1 (choose a channel). Nothing from
   * step 2 stays configured across a reset.
   * @returns {void}
   */
  function resetChannel() {
    checkoutChannel = null;
    channelStep.hidden = false;
    detailsStep.hidden = true;
    setCartStatus('', null);
  }

  /**
   * Commits to a checkout channel: reveals step 2 with only the fields that
   * channel needs (the email field is WhatsApp-irrelevant, so it's hidden
   * rather than just left optional) and relabels the send button to match.
   * @param {'whatsapp'|'email'} channel
   * @returns {void}
   */
  function selectChannel(channel) {
    checkoutChannel = channel;
    channelStep.hidden = true;
    detailsStep.hidden = false;
    if (emailField) emailField.hidden = channel !== 'email';
    sendBtn.textContent = t(channel === 'email' ? 'cart.checkoutEmail' : 'cart.checkout');
    setCartStatus('', null);
  }

  chooseWhatsAppBtn.addEventListener('click', () => selectChannel('whatsapp'));
  chooseEmailBtn.addEventListener('click', () => selectChannel('email'));
  channelBackBtn.addEventListener('click', resetChannel);

  toggle.addEventListener('click', () => {
    if (panel.classList.contains('is-open')) {
      closeCart();
    } else {
      resetChannel();
      openCart();
    }
  });
  closeBtn.addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('is-open')) closeCart();
  });

  // Event delegation: item rows are re-rendered on every change, so single
  // listeners on the (stable) container avoid re-binding per row. Clicks
  // handle remove + quantity steppers.
  list.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('[data-remove-id]');
    if (removeBtn) { removeFromCart(removeBtn.dataset.removeId); return; }
    const qtyMinusBtn = event.target.closest('[data-qty-minus]');
    if (qtyMinusBtn) { changeItemQty(qtyMinusBtn.dataset.qtyMinus, -1); return; }
    const qtyPlusBtn = event.target.closest('[data-qty-plus]');
    if (qtyPlusBtn) changeItemQty(qtyPlusBtn.dataset.qtyPlus, 1);
  });

  // Per-item field edits (flight/date/luggage/excursion-date) fire `change`
  // (i.e. on blur / date-pick), so the value is saved to the item without a
  // re-render mid-typing. Luggage affects the item's price, so it alone
  // re-renders to refresh the amount + total.
  list.addEventListener('change', (event) => {
    const el = event.target;
    const id = el.dataset.fieldId;
    if (!id) return;
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    if (el.dataset.field === 'flight') {
      item.flight = el.value.trim();
      saveCart();
    } else if (el.dataset.field === 'date') {
      item.date = el.value;
      saveCart();
    } else if (el.dataset.field === 'luggage') {
      item.luggage = Math.max(0, parseInt(el.value, 10) || 0);
      saveCart();
      renderCart();
    }
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

  /** @returns {Object} Name (+ email for the email path), read fresh from the form. */
  function readCheckoutDetails() {
    return {
      name: nameInput.value.trim(),
      email: checkoutChannel === 'email' ? emailInput.value.trim() : '',
    };
  }

  sendBtn.addEventListener('click', async () => {
    if (!canCheckout()) return;

    if (checkoutChannel === 'whatsapp') {
      window.open(whatsappLink(buildCartMessage(readCheckoutDetails())), '_blank', 'noopener');
      clearCart();
      closeCart();
      return;
    }

    const details = readCheckoutDetails();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      emailInput.setCustomValidity(t('cart.emailRequired'));
      emailInput.reportValidity();
      emailInput.setCustomValidity('');
      emailInput.focus();
      return;
    }
    sendBtn.disabled = true;
    setCartStatus(t('cart.emailSending'), 'sending');
    const ok = await submitBookingEmail({
      name: details.name,
      email: details.email,
      subject: t('email.subject'),
      message: buildCartMessage(details),
    });
    sendBtn.disabled = cartItems.length === 0;
    if (ok) {
      setCartStatus(t('cart.emailSuccess'), 'success');
      clearCart();
    } else {
      setCartStatus(t('cart.emailError'), 'error');
    }
  });

  document.addEventListener('sariel:langchange', renderCart);

  renderCart();
})();
