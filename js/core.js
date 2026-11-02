/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: core.js
   Purpose: shared utilities used across the page.
   - prefersReducedMotion flag
   - animatePrice (blur "reprint" + count transition)
   - formatDuration
   - whatsappLink, openWhatsApp
   - trackBookingConversion (Google Ads)
   - submitBookingEmail (Formspree)
   Depends on: config.js (CONFIG.whatsappNumber, CONFIG.formspreeEndpoint,
   CONFIG.googleAdsConversion). `gtag` comes from the GA4 snippet in each
   page's <head>.
   All motion respects prefers-reduced-motion.
   ============================================================ */

'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Registers the Ads destination on the GA4 tag already loaded in <head>, so a
// visitor arriving from an ad keeps its click ID until they send a request.
// Personalization signals stay off: without them Google doesn't build
// remarketing lists from these visitors, which would otherwise land in the
// account shared with Agendaterd. Conversions are measured either way.
if (typeof gtag === 'function') {
  gtag('config', CONFIG.googleAdsConversion.split('/')[0], { allow_ad_personalization_signals: false });
}

/* ============================================================
   Utilities
   ============================================================ */

/**
 * Animates a numeric text element to a new value with a blur "reprint"
 * effect and a short count transition (tabular numerals prevent jitter).
 * @param {HTMLElement} el       Element whose textContent holds the number.
 * @param {number}      target   Final value to display.
 * @param {number}      decimals Decimal places to render. Defaults to the
 *                               rule formatMoney() follows: none for whole
 *                               numbers, 2 for amounts with cents, so a fare of
 *                               38.95 never shows up rounded to 39.
 * @returns {void}
 */
function animatePrice(el, target, decimals = Number.isInteger(target) ? 0 : 2) {
  const from = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0;
  if (from === target) return;

  if (prefersReducedMotion) {
    el.textContent = target.toFixed(decimals);
    return;
  }

  // Rapid re-triggers (e.g. spamming the stepper) invalidate the running
  // tween via a per-element token so two loops never fight over textContent.
  const token = (el._priceToken = (el._priceToken || 0) + 1);

  el.classList.add('is-updating');
  const duration = 360;
  const start = performance.now();

  /** Single rAF frame of the count-up/down tween (ease-out cubic). */
  function frame(now) {
    if (el._priceToken !== token) return; // superseded by a newer animation
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (from + (target - from) * eased).toFixed(decimals);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      el.classList.remove('is-updating');
    }
  }
  requestAnimationFrame(frame);
}

/**
 * Formats a USD amount for display: whole numbers stay bare ("65"), amounts
 * with cents always show two decimals ("23.95", "495.80") so a trailing
 * zero-cent never silently drops (JS would otherwise print 495.8).
 * @param {number} amount
 * @returns {string}
 */
function formatMoney(amount) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

/**
 * Formats a duration in minutes as a friendly label, e.g. 30 → "≈ 30 min",
 * 105 → "≈ 1 h 45".
 * @param {number} minutes Total minutes.
 * @returns {string} Human-readable duration.
 */
function formatDuration(minutes) {
  if (minutes < 60) return `≈ ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `≈ ${h} h` : `≈ ${h} h ${String(m).padStart(2, '0')}`;
}

/**
 * Builds a wa.me deep link with a prefilled message.
 * @param {string} message Plain-text message to prefill.
 * @returns {string} WhatsApp URL.
 */
function whatsappLink(message) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Reports one booking or contact request to Google Ads. Sends no visitor data,
 * only the conversion ID, and the action counts one per ad click, so repeat
 * calls from the same visitor are harmless.
 * @returns {void}
 */
function trackBookingConversion() {
  if (typeof gtag === 'function') gtag('event', 'conversion', { send_to: CONFIG.googleAdsConversion });
}

/**
 * Opens WhatsApp in a new tab with a prefilled message and reports the
 * conversion. Call it directly from a click handler: deferring it (timeout,
 * promise) gets the new tab blocked in Safari and Firefox.
 * @param {string} message Plain-text message to prefill.
 * @returns {void}
 */
function openWhatsApp(message) {
  trackBookingConversion();
  window.open(whatsappLink(message), '_blank', 'noopener');
}

/**
 * Submits a booking or contact request to Formspree (CONFIG.formspreeEndpoint)
 * — used by both the cart's "Send via Email" checkout and the "Email Us"
 * contact dialog (js/cart.js, js/shell.js) — the owner receives it by email
 * without the visitor needing a configured mail client. `email` is sent as
 * `_replyto` (Formspree sets the Reply-To header from it) and `subject` as
 * `_subject` (Formspree's own field conventions for its plain POST API).
 * Reports the conversion only once Formspree accepts the request.
 * @param {Object} fields
 * @param {string} fields.name
 * @param {string} fields.email
 * @param {string} fields.subject
 * @param {string} fields.message
 * @returns {Promise<boolean>} True if Formspree accepted the submission.
 */
async function submitBookingEmail({ name, email, subject, message }) {
  try {
    const response = await fetch(CONFIG.formspreeEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name, email, _replyto: email, _subject: subject, message }),
    });
    if (response.ok) trackBookingConversion();
    return response.ok;
  } catch {
    return false;
  }
}
