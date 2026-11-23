# F6 — Guide pages (feature id `f6-guides`)

Observed 2026-11-23 on https://www.gtabase.com as a guest (never signed in, read-only guard on). Analysis side of
the clean-room wall: file:line references point at the site's downloaded scripts; the "Behavior summary" is plain
language for builders.

Pages: `/gta-6/animals/`, `/gta-6/characters/`, `/gta-6/gangs/`, `/gta-6/properties/`, `/gta-6/radio-stations/`,
`/gta-6/map-locations/`, `/gta-6/gta-6-cheats-ps5-cheat-codes`, `/gta-6/gta-6-cheats-xbox-series-xs-cheat-codes`,
`/gta-6/gta-6-cheats-pc-full-list-of-cheat-codes`; plus `/membership/` for the Regular Labs Tabs & Accordions
component, because no F6 page uses it (its FAQ is the only multi-item accordion found).
Profile: `tools/profiles/f6-guides.profile.json` (+ `f6-guides-noyt.profile.json`).

## T1 Explain (static)

Scripts (all in `evidence/bundle/all/`):
- **RP** = `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f23745e55d941932a870be64896e8fc88.js`
  (line 2 names it `templates/SDH_J4/js/radio-player.js`, 69 lines). Loaded only on the radio page.
- **YT** = `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2fbe64c3ae008ce2096dcd596ef7630423.js`
  (JCH copy of `https://www.youtube.com/iframe_api`; downloaded for this trace — it was missing from the bundle).
- **UI** = `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f66544a25c89cf2b55a76799c57dc3d90.js`
  (`/media/com_jchoptimize/dynamic-js/user-interact-callback.js` + `reduce_unused_js.js`).
- **TPL** = `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f3322421de0bb102435db8634e7fc0047.js`
  (`templates/SDH_J4/js/template.js` of the shared Games Atlas template, 17 lines).
- **TA** = `media__tabsaccordions__js__script.min.js` + `modules/{set,item,button}.min.js` (Regular Labs Tabs & Accordions 3.2).
- REA `analyze-javascript-application` on bundle/all with `--source-path` RP, TPL, TA script/set/item/button, UI →
  analysis **ev_7642ee3762c3138713a7497626828007f96d19cf23767853e198b28fff2b5e26**, routes view
  ev_fa69f06793adf102d7e779234f1c920a5420346f3f951a20b86b71593c488da3 (no error; 7 sources parsed, 0 parse
  failures, 264 function nodes, 16 timers; evidence/rea/f6-guides/evidence.json). No route patterns, no storage,
  no same-site endpoints in these sources.

**Entry points.**
- Guide pages (animals, characters, gangs, properties, map-locations, cheats ×3) have **no feature script**: they are
  server-rendered Joomla category/article pages. Their only behavior is plain links, in-page anchors and the
  Regular Labs Quick Index (a server-rendered table of contents with `#anchor` links). No tabs/accordions are
  rendered on any of them (0 `[data-rlta-element]`, TA script not loaded — snapshot `<script>` lists + F6-01/04/05/07/09/18).
- JCH Optimize defers part of each page's scripts (`type="jchoptimize-text/javascript"` + `data-src`). UI:4
  (`JchOptimizeUserInteraction`) loads them on the first `pointerover/mouseover/pointerdown/mousedown/keydown/
  touchstart/wheel/scroll/focus`, when the page is scrolled away from the top, or after a 10 s fallback — and
  **never** when `navigator.webdriver` is true (UI:4 `detectHeadless`). On the radio page the deferred set includes
  the YouTube iframe API (YT). → the player cannot be ready before the visitor interacts (or 10 s pass).
- Radio page: RP:19 `DOMContentLoaded` → collects stations and tracks, binds buttons; RP:9–17 creates the YouTube
  player once `YT.Player` exists (RP:19 polls every 100 ms, at most 100 times = 10 s; RP:18 also answers
  `onYouTubeIframeAPIReady`).

**Functions and hops (RP).**

| Function | Line | Role |
|---|---|---|
| setPlayPauseButton | 4 | label = icon + "Play" / "Pause"; icon-only variant for the floating bar |
| getCurrentStation / getCurrentTrack | 5–8 | current = stations[stationIndex].tracks[trackIndex] |
| initYouTubePlayer | 9–17 | 1×1 px hidden player, controls off, keyboard off, inline; `onReady` runs the remembered click (pendingPlay); `onError` skips to next track, gives up after a full lap of errors (RP:12 `errorSkips>=station.tracks.length`) and shows Play; `onStateChange`: PLAYING → Pause label + progress timer, BUFFERING → Pause label, PAUSED → Play label + timer stop, ENDED → next track |
| DOMContentLoaded handler | 19–35 | stations = `.category-items.radio-stations .items-row`; per station, tracks = its `.tracklist-container .radio-play-button` rows; a button without `data-youtube-id` is hidden (RP:20/23) and not a track; a station without tracks is dropped; single-station detail pages use `li.radio-tracklist table tbody .radio-play-button` (RP:23); no tracks at all → floating bar hidden (RP:26); current = station 0 / track 0; floating bar shows its title/artist (paused); prev/next/toggle buttons bound (RP:29–31); progress-bar click seeks to the clicked fraction (RP:32–35) |
| lockPlayerActions / unlockPlayerActions | 35 / 36 | 3 s lock after each action; released on PLAYING/PAUSED/ENDED/error |
| playTrack | 37–42 | player not ready → remember the request (pendingPlay) and change nothing; same track while locked → ignored; else previous button → Play, new current, its button → Pause, bar → Pause icon + title/artist, time reset, lock, `loadVideoById` |
| togglePlayPause | 43–46 | not ready / no track / locked → ignored; current not yet loaded → playTrack; PLAYING or BUFFERING → pause (Play label); else play (Pause label) |
| previousTrack / nextTrack | 47–49 / 50–52 | within the current station; wrap last↔first; ignored until the player is ready |
| updateFloatingPlayer | 53–56 | bar title = track title (`strong`), artist = row's `.article-info` text, toggle icon |
| updateProgress / resetProgress / timers | 57–66 | every 100 ms while playing: fill width = time/duration %, `m:ss` texts; reset → 0 % and 0:00 / 0:00 |
| formatTime | 67–69 | floor seconds; non-finite or negative → 0; `m:ss` with 2-digit seconds |

**TPL (template.js).** TPL:4 builds the site menu toggle ("Menu" button, `menu-opened` class, slide 0.2 s) — a shell
feature (F9); TPL:6 back-to-top: `.cd-top` gets `cd-is-visible` past 300 px of scroll and `cd-fade-out` past
1200 px; click scrolls smoothly to the top; TPL:6–13 a page-loader overlay armed on some link clicks (contact/user
pages only); TPL:13–17 slow-interaction telemetry to Clarity (blocked).

**TA (Tabs & Accordions) — the component the F6 brief expected.** Used in the GTA 6 section only by the vehicles and
weapons lists' one-item "Changelog" accordions (F1) and site-wide on /membership/ (FAQ, 10 items); not by any F6 page.
- script.min.js:5 `init` → one `Set` per `[data-rlta-element="container"]` present **at that moment** (no later
  scan); in-page `#hash` links that point at an item open it instead of jumping (`handleAnchorLinks`). The TA
  script is itself JCH-deferred (`type="jchoptimize-text/module"`), and the membership FAQ sits inside a JCH
  "reduce DOM" `<template>` that is only rendered when scrolled near (bundle `…539bfd6c…js` reduce_dom.js). If the
  visitor interacts before scrolling to the FAQ, TA initialises first, never sees the FAQ, and the FAQ stays in its
  server state (`data-rlta-state="initial"`, clicks ignored) — F6-39 vs F6-27.
- set.min.js:6 defaults; page options (`rl_tabsaccordions` script options): `addHashToUrls: true`,
  `rememberActive: false`, `switchToAccordions: false`, `mode: click`, `animations: fade,slide`, `scrollOnUrls: top`.
- set.min.js:12 + 39–44 active item on load: URL hash `#<alias>` (matched to button id `rlta-<alias>`), else query
  `?tab=` / `?accordion=` (but the server 301-strips unknown query parameters, so only the hash works), else
  the item marked open in the markup.
- set.min.js:49–51 opening an item **pushes** `#<alias>` onto history (so Back walks the opened items).
- item.min.js:13–15 accordions: opening one closes the previously open one (only one open); tabs: same plus centre the
  button.
- set.min.js:16 keys on a focused button: Enter toggles; Home first; End last; ArrowUp/ArrowDown previous/next
  (vertical sets) and ArrowLeft/ArrowRight (horizontal sets); Tab moves focus only. **Live result differs**: on the
  membership accordion only Enter works; arrows do nothing and Home/End throw
  `Cannot create property 'scroll' on boolean 'true'` (openFirst/openLast pass `true` where item.min.js
  `prepareActionsObject` expects an object) — F6-30..F6-32.
- button.min.js:6 + set.min.js:36–37 ARIA: tab sets use role `tab` + `aria-selected`; accordion sets role `button` +
  `aria-expanded`; panels `region` / `tabpanel`.

**Data flow / dependencies.** No same-site requests from any F6 page script (the only requests are third-party:
YouTube `www-widgetapi.js`, the `/embed/` iframe and its internal `youtubei/v1/*` POSTs, which the read-only guard
blocks). No browser storage is used by RP or TPL (static); TA could store the active item in localStorage but
`rememberActive` is off.
**Effects:** DOM only (labels, icons, hidden buttons, bar text, URL hash for accordions).
**Server-side unknowns:** how the lists are authored (Joomla categories/custom fields), why some cards link to
alternate URL forms (`/gangs/gta-6/<slug>`, `/properties/gta-6/<slug>`, `/soundtrack/gta-6/<slug>`), which the
server serves directly with 200 (no redirect).

## T2 Control → effect: a track's Play button on /gta-6/radio-stations/

1. **Page load.** Server HTML holds 24 station blocks, each with a `# | Track | Play` table; every row has a Play
   button; 301 of the 819 buttons carry a video reference (snapshot + F6-09). The floating bar is server HTML too
   (empty title/artist, 0:00 / 0:00).
2. **DOM ready → model.** RP:19–25 builds `stations[]` (only rows with a reference; others hidden RP:20 → F6-09
   `track-play-hidden=518`, `track-play-visible=301`; the empty station "The Wipe" is dropped, F6-09
   `station-without-tracks=1`). RP:29 sets current = station 1 / track 1 and fills the bar (F6-09
   `player-title` = first row's title, `player-artist` = first row's artist line, toggle icon `fa-play`).
3. **First interaction → player script.** The hover in `macro:wake` triggers JCH's deferred loader (UI:4/50); it
   loads YT (iframe_api copy), which fetches `www.youtube.com/s/player/…/www-widgetapi.js` (F6-09 `calls`, 200).
   RP:19's 100 ms poll sees `YT.Player` and RP:12 mounts a 1×1 `/embed/` iframe (F6-09 `calls`: GET embed 200).
   YouTube's own POSTs (`youtubei/v1/log_event`, `/player`, `/next`) are aborted by the read-only guard
   (F6-09/F6-10 `blocked`), so real audio never starts in the runs.
4. **Click Play on track 2 of station 1** (F6-10). RP:28–29 handler: not the current track → `playTrack(0,1)`
   (RP:37–42): track 1's button → "Play", track 2's → "Pause" (F6-10 `s1-track2-play=PAUSE`,
   `track-play-pause-state=1`), bar → title "That's It" = row 2 title, pause icon (F6-10), time reset to 0:00, 3 s
   action lock, `loadVideoById`.
5. **Bar Next** (F6-11) → RP:50–52 next playable track of the same station → row 3; previous row's label back to
   "Play". **Prev ×2** (F6-12) → row 1; **Prev** again (F6-13) → wraps to the last row (34); **Next** (F6-14) →
   wraps to row 1.
6. **Another station** (F6-15): clicking station 3's first playable track switches station; **Next** (F6-16)
   then stays inside station 3 (its 2nd playable track, not station 1's).
7. **Toggle** (F6-17): after the 3 s lock the bar toggle calls RP:43–46; the player is still buffering (data
   request blocked) → pause branch → label "Play", icon `fa-play`.
8. **No player** (run-f6-guides-noyt.json, YouTube unreachable): RP:37 stores the click as pending and changes
   nothing — label stays "Play", bar stays on track 1 (F6NY-01); Next/toggle/Prev do nothing (F6NY-02..04).

## Rules (T3)

| Rule id | plain words | script | observations reproduced n/n | proving input |
|---|---|---|---|---|
| F6-R1 radio navigation | Next/Previous move through the current station's playable tracks and wrap; only a row click changes station; load = first track of first station | evidence/rules/f6-guides-radio-nav.mjs | 9/9 | F6-13: Previous on track 1 of station 1 → its last track (34) |
| F6-R2 radio playable/labels | only rows with a video reference are playable (others' buttons hidden); one "Pause" at most; idle bar = play icon + 0:00; without a ready player every control is inert | evidence/rules/f6-guides-radio-playable.mjs | 18/18 | F6-09: 819 rows, 301 shown, 518 hidden; F6NY-01: Play click without player → still "Play" |
| F6-R3 guide structure | page total = sum of its grids; card link name "Read more: <name>"; price only on purchasable cards; no tabs/accordions on guides | evidence/rules/f6-guides-grid-counts.mjs | 15/15 | F6-07: 8+4+3+5 = 20 cards, 8 with a price |
| F6-R4 cheat pages | 61 cheats in 5 categories (10/11/21/3/16), D-pad icon sequences with direction alt text, same on PS5/Xbox, activation L1+R1 vs LB+RB, switcher marks current, PC page = table of 3 links and no rows, index links = path#slug | evidence/rules/f6-guides-cheats.mjs | 16/16 | F6-21 vs F6-18: same sequence, how-to icons LB/RB vs L1/R1 |
| F6-R5 accordion | one open at a time, click toggles, Enter toggles, `#alias` pushed and honoured on load; arrows/Home/End inert live; late-rendered accordion never initialises | evidence/rules/f6-guides-accordion.mjs | 16/16 | F6-28: click item 2 → item 1 closes, URL `#why-a-paid-membership-where-does-the-money-go` |

## Cases

- File: `evidence/cases/f6-guides.json` — **39 cases** (F6-01..F6-39); run `evidence/runs/run-f6-guides.json`
  (39 cases, merged per case from 7 batch runs started 10:55–11:57 UTC (batch files in `evidence/runs/batches/`, merged with `merge-batches.py`; each case names its batch in `batch`) because the origin failed intermittently; the latest error-free record of each case is kept).
- Supplementary: `evidence/cases/f6-guides-noyt.json` (4 cases F6NY-01..04, profile
  `tools/profiles/f6-guides-noyt.profile.json` = same plus youtube.com blocked) → `evidence/runs/run-f6-guides-noyt.json`,
  4/4 clean: the "no JS-ready player" state.
- Repeat check: a second run of F6-01..F6-09 at 12:0x UTC reproduced every readout
  (`evidence/runs/repeat/run-f6-guides-01-09.json`; the rest of that repeat was stopped to spare the origin).
- Clean: 39/39. Excluded: none in the final run. Harness fixes on the way (all re-run): (1) the runner could not
  load JCH-deferred scripts while `navigator.webdriver` was true → optional `browser.args` patch in
  tools/web/run-cases.mjs + `--disable-blink-features=AutomationControlled`; (2) the animals image link is 0×0 →
  click the title link (F6-02); (3) the mobile "Menu" button is not the visible mobile menu (F9 shell) → F6-36
  re-targeted to the characters grid at 390×844; (4) the membership FAQ must be scrolled into view before the
  deferred accordion script runs (mode `membership`), and F6-34 needs a real reload because a hash-only `goto` does
  not reload; (5) origin HTTP 500/timeouts 10:45–11:45 UTC on uncached pages → those cases waited for recovery.
- Coverage: happy paths (cards, index links, platform switch, radio play/next/prev, accordion click), keyboard
  (Enter/Arrow/Home/End on accordion headers), deep links (`#section`, `#accordion-alias`), Back (F6-03), 404
  (F6-25), 390×844 (F6-35..F6-38), empty/no-player state (F6NY-*), empty station (F6-09), lazy block race (F6-39).
- Data-only readout keys (live database values; compare as relations, not literally): `heading`, `title`,
  `count:grid-1-cards`..`count:grid-4-cards`, `count:guide-card`, `count:card-with-price`, `count:card-with-location`,
  `count:plain-person-row`, `count:bullet-list-1`, `attr:grid-1-first-link@href`, `attr:grid-1-first-card@href`,
  `count:station-row`, `count:track-play`, `count:track-play-visible`, `count:track-play-hidden`,
  `text:player-title`, `text:player-artist`, `text:s1-*-title`, `text:s1-track1-artist`, `text:s3-*-title`,
  `count:cheat-row`, `count:cheat-category-*-rows`, `attr:first-cheat-key-*@alt`, `text:first-cheat-unlock`,
  `count:toc-link`, `count:indexed-heading`, `count:inline-gallery`, `count:acc-button`, `text:map-banner-link`.
  All other keys are behavior (URL/hash, labels, icon classes, enabled/visible, counts of controls, ARIA state,
  errors, blocked/calls).

## Command vocabulary

Selectors live in tools/profiles/f6-guides.profile.json (CSS copied from the original markup — analysis side only).

| token | role | accessible name / visible label | what it does |
|---|---|---|---|
| heading | heading level 1 | page title, e.g. "GTA 6 Animals Guide: All Animals, Birds & Fish" | page identity |
| section-heading | heading level 2 | section titles ("Full List of GTA 6 Animals", ...) | structure |
| card-grid | list of cards | — | one grid per sub-list (3 on animals, 4 characters, 2 gangs, 4 properties) |
| guide-card | link card (image + name, some with fields) | — | one item of a guide |
| grid-1-first-link / grid-1-first-title-link | link | "Read more: <item name>" (aria-label; visible text = item name) | opens the item's detail page |
| grid-1-first-card | link (whole card is the link on gangs/properties) | card text (name, type, Location/Parking spots/Price) | opens the detail page |
| plain-person-row | non-link row (image + name + text) | — | "other characters" that have no detail page |
| faq-question | heading level 3 | question text | FAQ block (characters) |
| toc / toc-link | navigation block "… Index" with links | section titles | jump to `#<section-slug>`; URL gets the hash |
| indexed-heading | headings with anchors | section titles | targets of toc links |
| map-banner-link | link | "Interactive GTA 6 Map & Collectibles Tracker" (in a banner "Looking for the interactive tool? …") | goes to /gta-6/map/ |
| station-row | station block | station name (heading level 3, link "Read more: <station>") + genre | one station with its tracklist table |
| tracklist-header | table column headers | "#", "Track", "Play" | — |
| track-play | button | "Play" / "Pause" (icon + word; shown upper-case by CSS) | play/pause that track; hidden when the track has no video |
| floating-player | fixed bottom bar | title + artist texts | now-playing bar (visible on desktop and 390x844) |
| player-title / player-artist | text | current track title / "artist (year)" | — |
| player-prev | button | "Previous track" (aria-label, icon only) | previous playable track of the current station, wraps |
| player-toggle | button | "Play/Pause" (aria-label, icon only) | toggle the current track |
| player-next | button | "Next track" (aria-label, icon only) | next playable track of the current station, wraps |
| player-time / player-duration | text | "0:00" | elapsed / total, m:ss |
| cheat-row | row | cheat name (heading level 3) + effect + "How to unlock: …" + icons | one cheat |
| cheat-category | heading level 2 | "Player Cheats", … (shown upper-case) | category group |
| cheat-key-icons / first-cheat-key-N | image | "UP" / "DOWN" / "LEFT" / "RIGHT" (alt) | one step of the button sequence |
| howto-step-icons | images inside the numbered steps | PS5 "UP","L1","R1"; Xbox "…","LB","RB" | activation combo |
| platform-link / platform-current | link cards | "GTA 6 Cheats for PS5", "GTA 6 Cheats for Xbox Series X\|S"; current one adds "You are here" | switch platform page |
| pc-platform-table-link | links in a 3-cell table | "GTA 6 Cheats for PS5", "… Xbox Series X\|S", "… PC" | PC page's platform links |
| back-to-top | link | (icon) | appears after scrolling, scrolls to top |
| acc-button / acc-N | button (role=button, tabindex 0, aria-expanded, aria-controls → panel) | question text | accordion item (membership FAQ, vehicles changelog) |
| acc-open / acc-panel-open | — | — | open item(s) |
| faq-section | page block (lazily rendered by the original) | — | holds the membership FAQ accordion |

## Behavior summary for the spec

Guide pages (animals, characters, gangs, properties, radio stations, map & locations, cheats PS5 / Xbox / PC):

1. **Static article.** Each guide is one server-rendered page: H1, hero image, share bar, intro paragraphs, then
   sections (H2/H3) mixing text, card grids, bullet lists, tables and FAQs. Everything is in the HTML: no
   client-side filtering, sorting, paging, "load more", tabs or accordions (F6-01, F6-04, F6-05, F6-07, F6-09,
   F6-18, F6-24: 0 tab/accordion parts; F6-09 table controls 0; F6-18/F6-21 no copy/filter controls).
2. **Card grids.** A sub-list is a grid of cards under its own heading; the page total is the sum of its grids.
   Shapes: animals 3 grids (land / birds / sea; F6-01), characters 4 grids + a block of non-link "other
   characters" rows + a bullet list of mentioned names + 5 FAQ questions (F6-04), gangs 1 grid of 3 + an empty
   law-enforcement grid followed by a 12-item bullet list (F6-05), properties 4 grids (purchasable / story /
   edition / safehouses) whose cards show Location, Parking spots / Unlock and — only for purchasable — Price
   (F6-07). Rebuild with its own sample sizes.
3. **Card link.** A card opens the item's detail page (F6-02 animal, F6-06 gang, F6-08 property); Back returns to
   the guide with the same cards (F6-03); its link name is "Read more: <item name>" (F6-01). Some
   cards point at alternate URL forms (`/gangs/gta-6/<slug>`, `/properties/gta-6/<slug>`) that serve the detail
   page directly with 200 (F6-08). Rebuild: one canonical detail URL per item.
4. **Quick index (table of contents).** Cheat and map-location pages start with an index block (title
   "<page> Guide & Full List" / "… Index") listing one link per H2/H3 section; each link is
   "<page path>#<slug of the heading>"; clicking jumps there and puts the hash in the URL; loading the page
   with a hash keeps it (F6-18, F6-19, F6-22, F6-23, F6-24).
5. **Cheat pages.** One page per platform. Console pages (PS5, Xbox) list the same 61 cheats in 5 categories
   (Player 10, Combat 11, Vehicle Spawn 21, Environment 3, Screen Filter 16; headings shown upper-case). A row =
   name (H3), effect, "How to unlock: …", and the button sequence as a row of D-pad icon images whose text
   alternatives are UP/DOWN/LEFT/RIGHT (F6-18, F6-21). The "How to enter" steps show the platform combo
   (PS5: UP, hold L1 + press R1; Xbox: hold LB + press RB) (F6-18, F6-21). A two-card platform switcher (PS5,
   Xbox) under the intro marks the current card "You are here"; clicking the other card opens that page
   (F6-18, F6-20, F6-21). No copy button, search, filter or sort (F6-18, F6-21). The PC page has no cheat rows
   and no switcher; it shows a 3-cell table linking PS5, Xbox and PC pages (F6-22). Same content and icons at
   390×844 (F6-37).
6. **Radio page structure.** One block per station: cover image + name (link to the station page) + genre, then a
   table with columns "#", "Track", "Play"; each row = number, title (bold) + "artist (year)" line, Play button
   (F6-09). A fixed bottom bar ("floating player") shows the current title, artist, a time readout
   "m:ss / m:ss" with a clickable progress bar, and three icon buttons named "Previous track", "Play/Pause",
   "Next track" (F6-09, F6-38: also at 390×844).
7. **Playable tracks.** A row is playable only if it has a video reference; rows without one have no visible
   Play button; a station with no playable rows is ignored by the player (F6-09: 301 shown, 518 hidden, 1 empty
   station).
8. **Initial state.** Current track = first playable track of the first station; nothing plays; the bar shows its
   title/artist, 0:00 / 0:00, play icon; every row button reads "Play" (F6-09).
9. **Play a row.** Clicking a row's Play makes it current (its station becomes current), starts it, sets its button
   to "Pause" and every other row button to "Play" (at most one "Pause"), shows its title/artist in the bar with a
   pause icon and resets time to 0:00 (F6-10, F6-11, F6-15). Clicking the current row's button toggles
   play/pause (F6-17 via the bar toggle).
10. **Next / Previous** move within the current station's playable tracks and wrap (last → first, first → last);
    they never change station (F6-11..F6-16). When a track ends the player advances to the next one; a track that
    fails to load is skipped; after a whole lap of failures it stops and shows Play (static RP:12–17).
11. **Action lock.** After each play/pause action further toggles of the same track are ignored for up to 3 s or
    until the player reports playing/paused (static RP:35–46; F6-17 waited 3.5 s).
12. **No player yet.** Until the video player is ready (it loads after the first user interaction, or is
    unreachable) Play/Next/Previous/toggle change nothing on screen; a Play click is remembered and started when the
    player becomes ready (F6NY-01..04; static RP:37).
13. **Progress.** While playing, the bar updates 10×/s: fill = elapsed/duration, times as m:ss (minutes not padded,
    seconds 2 digits); clicking the progress bar seeks to that fraction (static RP:32–35, 57–69; not observable with
    the read-only guard).
14. **Back to top.** After scrolling down a page a back-to-top control appears (class visible past 300 px, faded
    past 1200 px); it scrolls smoothly to the top (F6-26; static TPL:6).
15. **Unknown route.** A non-existent guide URL returns the site 404 page (F6-25).
16. **Accordion component (only where used: /membership/ FAQ, vehicles changelog — not on F6 pages).** Header =
    button (role button, tabindex 0, aria-expanded, aria-controls → its panel); the server marks which item starts
    open (membership: the first of 10) (F6-27). Clicking an item opens it and closes the open one — at most one
    open (F6-28); clicking the open item closes it, zero open allowed (F6-29). Opening adds a history entry with
    "#<item-alias>" (F6-28); loading the page with "#<item-alias>" opens that item instead of the default (F6-34).
    Enter on a focused header toggles it (F6-33). Rebuild also: Space toggles; ArrowUp/ArrowDown/Home/End move
    between items (intended by the original, broken live: F6-30..F6-32). The rebuild must initialise accordions
    rendered later (the original misses them: F6-39).
17. **Phone width (390×844).** Same content and counts; grids collapse to fewer columns; card title links, cheat
    icons, the index and the platform switcher stay visible; the radio bar stays fixed at the bottom with all three
    buttons (F6-35..F6-38).

## Findings

- **F-F6-01** No F6 guide page uses Regular Labs Tabs & Accordions or the Modals gallery features: 0
  `[data-rlta-element]` and no tabs script on animals, characters, gangs, properties, radio, cheats, map-locations;
  Modals is present only for the header "Log In" box. Evidence: F6-01/04/05/07/09/18/24; snapshot script lists.
- **F-F6-02** Guide lists are plain server HTML card grids; counts (live 2026-11-23): animals 184 + 69 + 2 = 255;
  characters 2 + 6 + 10 + 49 linked cards, 10 non-link "other" rows, 17 mentioned names, 5 FAQ questions; gangs 3
  cards (+ 12 law-enforcement bullet items); properties 8 + 4 + 3 + 5 = 20 (8 with a price). Evidence: F6-01, F6-04,
  F6-05, F6-07.
- **F-F6-03** Card link accessible names are "Read more: <name>"; the animals image link is rendered 0×0 (only the
  title link is clickable). Evidence: F6-01, F6-02 (first run timeout on the image link), click.js probe.
- **F-F6-04** Some cards use alternate URL forms that the server serves with 200 (no redirect):
  `/gangs/gta-6/<slug>`, `/properties/gta-6/<slug>`, `/soundtrack/gta-6/<slug>`. Evidence: F6-05 href, F6-08 final
  URL, curl status checks.
- **F-F6-05** The radio page has 24 stations, 819 track rows, 301 playable (with a video reference); unplayable
  rows' buttons are hidden by script; one station ("The Wipe") has no rows. Evidence: F6-09; RP:20.
- **F-F6-06** The radio player is a hidden 1×1 YouTube embed controlled through the iframe API; its script is
  deferred until the first user interaction (JCH) and never loads for automation that reports
  navigator.webdriver. Evidence: RP:9–19, UI:4/50, F6-09 calls, F6NY-01.
- **F-F6-07** Next/Previous wrap within the current station; switching station only by clicking a row.
  Evidence: F6-11..F6-16, rule f6-guides-radio-nav.mjs.
- **F-F6-08** Without a ready player all controls are inert (no visible change). Evidence: F6NY-01..04.
- **F-F6-09** Cheat pages: 61 cheats in 5 categories on PS5 and Xbox with identical D-pad sequences (icon images
  with alt UP/DOWN/LEFT/RIGHT); activation combo differs (L1/R1 vs LB/RB); PC page has none and a 3-link table.
  No copy/filter. Evidence: F6-18, F6-21, F6-22, rule f6-guides-cheats.mjs.
- **F-F6-10** The PS5 and Xbox pages do not link to the PC page in their body. Evidence: F6-18/F6-21
  `body-link-pc=0`.
- **F-F6-11** Quick-index links are "<path>#<heading slug>"; the cached snapshot of the PS5 page carried
  `?utm_source=chatgpt.com` inside every index link (the index is built from the URL of the request that filled
  the page cache); the live run showed clean links. Evidence: evidence/html/gta-6_gta-6-cheats-ps5-cheat-codes.html,
  F6-18.
- **F-F6-12** The server 301-redirects any query parameter outside an allow-list (seen: `thumb_limitstart`,
  `limit`, `utm_*` pass; `i`, `foo`, `tab`, `accordion` are stripped). Consequence: Tabs & Accordions'
  `?tab=` / `?accordion=` deep links can never work; only `#alias` can. Evidence: curl status checks 2026-11-23.
- **F-F6-13** Radio button labels are "Play"/"Pause" in the DOM but rendered upper-case by CSS (runs read
  "PLAY"/"PAUSE"). Evidence: F6-10.
- **F-F6-14** The site's origin returned HTTP 500 after ~61 s for uncached pages between ~10:45 and ~11:45 UTC
  (LiteSpeed cache hits stayed fast); cases on uncached pages had to be retried later. Evidence: run logs, curl
  timings.
- **F-F6-15** The membership FAQ accordion works only if its (lazily rendered) block is on screen before the
  deferred Tabs & Accordions script initialises; otherwise it stays static (`data-rlta-state="initial"`).
  Evidence: F6-27 (scroll first → "ready") vs F6-39 (interact first → "initial", click ignored).
- **F-F6-16** Live accordion keyboard: Enter toggles; ArrowUp/ArrowDown do nothing; Home/End raise
  "Cannot create property 'scroll' on boolean 'true'" and do nothing. Opening pushes `#<alias>`; `#<alias>` on
  load opens that item. Evidence: F6-28..F6-34, rule f6-guides-accordion.mjs.
- **F-F6-17** Back-to-top control: classes `cd-is-visible` past 300 px of scroll and `cd-fade-out` past 1200 px.
  Evidence: F6-26 (`cd-top cd-is-visible cd-fade-out` at the bottom of animals), TPL:6.

## Unknowns

- **U-F6-01** Real playback states (PLAYING progress, ENDED auto-advance, error skipping, seek) were not observed:
  the read-only guard blocks YouTube's data POSTs. Rebuild: implement from the static rules (behavior summary
  10–13) with its own audio source; test with a fake player.
- **U-F6-02** Detail pages behind the cards (animal/character/property/station pages) belong to F2.
- **U-F6-03** How the editors maintain the lists (CMS fields) — server side, not visible. Rebuild: seed data.
