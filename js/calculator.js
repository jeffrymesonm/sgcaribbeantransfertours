/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: calculator.js
   Purpose: transfer price calculator — every selectable destination has an
   owner-confirmed fixed price (no distance-estimated guessing) — and its
   "Add to Cart"/"Book Directly" wiring, including the route ticket buttons.
   Depends on: config.js (AIRPORTS/PROVINCES/POP_FIXED_DESTINATIONS/
   POP_PROVINCE_FIXED_FARES/OTHER_AIRPORT_FIXED_FARES/FIXED_FARE_*),
   core.js (animatePrice, formatMoney, whatsappLink),
   cart.js (addToCart, openCart, bookDirect), i18n.js (t()).
   ============================================================ */

'use strict';

/* ============================================================
   Transfer price calculator
   ============================================================ */
(function initCalculator() {
  const form = document.getElementById('calcForm');
  if (!form) return;

  const pickupEl = document.getElementById('calcPickup');
  const destEl = document.getElementById('calcDest');
  const paxEl = document.getElementById('calcPax');
  const luggageEl = document.getElementById('calcLuggage');
  const noDestHint = document.getElementById('calcNoDestHint');
  const paxField = document.getElementById('calcPaxField');
  const luggageField = document.getElementById('calcLuggageField');
  const bpContent = document.getElementById('bpContent');
  const bpQuoteCta = document.getElementById('bpQuoteCta');
  const bpQuoteWhatsapp = document.getElementById('bpQuoteWhatsapp');

  const out = {
    fromCode: document.getElementById('bpFromCode'),
    fromName: document.getElementById('bpFromName'),
    toCode: document.getElementById('bpToCode'),
    toName: document.getElementById('bpToName'),
    vehicle: document.getElementById('bpVehicle'),
    capacity: document.getElementById('bpCapacity'),
    duration: document.getElementById('bpDuration'),
    amount: document.getElementById('bpAmount'),
    note: document.getElementById('bpNote'),
  };

  /**
   * This pickup's confirmed fixed fares: destination-select value → price.
   * POP combines every POP_FIXED_DESTINATIONS entry (as `fixed:<slug>`)
   * with POP_PROVINCE_FIXED_FARES; other airports use their (smaller)
   * OTHER_AIRPORT_FIXED_FARES entry, or none at all (LRM/BRX have no
   * confirmed routes yet — see config.js).
   * @param {string} pickupVal calcPickup <select> value.
   * @returns {Object<string, number>}
   */
  function getFixedFareMap(pickupVal) {
    if (pickupVal === 'pop') {
      const named = {};
      Object.keys(POP_FIXED_DESTINATIONS).forEach((slug) => {
        named[`fixed:${slug}`] = POP_FIXED_DESTINATIONS[slug].price;
      });
      return { ...named, ...POP_PROVINCE_FIXED_FARES };
    }
    return OTHER_AIRPORT_FIXED_FARES[pickupVal] || {};
  }

  /**
   * Looks up the confirmed fixed fare for the current pickup+destination.
   * @param {string} pickupVal calcPickup <select> value (e.g. 'pop').
   * @param {string} destVal   calcDest <select> value — either a
   *   PROVINCES slug or `fixed:<slug>` for a POP_FIXED_DESTINATIONS entry.
   * @returns {{price:number, name:string, code:string}|null}
   */
  function resolveFixedFare(pickupVal, destVal) {
    const price = getFixedFareMap(pickupVal)[destVal];
    if (price == null) return null;
    if (destVal.startsWith('fixed:')) {
      const slug = destVal.slice(6);
      const entry = POP_FIXED_DESTINATIONS[slug];
      return { price, name: entry.nameKey ? t(entry.nameKey) : entry.name, code: slug.replace(/-/g, '').slice(0, 3).toUpperCase() };
    }
    const province = PROVINCES[destVal];
    return { price, name: t(province.nameKey), code: province.code };
  }

  /**
   * Shows only the destination <option>s priced for the given pickup,
   * hiding the rest. Re-selects the first visible option if the current
   * selection just got hidden; if none are visible (e.g. LRM/BRX), leaves
   * the select without a valid value — update() reads the return value to
   * switch the boarding pass into a "request a quote" state.
   * @param {string} pickupVal
   * @returns {boolean} True if at least one destination is available.
   */
  function filterDestinationOptions(pickupVal) {
    const fares = getFixedFareMap(pickupVal);
    let firstVisible = null;
    let selectedStillValid = false;
    Array.from(destEl.options).forEach((opt) => {
      const visible = opt.value in fares;
      opt.hidden = !visible;
      if (visible && !firstVisible) firstVisible = opt.value;
      if (visible && opt.value === destEl.value) selectedStillValid = true;
    });
    if (!selectedStillValid) destEl.value = firstVisible || '';
    return !!firstVisible;
  }

  /**
   * Adds the per-extra-passenger surcharge to a fixed fare's base price.
   * @param {number} basePrice Flat price covering up to FIXED_FARE_PAX_INCLUDED.
   * @param {number} pax       Passenger count.
   * @returns {number} Base price plus FIXED_FARE_EXTRA_PAX_FEE_USD per passenger over the included count.
   */
  function fixedFarePrice(basePrice, pax) {
    const extraPax = Math.max(0, pax - FIXED_FARE_PAX_INCLUDED);
    return basePrice + extraPax * FIXED_FARE_EXTRA_PAX_FEE_USD;
  }

  /**
   * Flat surcharge when this transfer's luggage count exceeds
   * LUGGAGE_FREE_LIMIT (see config.js) — same threshold/fee the cart's own
   * luggage field uses, but scoped to this one transfer rather than the
   * whole order.
   * @param {number} count Suitcase count.
   * @returns {number}
   */
  function luggageFeeFor(count) {
    return count > LUGGAGE_FREE_LIMIT ? LUGGAGE_EXTRA_FEE_USD : 0;
  }

  /** Recomputes the boarding pass (or the "request a quote" state) from the current form values. */
  function update() {
    // filterDestinationOptions() re-validates the current destination against
    // whichever pickup is now selected — a `fixed:` value valid under the
    // old pickup (e.g. Sosúa priced from both POP and STI) simply stays
    // selected if it's still priced for the new one, or falls back to the
    // first valid option otherwise. No manual pickup-forcing needed here.
    const hasDest = filterDestinationOptions(pickupEl.value);
    noDestHint.hidden = hasDest;
    paxField.hidden = !hasDest;
    luggageField.hidden = !hasDest;
    bpContent.hidden = !hasDest;
    bpQuoteCta.hidden = hasDest;

    const pickup = AIRPORTS[pickupEl.value];
    if (!hasDest) {
      bpQuoteWhatsapp.href = whatsappLink(t('calc.noRoutesQuoteMessage', { pickup: t(pickup.nameKey) }));
      return;
    }

    const paxMax = 15;
    const pax = Math.min(Math.max(parseInt(paxEl.value, 10) || 1, 1), paxMax);
    paxEl.value = pax;
    paxEl.max = paxMax;

    const fixed = resolveFixedFare(pickupEl.value, destEl.value);
    const extraPax = Math.max(0, pax - FIXED_FARE_PAX_INCLUDED);
    const luggage = Math.max(0, parseInt(luggageEl.value, 10) || 0);
    const luggageFee = luggageFeeFor(luggage);

    out.fromCode.textContent = pickup.code;
    out.fromName.textContent = t(pickup.nameKey);
    out.toCode.textContent = fixed.code;
    out.toName.textContent = fixed.name;
    out.vehicle.textContent = t('vehicle.minivan');
    out.capacity.textContent = t('routes.upTo6');
    out.duration.textContent = '—';
    animatePrice(out.amount, fixedFarePrice(fixed.price, pax) + luggageFee);

    const noteParts = [];
    if (extraPax > 0) {
      noteParts.push(t('calc.extraPaxNote', {
        extra: extraPax,
        fee: formatMoney(extraPax * FIXED_FARE_EXTRA_PAX_FEE_USD),
      }));
    }
    if (luggageFee > 0) {
      noteParts.push(t('calc.luggageFeeNote', { fee: formatMoney(luggageFee) }));
    }
    out.note.textContent = noteParts.join(' ');
    out.note.hidden = noteParts.length === 0;
  }

  [pickupEl, destEl].forEach((el) => el.addEventListener('change', update));
  paxEl.addEventListener('input', update);
  luggageEl.addEventListener('input', update);

  document.getElementById('paxMinus').addEventListener('click', () => {
    paxEl.value = Math.max(1, (parseInt(paxEl.value, 10) || 1) - 1);
    update();
  });
  document.getElementById('paxPlus').addEventListener('click', () => {
    const max = parseInt(paxEl.max, 10) || 15;
    paxEl.value = Math.min(max, (parseInt(paxEl.value, 10) || 1) + 1);
    update();
  });

  document.getElementById('luggageMinus').addEventListener('click', () => {
    luggageEl.value = Math.max(0, (parseInt(luggageEl.value, 10) || 0) - 1);
    update();
  });
  document.getElementById('luggagePlus').addEventListener('click', () => {
    luggageEl.value = (parseInt(luggageEl.value, 10) || 0) + 1;
    update();
  });

  // Re-render with translated names/labels when the language changes.
  document.addEventListener('sariel:langchange', update);

  /**
   * Builds the cart/booking item for whatever the boarding pass currently
   * shows — shared by the "Add to Cart" and "Book Directly" buttons below.
   * A fixed fare (see resolveFixedFare) snapshots as 'fixedRoute', same as
   * the Popular Routes tickets further down — it must NOT go in as
   * 'transfer', which would ignore the fixed price and re-derive a (wrong)
   * formula price the next time the cart re-renders. This transfer's own
   * luggage fee (see luggageFeeFor) is baked into the snapshotted price and
   * carried separately as `luggage` for the cart's meta line — independent
   * from the cart panel's own whole-order luggage field.
   * @returns {Object} Item shape accepted by addToCart()/bookDirect().
   */
  function buildCalcItem() {
    const fixed = resolveFixedFare(pickupEl.value, destEl.value);
    const pax = parseInt(paxEl.value, 10);
    const luggage = Math.max(0, parseInt(luggageEl.value, 10) || 0);
    const destVal = destEl.value;
    const toKey = destVal.startsWith('fixed:')
      ? POP_FIXED_DESTINATIONS[destVal.slice(6)].nameKey || POP_FIXED_DESTINATIONS[destVal.slice(6)].name
      : PROVINCES[destVal].nameKey;
    return {
      kind: 'fixedRoute',
      fromKey: AIRPORTS[pickupEl.value].nameKey,
      toKey,
      price: fixedFarePrice(fixed.price, pax) + luggageFeeFor(luggage),
      passengers: pax,
      luggage,
    };
  }

  const reserveBtn = document.getElementById('bpReserve');
  if (reserveBtn) {
    reserveBtn.addEventListener('click', () => {
      addToCart(buildCalcItem());
      openCart();
    });
  }

  const bookDirectBtn = document.getElementById('bpBookDirect');
  if (bookDirectBtn) {
    bookDirectBtn.addEventListener('click', () => bookDirect(buildCalcItem()));
  }

  // Popular Routes ticket buttons carrying a literal fixed price (not
  // formula-derived — some destinations, like Sosúa/Cabarete, aren't
  // provinces the calculator knows about). See js/cart.js 'fixedRoute'.
  // Each ticket has two buttons sharing the same data-fixed-* attributes:
  // .ticket-reserve adds to cart, .ticket-book-direct skips straight to
  // WhatsApp for that one route (see js/cart.js bookDirect()).
  document.querySelectorAll('[data-fixed-from][data-fixed-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = {
        kind: 'fixedRoute',
        fromKey: btn.dataset.fixedFrom,
        toKey: btn.dataset.fixedTo,
        price: parseFloat(btn.dataset.fixedPrice),
      };
      if (btn.classList.contains('ticket-book-direct')) {
        bookDirect(item);
        return;
      }
      addToCart(item);
      openCart();
    });
  });

  update();
})();
