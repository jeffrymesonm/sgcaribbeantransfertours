/* ============================================================
   SG Caribbean Transfers & Tours — Service picker popup (home only)
   Abre un <dialog> nativo en la primera carga de la sesión y
   recuerda la elección para no repetir. Degrada limpio sin JS.
   ============================================================ */
'use strict';

(function initServicePicker() {
  const dialog = document.getElementById('serviceDialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const PICKED_KEY = 'sariel-service-picked';
  const SERVICE_KEY = 'sariel-service';

  // Ya preguntado en esta sesión → no molestar de nuevo.
  if (sessionStorage.getItem(PICKED_KEY)) return;

  /** Marca la sesión como ya-preguntada. */
  function markPicked() {
    try { sessionStorage.setItem(PICKED_KEY, '1'); } catch { /* modo privado */ }
  }

  // Guardar la elección y dejar que el <a> navegue normalmente.
  dialog.querySelectorAll('.service-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      try { sessionStorage.setItem(SERVICE_KEY, opt.dataset.service); } catch { /* */ }
      markPicked();
    });
  });

  // Cerrar sin elegir: X, botón "ver todo", Esc (evento cancel), clic en backdrop.
  document.getElementById('serviceDialogClose')?.addEventListener('click', () => dialog.close());
  document.getElementById('serviceDialogBrowse')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', markPicked);   // Esc
  dialog.addEventListener('close', markPicked);
  dialog.addEventListener('click', (e) => {
    // Clic en el backdrop (fuera de .service-dialog-inner) cierra.
    if (e.target === dialog) dialog.close();
  });

  // Abrir tras el primer render.
  requestAnimationFrame(() => dialog.showModal());
})();
