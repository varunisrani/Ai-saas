# F2 Item detail pages — trace (feature id `f2-detail`)

Routes (GTA 6 only): `/gta-6/vehicles/<alias>` (e.g. sunset-sanchez = a Standout variant, sanchez = its base
model), `/gta-6/weapons/<alias>` (assault-rifle → "Kozlov KZ-59"), `/gta-6/animals/<alias>` (gray-fox),
`/gta-6/characters/<alias>` (jason), `/gta-6/properties/<alias>` (7th-avenue-garage),
`/gta-6/radio-stations/<alias>` (flash-fm), `/gta-6/missions/<alias>` (breakfast-run); unknown slug → 404.
Observed 2026-11-23 on the live site, read-only: no star was clicked, no comment form touched, the
"Add To Favorites" button (F10) not clicked; `blocked` stayed empty.

File abbreviations (under `evidence/bundle/all/`):

| Abbr | File | Original |
|---|---|---|
| UH | `templates__SDH_J4__js__user-header.js` (131 lines) | gamesatlas.com/templates/SDH_J4/js/user-header.js (plain script) |
| IG | `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f335e2529658003085ffe1e85c0912960.js` (615 lines) | /media/com_igallery/js/ignitegallery-42.js (deferred) |
| IGL | `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f9f282e7b235bedc688f8de31efdb1a71.js` | /media/com_igallery/js/lib-42.js (UIkit-based lightbox, "igui") |
| RD | `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f539bfd6cae0fe9d0e1e13294e3b5fb00.js` | /media/com_jchoptimize/dynamic-js/reduce_dom.js |
| MOD | `media__modals__js__script.min.js` | Regular Labs Modals |
| JCHI | `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f66544a25c89cf2b55a76799c57dc3d90.js` | JCH user-interaction loader |

REA T1 evidence: `analyze-javascript-application` over UH, IG, RD, MOD: view
**ev_9314a5acfeb87b2e1c42557c86c1b5e628b97528cf629d5185c6f7918c2c96cc**, parent
**ev_b8701ff0d92f6ba7c3460e9b24913f8999c4adb83d993db16bc1ae5b6ccc4138** (4/4 selected sources complete, no
error). REA recorded the network endpoint `call:fetch` →
`/index.php?option=com_ajax&group=system&plugin=getuserdata&format=raw&type=user-token` (UH:88), reads of
`window.lscToken` (UH:86, UH:109), `history.replaceState` (IG:530, IG:605) and `IntersectionObserver` (RD:13).
Evidence file: `evidence/rea/f2-detail/evidence.json` (git-ignored).

## T1 Explain (static)

**Entry point.** Detail pages are complete server-rendered Joomla articles (one template per list, F-001).
No detail-specific application script exists; behaviour comes from four shared scripts:

| Concern | Lines | What it does |
|---|---|---|
| Deferred loading | JCHI:4, JCHI:15 | most page scripts (gallery IG, …) are `type="jchoptimize-text/javascript"` and run only after the first pointer/key/scroll/focus event or 10 s; never when `navigator.webdriver` is true (harness: `--disable-blink-features=AutomationControlled` + hover macro `wake`). |
| Vote token | UH:79-119 | only on pages with a `.yrvoteimg` block: on the first `pointerenter`/`touchstart`/`focusin` of the stars (once each, UH:100-104) GET `…getuserdata&format=raw&type=user-token` with `cache: no-store` (UH:88-89); a 32-hex answer is kept as `window.lscToken` (UH:93); a star click before the token is held and replayed (UH:106-118). The vote itself (yrvote) is a write and is never sent here. |
| Header user data | UH:1-66 | only for signed-in visitors (F10/F9). |
| Gallery | IG:96-97 (per gallery), IG:346-361 (lightbox items from the hidden `.ig-lightbox-link` hrefs; `panel = iguiUIkit.lightboxPanel(…)`), IG:445 (counter = index+1 before each image), IG:521-530 (on close remove `?i=` with `history.replaceState`), IG:555-560 (`?i=<image hash>` opens that image), IG:575-589 (thumbnail `.ig-img-link` click → `panel.show(index)`), IG:590-605 (`imageUrl`, only used when `data-ig-showhash="hash"`; these pages use `javascript`, so opening never changes the URL). Lightbox UI from IGL (UIkit): arrows, Escape, close. |
| Lazy blocks | RD:11-13 | `section.jchoptimize-reduce-dom` holds a `<template>`; an IntersectionObserver swaps it into the page when it nears the viewport. Used for the previous/next links, the "below" modules and (missions) extra sections such as "Trophies & Achievements". |
| Modals | MOD | Regular Labs Modals only wrap the header "Log In" links (`href="#loginbox"`, 2 per page); detail galleries do **not** use it (they use the Ignite lightbox). |
| Tabs/accordions | — | `media/tabsaccordions/*` is not loaded on any detail route (walk.json script list) and no tab/accordion element exists (count `tabs` = 0 on all 8 detail types, F2-01..F2-08). |
| Compare To | — | Bootstrap dropdown (`data-bs-toggle="dropdown"`) of server-built links; no custom script. |

**Data flow.** Server HTML only (stats, labels, related cards, Compare To links, rating average and count,
comment list). Client adds: token fetch on star hover; lightbox; lazy insertion of prev/next.

**Dependencies.** Endpoint `GET /index.php?option=com_ajax&group=system&plugin=getuserdata&format=raw&type=user-token`
(read; returns the session's form token); comment endpoints (`com_jlexcomment`, writes, not exercised);
favorites (F10). No browser storage is written by detail pages (walk storage empty).

**Effects.** One GET on first star hover; DOM-only lightbox; navigation through links.

**Server-side unknowns.** Rating average formatting, vote acceptance rules (one vote per visitor?), which
items fill "Compare To", "Similar Vehicles" and prev/next (order key), the 301 that strips `?i=`.

## T2 Control → effect (main control: a gallery thumbnail on /gta-6/characters/jason)

1. Server HTML holds a gallery wrapper per gallery (Screenshots: 95 images, Artworks: 12) with a hidden
   slideshow list, a horizontal thumbnail strip `.ig-thumb-scroller-main` and a hidden lightbox template
   (counter "…/95", download, Facebook, Twitter, close). Evidence: `evidence/html/f2f3/gta-6_characters_jason.html`.
2. First interaction (`macro:wake` = hover) → JCHI:4/15 release the deferred IG/IGL scripts → IG:96-97 set up
   each gallery; IG:346-361 build the lightbox items from the 1080-px image links.
3. Click thumbnail 1 → IG:579-589 handler → `panel.show(0)` → IGL opens the full-screen lightbox; IG:445 writes
   counter "1/95". Case F2-16: lightbox visible, counter "1/95", close/prev/next present, 5 toolbar items; URL
   unchanged.
4. Next arrow → "2/95" (F2-17); ArrowRight → "3/95" (F2-18); ArrowLeft ×2 → "1/95" (F2-19).
5. Escape → closed (F2-20); IG:521-530 would remove `?i=` from the URL, but there is none.
6. Deep link `?i=jason-duval-01` would open that image (IG:555-560), but the server answers 301 to the bare
   URL (snap-log: `301 …?i=jason-duval-01 → 200 /gta-6/characters/jason`), so no lightbox opens (F2-21).

## Rules (T3)

| Rule id | Plain words | Script | Observations reproduced | Proving input |
|---|---|---|---|---|
| F2-R1 | Title = "<h1> \| GTA 6 <suffix>" per type (vehicles: class noun "Bike"/"Sports Car"/"Helicopter" + " Stats, Price, How To Get"); unique weapon variants: "<name>: GTA 6 Unique Weapon Location & How To Get" | `evidence/rules/f2-detail-title.mjs` | 14/14 PASS | F2-33 (Drug Mule KZ-59) vs F2-03 (KZ-59) |
| F2-R2 | Stat bars on a 0–10 scale with one decimal, bar width = value × 10 %; vehicles 5 bars + "Rating" (off-road) + road rating (whole numbers, no bar); weapons 4 bars + "Overall" (one decimal, no bar) | `evidence/rules/f2-detail-statbar.mjs` | 14/14 PASS | F2-01 Off-Road Handling 8.1 → 81 % |
| F2-R3 | "Compare To": same-list items A→Z; each link = comparison page with the two aliases sorted A→Z | `evidence/rules/f2-detail-compare-to.mjs` | 6/6 PASS | F2-13 Nightblade → `vehicle1=sunset-sanchez&vehicle2=western-nightblade` (current item first) vs Sanchez → `vehicle1=maibatsu-sanchez&vehicle2=sunset-sanchez` (current item second) |
| F2-R4 | First hover on the stars → exactly one GET `type=user-token`; later hovers none; no write | `evidence/rules/f2-detail-vote-token.mjs` | 2/2 PASS | F2-11 → F2-12 |
| F2-R5 | One previous + one next link (same list), inserted only when scrolled near the end; next opens that item | `evidence/rules/f2-detail-pager.mjs` | 3/3 PASS | F2-23 (0/0) vs F2-24 (1/1) |
| F2-R6 | Unknown slug (any list) → 404 page "404 Page Not Found" / "Get back inside the map!", no rating, no stats | `evidence/rules/f2-detail-404.mjs` | 2/2 PASS | F2-09 |
| F2-R7 | Lightbox: thumbnail k → "k/N"; next/ArrowRight +1, ArrowLeft −1; Escape closes; URL unchanged | `evidence/rules/f2-detail-lightbox.mjs` | 5/5 PASS | F2-16..F2-20 |
| F2-R8 | Canonical URL: trailing slash / upper case → canonical; `?i=` → 301 bare; other query kept; `/vehicles/gta-6/<alias>` served as-is | `evidence/rules/f2-detail-url.mjs` | 5/5 PASS | F2-21 vs F2-22 |

All 8 scripts: `for f in evidence/rules/f2-detail-*.mjs; do node $f; done` → 51/51 PASS.

## Cases

- File `evidence/cases/f2-detail.json` → run `evidence/runs/run-f2-detail.json`: **34 cases, 34 clean, 0 excluded**.
- Re-runs merged into the run file (field `merged`, raw partial runs in `evidence/runs/parts/`): the first
  attempt of F2-02..F2-10, F2-16..F2-22, F2-25, F2-28, F2-29, F2-32..F2-34 hit an origin outage (navigation
  timeouts, one "500 Internal Server Error") between ~10:55 and 11:41 UTC while cached pages kept answering;
  after one curl per 1–2 min showed recovery they were re-run. Harness fixes: F2-21 redesigned (the `?i=`
  URL is redirected, so waiting for a lightbox was wrong), F2-22 replaced by a plain query-string probe,
  F2-25 given a wait after the click (slow uncached target).
- Coverage: 8 page types (F2-01..F2-08), 404 ×2, rating hover ×2, Compare To mouse/keyboard (F2-13..F2-15,
  F2-34), gallery lightbox mouse/keyboard + deep link (F2-16..F2-21), prev/next (F2-23..F2-25), comments
  (observe only, F2-26), 390×844 (F2-27), URL variants (F2-22, F2-28..F2-30), more titles (F2-31..F2-33).
- Data-only readout keys (live database values, compare as relations only): `heading`, `title` (names),
  `list:stat-values`, `attr:stat-bar-N@style` (only the value×10 relation is behaviour), `text:rating-total`,
  `list:compare-to-items`, `count:compare-to-items`, `attr:compare-to-item-*@href` (aliases; sorting is
  behaviour), `list:variants`, `count:variants`, `list:appearances`, `count:gallery-thumbs`, the N of
  `text:lightbox-counter`, `attr:pager-*@href`, `text:pager-*`.

## Command vocabulary

| Token | Role | Accessible name / label | What it does |
|---|---|---|---|
| `heading` | heading level 1 | item display name ("<Make> <Model>" for vehicles/weapons) | page title |
| `breadcrumb` | link | list label, e.g. "GTA 6 Vehicle Stats, Price, How To Get" | back to the list page |
| `share` | links ×3 | "Share on Twitter", "Share on Reddit", "Copy Link" | third-party share (AddToAny) |
| `hero-image` | img ×2 (vehicles only) | "<name> - GTA 6 Vehicle Stats, Price, How To Get" + "<Make> Manufacturer" logo | main image + make logo |
| `rating-block` / `rating-stars` / `rating-total` | group / 5 stars / text | "<avg> of 5 (<n> Votes)" | voting (write; hover fetches token only) |
| `favorites-button` | button | "Add To Favorites" (star icon) | see F10 (guest → login prompt) |
| `compare-to` | button (dropdown toggle, `aria-expanded`) | "Compare To" | opens `compare-to-menu` (vehicles, weapons only) |
| `compare-to-items` | links | other item names | open the 2-item comparison |
| `section-titles` | headings level 2 | "<Name>: GTA 6 Info", "<Name>: How To Get", "<Make> <Name> GTA 6 Statistics", "<Name> Description:", "<Name>: GTA 6 Screenshots", "<Name> Game Appearances", … (most shown in capitals) | page sections |
| `info-labels` | term labels | see Behavior summary 5 | label/value rows |
| `stat-labels`, `stat-values`, `stat-bars` | text + meter-like bar | "Speed", "Acceleration", … | statistics |
| `variants` | card links | variant / base model names | related items |
| `gallery`, `gallery-thumbs`, `gallery-empty` | group, links | thumbnail alt = caption | thumbnails; "Coming soon." when empty |
| `lightbox`, `lightbox-counter`, `lightbox-next`, `lightbox-prev`, `lightbox-close` | dialog-like overlay, text, links, button | "k/N", "next", "previous", "close" | image viewer |
| `pager-prev`, `pager-next` | links (`rel=prev/next`) | neighbour item names | previous / next item |
| `comments-*` | tabs "Comment", "Login"; sort links "Best/Popular/Newest/Oldest"; editor `role=textbox` aria-label "editor", placeholder "Say something here..."; counter "characters left" (max 5000); guest name field "Your Name" + "Post" | comments (write; observe only) |
| `not-found-sub` | heading level 3 | "Get back inside the map!" | 404 page |

## Behavior summary for the spec

1. **Routes.** Each list has detail pages at `/gta-6/<list>/<alias>` (lists: vehicles, weapons, animals,
   characters, properties, radio-stations, missions). An alias is a lower-case slug that need not match the
   display name (e.g. weapon alias "assault-rifle" shows "Kozlov KZ-59"). Unknown alias in any list → HTTP 404
   with the site 404 page (title/h1 "404 Page Not Found", line "Get back inside the map!"). (F2-09, F2-10)
2. **URL normalisation.** A trailing slash or upper-case letters redirect to the canonical lower-case URL
   without slash; a `?i=` parameter is removed with a permanent redirect; other query strings are ignored and
   kept. Old-style `/vehicles/gta-6/<alias>` addresses (used by some ranking rows) show the same page.
   (F2-21, F2-22, F2-28..F2-30)
3. **Title and h1.** h1 = display name (vehicles and weapons: "<Make> <Model>"). Document title =
   "<h1> | GTA 6 <suffix>": vehicles "<class noun> Stats, Price, How To Get" (Bike, Sports Car, Helicopter …),
   weapons "Weapon Stats & How To Get", animals "Animals Guide & Locations", characters "Characters Guide, Bio
   & Voice Actor", properties "Properties & Garages", radio "Radio Station Songs & Tracklist", missions
   "Mission Guide & Walkthrough"; unique weapon variants "<Model>: GTA 6 Unique Weapon Location & How To Get".
   (F2-01..F2-08, F2-31..F2-33)
4. **Header block (all types).** h1; one breadcrumb link back to the list (label = list's short title); three
   share links; vehicles add a hero image plus the manufacturer logo. Then an action row: star rating (5 stars
   + "<avg> of 5 (<n> Votes)"), "Add To Favorites" (F10) and — vehicles and weapons only — "Compare To".
   (F2-01..F2-08)
5. **Info sections, in this order** (labels are the spec; values are data; a label row is omitted when the
   item has no value):
   - Vehicle (standout variant): "<Name>: GTA 6 Info" — Standout Set, Vehicle Class (link to the class
     ranking), Manufacturer (logo + name), Style, Era, Seats, Base Model (card); a second untitled list — Drive
     Train; Statistics; "<Name> Description:". (F2-01)
   - Vehicle (base model): Info — Vehicle Class, Manufacturer, Style, Era, Specialist, Seats, Based on (Real
     Life), Mass / Weight, Drive Train, Gears; "<Name>: How To Get" — Variant / Conversion (cards), Notable
     Owners; Statistics + "Similar Vehicles" cards; Description; Screenshots gallery; Game Appearances (one card
     per earlier game). (F2-02; helicopter F2-32 same family)
   - Weapon: Description first; Info — Manufacturer, Weapon Class, Based on (Real Life), Ammo Capacity,
     Extended Ammo; How To Get — Acquisition Method, Story Mode Price, Modifications, Variant / Conversion
     (cards); Statistics; Screenshots; Game Appearances. Unique variant: Info — Manufacturer, Weapon Class,
     Base Model, Ammo Capacity; How To Get — How To Unlock, Modifications. (F2-03, F2-33)
   - Animal: Info — Animal Category, Habitat, Recommended Weapon, Animal Species, Animal Class; Screenshots. (F2-04)
   - Character: Info — Role, Gender, Born In Year, Nationality, Location, Occupation, Also Known As,
     Performer / Actor, Family, Affiliation, Property / Safehouse, Vehicles (cards); Screenshots; Artworks;
     Video. (F2-05)
   - Property: "How to get the <Name>:" text; "<Name>: Map Location" image; Info — Property Type, Property
     Style, Location, State / Region, Vehicles Capacity; How To Get — How To Unlock, Story Mode Price. (F2-06)
   - Radio station: Info — Music Genre, Radio Host; "<Name> Tracklist:". (F2-07)
   - Mission: Info — Mission Number, Mission Type, Chapter, Mission Giver, Protagonist (Playable), Required
     for 100%, Featuring, Rewards; "Mission Walkthrough - <Name>"; "Mission Objectives" (one sub-heading per
     objective); "Mission Completed"; an "On this page" jump list (Trophies, Walkthrough, Rewards) with lazily
     shown "Trophies & Achievements" and "Rewards" boxes. (F2-08 + snapshot)
6. **Statistics.** Vehicles: Speed, Acceleration, Asphalt Handling, Off-Road Handling, Strength — each a
   number with one decimal on a 0–10 scale and a bar filled to value × 10 %; then "Rating" (off-road overall,
   whole number) and the road rating (whole number, unlabelled). Weapons: Damage, Accuracy, Handling, Range
   (bars, same scale) and "Overall" (one decimal, no bar). Labels shown in capitals. (F2-01..F2-03, F2-31, F2-32)
7. **Compare To.** A dropdown button (keyboard: Enter opens, Escape closes; `aria-expanded` follows) listing
   the other items of the same list (vehicles: same class) A→Z; each entry opens the comparison page with
   exactly two items whose aliases are sorted A→Z (`?vehicle1=<a>&vehicle2=<b>`, weapons `weapon1/weapon2`).
   (F2-13..F2-15, F2-34)
8. **Gallery.** Image galleries are a horizontal thumbnail strip with arrows; an empty gallery shows "Coming
   soon.". Clicking thumbnail k opens a full-screen viewer at image k: counter "k/N", previous/next arrows
   (also ArrowLeft/ArrowRight), download and two share buttons, close (also Escape), caption below. Opening or
   moving does not change the URL. (F2-03, F2-04, F2-16..F2-21)
9. **Rating.** Shows the average and vote count; casting a vote is a server write (out of scope for v1, or a
   local-only rebuild decision). The original requests a form token on the first hover/touch/focus of the
   stars, once per page. (F2-11, F2-12)
10. **Previous / next.** Below the article: one link to the previous and one to the next item of the same
    list, labelled with their names; they may be rendered lazily, but must exist once the reader reaches the
    end. (F2-23..F2-25)
11. **Comments (read-only in v1).** Section with tabs "Comment" / "Login", sort "Best · Popular · Newest ·
    Oldest" (default Newest), an editor (placeholder "Say something here...", 5000-character limit with
    "characters left"), guest posting with "Your Name" + "Post". Do not show commenter names in fixtures.
    (F2-26; pending-after-v1 item 2)
12. **No tabs or accordions** on detail pages. (F2-01..F2-08)
13. **Small screens (390×844).** Same blocks, stacked; Compare To, Add To Favorites, rating, stat bars and
    breadcrumb remain visible. (F2-27)

## Findings

- F-F2-01 Detail pages are server HTML; their only network call is the vote-token GET on the first star hover. Evidence: UH:79-104, F2-11/F2-12.
- F-F2-02 Deferred page scripts (gallery, compare) never run when `navigator.webdriver` is true; automation must disable that flag to see real behaviour. Evidence: JCHI:4, F2-16 vs first-run failures.
- F-F2-03 Galleries use Ignite Gallery's own lightbox (UIkit "igui"), not Regular Labs Modals; Modals only wrap the "Log In" links. Evidence: IG:361, page markup `href="#loginbox"`.
- F-F2-04 No tabs/accordions on any of the 8 detail types; the tabsaccordions scripts are not loaded there. Evidence: F2-01..F2-08 (`count:tabs`=0), walk.json.
- F-F2-05 The server 301-redirects `?i=<image>` to the bare URL, so the gallery's deep-link feature is dead on the live site. Evidence: snap-log, F2-21; IG:555-560.
- F-F2-06 Other query strings are kept and served (F2-22); trailing slash and upper case are redirected (F2-28, F2-29); `/vehicles/gta-6/<alias>` is served without redirect (F2-30).
- F-F2-07 "Compare To" lists 75 motorcycles on a motorcycle page and 24 weapons on the KZ-59 page, A→Z, each with a sorted alias pair. Evidence: F2-13, F2-34.
- F-F2-08 Previous/next links live in a lazy template and are absent from the document until scrolled near. Evidence: RD:11-13, F2-23/F2-24.
- F-F2-09 Rating text formats seen: "0.0 of 5 (0 Votes)", "3.6 of 5 (7 Votes)", "4 of 5 (12 Votes)". Evidence: F2-01..F2-08.
- F-F2-10 Between ~10:55 and 11:41 UTC uncached pages timed out or answered 500 while LiteSpeed-cached pages answered in ~0.5 s. Evidence: snap-log, first-run errors (merged field).

## Unknowns

| Id | Question | Rebuild should |
|---|---|---|
| U-F2-01 | Rating average format ("4" vs "4.0"; rounding) and voting rules (one vote per visitor? guests allowed?) | show one decimal always ("4.0 of 5 (12 Votes)"); voting disabled or local-only in v1 |
| U-F2-02 | Which items fill "Compare To" (same class for vehicles; weapons: same class?) and "Similar Vehicles" | vehicles: same class; weapons: same weapon class; similar = same class + same style (HYPOTHESIS) |
| U-F2-03 | Previous/next order key | use the list's catalogue order (A→Z by name within the list) |
| U-F2-04 | Title class noun for the other 18 vehicle classes | derive a singular noun per class in the spec's class table (e.g. Boats → "Boat", Super → "Super Car") |
| U-F2-05 | Whether `?i=` deep links are meant to work | support `?i=<image key>` opening the viewer (harmless improvement) or ignore it; do not redirect other queries |
| U-F2-06 | Comment loading/sorting behaviour beyond labels | comments out of v1; show the section shell or omit |
