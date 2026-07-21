/* ============================================================
   SG Caribbean Transfers & Tours — Private Transfers & Excursions
   Module: shell.js
   Purpose: generic page chrome behaviors.
   - Header state + mobile nav
   - Scroll reveals, staggered grids
   - Parallax backgrounds
   - Animated counters (Why choose us stats)
   - FAQ accordion
   - WhatsApp floating button + footer link + direct-chat CTA (WhatsApp +
     email) + year
   Depends on: core.js (prefersReducedMotion, whatsappLink, emailLink),
   i18n.js (t()).
   All motion respects prefers-reduced-motion.
   ============================================================ */

'use strict';

/* ============================================================
   Header: solid background after leaving the hero + mobile nav
   ============================================================ */
(function initHeader() {
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  if (!header || !toggle || !mobileNav) return;

  /** Applies the solid header style once the page is scrolled. */
  function onScroll() {
    header.classList.toggle('is-solid', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /** Opens/closes the mobile menu and keeps aria state in sync. */
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', t(open ? 'nav.closeMenu' : 'nav.openMenu'));
    mobileNav.classList.toggle('is-open', open);
    if (open) header.classList.add('is-solid');
    else onScroll();
  }

  toggle.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Close the menu after navigating to a section.
  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  // Re-translate the toggle's current aria-label when the language changes.
  document.addEventListener('sariel:langchange', () => {
    setMenu(toggle.getAttribute('aria-expanded') === 'true');
  });
})();

/* ============================================================
   Scroll reveal + staggered grids
   ============================================================ */
(function initReveals() {
  const items = document.querySelectorAll('.reveal, .reveal-img');
  if (!items.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in-view'));
    return;
  }

  // Stagger siblings that share a parent grid (cards, tickets, gallery…).
  const groups = new Map();
  items.forEach((el) => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });
  groups.forEach((siblings) => {
    if (siblings.length < 2) return;
    siblings.forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${Math.min(i * 70, 420)}ms`);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );

  items.forEach((el) => observer.observe(el));
})();

/* ============================================================
   Parallax: hero and final CTA backgrounds drift on scroll
   ============================================================ */
(function initParallax() {
  if (prefersReducedMotion) return;

  const layers = [
    { el: document.getElementById('heroBg'), speed: 0.18 },
    { el: document.getElementById('bookBg'), speed: 0.12 },
  ].filter((l) => l.el);
  if (!layers.length) return;

  let ticking = false;

  /** Repositions each background layer relative to its section's scroll offset. */
  function update() {
    layers.forEach(({ el, speed }) => {
      const rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
})();

/* ============================================================
   Animated counters (Why choose us stats)
   ============================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  /**
   * Counts a stat element up from 0 to its data-target over ~1.2 s.
   * @param {HTMLElement} el Counter element with data-target/-decimals/-suffix.
   * @returns {void}
   */
  function run(el) {
    const target = parseFloat(el.dataset.target) || 0;
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';

    if (prefersReducedMotion || target === 0) {
      el.textContent = target.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = (target * eased).toFixed(decimals);
      el.textContent = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (t === 1 ? suffix : '');
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((el) => observer.observe(el));
})();

/* ============================================================
   FAQ accordion (animated via grid-template-rows in CSS)
   ============================================================ */
(function initFaq() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Exclusive accordion: close any other open item first.
      items.forEach((other) => {
        if (other !== item && other.classList.contains('is-open')) {
          other.classList.remove('is-open');
          other.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('is-open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();

/* ============================================================
   WhatsApp floating button + footer link + direct-chat CTA (+ its email
   sibling) + year
   ============================================================ */
(function initWhatsAppLinks() {
  const fab = document.getElementById('whatsappFab');
  const footerLink = document.getElementById('footerWhatsApp');
  const directCta = document.getElementById('bookDirectCta');
  const directCtaEmail = document.getElementById('bookDirectCtaEmail');

  /** Rebuilds every general WhatsApp/email link in the active language. */
  function updateLinks() {
    const href = whatsappLink(t('whatsapp.info'));
    if (fab) fab.href = href;
    if (footerLink) footerLink.href = href;
    if (directCta) directCta.href = href;
    if (directCtaEmail) directCtaEmail.href = emailLink(t('email.subject'), t('whatsapp.info'));
  }
  updateLinks();
  document.addEventListener('sariel:langchange', updateLinks);

  if (fab) {
    // Reveal the FAB only after the visitor leaves the hero.
    const hero = document.getElementById('top');
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(
        (entries) => {
          fab.classList.toggle('is-visible', !entries[0].isIntersecting);
        },
        { threshold: 0.15 }
      ).observe(hero);
    } else {
      fab.classList.add('is-visible');
    }
  }

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
