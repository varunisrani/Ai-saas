# Analysis report — gtabase.com, GTA 6 section (observed 2026-11-23)

Tags: **[Fact]** seen directly · **[Hypothesis]** inferred. F-ids → FINDINGS.md.

## 1. Tech stack
| Layer | Value | Evidence |
|---|---|---|
| CMS | Joomla 4/5, PHP, server-rendered pages [Fact] | `/media/system/js/*`, `index.php?option=com_*` (F-002) |
| Hosting/cache | Cloudflare (bot-check script on every page) → LiteSpeed page cache [Fact] | headers `server: cloudflare`, `x-litespeed-cache: hit` (F-001) |
| Asset pipeline | JCH Optimize combines/defers JS and CSS [Fact] | `/media/com_jchoptimize/cache/*` (F-003) |
| Lists | JA Megafilter: one JSON per database, client-side filter/sort, Dust templates, Chosen dropdowns, jQuery UI range [Fact] | 17.json / 18.json XHR, megafilter.js, libs.js (F-004, F-012) |
| Map | Leaflet 1.9.4 + markercluster, custom map.js/store.js, tiles under /images/gta-6/maps/tiles/in-game/ [Fact] | F-014 |
| Custom template JS | gtab-compare.js, jamegafilter-fixes.js, checklist.js, radio-player.js, user-header.js, template.js (menu) [Fact] | evidence/bundle/files |
| Extensions | comments (jlexcomment), translation (gptranslate), Smart Search, social login, Regular Labs modals + tabs/accordions, Ignite Gallery, star voting (yrvote) [Fact] | F-006, user-header.js |
| Auth | Joomla session cookie (HttpOnly, Secure, Lax); `logged-in` class on body; CSRF token endpoint [Fact] | F-020..F-024 |
| Third parties | Mediavine ads, GTM/Clarity analytics, AddToAny share, YouTube embeds, Games Atlas network header [Fact] | walk |

## 2. Data flow
- Every route returns complete HTML from the cache. JavaScript only enhances it: lists, map, compare,
  checklists, galleries, tabs, the radio player. [Fact]
- The two databases (vehicles, weapons) download their whole dataset as one JSON and do all filtering,
  sorting and paging in the browser. State lives in the URL hash and is mirrored to sessionStorage
  for Back. [Fact] (F-012)
- Personal progress (map markers found, checklist ticks) is kept in localStorage `guest_checklists`
  for guests and synced to the MyBase account through `com_ajax getuserdata` POSTs when signed in.
  [Fact] (F-023)
- Compare picks are kept per list in sessionStorage. [Fact] (F-013)

## 3. Page by page (GTA 6)
See FINDINGS.md "Routes"; screenshots evidence/walk/screens/<route>.jpg (git-ignored). Feature groups:

| Feature | Routes | Client logic | Data |
|---|---|---|---|
| F1 Database lists | /gta-6/vehicles/, /gta-6/weapons/ | Megafilter: name search, class checkboxes, manufacturer + standout-set dropdowns, real-life text search, sort select + direction, counter, 100 cards per load | JSON per DB |
| F2 Detail pages | /gta-6/{vehicles,weapons,animals,characters,properties,radio-stations,missions}/<slug> | tabs, gallery modal, star vote (write), comments (write) | HTML |
| F3 Comparison + rankings | /gta-6/{vehicles,weapons}/comparison/, /gta-6/vehicles/best-*/ | compare picker (2–4), class select | HTML + query string |
| F4 Interactive map | /gta-6/map/ | Leaflet, categories/groups, marker popups, found toggles, progress counts | inline data + tiles, localStorage |
| F5 Checklists & missions | 100% checklist article, /missions/, /side-missions/, /strangers-missions/, /random-events/ | checkboxes with parent/child, multiplier, progress bar + percentage | HTML + localStorage |
| F6 Guide pages | animals, characters, gangs, properties, radio-stations (player), cheats ×3, map-locations | tabs/accordions, radio player (YouTube) | HTML |
| F7 News/guides/videos | /gta-6/news/, /guides/, /videos/, articles | lists with game filter links, paging | HTML |
| F8 Galleries | /gta-6/screenshots/, /artworks/, /covers/ | thumbnails → lightbox (modals slide) | HTML |
| F9 Hub + shell | /gta-6/, header/menu/footer, search box, 404 | countdown, mobile menu | HTML |
| F10 Favorites & progress | member features (favorites, garages) | signed-in only → HYPOTHESIS; guest progress = localStorage | — |

## 4. Issues found
- [Fact] Logged-in writes depend on a CSRF token fetched by a separate request; failure modes fall back to local storage (store.js `I()` → local). Rebuild: no accounts in v1.
- [Fact] The vehicles JSON is 1.7 MB and is downloaded on every list visit (cache-busting `?<ts>`). Rebuild: page the data on the server or ship a compact index.
- [Fact] Source maps are blocked (403); vendor scripts still reference them (console noise only).
- [Hypothesis] The guest progress in localStorage is per browser; clearing site data loses it (the site says so: "for guests in their browser").

## 5. Evidence
- REA: first look ev_19f8fac5… (web bundle of /gta-6/vehicles/, 66 scripts); full run parent
  ev_cec9d630e6f7… / view ev_59151532… — 159/159 files parsed, 0 failures, no timeout, evidence
  saved (198 MB) at evidence/rea/full3/evidence.json (git-ignored).
- Browser walk: evidence/walk/walk.json (37 routes: status, title, h1, scripts, XHR, storage, cookies).
- HTML snapshots: evidence/html/ (git-ignored). Scripts: evidence/bundle/all/ (159 files, git-ignored).
