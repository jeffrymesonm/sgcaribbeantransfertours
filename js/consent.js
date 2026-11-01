/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: consent.js
   Purpose: cookie consent for Google Analytics and Google Ads, using Google
   Consent Mode. Sets the consent defaults, applies the visitor's saved choice
   and runs the banner.
   Must load as a plain blocking <script> in <head>, BEFORE the gtag snippet:
   Google reads consent in queue order, so anything queued first would run
   without it. tools/verify.py enforces that order on every page.
   Markup: #consentBanner plus the [data-cookie-settings] buttons (footer on
   every page, and the privacy page). No dependencies.
   ============================================================ */

'use strict';

/** localStorage key holding the visitor's choice: 'granted' or 'denied'. */
const CONSENT_STORAGE_KEY = 'sg-cookie-consent';

/**
 * Where measurement stays off until the visitor accepts: the EEA, the UK,
 * Switzerland and Quebec. Everywhere else it starts on and can be rejected.
 * Google resolves these codes from the visitor's location.
 */
const CONSENT_REQUIRED_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO',
  'SK', 'SI', 'ES', 'SE', 'GB', 'CH', 'CA-QC',
];

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

// The Ads account's Google tag also feeds Agendaterd's GA4 property, so the AW
// destination in core.js would report this site's visits there. Google's
// per-property switch keeps them out; tools/verify.py guards this line.
window['ga-disable-G-YWXJ54LH6S'] = true;

/**
 * Builds a Consent Mode state. Ad personalization is always denied: the site
 * does no remarketing, so no visitor's choice ever turns it on.
 * @param {'granted'|'denied'} value
 * @returns {Object} Consent Mode parameters.
 */
function consentState(value) {
  return {
    ad_storage: value,
    ad_user_data: value,
    analytics_storage: value,
    ad_personalization: 'denied',
  };
}

/**
 * Reads the saved choice. Storage can throw in private modes, which simply
 * means the visitor is asked again.
 * @returns {?string} 'granted', 'denied', or null when no choice is saved.
 */
function readSavedConsent() {
  try {
    const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
    return saved === 'granted' || saved === 'denied' ? saved : null;
  } catch {
    return null;
  }
}

/**
 * Saves the choice and applies it to Google's tags immediately.
 * @param {'granted'|'denied'} value
 * @returns {void}
 */
function saveConsent(value) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch { /* the choice still applies to this page */ }
  gtag('consent', 'update', consentState(value));
}

/**
 * Deletes the Google Analytics and Google Ads cookies already set, so that
 * rejecting after accepting really removes them. They live on the bare domain,
 * so each one is cleared with and without the domain attribute.
 * @returns {void}
 */
function clearGoogleCookies() {
  const domain = `; domain=.${location.hostname.replace(/^www\./, '')}`;
  document.cookie.split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => /^_(ga|gcl)/.test(name))
    .forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; path=/`;
      document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
    });
}

// Most specific default wins, so the regional call overrides the global one.
gtag('consent', 'default', consentState('granted'));
gtag('consent', 'default', { ...consentState('denied'), region: CONSENT_REQUIRED_REGIONS });

const savedConsent = readSavedConsent();
if (savedConsent) gtag('consent', 'update', consentState(savedConsent));

/* ============================================================
   Banner
   ============================================================ */
document.addEventListener('DOMContentLoaded', function initConsentBanner() {
  const banner = document.getElementById('consentBanner');
  if (!banner) return;

  // The control that reopened the banner, so focus can go back to it.
  let reopenedFrom = null;

  /** Keeps the WhatsApp button clear of the banner (see styles.css). */
  function updateOffset() {
    const offset = banner.hidden ? 0 : banner.offsetHeight + 8;
    document.documentElement.style.setProperty('--consent-offset', `${offset}px`);
  }

  /** Shows the banner without taking focus: browsing stays uninterrupted. */
  function showBanner() {
    banner.hidden = false;
    updateOffset();
  }

  /**
   * Records the visitor's answer and closes the banner.
   * @param {'granted'|'denied'} value
   * @returns {void}
   */
  function choose(value) {
    saveConsent(value);
    if (value === 'denied') clearGoogleCookies();
    banner.hidden = true;
    updateOffset();
    if (reopenedFrom) reopenedFrom.focus();
    reopenedFrom = null;
  }

  document.getElementById('consentAccept').addEventListener('click', () => choose('granted'));
  document.getElementById('consentReject').addEventListener('click', () => choose('denied'));

  document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
    button.addEventListener('click', () => {
      reopenedFrom = button;
      showBanner();
      document.getElementById('consentAccept').focus();
    });
  });

  window.addEventListener('resize', updateOffset);

  if (!savedConsent) showBanner();
});
