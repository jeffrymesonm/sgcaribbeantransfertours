# DEPLOYMENT — SG Caribbean Transfers & Tours landing page

> Last updated: 2026-07-20 UTC (real domain set, nosotros.html added)

## Current state
Not deployed. Pure static site (HTML/CSS/JS) — works on any static host.
No environment variables, no build command, no server-side code.

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
- [x] Host updated in `sitemap.xml` (5 `<loc>`) and `robots.txt` (`Sitemap:` line) to the real domain
- [x] 2 of 3 cruise cards filled in (`cruises.html`: 27 Charcos de Damajagua, Puerto Plata City Tour) — [ ] 3rd card (`#cruise3`) still a placeholder (`data-prices` all `0`s), owner's choice to leave for a future 3rd cruise excursion — see `DOCS/USER_MANUAL.md`
- [x] Team + fleet photos (`nosotros.html`, split out of the home page's old About Us section on 2026-07-20) — real, from the owner. All 4 drivers (Saul, Sariel, Luis, Leuris) have photos; fleet gallery expanded to 8 photos (group shot + 4 individual vans + 3 interiors)
- [x] Real logo + favicon (browser tab icon, header, footer, all 5 pages) — `img/logo.jpg` + `img/favicon-32.png` + `img/favicon-180.png`, replacing the placeholder inline-SVG brand mark
- [ ] Remaining photos still stock placeholders, all live in `img/` with descriptive filenames for 1:1 swap — see `DOCS/FOLDER_STRUCTURE.md`: hero-main.jpg, cta-band.jpg, gallery-1..8, transfer-trust-airport/resort/beach.jpg, exc-waterfalls.jpg, exc-whale-watching.jpg, exc-city-tour.jpg, exc-beach-day.jpg, exc-atv.jpg, exc-buggies.jpg. `exc-punta-rusia.jpg` and `hero-cruises.jpg` were already swapped by the owner (their own Cayo Arena/cruise-ship photos) — same pattern applies to the rest: drop a file in `img/` with the exact same name to replace it, no code changes needed.
- [ ] Real testimonials in the Reviews section
- [ ] HTTPS enabled on the host (all listed hosts do this automatically)
- [ ] Test the WhatsApp flow from a phone on each page (transfer calculator, a Popular Routes ticket, an excursion, a cruise tour with ship + departure time → message arrives)
- [ ] Submit the URL + `sitemap.xml` to Google Search Console (JSON-LD included per page: TravelAgency/FAQ on home, Service on transfers, ItemList on excursions/cruises, AboutPage on nosotros — plus a BreadcrumbList on every page)
