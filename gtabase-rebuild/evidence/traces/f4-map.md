# F4 Interactive map — trace (feature id `f4-map`, page /gta-6/map/)

Observed 2026-11-23 as a guest, read-only runner (non-GET requests blocked). Analysis side only: the behavior
summary below is plain language; code identifiers appear only as citations.

Sources: `evidence/bundle/all/` — **MAP** = `images__gta-6__maps__gtab-map__map.js` (220 KB, all code on line 2,
so citations are `MAP:2:<column>`), **STORE** = `images__gta-6__maps__gtab-map__store.js` (line 2), **CATS** =
`images__gta-6__maps__gtab-map__categories.js`, **CFG** = `media__com_jchoptimize__cache__js__fe123a…d327c4e46cba268d2d897ad9a25c0991.js`,
**DATA** = `media__com_jchoptimize__cache__js__fe123a…aab7a71b093662dd1019a451f78ee843.js` (record shape only).
REA: `analyze-javascript-application` on MAP + STORE + CATS + CFG → view **ev_c62f19a5c162cbccb3db9b68fb159ebfb4c00d8aa8b7ea3d4741cdd3fe164c53**,
parent **ev_4e9dec50313f8af04e1adf6d3ae8963e1a4de7058f9f602ecb46a14b72fc8d10** (no error; 4/159 sources in scope;
0 route patterns — the map has no client routes). Saved at `evidence/rea/f4-map/evidence.json` (git-ignored).
REA `persists_to` relations used below: localStorage get/set/remove at MAP:2:61676, 2:91420, 2:91470, 2:148070,
2:148589, 2:184117/184337, 2:185688/185949, 2:199987/200442, 2:202993/203033/203069; STORE:2:92/263/312;
sessionStorage MAP:2:80676/80724; fetch STORE:2:1712 and MAP:2:149070.
Cases: `evidence/cases/f4-map.json`; run: `evidence/runs/run-f4-map.json`; extra note
`evidence/runs/probe-f4-map-uncached-urls.txt`; profile `tools/profiles/f4-map.profile.json`.

## T1 Explain (static)

**Entry point.** The page is server HTML with an empty map container (`#gtab-map`, attribute `data-gtab-pages`;
on a one-category page the server adds `data-gtab-category="<category id>"`), a sidebar head (h1, guest line
"Log in to keep progress on all your devices."), a JSON block `#gtab-plugin-data` (leaderboard on, a time-boxed
"GTA 6 Map Contest" 2026-11-17..2026-11-28, `newHours: 0`), a `<noscript>` "The interactive map needs JavaScript."
and an SEO list (`#gtab-map-list`, deferred `<template>`): 10 group headings and 102 category cards, each a link
`/gta-6/map/?feature=<key>` with "<n> Locations". CFG:4:1 declares `GTAB_CONFIG` (asset and tile paths, sea
colour, maxNativeZoom 6, closeZoom 5, disableClusteringAtZoom 2, store "mybase", countdown off, submit url
`/index.php?option=com_ajax&group=system&plugin=gtabmap&format=raw`, loginUrl `/login`, loginModal `#loginbox`),
preloads 4 stylesheets and then appends leaflet 1.9.4, markercluster, categories.js (skipped when inline),
icons.js, markers.js (skipped: data is inline in DATA), store.js, map.js in order (CFG:4:966).

**Data.** CATS:2 `GTAB_CATEGORIES` = 10 groups `{id,name,color}` + 107 categories
`{id,name,group,icon,trackable,closed?,slug?,found_style?,color?,multi_spawn?,hidden_default?}`. DATA holds
`GTAB_MARKERS_DATA`, a JSON array string disguised with a fixed one-to-one substitution of the 62 letters/digits,
decoded and validated at MAP:2:65313 (record needs string id + name, a known category, numeric x and y), plus
`GTAB_MARKERS_UPDATED`. Record shape (4336 records; fields, presence count): `id` (all; "<category-ish>-NNN"),
`name` (all), `category` (all), `x`,`y` (all; game units, x = east, y = north), `image`+`image_small` (1328;
screenshot URLs, only same-site or gtabase.com accepted), `description` (2024; ";"-separated sentences, parts
like "Label: value" become key/value rows), `submitted_by` (all), `added_by` (177), `shot_by` (1116) — credit
names, personal data, `approved_at` (4295; drives "NEW" badges within `newHours`, 0 on the live page so none
show; default 48), `url` (362; "View details" link, only gtabase.com / gta.wiki), `k` (all; 8 hex chars, content
key), `submitted_vip` (34; VIP badge flag). Markers are drawn on one `<canvas>` (custom circle-marker class,
MAP:2:101515; `getElement()` returns null), so markers have no DOM nodes, no focus and no accessible names;
the only `.leaflet-marker-icon` nodes are 5 county labels (F4-01).

**Functions (MAP unless noted).**
| Step | Where | What |
|---|---|---|
| Config + defaults | 2:57050 | defaults (tilePath, foundStyle "fade", disableClusteringAtZoom 1, store "local", maxClusterRadius 40, closeZoom 5) overridden by GTAB_CONFIG |
| Categories, store | 2:61214, 2:61274 | category map (colour falls back to group colour, trackable defaults true); store = `GTAB_createStore(config)` → MyBaseStore (STORE:2:5118) |
| Filter state load | 2:61620, 2:61775, 2:61973, 2:61991 | reads `gtab-map-filter`; hidden-by-default categories; hideFound; one-category mode from `data-gtab-category` |
| Marker objects | 2:107614 (`Gt`), 2:106647 (`Po`) | canvas marker per record, tooltip = name (+ " #i/n" for multi-spawn), label "<name>, <category>[ #n][, found]", found look = fade (all categories with current config) else badge |
| Ordering / numbers | 2:110600 (`ri`), 2:109575 (`An`) | per category south-to-north "collecting order"; numbers for trackable categories; multi-spawn same-name markers share a key |
| Sidebar build | 2:132910 (`Zo`), 2:54855 (`vs`), 2:55330 (`ws`) | Hide all / Hide found buttons, groups (box + fold), rows sorted by name ("Other…" last), counters, Only + arrow buttons, Reset progress; rail of group buttons (`nav` "Groups") |
| Counters | 2:128856 (`Va`) | "found f / n" + screen-reader "found f of n"; plain "n" for non-trackable |
| Visible set | 2:124991 (`He`) | rebuilds the cluster layer from switched-on categories minus found (when hiding found; the open popup's marker is kept) |
| Save filters | 2:90975 (`Ct`) | writes/removes `gtab-map-filter` (rule F4-R1) |
| Only / arrow | 2:132376 (`il`), 2:131320 (`ol`), 2:131954 (`Vo`) | show one category; `history.replaceState` to `?feature=<key>`; removed again when the set changes |
| Search | 2:74967, 2:76881, 2:130408 (`hi`), 2:126199 (`pa`), 2:126406 (`Dn`) | normalised fuzzy marker search (combobox + listbox, max 30), category row filter |
| Popup | 2:113678 (`nl`), found box 2:119515, change 2:119769 | image (click/Enter = lightbox), title, category link, number, description, key/value rows, Found box (trackable only), credits, "View details", star/zoom/copy-link, prev/next |
| Tick | 2:124851 (`ci`), 2:124920 (`qa`), 2:120014 → STORE:2:3723 → STORE:2:1026 | set found, redraw icon, counters, hide if hiding found, persist; on failure revert |
| Initial found load | 2:89290 → STORE:2:2761 | guest (no `logged-in` body class) → local ids; members → POST checklist-load |
| Reset | 2:140361 (`ki`), 2:142202 → STORE:2:4146 | in-page dialog (rule F4-R5); store asks the server first |
| Focus marker | 2:146784 (`ke`) | switches its category on (and saves), flies to zoom ≥ 4 (link: max(closeZoom, zoom)), opens popup |
| Hash links | 2:147394 (`xi`), 2:85000, 2:194992 (`Yi`), 2:195146 (`Ji`) | `#<id>` (1–32 of a-z 0-9 -), `#spot=<x>,<y>` (shared spot), `#profile=<n>` (members) |
| View memory | 2:148011, 2:148533 (`cl`), `ll` | `gtab-map-view` (rule F4-R7); saved on moveend after the visitor touched the map (2:85393) |
| Narrow layout | 2:148735 (`Yo`) | narrow = map width < 700 px; sidebar closed by default on narrow |
| Server calls | 2:148860 (`Jo`), 2:148977 (`xe`), 2:203594 (`me`) | always POST `<submit url>&type=<whoami|leaderboard|fav|note|…>`; `me` adds X-CSRF-Token |
| Suggest / login panels | 2:158159 (`In`), 2:152656 (`Ge`), 2:153102 (`$o`) | suggest asks `whoami` first; guests get a "Log in" (opens `#loginbox` modal) + "Join MyBase" panel |
| Escape | 2:83230 | closes, in order: About dialog, Reset dialog, side panel, open popup (focus back), narrow sidebar, pseudo-fullscreen |

**Storage keys** (all localStorage unless noted): `guest_checklists` (STORE:2:30; `{"gta6-map":[ids]}`),
`gtab-map-filter` (2:61620), `gtab-map-view` (2:148011), `gtab-contest-closed` (2:199858; value
"<start>|<end>|on" or "|soon", set by the contest box ×, F4-74), `gtab-map-live-seen` (2:85992, members' "just
approved" notices, max 50 ids), `gtab-map-rejected-seen` (2:185640, members, 14 days, max 100), `gtab-map-staff`
(2:88581, "1" for staff), sessionStorage `gtab-pwa-launch` (2:80701, only when installed as an app). As a guest
only the first four were ever written in the runs.

**Endpoints.** STORE posts to `/index.php?option=com_ajax&group=system&plugin=getuserdata&format=raw&type=`
`checklist-load` | `checklist` (JSON `[{checklist_id, value, active}]`, batches of 100, header X-CSRF-Token) |
`user-token`; for members only, except **reset** which posts `checklist-load` first even for a guest
(STORE:2:4146; blocked in F4-33). MAP posts to the submit url with `type=whoami` (Suggest location F4-46,
Personal marker F4-47, About dialog F4-70, Report a problem), `type=leaderboard` (Map Contest F4-48), `fav`,
`note`, `queue`, `profile` (members/staff). As a guest nothing is sent on load, tick, untick, filter, search or
navigation (`calls` empty in F4-01, F4-20, F4-21, F4-49).

**Server-side unknowns.** What `checklist-load` and `whoami` answer for a guest (statically: a guest answer makes
reset fall back to the local list and Suggest show the login panel); how `?feature` keys map to categories and the
singular display names in titles; why unknown keys / sub-paths took ~61 s and then HTTP 500 during the second
pass (origin cache misses, see probe note).

### Static structure: groups and categories (CATS; config, not marker data)
| # | Group (id) | categories defined | with markers (sidebar rows) | non-trackable | closed | hidden by default |
|---|---|---|---|---|---|---|
| 1 | Personal (properties) | 2 | 2 | 0 | 1 | 0 |
| 2 | Robberies | 7 | 7 | 0 | 4 | 0 |
| 3 | Activities | 16 | 15 | 0 | 7 | 0 |
| 4 | Collectibles | 22 | 22 | 0 | 9 | 0 |
| 5 | Collectible Cards | 19 | 19 | 0 | 0 | 0 |
| 6 | Vehicles | 14 | 13 | 3 | 6 | 3 |
| 7 | Weapons | 4 | 3 | 0 | 1 | 0 |
| 8 | Style | 7 | 5 | 0 | 4 | 0 |
| 9 | Food & Drink | 6 | 6 | 0 | 1 | 0 |
| 10 | Local Places | 10 | 10 | 1 | 1 | 1 |
| | **total** | **107** | **102** | **4** | **34** | **4** |

Other flags: 9 categories have a `slug` (used as the `?feature` key), 3 `found_style: "fade"`, 7 own `color`,
20 `multi_spawn`. The 4 non-trackable categories are exactly the 4 hidden-by-default ones (bus stops, EV
chargers, gas stations, ATMs). **"closed" means closed to member suggestions**: such categories are left out of
the "Suggest a location" category list unless the user is staff (MAP:2:154438); it has nothing to do with
collapsing (all groups start expanded, F4-02). Categories without markers get no sidebar row.

## T2 Control → effect: the popup "Found" box (guest)

1. Visitor opens a marker: click on the canvas marker (F4-60), Enter on a search hit (F4-36, F4-61), prev/next
   (F4-51) or a `#<id>` link (F4-20). `ke` switches the marker's category on if needed and opens the popup
   (MAP:2:146784; F4-25, F4-57).
2. Popup is built by `nl` (MAP:2:113678); trackable categories get a labelled checkbox "Found", ticked when the id
   is in the found set (MAP:2:119515; F4-20 unchecked, F4-22 checked after reload). Non-trackable: no box (F4-25).
3. Change handler (MAP:2:119769): refuses when the active member profile is view-only (members only); otherwise
   for the marker and, in a multi-spawn category, its same-name siblings: mark pending, set found (`ci`
   MAP:2:124851 → icon redrawn faded via `Po` 2:106647, counters via `Va` 2:128856, box ticked), apply Hide found
   (`qa` 2:124920).
4. Persist: `we.setFound` (MAP:2:120014) → MyBaseStore.setFound: not signed in → LocalStore.setFound
   (STORE:2:3723 → 2:1026) → read `guest_checklists`, add/remove the id, drop the list when empty and the key when
   the object is empty (STORE:2:217); callback false → revert the tick.
5. Effects recorded: storage `{"gta6-map":["safehouse-001"]}`, counter "1/5", screen-reader "found 1 of 5", no
   request (F4-21); persists over reload (F4-22); untick removes the key, counter "0/5" (F4-23); multi-spawn tick
   stores both same-name ids, counter "1/9" (F4-24); Reset progress then lists "Safehouses (1 found)" (F4-31).
   Visual: the found marker is drawn faded on the canvas (screenshot `evidence/runs/screens/F4-21-found.png`,
   git-ignored, cropped to the viewport with the popup's credit line masked; not readable from the DOM).

## Rules (T3)
| Rule id | Plain words | Script | Observations reproduced | Proving input |
|---|---|---|---|---|
| F4-R1 | `gtab-map-filter` = {hidden (list order), folded?, sidebar? (wide only), hideFound?, dv:1}; removed when equal to defaults | evidence/rules/f4-map-filter-storage.mjs | 24/24 | F4-05: Banks off → `{"hidden":["bank","bus-stop","ev-charger","gas-station","atm"],"dv":1}` |
| F4-R2 | guest found ids in `guest_checklists["gta6-map"]`, key removed when empty; multi-spawn same-name ticks together and counts once | evidence/rules/f4-map-guest-found.mjs | 11/11 | F4-24: tick wrath-001 → both -001 and -013 stored, counter 1/9 |
| F4-R3 | sidebar labels: counters, Show/Hide all word, Hide/Show found, Only/All, fold names, group box | evidence/rules/f4-map-sidebar-labels.mjs | 27/27 | F4-11: after Only the row says "All" ("Show all categories again: Garages") and the top button "Show all" |
| F4-R4 | `?feature=<slug or id>` deep links, one-category page, address follows Only/All | evidence/rules/f4-map-feature-url.mjs | 15/15 | F4-14: Only Garages then Banks on → address back to /gta-6/map/ |
| F4-R5 | Reset progress dialog texts and outcomes | evidence/rules/f4-map-reset-text.mjs | 7/7 | F4-32: "This unticks the 1 marker you found in Safehouses. There is no undo." |
| F4-R6 | search normalisation, typo tolerance, 30 cap, messages | evidence/rules/f4-map-search.mjs | 15/15 | F4-40: "safehuose" still finds safehouses |
| F4-R7 | `gtab-map-view` after a map touch, 60-day restore; address never follows the view | evidence/rules/f4-map-view-storage.mjs | 8/8 | F4-58/59: zoom-in → {lat,lng,z:3,t}; reload opens at zoom 3 |
| F4-R8 | collecting order, "n / N", prev/next wrap, address unchanged | evidence/rules/f4-map-popup-nav.mjs | 8/8 | F4-53: Previous on 1 / 5 → 5 / 5 |

All 8 scripts run standalone with node and print PASS for every observation (115/115).

## Cases
- File `evidence/cases/f4-map.json`, run `evidence/runs/run-f4-map.json`: **76 cases, 74 clean, 2 excluded**.
- Excluded: **F4-17** (`?feature=hidden-package`) and **F4-19** (`?feature=no-such-category`): page load timed out
  at 60 s in the full run and in one retry 60 s later; curl confirmed HTTP 500 after ~61 s for uncached URL
  variants at that time (origin problem, not app behavior). The first pass of the same cases (≈10:45 UTC)
  loaded normally and showed the plain map (no `data-gtab-category`, 98 categories on, normal title) — logged in
  `evidence/runs/probe-f4-map-uncached-urls.txt`; rule F4-R4 uses those first-pass values.
- Harness fixes before the final run: category checkboxes are visually hidden (Playwright cannot check them) →
  toggled via the row's icon (label click); tokens keyed on name `title` attributes broke because the sidebar
  removes `title` on hover → keyed on name text; marker DOM readouts dropped (markers are canvas).
- Clean but inconclusive: F4-76 `/gta-6/map/does-not-exist/` answered "500 Internal Server Error" after ~61 s
  (same origin timeout), so 404 behavior for map sub-paths is not established (the site's normal 404 is in F9).
- Data-only readout keys (live database values; compare only as relations): `text:popup-category-link`,
  `text:popup-navnum`, `attr:popup-navnum@title`, `attr:popup-prev@aria-label`, `attr:popup-next@aria-label`,
  `text:#gtab-search-hit-0 .gtab-search-hit-cat`, `count:search-hits`, `text:search-empty` (when "N more"),
  `count:category-rows-visible` (for search queries), totals inside `text:cat-*-counter` / `text:cat-safehouses-sr`
  / `text:cat-wrath-counter`, `title` of one-category pages (contains the count), `count:category-rows`,
  `count:category-rows-tracked`, `count:county-labels`, `local:gtab-map-view` (lat/lng), `attr:tile-first@src`,
  `count:#gtab-map .gtab-info-panel a`, `text:#gtab-map .gtab-contest .gtab-contest-head`.

## Command vocabulary
| token | role | accessible name / label | what it does |
|---|---|---|---|
| map-root | (div, no role) | — | map container; classes show sidebar-open / narrow; `data-gtab-category` on one-category pages |
| sidebar | complementary | "Map sidebar" (aria-hidden when closed) | search + filters + actions |
| sidebar-close | button | "Hide the sidebar" | closes the sidebar (remembered on wide screens) |
| sidebar-open | button (link styled) | visible "Filters", title "Search and filter", aria-expanded | opens the sidebar; shown only while it is closed |
| guest-line / login-link | paragraph / link | "Log in to keep progress on all your devices." / "Log in" (href /login, opens login modal) | guest prompt, hidden for members |
| search-input | combobox (aria-controls = results listbox, aria-expanded, aria-activedescendant) | "Search locations or categories" | marker search + category row filter |
| search-clear | button | "Clear the search" | empties the search |
| search-hits / search-hit-first | option (in listbox) | "<marker name> <category> #n" | Enter/click opens the marker |
| search-empty / category-none | paragraph | 'No marker matches "q".' / "N more, type a bit more of the name." / 'No category matches "q".' | search messages |
| group-rail, rail-<group> | button in nav "Groups" | group name (aria-label + title) | scrolls the list to the group; class on/off |
| show-hide-all | button | "Hide all" / "Show all" | all categories off/on |
| hide-found | button | "Hide found" / "Show found" (+ title) | take found markers off the map, counts stay |
| groups / group-<g>-box | checkbox inside label | group name | all categories of the group on/off; mixed state shown |
| group-<g>-fold | button (aria-expanded) | "Hide <group>" / "Show <group>" | collapse/expand the group's rows |
| category-rows, cat-<c>-box / -toggle | checkbox inside label (row) | category name | category on/off |
| cat-<c>-name | link | category name, href ?feature=<key> | plain click toggles the row; modified click opens the one-category page |
| cat-<c>-counter / cat-<c>-sr | text | "f/n" (title "Found so far, out of all markers of this category" or "Markers in this category") / "found f of n" | progress per category |
| cat-<c>-only | button | "Show only this category: <name>" / "Show all categories again: <name>"; text "Only"/"All" | solo a category / back to all |
| cat-<c>-next | button | "Show only this category: <name>" | solo + fly to the nearest marker of it |
| reset-progress | button | "Reset progress" | opens the reset dialog |
| reset-dialog, reset-select, reset-go, reset-cancel, reset-say | dialog "Reset progress", select, buttons "Reset"/"Cancel"/"Close", status text | see F4-R5 | untick found markers |
| canvas | (canvas) | — | markers; click opens a popup |
| popup / popup-title / popup-category-link | popup / text / link | marker name / category name (href ?feature=<key>) | marker details |
| popup-found-box | checkbox in label | "Found" | tick found (trackable only) |
| popup-fav / popup-zoom / popup-copy | button | "Add to favourites" (aria-pressed) / "Zoom in" / "Copy link" | star (members; guests get a login panel) / zoom to marker / copy `<page>#<id>` (shows "Copied!") |
| popup-prev / popup-next / popup-navnum | button / text | "Previous in <category>: <name> (#k)" / "Next in …" / "n / N" (title hint) | step through the category, wrapping |
| popup-details-link | link | "View details" (new tab) | marker's detail page when it has one |
| suggest-open / own-open / contest-open / feedback-open | button | "+ Suggest location" / "+ Personal marker" / "Map Contest" / "Feedback" | server-backed panels (guest: login panels); Feedback goes to /contact/ (static) |
| panel / panel-title / panel-links | dialog (aria-label = title) / h3 / links | e.g. "Suggest a location", "Favourites", "Personal marker", "Map Contest"; "Log in", "Join MyBase" | side panel with × "Close" |
| about-open / about-dialog | button / dialog | "About this map" | help and credits dialog |
| fullscreen | button | "Full screen" / "Exit full screen" | full-screen toggle |
| map-zoom-in / map-zoom-out | button | "Zoom in" / "Zoom out" | Leaflet zoom |
| contest-box / contest-close | status / button | "Close" | time-boxed contest notice; × remembers it |

## Behavior summary for the spec
1. The map page shows a sidebar (search, group rail, "Hide all", "Hide found", grouped category rows, "Reset
   progress", action buttons) beside a pannable/zoomable tiled map with markers drawn per category icon; a guest
   line "Log in to keep progress on all your devices." sits under the title (F4-01).
2. Groups come in configured order; within a group, rows are sorted by name with names starting "Other" last; only
   categories that have markers get a row (102 rows in 10 groups, F4-01/02). All groups start expanded.
3. Every row has a switch, icon, name, counter, an "Only" button and an arrow. Trackable rows show "found f / n"
   (visually "f/n"; screen readers get "found f of n"); non-trackable rows show the plain count "n" with the hint
   "Markers in this category"; a switched-off row hides its counter (F4-02, F4-05, F4-21; rule F4-R3).
4. Categories flagged hidden-by-default (the 4 non-trackable ones) start switched off; "Hide all"/"Show all" acts
   on every category including those; the top button word follows rule F4-R3 (F4-01, 03, 04, 05, 11).
5. A group box switches its whole group; it is ticked only when all its categories are on (mixed otherwise); the
   rail icon of a fully-off group looks "off". The fold button collapses a group, named "Hide <group>"/"Show
   <group>" with aria-expanded (F4-07, 08, 09).
6. "Only" shows just that category (and the row button becomes "All", which switches every category on again);
   the arrow does the same and also flies to its nearest marker. While exactly that category is shown the address
   becomes `?feature=<key>` without reload; any other change removes it (F4-11..14; rule F4-R4).
7. Clicking a category name toggles the row (plain click); the name is a real link to the one-category page for
   modified clicks (F4-15, F4-02 hrefs).
8. `?feature=<key>` (slug if the category has one, else its id) opens a one-category page: own title and heading,
   only that category on, its markers numbered on the map (static, MAP:2:106647), nothing written to storage; other keys give the normal map
   (F4-16, F4-18; first pass of F4-17/19).
9. Filter choices persist in browser storage `gtab-map-filter` exactly per rule F4-R1 (hidden list, folded groups,
   wide-screen sidebar state, hide-found); restored on reload (F4-06, F4-10, F4-27, F4-68).
10. Clicking a marker (F4-60), choosing a search hit (F4-36, F4-61), or opening `#<marker id>` on load or on hash
    change (F4-20, F4-54) opens its popup; an unknown id opens nothing (F4-55). Opening a marker of a switched-off
    category switches that category on and saves (F4-25, F4-57). The address never changes when markers open,
    when stepping, panning or zooming (F4-51..53, F4-58).
11. Popup content: optional screenshot (click/Enter opens a lightbox), title, category line linking to its
    `?feature` page, description and key/value rows, "Found" box (trackable only, F4-25), credits, "View details"
    link when present, star / zoom-in / copy-link buttons, prev/next with "n / N" (rule F4-R8; F4-20).
12. Ticking "Found" as a guest stores the id in `guest_checklists` (`{"gta6-map":[...]}`), updates the counter at
    once, draws the marker faded and sends nothing; unticking removes it and deletes the key when empty;
    same-name markers in multi-spawn categories tick together and count once (F4-21..24; rule F4-R2).
13. "Hide found" removes found markers from the map (counts unchanged) and is remembered; "Show found" restores
    them (F4-26..28).
14. "Reset progress" opens an in-page dialog, texts per rule F4-R5 (F4-29..34); Escape or Cancel closes it without
    changes (F4-30, F4-34). Rebuild (no accounts): reset clears the chosen ids locally and reports "Done: n
    marker(s) unticked." (the live site's guest path; the recorded failure text is the blocked server check, F4-33).
15. Search: per rule F4-R6 — case/accents/punctuation-insensitive, typo-tolerant, up to 30 options in a listbox
    with ArrowUp/ArrowDown (wrapping), Enter opens the active (or first) hit and clears the box, Escape clears
    (or blurs when empty); the same text filters category rows; messages for no match and overflow; HTML-like
    input shown as text (F4-35..45, F4-37/38).
16. Copy link copies `<page address without query>#<marker id>` and shows "Copied!" for 1.5 s (fallback: a prompt
    with the link) (F4-50). A shared spot `#spot=<x>,<y>` opens a pin popup "Shared spot" / "Somebody shared this
    place on the map with you." with "Suggest this location" (F4-56).
17. The view (centre + zoom) is remembered after the visitor touches the map (rule F4-R7); first visit starts on
    the start marker at zoom 2; reload restores the saved view (F4-58, F4-59).
18. Narrow screens (map < 700 px wide, e.g. 390×844): sidebar starts closed, a "Filters" button (title "Search
    and filter") opens it, Escape closes it, choosing a search hit closes it; the open/closed state is not
    remembered (F4-63..66). Wide screens: "Hide the sidebar" closes it and the state is remembered (F4-67..69).
19. Escape closes, in order: About dialog, Reset dialog, side panel, the open popup, the narrow sidebar
    (F4-30, F4-62, F4-65, F4-71).
20. Server-backed actions (Suggest location, Personal marker, Map Contest leaderboard, Report a problem, About's
    limits, favourites/notes for members) call the server first; for a guest the rebuild shows the login panel
    ("Log in" opening the login dialog, "Join MyBase" in a new tab), as the favourite star already does without a
    request (F4-49; F4-46..48 show the blocked-request fallback text "The server did not answer. Please try again
    in a moment."). Favourites/personal markers detail: see F10 trace.
21. "About this map" opens a dialog (help, credits); a contest notice can be closed and stays closed for that
    contest (`gtab-contest-closed`), "Full screen" toggles to "Exit full screen" (F4-70..75).

## Findings
- F-F4-01 Markers are canvas-drawn (one `<canvas>`; no marker DOM, no keyboard focus on markers); keyboard users
  reach markers through the search combobox and popup prev/next. Evidence: MAP:2:101515; F4-01 (`count:canvas`=1,
  county labels only), F4-61.
- F-F4-02 Guest found state = localStorage `guest_checklists` `{"gta6-map":[ids]}`, no request on tick/untick;
  key removed when empty. Evidence: STORE:2:1026, 2:217; F4-21, F4-23 (`calls` empty).
- F-F4-03 Multi-spawn categories tick all same-name markers together and count them once. Evidence:
  MAP:2:109575, 2:119769; F4-24.
- F-F4-04 Filters persist in `gtab-map-filter` only when different from defaults (key removed otherwise).
  Evidence: MAP:2:90975; F4-01/05/08/28.
- F-F4-05 View persists in `gtab-map-view` {lat,lng,z,t} (60 days) after a user touch; the URL never reflects
  pan/zoom/popup. Evidence: MAP:2:148011–148533; F4-58/59, F4-51.
- F-F4-06 Only/arrow write `?feature=<key>` with replaceState and remove it when the set changes. Evidence:
  MAP:2:131954; F4-11..14.
- F-F4-07 `?feature=<key>` is resolved by the server (attribute `data-gtab-category`, own title/heading); slugged
  categories answer only to their slug. Evidence: F4-16, F4-18; first pass of F4-17.
- F-F4-08 "closed" = not offered in the member "Suggest a location" category list (staff excepted), not a
  collapsed state. Evidence: MAP:2:154438; F4-02 (all groups expanded).
- F-F4-09 Non-trackable categories (= the 4 hidden-by-default ones) show a plain count and no Found box.
  Evidence: CATS; F4-02, F4-25.
- F-F4-10 Reset progress posts `getuserdata&type=checklist-load` even for guests before resetting; blocked → "The
  reset could not be saved, so nothing was changed. Try again in a moment.", nothing unticked. Evidence:
  STORE:2:4146; F4-33.
- F-F4-11 Suggest location, Personal marker and About post `gtabmap…&type=whoami`; Map Contest posts
  `type=leaderboard`; blocked → panel "The server did not answer. Please try again in a moment.". Evidence:
  MAP:2:158159, 2:148977; F4-46/47/48/70.
- F-F4-12 Guest popups show only star/zoom/copy + prev/next and "View details"; no "Report a problem" or "Add
  screenshot" buttons were present on the live page (the downloaded code has them behind conditions). Evidence:
  F4-20 (`count:popup-report`=0, 5 buttons, 1 action child = the "View details" link).
- F-F4-13 Uncached URL variants (unknown `?feature`, map sub-paths) took ~61 s and returned HTTP 500 during the
  second pass. Evidence: probe-f4-map-uncached-urls.txt; F4-76.

## Unknowns
| Question | Rebuild should |
|---|---|
| What `checklist-load` / `whoami` return for a guest (statically: guest answer → local reset / login panel) | reset locally; show the login panel for member-only actions without a request |
| Exact 404 behavior for /gta-6/map/<anything>/ (origin 500 during runs) | render the site 404 page (F9) |
| How the server picks singular display names for one-category titles ("Bank", "Hidden Package") | keep a singular label per category in its config |
| Member features (favourites, notes, personal markers, profiles, leaderboard, review queue) | out of v1 (no accounts); show login panels (see F10) |
| Visual found style beyond "faded" (canvas; only a screenshot) | draw found markers semi-transparent; an optional per-category "badge" style exists in config |
