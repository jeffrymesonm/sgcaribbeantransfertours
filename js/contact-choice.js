/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: contact-choice.js
   Purpose: shared "how would you like to contact us?" dialog used by every
   Book Directly / Ask for a Quote button (tickets, calculator boarding pass,
   excursion and cruise cards). Previously those buttons jumped straight to
   WhatsApp, which dead-ends any visitor without it. Now they open this
   dialog: WhatsApp keeps the old behaviour, Email posts the same request to
   Formspree without leaving the page.
   Depends on: core.js (whatsappLink, submitBookingEmail), i18n.js (t()).
   Markup: #contactChoiceDialog, present on all 5 pages.
   ============================================================ */

'use strict';

/**
 * Opens the dialog for one request. Assigned by initContactChoice() below only
 * when this page actually has the dialog markup; stays null otherwise so
 * openContactChoice() knows to fall back to WhatsApp.
 * @type {?function(function(): {message: string, subject: string, summary: string}): void}
 */
let showContactChoiceDialog = null;

/* ============================================================
   Channel choice dialog
   ============================================================ */
(function initContactChoice() {
  const dialog = document.getElementById('contactChoiceDialog');
  // nosotros.html has no booking buttons; <dialog> is also unsupported on very
  // old browsers. Either way showContactChoiceDialog stays null and callers
  // fall back to WhatsApp.
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const closeBtn = document.getElementById('contactChoiceClose');
  const summaryEl = document.getElementById('contactChoiceSummary');
  const channelStep = document.getElementById('contactChoiceChannelStep');
  const detailsStep = document.getElementById('contactChoiceDetailsStep');
  const whatsAppBtn = document.getElementById('contactChoiceWhatsApp');
  const emailBtn = document.getElementById('contactChoiceEmail');
  const backBtn = document.getElementById('contactChoiceBack');
  const nameInput = document.getElementById('contactChoiceName');
  const emailInput = document.getElementById('contactChoiceEmailInput');
  const sendBtn = document.getElementById('contactChoiceSend');
  const statusEl = document.getElementById('contactChoiceStatus');

  // Builds the request currently on screen. Kept as a function rather than a
  // finished string so the message can be rebuilt in the new language if the
  // visitor switches languages while the dialog is open. Replaced on every
  // open, so the dialog can never send a stale request.
  let buildRequest = null;
  let request = { message: '', subject: '', summary: '' };

  /** Rebuilds the pending request and its on-screen recap in the active language. */
  function renderRequest() {
    if (!buildRequest) return;
    request = buildRequest();
    summaryEl.textContent = request.summary;
    summaryEl.hidden = !request.summary;
  }

  /**
   * Shows an inline status message under the send button.
   * @param {string} text
   * @param {'sending'|'success'|'error'|null} state
   * @returns {void}
   */
  function setStatus(text, state) {
    statusEl.textContent = text;
    statusEl.className = 'contact-choice-status' + (state ? ` is-${state}` : '');
    statusEl.hidden = !text;
  }

  /**
   * Validates one field, reporting a native validation bubble and focusing it
   * when invalid. Mirrors the cart's checkout checks (see js/cart.js).
   * @param {HTMLInputElement} input
   * @param {boolean} isValid
   * @param {string} messageKey i18n key for the validation message.
   * @returns {boolean} True when the field passed.
   */
  function requireField(input, isValid, messageKey) {
    if (isValid) return true;
    input.setCustomValidity(t(messageKey));
    input.reportValidity();
    input.setCustomValidity('');
    input.focus();
    return false;
  }

  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    // Click on the backdrop (outside .contact-dialog-inner) closes it.
    if (event.target === dialog) dialog.close();
  });

  whatsAppBtn.addEventListener('click', () => {
    // Opened inside this button's own click handler, so it stays a direct user
    // gesture and pop-up blockers leave it alone. Deferring it (timeout,
    // promise) would get it blocked in Safari and Firefox.
    window.open(whatsappLink(request.message), '_blank', 'noopener');
    dialog.close();
  });

  emailBtn.addEventListener('click', () => {
    channelStep.hidden = true;
    detailsStep.hidden = false;
    nameInput.focus();
  });

  backBtn.addEventListener('click', () => {
    detailsStep.hidden = true;
    channelStep.hidden = false;
    setStatus('', null);
  });

  sendBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!requireField(nameInput, Boolean(name), 'cart.nameRequired')) return;

    const email = emailInput.value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!requireField(emailInput, emailOk, 'cart.emailRequired')) return;

    sendBtn.disabled = true;
    setStatus(t('cart.emailSending'), 'sending');
    const ok = await submitBookingEmail({
      name,
      email,
      subject: request.subject,
      // Contact details go first so the owner can reply without digging
      // through the booking lines for a name.
      message: [
        `${t('whatsapp.labelName')}: ${name}`,
        `${t('whatsapp.labelEmail')}: ${email}`,
        '',
        request.message,
      ].join('\n'),
    });
    sendBtn.disabled = false;
    setStatus(t(ok ? 'cart.emailSuccess' : 'cart.emailError'), ok ? 'success' : 'error');
  });

  // The dialog can stay open across a language switch, so rebuild the pending
  // request — otherwise the visitor reads Spanish but sends English.
  document.addEventListener('sariel:langchange', () => {
    if (dialog.open) renderRequest();
  });

  showContactChoiceDialog = function show(builder) {
    buildRequest = builder;
    renderRequest();
    // Back to step 1 with an empty form: the dialog is shared by every button
    // on the page, so it must never open showing the last visitor's details.
    channelStep.hidden = false;
    detailsStep.hidden = true;
    nameInput.value = '';
    emailInput.value = '';
    sendBtn.disabled = false;
    setStatus('', null);
    dialog.showModal();
  };
})();

/**
 * Asks the visitor how they'd like to send a booking or quote request, then
 * routes it to WhatsApp or email. Falls back to opening WhatsApp directly when
 * the dialog isn't available, so no button is ever a dead end.
 * @param {function(): {message: string, subject: string, summary: string}}
 *   buildRequest Returns the request in the active language — called on open
 *   and again on every language switch while the dialog is showing, so it must
 *   read its strings through t() rather than close over finished text.
 *   `message` is the plain-text request, `subject` the email subject, and
 *   `summary` a short recap for the dialog, e.g. "City Tour · Guests: 5".
 * @returns {void}
 */
function openContactChoice(buildRequest) {
  if (!showContactChoiceDialog) {
    window.open(whatsappLink(buildRequest().message), '_blank', 'noopener');
    return;
  }
  showContactChoiceDialog(buildRequest);
}
