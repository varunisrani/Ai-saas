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
| F3-R4 | Ranking rows sorted by Road Rating, highest first; rows without a rating ("-") come last | `evidence/rules/f3-compare-rank-order.mjs` | see below | best-motorcycles |
| F3-R5 | "Select Class" menu: one link per vehicle class, label → `/gta-6/vehicles/best-<slug>/` | `evidence/rules/f3-compare-rank-class.mjs` | see below | Motorcycles → best-motorcycles |

## Cases

`evidence/cases/f3-compare.json` → `evidence/runs/run-f3-compare.json`.

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
