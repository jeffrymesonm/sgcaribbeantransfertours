# DEPLOYMENT — SG Caribbean Transfers & Tours landing page

> Last updated: 2026-07-20 UTC (real domain set, nosotros.html added)

## Current state
Live on GitHub Pages at `caribbeansgtransferstours.com`, served from `master`
at the repository root. Every folder in the repository is therefore public,
including `DOCS/`, `memory/` and `tasks/`. Never commit secrets to them.
Pure static site (HTML/CSS/JS). No environment variables, no server-side code.

## Local preview
```
python -m http.server 8734
# → http://127.0.0.1:8734
```
(Opening `index.html` directly also works; fonts/images load from CDNs.)

## Recommended hosting options
| Host | How |
|------|-----|
| **Netlify** (easiest) | Drag & drop the project folder in app.netlify.com → instant URL; connect custom domain in Site settings |
| **Vercel** | `npx vercel` from the folder; framework preset "Other" |
| **GitHub Pages** | Push to a repo → Settings → Pages → deploy from branch |
| **cPanel / shared hosting** | Upload `index.html`, `css/`, `js/` to `public_html` |

Upload the five pages (`index.html`, `transfers.html`, `excursions.html`,
`cruises.html`, `nosotros.html`), plus `css/`, `js/`, `sitemap.xml` and
`robots.txt`. Exclude from upload: `DOCS/`, `docs/`, `tasks/`, `memory/`,
`.agents/`, `.claude/`, `skills-lock.json`, `PROJECT_INFO.md` (harmless if
included, but unnecessary).

## Site structure (since 2026-07-20)
Five pages sharing one header/cart/footer shell and one JS/i18n core:
`index.html` (home + service-picker popup), `transfers.html` (calculator,
plus ~50 fixed fares from Puerto Plata Airport), `excursions.html`,
`cruises.html`, `nosotros.html` ("Meet the team"). A `<dialog>` on the home
asks first-time visitors which service they want. See
`DOCS/DEVELOPER_GUIDE.md`.

## Go-live checklist
- [x] Real WhatsApp number in **`js/config.js`** (`CONFIG.whatsappNumber`) — `18296277733` (+1 829-627-7733)
- [x] Real contact email in all 5 footers — `sg.caribbeantransferstours@gmail.com`
- [x] Cart's "Send via Email" checkout wired to a real Formspree endpoint — `CONFIG.formspreeEndpoint` in `js/config.js` (`https://formspree.io/f/xbdnzrez`), replacing the old `mailto:` link so it delivers without the visitor needing a mail app configured
- [x] Company name is **SG Caribbean Transfers & Tours** everywhere the brand is shown (title/meta/JSON-LD/footer/header) — "Sariel" is kept only where it names the driver (team card, review quote)
- [x] Real domain (`caribbeansgtransferstours.com`) in the `<link rel="canonical">` + Open Graph block of all 5 HTML pages (set 2026-07-20)
- [x] Host updated in `sitemap.xml` (6 `<loc>` since `sosua.html` was added) and `robots.txt` (`Sitemap:` line) to the real domain
- [x] 2 of 3 cruise cards filled in (`cruises.html`: 27 Charcos de Damajagua, Puerto Plata City Tour) — [ ] 3rd card (`#cruise3`) still a placeholder (`data-prices` all `0`s), owner's choice to leave for a future 3rd cruise excursion — see `DOCS/USER_MANUAL.md`
- [x] Team + fleet photos (`nosotros.html`, split out of the home page's old About Us section on 2026-07-20) — real, from the owner. All 4 drivers (Saul, Sariel, Luis, Leuris) have photos; fleet gallery expanded to 8 photos (group shot + 4 individual vans + 3 interiors)
- [x] Real logo + favicon (browser tab icon, header, footer, all 5 pages) — `img/logo.jpg` + `img/favicon-32.png` + `img/favicon-180.png`, replacing the placeholder inline-SVG brand mark
- [ ] Remaining photos still stock placeholders, all live in `img/` with descriptive filenames for 1:1 swap — see `DOCS/FOLDER_STRUCTURE.md`: hero-main.jpg, cta-band.jpg, gallery-1,2,3,4,6,8, transfer-trust-airport/resort/beach.jpg, exc-waterfalls.jpg, exc-whale-watching.jpg, exc-city-tour.jpg, exc-beach-day.jpg, exc-atv.jpg, exc-buggies.jpg. `exc-punta-rusia.jpg` and `hero-cruises.jpg` were already swapped by the owner (their own Cayo Arena/cruise-ship photos) — same pattern applies to the rest: drop a file in `img/` with the exact same name to replace it, no code changes needed.
- [x] Google Business Profile connected (2026-08-12) — `CONFIG.googleReviewsUrl` / `googleWriteReviewUrl` / `googlePlaceId` in `js/config.js`, plus `sameAs`+`hasMap` in every page's TravelAgency block. `googleReviewCount` deliberately left empty until the real count is verified on the profile.
- [x] Real testimonials in the Reviews section (2026-11-01) — 2 real Google reviews on home, transfers, excursions and cruises.
- [x] HTTPS enabled — verified live 2026-08-12: apex serves 200 over HTTPS, `www` → apex 301, `http` → `https` 301
- [ ] Test the WhatsApp flow from a phone on each page (transfer calculator, a Popular Routes ticket, an excursion, a cruise tour with ship + departure time → message arrives)
- [ ] **Resubmit `sitemap.xml` and request indexing per URL** in Search Console. As of 2026-08-12 `transfers.html`, `excursions.html` and `cruises.html` sit at "Discovered — currently not indexed" with **last crawl N/D (never fetched)**: no technical blocker exists (Googlebot gets 200 in 0.18 s, no noindex, canonicals fine), the domain is simply days old with no backlinks. Manual "Request indexing" is the only thing that jumps the crawl queue. JSON-LD per page: TravelAgency (all 6, one shared @id) + FAQPage on home/transfers/excursions/cruises/sosua, Service on transfers/sosua, ItemList on excursions/cruises, AboutPage on nosotros, TouristDestination on sosua, BreadcrumbList on every page but home.
- [x] Google Ads conversion tracking (2026-11-01) — `CONFIG.googleAdsConversion` in `js/config.js`, see `DOCS/DEVELOPER_GUIDE.md`. Goes live with a push to `master`; GitHub Pages serves `master` at the repository root.
- [x] Privacy policy and cookie consent (2026-11-01) — `privacy.html` in 3 languages, `js/consent.js`, see `DOCS/DEVELOPER_GUIDE.md`.
- [x] Owner confirmed the `privacy.html` facts (2026-11-01): no promotions, no outside operators.
- [ ] **The policy makes promises to keep:** delete a customer's messages when asked; answer access requests in 5 business days and corrections or deletions in 10.
- [ ] Business is not registered, so the policy names only the trade name and Sosúa, Puerto Plata. Law 172-13 art. 5 asks for the identity and address of who is responsible: confirm with a lawyer.
- [ ] Confirm the regional cookie default from a real connection in the EU or UK (cookies should stay off until the visitor accepts).
