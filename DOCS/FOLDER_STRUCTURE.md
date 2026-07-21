# FOLDER_STRUCTURE

> Last updated: 2026-07-20 UTC ("Meet the team" split into nosotros.html, full destination price list, luggage fee)

```
sariel taxi/
├── index.html            Home: hero, #services-picker, gallery, why-us,
│                         reviews, FAQ, book CTA, service-picker <dialog> popup
│                         ("Meet the team" moved to nosotros.html on 2026-07-20)
├── transfers.html        Hero + services + fixed-price Popular Routes ticket rail (9
│                         tickets, incl. Samaná) + boarding-pass price calculator
│                         (also covers ~50 fixed fares from Puerto Plata Airport,
│                         via a "Fixed destinations" optgroup) + trust strip
├── excursions.html       Hero + 7 excursion cards (Punta Rusia, 27 Charcos, Whale
│                         Watching, City Tour, Beach Experiences, ATV, Dune Buggy) + trust strip
├── cruises.html          Hero + guaranteed-return band + 3 template cruise cards + trust strip
├── nosotros.html         "Meet the team" page (2026-07-20): hero banner + company
│                         intro (logo + story) + team grid + fleet grid + book CTA
├── sitemap.xml           5 URLs (home + 4 service/company pages)
├── robots.txt            Allow-all crawlers + sitemap pointer
├── PROJECT_INFO.md       Stack, config, how to run/deploy (static fields)
├── skills-lock.json      Lockfile from `npx skills add emilkowalski/skill`
├── css/
│   └── styles.css        Full stylesheet: tokens, sections, animations (shared by all 4 pages)
├── img/                  ALL site photos, local (no more Unsplash hotlinks). Real
│   │                     team/fleet/logo photos from the owner + stock placeholders
│   │                     for the rest (descriptive filenames — drop a same-named
│   │                     file in to replace one, no code changes needed):
│   ├── team-saul.jpg / team-sariel.jpg / team-luis.jpg / team-leuris.jpg
│   │                                                       Driver portraits (4:5 cards)
│   ├── fleet-vans.jpg                                     Group shot (3 vans together)
│   ├── fleet-van-1.jpg .. fleet-van-4.jpg                 Each van individually
│   ├── fleet-interior-1.jpg .. fleet-interior-3.jpg       Interiors (3 available, not paired 1:1 with vans)
│   ├── logo.jpg                                           Real circular logo — header/footer brand mark + nosotros.html intro (CSS-cropped to a circle)
│   ├── banner nosotros.jpeg                               nosotros.html hero banner (owner-provided, 2026-07-20)
│   ├── favicon-32.png / favicon-180.png                   Browser tab icon + apple-touch-icon, generated from logo.jpg
│   ├── hero-main.jpg / hero-cruises.jpg / cta-band.jpg   Shared hero + CTA backgrounds
│   ├── gallery-1..8-*.jpg                                 Home masonry gallery
│   ├── transfer-trust-airport/resort/beach.jpg            transfers.html trust strip
│   └── exc-punta-rusia/waterfalls/whale-watching/city-tour/beach-day/atv/buggies.jpg
│                                                            Excursion + cruise card photos
│                         (exc-punta-rusia.jpg and hero-cruises.jpg are already the
│                         owner's real photos — same filename-swap pattern for the rest)
├── js/
│   ├── i18n.js            EN/ES/FR dictionary + language switcher + per-page meta (loads first)
│   ├── config.js           CONFIG (WhatsApp number) + AIRPORTS/PROVINCES/VEHICLES + pricing model
│   ├── core.js              Shared utilities: animatePrice, formatDuration, whatsappLink
│   ├── cart.js               Cart state/panel/checkout (versioned localStorage)
│   ├── shell.js                Header, mobile nav, reveals, parallax, counters, FAQ, WhatsApp links
│   ├── calculator.js            Transfer calculator — transfers.html only
│   ├── tours.js                  Excursion/cruise guest-pricing + Add to Cart — excursions.html, cruises.html
│   └── service-picker.js          Home-only first-visit service <dialog> — index.html only
│                          (js/main.js was deleted in the 2026-07-17 refactor — split into the 8 files above)
├── DOCS/
│   ├── PROOF_OF_WORK.md  Append-only task log (UTC)
│   ├── DEVELOPER_GUIDE.md Architecture, JS module map, cart/i18n/service-picker internals, gotchas
│   ├── FOLDER_STRUCTURE.md This file
│   ├── USER_MANUAL.md    How the site works for the business owner
│   ├── DEPLOYMENT.md     Hosting instructions + go-live checklist
│   └── superpowers/      Planning artifacts from the multi-page refactor
│       ├── golden-prices.md   Pre-refactor pricing baseline (parity check)
│       ├── specs/              Design spec(s) for the three-services split
│       └── plans/               Implementation plan(s) for the three-services split
├── tasks/
│   └── todo.md           Work plan + review for the build session
├── memory/
│   ├── decisions.md      Architectural decisions + rationale
│   ├── lessons.md        Mistakes + prevention rules
│   └── patterns.md       Recurring failure patterns + proven solutions
├── Nueva carpeta/        Owner's original photo drop (full-size, with EXIF). Never
│                         referenced by the site directly — processed copies go to img/
├── .agents/skills/       Skills installed by `npx skills add emilkowalski/skill`
│                         (animation-vocabulary, apple-design, emil-design-eng,
│                          improve-animations, review-animations)
├── .claude/              Claude Code local settings/symlinks
└── .playwright-mcp/      Playwright MCP page-snapshot artifacts from live-browser QA (not part of the site)
```
