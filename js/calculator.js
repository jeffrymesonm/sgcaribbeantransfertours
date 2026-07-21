/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: calculator.js
   Purpose: transfer price calculator (route matrix + vehicle logic) and
   its "Add to Cart" wiring, including the route ticket buttons.
   Depends on: config.js (AIRPORTS/PROVINCES/VEHICLES/estimateRoute),
   core.js (animatePrice, formatDuration), cart.js (addToCart, openCart),
   i18n.js (t()).
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
  const vehicleEl = document.getElementById('calcVehicle');

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
   * Picks the vehicle for a group: the user's choice if it fits,
   * otherwise the smallest tier with enough seats (auto-upgrade).
   * @param {number} pax      Passenger count.
   * @param {string} selected Vehicle id from the select ("auto" = recommend).
   * @returns {{vehicle: object, upgraded: boolean}} Chosen tier + upgrade flag.
   */
  function resolveVehicle(pax, selected) {
    const fits = (v) => v.capacity >= pax;
    const recommended = VEHICLES.find(fits) || VEHICLES[VEHICLES.length - 1];
    if (selected === 'auto') return { vehicle: recommended, upgraded: false };

    const chosen = VEHICLES.find((v) => v.id === selected);
    if (chosen && fits(chosen)) return { vehicle: chosen, upgraded: false };
    return { vehicle: recommended, upgraded: true };
  }

  /**
   * Looks up a confirmed fixed fare for the current pickup+destination, if
   * one exists — these only exist FROM Puerto Plata Airport (POP), see
   * POP_PROVINCE_FIXED_FARES/POP_FIXED_DESTINATIONS in js/config.js. Flat
   * regardless of vehicle/passenger count (source price sign: "1 to 6
   * person"), so callers should skip the vehicle surcharge entirely when
   * this returns non-null.
   * @param {string} pickupVal calcPickup <select> value (e.g. 'pop').
   * @param {string} destVal   calcDest <select> value — either a
   *   PROVINCES slug or `fixed:<slug>` for a POP_FIXED_DESTINATIONS entry.
   * @returns {{price:number, name:string, code:string}|null}
   */
  function resolveFixedFare(pickupVal, destVal) {
    if (destVal.startsWith('fixed:')) {
      const slug = destVal.slice(6);
      const entry = POP_FIXED_DESTINATIONS[slug];
      if (!entry) return null;
      return {
        price: entry.price,
        name: entry.nameKey ? t(entry.nameKey) : entry.name,
        code: slug.replace(/-/g, '').slice(0, 3).toUpperCase(),
      };
    }
    if (pickupVal === 'pop' && POP_PROVINCE_FIXED_FARES[destVal] != null) {
      const province = PROVINCES[destVal];
      return { price: POP_PROVINCE_FIXED_FARES[destVal], name: t(province.nameKey), code: province.code };
    }
    return null;
  }

  /** Recomputes the boarding pass from the current form values. */
  function update() {
    // A `fixed:` destination only has a confirmed price from POP — force
    // the pickup back to Puerto Plata Airport so the boarding pass never
    // shows a route we have no real price for.
    if (destEl.value.startsWith('fixed:') && pickupEl.value !== 'pop') {
      pickupEl.value = 'pop';
    }

    const pickup = AIRPORTS[pickupEl.value];
    const fixed = resolveFixedFare(pickupEl.value, destEl.value);

    // Fixed fares are flat "up to 6 guests" (per the source price sign) —
    // no vehicle surcharge, so the vehicle select doesn't affect price and
    // is disabled to avoid implying otherwise.
    vehicleEl.disabled = !!fixed;
    const paxMax = fixed ? 6 : 15;
    const pax = Math.min(Math.max(parseInt(paxEl.value, 10) || 1, 1), paxMax);
    paxEl.value = pax;
    paxEl.max = paxMax;

    out.fromCode.textContent = pickup.code;
    out.fromName.textContent = t(pickup.nameKey);

    if (fixed) {
      out.toCode.textContent = fixed.code;
      out.toName.textContent = fixed.name;
      out.vehicle.textContent = t('vehicle.minivan');
      out.capacity.textContent = t('routes.upTo6');
      out.duration.textContent = '—';
      animatePrice(out.amount, fixed.price);
      out.note.hidden = true;
      return;
    }

    const dest = PROVINCES[destEl.value];
    const route = estimateRoute(pickup, dest);
    const { vehicle, upgraded } = resolveVehicle(pax, vehicleEl.value);
    const vehicleLabel = t(vehicle.labelKey);
    const price = route.price + vehicle.surcharge;

    out.toCode.textContent = dest.code;
    out.toName.textContent = t(dest.nameKey);
    out.vehicle.textContent = vehicleLabel;
    out.capacity.textContent = t('calc.capacityValue', { n: vehicle.capacity });
    out.duration.textContent = formatDuration(route.minutes);
    animatePrice(out.amount, price);

    if (upgraded) {
      out.note.textContent = t('calc.upgradeNote', { pax, vehicle: vehicleLabel });
      out.note.hidden = false;
    } else {
      out.note.hidden = true;
    }
  }

  [pickupEl, destEl, vehicleEl].forEach((el) => el.addEventListener('change', update));
  paxEl.addEventListener('input', update);

  document.getElementById('paxMinus').addEventListener('click', () => {
    paxEl.value = Math.max(1, (parseInt(paxEl.value, 10) || 1) - 1);
    update();
  });
  document.getElementById('paxPlus').addEventListener('click', () => {
    const max = parseInt(paxEl.max, 10) || 15;
    paxEl.value = Math.min(max, (parseInt(paxEl.value, 10) || 1) + 1);
    update();
  });

  // Re-render with translated names/labels when the language changes.
  document.addEventListener('sariel:langchange', update);

  // Calculator's own "Add to Cart" button: reads whatever is currently
  // selected (including any auto-upgraded vehicle) and adds it. A fixed
  // fare (see resolveFixedFare) snapshots as 'fixedRoute', same as the
  // Popular Routes tickets below — it must NOT go in as 'transfer', which
  // would ignore the fixed price and re-derive a (wrong) formula price the
  // next time the cart re-renders.
  const reserveBtn = document.getElementById('bpReserve');
  if (reserveBtn) {
    reserveBtn.addEventListener('click', () => {
      const fixed = resolveFixedFare(pickupEl.value, destEl.value);
      if (fixed) {
        const destVal = destEl.value;
        const toKey = destVal.startsWith('fixed:')
          ? POP_FIXED_DESTINATIONS[destVal.slice(6)].nameKey || POP_FIXED_DESTINATIONS[destVal.slice(6)].name
          : PROVINCES[destVal].nameKey;
        addToCart({ kind: 'fixedRoute', fromKey: 'place.pop', toKey, price: fixed.price });
        openCart();
        return;
      }
      const pax = parseInt(paxEl.value, 10);
      const { vehicle } = resolveVehicle(pax, vehicleEl.value);
      addToCart({ kind: 'transfer', pickupKey: pickupEl.value, destKey: destEl.value, vehicleId: vehicle.id, passengers: pax });
      openCart();
    });
  }

  // Route ticket "Add to Cart" buttons: sync the calculator to that route
  // (visual confirmation of what's being added) at its stated passenger
  // count, then add the same route to the cart.
  document.querySelectorAll('[data-pickup][data-dest]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pickupEl.value = btn.dataset.pickup;
      destEl.value = btn.dataset.dest;
      paxEl.value = btn.dataset.passengers || 3;
      update();
      const pax = parseInt(paxEl.value, 10);
      const { vehicle } = resolveVehicle(pax, 'auto');
      addToCart({ kind: 'transfer', pickupKey: btn.dataset.pickup, destKey: btn.dataset.dest, vehicleId: vehicle.id, passengers: pax });
      openCart();
    });
  });

  // Popular Routes ticket buttons carrying a literal fixed price (not
  // formula-derived — some destinations, like Sosúa/Cabarete, aren't
  // provinces the calculator knows about). See js/cart.js 'fixedRoute'.
  document.querySelectorAll('[data-fixed-from][data-fixed-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      addToCart({
        kind: 'fixedRoute',
        fromKey: btn.dataset.fixedFrom,
        toKey: btn.dataset.fixedTo,
        price: parseFloat(btn.dataset.fixedPrice),
      });
      openCart();
    });
  });

  update();
})();
