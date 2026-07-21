/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: core.js
   Purpose: shared utilities used across the page.
   - prefersReducedMotion flag
   - animatePrice (blur "reprint" + count transition)
   - formatDuration
   - whatsappLink
   Depends on: config.js (CONFIG.whatsappNumber). All motion respects
   prefers-reduced-motion.
   ============================================================ */

'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   Utilities
   ============================================================ */

/**
 * Animates a numeric text element to a new value with a blur "reprint"
 * effect and a short count transition (tabular numerals prevent jitter).
 * @param {HTMLElement} el       Element whose textContent holds the number.
 * @param {number}      target   Final value to display.
 * @param {number}      decimals Decimal places to render (default 0).
 * @returns {void}
 */
function animatePrice(el, target, decimals = 0) {
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
 * Builds a mailto: link with a prefilled subject and body.
 * @param {string} subject Email subject line.
 * @param {string} body    Plain-text email body.
 * @returns {string} mailto URL.
 */
function emailLink(subject, body) {
  return `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
