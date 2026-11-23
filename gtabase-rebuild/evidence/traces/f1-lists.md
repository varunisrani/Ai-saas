# F1 Database lists — trace (feature id `f1-lists`)

Routes: `/gta-6/vehicles/` (590 items) and `/gta-6/weapons/` (211 items). Observed 2026-11-23 on the live
site, read-only. Compare toggles on the cards are out of scope (F3).

File abbreviations (all under `evidence/bundle/all/`, prefix `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f`):

| Abbr | Hash suffix | Original file |
|---|---|---|
| MF | `76533b9eb666e6ad5d4eb2f405468ad2.js` | components/com_jamegafilter/assets/js/megafilter.js |
| MAIN | `8d6ca43c3e3419d226faa1deb3fdecca.js` | com_jamegafilter/assets/js/main.js |
| SCR | `9fa08a70cf18984c7e47b1429b001087.js` | com_jamegafilter/assets/js/script.js |
| FIX | `10672dd169b969234dd16860f7d90b29.js` | templates/SDH_J4/js/jamegafilter-fixes.js |
| CFGV / CFGW | `37d70190160135890c263d5f971588bd.js` / `8933576751fce2fb0359a2c1466f87eb.js` | inline layout config + Dust templates (vehicles / weapons) |
| LBLV / LBLW | `ac9a3f8651f4f4b94680b0f6545f4a75.js` / `8708a042df07d0452e34fa5042b4b20e.js` | inline labels, option ordering (vehicles / weapons) |
| LOGO, DUSTH, CHOSEN | `09b37de0…`, `bbc2ff93…`, `cc4f6edc…` | manufacturer-logo helper, feature-icon helper, Chosen dropdown |

REA T1 evidence: `analyze-javascript-application` over the 10 selected sources (MF, MAIN, SCR, FIX, CFGV,
CFGW, LBLV, LBLW, LOGO, DUSTH): view **ev_cb6c7e907a3e97e6e10c71c137cc6aebc320492dc87e449d41ed0aad99a16212**,
parent **ev_3df4aa984ee9be556fea3ee1fe36b7b35afe3f421a226e999e1d6ccd24c70099**; 10/10 selected sources
`complete`, no `error`; saved at `evidence/rea/f1-lists/evidence.json` (git-ignored). The graph records
session-storage `getItem`/`setItem` (FIX), listeners `scroll.page`, `change`, `click`, `keyup`, `afterRender`,
`afterUpdateRender`, `afterAutoPage`, `chosen:ready chosen:updated`, `touchstart`/`touchmove`, and 0 route
patterns (the lists have no client routes; state is the hash). Line numbers below are from `cat -n` of the
downloaded files (long minified lines).

## T1 Explain (static)

**Entry point.** The server HTML only holds empty containers (`.sidebar-content` for filters, `.main-content`
for the list) plus a "sidebar-toggle" button (evidence/html/gta-6_vehicles_.html:250-262). On document ready
the per-list inline config builds `UBLNConfig` and calls `UBLN.main` (CFGV:14, CFGW:14):
data URL `/media/com_jamegafilter/en_gb/17.json?<version>` (vehicles) or `18.json?<version>` (weapons),
filter fields, sort options, `productsPerPageAllowed=[100,104,108,112,116]`, `autopage=true`, `sticky=false`.
Defaults: vehicles `ja_default_sort="attr.ct6.frontend_value"`, `ja_sort_by="desc"` (CFGV:4); weapons
`"name"`, `"asc"` (CFGW:4).

**Functions (file:line).**
| Step | Function | Where |
|---|---|---|
| boot, load JSON (XHR with progress %, "Loading" bar), build items and filters, bind sidebar toggle | `UBLN.main` | MAIN:36-41 |
| decode base64 JSON bodies (body is base64, not JSON) | XHR/fetch hooks | FIX:18-19 |
| drop non-public items, prefix thumbnails | `afterGetData` | CFGV:10-13, CFGW:10-13 |
| apply hash state after first render | `UBLN.load` | MAIN:42-43 |
| list base: page slice, render, update, infinite paging | `LNBase.beforeRenderItems`, `renderItems`, `_updateRender`, `autoPage` | MF:14-15, 17-20, 22-25, 39-45 |
| sort comparator (custom order lookup, numeric, per-character, empty-last, name tie-break) | `LNBase.sort` | MF:48-67 |
| keep sorted order when filtering | `setMatchedItems` | MF:68 |
| build filter options (skip empty/"N/A"; order by custom list or by label) | `LNFilter.updateFilter` | MF:94-109 |
| filter change capture (100 ms debounce) | `LNFilter.afterRender` change handler | MF:110-116 |
| OR within field, AND across fields, live option counts, page reset | `filterChangeHandle` | MF:117-128 |
| apply hash values to filters | `LNFilter.load`, `LNFilterGroup.setValue`, `LNFilterValue.setValue` | MF:130, 136-139, 160 |
| option label "(n)" refresh + `empty` class | `LNFilterItem.updateRender` | MF:139 |
| text match (escape, lower-case, one-way accent folding) | `LNFilterValue` `match` | MF:158-159 |
| hash read/write (page last, replaceState) | `LNQueryString.load`, `set` | MF:161-165 |
| write filter fields to state, "Clear Filters" visibility, reset all | `LNSelected.beforeRender/afterRender/registerClearFilter/resetAll` | MF:169-181 |
| toolbar: counter, sort select, direction link, defaults | `LNToolbar` (`beforeRender`, `afterRender`, `dosort`, `dosortdir`, `load`) | MF:181-194 |
| layout chooser (grid/list), Chosen on toolbar selects, `ja-<sortfield>` wrapper class | `initScript`, `addFilterWarperClass` | SCR:4-10 |
| counter forced to 0 when no cards | `bindCallback` | CFGV:5-7 |
| sessionStorage mirror + Back restore + bfcache reload | IIFE in FIX | FIX:4-11, 24 |
| class tiles: plain click switches, Ctrl/Cmd/Shift or "+" corner adds | IIFE in FIX | FIX:24-33 |
| first 4 card images eager, schema positions | IIFE in FIX | FIX:37-40 |
| templates: card, toolbar ("Sort By", direction link, counter "N Vehicles"/"N Weapons"), filter blocks | Dust sources in `var p={…}` | CFGV:4, CFGW:4 |
| class/standout option order, filter option ordering | `ja_custom_ordering`, `ja_fileter_field_order` | LBLV:4, LBLW:4 |
| manufacturer logo / feature icon on card | `dust.helpers.manufacturerLogo`, `displayFeatureImage` | LOGO:4, DUSTH:4-9 |

**Data flow.** HTML shell → config → one GET of the whole dataset (base64 JSON object keyed `item_<id>`;
each item: id, slug `<id>-<alias>`, name, thumbnail(+size), url, `attr` map of fields `{value, frontend_value,
title, type}` where choice fields hold arrays of slugs/labels and numbers are strings) → in-memory items →
filters built from the data → hash parsed → filters/sort applied → first 100 cards rendered → every change
re-filters in memory, rewrites the hash with `history.replaceState`, mirrors it to sessionStorage.

**Dependencies.** Endpoint GET `/media/com_jamegafilter/en_gb/17.json?1795426696` (vehicles, 1.7 MB) and
`/media/com_jamegafilter/en_gb/18.json?1795387870` (weapons, 0.6 MB), 200, recorded in F1-01 / F1-W01 `calls`.
sessionStorage `jamg-hash:/gta-6/vehicles/`, `jamg-hash:/gta-6/weapons/`. No localStorage, no cookies
written by the list (SCR:4-6 writes a cookie only when a filter title is collapsed, which this horizontal
layout disables). jQuery, Dust, Chosen (search regex: word-start, case-insensitive, no accent folding).

**Effects.** DOM only (filters, toolbar ×2 top/bottom, cards), `history.replaceState` (no new history
entries), sessionStorage write, Clarity tags (blocked in our runs). No writes to the server.

**Server-side unknowns.** How/when the JSON export is regenerated (the `?<version>` number), why the body is
base64, which access groups hide items (one record of 591 / 212 lacks a public access group and is never
shown), how detail URLs/slugs are produced.

## T2 Control → effect: clicking a class tile ("Vehicle Class" → "Super")

1. Capture-phase click handler on `document` sees a tile of the 2nd filter (`ul.filter-items` inside
   `.gta5-vehicles` … `.filter-field:nth-child(2)`): FIX:24-33. With no other tile picked it lets the click
   through (F1-13); with others picked and no modifier it unticks them after the click (F1-14); Ctrl/Cmd/Shift
   or the top-right "+" zone keeps them (F1-15).
2. The checkbox toggles; its `change` bubbles to the filter panel handler: the option is added to/removed from
   `selectedFilters`, tile gets `jamg-active`; handler debounced 100 ms (MF:110-116).
3. `filterChangeHandle`: union of picked options per field (MF:120), intersection across fields (MF:122),
   option counts recomputed per the rule in F1-R3 (MF:123-126). F1-13 count 29; F1-17 → `Super (9)`.
4. `setMatchedItems` keeps the current sort order (MF:68); page reset to 1 (MF:127) → `setQS('page',1)` (MF:37, 70).
5. List re-render: first 100 of the result (MF:14-15), infinite paging re-armed (MF:24, 39-45). F1-13 cards 29.
6. Option labels rewritten "(n)", zero options get `empty` (MF:139). F1-07 all 21 classes `(0)`.
7. Selected-filters block writes every filter field into the state map (MF:169-175) and shows/hides
   "Clear Filters" (MF:176-178, F1-13 visible:true, F1-34 false).
8. Its `afterRender` event makes `LNQueryString` rebuild the hash (page last) and call
   `history.replaceState` (MF:161-164): F1-13 URL `…&attr.ct1.value=super&page=1`.
9. The patched `history.replaceState` copies the hash to sessionStorage `jamg-hash:/gta-6/vehicles/`
   (FIX:6, 11): F1-04/F1-28 session = hash.
10. Toolbar re-renders with `totalItems` → counter "29 Vehicles" (MF:182; CFGV:4 toolbar template;
    MAIN:36 `afterUpdateRender`): F1-13 `count=29`.

## Rules (T3)

| Rule id | Plain words | Script | Observations reproduced | Proving input |
|---|---|---|---|---|
| F1-R1 | Hash grammar: ordered key=value pairs; defaults added after keys read from the link; filter change sets page=1; page always last; multi-values joined by "," in pick order; empty filters removed; unknown values kept but ignored; sortdir ≠ desc → asc | evidence/rules/f1-hash-grammar.mjs | 41/41 PASS | F1-30 deep link `#attr.ct1.value=super,sports&attr.ct734.value=hide-standouts` → keys kept first, `sort`,`sortdir` appended, `page=1` last |
| F1-R2 | Text filters: case-insensitive contains, not trimmed, punctuation literal, one-way accent folding, applied on change (Enter/blur) | evidence/rules/f1-text-match.mjs | 21/21 PASS (13 replays on the saved JSON + 8 relations) | F1-09/F1-10 `huracan` and `Huracán` both find the "Huracán" item; F1-08 `án` finds nothing |
| F1-R3 | OR inside a choice filter, AND across filters; live option counts (only-active filter keeps full counts, active-with-others counts within the others, inactive counts within the result) | evidence/rules/f1-filter-logic.mjs | 27/27 PASS (19 replays + 8 relations) | F1-17 → F1-18: `Super (9)` under Hide Standouts equals the 9 results after ticking Super |
| F1-R4 | Sort comparator: equal → name; numeric; per-character text; empty always last; desc flips; class sorts by label; field change keeps direction | evidence/rules/f1-sort-order.mjs | 32/32 PASS (15 replays + 17 relations) | F1-25/F1-26: the vehicle without speed is last both in desc and asc |
| F1-R5 | Class tiles: plain click switches, Ctrl/Cmd/Shift click adds, click on picked removes | evidence/rules/f1-class-tiles.mjs | 9/9 PASS | F1-14 plain click on Sports while Super picked → only Sports |
| F1-R6 | Paging: 100 first, +100 batches when scrolling near the end, counter = total, hash unchanged | evidence/rules/f1-paging.mjs | 12/12 PASS | F1-02 one scroll → 300 cards, URL unchanged |
| F1-R7 | Persistence: hash mirrored to sessionStorage `jamg-hash:<path>`; links/reload restore from the hash; Back/Forward restores the saved hash; a plain visit starts from defaults | evidence/rules/f1-state-restore.mjs | 10/10 PASS | F1-33 plain visit after filtering → defaults, saved hash overwritten |

## Cases

File `evidence/cases/f1-lists.json`; run `evidence/runs/run-f1-lists.json` (profile
`tools/profiles/f1-lists.profile.json`). **60 cases** (44 vehicles `F1-01…F1-44`, 16 weapons `F1-W01…F1-W16`); **58 clean**, **2 excluded**:
- `F1-40` (unknown detail slug → 404 page): run 2 hit an origin outage — the URL answered HTTP 500 after ~61 s
  (curl retry after 60 s: 500 again). Run 1 (same case, same profile, earlier the same day) recorded the clean
  behavior: title and h1 "404 Page Not Found", no cards — kept as supplementary evidence only in
  `evidence/runs/f1-lists.run1.raw.json` (local, git-ignored; its weapons cases hit the first outage).
  A later single check (~15 min after) still answered 500 after 61 s, so the case was not re-run.
- `F1-W13` (weapons: Back from a detail page): the weapon detail page stalled the same way (500 after ~61 s),
  so the card click timed out. The sessionStorage write before leaving was recorded
  (`jamg-hash:/gta-6/weapons/` = `#sort=name&sortdir=asc&attr.ct55.value=handguns&page=1`); the Back restore
  itself is covered by `F1-32` (vehicles, same script keyed by path).
Harness notes: the runner trims each step, so a trailing space cannot be typed with `fill:`; `F1-06` therefore
tests a leading space and `F1-41` adds the trailing space with `press:Space`. Run 1 showed the original
`F1-36/37` (open/close the filter toggle at 390 px) cannot work because the toggle is hidden at every width on
these lists (probe below); they were replaced by phone-width interaction cases. Shared runner change:
`keydown:<key>` / `keyup:<key>` steps (tools/web/run-cases.mjs) to record Ctrl+click.
Probes (tools/probe.mjs, 3 rounds, read-only): rendered DOM at 1366 px; fresh load at 390x844 (toggle
`display:none`, filters inline as a grid, class list `overflow-x:auto` one row); CSS rules for the toggle
(`@media (max-width:768px) .com_jamegafilter:not(.collapse-filters) .sb-horizontal.ja-mg-sidebar .sidebar-toggle {display:none}`).

Data-only readout keys (values from the live database; compare as relations or with fixtures only):
`count`, `cards` (when filtered), `text:list-count`, `text:list-count-bottom-number`, `text:class-*`,
`text:standout-shown`, `text:standout-option-*-text`, `text:card-1-name`, `text:card-2-name`,
`text:card-*-speed`, `text:card-*-damage`, `text:card-*-class`, `attr:card-1@class`, `attr:card-1@data-slug`,
`attr:card-1-link@href`, `attr:card-1-link@title`, `attr:card-image@alt`, `attr:card-stat-fill@style`,
`count:card-standout-badge`, `count:card-unique-badge`, `count:card-price-pill`, `count:card-unknown-stat`,
`count:manufacturer-options`, `list:weapon-type-options`, `text:class-1`, `calls` (version number).
Behavior readouts: `url`, `session:*`, `value:*`, `checked:*`, `visible:*`, `enabled:*`, `attr:*@class`
(state classes), `attr:sort-direction@*`, placeholders, `list:sort-options`, `list:filter-titles`,
`count:class-options`, `count:class-checked`, `count:class-empty`, `attr:autopage-sentinel@page-data`,
`text:manufacturer-results` for the no-match message.

## Command vocabulary

| Token | Role | Accessible name / visible label | What it does |
|---|---|---|---|
| `list-count` / `list-count-number` | status text (div `#toolbar-amount`) | "590 Vehicles" / "211 Weapons" (number + plural noun) | shows number of matching items (top toolbar; `list-count-bottom-number` = bottom toolbar copy) |
| `name-search` | textbox | label "Vehicle Name" / "Weapon Name"; placeholder "Enter Vehicle Name"/"Enter Weapon Name"; maxlength 128 | name contains-filter, applied on Enter or blur |
| `real-life-search` | textbox | label "Real Life Vehicle" / "Real Life Weapon"; placeholder "Enter Real Life …" | real-life model contains-filter |
| `class-super`, `class-sports`, `class-boats`, `class-handguns`, `class-shotguns`, `class-melee` (+ `-box` = the checkbox) | checkbox (inside label) | "<Class> (<n>)", e.g. "Super (29)"; group title "Vehicle Class" / "Weapon Class" | class tile; plain click = only this class; Ctrl/Cmd/Shift click = add |
| `class-options`, `class-checked`, `class-empty`, `class-1` | — | — | all class tiles / ticked ones / zero-count ones / first tile |
| `manufacturer-dropdown` (+ `-search`, `-results`, `-shown`, `-select`, `-options`) | button (Chosen; `role=button`, tabindex 0) + searchbox (aria-label "Manufacturer") + listbox items; hidden native select labelled "Manufacturer" | "Select Manufacturer"; options "<Make> (<n>)" | single-choice manufacturer filter with type-to-search; no match → "No results match <text>" |
| `standout-dropdown` (+ `-option-hide`, `-option-2`, `-shown`, `-select`, `-results`) | button (Chosen) + hidden select labelled "Standout Set" | "Select Standout Set"; first option "Hide Standout Vehicles (<n>)", then sets "All-Terrain (<n>)" … | standout set filter incl. pseudo option "Hide Standout Vehicles" (vehicles only) |
| `weapon-type-dropdown` (+ `-option-unique`, `-shown`, `-select`, `-options`) | button (Chosen) + hidden select labelled "Weapon Type" | "Select Weapon Type"; options "Base Weapon (n)", "Unique Variant (n)" | weapon type filter (weapons only) |
| `sort-dropdown` (+ `sort-option-name/-manufacturer/-class/-speed/-seats/-damage`, `sort-shown`, `sort-select`, `sort-options`) | button (Chosen, no search) + hidden select `aria-label="Sort By"`, visible label "Sort By" | current field, e.g. "Speed" | chooses the sort field (direction kept) |
| `sort-direction` | link (`href="#"`, icon only) | title "Set Descending Direction" (never changes) | flips asc/desc; its `data-value`/class `sort-<dir>` show the direction it would switch to |
| `clear-filters` | generic (div, not a button) | "Clear Filters" | resets every filter; visible only while a filter is active |
| `filters-toggle` | button (vehicles, aria-label "Open Filters") / link (weapons, no aria-label) | "Open Filter" / "Close Filter" | opens/closes the filter panel — hidden at every width on these two lists |
| `layout-grid`, `layout-list` | generic (icon spans) | — (grid / list icons) | switch card grid ↔ list rows (list shows a column header row `list-head`) |
| `card`, `card-1`, `card-1-link`, `card-1-name`, `card-2-name`, `card-*-speed`, `card-*-damage`, `card-*-class`, `card-labels`, `card-stat-bar`, `card-stat-fill`, `card-image` | link per card | link title "GTA 6 Vehicle - <name>" / "GTA 6 Weapon - <name>" | one item; opens the detail page |
| `card-standout-badge`, `card-unique-badge`, `card-unknown-stat`, `card-price-pill`, `card-last-speed-bar`, `card-last-damage-bar` | — | "★ Standout", "★ Unique Variant", "$<price>" | card badges and stat bars |
| `autopage-sentinel` | — | — | invisible marker after the cards; reaching it loads the next 100 |
| `selected-filters`, `filter-panel`, `filter-panel-content`, `filter-backdrop`, `products-wrapper`, `megafilter-wrap`, `list-head`, `filter-groups`, `filter-titles` | — | — | containers used for state readouts |

Selectors: profile tokens are CSS from the original markup (marked as such in the profile); class tiles
use the option value (`input[value="super"]`).

## Behavior summary for the spec

Plain-language rules for builders. "List" = either database page. Labels in quotes are the visible UI words.

**Loading and layout**
1. Each list page downloads its whole dataset once per visit and does all filtering, sorting and paging in
   the browser; no request is sent on any filter, sort, scroll or clear action (F1-01, F1-W01 `calls`; no
   other calls in any case).
2. Desktop layout (1366 px): a horizontal filter bar above the list (filter title over each control), then a
   toolbar with "Sort By" (select) + a direction button + the counter "<n> Vehicles"/"<n> Weapons" + a
   grid/list switch, then the cards in a 4-column grid; the same toolbar is repeated below the cards
   (F1-01 `list-count-bottom-number`, F1-39). While data loads, a "Loading <percent>%" bar shows (static
   MAIN:36, not recorded).
3. The counter always shows the total number of matching items, never the number rendered, and always uses
   the plural noun ("0 Vehicles", "29 Vehicles") (F1-01, F1-07, F1-13).

**Filters**
4. Vehicles filters, in order: "Vehicle Name" (text), "Vehicle Class" (21 class tiles), "Manufacturer"
   (single-choice dropdown with type-to-search), "Standout Set" (single-choice dropdown), "Real Life Vehicle"
   (text) (F1-01). Weapons: "Weapon Name", "Weapon Class" (10 tiles), "Manufacturer", "Weapon Type"
   (Base Weapon / Unique Variant), "Real Life Weapon" (F1-W01).
5. Choice options are the values present in the data. Each shows "<label> (<count>)"; dropdowns start with
   "Select <filter title>". Class tiles follow a fixed configured order (not alphabetical); manufacturers are
   alphabetical; in "Standout Set" the "Hide Standout Vehicles" entry comes first, then the sets (F1-01,
   F1-W01, F1-21: 74 manufacturers + placeholder).
6. Text filters apply when the field fires change — Enter or leaving the field — not while typing
   (F1-04, F1-11, F1-12). They match "contains", ignoring letter case (F1-04/05, F1-W09/W10); the text is not
   trimmed, so leading/trailing spaces must match too (F1-06, F1-41); punctuation and HTML-like text are
   plain characters (F1-43); at most 128 characters can be typed (F1-42).
7. Accent folding is one-way: a plain letter in the query also matches accented forms in the data
   ("huracan" finds "Huracán", F1-09/F1-10), an accented letter matches only itself ("án" finds nothing
   when names are unaccented, F1-08).
8. Class tiles: a plain click on a tile while another is picked switches to the clicked tile only; Ctrl/Cmd/
   Shift-click adds it; clicking a picked tile removes it (F1-13…F1-16, F1-W02…F1-W04, F1-36). Give tiles a
   visible "+"/add affordance as well (the original treats a click on the tile's top-right corner as "add";
   static FIX:24-30).
9. Several picked classes combine with OR; different filters (class, dropdowns, text) combine with AND
   (F1-15, F1-18, F1-30, F1-W04, F1-W12).
10. Option counts update live: with no filter each option counts all items; a filter that is the only active
    one keeps its full counts; an active filter combined with others counts within the result of the others;
    inactive filters count within the current result; options with 0 stay visible (marked empty)
    (F1-13, F1-17, F1-18, F1-19, F1-07, F1-W05).
11. "Hide Standout Vehicles" (first entry of "Standout Set") lists only the regular vehicles — none of the
    cards then carries the "★ Standout" badge; choosing a set lists only that set, every card badged
    (F1-17, F1-19, F1-30).
12. The manufacturer dropdown search matches word starts, case-insensitively, without accent folding:
    typing "Uber" shows "No results match Uber"; typing "Über" offers the accented make and Enter selects it
    (F1-20, F1-21).
13. "Clear Filters" appears only while at least one filter is active; it empties every filter (text, tiles,
    dropdowns back to "Select …"), restores full counts and the full list (F1-13, F1-34, F1-W16).
14. No match: the card area is simply empty, the counter reads 0, every option shows (0); there is no
    "no results" message (F1-07, F1-43).

**Sorting**
15. Sort fields — vehicles: "Vehicle Name", "Manufacturer", "Vehicle Class", "Speed", "Asphalt OVR",
    "Off-Road OVR", "Seats"; default Speed, descending. Weapons: "Weapon Name", "Weapon Class", "Price",
    "Manufacturer", "Damage", "Accuracy", "Range", "Overall Rating", "Handling"; default Weapon Name,
    ascending (F1-01, F1-W01).
16. Choosing another sort field keeps the current direction (vehicles: Name then shows Z→A; weapons: Damage
    then shows low→high) (F1-22, F1-W06, F1-37). The direction button flips it; its tooltip always says
    "Set Descending Direction" and its state shows the direction it would switch to (F1-23, F1-24).
17. Comparison: equal values fall back to name order; numbers compare numerically; text compares character
    by character; multi-value fields use their values joined; "Vehicle Class" sorts alphabetically by label
    (Boats first ascending), not in the tile order; items without a value always go last, in both directions
    (F1-22…F1-27, F1-W06…F1-W08, F1-W12; rule F1-R4).
18. An unknown sort field in a link is kept in the URL, the select shows its first option and items are in
    name order; a direction other than "desc" becomes "asc"; an unknown filter value is ignored (nothing
    ticked, full list) but left in the URL (F1-31).

**Paging**
19. The first 100 matching cards are shown; when the viewer scrolls near the end of the cards (≈400 px),
    the next 100 are appended, until all are shown. There are no page buttons; scrolling never changes the
    URL or the counter (F1-01…F1-03, F1-W11). Any filter change starts again from the top of the new result.
20. A "page=<n>" in an opened link makes the first render start at item (n−1)×100+1 (F1-44) — a quirk;
    recommended: ignore page>1 (see Unknowns).

**URL and persistence**
21. The state is written to the URL hash with history replace (no extra history entries): pairs
    "key=value" joined with "&". Keys: "sort", "sortdir", "name", one key per filter field, "page". On load,
    keys from the opened link keep their order, then missing "sort"/"sortdir" defaults are appended; a
    filter change sets "page=1"; "page" is always written last; emptied filters are removed; multiple tiles
    are joined with "," (written "%2C") in pick order; values are URI-encoded (F1-01, F1-04, F1-13, F1-15,
    F1-18, F1-30, F1-34; rule F1-R1). Vehicles default hash "#sort=<speed field>&sortdir=desc", weapons
    "#sort=name&sortdir=asc" (F1-01, F1-W01). The rebuild should keep this key=value shape with its own key
    names.
22. Opening a list URL with a hash restores the whole state (ticks, dropdowns, text, sort, direction) and
    the result (F1-28, F1-30, F1-W12); reload keeps it (F1-29).
23. Every hash write is mirrored to sessionStorage key "jamg-hash:<page path>" (rebuild: any per-tab key per
    list) (F1-01, F1-04, F1-22, F1-28). Back/Forward to the list restores the saved state (F1-32); a plain
    visit to the bare list URL starts from the defaults and overwrites the saved state (F1-33).

**Cards**
24. Vehicle card (one link to the detail page "/gta-6/vehicles/<alias>", link title "GTA 6 Vehicle - <name>"):
    image (first 4 load eagerly, the rest lazily), seats number badge, edition badge(s), "★ Standout" badge
    for standout vehicles, manufacturer logo when known, then "Class" (labels joined ", "), "Make", "Name"
    (heading), "Based On" (real-life model, only when present and different from the name), and three stat
    bars: "Speed" shown "x/10" (bar = x×10 %), "Off-Road" and "Road" shown as raw 0–1000 numbers
    (bar = value/10 %); a missing stat marks its bar "unknown" with no number (F1-38, F1-25, F1-26).
25. Weapon card (link "/gta-6/weapons/<alias>", title "GTA 6 Weapon - <name>"): image, "★ Unique Variant"
    badge for unique variants, "Type", "Make", "Name", "Based On" when known, a "Damage" bar "x/10" only when
    damage is known, and a price pill "$<amount with thousands separators>" when a price exists (F1-W15,
    F1-W07).
26. Grid/list switch: list mode shows one row per item under a header row (vehicles: Make, Name, Class,
    Real Life Vehicle, Speed, Off-Road, Road); the choice is not saved (F1-39; static SCR:4).

**Phone width (390×844)**
27. No "Open/Close Filter" toggle on these lists at any width: the filter bar stays inline above the list,
    the class tiles become one horizontally scrollable row, and tapping tiles and changing sort work as on
    desktop (F1-35, F1-36, F1-37, F1-W14).

**Errors**
28. An unknown detail URL under the list shows the site's "404 Page Not Found" page (run 1 of F1-40; excluded
    in run 2 by an origin outage).

## Findings

- **F-F1-01** Each list downloads its full dataset once per visit (vehicles `17.json`, weapons `18.json`, with a
  version query); the body is base64-encoded JSON decoded by a template patch. No request follows any
  interaction. Evidence: F1-01/F1-W01 `calls`; MAIN:36; FIX:18; saved body starts with base64 of `{"item_`.
- **F-F1-02** Defaults: vehicles Speed descending, weapons Weapon Name ascending; the default hash is written
  immediately on load. Evidence: CFGV:4, CFGW:4, MF:193-194; F1-01, F1-W01.
- **F-F1-03** Hash grammar as rule F1-R1 (key order kept from the link, defaults appended, page last, "," for
  multi-values, URI encoding). Evidence: MF:161-165, 169-175; F1-R1 41/41.
- **F-F1-04** Text filters: change-triggered, case-insensitive contains, untrimmed, literal punctuation,
  one-way accent folding, maxlength 128. Evidence: MF:110-116, 158-159; CFGV:4 `filter.value` template;
  F1-04…F1-12, F1-41…F1-43; F1-R2.
- **F-F1-05** Class tiles switch on plain click and add on Ctrl/Cmd/Shift-click (site patch on top of the
  stock multi-checkbox), click on a picked tile removes it. Evidence: FIX:24-33; F1-13…F1-16, F1-W02…F1-W04;
  F1-R5.
- **F-F1-06** OR within one choice filter, AND across filters. Evidence: MF:120-122; F1-15, F1-18, F1-30,
  F1-W04; F1-R3.
- **F-F1-07** Option counts are recomputed after every change by the "other filters" rule; zero options stay
  visible with an `empty` mark. Evidence: MF:123-126, 139; F1-07, F1-17, F1-18, F1-19, F1-W05; F1-R3.
- **F-F1-08** "Hide Standout Vehicles" is a real option value ("hide-standouts") carried by every
  non-standout vehicle, listed first in "Standout Set"; cards show "★ Standout" for any other set value.
  Evidence: LBLV:4 custom ordering; CFGV:4 card template; F1-17, F1-19; F1-R3 badge replays.
- **F-F1-09** Manufacturer/standout/weapon-type dropdowns are Chosen widgets over hidden selects (search box
  when > 10 options; word-start, case-insensitive, no accent folding; "No results match <text>").
  Evidence: MF:134; CHOSEN `get_search_regex`; F1-20, F1-21.
- **F-F1-10** Sorting per rule F1-R4: field change keeps direction, empties always last, class by label,
  name tie-break; direction tooltip is constant "Set Descending Direction". Class falls back to label text
  because the custom-order lookup (MF:51-61) compares display labels with option slugs and never matches.
  Evidence: MF:48-67, 184-191;
  F1-22…F1-27, F1-W06…F1-W08; F1-R4.
- **F-F1-11** Infinite loading in batches of 100 (`productsPerPageAllowed[0]`), triggered within 400 px of the
  end; the counter shows totals; no pagination UI (template hides it when autopage). Evidence: CFGV:14,
  MF:39-45, CFGV:4 toolbar template `{^autopage}`; F1-01…F1-03, F1-W11; F1-R6.
- **F-F1-12** A `page=N` hash on load starts the first render at item (N−1)×100+1 while infinite loading
  restarts from batch 2. Evidence: MF:14-15, 37, 189; F1-44 (first card = 101st by name, replayed).
- **F-F1-13** State persistence: hash via `history.replaceState`, mirrored to sessionStorage
  `jamg-hash:<path>`; Back/Forward restores the saved hash; plain visits reset; a bfcache restore forces a
  reload. Evidence: FIX:4-11, 24; REA session-storage get/set nodes; F1-28…F1-33; F1-R7.
- **F-F1-14** "Clear Filters" is a `div` (no button role) shown only while filters are active; it resets each
  filter; the hash keeps `page=1`. Evidence: CFGV:4 `filter-selected` template, MF:176-181; F1-34, F1-W16.
- **F-F1-15** The "Open Filter/Close Filter" toggle exists in the HTML (vehicles: `<button aria-label="Open
  Filters">`, weapons: `<a>` without label) but CSS hides it at every width on these lists (phone rule needs
  a `collapse-filters` class the pages don't have). Evidence: html snapshot lines 252-258; probe CSS rules;
  F1-01, F1-35, F1-W14.
- **F-F1-16** Invalid values in a link are ignored but kept in the URL; `sortdir` other than `desc` becomes
  `asc`; an unknown sort field leaves the select on its first option. Evidence: MF:137-139, 191, 193;
  F1-31.
- **F-F1-17** Card anatomy (vehicles: seats, edition, Standout, logo, Class/Make/Name/Based On, 3 stat bars
  with Speed /10 and Off-Road/Road out of 1000; weapons: Unique Variant, Type/Make/Name/Based On, Damage /10,
  price pill). Evidence: CFGV:4 and CFGW:4 `product-item` templates; FIX:37-38 (eager images);
  F1-38, F1-W15.
- **F-F1-18** During the session, uncached pages (an unknown detail slug, a weapon detail page, and briefly
  the weapons list) hung and then answered HTTP 500 after ~61 s, while cached list pages answered in < 1 s.
  Evidence: run 2 F1-40/F1-W13 errors, run 1 F1-W01…W11 timeouts, curl probes. Operational, not a feature.

## Unknowns

| Id | Open question | Status | What the rebuild should do |
|---|---|---|---|
| U-F1-01 | The class-tile top-right "+" zone that adds instead of switching | static only (FIX:24-30), not recorded | show an explicit add control on each tile and support Ctrl/Cmd/Shift-click |
| U-F1-02 | Is `page=N` in a link intended (F1-44 starts at item 101, scrolling then appends batch 2 after it)? | quirk, HYPOTHESIS: leftover of the paged mode | ignore `page` greater than 1 (start at the top); exclude F1-44 from parity vectors or mark it "original quirk" |
| U-F1-03 | Weapons Back-from-detail | not recorded (origin outage, F1-W13) | same as vehicles (F1-32): restore the saved state |
| U-F1-04 | How many batches one scroll appends (F1-02 got 2 batches from one scroll step) | timing-dependent | append one batch of 100 per approach to the end; vectors should assert "≥ 200 and a multiple of 100", not an exact number |
| U-F1-05 | What exactly an unknown stat shows (template prints "?", rendered text read empty) | PARTIAL | show the bar empty with a "?" placeholder |
| U-F1-06 | When/how the dataset file is regenerated (version query, base64 body, one non-public record dropped) | server-side | ship the rebuild's own synthetic dataset as plain JSON; no encoding needed |
| U-F1-07 | Keyboard operation of the dropdown widgets (arrows/Enter in the open list) | not recorded beyond type+Enter (F1-21) | use accessible comboboxes/selects with standard keyboard support |
| U-F1-08 | Loading bar appearance/percent | static only (MAIN:36) | show a simple loading indicator until data is ready |
| U-F1-09 | Whether the list/grid choice should persist | not persisted on the original (SCR:4) | keep it per page view (optional per-tab memory is fine) |
