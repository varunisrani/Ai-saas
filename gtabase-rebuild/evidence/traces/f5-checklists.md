# F5 — Checklists & mission lists (feature id `f5-checklists`)

Observed 2026-11-23 on https://www.gtabase.com as a guest (never signed in). Analysis side of the clean-room
wall: file:line references point at the site's downloaded script; the "Behavior summary" is plain language.

Pages: `/articles/gta-6/gta-6-100-completion-guide-interactive-checklist` (100% page), `/gta-6/missions/`,
`/gta-6/strangers-missions/`, `/gta-6/side-missions/`, `/gta-6/random-events/`.

Script: `evidence/bundle/all/media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2ff5e545b0c7e3420f2a1437f18f7dfd2a.js`
(below **CL**; line 2 names it `templates/SDH_J4/js/checklist.js` of the shared Games Atlas template, 106 lines).
REA: `analyze-javascript-application` on bundle/all with `--source-path` CL → analysis evidence
**ev_329e3f038cc3bd3650282e9a88a71a6ae9599d72c449279623bfe6fa66dc581e**, routes view
ev_46dd4f93d31e2d3564eb57f014eecc4aeb0406f248d9b31ddec4b36a44a2490e (no error; 1 source parsed, 92 functions,
4 request nodes; saved at evidence/rea/f5-checklists/evidence.json). REA node positions are quoted as `REA Lx:y`.

## T1 Explain (static)

**Entry point.** CL:4 runs once per page (guard flag `checklistEventsDefined`). It defines the storage key
`guest_checklists`, the member-profile constants (list-id prefix `gta6-`, at most 4 profiles, VIP link to
/membership/) and reads a `#profile=<n>` hash, which it removes from the address bar at once (CL:4
`clearProfileHash`, REA L4:947). CL:6 calls `onDOMContentLoadedChecklists` (CL:7–12) after DOM ready.

**Functions and hops** (all in CL):

| Function | Lines | REA node | Role |
|---|---|---|---|
| onDOMContentLoadedChecklists | 7–12 | L7:0 | retries `onLoadChecklists` up to 10× every 200 ms until tick boxes exist; then binds `change` on every `input[type=checkbox][data-checklist-id]`; remembers top-level boxes (no `data-parent-id`) |
| onLoadChecklists | 65–68 | L65:0 | disables all boxes; guest when `<body>` lacks class `logged-in` → `updateCheckboxesFromLocalStorage`, member → `grabChecklistsFromBackend` |
| updateCheckboxesFromLocalStorage / updateCheckboxes | 82–86 | L82:0 / L85:0 | ticks every stored id (all copies), re-enables all boxes, fires document event `checklist:updated`, recomputes the percentage after 10 ms and again after 600 ms |
| onUserChecklistChange | 15–16 | L15:0 | on a tick: sets all copies (same list id + same element id), cascades to children, re-evaluates parents, recomputes the percentage, then member → `saveChecklistStatus`, guest → `updateLocalStorageCheckbox` |
| getChildrenCheckboxes | 17–20 | L17:0 | children = boxes whose `data-parent-id` is `<list>:<id>`; only those not already in the new state; recursion depth ≤ 10 |
| getParentCheckboxes | 21–28 | L21:0 | parent ticked when all children without `data-progress-id` are ticked and every progress-id group has ≥1 ticked child; unticked otherwise; recurses upward only on change |
| updateLocalStorageCheckbox / parseChecklistsLocalStorage | 33–35 / 36–37 | L33:0 / L36:0 | append-if-absent / remove; empty list → key deleted; object always written back; unreadable JSON → treated as `{}` with a console error |
| updateCompletionPercentage / getChildrenCompletionPercentage | 38–44 / 45–58 | L38:0 / L45:0 | weighted sum (see rule R1); `data-percentage`, `data-multiplier` (parseInt, default 1), `data-percentage-limit` (cap), `data-progress-id` (dedupe/group) |
| animateCompletionPercentage | 59–61 | L59:0 | clamps to 0..100; every `#completion-progress-bar`: width = value %, `aria-valuenow` = 2 decimals; every `#completion-percentage`: 2-decimal text, animated over 300 ms (instant when the tab is hidden) |
| refreshCompletionPercentage + listeners | 62–64 | L62:26 | recompute on tab visible, window focus, pageshow (Back), load+50 ms; a MutationObserver re-renders when the progress module is replaced |
| grabChecklistsFromBackend / saveChecklistStatus / rememberProfile | 69–80 / 29–32 / 100–101 | L69:0 / L29:0 / L100:0 | member sync (POST, below) |
| renderProfileSwitcher / switchChecklistProfile | 95–99 / 102 | L95:32 / L102:0 | member-only "Progress of <profile>" switcher, "View only" lock, "+ Add a profile", VIP upsell text |
| labelCheckboxes (IIFE) | 103–106 | L103:185 | gives every unlabeled tick box `aria-label` "Mark as completed: <row text>" (rule R4); re-runs on DOM changes (300 ms debounce) |

**Data flow (guest).** Page HTML carries the tick boxes (server-rendered; attributes `data-checklist-id`,
element `id` = item id, optional `data-parent-id="<list>:<parent id>"`, `data-percentage`,
`data-percentage-limit`, `data-multiplier`, `data-progress-id`). Load: storage → boxes → percentage. Tick:
box → copies → children → parents → percentage → storage. Nothing goes to the server for a guest
(cases F5-01, F5-02, F5-15, F5-19, F5-22, F5-23: `calls` and `blocked` empty).

**Dependencies.**
- Browser storage: localStorage `guest_checklists` = `{ "<list id>": ["<item id>", …] }` (shared with the map,
  which uses list id `gta6-map`). List ids seen: `gta6-100` (100% page), `gta6-missions` (missions page and
  strangers page).
- Endpoints (members only, never called for guests): POST
  `/index.php?option=com_ajax&group=system&plugin=getuserdata&format=raw&type=` + `user-token` (CL:13, REA
  request L13:31), `checklist-load` (+`&contact_id=` when a profile is chosen; body `{local_storage_data}`;
  CL:69, REA L70:7), `checklist` (body = list of `{checklist_id, value, active}` changes, header
  `X-CSRF-Token`; CL:29, REA L29:210), `checklist-profile` (body `{contact}`; CL:100, REA L100:60).
  A 403 or a "token" refusal fetches a fresh token once and retries.
- DOM ids: `completion-percentage`, `completion-progress-bar` (100% page sidebar module only).

**Effects.** Tick-box states, progress text/bar, guest storage, `checklist:updated` event, aria-labels.

**Server-side unknowns.** Shape and merge rules of `checklist-load` for members (it receives the guest's local
object; on `logged_in: true` the local key is deleted, CL:80); what the server does with unknown ids; the
profile list (`profiles.list[{id,name,platform,family,writable}]`, `vip`) — member-only, not observable.

## T2 Control → effect (main control: a requirement tick box on the 100% page)

1. Page load: the tick boxes are in the server HTML, twice per requirement (contents box + section heading):
   76 boxes, 38 + 38 (F5-01). CL:65–66 disables them, CL:85–86 re-enables them after reading storage
   (F5-01, F5-15: `count:cl-box-disabled = 0` after load).
2. The guest clicks the section box "Story Completion (50%)" (token `sec-story`). Browser fires `change`
   → CL:15 `onUserChecklistChange` (REA L15:0).
3. CL:15 sets the other copy too: `toc-story` becomes ticked (F5-02 `checked:toc-story=true`; F5-03 the other
   way round).
4. CL:17–20 children (none for `story`); CL:21–28 parents (none) — see F5-08/F5-07 for both directions.
5. CL:38–44 sums the weights: 50 (F5-02); CL:59–61 shows `50.00`, bar `width: 50%`, `aria-valuenow 50.00`
   (F5-02).
6. CL:16 guest branch → CL:33–35 writes `{"gta6-100":["story"]}` to localStorage (F5-02). No request
   (F5-02 `calls`/`blocked` empty).
7. Reload: CL:82–86 re-ticks both copies and recomputes `51.00` for story+kenton (F5-15); a later visit in the
   same browser shows the same (F5-16).

## Rules (T3)

| Rule id | Plain words | Script | Observations reproduced | Proving input |
|---|---|---|---|---|
| F5-R1 percentage | Weighted sum of ticked requirements: top-level items count their own weight; parents count their children's shares (own weight, or parent weight split by multiplier over distinct group slots), capped by the parent's limit; each item/group counted once | evidence/rules/f5-checklists-percentage.mjs | 19/19 | `kenton` with multiplier 3 under the 20 % parent → `2.73` (S-A1) |
| F5-R2 cascade + storage | Copies follow; state flows down to children not already in it; parents re-evaluated (group needs one); guest storage appends changed ids in order clicked→children→parents, removes on untick, drops empty lists, writes `{}` | evidence/rules/f5-checklists-cascade-storage.mjs | 17/17 | tick parent `exploration` → stored `["exploration", <20 children>]`, 42 boxes ticked (F5-08) |
| F5-R3 display | Clamp 0..100; text and aria-valuenow with exactly 2 decimals; bar width = clamped value % | evidence/rules/f5-checklists-display.mjs | 10/10 | weight 150 → `100.00`, width 100 % (S-D1) |
| F5-R4 label | Accessible name "Mark as completed: <row text>", whitespace collapsed, leading "N." / "N)" removed, ≤100 chars | evidence/rules/f5-checklists-label.mjs | 8/8 | row "2. Gone Fishing CHAPTER 1 POINT OF NO RETURN" → "Mark as completed: Gone Fishing CHAPTER 1 POINT OF NO RETURN" (F5-24) |

S-* observations come from one read-only probe (evidence/runs/probe-f5-checklists-synthetic.js →
probe-f5-checklists-synthetic.json): it changed `data-*` weights on the live 100% page in this browser only
and clicked boxes, so the site's own script computed multiplier, limit, group and clamp results that the
real GTA 6 pages never exercise (all their weights are whole numbers).

## Cases

- File: evidence/cases/f5-checklists.json → run evidence/runs/run-f5-checklists.json (profile
  tools/profiles/f5-checklists.profile.json).
- Count: CASES_TOTAL; clean: CASES_CLEAN; excluded: none.
- Data-only readout keys (live content, not behavior): `count:cl-box` (76/134/60), `count:toc-box`,
  `count:sec-box`, `count:mission-row`, `count:mission-row-optional`, `count:mission-row-main-link`,
  `count:mission-row-strangers-link`, `count:activity-card`, `list:chapter-heading` (heading texts),
  `list:events-table-cell`, `attr:mission-first-row@href`, `attr:… h3 a@href`, the `heading`/`title`
  readouts, and the item ids inside `local:guest_checklists` (ids are the site's; the shape is behavior).

## Command vocabulary

| token | role | accessible name / label | what it does |
|---|---|---|---|
| `cl-box` | checkbox | "Mark as completed: <row text>" | any checklist tick box (all lists) |
| `cl-box-checked` / `cl-box-disabled` / `cl-box-labelled` | checkbox | — | ticked / disabled / auto-labelled subsets (counts) |
| `toc-box`, `toc-<item>` | checkbox (inside a contents link) | "Mark as completed: Story Completion (50%)" | copy of a requirement in the contents box of the 100% page |
| `sec-box`, `sec-<item>` | checkbox (inside a section heading) | same name as its contents copy | copy of a requirement in its section heading |
| `sec-exploration-children(-checked)` | checkbox | "Mark as completed: 5 of 7 Kenton Sets Completed (1%)" … | children of a parent requirement |
| `pct-module` | region (sidebar box) | heading "<n>% Completed!" | progress module of the 100% page |
| `pct-text` | text | — | the percentage number (2 decimals) |
| `pct-bar` | progress bar (styled div, `aria-valuenow`) | — | bar whose width is the percentage |
| `guest-note` / `guest-note-login` | text / link | "Progress is saved in your browser. Login to keep progress across all your devices!" / "Login" → /login/ | guest saving notice |
| `profile-switcher` | button + menu | "Progress of <profile>" | member-only profile switcher (absent for guests) |
| `reset-control` | button | /reset/untick/clear/ | probe for a reset control (none exists) |
| `chapter-heading` | heading level 2 | "Prologue", "Chapter 1" … | groups on mission lists |
| `mission-row`, `mission-row-optional` | link (whole card) | card text | mission card linking to its walkthrough; optional ones flagged |
| `mission-box-first`, `mission-gone-fishing`, `mission-shirleys-rum`, `mission-skunk-ape` | checkbox | "Mark as completed: Prologue" … | specific mission tick boxes |
| `activity-card` | card | activity name | side-activity card (no tick box) |
| `events-table-header` / `events-table-cell` | column header / cell | "Random Event", "Location", "Reward", "Status" | random-events placeholder table |

## Behavior summary for the spec

1. Checklist pages are ordinary pages whose tick boxes are rendered with the content; each box belongs to a
   named list (e.g. "100% list", "missions list") and has an item id unique within that list. (F5-01, F5-22)
2. Until saved progress has been applied the boxes are inactive; after loading they are all active, also for
   guests. (F5-01, F5-15)
3. Ticking a box marks the item done; unticking marks it not done. Space toggles a focused box; Enter does
   nothing. Clicking a box inside a card or contents link never follows the link. (F5-02, F5-03, F5-17, F5-18,
   F5-23, F5-31, F5-32, F5-35)
4. The same item can appear several times on one page (the 100% page shows every requirement in the contents
   box and again in its section); all copies always show the same state. (F5-02, F5-03, F5-05, F5-08)
5. Parent requirements: ticking a parent ticks all its sub-items; unticking it unticks them all; ticking the
   last missing sub-item ticks the parent; unticking any sub-item unticks the parent. A partly done parent
   stays unticked but its done sub-items still count. Sub-items may form a group where any one member counts
   for the whole group. (F5-05..F5-11, S-C1..S-C4)
6. The 100% page shows "<n>% Completed!" with a progress bar in a side box. The number is the weighted
   completion (rule F5-R1): main story 50, tasks parent capped at 27 (its 11 tasks weigh 6, 3 and nine × 2),
   exploration 20 split equally over its 20 items, discovery 3 split over its 3 items; total 100.
   (F5-02, F5-05..F5-14)
7. Display: the number always has two decimals and is limited to 0–100; the bar width equals it; the bar's
   accessible value carries the same two-decimal number; changes animate briefly. (F5-01, F5-02, F5-14,
   S-A1, S-D1, S-E1)
8. Guests: progress is saved only in this browser, in one storage entry shared by every checklist (and the
   map): a map from list id to the ids of done items, in the order they were done; undone items are removed,
   empty lists are dropped, an empty map stays as an empty object. Nothing is sent to the server. (F5-02,
   F5-04, F5-07, F5-08, F5-10, F5-26, F5-37)
9. Saved progress returns on reload, on a later visit, after Back, and on every page that uses the same list
   (a strangers-page optional mission ticked there is ticked on the missions page). (F5-15, F5-16, F5-25,
   F5-36)
10. Under the progress box the guest reads "Progress is saved in your browser. Login to keep progress across
    all your devices!" with "Login" linking to the login page. The strangers page tells guests "Tick the
    checkbox next to a mission to track your progress."; the missions page says the list "contains no story
    spoilers … keep track of the missions you've completed". (F5-01, F5-27)
11. There is no reset / untick-all control on checklist pages; undo is per item (unticking a parent clears its
    sub-items). (F5-20, F5-10)
12. Every tick box has the accessible name "Mark as completed: <row text>" (rule F5-R4). (F5-20, F5-24, F5-27)
13. A `#profile=<n>` address suffix is removed on load; guests see no profile switcher. (Member-only: a
    "Progress of <profile>" switcher for up to 4 profiles — out of scope for v1.) (F5-19)
14. Missions page: heading "GTA 6 Story Missions Guide & Walkthrough"; sections Prologue, Chapter 1–5, each a
    list of mission cards (image, protagonist icon, tick box, number + title, optional badges such as
    "CHAPTER 1 POINT OF NO RETURN" / "OPTIONAL" / "MISSABLE", one-line description); main missions are
    numbered, optional missions are not and are styled differently; each card links to the mission's
    walkthrough page; then info sections and a FAQ. No progress box. (F5-22, F5-24, F5-35)
15. Strangers page: chapters 1–4 of stranger missions (cards with the mission giver) plus "Other Optional
    Missions" grouped by chapter; those optional missions use the same list and ids as the missions page.
    (F5-25, F5-27)
16. Activities (side-missions) page: a grid of activity cards linking to activity pages, no tick boxes.
    Random-events page: a placeholder table (Random Event / Location / Reward / Status) with "TBA … Coming
    Soon", no tick boxes. (F5-28, F5-29)
17. Layout of the progress box: on desktop (1366 wide) it sits at the top of the right column and stays in
    view while scrolling (sticky, ~358 px wide); at phone width (390×844) the page is one column and the
    progress box is pinned to the top of the screen across the full width (~136 px tall) so the number and
    bar stay visible while ticking. Tick boxes work the same at both widths. (F5-21, F5-30;
    probe-f5-checklists-layout.json)
18. Unknown checklist addresses show the site's 404 page. (F5-33)

## Findings

- F-F5-01 Guests never contact the server for checklists: load, tick, reload and `#profile=` deep links send
  no request (no getuserdata call, nothing blocked). Evidence: F5-01, F5-02, F5-15, F5-19, F5-22, F5-23; CL:16, CL:66–67.
- F-F5-02 Storage is localStorage `guest_checklists`, `{list id: [item ids in the order they changed]}`; untick
  removes, an emptied list is deleted, `{}` remains. Evidence: F5-04, F5-07, F5-08, F5-10; CL:33–35.
- F-F5-03 Two list ids on GTA 6 pages: `gta6-100` (38 requirements, each shown twice) and `gta6-missions`
  (134 on /missions/, 60 on /strangers-missions/, 27 shared). Evidence: F5-01, F5-22, F5-25, F5-27.
- F-F5-04 The 100% weights: story 50; tasks parent (limit 27) with own child weights 6/3/2×9; exploration 20
  over 20 items; discovery 3 over 3 items. Evidence: F5-05..F5-14; page markup.
- F-F5-05 Multiplier, limit, group and clamp are implemented but not used with non-trivial values on GTA 6
  pages; the probe confirmed them (2.73, 5.00, 1.50/3.00, 100.00). Evidence: probe-f5-checklists-synthetic.json; CL:38–58.
- F-F5-06 Parent/child cascade both ways and order of stored ids (clicked, children in page order, parents).
  Evidence: F5-07, F5-08, F5-09, F5-11; CL:15–28.
- F-F5-07 No reset control; no progress box on mission lists; side-missions and random-events have no tick
  boxes. Evidence: F5-20, F5-22, F5-28, F5-29.
- F-F5-08 Keyboard: Space toggles; Enter on a focused box does nothing (no navigation). Evidence: F5-17, F5-18, F5-31, F5-32.
- F-F5-09 The first missions card ("Prologue") links to `/missions/gta-6/prologue`, a different path pattern
  from the other 106 main cards (`/gta-6/missions/<slug>`). Evidence: F5-22, F5-34.
- F-F5-10 Member sync (static only): POST getuserdata `checklist-load` (sends the guest object, then deletes it
  locally), `checklist` (changes), `checklist-profile`, `user-token` with one retry on 403/token refusal; up to
  4 profiles, non-VIP extra profiles are "View only". Evidence: CL:13, CL:29–32, CL:69–80, CL:95–102.

## Unknowns

- U-F5-1 Member behavior (server merge of guest progress on login, profiles, view-only) — not observable as a
  guest. Rebuild v1: no accounts; keep progress in the browser only and show the guest notice.
- U-F5-2 Whether the `/missions/gta-6/prologue` link is intended (see F5-34 result). Rebuild: link every card
  to its own walkthrough route.
- U-F5-3 Behavior with a corrupt storage value was not exercised (the runner cannot seed storage). Static:
  treated as empty with a console error (CL:36, CL:83). Rebuild: same — ignore unreadable data, start empty.
