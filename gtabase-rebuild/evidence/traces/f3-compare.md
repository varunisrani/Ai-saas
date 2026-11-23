# F3 Comparison + rankings — trace (feature id `f3-compare`)

Scope: (1) the "Compare" toggles and the floating compare bar on the two list pages `/gta-6/vehicles/` and
`/gta-6/weapons/`; (2) the comparison pages `/gta-6/vehicles/comparison/` and `/gta-6/weapons/comparison/`
(empty state, item picker, query parameters); (3) the class rankings `/gta-6/vehicles/best-*/`.
Observed 2026-11-23 on the live site, read-only (no write request was sent; `blocked` empty in every case).

File abbreviations (under `evidence/bundle/all/`):

| Abbr | File | Original |
|---|---|---|
| CMP | `templates__SDH_J4__js__gtab-compare.js` (186 lines) | /templates/SDH_J4/js/gtab-compare.js?v=10 (deferred: `type="jchoptimize-text/javascript"`) |
| DECL | `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2fd74d5c39d064f4e2e779850a70544113.js` | Script Declaration of the list page (`window.gtabCompare`) |
| PICK | `inline-c68053a95178.js` (28 lines) | inline script of the comparison page (plain `<script>`, runs at once) |
| JCHI | `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f66544a25c89cf2b55a76799c57dc3d90.js` | JCH Optimize user-interaction loader + reduce_unused_js |

REA T1 evidence: `analyze-javascript-application` over CMP, DECL, PICK: view
**ev_4474e414e176fefaa588f9c5460e9d8276067c05fa74744c69026c57fef31814**, parent
**ev_3f2d91c87bb0917ac1a704f983260071ae97638a93a0bbf6bdb38275f8cfe650** (3/3 selected sources complete, no
error; 0 route patterns — these scripts build URLs from strings). REA recorded: `read:/gtabCompare` at CMP:18,
`persists_to` sessionStorage via `call:sessionStorage.getItem` (CMP:28) and `call:sessionStorage.setItem`
(CMP:31), the literal `"comparison/?"` at CMP:110. Evidence file: `evidence/rea/f3-compare/evidence.json`
(git-ignored).

## T1 Explain (static)

**Entry points.**
- Lists: CMP is an IIFE (CMP:7) started on DOMContentLoaded (CMP:185) — but only after JCH Optimize releases
  deferred scripts: JCHI:4 `detectHeadless()` returns true when `navigator.webdriver` is set (or a
  Lighthouse/PageSpeed agent), and then deferred scripts never run; otherwise they run on the first
  `pointerover/mouseover/pointerdown/mousedown/keydown/touchstart/wheel/scroll/focus` or after 10 s
  (JCHI:4, JCHI:15). Harness consequence: the profile launches Chromium with
  `--disable-blink-features=AutomationControlled` and wakes the page with a hover (macro `wake`).
- Comparison page: PICK runs `init()` at once (PICK:27-28).
- Rankings: no script of their own; the "Select Class" control is a Bootstrap dropdown of plain links.

**Functions (CMP).**
| Function | Lines | What it does |
|---|---|---|
| config | CMP:8-24 | `window.gtabCompare` (DECL:4 = `{"base":"/gta-6/vehicles/","type":"vehicle"}`) gives the list path and item type; fallback map of 4 list paths (GTA V + GTA 6). Storage key `gtabCompare:<path>` (CMP:24). `MAX = 4` (CMP:14). |
| load/save | CMP:28, CMP:30-32 | JSON array from sessionStorage (bad JSON → empty); save after every change. |
| idOf | CMP:35-41 | item id = alias part of the card's `data-slug` "<id>-<alias>"; fallback numeric article id from class `item_<n>` ("the comparison page redirects" it, CMP:4 comment). |
| makeBar | CMP:78-94 | fixed bar at the top: count, names, "Compare" link, round clear button (aria-label "Clear the comparison", title "Clear"). |
| update | CMP:96-123 | hidden when 0 picked; `n/4`; names joined " · "; n<2 → "Pick 1 more", href `#`, class `gtab-cmp-off`; else "Compare (n)", href `<path>comparison/?` + ids sorted by plain string order, `<type><i>=<id>` (CMP:110-114); every toggle gets `aria-checked`, and `aria-disabled=true` when not picked and n ≥ 4. |
| decorate | CMP:125-153 | for each not-yet-decorated card: a `span` with role checkbox, tabindex 0, `data-id`, aria-label "Compare <name>", title "Compare", two-arrows icon, placed on the card photo inside the card link; click + keydown (Space/Enter) → onToggle. |
| onToggle | CMP:155-169 | prevents the card link; removes if picked, else appends `{id, name}` if fewer than 4; save; update. |
| init | CMP:171-183 | style, bar, decorate, update; MutationObserver on `body` re-decorates 50 ms after the list re-renders (filter/sort/page). |
| CSS | CMP:57-72 | bar fades out (opacity 0, no pointer events) when hidden; names hidden under 767 px width. |

**Functions (PICK).**
| Function | Lines | What it does |
|---|---|---|
| norm | PICK:2 | lower-case, NFD, strip combining accents. |
| combo | PICK:3-23 | builds a combobox (`input role=combobox aria-autocomplete=list`, placeholder "Search...") from the hidden `#vc-options` select (value = alias, text = name; server sorted A→Z); list `ul role=listbox` appended to body. |
| render | PICK:6-10 | words of the query must all occur (AND, substring); excludes the slot's `data-picked` aliases; first 150 rows, first highlighted; "No match"; "<k> more: keep typing". |
| keys | PICK:17-23 | ArrowDown (opens or moves, wraps), ArrowUp (wraps), Enter (pick highlighted), Escape (close + restore text); blur closes after 150 ms; mousedown on a row picks. |
| init / onPick | PICK:27 | one combobox per `.vc-add` slot; on pick → `location.href = data-url + ('?' or '&') + data-param + '=' + encodeURIComponent(alias)` and the page shows a loading state (PICK:24-26). A `.vc-remove` link in a filled column also shows the loading state (PICK:26) — remove = plain link to a server-built URL. |

**Data flow.** List card `data-slug` → alias → sessionStorage `gtabCompare:<list path>` = `[{id, name}, …]`
(pick order) → bar → link with sorted aliases → server renders the comparison page from the query string.
Comparison page: server HTML carries `#vc-options` (all comparable items) and per-slot `data-url` /
`data-param` / `data-picked`; the picker only navigates. Rankings: fully server-rendered lists.

**Dependencies.** sessionStorage `gtabCompare:/gta-6/vehicles/`, `gtabCompare:/gta-6/weapons/`;
no XHR (the list JSON belongs to F1). Comparison and ranking pages are plain GETs.

**Effects.** Only storage writes and navigation.

**Server-side unknowns.** How the comparison page renders 2–4 items (columns, which stats, how differences or
best values are marked), how it normalises the query (unsorted ids, numeric ids, unknown aliases, duplicates,
more than 4) — the filled comparison URLs answer a **Cloudflare managed challenge** (HTTP 307→403 "Just a
moment...", `&__cf_chl_rt_tk=` appended) to our browser, before and after a 60 s wait (see Unknowns).
Ranking order key beyond the shown "Road Rating" and the tie-break.

## T2 Control → effect (main control: a card's "Compare" toggle on /gta-6/vehicles/)

1. Page load: the list HTML contains CMP as a deferred script; DECL:4 sets `window.gtabCompare`.
   Evidence: `evidence/html/gta-6_vehicles_.html` (`data-src=/templates/SDH_J4/js/gtab-compare.js?v=10`).
2. First user interaction → JCH loader runs deferred scripts (JCHI:4, :15) → CMP:185 `init`.
   Case F3-01: 100 cards, 100 toggles `role=checkbox`, aria-label "Compare <name>", unchecked, tabindex 0,
   bar `hidden`, "0/4", "PICK 1 MORE", href `#`; no storage key yet.
3. Click toggle 1 → onToggle (CMP:155-169) appends `{id: alias, name}`, saves (CMP:31) → F3-02: storage
   `[{"id":"<alias1>",…}]`, bar visible, "1/4", still "Pick 1 more"; URL unchanged (card link not followed).
4. Click toggle 2 → update (CMP:106-115) → F3-03: "2/4", "COMPARE (2)", href
   `/gta-6/vehicles/comparison/?vehicle1=<a>&vehicle2=<b>` with a < b.
5. Four picks → other 96 toggles `aria-disabled=true` (CMP:121) → F3-05; a 5th (keyboard) does nothing → F3-06;
   unpicking one re-enables all → F3-07; Clear → `[]`, bar hidden → F3-08.
6. The link opens the comparison page → F3-15 (weapons link) / F3-26 (picker) reach the server, which answers
   the Cloudflare challenge to our browser.

## Rules (T3)

| Rule id | Plain words | Script | Observations reproduced | Proving input |
|---|---|---|---|---|
| F3-R1 | Bar shows "n/4"; <2 picks → "Pick 1 more" (disabled, `#`); 2–4 → "Compare (n)" linking `<list>comparison/?<type>1=..` with aliases sorted A→Z (plain string order); 4 picks disable all other shown toggles | `evidence/rules/f3-compare-bar.mjs` | 14/14 PASS | F3-05: picks in order thrax, seaspray, honeycomb, black-widow → `vehicle1=andrew-nodes-thrax&vehicle2=black-widow-emerus&vehicle3=honeycomb-emerus&vehicle4=seaspray-emerus` |
| F3-R2 | Picks per list path in sessionStorage as `[{id,name}]` in pick order; toggle adds/removes; 5th ignored; Clear → `[]`; survives reload, filter, detail+Back, other list | `evidence/rules/f3-compare-picks.mjs` | 16/16 PASS | F3-06: 5th toggle with 4 picked leaves the array unchanged |
| F3-R3 | Picker: all words must match (case/accents ignored), A→Z, ≤150 rows + "<k> more: keep typing", "No match", arrows wrap, Escape restores, Enter → `<slot url>?<param>=<alias>` | `evidence/rules/f3-compare-picker.mjs` | 8/8 PASS | F3-23: "59 kz" → only names containing both "59" and "kz" |
| F3-R4 | Ranking rows sorted by Road Rating, highest first; rows without a rating ("-") come last | `evidence/rules/f3-compare-rank-order.mjs` | 21/21 PASS | F3-32 best-motorcycles: 70 rated non-increasing, then 6 "-" rows |
| F3-R5 | "Select Class" menu: 21 classes A→Z, label → `/gta-6/vehicles/best-<slug>[-cars\|-vehicles]/`; `?class=` redirects there; unknown class → empty shell; unknown best-* → 404 | `evidence/rules/f3-compare-rank-class.mjs` | 28/28 PASS | Sports → best-sports-cars, Utility → best-utility-vehicles, Vans → best-vans |


All 5 scripts: `for f in evidence/rules/f3-compare-*.mjs; do node $f; done` → 87/87 PASS.

## Cases

- File `evidence/cases/f3-compare.json` → run `evidence/runs/run-f3-compare.json`: **53 cases, 53 clean,
  0 excluded** (harness-wise). Five clean cases end on the Cloudflare challenge page instead of the
  comparison page — F3-15, F3-26, F3-27, F3-28, F3-29. They prove the URL that was opened and that the
  challenge applies to every comparison URL with a query; they are **excluded from comparison-page behaviour
  claims** (the page content is Cloudflare's, not the app's).
- Re-runs merged into the run file (field `merged`; partial runs in `evidence/runs/parts/`): F3-05..F3-12
  after two harness fixes — F3-06: Playwright refuses to click an element with `aria-disabled="true"`, so the
  5th toggle is activated with the keyboard (Space) instead; F3-12: the list name filter applies on Enter
  (first attempt typed without Enter and filtered nothing). F3-18 and F3-27..F3-43 ran after the origin
  outage (~10:55–11:41 UTC; first F3-18 attempt timed out). During the outage the picker cases F3-20..F3-25b
  were moved to the cached weapons comparison page (same script). F3-44..F3-52 were added as second probe
  rounds (class menu hrefs, `?class=` forms, keyboard).
- Coverage: list toggles click/keyboard (F3-01..F3-10), limit 4 (F3-05..F3-07), clear (F3-08), persistence
  reload/filter/other list/detail+Back (F3-11..F3-14, F3-17), link opening (F3-15), 390×844 (F3-16, F3-42),
  comparison empty states (F3-18, F3-19), picker open/filter/no match/AND words/accents/arrows/Escape/Enter
  (F3-20..F3-26), query URLs (F3-27..F3-29), rankings 7 pages (F3-30..F3-38), class menu mouse/keyboard
  (F3-31..F3-33, F3-44, F3-47..F3-51), `?class=` forms (F3-39, F3-40, F3-45, F3-46, F3-52), unknown ranking
  404 (F3-41), row link (F3-43).
- Data-only readout keys: `attr:compare-toggle-1@aria-label` (names), `session:gtabCompare:*` (aliases and
  names; the shape and order are behaviour), `text:compare-names`, `attr:compare-go@href` (aliases; numbering
  and sort are behaviour), `count:cmp-source`, `list:cmp-options`, `text:cmp-option-1`,
  `text:cmp-option-active`, `list:rank-ratings` (values; the order relation is behaviour), `count:rank-rows`,
  `count:rank-images`, `attr:rank-row-1-link@href`, `url` of challenged cases (challenge token).

## Command vocabulary

| Token | Role | Accessible name / label | What it does |
|---|---|---|---|
| `compare-toggle` (`-1`..`-5` = n-th) | checkbox (on the card photo, inside the card link), tabindex 0 | "Compare <item name>", tooltip "Compare" | picks / unpicks the item; Space and Enter work; `aria-checked`, `aria-disabled` when 4 others are picked |
| `compare-bar` | group (fixed, top centre) | — | appears with 1+ picks |
| `compare-count` | text | "n/4" | number picked |
| `compare-names` | text | names joined " · " | hidden under 768 px width |
| `compare-go` | link | "Pick 1 more" / "Compare (n)" (shown in capitals) | disabled under 2; else opens the comparison |
| `compare-clear` | button | "Clear the comparison" (tooltip "Clear") | empties the picks |
| `name-search` | textbox | placeholder "Enter Vehicle Name" | (F1) list name filter, used to prove persistence |
| `cmp-add` | group | "Add a vehicle" / "Add a weapon" | one empty slot (5 on an empty page: 1 header + 4 columns) |
| `cmp-picker` | combobox, `aria-autocomplete=list`, `aria-expanded` | placeholder "Search..." | opens the item list |
| `cmp-options` | listbox options | item names | pick with click or Enter |
| `cmp-more` | list row | "<k> more: keep typing" / "No match" | overflow / empty message |
| `cmp-note` | text | "Add at least two GTA 6 vehicles to see the comparison." | empty-state note |
| `cmp-links` | links | "All GTA 6 vehicles", "Weapon comparison", … | related pages |
| `rank-class-select` | button (dropdown toggle) | "Select Class" | opens the class menu |
| `rank-class-items` | links in the menu | class names ("Boats" … "Vans") | open `/gta-6/vehicles/best-<slug>/` |
| `rank-rows` | list rows | — | one per vehicle: badge (make), name link, "Based on:", "Road Rating:" · "Off-Road Rating:" |

## Behavior summary for the spec

1. **Compare toggle on list cards.** Every card of the vehicles and weapons lists gets a small round toggle on
   its photo (bottom-right): role checkbox, accessible name "Compare <item name>", tooltip "Compare",
   focusable. Click, Space or Enter toggles it; it never opens the card's link. (F3-01, F3-02, F3-09, F3-10)
2. **Limit.** At most 4 picks per list. With 4 picked, every other toggle is disabled (dimmed, not-allowed
   cursor) and ignores clicks and keys; unpicking one re-enables them. (F3-05..F3-07)
3. **Storage.** Picks live in the tab's session storage under `gtabCompare:<list path>` (`/gta-6/vehicles/`,
   `/gta-6/weapons/` — independent) as a JSON list of `{id, name}` in pick order; `id` is the item's URL alias.
   Nothing is stored before the first change; "Clear" stores an empty list. Picks survive reload, list
   filtering/sorting (re-rendered cards are re-marked), opening an item and going Back, and visiting the other
   list; they end with the browser tab session. (F3-01..F3-14, F3-17; rule F3-R2)
4. **Compare bar.** Fixed at the top centre of the viewport; hidden (faded out, not clickable) with 0 picks.
   Shows "<n>/4", the picked names joined by " · " (names hidden below 768 px width), an action link and a
   round button "Clear the comparison". The action reads "Pick 1 more" (greyed, inert) under 2 picks and
   "Compare (<n>)" with 2–4 (labels displayed in capitals). (F3-01..F3-08, F3-16; rule F3-R1)
5. **Comparison link.** `<list path>comparison/?<type>1=<alias>&<type>2=<alias>[…]` with type `vehicle` or
   `weapon`, aliases sorted by plain string order (not pick order), numbered from 1. The same canonical form is
   used by the detail pages' "Compare To" (F2-R3). (F3-03, F3-05, F3-07, F3-14; rule F3-R1)
6. **Comparison page, empty state** (`/gta-6/vehicles/comparison/`, `/gta-6/weapons/comparison/`): breadcrumb
   link to the list ("GTA 6 Vehicles Database & Statistics" / "GTA 6 Weapons Database & Statistics"), h1 "GTA 6
   Vehicle Comparison" / "GTA 6 Weapon Comparison", intro sentence, 3 share links, a board of 5 "Add a vehicle"
   ("Add a weapon") slots — one in the header column, four item columns — each with a search box, the note
   "Add at least two GTA 6 vehicles to see the comparison." and related links (vehicles: All GTA 6 vehicles ·
   Weapon comparison · All GTA 6 weapons · Best vehicles in GTA 6 · Fastest cars in GTA 6 · Fastest bikes in
   GTA 6; weapons: All GTA 6 weapons · Vehicle comparison · All GTA 6 vehicles). (F3-18, F3-19)
7. **Picker.** Search box (combobox, placeholder "Search..."). Focus opens a list of all items of that list
   A→Z, first highlighted. Typing filters: case and accents ignored, every space-separated word must occur in
   the name (any order). At most 150 rows; then a row "<k> more: keep typing"; no result → "No match".
   ArrowDown/ArrowUp move with wrap-around, Escape closes and restores the box, Enter or click picks; items
   already in the comparison are not offered. (F3-20..F3-25b; rule F3-R3)
8. **Picking navigates** to `<slot url>?<slot param>=<alias>` (or `&…` if the slot URL has a query); on the
   empty page every slot uses `<type>1`; the page shows a loading state while leaving. Filled pages give each
   slot its own URL/param and list the already-picked aliases to exclude; each filled column has a remove link
   (server-built URL). (F3-26; PICK:24-27)
9. **Filled comparison page:** not observable (see U-F3-01/U-F3-02); build it from the rebuild proposal there.
10. **Rankings.** `/gta-6/vehicles/best-<page slug>/` for 21 classes. Page: h1 "GTA 6 Best <Class plural> List:
    Stats Ranking", breadcrumb "GTA 6 Cars & Vehicles Database" → list, a "Select Class" dropdown button
    (21 class links A→Z, each with the tooltip "The Best & Fastest <…> in GTA 6"), hero image, share links,
    intro text, "Full List of Best <Class plural> in GTA 6:", one row per vehicle of the class: thumbnail, make
    badge + name (link to the detail page), "Based on: <real-life model>" only when known,
    "Road Rating: <n> · Off-Road Rating: <n>" ("-" when not rated). Order: Road Rating descending; unrated rows
    last; ties: catalogue order. (F3-30..F3-38, F3-42, F3-43; rule F3-R4)
11. **Class menu.** Plain links; mouse click or keyboard (Enter opens the menu, Tab moves into it, Enter
    follows) — arrow keys do not move in it. Page slug = class name lower-case with spaces as "-", plus "-cars"
    for Muscle/Sports/Sports Classic/Super and "-vehicles" for Commercial/Emergency/Industrial/Military/
    Off-Road/Service/Utility. (F3-31..F3-33, F3-44, F3-47..F3-51; rule F3-R5)
12. **Old and odd forms.** `/gta-6/vehicles/best-vehicles/` is the default ranking (shows the Super class
    heading); `?class=<class slug>` redirects to the class page; an unknown `?class` gives an empty page on the
    original (rebuild: 404); an unknown `best-*` path is the 404 page. Detail pages link their "Vehicle Class"
    value to `best-vehicles/?class=<slug>`. (F3-30, F3-39..F3-41, F3-45, F3-46, F3-52; F2-01)

## Findings

- F-F3-01 Compare ids are URL aliases, not numeric ids; aliases can look numeric (weapon ".38" → "38"). Evidence: F3-14, CMP:35-41.
- F-F3-02 Link ids are sorted by plain string order ("38" < "heavy-pistol"; "andrew-…" < "black-widow-…"), not by pick order. Evidence: CMP:110-114, F3-05, F3-14.
- F-F3-03 The compare script is deferred by JCH Optimize and never runs when `navigator.webdriver` is true; automated checks need that flag off. Evidence: JCHI:4, F3-01 (100 toggles after the fix; 0 in the first probe).
- F-F3-04 Every comparison URL with a query string — including `?utm_source=test` — answers a Cloudflare managed challenge to our browser (307→403, "Just a moment...", `__cf_chl_rt_tk` appended), before and after a 60 s wait; the query-less pages are served from cache. Evidence: F3-15, F3-26..F3-29, `evidence/html/f2f3/snap-log.txt`.
- F-F3-05 The comparison picker offers every item of the list (590 vehicles, 211 weapons at run time; an older snapshot had 368 vehicles), A→Z by name. Evidence: F3-18, F3-19, F3-20.
- F-F3-06 Playwright treats `aria-disabled="true"` toggles as disabled and will not click them; the page itself also ignores them (keyboard path, F3-06).
- F-F3-07 `/best-vehicles/` shows the heading "Best Super Cars" while its rows equal the Sports ranking (same 23 rows as best-sports-cars); earlier the same URL served an older Sports list. Evidence: F3-30 vs F3-34, F3-38; snapshot `gta-6_vehicles_best-vehicles_.html`.
- F-F3-08 `best-vehicles/?class=motorcycles` redirected to `best-motorcycles/` at ~11:50 UTC, but at 10:40 the same URL served a stale 20-row page (cache). Evidence: F3-39, snapshot `gta-6_vehicles_best-vehicles__class_motorcycles.html`.
- F-F3-09 Class menu links are not Bootstrap menu items: arrow keys do nothing, Tab reaches them. Evidence: F3-47..F3-51.
- F-F3-10 Boats, helicopters and planes have no ratings yet (every row "-"); motorcycles have 18 equal neighbours whose order is not explained by the off-road rating. Evidence: F3-32, F3-35..F3-37.
- F-F3-11 Some ranking rows link to the old `/vehicles/gta-6/<alias>` form, which serves the same detail page (F2-30). Evidence: snapshots of best-* pages.

## Unknowns

| Id | Question | Rebuild should |
|---|---|---|
| U-F3-01 | Filled comparison page (2–4 items): columns, which rows, how differences / best values are highlighted, remove links — blocked by the Cloudflare challenge | one column per item (image, make + name link, remove "×" link) + empty "Add a vehicle" slots up to 4; rows = the detail page's info labels and stats in detail-page order; numeric stat rows show bars and mark the highest value per row (ties: all); missing values "-"; remove link = same URL without that item, renumbered |
| U-F3-02 | Server handling of unsorted ids, numeric ids, unknown aliases, duplicates, more than 4 | CMP comments say unsorted and numeric-id URLs are redirected ("sorted like the comparison page does, so it needs no redirect"; "the comparison page redirects" article ids). Rebuild: redirect to the canonical URL (aliases, sorted, de-duplicated, first 4 valid); drop unknown aliases; fewer than 2 valid → board with the valid one(s) and the "at least two" note |
| U-F3-03 | Ranking tie-break and order of unrated rows | ties and unrated rows in catalogue order (base model before its variants, then creation order) |
| U-F3-04 | What `/best-vehicles/` should show | the Super class with matching heading and rows |
| U-F3-05 | Unknown `?class=` (empty shell on the original) | 404 page |
| U-F3-06 | Whether human visitors also get the comparison challenge | no challenge in the rebuild |
