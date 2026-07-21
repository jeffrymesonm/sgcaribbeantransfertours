/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: tours.js
   Purpose: guest-count pricing per showcase panel (excursions today;
   also used by cruise cards, which share the same .exc markup).
   Guest count comes from either a preset .guest-btn or the free-typed
   .guest-manual-input (e.g. a party of 8, 12...). Presets only cover the
   group sizes the owner has an exact price for (see data-prices) — a
   manual count outside that set has no defined price, so the card falls
   back to a "request a quote" state instead of guessing one (see
   selectGuests() below).
   Depends on: core.js (animatePrice, whatsappLink), i18n.js (t()),
   cart.js (addToCart, openCart).
   ============================================================ */

'use strict';

/* ============================================================
   Excursions: guest-count pricing per showcase panel
   ============================================================ */
(function initTours() {
  document.querySelectorAll('.exc').forEach((panel) => {
    let prices;
    try {
      prices = JSON.parse(panel.dataset.prices);
    } catch {
      return; // malformed data — leave static price in place
    }

    const amountEl = panel.querySelector('.exc-amount');
    const priceAmountEl = panel.querySelector('.exc-price-amount');
    const priceQuoteEl = panel.querySelector('.exc-price-quote');
    const perPersonWrap = panel.querySelector('.exc-per-person');
    const perPersonAmountEl = panel.querySelector('.exc-per-person-amount');
    const buttons = panel.querySelectorAll('.guest-btn');
    const manualInput = panel.querySelector('.guest-manual-input');
    const addBtn = panel.querySelector('.exc-add');
    const bookDirectBtn = panel.querySelector('.exc-book-direct');
    const decimals = parseInt(panel.dataset.decimals, 10) || 0;
    let currentGuests = panel.querySelector('.guest-btn.is-active')?.dataset.guests || '4';
    let priceKnown = true;

    /** Re-renders the Add-to-Cart button's label for the current priced/quote state. */
    function renderAddBtnLabel() {
      if (addBtn) addBtn.textContent = t(priceKnown ? 'cart.add' : 'exc.requestQuote');
    }

    /**
     * Selects a guest count and updates the price display accordingly:
     * an exact match animates the known price (plus its per-person
     * breakdown), anything else switches the card into a "contact us for a
     * quote" state instead of inventing one.
     * @param {string} guestsStr
     * @returns {void}
     */
    function selectGuests(guestsStr) {
      currentGuests = guestsStr;
      const price = prices[guestsStr];
      priceKnown = price != null;
      if (priceKnown) {
        animatePrice(amountEl, price, decimals);
        if (perPersonAmountEl) {
          const perPerson = Math.round((price / parseInt(guestsStr, 10)) * 100) / 100;
          perPersonAmountEl.textContent = formatMoney(perPerson);
        }
      }
      if (priceAmountEl) priceAmountEl.hidden = !priceKnown;
      if (priceQuoteEl) priceQuoteEl.hidden = priceKnown;
      if (perPersonWrap) perPersonWrap.hidden = !priceKnown;
      renderAddBtnLabel();
    }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        if (manualInput) manualInput.value = '';
        selectGuests(btn.dataset.guests);
      });
    });

    if (manualInput) {
      manualInput.addEventListener('input', () => {
        const n = parseInt(manualInput.value, 10);
        if (!n || n < 4) return; // ignore incomplete/sub-minimum typing
        buttons.forEach((b) => {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        selectGuests(String(n));
      });
    }

    // Re-render the Add button's label (only thing here not already covered
    // by i18n.js's own data-i18n re-render) after a language switch.
    document.addEventListener('sariel:langchange', renderAddBtnLabel);

    /**
     * Opens a WhatsApp quote request for the current (unpriced) guest count
     * — shared by both the Add-to-Cart and Book-Directly buttons, since
     * neither can add a guessed price for a manual size beyond the presets.
     * @returns {void}
     */
    function requestQuote() {
      const guests = parseInt(currentGuests, 10);
      const title = t(addBtn.dataset.titleKey);
      window.open(
        whatsappLink(t('whatsapp.quoteRequest', { excursion: title, n: guests })),
        '_blank',
        'noopener'
      );
    }

    /**
     * Builds the cart/booking item for the currently selected guest count —
     * shared by the Add-to-Cart and Book-Directly buttons. Only call once
     * priceKnown is confirmed true (see requestQuote() for the alternative).
     * @returns {Object} Item shape accepted by addToCart()/bookDirect().
     */
    function buildItem() {
      // Cruise cards (same .exc markup) may carry two optional inputs for
      // ship name + departure time. Excursion panels lack these elements,
      // so shipEl/timeEl are null and `extra` stays empty — no behavior
      // change for plain excursions.
      const shipEl = panel.querySelector('.cruise-ship');
      const timeEl = panel.querySelector('.cruise-departure');
      const extra = {};
      if (shipEl && shipEl.value.trim()) extra.shipName = shipEl.value.trim();
      if (timeEl && timeEl.value) extra.departureTime = timeEl.value;
      return {
        kind: 'excursion',
        titleKey: addBtn.dataset.titleKey,
        serviceKey: addBtn.dataset.serviceKey,
        guests: parseInt(currentGuests, 10),
        price: prices[currentGuests],
        ...extra,
      };
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!priceKnown) { requestQuote(); return; }
        addToCart(buildItem());
        openCart();
      });
    }

    if (bookDirectBtn) {
      bookDirectBtn.addEventListener('click', () => {
        if (!priceKnown) { requestQuote(); return; }
        bookDirect(buildItem());
      });
    }
  });
})();
