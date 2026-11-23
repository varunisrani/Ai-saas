# Findings

One fact per entry. Status is CONFIRMED unless tagged HYPOTHESIS. Evidence always names its source.

## Stack and hosting
- **F-001** Pages are full server-rendered HTML documents (no SPA router); response headers
  `server: cloudflare`, `x-litespeed-cache: hit`, `x-turbo-charged-by: LiteSpeed`,
  `cache-control: no-cache, must-revalidate`. Evidence: evidence/html/home.headers.txt.
- **F-002** The CMS is Joomla 4/5: Joomla asset paths `/media/system/js/*`, `/media/vendor/bootstrap/js/*?5.3.8`,
  `com_*`/`mod_*`/`plg_*` extension folders, `index.php?option=com_…` form actions. Evidence: home.html,
  REA ev_19f8fac5… capture.sources (66 scripts).
- **F-003** JS and CSS are combined and cached by JCH Optimize (`/media/com_jchoptimize/cache/js/fe123a57…`);
  many scripts are deferred with `type="jchoptimize-text/javascript"` + `data-src`. Evidence: home.html.
- **F-004** The vehicles and weapons lists are JA Megafilter (`com_jamegafilter`, layouts
  `jalayout=gta6-vehicles` and `gta6-weapons`); list state lives in the URL hash, e.g. the default
  `#sort=attr.ct6.frontend_value&sortdir=desc` on /gta-6/vehicles/. Evidence: gta-6_vehicles_.html,
  gta-6_weapons_.html; REA ev_38af0f97… (list_browser_targets URL after load).
- **F-005** A custom template script `templates/SDH_J4/js/gtab-compare.js?v=10` loads on the vehicles list.
  Evidence: REA ev_19f8fac5… route_inventory.sources.
- **F-006** Extensions seen on GTA 6 pages: com_jlexcomment (comments, POST `index.php?option=com_jlexcomment&task=item.save`),
  mod_gptranslate (`index.php?option=com_ajax&plugin=gptranslate&format=json`), plg_system_sociallogin,
  com_finder (search form GET /search, field `q`), Regular Labs modals + tabs/accordions, com_igallery
  (screenshots). Evidence: evidence/html/*.html.
- **F-007** The GTA 6 section has 24 page types: hub, vehicles (+ comparison, best-* rankings), weapons
  (+ comparison), animals (+ detail), characters (+ detail), gangs, properties, radio-stations, missions,
  side-missions, strangers-missions, random-events, map, map-locations, cheats (PS5 / Xbox / PC), news,
  guides, videos, screenshots, artworks, covers, articles. Evidence: link census of gta-6_.html, home.html.
- **F-008** /gta-6/map/ is an interactive map ("needs JavaScript") listing 4336 locations in 102
  categories; found-tracking works for guests in the browser and for members across devices.
  Evidence: gta-6_map_.html text.
- **F-009** Lists show counts: 590 GTA 6 vehicles incl. 271 "Standout" vehicles in 25 sets, with a
  "Standout Set" filter and a "Hide Standout Vehicles" option; 211 weapons incl. 120+ unique variants.
  Evidence: gta-6_vehicles_.html, gta-6_weapons_.html text.
- **F-010** Membership ("MyBase"): free plan (checklists, collections, favorites, net worth) and VIP
  plan (no ads, up to 4 profiles per game, 100 personal map markers). Evidence: membership_.html.
- **F-011** The site states its vehicle database is protected by copyright and database right; copying or
  scraping a substantial part is prohibited. Evidence: gta-6_vehicles_.html text. → rebuild uses synthetic data.

## Routes (GTA 6 section, browser walk 2026-11-23 — evidence/walk/walk.json, screenshots evidence/walk/screens/)
| Route | Access | Renders | Data source | Evidence |
|---|---|---|---|---|
| /gta-6/ | public | hub: game info box, release countdown (shows 00 after release), section links | server HTML | walk |
| /gta-6/vehicles/ | public | Megafilter list: filters, sort, count, 100 cards per load | GET /media/com_jamegafilter/en_gb/17.json (1.7 MB) | walk XHR, F-012 |
| /gta-6/vehicles/<slug> | public | vehicle detail (stats, real-life model, how to get, gallery, rating stars, comments) | server HTML | walk |
| /gta-6/vehicles/comparison/?vehicle1=..&vehicle2=.. | public | side-by-side comparison, vehicle picker | server HTML | walk, gtab-compare.js |
| /gta-6/vehicles/best-<class>/ | public | ranking of one class, class selector | server HTML | walk |
| /gta-6/weapons/ (+ /<slug>, /comparison/) | public | Megafilter list (18.json, 629 KB), detail, comparison | XHR + server HTML | walk |
| /gta-6/animals/ (+ /<slug>), /characters/ (+ /<slug>), /gangs/, /properties/ (+ /<slug>), /radio-stations/ (+ /<slug>) | public | guide pages with tables/tabs; radio page has a player | server HTML (+ YouTube embed on some) | walk |
| /gta-6/missions/ (+ /<slug>), /side-missions/, /strangers-missions/, /random-events/ | public | mission lists with checkboxes, walkthrough pages | server HTML + checklist.js | walk |
| /gta-6/map/ | public | Leaflet map, 102 categories, 4336 markers, found-tracking | inline script data (GTAB_MARKERS_DATA, GTAB_CATEGORIES); tiles /images/gta-6/maps/tiles/in-game/ | walk, F-014 |
| /gta-6/map-locations/, cheats ×3, /news/, /guides/, /videos/, /screenshots/, /artworks/, /covers/ | public | content / lists / galleries | server HTML | walk |
| /articles/gta-6/gta-6-100-completion-guide-interactive-checklist | public | 100% checklist with progress bar | server HTML + checklist.js | walk |
| unknown path | public | "404 Page Not Found", HTTP 404 | — | walk (/gta-6/nonexistent-page-xyz) |

## API surface (all from the browser; static = seen in scripts, traffic = seen in walk)
| Operation | Method + path | Called from | Read-only? | Evidence |
|---|---|---|---|---|
| Megafilter data | GET /media/com_jamegafilter/en_gb/<id>.json?<ts> (17 = GTA 6 vehicles, 18 = GTA 6 weapons) | megafilter.js | yes | traffic (walk) |
| Map user checklist | POST /index.php?option=com_ajax&group=system&plugin=getuserdata&format=raw&type=checklist-load / checklist / user-token | map store.js (MyBaseStore), only when body has class `logged-in` | no (writes) | static: store.js |
| Checklist pages | same endpoints + type=checklist-profile | checklist.js | no | static |
| Header user data | GET …getuserdata…&type=header | user-header.js, only when logged in | yes | static |
| Map location submit | POST /index.php?option=com_ajax&group=system&plugin=gtabmap&format=raw | map.js (GTAB_CONFIG.submit) | no | static |
| Comments | POST /index.php?option=com_jlexcomment&task=item.save (+ other jlexcomment tasks) | jlexcomment script | no | static + form action |
| Translation | /index.php?option=com_ajax&plugin=gptranslate&format=json | gptranslate.js | read lookups | static |
| Site search | GET /search?q= | header form | yes | form |
| Cloudflare bot check | POST /cdn-cgi/challenge-platform/… | Cloudflare | n/a | blocked by write guard (walk) |

## Data model (as observed)
| Entity | Fields seen | Evidence |
|---|---|---|
| Vehicle (Megafilter item) | name, slug "<id>-<alias>", thumb, class (attr.ct1), manufacturer (attr.ct2), speed rating /10 (attr.ct6), off-road OVR (attr.ct10), asphalt OVR (attr.ct665), seats (attr.ct11), standout set (attr.ct734, incl. pseudo-value "hide-standouts"), real-life vehicle (attr.ct72), standout flag | probe of rendered list (sorter options, filter blocks, card) |
| Map category | id, name, group, icon, trackable, closed, slug, found_style, color | categories.js |
| Map category group | id, name, color (10 groups) | categories.js |
| Guest found-state | localStorage `guest_checklists` = { "<checklistId>": ["<id>", …] }, map checklistId `gta6-map`; key removed when empty | store.js |

## Auth and roles
- **F-020** Logged-in state is signalled by the class `logged-in` on `<body>`; guest pages are cached HTML identical for all users. Evidence: user-header.js, store.js, checklist.js.
- **F-021** Cookies: a Joomla session cookie (32-hex name, HttpOnly, Secure, SameSite=Lax) and `content` (not HttpOnly). Evidence: walk cookies.
- **F-022** Write requests carry a CSRF token from POST/GET `…getuserdata…&type=user-token` (32 hex chars) as `X-CSRF-Token` (map) or a form key (votes). Evidence: store.js, user-header.js.
- **F-023** Guests keep map and checklist progress in localStorage `guest_checklists`; on login the local ids are merged to the account in batches of 100 and the local copy cleared. Evidence: store.js `_merge`, f=100.
- **F-024** Login itself: Joomla login form (username/password/remember, POST to the current page with `option`/`task`) + social login buttons (akeeba sociallogin). Not exercised (read-only). Evidence: home.html form names.

## Static traces (phase 2)
- **F-012** The Megafilter list data is fetched as one JSON per database and filtered/sorted on the client; list state is written to the URL hash (sort, sortdir, page, attr.*, name) and copied to sessionStorage `jamg-hash:<path>` so Back restores it. Evidence: walk XHR; jamegafilter-fixes.js (KEY='jamg-hash:'+location.pathname, MEGAFILTER_HASH regex).
- **F-013** Compare: a toggle on each list card; max 4 picked items kept in sessionStorage `gtabCompare:<list path>`; bar shows "n/4"; under 2 picked the button reads "Pick 1 more" and is disabled; with 2+ it reads "Compare (n)" and links to `<list path>comparison/?<type>1=<id>&<type>2=<id>…` with ids sorted ascending. Evidence: templates/SDH_J4/js/gtab-compare.js.
- **F-014** Map: Leaflet 1.9.4 + markercluster; config GTAB_CONFIG (maxNativeZoom 6, closeZoom 5, disableClusteringAtZoom 2, store "mybase"); categories in 10 groups. Evidence: GTAB_CONFIG script declaration, categories.js.
- **F-015** Source maps are not exposed: every probed `.map` URL answers 403 (leaflet, map, store, gtab-compare, megafilter, j4buttons, jsonrepair). App scripts are readable or lightly minified. Evidence: curl probes 2026-11-23.
