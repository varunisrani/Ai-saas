# CLONE_SPEC — behavior specification for Leonida Atlas

This document is the clean-room wall. **Leonida Atlas** is written only from this spec and the generated test
vectors (`leonida-atlas/tests/vectors/*.json`, index TEST_VECTORS.md). It holds rules and observed behavior of
the GTA 6 section of the reference site, never its code, markup, CSS class names, element ids, images, fonts,
prose or real personal data. Every rule cites evidence.

Rebuild name: **Leonida Atlas** (own logo, palette, fonts, wording — section 20).
Stack: Next.js 16 (App Router) + TypeScript + Tailwind, folder `/home/user/Ai-saas/gtabase-rebuild/leonida-atlas`.
Ending: **no backend in v1.** All content is invented sample data shipped inside the app (section 16); all
personal state (checklist ticks, map found / filter / view, compare picks, list state memory, favorites) lives
in browser storage. There are no accounts: every member-only control opens the rebuild's own "accounts are
coming later" dialog and never sends a request (DIVERGENCE D-001).

## Conventions

**Rule format.** `R-<section><nn> <rule> (<evidence>)`. Section 5 = F1 … section 14 = F10, 15 = interaction
model, 16 = fixtures. Rules are numbered per section.

**Tags.** **HYPOTHESIS** = inferred, not observed (the rule says what to build). **UNKNOWN** = not determined on
the original (the rule says what the rebuild does instead). **DIVERGENCE D-xxx** = intentional difference
(register in section 21).

**Evidence notation.** `F1-12` = recorded case (file `evidence/cases/f1-lists.json`, run
`evidence/runs/run-f1-lists.json`; same pattern for every feature; `F6NY-01` = `run-f6-guides-noyt.json`).
`F1-R3` = rule script `evidence/rules/f1-*.mjs` of that trace (all PASS). `F-012`, `F-F4-05` = findings
(FINDINGS.md, traces). `U-F3-01` = unknown (UNKNOWNS.md, traces). "trace F4 §T1" = static explanation in
`evidence/traces/f4-map.md` (code citations stay on the analysis side).

**Wording policy (W).**
- W1 Functional labels, control names, option labels, messages and title/heading *patterns* that the vectors read
  are kept verbatim; they are quoted in the rules, the message catalogue (section 17) and the command vocabulary
  (section 18).
- W2 Everything else — page headings and SEO titles of section pages, intros, descriptions, FAQ answers, 404
  reasons, panel explanations — is the rebuild's own wording (DIVERGENCE D-017). The vectors already ignore the
  `heading` and `title` readouts of those pages (tools/normalize.json).
- W3 "shown in capitals" means the text is stored in normal case and displayed upper-case by styling; the
  vectors read the displayed (upper-case) text, so the styling is part of the behavior.

**Data versus behavior (DB).** The vectors were recorded on the live database. Readouts of item names, stat
values, prices, dates of live items, item counts and the M of "Page N of M" are **data**: on the rebuild only
their format and their relations must hold (e.g. "counter equals the number of matching items", "sorted
descending"). Everything else (URLs and hashes, storage shapes, labels, enabled/checked/expanded/visible
states, counts of controls, messages) is **behavior** and must match. Each feature section ends with a
"Behavior vs data" list.

**Compatibility decisions (CD)** — interfaces kept exactly as observed so deep links, saved browser state and
the vectors keep working:
- CD1 URL paths, query and hash grammars of the GTA 6 section (section 0), including the list hash keys of F1
  with the original's key strings (section 5.2).
- CD2 Browser-storage keys and value shapes: localStorage `guest_checklists`, `gtab-map-filter`, `gtab-map-view`,
  `gtab-contest-closed`; sessionStorage `jamg-hash:<list path>` and `gtabCompare:<list path>` (sections 1, 5,
  7, 8, 9). New rebuild-only keys use the prefix `atlas-`.
- CD3 Accessible names and roles quoted in the rules and in section 18.

**Test attribute contract (TA).**
- TA1 Every element a vector token names carries the attribute `data-testid` whose value is a
  **space-separated list of every token that applies to that element** (tokens never contain spaces). The
  rebuild's parity profiles must match tokens with the word operator, i.e. `[data-testid~="<token>"]`
  (the generated profiles in `leonida-atlas/tests/e2e/profiles/` currently use exact match and must be switched).
- TA2 *Base tokens* are on every instance (e.g. every card carries `card`).
- TA3 *Positional tokens* (`card-1`, `card-2-name`, `card-last-speed`, `compare-toggle-3`, `rank-class-item-7`,
  `thumb-5`, `acc-2`, `acc-last`, `s1-track2-play`, `grid-3-first-link`, `toc-link-3`, …) are added to the element
  at that position (document order, 1-based; `last` = last) among the elements of the same base token, and move
  when the list re-renders.
- TA4 *Keyed tokens* (`class-super`, `cat-banks-box`, `sec-story`, `mission-gone-fishing`, `rail-food`,
  `platform-xbox`, `compare-to-item-nightblade`, …) are added to the element of that specific item.
- TA5 *State tokens* (`class-checked`, `class-empty`, `compare-toggle-checked`, `compare-toggle-disabled`,
  `cl-box-checked`, `cl-box-disabled`, `track-play-pause-state`, `acc-open`, `media-tab-active`,
  `subnav-current`, `pagination-active`, …) are present exactly while the stated condition holds.
- TA6 *Scoped tokens*: the same token name is used by two suites for two controls in a few cases
  (`search-input`, `login-link`, `sidebar`, `panel`). Each element carries the token, and the suite's profile
  scopes the lookup (F4 suite inside `map-root`; F9 suite inside the site header; F7 `sidebar` = page side
  column). Section 18 marks them.
- TA7 Where a vector reads a state through an attribute of the original markup (`class`, `style`, `data-*`
  that is not listed in section 18), the rebuild exposes the state as `data-state` (words given per element in
  section 18); those readouts are implementation details and are ignored by the normalizer.
- TA8 `heading` is the page's single `h1` (no test id needed).

---

## 0. Global (routes, access, navigation)

All routes are public; there are no signed-in or role-gated routes (section 3). Paths are case-sensitive in
the table; see R-004 for upper-case input.

### 0.1 Route table

| # | Route | Page | Evidence |
|---|---|---|---|
| 1 | `/` | Leonida Atlas front page (own): name, one-line purpose, link card to `/gta-6/` (DIVERGENCE D-012) | F9-38 |
| 2 | `/gta-6` | permanent redirect to `/gta-6/` | F9-41 |
| 3 | `/gta-6/` | GTA 6 hub (F9) | F9-01 |
| 4 | `/gta-6/vehicles/` | vehicles database list (F1) + compare bar (F3) | F1-01, F3-01 |
| 5 | `/gta-6/weapons/` | weapons database list (F1) + compare bar (F3) | F1-W01, F3-13 |
| 6 | `/gta-6/vehicles/<slug>`, `/vehicles/gta-6/<slug>` | vehicle detail (F2); both forms render the same page, no redirect | F2-01, F2-30 |
| 7 | `/gta-6/weapons/<slug>`, `/weapons/gta-6/<slug>` | weapon detail (F2) | F2-03, F2-33 |
| 8 | `/gta-6/animals/<slug>`, `/animals/gta-6/<slug>` | animal detail (F2) | F2-04, F6-02 |
| 9 | `/gta-6/characters/<slug>`, `/characters/gta-6/<slug>` | character detail (F2) | F2-05 |
| 10 | `/gta-6/properties/<slug>`, `/properties/gta-6/<slug>` | property detail (F2) | F2-06, F6-08 |
| 11 | `/gta-6/radio-stations/<slug>`, `/soundtrack/gta-6/<slug>` | radio station detail (F2) | F2-07, F-F6-04 |
| 12 | `/gta-6/gangs/<slug>`, `/gangs/gta-6/<slug>` | gang detail (F2 family, "Gangs & Factions") | F6-06 |
| 13 | `/gta-6/missions/<slug>`, `/missions/gta-6/<slug>` | story / optional mission walkthrough (F2 + F5) | F2-08, F5-34 |
| 14 | `/gta-6/strangers/<slug>` | stranger mission walkthrough (F2 + F5) | F5-27 (link pattern) |
| 15 | `/side-missions/gta-6/<slug>`, `/gta-6/side-missions/<slug>` | activity page (F2 family) | F5-28 (link pattern) |
| 16 | `/gta-6/vehicles/comparison/` (+ `?vehicle1=…&vehicle2=…[&vehicle3=…&vehicle4=…]`) | vehicle comparison (F3) | F3-18, F3-27 |
| 17 | `/gta-6/weapons/comparison/` (+ `?weapon1=…`) | weapon comparison (F3) | F3-19, F3-26 |
| 18 | `/gta-6/vehicles/best-vehicles/` (+ `?class=<class slug>`) | default ranking (Super class) / redirect to a class ranking (F3) | F3-30, F3-39 |
| 19 | `/gta-6/vehicles/best-<page slug>/` (21 page slugs, R-716) | class ranking (F3) | F3-32..F3-38 |
| 20 | `/gta-6/animals/`, `/gta-6/characters/`, `/gta-6/gangs/`, `/gta-6/properties/`, `/gta-6/radio-stations/`, `/gta-6/map-locations/` | guide pages (F6) | F6-01..F6-24 |
| 21 | `/gta-6/gta-6-cheats-ps5-cheat-codes`, `/gta-6/gta-6-cheats-xbox-series-xs-cheat-codes`, `/gta-6/gta-6-cheats-pc-full-list-of-cheat-codes` | cheat pages (F6) | F6-18..F6-22 |
| 22 | `/articles/gta-6/gta-6-100-completion-guide-interactive-checklist` | 100% checklist article (F5) | F5-01 |
| 23 | `/gta-6/missions/`, `/gta-6/strangers-missions/`, `/gta-6/side-missions/`, `/gta-6/random-events/` | mission / activity lists (F5) | F5-22, F5-27..F5-29 |
| 24 | `/gta-6/map/` (+ `?feature=<key>`, `#<marker id>`, `#spot=<x>,<y>`) | interactive map (F4) | F4-01, F4-16, F4-20, F4-56 |
| 25 | `/gta-6/news/`, `/gta-6/news/page-<N>` (N ≥ 2), `?start=<offset>` | GTA 6 news list (F7) | F7-01..F7-13 |
| 26 | `/gta-6/articles`, `/gta-6/articles/page-<N>` | second address of the news list (same content as 25) | F7-37, F7-06 |
| 27 | `/gta-6/guides/`, `/gta-6/guides/page-<N>` | guides list (F7) | F7-14, F7-15 |
| 28 | `/gta-6/videos/` | videos list, single page (F7) | F7-17, F7-18 |
| 29 | `/news/`, `/news/page-<N>` | all-news list of this site (only GTA 6 content exists; F7) — HYPOTHESIS: kept so the parent-category link and the "Filter by Game" menu work | F7-20..F7-22 |
| 30 | `/gta-6/articles/<slug>`, `/articles/gta-6/<slug>` | article page (F7); each article has one canonical form, both forms render it | F7-26, F7-27, F7-31 |
| 31 | `/gta-6/screenshots/` (+ `?thumb_limitstart=<offset>&limit=100`), `/gta-6/screenshots/trailers/` (+ same query), `/gta-6/artworks/`, `/gta-6/covers/` | media galleries (F8) | F8-01, F8-14, F8-18, F8-19, F8-23 |
| 32 | `/search?q=<text>` | local search results page (F9; DIVERGENCE D-003) | F9-21..F9-25 |
| 33 | `/membership/` | own plan page, structure only, with the FAQ accordion (F6/F10; DIVERGENCE D-016) | F6-27, F10-27 |
| 34 | `/membership/free/` | "Join" page: the accounts-later notice (D-001) | F9-26 (link target) |
| 35 | `/login/` (and `/login` → permanent redirect to `/login/`) | sign-in page: the accounts-later notice, no form (D-001, D-026) | F10-32, F4-01, F5-01 |
| 36 | `/art/<kind>/<id>.svg` | rebuild-only asset route: generated placeholder artwork (section 20) | — |
| 37 | anything else (including `/gta-6/map/<anything>`, `/mybase/…`, unknown slugs, `page-1`, pages past the end, unknown `best-*`, unknown `?class=`) | 404 page with HTTP status 404 (R-010) | F1-40 run 1, F2-09, F3-41, F4-76, F5-33, F6-25, F7-08..F7-10, F7-16, F7-18, F7-32, F7-33, F8-30, F9-35, F10-30 |

### 0.2 Rules

- R-001 Every route in 0.1 renders complete HTML on the server for its first paint; client code only enhances it
  (lists, map, compare, checklists, galleries, menus, player). No page needs a request to any server of the
  original or to a third party (F-001, F-012; D-006).
- R-002 Trailing slash: hub, list, guide, gallery, map, comparison, ranking, membership and login
  pages are canonical **with** a trailing slash; requesting them without it permanently redirects to the form with
  the slash (observed for `/gta-6`, F9-41; HYPOTHESIS for the others). Detail pages, article pages, cheat pages,
  the 100% checklist and `page-N` list pages are canonical **without** a trailing slash; requesting them with one
  permanently redirects to the form without it (F2-28; HYPOTHESIS for the non-detail pages). `/gta-6/articles`
  (no slash) is served as is (F7-37); `/search` is canonical without a slash (F9-21).
- R-003 Query parameters: the image parameter `i` is removed by a permanent redirect to the same path without it
  (other parameters kept) on detail and gallery pages, so `?i=` never opens a lightbox (F2-21, F8-16; F-F2-05).
  Every other unknown parameter (e.g. `utm_source`) is kept in the URL and ignored (F2-22, F8-17). Meaningful
  parameters: `?feature=` (map), `?vehicle<n>=` / `?weapon<n>=` (comparison), `?class=` (rankings), `?start=`
  (article lists), `?thumb_limitstart=` + `limit` (galleries), `?q=` (search).
- R-004 A path that contains upper-case letters permanently redirects to its lower-case form (observed on detail
  pages, F2-29; HYPOTHESIS elsewhere).
- R-005 Hash fragments are never sent to the server; pages that use them (F1 list state, F4 map, F5 `#profile=`,
  F6/F7 table-of-contents anchors, F6 accordion aliases) read them in the browser (F1-R1, F4-R4, F5-19, F7-R5,
  F6-R5).
- R-006 Every page except the 404 page shows the full shell (F9): skip links, header (logo, main menu, search,
  "Log In" + "Join" controls), the GTA 6 sub-navigation bar, the content with a right side column, the back-to-top
  control and a footer that is rendered lazily (R-1312). The 404 page keeps the header and main menu but has no
  GTA 6 sub-navigation (F9-35, F-F9-16).
- R-007 First visit: no browser storage is read or written by the shell itself; a feature writes its storage key
  only on the first change (F1-01 writes the list hash memory immediately, R-530; map, checklist, compare and
  favorites keys stay absent until the visitor acts: F4-01, F5-01, F3-01).
- R-008 Each list or item has exactly one canonical path used by every link to it; the alternative form of row 6–15
  renders the same page without redirect and declares the canonical path as the page's canonical link
  (F2-30, F6-06, F6-08; HYPOTHESIS for the canonical-link element).
- R-009 Article lists accept `?start=<offset>` as an alternative to `page-N` (R-1107); videos accept no paging.
- R-010 404: unknown URLs answer HTTP 404 with heading and document title "404 Page Not Found", the sub-heading
  "Get back inside the map!", an own one-line explanation, an own list of three possible reasons (own wording,
  DIVERGENCE D-017), advice to use the menu or search, a picture (own SVG), and **no links inside the content
  area**; the breadcrumb trail reads "Home › Page not found" (F9-35, F9-36, F2-09, F-F9-16).
- R-011 Navigation is by full page loads or client transitions — both are fine — but the browser history must
  behave like full page loads: each link adds one entry; list state (F1) and map state (F4) use replace and never
  add entries (F1-R7, F4-R4); table-of-contents anchors and accordion aliases add entries (F7-45, F6-28).
- R-012 Redirect status: "permanent redirect" means HTTP 301 or 308; vectors only read the final URL.

---

## 1. Data model

There is no database. Content entities are read-only, generated deterministically at build time by the data
module (section 19) from the rules in section 16. Personal state is browser storage. Field names below are the
rebuild's own; types in words.

### 1.1 Content entities

| Entity | Fields (type, required, limits) | Read by | Evidence |
|---|---|---|---|
| Vehicle | slug (text, unique in list, lower-case words joined by "-"); compareKey (text, unique; the alias used in comparison URLs and compare storage; equals slug unless the fixture says otherwise); canonicalPath (text; `/gta-6/vehicles/<slug>` or the legacy form `/vehicles/gta-6/<slug>`); position (whole number; catalogue order inside the list); name (model name, required); make (manufacturer id, required); classes (1–2 vehicle class ids, first = primary); standoutSet (set id, or none = regular vehicle); baseModel (vehicle slug, only for variants); realLife (text, optional); speed, acceleration, asphaltHandling, offroadHandling, strength (number 0–10 with one decimal, each optional); offroadRating, roadRating (whole number 0–1000, optional); seats (whole number); style, era, specialist, mass, driveTrain, gears (text, optional); editions (list of short labels, optional); notableOwners (list of text, optional); appearances (list of game labels, optional); howToGet (own text, optional); description (own text); image (placeholder id); gallery (none, empty, or list of images); rating (average 0–5 with one decimal, vote count) | F1, F2, F3, search | F1-38, F2-01, F2-02, F-F1-17 |
| Weapon | slug; compareKey (= slug); canonicalPath; position; name; make; weaponClass (id); type ("base-weapon" or "unique-variant"); baseModel (weapon slug, only for unique variants); realLife (optional); damage, accuracy, handling, range (0–10 one decimal, optional); overall (0–10 one decimal, optional); price (whole dollars, optional); ammoCapacity, extendedAmmo, acquisitionMethod, storyModePrice, modifications, howToUnlock (text, optional); variants (computed: items whose baseModel is this one); appearances; description; image; gallery; rating | F1, F2, F3 | F1-W15, F2-03, F2-33 |
| VehicleClass / WeaponClass | id (slug), label, tileOrder (whole number), titleNoun (singular noun used in vehicle titles), pageSlug + pluralLabel (vehicle rankings) | F1, F2, F3 | F1-R5, F2-R1, F3-R5 |
| Manufacturer | id (slug, may lose accents: "Übermacht" → "ubermacht"), label, logo (placeholder id) | F1, F2 | F1-21 |
| StandoutSet | id (slug), label, order (whole number) | F1, F2 | F1-19 |
| Animal | slug; name; grid ("land", "birds", "sea"); animalCategory, habitat, recommendedWeapon, species, animalClass (text); gallery (empty allowed); rating | F2, F6 | F2-04, F6-01 |
| Character | slug (or none for "other" rows without a page); name; grid ("protagonists", "main", "supporting", "minor") or "other"; role, gender, bornInYear, nationality, location, occupation, alsoKnownAs, performer (invented or "Not yet announced"), family, affiliation, propertySafehouse (text); vehicles (vehicle slugs); screenshots, artworks (galleries); video (placeholder); rating | F2, F6 | F2-05, F6-04 |
| Gang | slug; name; canonicalPath (legacy form `/gangs/gta-6/<slug>`); grid ("gangs" or "law"); type, territory (text); description | F6 | F6-05, F6-06 |
| Property | slug; name; canonicalPath; grid ("purchasable", "story", "edition", "safehouse"); propertyType, propertyStyle, location, region (text); vehicleCapacity (whole number, optional); howToUnlock (text); price (whole dollars, purchasable only); mapImage (placeholder) | F2, F6 | F2-06, F6-07 |
| RadioStation | slug; name; genre; host; tracks (list: number, title, artist, year, audioClip id or none = not playable); rating | F2, F6 | F2-07, F6-09 |
| Mission | checklistId (text of digits, unique in list `gta6-missions`); slug; canonicalPath; kind ("main", "optional", "stranger"); chapter ("Prologue", "Chapter 1".."Chapter 5"); strangersChapter (1–4, strangers only); number (main missions only, 1..N in story order); title; badges (list of short labels); giver, protagonist, missionType, requiredFor100, featuring, rewards (text); objectives (list of headings + own text); listedOnStrangersPage (yes/no) | F2, F5 | F5-22..F5-27, F2-08 |
| Activity | slug; name; canonicalPath `/side-missions/gta-6/<slug>`; description | F5 | F5-28 |
| Cheat | id; category (one of 5); name; effect (text); unlock (text); sequence (list of "UP", "DOWN", "LEFT", "RIGHT") | F6 | F6-18, F6-R4 |
| ChecklistItem (100% list) | id (text); label (text ending with its weight, e.g. "Tasks (27%)"); parent (item id or none); weight (percentage, optional); limit (cap, optional); multiplier (whole number, default 1); group (key, optional) | F5 | F5-R1 |
| MapGroup | id, name, color | F4 | trace F4 §T1 |
| MapCategory | id; name; singularName; group; trackable (yes/no); hiddenByDefault (yes/no); multiSpawn (yes/no); slug (optional link key); closedToSuggestions (yes/no, unused in v1); color (optional) | F4 | trace F4 group table |
| Marker | id (`<category id>-<3 digits>`); name; category; x (east), y (north) in map units; description (optional; ";"-separated sentences, parts "Label: value" become rows); image (optional placeholder); detailsPath (optional, a rebuild path) | F4 | trace F4 §T1 |
| Article | slug; canonicalPath (`/gta-6/articles/<slug>` or `/articles/gta-6/<slug>`); title; shortTitle (table-of-contents heading); publishedAt (UTC date-time); modifiedAt (optional); showModified (yes/no); showAuthor (yes/no); author (invented name); flags: guide, video; hero image + alt; sections (list: heading, anchor, noIndex, own body); toc (yes/no); related (optional heading + 2–4 cards); video placeholder (video items); authorBio (optional) | F5, F7, F9 | F7-R1..F7-R5 |
| GuideEntry | article slug or section link (title, path, thumbnail), sortDate | F7 | F-F7-07 |
| Gallery | id; page path; heading (optional); mode ("grid", "cover", "embedded", "strip"); images (list: id, alt, caption, width, height) | F2, F8 | F8-R1..F8-R4 |
| HubContent | info rows (label, value, optional link); section cards (label, path, grid); about text | F9 | F9-01, F9-03 |
| FaqItem | alias (fixed id), question (own), answer (own), openByDefault | F6 (membership) | F6-27 |
| Plan | id, title, price line, feature list (own) | F10 | F10-27 |

### 1.2 Browser-storage records (personal state)

| Key (storage) | Value shape | Written by | Evidence |
|---|---|---|---|
| `guest_checklists` (local) | JSON object: list id → array of item ids (strings) in the order they were ticked; list ids `gta6-100`, `gta6-missions`, `gta6-map` | F5 checklists, F4 map | F4-R2, F5-R2 |
| `gtab-map-filter` (local) | JSON object `{hidden:[category ids], folded?:[group ids], sidebar?:"open"\|"closed", hideFound?:true, dv:1}`; absent when equal to the defaults | F4 | F4-R1 |
| `gtab-map-view` (local) | JSON object `{lat:<y>, lng:<x>, z:<zoom>, t:<epoch ms>}` | F4 | F4-R7 |
| `gtab-contest-closed` (local) | text `<start>\|<end>\|on` of the closed map notice | F4 | F4-74 |
| `jamg-hash:<list path>` (session) | text: the list's hash including the leading "#" | F1 | F1-R7 |
| `gtabCompare:<list path>` (session) | JSON array `[{id:<compareKey>, name:<display name>}]` in pick order | F3 | F3-R2 |
| `atlas-favorites` (local) | JSON object `{"gta-6": ["<list>/<slug>", …], "gta6-map": ["<marker id>", …]}` in the order added; a list is removed when empty, the key when the object is empty | F10 (HYPOTHESIS, D-002) | F10 behavior 12 |

No cookies are set by the rebuild (DIVERGENCE D-001: the original sets a session cookie, F-021).

---

## 2. Operations (no backend)

The rebuild designs its own internal data access; none of the original's endpoints is called. Server-side reads
are calls into the data module during rendering; personal-state operations run in the browser.

| Operation | Inputs | Output | Errors | Who | Evidence |
|---|---|---|---|---|---|
| List dataset | list ("vehicles" or "weapons") | compact entries of every item (fields the list filters, sorts and renders) in catalogue order, plus option labels and counts source | none | list page (shipped with the page, no request on filter/sort/scroll) | F1-01 calls, R-501 |
| Item by path | list, slug (path form) | item + its neighbours (previous/next in catalogue order) + "Compare To" entries + related cards | unknown slug → 404 | detail pages | F2-09, F2-R5, F2-R3 |
| Comparison resolve | list, query parameters | canonical item keys (sorted, unique, known, max 4) and whether a redirect is needed; the items | none (unknown keys dropped) | comparison page | U-F3-02 |
| Ranking rows | page slug or class query | class, ordered rows | unknown → 404 | ranking pages | F3-R4, F3-R5 |
| Article list page | list ("news", "guides", "videos", "all"), page number or start offset | items of the page, page count, current page | page out of range → 404 (page-N), last page with no items (start) | list pages | F7-R2 |
| Article by path | slug, path form | article, pager neighbours (news order) | unknown → 404 | article page | F7-32, F7-R4 |
| Gallery page | gallery id, offset | images of the page, page count | none | gallery pages | F8-R3 |
| Map data | — | groups, categories, markers (inline in the page) | none | map page | trace F4 §T1 |
| One-category map | `?feature` key | category or none | unknown key → normal map | map page | F4-R4 |
| Local search | text | grouped results | none | search page | D-003 |
| Storage read/write | key, value | parsed value; unreadable JSON is treated as empty | storage unavailable → features work for the session without persistence | browser modules | U-F5-3 |

---

## 3. Auth and roles

- R-301 There are no accounts, sessions, roles or cookies in v1; every visitor is a guest (DIVERGENCE D-001;
  F-020..F-024 describe the original's member mode, not built).
- R-302 The **accounts-later dialog** replaces the original's login dialog. It opens from: the header "Log In"
  control, the phone account menu's "Log In" and "Create Account" entries, the membership plan buttons, and the
  "Log in" link inside the map side panels that every map member action opens (Suggest location, Personal marker,
  Map Contest, the shared-spot "Suggest this location" pill; R-843). It never sends a request (F9-26..F9-29,
  F10-24; D-001, D-018).
- R-303 Dialog content (own wording): title "Sign in to Leonida Atlas", one paragraph saying accounts are coming
  later and that progress, favorites and settings are saved in this browser only, a primary button "Got it"
  (closes) and a close button whose accessible name is exactly "close". No input fields, no social sign-in
  buttons (D-001, D-026; no credentials are ever collected).
- R-304 The dialog is modal: role dialog, accessible name = its title, the page behind is inert, focus moves into
  the dialog and returns to the opener on close; Escape, the close button, "Got it" and a click on the dimmed
  backdrop close it; the URL never changes (F9-27..F9-29, F10-09, F10-10).
- R-305 While open the dialog root carries `aria-hidden="false"`; when closed it is removed from the page or
  hidden (F9-27, F9-28).
- R-306 `/login/` and `/membership/free/` render the same message as a page (heading "Sign in to Leonida Atlas" /
  "Join Leonida Atlas", own text, link back to `/gta-6/`) (F10-32 structure; D-026).
- R-307 Links that the original pointed at its login page keep their targets: the map guest line links to
  `/login` (F4-01), the checklist guest note links to `/login/` (F5-01).
- R-308 No page shows member-only information (profiles, net worth, rankings); `/mybase/gta-6/` and
  `/mybase/gta-online/` are 404 (F10-30; D-012 for the rankings page).

---

## 4. Output formatting

- R-401 Long dates: "<Month name> <day without leading zero>, <4-digit year>" in English, from the **UTC calendar
  date** of a stored UTC date-time ("2026-11-21T00:16:15Z" → "November 21, 2026") (F7-R1).
- R-402 Article list date line: "on <long date>"; article meta: "on <long date>" for the published date or
  "Last Updated: <long date>" for the modified date (exactly one of the two); hub latest-news line: "Published on
  <long date>". Every shown date also exposes its machine-readable UTC date-time (F7-01, F7-31, F9-01).
- R-403 Counters that name a list use the plural noun for every number: "0 Vehicles", "1 Vehicles", "29 Vehicles",
  "211 Weapons" (F1-R6).
- R-404 Thousands separators: comma, e.g. "$12,500" (price pills, F1-W15; F-F1-17). No decimals for money.
- R-405 Stat values on a 0–10 scale: one decimal on detail pages ("4.0", "8.1") (F2-R2); on list cards
  "<value>/10" with the value as stored (no forced decimal, "7/10", "8.5/10") (F1-25, F1-W07). Bar width =
  value × 10 percent. Ratings on a 0–1000 scale: whole numbers, card bar width = value ÷ 10 percent (F1-38).
- R-406 Missing values: list-card stat → unknown look with "?" as the value text (R-533); ranking rating → "-"
  (F3-R4); comparison cell → "-" (R-714); detail info row → the row is omitted (F2 behavior 5).
- R-407 Percentages (100% checklist): clamp to 0–100, then exactly two decimals ("0.00", "2.73", "100.00"), no
  percent sign inside the number; the bar width is the clamped value in percent (F5-R3).
- R-408 Times (radio): "m:ss" — minutes unpadded, seconds two digits; non-finite or negative → "0:00" (F6 §T1
  formatTime; F6-09).
- R-409 Countdown fields: two digits each (days may use more digits) (F9-R2).
- R-410 Rating line: "<average with one decimal> of 5 (<votes> Votes)", "Vote" when votes = 1 — UNKNOWN on the original; HYPOTHESIS for
  the singular and for always one decimal (observed "0.0 of 5 (0 Votes)", "3.6 of 5 (7 Votes)", "4 of 5 (12 Votes)";
  U-F2-01).
- R-411 Map counters: "found <f> / <n>" in the text with "found " and the spaces visually hidden (reads "f/n"),
  screen-reader text "found <f> of <n>"; non-trackable "<n>" (F4-R3).
- R-412 Plural of map reset counts: "1 marker", "<n> markers" (F4-R5).
- R-413 Heading slugs (table-of-contents anchors, accordion aliases when derived): lower case, "&" and every other
  punctuation removed, runs of spaces/dashes → one "-", no leading/trailing "-"
  ("Getting Out: Stop, Bail or Leave the Engine Running" → `getting-out-stop-bail-or-leave-the-engine-running`)
  (F7-R5, F6-R4).
- R-414 Document titles: detail pages "<h1> | GTA 6 <type suffix>" (R-603); article pages = the article title;
  one-category map pages "All GTA 6 <Singular> Locations (<count>) | Interactive Map" (F4-R4); ranking pages
  "GTA 6 Best <Class plural> List: Stats Ranking" (F3-R5); comparison pages "GTA 6 Vehicle Comparison" / "GTA 6
  Weapon Comparison" (F3-18); 404 "404 Page Not Found"; list page N ≥ 2: "<list name> - Page N | Leonida Atlas";
  all other pages own titles containing "GTA 6" and ending " | Leonida Atlas" (F9-R5; titles of section pages are
  own wording, W2).
- R-415 Empty states: list with no match → empty card area and counter 0, no message (F1-07); empty gallery →
  "Coming soon." (F2-03); article list offset past the end → no items, no message (F7-12); map search → messages
  of R-837.

---

## 5. F1 — Database lists (`/gta-6/vehicles/`, `/gta-6/weapons/`)

"List" = either database page. Compare toggles and the compare bar on the same pages are F3 (section 7).

### 5.1 Loading and layout
- R-501 Each list page receives its whole dataset with the page and does all filtering, sorting and paging in the
  browser; no request is sent on any filter, sort, scroll or clear action (F1-01, F1-W01 `calls`; F-F1-01).
- R-502 Until the list is interactive a simple loading indicator is shown in the card area (static, U-F1-08).
- R-503 Desktop layout (1366 px): a horizontal filter bar above the list (each filter's title above its control),
  then a toolbar with the label "Sort By", the sort dropdown, the direction button, the counter and a grid/list
  switch, then the cards in a 4-column grid, then a second toolbar below the cards that repeats the counter
  (F1-01, F1-39).
- R-504 The counter always shows the number of matching items — never the number rendered — followed by the
  plural noun: "<n> Vehicles" / "<n> Weapons" (top and bottom copies identical) (F1-01, F1-07, F1-13; F1-R6).

### 5.2 Hash keys, filters and sort fields (compatibility decision CD1)

Vehicles:

| Control | Title / label | Hash key | Kind |
|---|---|---|---|
| name filter | "Vehicle Name", placeholder "Enter Vehicle Name" | `name` | text |
| class tiles | "Vehicle Class" | `attr.ct1.value` | multi choice (tiles) |
| manufacturer | "Manufacturer", placeholder entry "Select Manufacturer" | `attr.ct2.value` | single choice dropdown with search |
| standout set | "Standout Set", placeholder entry "Select Standout Set" | `attr.ct734.value` | single choice dropdown with search |
| real-life filter | "Real Life Vehicle", placeholder "Enter Real Life Vehicle" | `attr.ct72.value` | text |
| sort "Vehicle Name" | | `name` | sort field |
| sort "Manufacturer" | | `attr.ct2.frontend_value` | sort field |
| sort "Vehicle Class" | | `attr.ct1.frontend_value` | sort field |
| sort "Speed" (default, descending) | | `attr.ct6.frontend_value` | sort field |
| sort "Asphalt OVR" (road rating) | | `attr.ct665.frontend_value` | sort field |
| sort "Off-Road OVR" (off-road rating) | | `attr.ct10.frontend_value` | sort field |
| sort "Seats" | | `attr.ct11.frontend_value` | sort field |

Weapons:

| Control | Title / label | Hash key | Kind |
|---|---|---|---|
| name filter | "Weapon Name", placeholder "Enter Weapon Name" | `name` | text |
| class tiles | "Weapon Class" | `attr.ct55.value` | multi choice (tiles) |
| manufacturer | "Manufacturer", "Select Manufacturer" | `attr.ct2.value` | single choice dropdown with search |
| weapon type | "Weapon Type", "Select Weapon Type"; options "Base Weapon" (`base-weapon`), "Unique Variant" (`unique-variant`) | `attr.ct246.value` | single choice dropdown (no search) |
| real-life filter | "Real Life Weapon", placeholder "Enter Real Life Weapon" | `attr.ct72.value` | text |
| sort "Weapon Name" (default, ascending) | | `name` | sort field |
| sort "Weapon Class" | | `attr.ct55.frontend_value` | |
| sort "Price" | | `attr.ct57.frontend_value` | |
| sort "Manufacturer" | | `attr.ct2.frontend_value` | |
| sort "Damage" | | `attr.ct58.frontend_value` | |
| sort "Accuracy" | | `attr.ct60.frontend_value` | |
| sort "Range" | | `attr.ct61.frontend_value` | |
| sort "Overall Rating" | | `attr.ct10.frontend_value` | |
| sort "Handling" | | `attr.ct9.frontend_value` | |

- R-505 Filters appear in the table order; sort options appear in the table order (F1-01, F1-W01). Default state:
  vehicles hash `#sort=attr.ct6.frontend_value&sortdir=desc`, weapons `#sort=name&sortdir=asc`, written
  immediately on a plain visit (F1-01, F1-W01; F-F1-02).
- R-506 Choice option values are the ids of section 16 (class ids such as `super`, `sports`, `handguns`;
  manufacturer ids such as `ubermacht`; standout set ids such as `all-terrain`; the pseudo value
  `hide-standouts`; weapon type ids). Labels: "<label> (<count>)" (F1-01: "Super (29)", "Hide Standout Vehicles
  (319)"; F1-W01: "Base Weapon (84)").

### 5.3 Filters
- R-507 Options of a choice filter are the values present in the data (empty values skipped). Class tiles follow
  the configured tile order of section 16 (not alphabetical); manufacturers are A→Z by label; in "Standout Set"
  the entry "Hide Standout Vehicles" (value `hide-standouts`) comes first, then the sets in configured order
  (first set "All-Terrain"); weapon types "Base Weapon", "Unique Variant" (F1-01, F1-W01, F1-21; F-F1-08).
- R-508 Text filters apply when the field commits — Enter or leaving the field — never while typing (F1-04, F1-11,
  F1-12). Match = the item's field contains the query, ignoring letter case (F1-04/F1-05, F1-W09/F1-W10). The query
  is not trimmed: leading and trailing spaces must match too (F1-06 " an" → 1 live match; F1-41 "an " → 7 live matches). Every
  character other than letters, digits and space is literal ("<b>x</b>" is plain text, F1-43). The field accepts
  at most 128 characters (F1-42). An empty query removes the filter. An item without the field never matches a
  non-empty query (F1-R2).
- R-509 Accent folding is one-way: in the query an unaccented a, e, i, o, u, y, c, d, n, g or s also matches its
  accented forms in the data (a: á à ả ã ạ ă ắ ằ ẵ ặ â ấ ầ ẩ ẫ ậ ä å æ; e: é è ẻ ẽ ẹ ê ế ề ễ ệ ể ë; i: í ì ỉ ĩ ị î ï ı;
  o: ó ò ỏ õ ọ ơ ớ ờ ở ợ ỡ ô ố ồ ổ ỗ ộ ö ø; u: ú ù ủ ũ ụ ư ứ ừ ử ự ữ û ü; y: ý ỳ ỷ ỹ ỵ ÿ; c: ç; d: đ; n: ñ;
  g: ğ; s: ş); an accented letter in the query matches only itself ("huracan" and "Huracán" both find "Huracán";
  "án" finds nothing in unaccented names) (F1-08..F1-10; F1-R2).
- R-510 Class tiles (2nd filter): a plain click on an unpicked tile while no tile is picked picks it; a plain click
  on an unpicked tile while others are picked **switches** (only the clicked tile stays picked); Ctrl, Cmd or Shift
  + click on an unpicked tile **adds** it; a click on a picked tile removes only that tile (with or without a
  modifier) (F1-13..F1-16, F1-W02..F1-W04, F1-36; F1-R5). Each tile also has a small visible "+" button (accessible
  name "Add <label> to the selection") that adds without switching (static, U-F1-01). Space on a focused tile
  checkbox behaves like a plain click (HYPOTHESIS).
- R-511 Several picked classes combine with OR; different filters (class, dropdowns, text fields) combine with AND
  (F1-15, F1-18, F1-30, F1-W04, F1-W12; F1-R3).
- R-512 Option counts update after every change: with no active filter each option counts all items; a filter that
  is the only active one keeps its full counts; an active filter combined with others counts within the result of
  the *other* filters; an inactive filter counts within the current result (F1-13, F1-17..F1-19, F1-W05; F1-R3).
- R-513 Options with count 0 stay visible and are marked empty (state token `class-empty` on tiles) (F1-07).
- R-514 "Hide Standout Vehicles" lists only regular vehicles (no card carries "★ Standout"); choosing a set lists
  only that set's vehicles, every card badged (F1-17, F1-19, F1-30; F-F1-08).
- R-515 Dropdown widgets (manufacturer, standout set, weapon type, sort): a button showing the current label (or the
  placeholder "Select <title>"; for sort the current field label, e.g. "Speed"), `aria-haspopup="listbox"`,
  `aria-expanded`; activating it opens a listbox of options. When a filter dropdown has more than 10 options it
  shows a search box (accessible name = the filter title) above the options; typing keeps the options whose label
  has a word starting with the typed text, ignoring letter case but **without** accent folding ("Uber" matches
  nothing when the make is "Übermacht"; "Über" matches it); the first remaining option is highlighted; Enter
  selects the highlighted option and closes; ArrowDown/ArrowUp move the highlight; Escape closes without change;
  no match shows one non-selectable row "No results match <typed text>" (F1-20, F1-21; F-F1-09; U-F1-07). The
  sort dropdown has no search box. Choosing the placeholder entry clears that filter.
- R-516 Each dropdown also has a hidden value mirror (a native select listing the same options with the hash
  values, not focusable and hidden from assistive technology) whose value is the current choice: `""` when none,
  e.g. `hide-standouts`, `all-terrain`, `ubermacht`, `unique-variant`; the sort mirror holds the sort key, e.g.
  `attr.ct6.frontend_value`, `name` (F1-01, F1-17, F1-19, F1-21, F1-22, F1-W05).
- R-517 "Clear Filters" (a button) is visible only while at least one filter is active; it empties every filter
  (text fields, tiles, dropdowns back to "Select …"), restores the full counts and the full list, and writes the
  hash with `page=1` and no filter keys (F1-13, F1-34, F1-W16; F-F1-14; accessibility fix, DIVERGENCE D-010: the
  original's control has no button role).
- R-518 No match: the card area is empty (no message), the counter reads 0, every option shows (0) and is marked
  empty (F1-07, F1-43).

### 5.4 Sorting
- R-519 Choosing another sort field keeps the current direction (vehicles: Name after the default shows Z→A;
  weapons: Damage after the default shows low→high) (F1-22, F1-W06, F1-37).
- R-520 The direction button flips ascending/descending. It is a button whose accessible name says what it will do
  ("Sort descending" while ascending, "Sort ascending" while descending) and whose `data-state` is the current
  direction (`asc`/`desc`) (F1-23, F1-24; the original's tooltip is constant, DIVERGENCE D-010).
- R-521 Comparison of two items on the sort field: multi-value fields (class, seats) compare their values joined
  with a space after sorting them alphabetically; "Vehicle Class" compares display labels alphabetically ("Boats"
  first ascending), not the tile order; equal values fall back to the names (natural order, case- and
  accent-insensitive) in the chosen direction; two numeric values compare numerically; two non-empty texts compare
  character by character (locale-aware single-character comparison; when one is a prefix of the other the longer
  is larger); an empty or missing value always goes **after** every non-empty value in both directions; descending
  reverses every comparison except the empty-last rule (F1-22..F1-27, F1-W06..F1-W08, F1-W12; F1-R4).
- R-522 Values from a link that are not valid: an unknown sort field is kept in the URL, the sort control shows its
  first option ("Vehicle Name"/"Weapon Name") and the items are in name order ascending; a `sortdir` other than
  `desc` becomes `asc` (also written back to the URL); an unknown filter value is ignored (nothing ticked, full
  list) but left in the URL (F1-31; F-F1-16).

### 5.5 Paging
- R-523 The first 100 matching cards are rendered. An invisible sentinel element follows the cards; when it comes
  within 400 px of the viewport the next 100 are appended, one batch per approach, until all are shown. There are
  no page buttons; scrolling never changes the URL, the counter or the sort. Any filter change renders again from
  the first 100 of the new result (F1-01..F1-03, F1-W11; F1-R6; U-F1-04). The sentinel stays in the page after the
  last batch (F1-03).
- R-524 A `page=<n>` key in an opened link is kept in the URL but rendering always starts at the first item
  (DIVERGENCE D-011; the original started at item (n−1)×100+1, F1-44, U-F1-02).

### 5.6 URL hash and memory
- R-525 The list state is the URL hash: `key=value` pairs joined by "&", written with history *replace* (no new
  history entries). Keys: `sort`, `sortdir`, `name`, one key per filter, `page`. Values are URI-component encoded
  (space `%20`, comma `%2C`, "á" `%C3%A1`, "<" `%3C`); several tiles are joined with "," in pick order before
  encoding (F1-04, F1-06, F1-08, F1-15, F1-43; F1-R1).
- R-526 On load, the pairs already in the hash are read first (only pieces with exactly one "="), keeping their
  order; then `sort` is appended with the default field if missing, then `sortdir` with the default direction if
  missing. If at least one filter value from the link is valid and applied, the hash is rewritten exactly as after a
  filter change (R-527: `page=1`). `page` is always written last (F1-28, F1-30, F1-31, F1-W12; F1-R1).
  Examples: `#attr.ct1.value=super,sports&attr.ct734.value=hide-standouts` →
  `#attr.ct1.value=super%2Csports&attr.ct734.value=hide-standouts&sort=attr.ct6.frontend_value&sortdir=desc&page=1`
  (F1-30); `#sort=bogus&sortdir=sideways&attr.ct1.value=nonexistent&page=3` →
  `#sort=bogus&sortdir=asc&attr.ct1.value=nonexistent&page=3` (F1-31).
- R-527 A filter change sets `page=1` and writes every filter: a filter with a value is updated in place if its key
  is present, otherwise appended (before `page`); an emptied filter's key is removed (F1-04, F1-13, F1-18, F1-34).
  Example after Hide Standouts then Super: `#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct734.value=hide-standouts&attr.ct1.value=super&page=1` (F1-18).
- R-528 A sort field or direction change updates `sort`/`sortdir` in place and does not add `page` (F1-22, F1-23,
  F1-27, F1-37).
- R-529 Opening a list URL with a hash restores the whole state — ticks, dropdowns, text fields, sort, direction —
  and the result; reload keeps it (F1-28..F1-30, F1-W12).
- R-530 Every hash write is copied to sessionStorage key `jamg-hash:<list path>` (`jamg-hash:/gta-6/vehicles/`,
  `jamg-hash:/gta-6/weapons/`) with the value "#…" — except while the page is being left after a link click
  (F1-01, F1-04, F1-22, F1-28; F1-R7).
- R-531 Only a Back/Forward navigation to the list restores the saved hash (when it differs from the URL's); a
  plain visit to the bare list URL starts from the defaults and overwrites the saved value (F1-32, F1-33; F1-R7;
  U-F1-03 for weapons: same rule).

### 5.7 Cards
- R-532 Vehicle card: one link to the vehicle's canonical path (accessible name = the vehicle name); image
  (placeholder; the first 4 cards' images load eagerly, the rest lazily); a seats number badge; edition badge(s);
  "★ Standout" for vehicles with a standout set; the manufacturer logo when known; then the labelled fields
  "Class" (class labels joined ", "), "Make", "Name" (the card heading), "Based On" (only when a real-life model
  exists and differs from the name); then three stat bars labelled "Speed", "Off-Road", "Road" (shown in capitals):
  Speed shows "<value>/10" (bar = value × 10 %), Off-Road and Road show the raw 0–1000 rating (bar = value ÷ 10 %)
  (F1-38, F1-25; F-F1-17). The card's label sequence reads exactly `Class || Make || Name || SPEED || OFF-ROAD ||
  ROAD` (with `Based On` after `Name` when present).
- R-533 A missing vehicle stat keeps its bar in the "unknown" look (`data-state="unknown"`, empty bar) with "?" as
  its value text (F1-25, F1-26; U-F1-05).
- R-534 Weapon card: one link to the weapon's canonical path; image; "★ Unique Variant" for unique variants; fields
  "Type" (weapon class label), "Make", "Name", "Based On" (when known); a "Damage" bar "<value>/10" **only when the
  damage is known** (no bar otherwise); a price pill "$<amount with thousands separators>" when a price exists
  (F1-W15, F1-W07). Label sequence e.g. `Type || Make || Name || Based On || DAMAGE`.
- R-535 Grid/list switch: two buttons ("Grid view", "List view"; pressed state shown with `aria-pressed`). List
  mode shows one row per item under a header row (vehicles: Make, Name, Class, Real Life Vehicle, Speed, Off-Road,
  Road; weapons: Make, Name, Class, Real Life Weapon, Damage, Price); the header row exists in the page in both
  modes and is visible only in list mode; the choice is not remembered (F1-01 `count:list-head`, F1-39; U-F1-09).

### 5.8 Phone width and errors
- R-536 Phone width (390×844): the filter bar stays inline above the list (no drawer), the class tiles form one
  horizontally scrollable row, all controls work as on desktop (F1-35..F1-37, F1-W14).
- R-537 A filters toggle element exists in the toolbar area but is never displayed at any width (parity with the
  original, whose toggle is hidden everywhere): its text content is "Open Filter Close Filter" and on the vehicles
  list its accessible name is "Open Filters" (F1-35, F1-W14; F-F1-15).
- R-538 An unknown detail URL under a list is the 404 page (F1-40 run 1, F2-09).

### 5.9 Behavior vs data (F1)
- Behavior (must match): `url` hashes, `session:jamg-hash:*`, `value:*` of text fields and mirrors,
  `checked:*` tiles, `visible:*`, placeholders, `maxlength`, `text:sort-shown`, `text:manufacturer-shown`,
  `text:weapon-type-shown`, `list:card-labels`, `count:card-stat-bar`, `count:card-last-damage-bar`,
  `count:list-head`, `count:autopage-sentinel`, `count:manufacturer-results` (= 1 for the no-match row),
  `attr:card-1-link@href` (with fixture items, section 16), `text:filters-toggle`, `attr:filters-toggle@aria-label`.
- Data (relation/format only): `count`, `cards`, `text:list-count*` numbers, `text:class-*` counts,
  `text:standout-*`, `text:card-*-name/-speed/-damage/-class`, card badges counts, `count:manufacturer-options`,
  `list:weapon-type-options`, `list:sort-options` / `list:filter-titles` (normalizer ignores), `calls`,
  `attr:card-1@*`, `attr:card-image@*`, `attr:card-stat-fill@style`, `attr:autopage-sentinel@page-data`,
  `attr:sort-direction@*`, class attributes (TA7).

---

## 6. F2 — Item detail pages

Detail types: vehicle, weapon, animal, character, property, radio station, mission (story, optional, stranger),
plus the minor types gang and activity. Routes: section 0 rows 6–15.

### 6.1 Identity, URL and title
- R-601 Each item has one canonical path (R-008). An unknown slug in any detail route — either path form — is the
  404 page with HTTP 404 (F2-09, F2-10, F6-25; F2-R6).
- R-602 URL normalisation follows R-002..R-004: trailing slash and upper case redirect to the canonical form
  (F2-28, F2-29); `?i=` is removed by redirect and opens nothing (F2-21); other query strings are kept and the
  page is served (F2-22); the legacy path form is served as is (F2-30; F2-R8).
- R-603 The h1 is the display name: vehicles and weapons "<Make label> <name>" (e.g. "Maibatsu Sunset Sanchez",
  "Kozlov KZ-59"); every other type its name (F2-01..F2-08; F2-R1). The document title is "<h1> | GTA 6 <suffix>":

| Type | Suffix | Breadcrumb link label (to the list/guide page) | Evidence |
|---|---|---|---|
| vehicle | "<class noun> Stats, Price, How To Get" (noun of the primary class, table below) | "GTA 6 Vehicle Stats, Price, How To Get" → `/gta-6/vehicles/` | F2-01, F2-31, F2-32 |
| weapon (base) | "Weapon Stats & How To Get" | "GTA 6 Weapon Stats & How To Get" → `/gta-6/weapons/` | F2-03 |
| weapon (unique variant) | whole title "<name>: GTA 6 Unique Weapon Location & How To Get" (no make) | same as weapon | F2-33 |
| animal | "Animals Guide & Locations" | "GTA 6 Animals Guide & Locations" → `/gta-6/animals/` | F2-04 |
| character | "Characters Guide, Bio & Voice Actor" | "GTA 6 Characters Guide, Bio & Voice Actor" → `/gta-6/characters/` | F2-05 |
| property | "Properties & Garages" | "GTA 6 Properties & Garages" → `/gta-6/properties/` | F2-06 |
| radio station | "Radio Station Songs & Tracklist" | "GTA 6 Radio Station Songs & Tracklist" → `/gta-6/radio-stations/` | F2-07 |
| mission (any kind) | "Mission Guide & Walkthrough" | "GTA 6 Mission Guide & Walkthrough" → `/gta-6/missions/` (strangers: `/gta-6/strangers-missions/`, HYPOTHESIS) | F2-08, F5-34 |
| gang | "Gangs & Factions Guide" | "GTA 6 Gangs & Factions Guide" → `/gta-6/gangs/` | F6-06 |
| activity | "Activities Guide" (HYPOTHESIS) | "GTA 6 Activities Guide" → `/gta-6/side-missions/` | — |

  Vehicle class nouns (observed: Motorcycles "Bike", Sports "Sports Car", Helicopters "Helicopter"; the rest
  UNKNOWN on the original — HYPOTHESIS, U-F2-04): Boats "Boat", Commercial "Commercial Vehicle", Compacts "Compact Car", Coupes "Coupe",
  Cycles "Bicycle", Emergency "Emergency Vehicle", Industrial "Industrial Vehicle", Military "Military Vehicle",
  Muscle "Muscle Car", Off-Road "Off-Road Vehicle", Planes "Plane", Sedans "Sedan", Service "Service Vehicle",
  Sports Classic "Sports Classic Car", Super "Super Car", SUVs "SUV", Utility "Utility Vehicle", Vans "Van".

### 6.2 Header and action row
- R-604 Header block: the h1, the breadcrumb link (table above, exactly one), the rebuild's own share actions
  ("Copy link", "Share…" using the browser's native share sheet when available; no third-party widget, DIVERGENCE
  D-006). Vehicles add exactly two header images: the vehicle image (alt "<h1> - GTA 6 Vehicle Stats, Price, How To
  Get") and the manufacturer logo (alt "<Make> Manufacturer"); other types have no header image (F2-01..F2-08
  `count:hero-image` 2 / 0).
- R-605 Action row: the rating block (5 stars + rating line, R-611), the "Add To Favorites" button (section 14) and —
  vehicles and weapons only — the "Compare To" button (F2-01..F2-08, F10-01).

### 6.3 Content sections
- R-606 Section headings (level 2, in this order; "CAPS" = shown in capitals per W3; NAME = the item name without the
  make, MAKE = make label; a section without content is left out except gallery sections, R-609) (F2-01..F2-08,
  F2-32, F2-33):

| Type | Level-2 headings in order |
|---|---|
| vehicle with a standout set | "<NAME>: GTA 6 Info" CAPS · "<MAKE> <NAME> GTA 6 Statistics" CAPS · "<NAME> Description:" CAPS |
| other vehicle | "<NAME>: GTA 6 Info" CAPS · "<NAME>: How To Get" CAPS · "<MAKE> <NAME> GTA 6 Statistics" CAPS · "<NAME> Description:" CAPS · "<NAME>: GTA 6 Screenshots" CAPS · "<NAME> Game Appearances" CAPS |
| weapon (base) | "<NAME> Description:" CAPS · "<NAME>: GTA 6 Info" CAPS · "<NAME>: How To Get" CAPS · "<MAKE> <NAME> GTA 6 Statistics" CAPS · "<Name>: GTA 6 Screenshots" (normal case) · "<NAME> Game Appearances" CAPS |
| weapon (unique variant) | "<NAME>: GTA 6 Info" CAPS · "<NAME>: How To Get" CAPS · "<MAKE> <NAME> GTA 6 Statistics" CAPS · "<Name>: GTA 6 Screenshots" (normal case) |
| animal | "<NAME>: GTA 6 Info" CAPS · "<Name>: Screenshots" (normal case) |
| character | "<NAME>: GTA 6 Info" CAPS · "<NAME>: Screenshots" CAPS · "<NAME>: Artworks" CAPS · "<NAME>: Video" CAPS |
| property | "How to get the <NAME>:" CAPS · "<NAME>: Map Location" CAPS · "<NAME>: GTA 6 Info" CAPS · "<NAME>: How To Get" CAPS |
| radio station | "<NAME>: GTA 6 Info" CAPS · "<Name> Tracklist:" (normal case) |
| mission | "<NAME>: GTA 6 Info" CAPS · "Mission Walkthrough - <NAME>" CAPS · "Mission Objectives" CAPS · "Mission Completed" (normal case, carries the tick box, R-917) |
| gang, activity | "<NAME>: GTA 6 Info" CAPS · "<NAME> Description:" CAPS (HYPOTHESIS) |

  Every other heading inside the content (e.g. "Similar Vehicles", objective titles, box titles) is level 3.
- R-607 Info rows are label/value pairs; a row is omitted when the item has no value. Labels in this order
  (F2-01..F2-08, F2-32, F2-33; observed sequences: standout vehicle "Standout Set, Vehicle Class, Manufacturer,
  Style, Era, Seats, Base Model, Drive Train"; base vehicle "Vehicle Class, Manufacturer, Style, Era, Specialist,
  Seats, Based on (Real Life), Mass / Weight, Drive Train, Gears, Variant / Conversion, Notable Owners"):
  - vehicle: Standout Set · Vehicle Class (link to `/gta-6/vehicles/best-vehicles/?class=<class id>`) ·
    Manufacturer (logo + name) · Style · Era · Specialist · Seats · Based on (Real Life) · Mass / Weight ·
    Base Model (a card of the base vehicle) · Drive Train · Gears · then, under "How To Get": Variant / Conversion
    (cards of the variants) · Notable Owners;
  - weapon: Manufacturer · Weapon Class · Based on (Real Life) · Base Model (card) · Ammo Capacity · Extended Ammo ·
    then under "How To Get": Acquisition Method · How To Unlock · Story Mode Price · Modifications · Variant /
    Conversion (cards);
  - animal: Animal Category · Habitat · Recommended Weapon · Animal Species · Animal Class;
  - character: Role · Gender · Born In Year · Nationality · Location · Occupation · Also Known As · Performer / Actor
    (invented value or "Not yet announced"; never a real person) · Family · Affiliation · Property / Safehouse ·
    Vehicles (cards);
  - property: Property Type · Property Style · Location · State / Region · Vehicles Capacity · then under "How To
    Get": How To Unlock · Story Mode Price;
  - radio station: Music Genre · Radio Host;
  - mission: Mission Number · Mission Type · Chapter · Mission Giver · Protagonist (Playable) · Required for 100% ·
    Featuring · Rewards;
  - gang: Gang Type · Territory (HYPOTHESIS); activity: Activity Type · Location (HYPOTHESIS).
- R-608 Statistics (vehicles, weapons; labels shown in capitals): vehicles "Speed", "Acceleration", "Asphalt
  Handling", "Off-Road Handling", "Strength" — each a value with one decimal on 0–10 and a bar filled to value × 10 %
  — then "Rating" (the off-road rating, whole number, no bar) and the road rating (whole number, no bar, no label).
  Weapons "Damage", "Accuracy", "Handling", "Range" (bars) then "Overall" (one decimal, no bar). So vehicles always
  show 5 bars and 6 labels, weapons 4 bars and 5 labels; a missing value shows "-" with an empty bar (HYPOTHESIS)
  (F2-01..F2-03, F2-31, F2-32; F2-R2).
- R-609 Galleries: vehicles without a standout set, weapons, animals and characters always have their gallery
  section(s); a gallery without images shows "Coming soon." (state token `gallery-empty`); vehicles with a standout
  set, properties, radio stations and missions have no gallery section (F2-01..F2-08 `count:gallery-empty`). A
  gallery is a horizontal thumbnail strip with previous/next scroll buttons; each thumbnail is a button-like link
  whose accessible name is the image alt text; activating it (click, Enter) opens the lightbox (R-610) at that image
  (F2-16, F8-12).
- R-610 The lightbox follows section 12 (R-1205..R-1213): counter "k/N", previous/next arrows and ArrowLeft/
  ArrowRight with wrap-around, Escape and the close button close it, the URL never changes. Its top toolbar has
  exactly five children: the counter, three action buttons ("Download", "Copy link", "Share…", D-024) and the close
  button (accessible name "close") (F2-16..F2-21; F2-R7).
- R-611 Rating (DIVERGENCE D-005): five read-only star icons filled to the stored average and the line of R-410;
  hovering, focusing or clicking the stars does nothing and sends nothing (the original fetched a token on the first
  hover, F2-11, F2-12, F2-R4). The block exists on every detail page and never on the 404 page (F2-09).
- R-612 Base vehicles show, under the statistics, a level-3 heading "Similar Vehicles" with up to 6 cards of vehicles
  of the same primary class and style (UNKNOWN on the original, U-F2-02; HYPOTHESIS); vehicles with a standout set do not (F2-02
  `count:similar-title` = 1).
- R-613 "Game Appearances" shows one card per earlier game label of the item (F2-02, F2-03).
- R-614 Mission pages: after the info rows, an "On this page" jump list (Trophies, Walkthrough, Rewards), the
  walkthrough text, "Mission Objectives" with one level-3 heading per objective, boxes "Trophies & Achievements" and
  "Rewards" (level 3), and the "Mission Completed" heading with its tick box (F2-08; R-917).
- R-615 Property pages start with the "How to get the <NAME>:" text, then the map-location image (own generated
  map crop), then info (F2-06).
- R-616 Radio station pages show the tracklist table ("#", "Track", "Play") and the floating player of section 10
  limited to that station (F2-07; trace F6 §T1).
- R-617 Character pages: screenshots and artworks galleries (two separate lightboxes), then the video section with
  the rebuild's placeholder player (DIVERGENCE D-022) (F2-05).

### 6.4 Compare To
- R-618 "Compare To" is a menu button (`aria-haspopup`, `aria-expanded`): click or Enter opens the menu, Escape or a
  click outside closes it (focus returns to the button), Tab moves through its links (F2-13..F2-15, F2-34; F2-R3).
- R-619 Entries = the other items of the same list that share the primary vehicle class (vehicles) or the weapon
  class (weapons), A→Z by name ignoring case; each entry's text is the item name and its link is the comparison
  page with exactly two parameters `<type>1` and `<type>2` holding this item's compareKey and the other's,
  **sorted by plain string order** (so the current item can be either one):
  `/gta-6/vehicles/comparison/?vehicle1=sunset-sanchez&vehicle2=western-nightblade`,
  `/gta-6/vehicles/comparison/?vehicle1=maibatsu-sanchez&vehicle2=sunset-sanchez` (F2-13, F2-34; F-F2-07).

### 6.5 Neighbours, comments, layout
- R-620 Previous/next: one link to the previous and one to the next item of the same list in catalogue order
  (R-1606), relation `prev`/`next`, text = the neighbour's name. The block is inserted only when the end of the
  article area (the comments placeholder) comes within 200 px of the viewport; before that the page contains no
  pager link (F2-23, F2-24; F2-R5). The first item has no previous link, the last no next link (UNKNOWN on the original, U-F2-03; HYPOTHESIS).
  Following "next" opens that item (F2-25).
- R-621 Comments: the original's comment area is replaced by a placeholder section (level-3 heading "Comments",
  own sentence "Comments are coming later.") placed after the article and before the footer (DIVERGENCE D-004;
  F2-26 observed the original's read-only structure).
- R-622 Detail pages have no tabs and no accordions (F2-01..F2-08 `count:tabs` = 0).
- R-623 Phone width (390×844): the same blocks stacked in one column; breadcrumb, rating, "Add To Favorites",
  "Compare To" and the first stat bar stay visible; the standout vehicle still has exactly three level-2 headings
  (F2-27).

### 6.6 Behavior vs data (F2)
- Behavior: `url`, `text:breadcrumb` + href, `count:hero-image`, `list:section-titles` (patterns, with fixture
  names), `list:info-labels`, `list:stat-labels`, `count:stat-bars`, `count:rating-stars`, `count:favorites-button`,
  `count:compare-to`, `count:tabs`, `count:gallery-empty`, `text:favorites-button`, `text:compare-to`,
  `count:similar-title`, `list:not-found-sub`, `count:rating-block`, `count:breadcrumb`, `visible:*`,
  `attr:compare-to@aria-expanded`, `attr:compare-to-item-nightblade@href`, `attr:compare-to-item-sanchez@href`,
  lightbox counter format and wrap, `count:lightbox-*`, `count:pager-*` before/after scrolling.
- Data: `heading`/`title` names, `list:stat-values`, `attr:stat-bar-N@style` (only value × 10 holds),
  `text:rating-total`, `list:compare-to-items`, `count:compare-to-items`, `attr:compare-to-item-1@href`,
  `attr:compare-to-item-last@href`, `text:compare-to-item-last`, `list:variants`, `count:variants`,
  `list:appearances`, `count:gallery-thumbs`, N of the lightbox counter, `attr:pager-*@href`, `text:pager-*`,
  `calls`/`blocked` of F2-11 (no request in the rebuild).

---

## 7. F3 — Comparison and rankings

### 7.1 Compare toggles and bar (on both list pages)
- R-701 Every rendered card of the vehicles and weapons lists has a small round toggle over its photo (bottom
  right): role checkbox, accessible name "Compare <item name>", tooltip "Compare", focusable (tab order position
  0 = natural order), `aria-checked` true/false. Click, Space and Enter toggle it; it never follows the card link.
  The toggle sits inside the card but **outside** the card's link element (accessibility fix, DIVERGENCE D-010; the
  original nests it inside the link) (F3-01, F3-02, F3-09, F3-10; F3-R1).
- R-702 At most 4 picks per list. With 4 picked, every other shown toggle gets `aria-disabled="true"` (dimmed,
  not-allowed cursor) and ignores click, Space and Enter; unpicking one re-enables them (F3-05..F3-07; F3-R2).
- R-703 Picks live in sessionStorage under `gtabCompare:<list path>` (`gtabCompare:/gta-6/vehicles/`,
  `gtabCompare:/gta-6/weapons/`, independent) as a JSON array of `{"id": <compareKey>, "name": <item name>}` in pick
  order, e.g. `[{"id":"38","name":".38"},{"id":"heavy-pistol","name":"1922"}]`. Nothing is stored before the first
  change; toggling an unpicked item appends it, toggling a picked item removes it, a 5th toggle with 4 picked changes
  nothing, "Clear" stores `[]` (F3-01..F3-08, F3-14; F3-R2). Unreadable stored JSON counts as no picks.
- R-704 Picks survive reload, filtering and sorting (cards rendered later are marked from storage), opening an item
  and coming Back, and visiting the other list; they end with the browser tab session (F3-11..F3-14, F3-17).
- R-705 The compare bar is fixed at the top centre of the viewport. With 0 picks it carries the `hidden` attribute
  (empty value) and is faded out — fully transparent, not clickable, still laid out; with 1+ picks the attribute is
  removed and it is shown. Content: the count "<n>/4", the picked names joined by " · " (hidden below 768 px
  width), the action link, and a round button with accessible name "Clear the comparison" and tooltip "Clear"
  (F3-01..F3-08, F3-16; F3-R1).
- R-706 The action link reads "Pick 1 more" (shown in capitals) with href "#", `aria-disabled="true"`, greyed and
  inert while fewer than 2 are picked; with 2–4 picks it reads "Compare (<n>)" (shown in capitals) and links to the
  comparison page (F3-01..F3-05; F3-R1).
- R-707 Comparison link: `<list path>comparison/?<type>1=<key>&<type>2=<key>[&<type>3=…&<type>4=…]` where type is
  `vehicle` or `weapon`, the keys are the picked compareKeys sorted by plain string (character code) order — not
  pick order — numbered from 1. Example: picks thrax, seaspray, honeycomb, black-widow →
  `/gta-6/vehicles/comparison/?vehicle1=andrew-nodes-thrax&vehicle2=black-widow-emerus&vehicle3=honeycomb-emerus&vehicle4=seaspray-emerus`;
  numeric-looking keys sort as text ("38" < "heavy-pistol") (F3-03, F3-05, F3-07, F3-14; F-F3-01, F-F3-02). The
  detail pages' "Compare To" links use the same form (R-619).

### 7.2 Comparison page
- R-708 Empty state (`/gta-6/vehicles/comparison/`, `/gta-6/weapons/comparison/` without valid keys): breadcrumb link
  "GTA 6 Vehicles Database & Statistics" → `/gta-6/vehicles/` ("GTA 6 Weapons Database & Statistics" →
  `/gta-6/weapons/`), h1 and title "GTA 6 Vehicle Comparison" / "GTA 6 Weapon Comparison", an own intro sentence, the
  share actions, a board of five "Add a vehicle" ("Add a weapon") slots — one in the header column, shown in normal
  case, and four item columns, shown in capitals — each with a search box, the note "Add at least two GTA 6 vehicles
  to see the comparison." ("… weapons …"), and related links: vehicles "All GTA 6 vehicles" (`/gta-6/vehicles/`) ·
  "Weapon comparison" (`/gta-6/weapons/comparison/`) · "All GTA 6 weapons" (`/gta-6/weapons/`) · "Best vehicles in
  GTA 6" (`/gta-6/vehicles/best-vehicles/`) · "Fastest cars in GTA 6" · "Fastest bikes in GTA 6" (the two fastest
  articles of section 16); weapons "All GTA 6 weapons" · "Vehicle comparison" · "All GTA 6 vehicles" (F3-18, F3-19).
- R-709 Picker: each slot's search box is a combobox (placeholder "Search...", `aria-autocomplete="list"`,
  `aria-expanded`). Focus or click opens a listbox of every item of the list A→Z by name, the first highlighted
  (F3-20; F3-R3).
- R-710 Matching: query and names are lower-cased and stripped of accents; the query is split on spaces and every
  word must occur somewhere in the name (any order, substring). Items already in the comparison are not offered.
  At most 150 option rows; when more match a last non-option row reads "<rest> more: keep typing"; when none match
  a single row reads "No match" (F3-20..F3-23, F3-25b; F3-R3).
- R-711 Keys: ArrowDown opens the list or moves the highlight down, ArrowUp moves it up, both wrapping around;
  Enter picks the highlighted item; Escape closes the list and restores the box to its text before opening (empty
  on a fresh slot); leaving the box closes the list shortly after (~150 ms) so a pointer press on an option still
  picks it (F3-24, F3-25; F3-R3).
- R-712 Picking navigates to `<slot url>?<slot param>=<key>` (`&` instead of `?` when the slot url already has a
  query) and shows a "Loading…" state on the board while leaving. On the empty page every slot's url is the
  comparison path and its param `<type>1`; on a filled page every empty slot's url is the current canonical
  comparison URL and its param `<type><count+1>` (F3-26; trace F3 §T1).
- R-713 Query handling (UNKNOWN on the original, U-F3-02; HYPOTHESIS): the page collects the values of `<type>1`, `<type>2`, … in parameter
  order, drops unknown keys and duplicates, keeps the first 4, sorts them by plain string order and renumbers; when
  the result differs from the request it permanently redirects to that canonical URL (other parameters dropped from
  the canonical form). With 0 valid keys the empty state shows; with 1 the board shows that item and the note.
- R-714 Filled board (2–4 items; UNKNOWN on the original, U-F3-01; own design, DIVERGENCE D-008): one column per item in canonical order —
  image, make badge + name linking to the item, a remove link "×" (accessible name "Remove <name> from the
  comparison") whose href is the same comparison URL without that key, renumbered — plus "Add a vehicle" slots up to
  four columns. Rows: the detail page's info labels that are values (vehicles: Vehicle Class, Manufacturer, Style,
  Era, Seats, Based on (Real Life), Drive Train; weapons: Weapon Class, Manufacturer, Based on (Real Life), Ammo
  Capacity, Story Mode Price) and the statistics in detail-page order with bars; in each numeric statistic row the
  highest value is marked "best" (all tied values); a missing value shows "-". The note is shown only with fewer than
  2 items.
- R-715 No bot challenge or interstitial exists: any comparison URL renders the page (DIVERGENCE D-007; the
  original answered every query URL with a challenge, F3-15, F3-26..F3-29, F-F3-04).

### 7.3 Rankings
- R-716 Ranking pages exist for the 21 vehicle classes. Page slug = class label lower-cased with spaces as "-",
  plus "-cars" for Muscle, Sports, Sports Classic, Super and "-vehicles" for Commercial, Emergency, Industrial,
  Military, Off-Road, Service, Utility; class plural label = the label plus " Cars" / " Vehicles" for those groups,
  the label otherwise (F3-R5). Full list A→Z: Boats `best-boats`, Commercial `best-commercial-vehicles`, Compacts
  `best-compacts`, Coupes `best-coupes`, Cycles `best-cycles`, Emergency `best-emergency-vehicles`, Helicopters
  `best-helicopters`, Industrial `best-industrial-vehicles`, Military `best-military-vehicles`, Motorcycles
  `best-motorcycles`, Muscle `best-muscle-cars`, Off-Road `best-off-road-vehicles`, Planes `best-planes`, Sedans
  `best-sedans`, Service `best-service-vehicles`, Sports `best-sports-cars`, Sports Classic
  `best-sports-classic-cars`, Super `best-super-cars`, SUVs `best-suvs`, Utility `best-utility-vehicles`, Vans
  `best-vans` (F3-44).
- R-717 Page: breadcrumb link "GTA 6 Cars & Vehicles Database" → `/gta-6/vehicles/`; h1 and title "GTA 6 Best
  <Class plural> List: Stats Ranking"; the "Select Class" menu button; header image; share actions; own intro;
  list title "Full List of Best <Class plural> in GTA 6:" (level 2); one row per vehicle of the class (F3-30..F3-38;
  F3-R4).
- R-718 Row: thumbnail image, a make badge and the vehicle name as a link to its canonical path, "Based on:
  <real-life model>" only when known, then "Road Rating: <n> · Off-Road Rating: <n>" with "-" for a missing rating.
  The row's label sequence is "Based on:" (optional) · "Road Rating:" · "Off-Road Rating:" (F3-30, F3-32, F3-43).
- R-719 Order: road rating highest first; rows without a road rating after all rated rows; ties and unrated rows in
  catalogue order (F3-32, F3-35..F3-37; F3-R4; tie order UNKNOWN on the original, U-F3-03).
- R-720 "Select Class" is a menu button (`aria-expanded`): click or Enter opens a menu of 21 plain links A→Z by label,
  each with tooltip "The Best & Fastest <Class plural> in GTA 6" (observed "The Best & Fastest Boats in GTA 6") and
  href of R-716. Keyboard: Enter on the button opens the menu without moving focus; Tab then moves into the links
  (first = Boats); Enter follows a link; arrow keys do not move inside the menu; Escape closes it (F3-31, F3-33,
  F3-44, F3-47..F3-51; F-F3-09).
- R-721 `/gta-6/vehicles/best-vehicles/` is the default ranking: the Super class with matching heading and rows
  (DIVERGENCE D-014; the original showed the Super heading over the Sports rows, F3-30, F-F3-07, U-F3-04).
- R-722 `/gta-6/vehicles/best-vehicles/?class=<class id>` permanently redirects to that class's ranking page
  (F3-39, F3-45); an unknown `?class` value is the 404 page (DIVERGENCE D-013; the original rendered an empty shell,
  F3-40, F3-46, F3-52, U-F3-05); an unknown `best-*` path is the 404 page (F3-41).
- R-723 Detail pages link their "Vehicle Class" value to `best-vehicles/?class=<class id>` (R-607).
- R-724 Phone width: the class button, the rows and their images stay visible (F3-42).

### 7.4 Behavior vs data (F3)
- Behavior: toggle role/name pattern/tabindex/title/`aria-checked`/`aria-disabled`, `text:compare-count`,
  `text:compare-go`, `attr:compare-go@href` structure (numbering, sorting), `attr:compare-bar@hidden`,
  `visible:compare-*`, `count:compare-toggle-checked`, `count:compare-toggle-disabled`, `session:gtabCompare:*`
  shape and order, picker attributes, `text:cmp-more` format, "No match", `count:cmp-add`, `list:cmp-add-title`,
  `text:cmp-crumb`, `text:cmp-note`, `list:cmp-links`, ranking `text:rank-class-select`, menu visibility and
  expansion, `list:rank-class-items`, `attr:rank-class-item-N@href`, item-1 title, `text:rank-crumb`,
  `list:rank-list-title`, `list:rank-row-1-labels` (given the fixture item), `count:rank-row-1-badge`,
  `text:rank-class-focused`.
- Data: item names/aliases inside storage and links (fixture items make them match), `count:card`,
  `count:compare-toggle`, `count:cmp-source`, `count:cmp-options`, the k of "<k> more", `list:cmp-options`,
  `text:cmp-option-1`, `text:cmp-option-active`, `list:rank-ratings` values (order relation is behavior),
  `count:rank-rows`, `count:rank-images`, `attr:rank-row-1-link@href`; challenge readouts (not comparable).

---

## 8. F4 — Interactive map (`/gta-6/map/`)

Map units: x grows to the east, y to the north; stored views use `lat` = y and `lng` = x (F4-R7). The map artwork
is the rebuild's own invented island (section 20); categories and groups are the configuration of section 16.4.

### 8.1 Page structure
- R-801 The page shows a sidebar beside a pannable, zoomable map. Sidebar, top to bottom: the h1 ("GTA 6
  Interactive Map", shown in capitals), the guest line (R-802), the search box with its clear button (R-823),
  the group rail (R-810), the buttons "Hide all" and "Hide found" (shown in capitals), the grouped category rows,
  "Reset progress", and the action buttons "+ Suggest location", "+ Personal marker", "Map Contest", "Feedback"
  (shown in capitals), plus "About this map". The map area has zoom buttons "Zoom in" / "Zoom out", the "Full
  screen" button, region labels (5, own names), the notice box (R-834) and the markers (F4-01; trace F4 §T1).
- R-802 Guest line (own wording, D-017): one sentence saying progress is saved in this browser, with a link "Log in"
  whose href is `/login` (F4-01).
- R-803 All markers are drawn on one drawing surface (a single canvas) covering the whole map area — including
  the part under an open sidebar — in their category's icon/colour; markers have no page elements of their own.
  A click on the surface opens the popup of the marker under the pointer (hit radius ≈ 12 px). Keyboard users reach
  markers through the search box and the popup's previous/next buttons (F4-60, F-F4-01).
- R-804 Below zoom 2 markers are grouped into clusters (circle with a count, cluster radius 40 px); clicking a
  cluster zooms in on it; from zoom 2 on every marker is drawn individually (F-014; static).
- R-805 Zoom range 0–8 (bounds UNKNOWN on the original; HYPOTHESIS; F4-R7 clamps to them); "close zoom" (used by "Zoom in" in the
  popup) is 5; first visit opens centred on the start marker `safehouse-001` at zoom 2 (R-826).
- R-806 Below the map, a static list of the 10 groups (level-2 headings) with one link per category
  "<category name> — <n> Locations" to its `?feature=` page; it also serves visitors without scripts. A
  no-script message "The interactive map needs JavaScript." is shown when scripts are off (trace F4 §T1).
- R-807 The page sends no request after loading — not on tick, untick, filter, search, navigation, reset, star or
  any member action (F4-01, F4-20, F4-21, F4-49; DIVERGENCE D-018/D-019 for the actions that call the original's
  server).

### 8.2 Sidebar groups and rows
- R-808 Groups in configured order (Personal, Robberies, Activities, Collectibles, Collectible Cards, Vehicles,
  Weapons, Style, Food & Drink, Local Places; group names shown in capitals); inside a group, rows sorted by name with
  names starting "Other" last; only categories with markers get a row (102 rows in 10 groups); all groups start
  expanded (F4-01, F4-02; F-F4-08).
- R-809 Row: a switch checkbox (accessible name = category name), the category icon (clicking it toggles the
  switch), the name, the counter, an "Only" button and an arrow button. The name is a real link to
  `/gta-6/map/?feature=<key>` (R-812): a plain click toggles the row instead of navigating; a click with
  Ctrl/Cmd/Shift or the middle button follows the link. "Only" and the arrow are displayed while the row is hovered
  or contains focus (F4-02, F4-11, F4-15).
- R-810 Group rail: a navigation region named "Groups" with one button per group (accessible name and tooltip =
  group name); clicking scrolls the sidebar list to that group and marks that button as the current one
  (`data-state` "on"); a group whose categories are all off shows the "off" look (`data-state` "off") (F4-02,
  F4-03, F4-07, F4-72).
- R-811 Counters follow R-411 and F4-R3: trackable row "found <f> / <n>" (reads "f/n"; tooltip "Found so far, out
  of all markers of this category"; hidden from screen readers, which read a separate "found <f> of <n>");
  non-trackable row "<n>" with tooltip "Markers in this category" and no screen-reader text; while a category is
  switched off its counter text is empty. Multi-spawn categories count distinct names (F4-02, F4-05, F4-21, F4-24).
- R-812 Link key of a category = its slug when it has one, otherwise its id (`?feature=bank`, `?feature=garages`,
  `?feature=safehouses`, `?feature=hidden-packages`) (F4-02, F4-20; F4-R4).
- R-813 The four hidden-by-default categories (Bus Stops, Electric Chargers, Gas Stations, ATMs — the non-trackable
  ones) start switched off; on first visit 98 of 102 rows are on (F4-01, F4-02; F-F4-09).
- R-814 "Hide all"/"Show all": the button reads "Show all" when no category is on, "Hide all" when every category is
  on, otherwise keeps its previous word (the page starts with "Hide all"); after "Only" it reads "Show all".
  Activating it applies its word to every category including the hidden-by-default ones (F4-01, F4-03..F4-05,
  F4-11; F4-R3).
- R-815 Group box (checkbox in the group header, accessible name = group name): ticked when all of the group's
  categories are on, unticked with the mixed state when only some are, unticked when none; toggling it switches the
  whole group (F4-03, F4-05, F4-07, F4-08).
- R-816 Fold button per group: accessible name and tooltip "Hide <group>" with `aria-expanded="true"` while open,
  "Show <group>" with `aria-expanded="false"` while folded; folding hides the group's rows (F4-02, F4-09, F4-10).
- R-817 "Only" (accessible name "Show only this category: <name>", text "Only") switches every other category off;
  while that category is the only one on, the same button reads "All" with accessible name "Show all categories
  again: <name>" and switches every category on again. The arrow button (accessible name "Show only this category:
  <name>") does the same as "Only" and then moves the map to that category's marker nearest to the current centre
  at zoom ≥ 4 without opening a popup (HYPOTHESIS for "no popup") (F4-11..F4-13; F4-R3).
- R-818 While exactly the category chosen by "Only"/arrow is the only one on, the address is
  `/gta-6/map/?feature=<key>` (history replace, no reload); any change that makes the visible set different
  removes the query again (replace) (F4-11..F4-14; F4-R4; F-F4-06).

### 8.3 One-category pages
- R-819 `/gta-6/map/?feature=<key>` with a valid link key opens a one-category page: own document title "All GTA 6
  <Singular> Locations (<count>) | Interactive Map", heading "GTA 6 <Singular> Locations Map", only that category
  on, its markers drawn with their numbers, the whole island fitted in view, the map root marked with the category
  id (`data-state` "category:<id>"), and nothing written to storage (F4-16, F4-18; F4-R4; F-F4-07). A key that is
  not a link key — the id of a category that has a slug (`hidden-package`) or an unknown word — gives the normal map
  (first pass of F4-17, F4-19).

### 8.4 Filter memory
- R-820 After any filter change the map writes localStorage `gtab-map-filter` =
  `{"hidden":[ids of switched-off categories in category-config order], "folded":[folded group ids] (only once the
  visitor has folded or unfolded a group), "sidebar":"open"|"closed" (only once the sidebar was toggled on a wide
  screen), "hideFound":true (only while Hide found is on), "dv":1}` with the keys in exactly that order. When the
  record would equal the defaults (hidden = exactly the four hidden-by-default categories, no folded, no sidebar, no
  hideFound) the key is removed instead. Only categories with markers are ever listed. One-category pages and
  narrow screens never write the sidebar state; one-category pages write nothing (F4-01, F4-03..F4-16, F4-25,
  F4-26, F4-28, F4-57, F4-63..F4-69; F4-R1). Examples: Banks off →
  `{"hidden":["bank","bus-stop","ev-charger","gas-station","atm"],"dv":1}`; Hide all then Show all →
  `{"hidden":[],"dv":1}`; Robberies folded → `{"hidden":["bus-stop","ev-charger","gas-station","atm"],"folded":["robberies"],"dv":1}`.
- R-821 The record is restored on reload and on later visits (F4-06, F4-10, F4-27, F4-68). Unreadable JSON counts as
  defaults.

### 8.5 Opening markers and the popup
- R-822 A marker opens (its popup shows) by a click on it (R-803), by choosing a search hit (R-823), by the popup's
  previous/next buttons, or by an address hash `#<marker id>` on load or on a later hash change. An unknown id opens
  nothing. Opening a marker of a switched-off category switches that category on and saves (R-820). The address
  never changes when markers open, when stepping, panning or zooming (F4-20, F4-25, F4-51..F4-55, F4-57, F4-58,
  F4-60; F4-R8). A `#<id>` link (or `#spot=`) wins over the saved view (F4-R7).
- R-823 Popup content in order: optional screenshot (click or Enter opens the lightbox of section 12 with that one
  image), the title (marker name, shown in capitals), the category line — a link with the category name to its
  `?feature=` page — the description and its "Label: value" rows, the "Found" box (trackable categories only), the
  action row with the "View details" link (only when the marker has a details path; opens in a new tab), the
  buttons star / "Zoom in" / "Copy link", and the navigation "Previous" / "n / N" / "Next". A close control "×"
  (accessible name "Close popup") closes it. No credits line and no "NEW" badge (DIVERGENCE D-017: the original
  shows contributor names) (F4-20, F4-25; F-F4-12).
- R-824 Popup buttons (exactly five buttons): star (accessible name and tooltip "Add to favourites", `aria-pressed`
  false; see R-1406), "Zoom in" (centres the marker at zoom 5), "Copy link", "Previous in <Category>: <marker name>
  (#<k>)", "Next in <Category>: <marker name> (#<k>)" (k = the target's number). The "Found" box is a checkbox whose
  label reads "Found" (shown in capitals) (F4-20).
- R-825 Collecting order (per category): start with the southernmost marker; then repeatedly take, among the
  remaining markers that lie no more than 2000 map units north of the southernmost remaining one, the one nearest to
  the previously taken marker (ties: smaller id). Numbers 1..N follow that order; in multi-spawn categories
  same-name markers share one number and N counts distinct names. The popup shows "<n> / <N>" with tooltip "Number
  <n> in a collecting order from south to north" (trackable) or "Number <n> of this category, in the order of the
  list from south to north" (non-trackable). Previous/Next step through the category's markers in that order and
  wrap (previous of the first = the last) (F4-20, F4-24, F4-51..F4-54; F4-R8).
- R-826 "Copy link" copies `<page address without query>#<marker id>` to the clipboard and its text shows "Copied!"
  for 1.5 s; when the clipboard is unavailable a prompt shows the link for manual copying (F4-50).
- R-827 Shared spot `#spot=<x>,<y>` (map units, may be negative) opens a pin popup at that point titled "Shared
  spot" (shown in capitals) with the text "Somebody shared this place on the map with you." and one pill button
  "Suggest this location" (shown in capitals) that opens the accounts-later panel of R-836 (F4-56).

### 8.6 Found tracking (guest)
- R-828 Ticking "Found" stores the marker id in localStorage `guest_checklists` under list `gta6-map`
  (`{"gta6-map":["safehouse-001"]}`; other lists in the same object are kept), updates the counter at once, draws the
  marker semi-transparent and sends nothing. Unticking removes the id; when the `gta6-map` list becomes empty it is
  deleted, and when the whole object becomes empty the **key itself is removed** (the map never writes `{}`)
  (F4-21..F4-23; F4-R2; F-F4-02).
- R-829 In a multi-spawn category, markers with the same name (case and repeated spaces ignored) are one
  collectible: ticking one ticks all of them — stored as the clicked id first, then the others in list order — and
  the counter counts the name once (F4-24: ticking `card-liberty-city-wrath-001` stores
  `["card-liberty-city-wrath-001","card-liberty-city-wrath-013"]`, counter "1/9"; F-F4-03).
- R-830 Ticks persist across reloads and visits; visiting the map never changes checklist entries of other lists
  (F4-22, F5-37).
- R-831 "Hide found" takes found markers off the map (counters unchanged) and becomes "Show found" with tooltip "Put
  the markers you found back on the map"; "Show found" (tooltip of the other state "Take the markers you found off
  the map (the counts stay)") restores them; the state is remembered in `gtab-map-filter` (`hideFound`). An open
  popup's marker stays drawn while it is open (F4-26..F4-28; F4-R3).
- R-832 "Reset progress" opens an in-page dialog (role dialog, accessible name "Reset progress", heading "Reset
  progress" shown in capitals). With no found marker: text "Nothing to reset: no marker is ticked as found yet." and
  a single button "Close". Otherwise: a choice labelled "Untick the found markers of" with options "All categories
  (<n> found)" (value empty) then one per trackable category with found markers in category order, "<Category> (<k>
  found)" (value = category id); the text "This unticks the <n marker(s)> you found, in every category. There is no
  undo." or "This unticks the <k marker(s)> you found in <Category>. There is no undo." following the choice; buttons
  "Reset" and "Cancel" (shown in capitals). Escape or Cancel closes without change (F4-29..F4-32, F4-34; F4-R5).
- R-833 Reset is local and succeeds (DIVERGENCE D-019; the original first asks its server and failed in the
  read-only run, F4-33): the chosen ids are removed from the `gta6-map` list of `guest_checklists` as in R-828, counters and markers update,
  the choice and the Reset button disappear, the other button becomes "Close" and the text reads "Done: <n
  marker(s)> unticked." (F4-R5 success text).

### 8.7 Search
- R-834 The search box is a combobox with accessible name "Search locations or categories" controlling a listbox of
  hits (`aria-controls` = the listbox's id, `aria-expanded` true while hits are listed, `aria-activedescendant` = the
  active hit's id); a button "Clear the search" empties it (F4-35, F4-37, F4-44).
- R-835 Normalisation of query and texts: lower case, accents removed, "&" read as " and ", apostrophes dropped,
  every other run of non-letters/digits → one space, trimmed. An empty normalised query (e.g. only spaces) lists
  nothing, shows no message and restores all category rows (F4-42; F4-R6).
- R-836 Marker matching, best first: score 4 — the name contains the query (or the query without spaces is in the
  name without spaces); 3 — "<category name> <number>" contains it; 2 — every query word is in the name/category
  text or within a small typo distance of one of its words (words of 4–7 letters: 1 edit, 8 or more: 2 edits; a
  swap of two adjacent letters counts as one edit; a longer word may also match by its prefix); 1 — every query
  word is in the description. Order: score, then category order, then number. At most 30 options are listed; each
  option shows the marker name and the line "<Category> #<n>" (F4-35, F4-40, F4-43, F4-45; F4-R6).
- R-837 Messages under the box: no hit → 'No marker matches "<query as typed, trimmed>".'; more than 30 → '<rest>
  more, type a bit more of the name.'; the query is shown as text, never as markup (F4-39, F4-41, F4-43).
- R-838 The same query filters the category rows: a row stays when its category name or its group name matches
  (contains, or typo tolerance 1 edit from 5 letters, 2 from 8); groups without remaining rows are hidden; with no
  row left the sidebar shows 'No category matches "<query>".' (F4-35, F4-39, F4-40, F4-43).
- R-839 Keys in the box: ArrowDown/ArrowUp move the active option with wrap-around (none is active before the first
  arrow press); Enter opens the active hit, or the first hit when none is active, then clears the box and closes
  the list; Escape clears the box, or leaves the box when it is already empty. A click on an option opens it. On a
  narrow screen opening a hit also closes the sidebar (F4-36..F4-38, F4-61, F4-66).

### 8.8 View memory and layout
- R-840 After the visitor has touched the map area itself (pointer down, touch, wheel, a key inside the map,
  including the zoom buttons), every finished move or zoom writes localStorage `gtab-map-view` =
  `{"lat":<centre y rounded to 0.1>,"lng":<centre x rounded to 0.1>,"z":<zoom>,"t":<epoch ms>}`. Moves made by the
  page itself before such a touch (first fit, "Only"/arrow jumps) and anything on a one-category page are not saved.
  A saved view younger than 60 days whose centre lies inside the map bounds is restored on the next visit (zoom
  clamped to 0–8); otherwise the start view applies. The address never reflects the view (F4-01, F4-13, F4-16,
  F4-58, F4-59; F4-R7). With the fixture, zooming in once from the start view writes lat -5532, lng -2352, z 3.
- R-841 Narrow layout = map area narrower than 700 px (e.g. 390×844): the sidebar starts closed (`aria-hidden`
  true) and a "Filters" button (shown in capitals, tooltip "Search and filter", `aria-expanded`) opens it; Escape
  closes it; choosing a search hit closes it; the open/closed state is not remembered. Wide layout: the sidebar starts
  open; the button "Hide the sidebar" closes it and the "Filters" button (visible only while closed) reopens it; the
  state is remembered (R-820) (F4-63..F4-69).
- R-842 Escape closes, in this order of priority: the About dialog, the Reset dialog, an open side panel, the open
  popup (focus returns to where it was), the narrow-screen sidebar, full-screen mode (F4-30, F4-62, F4-65, F4-71).

### 8.9 Other controls
- R-843 Member actions ("+ Suggest location", "+ Personal marker", "Map Contest", the shared-spot pill) open a side
  panel: role dialog whose accessible name is the panel title ("Suggest a location", "Personal marker", "Map
  Contest"), a level-3 heading with the title (shown in capitals), a close button "×" (accessible name "Close"), an
  own paragraph saying the feature needs an account and accounts are coming later, and two links: "Log in" (opens
  the accounts-later dialog, closing the panel) and "Join" (`/membership/free/`, new tab). No request is sent
  (DIVERGENCE D-018; the original asked its server first, F4-46..F4-48, F10-26; F-F4-11).
- R-844 "Feedback" opens a side panel titled "Feedback" with an own sentence (no request, no external link)
  (DIVERGENCE D-012; the original links to its contact page).
- R-845 "About this map" (accessible name "About this map") opens a dialog with that accessible name: own help text
  (how to filter, search, tick, share), keyboard tips and the credits of the rebuild's own artwork and sample data;
  Escape or its close button closes it; no request (F4-70, F4-71).
- R-846 Notice box: while the date is inside the configured notice window (section 16) and the notice has not been
  closed, a notice box with an own heading and text and a "Close" button is shown over the map; closing removes it
  and stores localStorage `gtab-contest-closed` = "<start>|<end>|on" so it stays closed for that window (F4-73,
  F4-74; DIVERGENCE D-020: own notice instead of the original's contest).
- R-847 "Full screen" (accessible name and tooltip) switches the map to cover the whole viewport (using the
  browser's full-screen mode when allowed) and becomes "Exit full screen"; activating it again or Escape leaves
  (F4-75).
- R-848 `/gta-6/map/<anything>` is the 404 page (UNKNOWN: F4-76 was an origin error; HYPOTHESIS, U-F4).

### 8.10 Behavior vs data (F4)
- Behavior: `url` (query and hash), every `local:*` shape and key order (with the fixture ids), group/row/rail
  counts, `count:category-checked`, button words and tooltips, row/fold/only/next names, `checked:*`, counter
  titles, `attr:*@aria-hidden`, `attr:*@aria-expanded`, popup counts and names, prev/next labels (with fixture
  names), found label, reset texts and options, search counts that follow the rules on fixture data, messages,
  panel roles/names, sidebar states, About/full-screen names.
- Data: totals inside counters, `text:popup-category-link` of searched/clicked markers, `count:search-hits`,
  `text:search-empty` overflow number, `count:category-rows-visible` for queries, one-category page title count,
  `count:county-labels`, `attr:tile-first@src`, `t` of `gtab-map-view`, contest texts and dates. Implementation
  ids (`aria-controls`/`aria-activedescendant` values, the original's map element attributes and class lists) are
  compared only as relations (the attribute points at the listbox / at the second option) (TA7).

---

## 9. F5 — Checklists and mission lists

Pages: the 100% checklist article (`/articles/gta-6/gta-6-100-completion-guide-interactive-checklist`),
`/gta-6/missions/`, `/gta-6/strangers-missions/`, `/gta-6/side-missions/`, `/gta-6/random-events/`, and every
mission walkthrough page.

### 9.1 Tick boxes and storage
- R-901 Every tick box belongs to a named list and has an item id unique within that list: list `gta6-100` (the 100%
  page, 38 requirements) and list `gta6-missions` (missions page, strangers page, walkthrough pages; item id = the
  mission's checklistId) (F5-01, F5-22; F-F5-03).
- R-902 Until saved progress has been applied, the boxes are disabled; right after, all are enabled — also for guests
  (no box stays disabled after load) (F5-01, F5-15, F5-19, F5-22).
- R-903 Click or Space on a focused box toggles it; Enter does nothing (no toggle, no navigation). A box inside a
  contents link or a mission card never follows the link; a click elsewhere on a mission card opens its walkthrough
  page (F5-02, F5-03, F5-17, F5-18, F5-23, F5-31, F5-32, F5-35; F-F5-08).
- R-904 The same item can appear several times on a page (on the 100% page every requirement appears in the contents
  box and again in its section heading); all copies always show the same state (F5-02, F5-03, F5-05, F5-08).
- R-905 Parent requirements: ticking a parent ticks all its sub-items that are not ticked yet (recursively);
  unticking it unticks them all; after any change each parent is re-evaluated: ticked when every sub-item is ticked
  (sub-items that share a group key need only one ticked member), unticked otherwise; a parent that changes
  re-evaluates its own parent. A partly done parent stays unticked but its done sub-items count toward the
  percentage (F5-05..F5-11; F5-R2).
- R-906 Guest storage: localStorage `guest_checklists` = `{"<list id>": ["<item id>", …]}` shared by every checklist
  and the map. Every item whose state changed is appended (once) when ticked or removed when unticked, in this order:
  the clicked item, then the sub-items that changed (page order), then the parents that changed. A list that becomes
  empty is removed from the object; the object itself is always written back, so after the last untick the value is
  `{}` (unlike the map, R-828) (F5-02, F5-04, F5-07, F5-08, F5-10, F5-26; F5-R2; F-F5-02). Example: ticking parent
  `exploration` stores `["exploration","kenton","cards",…the other 18 children…]` (F5-08).
- R-907 Nothing is sent to any server for checklists (F5-01, F5-02, F5-15, F5-19, F5-22, F5-23; F-F5-01).
- R-908 Saved progress returns on reload, on later visits, after Back, and on every page that uses the same list: a
  strangers-page optional mission ticked there is ticked on the missions page; a mission ticked on its list card is
  ticked on its walkthrough page and vice versa (F5-15, F5-16, F5-25, F5-35, F5-36, F5-38).
- R-909 Unreadable stored JSON is treated as `{}` (it is overwritten on the next change) (U-F5-3).
- R-910 Every box without a label of its own gets the accessible name "Mark as completed: <row text>", where row text
  = the visible text of the row it sits in (heading, list item or card text including badge texts as they run
  together), whitespace runs collapsed, trimmed, a leading list number such as "12." or "3)" removed, cut to 100
  characters; with no row text the name is "Mark as completed". Examples: "Mark as completed: Story Completion
  (50%)", "Mark as completed: Gone Fishing CHAPTER 1 POINT OF NO RETURN", "Mark as completed: Get Shirley's Rum
  OPTIONALMISSABLE", "Mark as completed: Search for the Skunk Ape" (F5-20, F5-24, F5-27; F5-R4).
- R-911 A `#profile=<n>` address suffix is removed from the address on load (history replace); guests see no profile
  switcher (F5-19).
- R-912 There is no reset / untick-all control on checklist pages; undo is per item (F5-20, F5-10).

### 9.2 100% checklist page
- R-913 Structure: article heading, intro (own), a contents box (quick index) listing the 38 requirements as links
  to their section anchors, each with its tick box, then one section per requirement whose heading carries a tick
  box; the four top-level sections are "Story Completion (50%)", "Tasks (27%)" (11 sub-items), "Exploration &
  Activities (20%)" (20 sub-items), "Discovery (3%)" (3 sub-items) (F5-01; section 16.6 lists ids and labels).
- R-914 Percentage (F5-R1): only top-level requirements are summed. A top-level requirement without sub-items counts
  its weight × multiplier when ticked. A requirement with sub-items counts the sum of its ticked sub-items' shares,
  capped at its limit when it has one. A sub-item's share is its own weight × multiplier when it has a weight;
  otherwise the parent's weight is split over the sub-items in proportion to their multipliers, sub-items sharing a
  group key forming one slot. Sub-items with their own sub-items recurse with their share as parent weight. Each
  item (or group key) counts at most once even when shown several times. Fixture weights: story 50; tasks parent
  limit 27 with children 6, 3 and nine × 2; exploration 20 split equally over 20 items; discovery 3 over 3 items;
  total 100 (F5-02, F5-05..F5-14; probe S-A1 "2.73", S-B1 "5.00", S-C1 "1.50").
- R-915 Display (F5-R3): clamp to 0–100; the number shows exactly two decimals ("0.00", "50.00", "51.00",
  "100.00"); the bar's width is the clamped value in percent (inline width, e.g. "width: 50%"); the bar is a
  progressbar (role progressbar, min 0, max 100, `aria-valuenow` = the two-decimal text, accessibility fix D-010);
  changes animate over ~300 ms (instant when the tab is hidden) (F5-01, F5-02, F5-14).
- R-916 The progress module is a side box with heading (level 3) "<n>% Completed!" holding the number and the bar;
  below it the guest note (own wording, DIVERGENCE D-017: progress is saved in this browser; a "Login" link to
  `/login/` leads to the accounts-later page). Desktop (1366 px): top of the right column, sticky while scrolling
  (~358 px wide). Phone (390×844): the page is one column and the box is pinned to the top of the screen across the
  full width (~136 px tall) so number and bar stay visible while ticking (F5-01, F5-21, F5-30; probe
  probe-f5-checklists-layout.json). The percentage is recomputed when the tab becomes visible, on window focus and on
  Back (bfcache) (trace F5 §T1).

### 9.3 Mission lists and walkthroughs
- R-917 Each mission walkthrough page ends with the level-2 heading "Mission Completed" carrying one tick box of list
  `gta6-missions` with the mission's checklistId (accessible name "Mark as completed: Mission Completed"); ticking it
  there or on the list card is the same thing (F5-34, F5-35, F5-38; F-F5-11).
- R-918 Missions page (`/gta-6/missions/`): heading (own wording), intro saying the list contains no story spoilers
  and lets the visitor keep track of completed missions (own wording), the section headings "GTA 6 Story Missions
  List:", "Prologue", "Chapter 1" … "Chapter 5", each chapter a list of mission cards (image, protagonist icon, tick
  box, number + title for main missions, badges such as "CHAPTER 1 POINT OF NO RETURN" / "OPTIONAL" / "MISSABLE",
  one-line description). Main missions are numbered and link to `/gta-6/missions/<slug>` — except the first card,
  "Prologue", which links to `/missions/gta-6/prologue` (F-F5-09); optional missions are not numbered and are
  styled differently. Then own info sections and a FAQ. No progress box (F5-22, F5-24, F5-35).
- R-919 Strangers page (`/gta-6/strangers-missions/`): heading (own), intro containing the sentence "Tick the
  checkbox next to a mission to track your progress.", sections "Chapter 1" … "Chapter 4" of stranger mission cards
  (with the mission giver; linking to `/gta-6/strangers/<slug>`) and "Other Optional Missions" grouped by chapter
  (cards linking to `/gta-6/missions/<slug>`); those optional missions use the same list and ids as the missions
  page (F5-25, F5-27).
- R-920 Activities page (`/gta-6/side-missions/`): a grid of activity cards (image + name + one line), each linking to
  `/side-missions/gta-6/<slug>`; no tick boxes, no progress box (F5-28).
- R-921 Random events page (`/gta-6/random-events/`): a placeholder table with the column headers "Random Event",
  "Location", "Reward", "Status" (shown in capitals) and rows "TBA" · "TBA" · "TBA" · "Coming Soon"; no tick boxes
  (F5-29).
- R-922 Unknown checklist or mission URLs are the 404 page (F5-33).

### 9.4 Behavior vs data (F5)
- Behavior: `url`, `checked:*`, `count:cl-box-checked`, `count:cl-box-disabled`, `count:cl-box-labelled` (= number of
  boxes), `count:sec-exploration-children(-checked)`, `count:sec-story-tasks-children-checked`, `text:pct-text`,
  `attr:pct-bar@aria-valuenow`, `local:guest_checklists` (shape, order, ids of the fixture), accessible names,
  `count:reset-control` (0), `count:profile-switcher` (0), `count:pct-text` (0 off the 100% page),
  `attr:mission-first-row@href`, `list:events-table-header`, visibility at 390 px.
- Data: `count:cl-box` on mission pages, `count:mission-row*`, `count:activity-card`, `list:chapter-heading`,
  `list:events-table-cell`, `heading`/`title`, guest note text (own wording, D-017), `text:p:has-text(...)`.

---

## 10. F6 — Guide pages

Pages: `/gta-6/animals/`, `/gta-6/characters/`, `/gta-6/gangs/`, `/gta-6/properties/`, `/gta-6/radio-stations/`,
`/gta-6/map-locations/`, the three cheat pages; the accordion component lives on `/membership/`.

### 10.1 Static guides and card grids
- R-1001 Each guide is one server-rendered page: h1, header image, share actions, own intro, then sections (level-2
  headings) mixing text, card grids, bullet lists, tables and FAQs. Everything is in the page: no client-side
  filtering, sorting, paging, "load more", tabs or accordions (F6-01, F6-04, F6-05, F6-07, F6-09, F6-18, F6-24;
  F6-R3; F-F6-01).
- R-1002 A sub-list is a grid of cards under its own level-2 heading; the page total is the sum of its grids. Grid
  structure (sizes are data, section 16): animals 3 grids (land, birds, sea) and exactly 3 level-2 section headings;
  characters 4 grids (protagonists — first card Jason — main, supporting, minor) + a block of non-link "other
  characters" rows + a bullet list of mentioned names + a FAQ of exactly 5 questions (level-3 headings); gangs 2
  grids — gangs, then an **empty** law-enforcement grid followed by a bullet list — and exactly 4 level-2 headings;
  properties 4 grids (purchasable, story, edition, safehouses) whose cards show "Location:", "Parking spots:" or
  "Unlock:", and "Price:" only on purchasable cards (F6-01, F6-04, F6-05, F6-07; F6-R3).
- R-1003 Card link: a card opens the item's detail page at its canonical path; its link's accessible name is "Read
  more: <item name>" (visible text = the name; the image link is hidden from assistive technology); on gangs and
  properties the whole card is the link. Back returns to the guide with the same cards (F6-01..F6-03, F6-06, F6-08;
  F-F6-03). Gangs link to `/gangs/gta-6/<slug>`; edition properties link to `/properties/gta-6/<slug>` (their
  canonical paths in the fixture, R-008).
- R-1004 Quick index (table of contents): the cheat pages and the map-locations page start with one index block
  (title "<page short title> Guide & Full List" or "… Index", own wording) listing one link per indexed level-2/3
  heading; each link is "<page path>#<heading slug>" (R-413); activating it jumps to the heading and adds the hash
  (new history entry); loading a page with such a hash keeps it and scrolls to the heading (F6-18, F6-19, F6-22..F6-24;
  F-F6-11). Animals, characters, gangs and properties have no index (F6-01 `count:toc` = 0).
- R-1005 Map-locations page: one index, own sections, six embedded galleries (section 12, R-1215) and a banner
  "Looking for the interactive tool?" with the link "Interactive GTA 6 Map & Collectibles Tracker" to `/gta-6/map/`
  (F6-24).
- R-1006 Back-to-top: see R-1309 (F6-26).
- R-1007 Phone width (390×844): same content and counts; grids use fewer columns; card title links, cheat icons, the
  index, the platform switcher and the radio bar stay visible (F6-35..F6-38).
- R-1008 Unknown guide URLs are the 404 page (F6-25).

### 10.2 Cheat pages
- R-1009 The PS5 and Xbox pages list the same cheats in the same 5 categories, each under a level-2 heading shown in
  capitals: "Player Cheats", "Combat Cheats", "Vehicle Spawn Cheats", "Environment Cheats", "Screen Filter Cheats"
  (anchors `player-cheats`, `combat-cheats`, `vehicle-spawn-cheats`, `environment-cheats`,
  `screen-filter-cheats`). A row = name (level 3), one-line effect, "How to unlock: <text>", and the button sequence
  as a row of D-pad icon images whose text alternatives are exactly "UP", "DOWN", "LEFT" or "RIGHT" (no other
  icon in a sequence). The first cheat's sequence has 8 steps starting UP, RIGHT (F6-18, F6-21; F6-R4).
- R-1010 The first indexed section of the PS5 page is "How to Enter GTA 6 Cheats on PS5"
  (`#how-to-enter-gta-6-cheats-on-ps5`; Xbox: "How to Enter GTA 6 Cheats on Xbox",
  `#how-to-enter-gta-6-cheats-on-xbox`); its numbered steps show exactly three icon images: PS5 "UP", "L1", "R1"
  (hold L1, press R1), Xbox "UP", "LB", "RB" (F6-18, F6-21).
- R-1011 A two-card platform switcher under the intro links "GTA 6 Cheats for PS5" and "GTA 6 Cheats for Xbox Series
  X|S"; the card of the current page shows the badge "You are here" (shown in capitals) and is marked current;
  clicking the other card opens that page. There is no copy button, search, filter, sort or any form control in the
  article body; the PS5 and Xbox bodies contain no link to the PC page (F6-18, F6-20, F6-21; F-F6-10).
- R-1012 PC page: no cheat rows and no switcher; a 3-cell table linking "GTA 6 Cheats for PS5", "GTA 6 Cheats for Xbox
  Series X|S", "GTA 6 Cheats for PC"; its body links to the PS5 page exactly twice and to the Xbox page exactly twice
  (table + text); its first indexed section is "How Many Cheats Are There in GTA 6?"
  (`#how-many-cheats-are-there-in-gta-6`) (F6-22).

### 10.3 Radio page and player
- R-1013 Structure: one block per station — cover image, name (level 3, a link "Read more: <station>" to the station
  page) and genre — then a table with the column headers "#", "Track", "Play"; each row = number, title (bold) and an
  "<artist> (<year>)" line, and a Play button. No input, select or sortable header in the tables. A fixed bottom
  bar (the floating player) shows the current title and artist, the time "m:ss / m:ss" over a clickable progress bar,
  and three icon buttons named "Previous track", "Play/Pause", "Next track"; the bar is visible on desktop and at
  390×844 (F6-09, F6-38; F6-R1).
- R-1014 Playable tracks: a row is playable only when it has an audio clip; rows without one keep a Play button that
  is present but not displayed (state token `track-play-hidden`); a station without playable rows is skipped by the
  player (F6-09: 1 station without playable tracks; F6-R2).
- R-1015 Initial state: current track = the first playable track of the first station that has one; nothing plays;
  the bar shows its title and artist, "0:00" / "0:00", and the play icon (`data-state` "paused"); every shown row
  button reads "Play" (shown in capitals) (F6-09).
- R-1016 Player readiness (DIVERGENCE D-009: own short local audio clips instead of a video service): the player is
  ready once the audio engine has loaded the metadata of the first playable track; a hidden player element
  (token `youtube-iframe`, kept for vector compatibility) is added to the page at that moment. Until ready,
  Play/Next/Previous/toggle change nothing on screen; a Play click is remembered and started when the player becomes
  ready (F6NY-01..F6NY-04; F6-R2). If the clips cannot be fetched the player never becomes ready.
- R-1017 Clicking a row's Play makes that track current (its station becomes the current station) and starts it: its
  button reads "Pause", every other row button "Play" (at most one "Pause" on the page), the bar shows its title
  and artist with the pause icon, and the time resets to 0:00 (F6-10, F6-11, F6-15). Clicking the current row's
  button, or the bar's toggle, pauses/resumes it (F6-17).
- R-1018 Next / Previous move within the current station's playable tracks and wrap (last → first, first → last);
  they never change station (F6-11..F6-16; F6-R1). When a track ends the player advances to the next one; a track
  that fails to load is skipped; after a whole lap of failures it stops and shows Play (static; UNKNOWN live, U-F6-01).
- R-1019 Action lock: after each play/pause action further toggles of the same track are ignored for up to 3 s or
  until the player reports playing/paused (static; F6-17 waited 3.5 s). While a track is still starting, a toggle
  pauses it.
- R-1020 Progress: while playing, ten times per second the fill = elapsed/duration and the times use R-408;
  clicking the progress bar seeks to that fraction (static).
- R-1021 Only one player per page; station pages (`/gta-6/radio-stations/<slug>`) use the same player limited to
  that station (R-616).

### 10.4 Accordion component (membership FAQ)
- R-1022 Used on `/membership/` (FAQ of the rebuild's own questions; section 16.10) — not on any guide page. Each item
  header is a button (role button, focusable, `aria-expanded`, `aria-controls` → its panel, a region labelled by the
  header); the item marked "open by default" (the first) starts open (F6-27; F6-R5).
- R-1023 Activating an item opens it and closes the previously open one (at most one open); activating the open item
  closes it (zero open allowed) (F6-28, F6-29).
- R-1024 Opening an item pushes "#<item alias>" as a new history entry (Back walks back through opened items);
  loading the page with "#<item alias>" opens that item instead of the default one (F6-28, F6-34).
- R-1025 Keys on a focused header: Enter and Space toggle it; ArrowDown/ArrowUp move focus to the next/previous header
  and Home/End to the first/last — moving focus never opens or closes an item, and never raises an error
  (accessibility fix, DIVERGENCE D-010; the original's arrows did nothing and Home/End raised an error, F6-30..F6-33).
- R-1026 Accordions rendered after the page became interactive are initialised as well (DIVERGENCE D-021; the original
  missed them, F6-39).

### 10.5 Behavior vs data (F6)
- Behavior: `url`, `count:card-grid`, `count:section-heading`, `count:toc`, `count:faq-question`, link names "Read
  more: …", `attr:grid-1-first-link@href` / `attr:grid-1-first-card@href` (fixture items), radio labels and states
  (`text:s1-*-play`, `count:track-play-pause-state`, player time texts, visibility), `count:station-without-tracks`,
  `list:tracklist-header`, `count:table-controls`, cheat category list, `count:first-cheat-keys`,
  `count:cheat-key-other`, `count:cheat-copy-or-filter`, platform links and current text, index link hrefs,
  `count:howto-step-icons`, icon alts, `count:body-link-*`, `count:pc-platform-table-link` and labels, banner href,
  accordion `aria-expanded`, open counts, role, tabindex, URL hash.
- Data: grid sizes (`count:grid-N-cards`, `count:guide-card`, `count:card-with-*`, `count:plain-person-row`,
  `count:bullet-list-1`), station/track counts, track titles and artists, cheat counts per category,
  `text:first-cheat-unlock`, icon image paths, `count:toc-link`, `count:indexed-heading`, `count:inline-gallery`,
  `count:acc-button`, the accordion's panel ids (`attr:acc-1@aria-controls`, implementation id, TA7).

---

## 11. F7 — News, guides, videos and the article page

### 11.1 Lists
- R-1101 Article lists sharing one layout: **News** `/gta-6/news/` (every article, also reachable as `/gta-6/articles`
  and `/gta-6/articles/page-<N>`), **Guides** `/gta-6/guides/` (articles flagged guide plus fixed section links:
  the three cheat pages, the best-vehicles ranking, the map-locations guide, the 100% checklist and the missions
  list), **Videos** `/gta-6/videos/` (articles flagged video), and **All news** `/news/` (every article, with tags)
  (F7-01, F7-14, F7-17, F7-20, F7-37; F-F7-07; U-F7-02).
- R-1102 Order: newest `publishedAt` first, ties by slug descending (sort key UNKNOWN on the original, U-F7-01; HYPOTHESIS); Guides order section links
  by their own sort date among the articles (F7-R1; F-F7-05).
- R-1103 List header, page 1: News shows a description block with its own heading (the page h1), the "Filter by Game"
  button, a 1200×320 banner image and an intro sentence (own wording). Guides and Videos show their h1, the parent
  link "Rockstar Games News & Guides" → `/news/`, the share actions and an intro; Videos also a banner, Guides none.
  All news shows its h1, the "Filter by Game" button and an intro (F7-01, F7-14, F7-17, F7-20).
- R-1104 "Filter by Game" is a menu button (`aria-expanded`): click or Enter opens it, Escape or a click outside
  closes it. Its menu holds 8 entries in this order: "All News" (`/news/`), "GTA 6" (`/gta-6/news/`), then "RDR2 &
  Online", "GTA 5 & GTA Online", "GTA 4", "GTA San Andreas", "GTA Vice City", "GTA 3" shown as disabled entries
  (`aria-disabled="true"`, no href, tooltip "Not covered by Leonida Atlas") (DIVERGENCE D-012). No client-side
  filtering (F7-21..F7-24; F-F7-09).
- R-1105 List item: a 320×180 thumbnail (alt = the item title) wrapped in a link, and the title as a link inside a
  level-2 heading, both to the item's canonical path; then a meta list whose term "Details" is visually hidden (read
  by screen readers). Fields per list: News — "by <author>", the date line (R-402), the category link "Grand Theft
  Auto VI" → `/gta-6/news/`; Guides — the category link only; Videos — the date line only; All news — author, date
  and tag badges: a game tag "GTA 6" → `/gta-6/news/` on every item plus a "Guide" tag → `/news/` on guide items, no
  category link (F7-01, F7-14, F7-17, F7-20, F7-41; F7-R3).
- R-1106 Paging: 30 items per page; Videos hold all their items on one page with no counter and no pager. Page 1 is
  the list URL; page N ≥ 2 is "<list URL>page-N"; `page-1` and N greater than the last page answer 404;
  `?start=<offset>` shows page ⌊offset/30⌋+1, and an offset past the end shows the last page's counter with no items
  (HTTP 200, no message) (F7-03, F7-08..F7-12, F7-15, F7-16, F7-18; F7-R2).
- R-1107 Under the list: the counter "Page N of M" (always present) and a navigation labelled "Pagination" that is
  inserted only when the counter comes within 200 px of the viewport (before that the page contains no pager
  link). Pager items: "Go to first page" and "Go to previous page" (disabled entries — not links — on page 1),
  numbered links "Go to page N" (at most 10: all when M ≤ 10, otherwise a window of 10 starting at
  max(1, min(N−4, M−9)) — window rule UNKNOWN beyond 10 pages, HYPOTHESIS), the current page as a link labelled "Page N" with
  `aria-current="true"` and href "#", then "Go to next page" and "Go to last page" (disabled entries on the last
  page). First/previous/next/last are icon links without visible text. Link targets: page 1 = the list URL, page N =
  "<list URL>page-N", last = "<list URL>page-M" (DIVERGENCE D-015: no alias quirk) (F7-01, F7-02, F7-04, F7-07,
  F7-42; F-F7-17).
- R-1108 Pages N ≥ 2 do not show the description block (banner, intro, filter button); the h1 reads "<list name> -
  Page N", the suffix " - Page N" being its own element (text "- Page N"); News uses its category name: "Grand Theft
  Auto VI - Page N"; Guides keeps its page-1 heading plus the suffix. With `?start=` the heading changes the same way
  while the document title stays the page-1 title (F7-03, F7-11, F7-12, F7-15; F-F7-04).
- R-1109 State lives in the URL only: Back returns to the previous page, reload and deep links reproduce a page
  (F7-05, F7-13).
- R-1110 `/gta-6/articles` shows News page 1 (same h1 and items, counter "Page 1 of M") (F7-37).

### 11.2 Article page
- R-1111 Article: h1 = title (also the document title); a meta list (term "Details" visually hidden) with an optional
  "by <author>" (when showAuthor), exactly one date — "on <date>" (published) or, when showModified, "Last Updated:
  <date>" (modified) — and the category link "Grand Theft Auto VI" → `/gta-6/news/`; the share actions; a full-width
  hero image with alt text; the body (F7-26, F7-27, F7-31, F7-47, F7-48; F-F7-10; U-F7-03).
- R-1112 Table of contents (articles with toc): a box headed with the article's short title (e.g. "GTA 6 Driving
  Tips") and an ordered list of links, one per indexed section heading in document order, labelled with the heading
  text and pointing to "<article canonical path>#<anchor>" (R-413). Each heading carries an empty, invisible anchor
  element with that id. Activating a link (click or Enter) scrolls to the section and adds the hash as a new
  history entry; Back removes it; reload and deep links with a hash keep it. Sections flagged "no index" are left out
  (F7-27, F7-28, F7-38, F7-43..F7-46; F7-R5; F-F7-11).
- R-1113 Video items are ordinary articles whose body contains the rebuild's placeholder video player (DIVERGENCE
  D-022); such posts show "by <author>" and end with an author box "Author: <invented name>" plus a short own bio
  (F7-19; F-F7-08).
- R-1114 After the body, in this order: the previous/next pager to the neighbours in the News order — "previous"
  (`rel=prev`, left chevron) = the next newer article, "next" (`rel=next`, right chevron) = the next older article,
  each showing the neighbour's title; the newest article has no previous link and the oldest no next — inserted only
  when the end of the article comes within 200 px of the viewport; then the related box when the article has related
  items (heading shown in capitals + 2–4 cards); then the comments placeholder (R-621) (F7-29..F7-31; F7-R4; U-F7-05).
- R-1115 Breadcrumb trail (in the lazy footer, R-1312): articles "Home › GTA 6 › News › <article title>" (the last item
  not a link); lists "Home › GTA 6 › News" / "… › Guides" / "… › Videos"; the trail is also published as structured
  breadcrumb data (F7-30, F7-31, F9-33, F9-34; F-F7-13).
- R-1116 Unknown article slugs under both path forms answer 404 (F7-32, F7-33).
- R-1117 Phone width (390×844): lists, table of contents, share actions, hero image and the "Filter by Game" button
  stay visible; the side column is rendered below the content (F7-34, F7-35, F7-39, F7-40, F7-46).
- R-1118 Author and commenter names of the original never appear; fixture authors are invented (F7 behavior 17).

### 11.3 Behavior vs data (F7)
- Behavior: `url`, `count:list-item` per page size rule (30 on full pages), `count:item-*` presence per list type,
  `visible:item-details-label` (false) and its text "Details", `text:item-category`, category/parent hrefs,
  pager structure (`count:page-links` before/after scrolling, `text:page-current`, `attr:page-current@href`,
  `count:page-disabled`, `count:page-first/prev/next/last`, link targets except the last-page quirk),
  `attr:pagination@aria-label`, `text:page-number`, `count:list-intro`, `count:list-banner`, filter menu states and
  labels, `count:game-filter-toggle`, `count:page-counter`/`count:pagination` on videos, `count:author-block`,
  `text:article-category`, `count:article-meta`, `count:article-modified`/`count:article-published` exclusivity,
  `count:article-hero`, `count:toc-links` = `count:section-anchors`, TOC hash behavior, `count:pager*`, rel values,
  `count:breadcrumb-items`, `count:related-block`, `text:related-heading` (fixture), visibility at 390 px, 404s.
- Data: M of "Page N of M" and the numbered links it implies, item counts of partial pages, titles, dates
  (`list:item-date`, datetimes), hrefs of specific items (fixture makes the named ones match), `list:toc-links`,
  `list:section-headings`, `text:toc-heading`, `attr:pager-*@href`, hero alt/width, comments readouts (D-004).

---

## 12. F8 — Media galleries

Pages: `/gta-6/screenshots/`, `/gta-6/screenshots/trailers/`, `/gta-6/artworks/`, `/gta-6/covers/`; the embedded
galleries of `/gta-6/map-locations/`; detail-page galleries (R-609) use the same lightbox.

- R-1201 Screenshots, Trailer Screens and Artworks share a tab bar of four links under the h1: "Screenshots"
  (`/gta-6/screenshots/`), "Trailer Screens" (`/gta-6/screenshots/trailers/`), "Artworks" (`/gta-6/artworks/`),
  "Videos" (`/gta-6/videos/`); the current page's tab is marked (`aria-current="page"`, state token
  `media-tab-active`). Covers and Videos have no tab bar (F8-01, F8-18, F8-19, F8-23, F8-29; F8-R3).
- R-1202 Gallery blocks: Screenshots and Trailer Screens — one block of up to 100 thumbnails per page; Artworks — six
  blocks, each under its own level-2 heading; Covers — one block with a single large image ("main image", with a zoom
  icon) and its caption under it, no thumbnails; Map & Locations — six embedded blocks (main image + horizontal
  thumbnail strip). Pages without an embedded/cover block have no main image (F8-01, F8-18, F8-19, F8-23, F8-26;
  F-F8-03).
- R-1203 Thumbnails: each is an interactive element wrapping the image, whose accessible name is the image alt text;
  no visible caption; thumbnail images load eagerly (no lazy loading) (F8-01, F8-02; F-F8-07).
- R-1204 Server paging: a block with T images shows 100 per page, pages = ⌈T/100⌉. Two identical navigations labelled
  "Pagination" (above and below the grid) contain: "Go to first page", "Go to previous page" (disabled on page 1), one
  item per page ("Page N" for the current one, marked current; "Go to page N" for the others), "Go to next page", "Go
  to last page" (disabled on the last page). Page 1's link is the gallery path without parameters; page p's link is
  "<gallery path>?thumb_limitstart=<(p−1)×100>&limit=100". Other parameters are kept (utm) or removed by redirect
  (`i`) (F8-01, F8-14..F8-18; F8-R3).
- R-1205 Opening: a click on a thumbnail — or Enter on a focused thumbnail — opens a full-screen lightbox at that image.
  In blocks with a main image a thumbnail click only changes the main image and marks that thumbnail active (exactly
  one active thumbnail, state token `g1-active-thumb` for block 1); a click or Enter on the main image opens the
  lightbox at the main image's position (F8-02, F8-09, F8-12, F8-24, F8-26, F8-27; F8-R4).
- R-1206 Lightbox: a modal dialog over the page (accessible name = the block heading, else the page h1). Top bar:
  counter "k/N" (k, "/", N, no spaces), three action buttons — "Download" (opens the full-size image), "Copy link"
  (copies the page URL), "Share…" (native share sheet, else copy) (DIVERGENCE D-024: the original has download,
  Facebook and Twitter) — and a close button (icon ×, accessible name "close"). Left/right arrow buttons (accessible
  names "previous"/"next"), the large image (alt = the item's alt) and a caption area below (the item caption; empty
  when none). With a single image there are no arrows (F8-02, F8-20, F8-24, F8-38; F-F8-11).
- R-1207 One lightbox per block and per page: N = the number of images of that block on the current page; artworks
  blocks are separate (block 2 opens at "1/<size of block 2>") (F8-14, F8-15, F8-20..F8-22; F8-R1, F8-R4).
- R-1208 While open, the page behind does not scroll and the document root carries the state token
  `page-scroll-lock`; closing removes it (F8-02, F8-08, F8-10, F8-33).
- R-1209 Navigation: next = ArrowRight or the right arrow, previous = ArrowLeft or the left arrow; it wraps (next of
  N is 1, previous of 1 is N); with one image it stays "1/1". Mouse wheel (not on macOS: up = next, down = previous,
  at most one step per 800 ms) and a horizontal swipe/drag of more than 10 px also step. The counter and caption
  follow the image (F8-03..F8-07, F8-15, F8-21, F8-25, F8-35; F8-R1; U-F8-01).
- R-1210 Loading: the lightbox has one slot per image of the block/page, but creates an image only for loaded slots:
  on open the current image and two neighbours on each side (wrapping), each move adds its new neighbours, loaded
  images stay (5 after opening, 11 after six further moves) (F8-02, F8-34, F8-36; F8-R2).
- R-1211 Closing: Escape or the close button. A click on the picture or on the caption strip does nothing. Reload
  closes it (nothing restored). After closing an embedded block, its main image and active thumbnail are the last
  image shown in the lightbox (F8-08, F8-10, F8-11, F8-13, F8-28, F8-33, F8-37; F8-R2).
- R-1212 The address never changes while opening, browsing or closing; there is no per-image deep link (R-003). Paging
  is the only URL state (F8-02..F8-10, F8-16, F8-17).
- R-1213 Controls stay visible while the lightbox is open (UNKNOWN on the original's fade timing, U-F8-02; the rebuild
  does not fade them).
- R-1214 Phone width (390×844): same thumbnails and counter; arrows and close stay visible and work; swipe steps
  (F8-31, F8-32, F8-38).
- R-1215 The only dialog openers on gallery pages are the shell's two "Log In" controls (header and phone account
  menu), both opening the accounts-later dialog (tokens `modal-trigger` and `modal-trigger-login`) (F8-01; F-F8-01).
- R-1216 Unknown gallery URLs are the 404 page (F8-30).

Behavior vs data (F8). Behavior: `url`, tab labels and active tab, `count:pagination` (2 or 0),
`count:pagination-item`, `text:pagination-active`, `count:pagination-disabled`, page link hrefs, lightbox
open/close counts, counter format and wrap positions, `count:lb-toolbar-action` (3), arrow/close visibility,
`count:page-scroll-lock`, `count:lb-slot` = N, `count:lb-loaded-image` (5 / 11), `count:thumb-img-lazy` (0),
`visible:main-slideshow`, `visible:main-image`, `count:media-tab`, `count:g1-active-thumb`, `count:modal-trigger*`.
Data: `heading`, `title`, thumbnail counts per block, N of the counter, alts, captions, `text:lb-total`,
`list:gallery-heading`, `text:image-description`.

---

## 13. F9 — GTA 6 hub and site shell

### 13.1 Shell
- R-1301 Every page: three skip links first ("Skip to content", "Skip to main navigation", "Skip to 2nd column",
  targeting the content, the main menu and the side column), then the header bar (logo, main menu, search, "Log In"
  + "Join" — R-1302), the GTA 6 sub-navigation bar (R-1306), the content with a right side column (R-1313), the
  back-to-top control (R-1309) and the lazy footer (R-1312) (F9-31, F9-37).
- R-1302 Header: the logo is a link to `/` whose accessible name and tooltip are "Leonida Atlas" (DIVERGENCE D-023);
  the desktop "Log In" control (text "Log In") opens the accounts-later dialog (R-302); "Join" links to
  `/membership/free/`; there is no language switcher (DIVERGENCE D-006) (F9-26, F9-37, F9-38).
- R-1303 Main menu (own structure, DIVERGENCE D-012 — other games are out of scope): top entries "Home" (`/`), "News"
  (`/gta-6/news/`), "GTA 6" (`/gta-6/`, sub-menu), "Database" (no page of its own, sub-menu: Vehicles, Weapons,
  Vehicle Comparison, Weapon Comparison, Best Vehicles by Class), "Media" (sub-menu: Screenshots, Trailer Screens,
  Artworks, Cover Art, Videos), "More" (href "#", sub-menu: Membership, Search, About this site → `/`). Exactly four
  entries have sub-menus. The "GTA 6" sub-menu holds 11 links in this order with these accessible names: "Map"
  ("GTA 6 - Map", `/gta-6/map/`), "Vehicles" ("GTA 6 - Vehicles"), "Weapons" ("GTA 6 - Weapons"), "Missions"
  ("GTA 6 - Missions"), "Characters" ("GTA 6 - Characters"), "100% Checklist" ("GTA 6 - 100% Checklist", the
  checklist article), "Animals" ("GTA 6 - Animals"), "Radio" ("GTA 6 - Radio", `/gta-6/radio-stations/`), "Cheats PS5"
  ("GTA 6 - Cheats PS5"), "Cheats Xbox" ("GTA 6 - Cheats Xbox"), "All GTA 6 Content" (`/gta-6/`, no extra accessible
  name). The "GTA 6" entry has an active look on GTA 6 pages (none on the 404 page) (F9-04, F9-05, F9-11; probe
  probe-f9-links-hub.json).
- R-1304 Desktop (wide layout): a sub-menu opens while the pointer hovers its parent entry and closes when the pointer
  leaves; focusing the parent link, or pressing Tab from it, does **not** open it. Each parent entry is followed by a
  disclosure button (accessible name "Show <entry> menu" / "Hide <entry> menu", `aria-expanded`) that is reachable by
  Tab: Enter or Space on it toggles the sub-menu, Escape closes an open sub-menu and returns focus to that button.
  The parent link itself navigates (click or Enter) (F9-05..F9-09, F9-11; F9-R4; accessibility fix, DIVERGENCE
  D-010).
- R-1305 Phone layout (below 1024 px wide — HYPOTHESIS for the exact breakpoint; observed at 390×844): the main menu
  is collapsed behind a real button named "Menu" (`aria-expanded`) at the top-left of the header, at least 44×44 px
  and covering the viewport point (20, 30) at 390 px width. Tapping it opens/closes the menu list. A plain tap on a
  parent entry that has a sub-menu does not navigate: it toggles that sub-menu (same as its disclosure button, shown
  as "+"/"−"); a tap with a modifier navigates; sub links navigate. The search form becomes the last entry of the menu
  (textbox labelled "Search"); the header search toggle is hidden; "Log In" + "Join" are replaced by one account menu
  button (own label "Account", `aria-expanded`) whose menu holds "Log In" (opens the accounts-later dialog), "Create
  Account" (opens the same dialog) and "Membership" (`/membership/`). Escape closes an open menu (F9-12..F9-18,
  F10-18, F10-19; F9-R4; F-F9-04, F-F9-06).
- R-1306 GTA 6 sub-navigation bar on every page except the 404 page, 18 links in this order: the game logo (visually
  hidden text "Game Logo", `/gta-6/`), "Overview" (`/gta-6/`), "Map", "Vehicles", "Weapons", "Missions",
  "Characters", "100% Checklist", "Achievements" (the achievements article), "Animals", "Properties", "Activities"
  (`/gta-6/side-missions/`), "Radio", "Guides" (`/gta-6/guides/`), "Strangers" (`/gta-6/strangers-missions/`),
  "Cheats PS5", "Cheats Xbox", "All GTA 6 Content" (`/gta-6/`). Accessible names "GTA 6 - <label>" except the logo
  and "All GTA 6 Content". The entry of the current section carries `aria-current="page"` (hub → Overview, guides
  list → Guides, map → Map, …); the news list and articles mark none. The bar wraps on phones (F9-12, F9-33, F9-34,
  F9-37, F9-40; F-F9-17).
- R-1307 Header search: a toggle button (accessible name "Search", `aria-expanded`, magnifier icon) opens a panel
  with a textbox (visually hidden label "Search", placeholder "Search …", name `q`) and a submit button "Search";
  Enter or the button submits `GET /search?q=<text>` with form encoding (spaces as "+", nothing trimmed, empty
  allowed) (F9-19, F9-20; F9-R1). The page contains exactly two search forms (header panel and phone menu), each
  with its own label/input association.
- R-1308 `/search` (DIVERGENCE D-003; the original redirects to an external web search, F9-21..F9-25, F-F9-07):
  a local results page with h1 "Search", the textbox prefilled with q, and results over the sample data — hub
  sections, vehicles, weapons, animals, characters, gangs, properties, radio stations, missions, activities,
  articles and map categories. Matching: query and texts lower-cased and accent-stripped, query split on spaces,
  every word must occur in the item's title (or, for articles, title or short title); results grouped by type in
  that order, each group at most 20 links, A→Z inside a group (articles newest first). Messages: empty q → "Type a
  word to search Leonida Atlas."; no result → "No results for “<q>”." ; otherwise "<n> results for “<q>”"
  (HYPOTHESIS for every message; own wording).
- R-1309 Back to top: a link (href "#", accessible name "Back to top", fixed bottom-right). Shown once the page is
  scrolled more than 300 px (`data-state` "visible"); beyond 1200 px it also gets a faded look (`data-state`
  "visible faded"), which stays when scrolling back up between 300 and 1200 px; both are cleared at 300 px or less.
  Activating it scrolls smoothly to the very top without changing the URL hash (F9-30..F9-32, F6-26; F9-R3;
  probe-f9-backtop.json).
- R-1310 The countdown box exists only on the hub (R-1318).
- R-1311 Document titles: R-414 (F9-R5).
- R-1312 Lazy footer: the footer is inserted only when the bottom of the content comes within 200 px of the viewport
  (before that the page contains no footer links and no breadcrumb items). Footer content: the breadcrumb navigation
  (labelled "Breadcrumbs"; items "Home" › "GTA 6" › <section> › <current page as text>; hub "Home › GTA 6 ›
  Overview"; 404 "Home › Page not found"), a GTA 6 link list of 10 entries (Map, Vehicles, Weapons, Missions,
  Characters, 100% Checklist, Animals, Radio, Cheats PS5, Cheats Xbox), the own copyright line, and six bottom links
  to rebuild pages ("Overview", "News", "Guides", "Map", "Search", "Membership"); no social links (DIVERGENCE D-006,
  D-012) (F9-30, F9-31, F9-36; F-F9-11).
- R-1313 Side column: heading "Latest GTA 6 Content" (shown in capitals) and the 8 most recent items across the
  section (articles first by date, then the newest items of other lists), each with its section name; plus the
  "Your favourites" block of R-1405. On phones the side column follows the content and stays visible (F7-34; F-F9-12).

### 13.2 Hub (`/gta-6/`)
- R-1314 Hub content, in order: h1 "GTA 6 (Grand Theft Auto VI)", a banner image, the countdown box (R-1318), the info
  box (R-1315), an "About GTA 6" section (own text), then link cards (image + title, shown in capitals) in grids: a
  first grid of 3 (Latest News, Features Recap, Guides) and grids under the level-2 headings "GTA 6 Database" (9:
  Vehicles, Weapons, Interactive Map, Characters, Gangs & Factions, Animals, Properties, Vehicles Comparison, Weapons
  Comparison), "GTA 6 Guides" (12: 100% Completion, Story Missions, Strangers & Freaks, Activities, Random Events,
  Locations Guide, Controls Guide, Achievements & Trophies, Ultimate Edition, Best Vehicles by Class, Fastest Cars,
  Fastest Motorcycles), "GTA 6 Cheat Codes" (3: GTA 6 Cheats for PS5, GTA 6 Cheats for Xbox, GTA 6 Cheats for PC
  (Coming Soon)), "GTA 6 Media" (6: Screenshots, Videos & Trailers, Radio Stations, Artworks & Wallpapers, Cover Art,
  GTA 6 Online) — 33 cards, every GTA 6 area reachable (targets in section 16.8). Then "GTA 6: Latest News & Updates"
  with the 10 newest articles ("Published on <date>", newest first) and the link "All GTA 6 news & updates" →
  `/gta-6/news/`. The level-2 headings of the hub, in order: "GTA 6 (Grand Theft Auto VI): Game Info", "About GTA 6",
  "GTA 6 Database", "GTA 6 Guides", "GTA 6 Cheat Codes", "GTA 6 Media", "GTA 6: Latest News & Updates" (all shown in
  capitals) (F9-01, F9-03, F9-39; probe-f9-links-hub.json).
- R-1315 Info box: level-2 title "GTA 6 (Grand Theft Auto VI): Game Info" (shown in capitals) and exactly six
  label/value rows: "Release Date" ("November 19, 2026"), "Series / Universe" (two linked values, "GTA Series" →
  `/search?q=GTA+Series` and "HD Universe" → `/search?q=HD+Universe`), "Set in Location", "Set in Year", "Publisher",
  "Developer" (values: section 16.8) (F9-01, F9-03).
- R-1316 `/gta-6` permanently redirects to `/gta-6/` (F9-41).
- R-1317 `/` is the rebuild's own front page (section 0.1 row 1; DIVERGENCE D-012) (F9-38).
- R-1318 Countdown box: heading "GTA 6 Release Countdown" (shown in capitals, a link to `/gta-6/`). Target = 19
  November 2026 00:00:00 in the **viewer's own time zone**. Once per second it shows the remaining time as four
  two-digit fields — days, hours, minutes, seconds, each rounded down, labelled "Days", "Hours", "Minutes",
  "Seconds". When the remaining time becomes negative the fields are replaced, once and for good, by the single line
  "GTA 6 is Out Now!" (shown in capitals) and the ticking stops; no digit field remains. During the last second all
  fields read 00 (F9-01, F9-02, F9-39; F9-R2; probe-f9-countdown-clock.json; F-F9-01..F-F9-03). Rendering on the
  server uses the same rule with the server clock and the client re-evaluates immediately.

### 13.3 Behavior vs data (F9)
- Behavior: `url`, info labels and count, info title, `count:info-links` (2), countdown title/text and
  `count:countdown-digits` (0 after release), `list:hub-section-headings`, sub-menu visibility on hover/focus/Tab,
  `count:menu-gta6-sub-links` + labels, `attr:menu-gta6-characters@aria-label`, `attr:menu-gta6@href`,
  `attr:menu-more@href` ("#"), `count:submenu-toggles` (4), phone visibility rules, `count:game-subnav-links` (18 /
  0 on 404), `list:game-subnav-links`, subnav current, search attributes and panel visibility, `text:search-submit`,
  `text:login-link` ("Log In"), dialog visibility and close name, back-to-top attributes, `count:breadcrumb-items`
  before scrolling (0), breadcrumbs label, `list:skip-links`, `attr:site-logo@href` ("/"), 404 `count:content-links`
  (0) and `count:game-subnav-links` (0).
- Data / own wording: card titles and counts, news dates and counts, info values, `title`, `heading` of articles,
  footer labels and counts, logo title (D-023), 404 reasons (D-017), search redirect readouts (D-003), dialog title
  (D-001), `attr:login-link@href` and other original anchors (TA7).

---

## 14. F10 — Favorites and personal progress

- R-1401 Each detail page (vehicle, weapon, animal, character, property, radio station, mission, gang, activity)
  shows exactly one button "Add To Favorites" (`type="button"`) next to "Compare To" (vehicles, weapons) or after the
  rating; its star icon is hidden from assistive technology so the accessible name is exactly "Add To Favorites"
  (accessibility fix, DIVERGENCE D-010; F10-01, U-F10-3).
- R-1402 HYPOTHESIS (DIVERGENCE D-002, not observable on the original where favorites are member-only, F10-02..F10-08):
  activating the button (click, Enter, Space) toggles a browser-local favorite. Saved state: text "Favorited", solid
  star, `aria-pressed="true"`; unsaved: "Add To Favorites", outline star, `aria-pressed="false"`. After the first
  save a short note "Saved in this browser" appears next to the button. No dialog opens and nothing is sent.
- R-1403 Storage: localStorage `atlas-favorites` = `{"gta-6": ["<list>/<slug>", …], "gta6-map": ["<marker id>", …]}`
  in the order added; removing deletes the entry; an emptied list is removed; an emptied object removes the key.
  `<list>` is the route list name (`vehicles`, `weapons`, `animals`, `characters`, `properties`, `radio-stations`,
  `missions`, `gangs`, `side-missions`) (HYPOTHESIS, F10 behavior 12).
- R-1404 List pages (vehicles, weapons) have no favorite controls (F10-20, F10-21).
- R-1405 The side column of every page shows a "Your favourites" block (own wording, HYPOTHESIS) listing up to 10 most
  recent favorites (items and map markers) as links — map markers link to `/gta-6/map/#<marker id>` — with the note
  that they are saved in this browser; the block is absent when there are none.
- R-1406 Map star (popup button, R-824): activating it toggles a local favorite of that marker in `atlas-favorites`
  list `gta6-map`; pressed state: `aria-pressed="true"`, accessible name and tooltip "Remove from favourites"; the popup
  stays open; no panel and no request (DIVERGENCE D-002; the original showed a "Favourites" members panel, F10-22..
  F10-25, F4-49).
- R-1407 Guest progress for checklists and map markers is R-828..R-833 and R-901..R-916; it never leaves the browser
  (F4-21, F5-02).
- R-1408 Membership page `/membership/` (structure only, DIVERGENCE D-016): own heading and intro; three plan cards
  (own titles: "Explorer", "Supporter — yearly", "Supporter — monthly"; price lines read "Coming later"), each with
  an own feature list and the buttons "Sign Up!" and "See Full Details" — both open the accounts-later dialog; below,
  the FAQ accordion of R-1022 (F10-27..F10-29, F6-27).
- R-1409 The accounts-later dialog (R-302..R-305) opened from a normal "Log In" control always shows its normal
  title; there is no favorites context in v1 (the original swapped title and added a benefits line, F10-11..F10-13;
  DIVERGENCE D-002).
- R-1410 `/mybase/gta-6/` and `/mybase/gta-online/` are the 404 page (F10-30, F10-31; D-012).
- R-1411 `/login/` shows the accounts-later page (R-306) (F10-32; D-026).
- R-1412 Phone width: the favorites button works the same; the header shows the account menu button (R-1305) (F10-18,
  F10-19).

Behavior vs data (F10). Behavior: `count:fav-button` (1 on details, 0 on lists and 404), `text:fav-button` before
activation, `attr:fav-button@type`, `count:fav-button-role` (= 1 in the rebuild, D-010), `count:list-fav-control`
(0), `text:compare-button`, map star name/tooltip/pressed before activation, header and phone "Log In" visibility,
`attr:modal-close@aria-label` ("close"), `attr:map-panel@role` (dialog) for member panels. Differences by design:
everything the original did after a guest activated a favorite (D-002), dialog title/benefits (D-001), plan
details (D-016), `/login/` form (D-026), `/mybase/gta-online/` (D-012).

---

## 15. Interaction model

- R-1501 Keyboard: every control is reachable with Tab in visual order and has a visible focus ring (ink outline
  2 px + 2 px offset). Buttons respond to Enter and Space; checkboxes to Space only (F5-18, F5-32); links to Enter.
  Hover-only behavior always has a keyboard equivalent (menus R-1304, map rows R-809) (DIVERGENCE D-010 where the
  original lacked one).
- R-1502 Modal dialogs (accounts-later dialog, lightbox, map About/Reset dialogs): role dialog with an accessible name,
  focus moves into the dialog on open, Tab cycles inside, the page behind is inert and does not scroll, Escape closes
  (R-842 order on the map), focus returns to the opener (R-304, R-1208).
- R-1503 Non-modal popovers (dropdowns, "Compare To", "Select Class", "Filter by Game", account menu, menus):
  `aria-expanded` on the trigger, Escape and a click outside close them and return focus to the trigger; only one
  popover is open at a time.
- R-1504 Transient feedback: "Copied!" replaces the copy button's text for 1.5 s (map R-826; also the share actions'
  "Copy link") and is announced through a polite live region.
- R-1505 Loading states: list pages show the loading indicator until interactive (R-502); the comparison board shows
  "Loading…" while navigating after a pick (R-712); the radio player stays inert until ready (R-1016).
- R-1506 Deferred blocks: the list pager (R-1107), the article and detail previous/next pagers (R-620, R-1114) and the
  footer with the breadcrumb trail (R-1312) are inserted when their placeholder comes within 200 px of the viewport;
  placeholders reserve their height so nothing jumps (F7-01/F7-02, F2-23/F2-24, F9-30/F9-31).
- R-1507 All personal-state updates are immediate in the page (no server round trip): checklist ticks, map found,
  compare picks, favorites, filter memory (R-828, R-906, R-703, R-1402).
- R-1508 Browser storage unavailable or full: features keep working for the current page view without persistence and
  never throw; unreadable JSON values are treated as empty (U-F5-3).
- R-1509 Breakpoints (HYPOTHESIS beyond the observed 390 px and 1366 px): below 768 px one-column layout, compare-bar
  names hidden (F3-16), side column after the content; below 1024 px collapsed header menu and account menu (R-1305);
  map "narrow" is decided by the map area width < 700 px (R-841); list cards: 4 columns from 1200 px, 3 from 900 px,
  2 from 560 px, 1 below.
- R-1510 Reduced motion: when the visitor prefers reduced motion, smooth scrolling, the percentage animation, menu
  slides and map fly-to animations are instant.
- R-1511 Capitalised display (W3) is done by styling; accessible names keep normal case unless a rule says the text
  itself is in capitals (mission badges, table 16.2).
- R-1512 History: R-011. Client navigations must keep server status codes visible to tests (404 pages answer HTTP 404
  on direct load).

---

## 16. Fixtures (invented sample data)

### 16.1 Generation principles
- R-1601 All content is generated deterministically at build time from own word lists with a seeded pseudo-random
  generator (seed text "leonida-atlas"); the same build always yields the same data. Invented names must not be names
  of real vehicles, real firearms, real manufacturers or real people. Images are generated placeholders (section 20).
  Prose (descriptions, intros, walkthroughs, FAQ answers) is the rebuild's own. **Exception — fixture identifiers:**
  the entities of 16.2 keep exactly the slug / id / path / display name the vectors use (with invented stats,
  descriptions, prices and images), and the structural labels quoted in this spec (classes, filter labels, map groups
  and categories, checklist sections, chapter headings, cheat categories, button texts) are kept as observed.
- R-1602 Counts below are the rebuild's own; readouts of live counts in the vectors are data (relation/format only).

### 16.2 Fixture identifiers the vectors rely on

| Type | Slug / id / path | Display name | What the cases need from it |
|---|---|---|---|
| vehicle | `andrew-nodes-thrax` | "Andrew Node's Thrax" (make Truffade, class Super, a standout set) | the only vehicle with speed 9.2 → first card of the default order; no real-life model (F1-38, F3-01..F3-05, F1-28) |
| vehicle | `seaspray-emerus`, `honeycomb-emerus`, `black-widow-emerus` | "Seaspray Emerus", "Honeycomb Emerus", "Black Widow Emerus" (make Progen, Super, standout) | all three speed 9.1, every other vehicle ≤ 9.0 → cards 2–4 of the default order (equal values fall back to names Z→A) (F3-03..F3-07) |
| vehicle | `emerus` (path `/vehicles/gta-6/emerus`, compareKey `progen-emerus`) + one more "… Emerus" | "Emerus" | name search "emerus" matches ≥ 5 cards (F3-12) |
| vehicle | `sunset-sanchez` | "Sunset Sanchez" (make Maibatsu, class Motorcycles, standout set "Mudder", base model `sanchez`) | standout detail page: info rows exactly Standout Set, Vehicle Class, Manufacturer, Style, Era, Seats, Base Model, Drive Train; no gallery; rating 0 votes; catalogue neighbours `mud-crasher-rancher` (before) and `tormentor-street-blazer` (after) (F2-01, F2-11..F2-15, F2-22..F2-29, F10-01) |
| vehicle | `sanchez` (compareKey `maibatsu-sanchez`) | "Sanchez" (Maibatsu, Motorcycles, no standout set) | all 12 info rows (Specialist, Based on, Mass / Weight, Gears, Variant / Conversion with ≥ 2 variants incl. Sunset Sanchez, Notable Owners); gallery ≥ 3 images; ≥ 2 appearances; ≥ 1 similar vehicle; shares the class with sunset-sanchez (F2-02, F2-13) |
| vehicle | `nightblade` (compareKey `western-nightblade`) | "Nightblade" (make Western, Motorcycles) | entry "Nightblade" in Sunset Sanchez's Compare To (F2-13) |
| vehicle | `manchez` (canonical path `/vehicles/gta-6/manchez`, compareKey `maibatsu-manchez`) | "Manchez" (Maibatsu, Motorcycles) | legacy path served as is, h1 "Maibatsu Manchez" (F2-30) |
| vehicle | `mud-crasher-rancher`, `tormentor-street-blazer` | "Mud Crasher Rancher", "Tormentor Street Blazer" (make Nagasaki; both Motorcycles) | catalogue neighbours of sunset-sanchez; h1 "Nagasaki Tormentor Street Blazer" (F2-24, F2-25) |
| vehicle | `banshee` | "Banshee" (make Bravado, class Sports) | title noun "Sports Car" (F2-31) |
| vehicle | `maverick` | "Maverick" (make Buckingham, Helicopters) | info rows exactly Vehicle Class, Manufacturer, Style, Era, Seats, Based on (Real Life), Mass / Weight, Variant / Conversion; no ratings; first helicopter in catalogue order (F2-32, F3-36) |
| vehicle | `burnished-alvino` | "Burnished Alvino" (make Principe, Motorcycles) | highest road rating of Motorcycles, no real-life model (F3-32, F3-43) |
| vehicle | `comet-s2-cabrio` | "Comet S2 Cabrio" (Sports) | highest road rating of Sports, has a real-life model (F3-34) |
| vehicle | `dantes-vitello` | "Dantes Vitello" (Super) | highest road rating of Super (F3-38; first row of best-vehicles under D-014) |
| vehicle | `seashark`, `dodo` | "Seashark" (Boats), "Dodo" (Planes) | first in catalogue order of their unrated classes (F3-35, F3-37) |
| vehicle | any | real-life model containing "Huracán" | exactly one vehicle; no real-life value contains unaccented "huracan" (F1-09, F1-10) |
| manufacturer | `ubermacht` | "Übermacht" | ≥ 2 vehicles; no other manufacturer label has a word starting with "Uber" (F1-20, F1-21) |
| standout set | `all-terrain` | "All-Terrain" | first set in configured order, ≥ 2 vehicles (F1-19) |
| weapon | `38` | ".38" (Handguns, base, real-life model, price) | first card by name; card labels Type, Make, Name, Based On, DAMAGE (F1-W01, F1-W15, F3-14, F3-26) |
| weapon | `heavy-pistol` | "1922" (Handguns) | second card by name — no other weapon name may sort before "1922" except ".38" (F3-14) |
| weapon | `assault-rifle` | "KZ-59" (make Kozlov, Assault Rifles, base) | info rows exactly Manufacturer, Weapon Class, Based on (Real Life), Ammo Capacity, Extended Ammo, Acquisition Method, Story Mode Price, Modifications, Variant / Conversion; empty gallery; ≥ 2 appearances (F2-03, F2-34, F10-03) |
| weapon | `drug-mule-kz-59` | "Drug Mule KZ-59" (Kozlov, Assault Rifles, unique variant of `assault-rifle`) | info rows exactly Manufacturer, Weapon Class, Base Model, Ammo Capacity, How To Unlock, Modifications (F2-33) |
| weapon | 5 more unique variants | "<own word> KZ-59" | picker query "59 kz" lists every KZ-59 name (F3-23, F3-24) |
| weapon | ≥ 4 melee weapons | names containing "Knife", one exactly "Knife" | picker queries "KNIFE" and "knífe" (F3-21, F3-25b) |
| animal | `albino-american-alligator` | "Albino American Alligator" | first card (A→Z) of the land grid (F6-01, F6-02) |
| animal | `gray-fox` | "Gray Fox" | all 5 info rows, empty gallery (F2-04, F10-04) |
| character | `jason` | "Jason Duval" | first card of the protagonists grid; all 12 info rows; screenshots ≥ 3 and artworks ≥ 1 (F2-05, F2-16..F2-21, F6-04, F10-07) |
| gang | `final-chapter-mc` (canonical `/gangs/gta-6/final-chapter-mc`) | "Final Chapter MC" | first gang card (F6-05, F6-06) |
| property | `7th-avenue-garage` | "7th Avenue Garage" | purchasable; all 7 info rows (F2-06, F10-06); map marker `garage-003` |
| property | `paradise-garage` (canonical `/properties/gta-6/paradise-garage`) | "Paradise Garage" | 2nd card of the edition grid (grid 3) (F6-08) |
| radio station | `flash-fm` | "Flash FM" | genre + host, tracklist (F2-07, F10-05) |
| mission | `prologue` (checklistId `6644`, canonical `/missions/gta-6/prologue`) | "Prologue" | main mission number 1, first card of the missions page (F5-22, F5-34..F5-36, F5-38) |
| mission | `gone-fishing` (checklistId `7285`) | "Gone Fishing", badge text "CHAPTER 1 POINT OF NO RETURN" | main mission number 2 (F5-23, F5-24, F5-26, F5-30..F5-32, F5-37) |
| mission | `get-shirleys-rum` (checklistId `7291`) | "Get Shirley's Rum", badge texts "OPTIONAL" and "MISSABLE" (adjacent) | optional; listed on the missions page and under "Other Optional Missions" of the strangers page (F5-24, F5-25) |
| mission | `search-for-the-skunk-ape` (checklistId `7319`, path `/gta-6/strangers/search-for-the-skunk-ape`) | "Search for the Skunk Ape" | stranger mission (F5-27) |
| mission | `breakfast-run` | "Breakfast Run" | all 8 info rows (F2-08, F10-08) |
| activity | `parachuting` (`/side-missions/gta-6/parachuting`) | "Parachuting" | first activity card (F5-28) |
| article | `/gta-6/articles/how-to-claim-ultimate-edition-benefits-in-gta-6` | "How to Claim All Ultimate Edition Bonuses in GTA 6" | newest article (2026-11-22T21:46:04Z) (F7-25, F7-26) |
| article | `/gta-6/articles/gta-6-driving-tips` | "GTA 6 Driving Tips: Drifting, Ducking, Drive-Bys & Hidden Tricks", short title "GTA 6 Driving Tips" | 8th newest (2026-11-22T09:44:12Z), no author shown, table of contents of 11 sections whose 3rd is "Duck to Hide from the Cops" and one of which is "Vehicle Melee" (anchor `vehicle-melee`), related box (2 cards); neighbours of 16.5 (F7-27..F7-30, F7-35, F7-38, F7-43..F7-45, F7-48, F9-34) |
| article | `/articles/gta-6/gta-6-controls-guide-ps5-xbox-button-layout` | "GTA 6 Controls Guide: Full PS5 & Xbox Button Layout", short title "GTA 6 Controls Guide" | showModified (modified 2026-11-22T09:44:22Z, published earlier), no author, 10 indexed sections, related box headed "Controls Across All Games" with 2 cards (F7-31, F7-46, F7-47) |
| article | `/articles/gta-6/grand-theft-auto-vi-launch-trailer` | "Grand Theft Auto VI Launch Trailer" | newest video item, published 2026-10-15T10:49:56Z, author shown + author box (F7-17, F7-19, F7-41) |
| article | `/articles/gta-6/gta-6-100-completion-guide-interactive-checklist` | own title | the 100% checklist page (F5-01) |
| article | the hub/news head and card targets of 16.5 | own titles | hub links and article pager (F7-29, probe-f9-links-hub.json) |
| map marker | `safehouse-001` | own name | southernmost safehouse at x −2352, y −5532 = start marker; number 1 / 5; has a details path; previous label "… Starlet Motel (#5)", next "… Pegassi Residences (#2)" (F4-20..F4-23, F4-26, F4-31..F4-34, F4-49..F4-53, F4-57..F4-59) |
| map marker | `safehouse-002`, `safehouse-003` "Pegassi Residences", `safehouse-004`, `safehouse-005` "Starlet Motel" | | collecting order 001, 003, 002, 004, 005 (002 = number 3) — coordinates of 16.4 (F4-54) |
| map marker | `garage-003` | "7th Avenue Garage" | details path `/gta-6/properties/7th-avenue-garage` (F10-22..F10-25) |
| map marker | `atm-001` | own | non-trackable ATMs (F4-25) |
| map marker | `card-liberty-city-wrath-001` … `-013` | 9 distinct names; `-001` and `-013` share a name, no other marker shares it | multi-spawn tick (F4-24) |
| map category | all 102 of 16.4 (Banks `bank`, Safehouses `safehouse`, Garages `garage`, Hidden Package `hidden-package`, ATMs `atm`, Gas Stations `gas-station`, Liberty City Wrath `card-liberty-city-wrath`, …) | | sidebar, storage lists, `?feature` keys (F4-01..F4-19) |
| checklist | the 38 ids of 16.6 | labels of 16.6 | 100% page (F5-01..F5-21) |
| FAQ | aliases `why-a-paid-membership-where-does-the-money-go` (item 2), `will-my-subscription-extend-automatically` (item 3) | own questions | accordion hash (F6-28, F6-34) |
| cheat | first Player cheat | own name | sequence of 8 steps starting UP, RIGHT (F6-18, F6-21) |
| gallery | screenshots ≥ 201 images; trailer screens > 100; artworks 6 blocks; covers 1 image with caption; map-locations 6 embedded blocks, the first with ≥ 5 images | own alts/captions | paging to `thumb_limitstart=200`, wrap, blocks (F8-01..F8-38) |

### 16.3 Vehicles and weapons
- R-1603 Vehicle classes (id, label, tile order, title noun R-603, page slug R-716): super "Super" 1, sports "Sports" 2,
  motorcycles "Motorcycles" 3, planes "Planes" 4, helicopters "Helicopters" 5, boats "Boats" 6, muscle "Muscle" 7,
  off-road "Off-Road" 8, cycles "Cycles" 9, commercial "Commercial" 10, compacts "Compacts" 11, coupes "Coupes" 12,
  emergency "Emergency" 13, industrial "Industrial" 14, military "Military" 15, sedans "Sedans" 16, service "Service"
  17, sports-classic "Sports Classic" 18, suvs "SUVs" 19, utility "Utility" 20, vans "Vans" 21 (tile order F1-01;
  labels F3-44).
- R-1604 Vehicles: 280 in total — Super 24, Sports 26, Motorcycles 36, Planes 12, Helicopters 10, Boats 14, Muscle 16,
  Off-Road 14, Cycles 6, Commercial 8, Compacts 10, Coupes 12, Emergency 10, Industrial 8, Military 8, Sedans 18,
  Service 8, Sports Classic 10, SUVs 14, Utility 8, Vans 8 (so infinite loading shows 100, 200, 280). 170 regular and
  110 standout vehicles in 25 sets ("All-Terrain" first, then 24 own set names in a fixed order); every standout
  vehicle has a regular base model. 12 vehicles have a second class (e.g. Helicopters + Emergency). 40 manufacturers:
  Maibatsu, Western, Bravado, Buckingham, Principe, Nagasaki, Progen, Truffade, Übermacht and 31 own invented makes.
  Real-life model on about 60 % of regular vehicles (own invented model names). Missing values: 8 vehicles without
  speed (3 of them Sports); Boats, Helicopters and Planes have no road/off-road ratings; 5 more vehicles without
  ratings. Seats 1–8. 15 vehicles carry the edition badge "Launch Edition". Names include words starting with "An"
  after a space and words ending in "an" before a space (text-filter relations of F1-04..F1-06, F1-41).
- R-1605 Weapon classes (id, label, tile order): handguns "Handguns" 1, assault-rifles "Assault Rifles" 2, smg "SMG"
  3, lmg "LMG" 4, shotguns "Shotguns" 5, sniper-rifles "Sniper Rifles" 6, tactical-rifles "Tactical Rifles" 7,
  launchers "Launchers" 8, thrown "Throwable" 9, melee "Melee" 10 (F1-W01). Weapons: 180 = 60 base + 120 unique
  variants — Handguns 36, Assault Rifles 26, SMG 22, LMG 8, Shotguns 22, Sniper Rifles 16, Tactical Rifles 10,
  Launchers 6, Throwable 10, Melee 24 (more than 150, so the comparison picker shows "<k> more: keep typing").
  Prices on 70 weapons; damage missing on 10 (≥ 2 handguns). Makes: Kozlov plus own invented makes.
- R-1606 Catalogue order (position): regular vehicles A→Z by name, each followed directly by its standout variants
  A→Z — except that the fixture places `mud-crasher-rancher`, `sunset-sanchez`, `tormentor-street-blazer` consecutively;
  weapons A→Z by name with variants after their base. Catalogue order drives previous/next (R-620) and ranking ties
  (R-719).
- R-1607 Ratings (stars): average and votes from the generator; `sunset-sanchez` 0 votes.

### 16.4 Map configuration and markers
- R-1608 Groups (id, name) in this order: properties "Personal", robberies "Robberies", activities "Activities",
  collectibles "Collectibles", collectible-cards "Collectible Cards", vehicles "Vehicles", weapons "Weapons", style
  "Style", food-drink "Food & Drink", local-places "Local Places" (F4-02). Colours: own palette.
- R-1609 Categories with markers, in **config order** (this order defines the `hidden` list of R-820; NT = not
  trackable, HD = hidden by default, MS = multi-spawn, slug = link key): 1 bank "Banks" (robberies) · 2 fence
  "Fences" · 3 gang-operation "Illegal Operations" · 4 payday-loan "Payday Loans" · 5 safe "Safes" · 6 smash-n-grab
  "Smash 'n' Grabs" · 7 towable-atm "Towable ATMs" · 8 mural "1010 Murals" (collectibles) · 9 ahol-street-art "Ahol
  Street Art" · 10 base-jump "BASE Jumps" · 11 book-swap "Book Swaps" · 12 comics "Comics" · 13 hidden-package
  "Hidden Package" slug hidden-packages · 14 easter-egg "Easter Eggs" slug easter-eggs · 15 knife-flight "Knife
  Flights" · 16 luxury-watch "Luxury Watches" · 17 magazine "Magazines & Books" · 18 meditation "Meditations" · 19
  message-bottle "Messages in a Bottle" · 20 meteorite "Meteorites" · 21 stunt-jump "Stunt Jumps" slug stunt-jumps ·
  22 treasure "Treasures" · 23 under-the-bridge "Under the Bridge" · 24 playlist "Unique Playlists" · 25
  waink-curiosity "Waink: Curiosities" · 26 waink-landmark "Waink: Landmarks" · 27 waink-sculpture "Waink:
  Sculptures" · 28 yellow-loot-box "Yellow Loot Boxes" · 29 scoop-container "SCOOP Containers" · 30
  card-americas-next-top-hooker "America's Next Top Hooker" MS (collectible-cards) · 31 card-backyard-wrestling
  "Backyard Wrestling" MS · 32 card-delights "Delights Dancers" MS · 33 card-ed-comics "Ed Comics Universe" MS · 34
  card-jack-of-hearts "Jack of Hearts Dancers" MS · 35 card-liberty-city-penetrators "Liberty City Penetrators" MS · 36
  card-liberty-city-swingers "Liberty City Swingers" MS · 37 card-liberty-city-wrath "Liberty City Wrath" MS · 38
  card-los-santos-corkers "Los Santos Corkers" MS · 39 card-los-santos-panic "Los Santos Panic" MS · 40
  card-los-santos-pounders "Los Santos Pounders" MS · 41 card-nine1nine "Nine1Nine Dancers" MS · 42 card-right-wing
  "Right Wing: America's Hero" MS · 43 card-legends-of-ratface "The Legends of Ratface" MS · 44
  card-vice-city-club-de-futbol "Vice City Club De Fútbol" MS · 45 card-vice-city-flamingos "Vice City Flamingos" MS ·
  46 card-vice-city-manatees "Vice City Manatees" MS · 47 card-vice-city-narcos "Vice City Narcos" MS · 48
  collectible-card "Other Cards" MS · 49 arcade "Arcade Machines" (activities) · 50 basketball "Basketball" · 51
  car-meet "Car Meet" · 52 drone-race "Drone Races" · 53 fishing "Fishing" · 54 gang-compound "Gang Compound" · 55
  golf "Golf" · 56 gym "Gym" · 57 hunting "Hunting" · 58 mini-golf "Mini Golf" · 59 parachuting "Parachuting" · 60
  pool "Pool" · 61 race "Races" · 62 random-event "Random Events" · 63 shooting-range "Shooting Range" · 64 garage
  "Garages" slug garages (properties) · 65 helipad "Helipads" slug helipads (local-places) · 66 safehouse
  "Safehouses" slug safehouses (properties) · 67 bus-stop "Bus Stops" NT HD (vehicles) · 68 car-wash "Car Washes" ·
  69 ev-charger "Electric Chargers" NT HD · 70 gas-station "Gas Stations" NT HD · 71 vehicle-mod-shop "Mod Shops" · 72
  pay-n-spray "Pay 'n' Sprays" · 73 public-transport "Train & Metro Stations" · 74 airport "Airports & Airfields" slug
  airports · 75 ferry "Ferry Terminals" slug ferry-terminals · 76 standout-vehicle "Standout Vehicles" MS · 77
  vehicle-rental "Vehicle Rentals" · 78 vehicle-request "Vehicle Requests" · 79 vehicle-spawn "Vehicle Spawns" · 80
  ammu-nation "Ammu-Nations" (weapons) · 81 weapon-spawn "Weapon Pickups" · 82 unique-weapon "Unique Weapons" · 83
  clothing "Clothing" (style) · 84 electronics "Electronics" · 85 footwear "Footwear" · 86 haircut "Hair & Beauty" · 87
  tattoo "Tattoos" · 88 bar "Bars" (food-drink) · 89 cafe-takeout "Cafes & Takeout" · 90 convenience-store
  "Convenience Stores" · 91 food-and-drink "Fast Food" · 92 liquor-store "Liquor Stores" · 93 street-food "Street Food"
  · 94 atm "ATMs" NT HD (local-places) · 95 cinema "Cinema" · 96 city-town "Cities & Towns" · 97 fire-station "Fire
  Stations" · 98 hospital "Hospitals" · 99 landmark "Landmarks" · 100 marina "Marinas" slug marinas · 101 nightclub
  "Nightclub" · 102 police-station "Police Stations". (Groups follow the names in parentheses until the next
  parenthesis.) Singular names for one-category titles: Bank, Garage, Safehouse, Hidden Package, Helipad, Airport,
  Ferry Terminal, Marina, Easter Egg, Stunt Jump; other categories use their name (UNKNOWN on the original; HYPOTHESIS) (trace F4 group table,
  F4-03 hidden list, F4-R4).
- R-1610 Markers (≥ 600, ids `<category id>-<three digits>` from 001): safehouse 5, garage 6, bank 12, every other
  robbery category 8, hidden-package 30, every other collectible category 10, every card category 13 markers with 9
  distinct names (markers 001–009 distinct, 010–013 repeat the names of 002, 003, 004 and 001), standout-vehicle 10
  with 8 distinct names, activity categories 6, helipad 4, bus-stop 20, ev-charger 10, gas-station 15, other vehicle
  categories 6, weapon categories 8, style categories 5, food-drink categories 8, atm 30, other local places 5.
  About a third of markers have a description, a fifth an image, a tenth a details path to a rebuild page.
- R-1611 Fixed coordinates: safehouse-001 (−2352, −5532), safehouse-003 (−1900, −5000) "Pegassi Residences",
  safehouse-002 (−1500, −3500), safehouse-004 (−500, −1200), safehouse-005 (300, 1500) "Starlet Motel"; safehouse-001
  has details path `/gta-6/properties/<the safehouse property>`. Map bounds: x −8000…4000, y −9000…3000; every marker
  lies on land inside them; region labels: five own invented county names.
- R-1612 Map notice window: 2026-11-01 to 2027-12-31 (own notice about the sample data).

### 16.5 Articles
- R-1613 84 articles (News pages 30 / 30 / 24). Newest ten, in order (the hub's latest news and the head of the News
  list): `how-to-claim-ultimate-edition-benefits-in-gta-6`, `how-to-use-turn-signals-and-headlights-in-gta-6`,
  `how-to-find-and-use-atms-in-gta-6`, `gta-6-military-base-location`, `can-you-play-gta-6-in-co-op-or-split-screen`,
  `how-to-fly-planes-helicopters-in-gta-6`, `gta-6-phone-guide-every-app-explained`, `gta-6-driving-tips`,
  `gta-6-review-bombed-on-metacritic`, `gta-6-mod-shops-repairs-guide` (all `/gta-6/articles/<slug>`; first eight
  published on 2026-11-22 UTC, the last two on 2026-11-21) (probe-f9-links-hub.json; F7-R4).
- R-1614 Further named articles (`/articles/gta-6/<slug>` unless noted): `gta-6-controls-guide-ps5-xbox-button-layout`,
  `grand-theft-auto-vi-launch-trailer`, `gta-6-100-completion-guide-interactive-checklist`,
  `gta-6-achievements-trophies-list-ps5-xbox-series`, `gta-6-editions-guide-pre-order-bonus-special-editions-content`,
  `gta-6-fastest-cars-ranked-list-by-top-speed`, `gta-6-fastest-motorcycles-ranked-list-by-top-speed`,
  `when-is-gta-6-online-coming-out`, and `/gta-6/articles/gta-6-features-recap`. Titles other than those quoted in 16.2
  are own.
- R-1615 Flags: 54 guide articles (Guides list = 54 + 7 section links = 61 entries, pages 30 / 30 / 1); 7 video
  articles dated 2019–2026 (newest = the launch trailer); 6 articles with showModified; 70 % with showAuthor (4 invented
  author names); 20 articles with a table of contents (≥ 5 sections each); 12 with a related box.
- R-1616 Dates: deterministic, strictly decreasing from 2026-11-22T21:46:04Z, back to 2019-03-24.

### 16.6 100% checklist (list `gta6-100`)
- R-1617 Items (id — label as shown — parent — weight/limit): `story` "Story Completion (50%)" — top — 50 ·
  `story-tasks` "Tasks (27%)" — top — limit 27 · `optional` (own label) "(6%)" — story-tasks — 6 · `gang-ops` "(3%)" —
  3 · `bank-jobs`, `payday`, `smash-grab`, `stick-ups`, `narcotics`, `jewelry`, `marked-bills`, `vaults`,
  `vehicles-fenced` "(2%)" each — story-tasks — 2 · `exploration` "Exploration & Activities (20%)" — top — 20 · `kenton`
  "5 of 7 Kenton Sets Completed (1%)", `cards`, `waink`, `underwater`, `magazines`, `meditation`, `flamingos`,
  `playlists`, `styles`, `races`, `race-challenges`, `shooting`, `video-games`, `pool`, `mini-golf`, `basketball`,
  `drones`, `stunts`, `challenges`, `target-decks` (own labels ending "(1%)") — exploration — no own weight · `discovery`
  "Discovery (3%)" — top — 3 · `vehicles`, `weapons`, `animals` (own labels ending "(1%)") — discovery — no own weight.
  Page order = this order; multipliers 1; no groups (F5-R1, F5-R2).

### 16.7 Missions, activities, events
- R-1618 Main missions 40 (Prologue: 1 — `prologue`; Chapter 1: 9 starting with `gone-fishing` #2 and
  `breakfast-run` #3; Chapters 2–5: 30), optional missions 12 (incl. `get-shirleys-rum`), stranger missions 16 in
  strangers chapters 1–4 (incl. `search-for-the-skunk-ape`); checklistIds: the fixed ones of 16.2, others 7000 + an
  index without collisions. Activities 10 (first `parachuting`). Random events: one placeholder row.

### 16.8 Hub, guides, cheats, radio, galleries, membership
- R-1619 Hub cards and targets: Latest News `/gta-6/news/`; Features Recap `/gta-6/articles/gta-6-features-recap`;
  Guides `/gta-6/guides/`; Vehicles; Weapons; Interactive Map; Characters; Gangs & Factions; Animals; Properties;
  Vehicles Comparison; Weapons Comparison; 100% Completion (checklist article); Story Missions; Strangers & Freaks;
  Activities; Random Events; Locations Guide (`/gta-6/map-locations/`); Controls Guide; Achievements & Trophies;
  Ultimate Edition (editions article); Best Vehicles by Class (`/gta-6/vehicles/best-vehicles/`); Fastest Cars;
  Fastest Motorcycles; the three cheat pages; Screenshots; Videos & Trailers; Radio Stations; Artworks & Wallpapers;
  Cover Art; GTA 6 Online (`/articles/gta-6/when-is-gta-6-online-coming-out`). Info values: Release Date "November
  19, 2026"; Series / Universe "GTA Series", "HD Universe"; Set in Location "State of Leonida; Vice City"; Set in
  Year "2026"; Publisher "Rockstar Games"; Developer "Rockstar Games studios".
- R-1620 Guides: animals 64 (land 40, birds 18, sea 6); characters: protagonists 2, main 6, supporting 10, minor 24,
  6 "other" rows, 8 mentioned names, 5 FAQ questions; gangs: 3 gang cards, an empty law-enforcement grid, 6 bullet
  items; properties: purchasable 6 (with prices), story 3, edition 4, safehouses 3 (one is safehouse-001's page).
- R-1621 Cheats: 36 per console page — Player 6, Combat 7, Vehicle Spawn 12, Environment 3, Screen Filter 8 — same
  names and sequences on PS5 and Xbox; the first Player cheat's sequence is UP, RIGHT, DOWN, LEFT, UP, UP, RIGHT, DOWN.
  Console index: How to Enter…, the five categories, two own sections (8 links); PC index: How Many Cheats Are There in
  GTA 6?, plus 6 own sections.
- R-1622 Radio: 12 stations; station 1 has 14 tracks, all playable; `flash-fm` is station 2; station 3's first row is
  not playable and its rows 2 and 3 are; station 8 has no playable track; overall about 60 % of rows playable; 8 own
  synthesized clips (6–12 s) shared by the playable tracks; artists and titles invented, years 1975–2026.
- R-1623 Galleries: screenshots 260 (pages 100/100/60), trailer screens 150, artworks 6 blocks of 8, 12, 6, 5, 4, 7
  images with own headings and captions, covers 1 image with caption, map-locations 6 embedded blocks of 8, 6, 5, 5,
  4, 4; item galleries: `sanchez` 9, `jason` screenshots 24 + artworks 6, other items 0–12 (some empty).
- R-1624 Membership FAQ: 8 own questions; item 1 open by default; aliases of items 2 and 3 as in 16.2, others own.
  Plans as R-1408.

---

## 17. Error and message catalogue

| Text (exact; `<…>` = placeholder) | Trigger | Rule / evidence |
|---|---|---|
| "404 Page Not Found" (h1 and document title) | any unknown URL, HTTP 404 | R-010; F2-09, F9-35 |
| "Get back inside the map!" | 404 page sub-heading | R-010; F2-09 |
| "Home › Page not found" | 404 breadcrumb | R-010; F9-36 |
| "No results match <typed text>" | dropdown search without a matching option | R-515; F1-20 |
| "<n> Vehicles" / "<n> Weapons" | list counters | R-504; F1-01 |
| "Clear Filters" | at least one list filter active | R-517; F1-13 |
| "Coming soon." | gallery without images | R-609; F2-03 |
| "<avg> of 5 (<n> Votes)" | rating line | R-410; F2-01 |
| "Pick 1 more" / "Compare (<n>)" / "<n>/4" | compare bar | R-705, R-706; F3-01..F3-05 |
| "Add at least two GTA 6 vehicles to see the comparison." / "… weapons …" | comparison with fewer than 2 items | R-708; F3-18, F3-19 |
| "Add a vehicle" / "Add a weapon" | empty comparison slot | R-708; F3-18 |
| "<k> more: keep typing" | picker with more than 150 matches | R-710; F3-20 |
| "No match" | picker without matches | R-710; F3-22 |
| "Loading…" | comparison board while navigating after a pick | R-712 |
| "Select Class" | ranking class menu button | R-720; F3-30 |
| "Road Rating: <n> · Off-Road Rating: <n>" ("-" when missing), "Based on: <model>" | ranking row | R-718; F3-30 |
| 'No marker matches "<query>".' | map search without marker hits | R-837; F4-39 |
| '<n> more, type a bit more of the name.' | map search with more than 30 hits | R-837; F4-43 |
| 'No category matches "<query>".' | no category row left | R-838; F4-39 |
| "Nothing to reset: no marker is ticked as found yet." | Reset progress with nothing found | R-832; F4-29 |
| "This unticks the <n marker(s)> you found, in every category. There is no undo." | reset dialog, all categories chosen | R-832; F4-31 |
| "This unticks the <k marker(s)> you found in <Category>. There is no undo." | reset dialog, one category chosen | R-832; F4-32 |
| "Done: <n marker(s)> unticked." | reset finished | R-833 |
| "Copied!" | copy link done (1.5 s) | R-826, R-1504; F4-50 |
| "Shared spot" / "Somebody shared this place on the map with you." / "Suggest this location" | `#spot=` popup | R-827; F4-56 |
| "Found so far, out of all markers of this category" / "Markers in this category" | counter tooltips | R-811; F4-02 |
| "found <f> of <n>" | screen-reader counter text | R-811; F4-02 |
| "Take the markers you found off the map (the counts stay)" / "Put the markers you found back on the map" | "Hide found" / "Show found" tooltips | R-831; F4-01, F4-26 |
| "Show only this category: <name>" / "Show all categories again: <name>" | Only/All and arrow names | R-817; F4-02, F4-11 |
| "Hide <group>" / "Show <group>" | fold button | R-816; F4-02, F4-09 |
| "Number <n> in a collecting order from south to north" / "Number <n> of this category, in the order of the list from south to north" | popup number tooltip | R-825; F4-20 |
| "Previous in <Category>: <name> (#<k>)" / "Next in <Category>: <name> (#<k>)" | popup navigation names | R-825; F4-20 |
| "The interactive map needs JavaScript." | map without scripts | R-806 |
| "Mark as completed: <row text>" / "Mark as completed" | tick box names | R-910; F5-20 |
| "<n>% Completed!" | 100% progress box heading | R-916; F5-01 |
| "Tick the checkbox next to a mission to track your progress." | strangers page intro | R-919; F5-27 |
| "TBA", "Coming Soon" | random events placeholder | R-921; F5-29 |
| "Play" / "Pause" (shown in capitals) | radio row buttons | R-1015, R-1017; F6-10 |
| "You are here" (shown in capitals) | current cheat platform card | R-1011; F6-18 |
| "How to unlock: <text>" | cheat row | R-1009; F6-18 |
| "Page <N> of <M>" | article list counter | R-1107; F7-01 |
| "- Page <N>" | heading suffix on list pages N ≥ 2 | R-1108; F7-03 |
| "on <date>" / "Last Updated: <date>" / "Published on <date>" / "by <author>" | dates and authors | R-402; F7-01, F7-31, F9-01 |
| "Details" (visually hidden) | meta list term | R-1105; F7-01 |
| "GTA 6 is Out Now!" (shown in capitals) | countdown after the release instant | R-1318; F9-01 |
| "Sign in to Leonida Atlas" + own accounts-later paragraph, buttons "Got it" and "close" | accounts-later dialog | R-302..R-305 (D-001) |
| "Favorited" / "Add To Favorites" / "Saved in this browser" | favorites button states | R-1401, R-1402 (HYPOTHESIS) |
| "Type a word to search Leonida Atlas." / "No results for “<q>”." / "<n> results for “<q>”" | search page | R-1308 (HYPOTHESIS) |
| "Comments are coming later." | comments placeholder | R-621 (D-004) |
| Not shown in v1: "The server did not answer. Please try again in a moment." (original map member actions), "The reset could not be saved, so nothing was changed. Try again in a moment.", "The reset stopped halfway: …", the session-ended message | — (no server, no accounts) | F4-33, F4-46..F4-48; D-018, D-019 |

---

## 18. Command vocabulary (test-vector tokens)

Rules TA1–TA8 (Conventions) apply: elements carry their tokens in `data-testid` (space-separated); profiles match
with `[data-testid~="<token>"]`. Kind: **B** base (every instance), **P** positional (added by order, TA3), **K**
keyed (one specific item, TA4), **S** state (present while the condition holds, TA5), **A** alias (another name of a
control named elsewhere — the element carries both tokens), **X** absence probe (no element may carry it where the
cases read it; the rebuild never renders the probed thing), **O** original-only parity element (exists only so a
recorded read keeps working). "Caps" = shown in capitals (W3). All 639 tokens of `tools/profiles/*.profile.json`
are listed.

### 18.0 Shared
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `heading` | B | the page's single h1 (no test id needed, TA8) | page heading |
| `body` | B | the document body | page root (class readouts ignored) |
| `footer` | B | the lazy footer region (contentinfo) | R-1312 |
| `share` (F2), `share-block`, `share-buttons` (F7) | B | the share actions group / its buttons ("Copy link", "Share…") | own share actions (D-006) |
| `back-to-top` | B | link, href "#", name "Back to top", `data-state` visible/faded | R-1309 |
| `toc`, `toc-link` (F6) = `toc-links` (F7), `toc-first-link`, `toc-link-3`, `toc-link-combat`, `toc-heading`, `indexed-heading`, `section-anchors`, `section-headings` | B/P/K | table-of-contents box (navigation named by its heading); its links (`toc-first-link` = first, `toc-link-3` = third, `toc-link-combat` = the link to `#combat-cheats`); `toc-heading` = the box heading; `indexed-heading` = the headings it indexes; `section-anchors` = the empty anchor elements carrying the ids; `section-headings` = the heading texts | R-1004, R-1112 |
| `gallery`, `gallery-thumbs`, `gallery-thumb-1`, `gallery-empty` | B/P/S | gallery section; its thumbnails; first thumbnail; the "Coming soon." state | R-609 |
| `lightbox` = (F8 same), `lightbox-counter` = `lb-counter`, `lightbox-next` = `lb-next`, `lightbox-prev` = `lb-prev`, `lightbox-close` = `lb-close`, `lightbox-buttons` | B/A | lightbox dialog; counter "k/N"; buttons "next", "previous", "close"; `lightbox-buttons` = the five children of the top bar (counter, three actions, close) | R-610, R-1206 |
| `comments` | B | the comments placeholder section (also the scroll target that reveals the pager) | R-621 |
| `pager-prev`, `pager-next`, `pager` | B | previous/next links (`rel` prev/next, text = neighbour name); `pager` = their navigation | R-620, R-1114 |
| `video-embed` | B | the placeholder video player (figure, name "Video player") | R-1113 (D-022) |
| `breadcrumbs`, `breadcrumb-items` | B | navigation named "Breadcrumbs" in the footer; its items | R-1115, R-1312 |
| `sidebar` (F7 scope) | B | the page's right side column (complementary) | R-1313 |
| `pagination` (F7: news pager navigation; F8: both gallery paginations) | B | navigation named "Pagination" | R-1107, R-1204 |
| `login-modal` (F9, F10) | B | the accounts-later dialog root (role dialog; `aria-hidden="false"` while open) | R-302..R-305 |
| `login-username`, `login-password`, `login-remember`, `login-submit`, `login-discord`, `login-google`, `login-links`, `login-register` | X | none — the accounts-later dialog has no form fields or social buttons (D-001); reads ignored | F10-14 |

### 18.1 F1 — lists
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `list-count` | B | status text "<n> Vehicles"/"<n> Weapons" (top toolbar) | R-504 |
| `list-count-number`, `list-count-bottom-number` | B | the number inside the top / bottom counter | R-504 |
| `card` | B | each card (list item element) | R-532 |
| `card-1` | P | first card | |
| `card-1-link` | P | link of the first card (name = item name) | |
| `card-1-name`, `card-2-name` | P | name heading of card 1 / 2 | |
| `card-1-class`, `card-2-class`, `card-1-make`, `card-2-make` | P | "Class"/"Type" value, "Make" value of card 1 / 2 | |
| `card-1-speed`, `card-2-speed`, `card-last-speed` | P | Speed value text of card 1 / 2 / last ("?" when unknown) | R-532, R-533 |
| `card-last-speed-bar` | P | Speed bar of the last card (`data-state` unknown/known) | R-533 |
| `card-1-seats` | P | seats badge of card 1 | |
| `card-1-damage`, `card-2-damage`, `card-last-damage` | P | Damage value of card 1 / 2 / last (absent when unknown) | R-534 |
| `card-last-damage-bar` | P | Damage bar of the last card (absent when unknown) | R-534 |
| `card-labels` | P | the field labels of card 1 ("Class", "Make", "Name", "Based On", "SPEED"…) | R-532 |
| `card-stat-bar` | P | the stat bars of card 1 | |
| `card-stat-fill` | P | filled part of card 1's Speed bar (inline width) | |
| `card-image` | P | image of card 1 | |
| `card-standout-badge`, `card-unique-badge`, `card-unknown-stat`, `card-price-pill` | B | "★ Standout" badge, "★ Unique Variant" badge, unknown stat bar, price pill (every instance) | R-532..R-534 |
| `autopage-sentinel` | B | invisible sentinel after the cards | R-523 |
| `filter-groups`, `filter-titles` | B | each filter block / its title | R-505 |
| `name-search` | B | textbox, label "Vehicle Name"/"Weapon Name", placeholder "Enter Vehicle Name"/"Enter Weapon Name", maxlength 128 | R-508 |
| `real-life-search` | B | textbox, label "Real Life Vehicle"/"Real Life Weapon", placeholder "Enter Real Life …" | R-508 |
| `class-options` | B | each class tile (list item) | R-510 |
| `class-1` | P | first tile (label text "<label> (<n>)") | |
| `class-checked`, `class-empty` | S | tile checkbox while ticked / tile while its count is 0 | R-512, R-513 |
| `class-super`, `class-sports`, `class-boats`, `class-handguns`, `class-shotguns`, `class-melee` | K | the tile label of that class (text "Super (29)"…) | R-510 |
| `class-super-box`, `class-sports-box`, `class-handguns-box`, `class-shotguns-box` | K | the tile's checkbox (name "<label> (<n>)") | R-510 |
| `manufacturer-dropdown`, `manufacturer-shown`, `manufacturer-search`, `manufacturer-results`, `manufacturer-select`, `manufacturer-options` | B | dropdown button (`aria-haspopup` listbox) / its current-label text / search box (name "Manufacturer") / each listbox row incl. the no-match row / hidden value mirror / mirror options | R-515, R-516 |
| `standout-dropdown`, `standout-shown`, `standout-results`, `standout-select` | B | same structure for "Standout Set" | R-514..R-516 |
| `standout-option-hide`, `standout-option-2` | K/P | listbox row "Hide Standout Vehicles (<n>)" / third row (= first set) | R-507 |
| `standout-option-1-text`, `standout-option-2-text` | P | mirror options 2 and 3 (after the placeholder) | |
| `weapon-type-dropdown`, `weapon-type-shown`, `weapon-type-select`, `weapon-type-options` | B | same structure for "Weapon Type" (no search) | R-515 |
| `weapon-type-option-unique` | K | listbox row "Unique Variant (<n>)" | |
| `sort-dropdown`, `sort-shown`, `sort-select`, `sort-options` | B | sort button (label "Sort By") / current label / hidden mirror (values = sort keys) / mirror options | R-515, R-516, R-519 |
| `sort-option-name`, `sort-option-manufacturer`, `sort-option-class`, `sort-option-speed`, `sort-option-seats`, `sort-option-damage` | K | sort listbox rows "Vehicle Name"/"Weapon Name" (first row), "Manufacturer", "Vehicle Class"/"Weapon Class", "Speed", "Seats", "Damage" | R-519 |
| `sort-direction` | B | button, name "Sort ascending"/"Sort descending", `data-state` asc/desc | R-520 |
| `clear-filters` | B | button "Clear Filters" | R-517 |
| `selected-filters` | B | the block holding "Clear Filters" | |
| `filters-toggle` | O | hidden element, text "Open Filter Close Filter", name "Open Filters" (vehicles) | R-537 |
| `filter-panel`, `filter-panel-content`, `filter-backdrop` | B/O | filter bar region / its content / an empty backdrop element never displayed | R-503 |
| `layout-grid`, `layout-list` | B | buttons "Grid view"/"List view" (`aria-pressed`) | R-535 |
| `products-wrapper` | B | the card area (empty when no match) | R-518 |
| `list-head` | B | list-mode header row (always present, visible in list mode) | R-535 |
| `megafilter-wrap` | B | the whole list widget | |

### 18.2 F2 — detail pages
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `breadcrumb` | B | link to the list/guide page with the label of R-603 | R-604 |
| `hero-image` | B | header images (vehicles: 2) | R-604 |
| `section-titles` | B | level-2 content headings | R-606 |
| `info-labels` (F2) | B | info row labels | R-607 |
| `stat-labels`, `stat-values`, `stat-bars` | B | statistic labels / values / bar fills | R-608 |
| `stat-bar-1` … `stat-bar-5` (`stat-bar-1`, `stat-bar-2`, `stat-bar-3`, `stat-bar-4`, `stat-bar-5`) | P | bar fills 1–5 | |
| `rating-block`, `rating-stars`, `rating-total` | B | rating group / each of the 5 stars / the rating line | R-611 |
| `favorites-button` = `fav-button` | B/A | button "Add To Favorites" | R-1401 |
| `compare-to` = `compare-button` | B/A | menu button "Compare To" (`aria-expanded`) | R-618 |
| `compare-to-menu`, `compare-to-items`, `compare-to-item-1`, `compare-to-item-last` | B/P | the menu / its links / first / last link | R-619 |
| `compare-to-item-nightblade`, `compare-to-item-sanchez` | K | the menu links "Nightblade" / "Sanchez" | R-619 |
| `variants` | B | names of variant / base-model cards | R-607 |
| `similar-title` | B | level-3 heading "Similar Vehicles" | R-612 |
| `appearances` | B | game appearance card titles | R-613 |
| `tabs` | X | none: no tab or accordion part on detail pages | R-622 |
| `comments-tabs`, `comments-sort`, `comments-editor`, `comments-placeholder`, `comments-limit`, `comments-items`, `comments-guest` | X | none (D-004); reads ignored | F2-26 |
| `not-found-sub` | B | 404 sub-heading "Get back inside the map!" (level 3) | R-010 |

### 18.3 F3 — comparison and rankings
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `compare-toggle` = `list-compare-toggle` | B/A | checkbox "Compare <name>", tooltip "Compare" | R-701 |
| `compare-toggle-1` … `compare-toggle-5` (`compare-toggle-1`, `compare-toggle-2`, `compare-toggle-3`, `compare-toggle-4`, `compare-toggle-5`) | P | toggles of cards 1–5 | |
| `compare-toggle-checked`, `compare-toggle-disabled` | S | toggles with `aria-checked` true / `aria-disabled` true | R-701, R-702 |
| `compare-bar`, `compare-count`, `compare-names`, `compare-go`, `compare-clear` | B | bar; "n/4"; names; action link ("Pick 1 more"/"Compare (n)", caps); button "Clear the comparison" | R-705, R-706 |
| `cmp-crumb`, `cmp-intro`, `cmp-board`, `cmp-note`, `cmp-links` | B | comparison breadcrumb link; intro; board; note; related link labels | R-708 |
| `cmp-add`, `cmp-add-title` | B | each "Add a …" slot / its title | R-708 |
| `cmp-picker-all` | B | every slot's combobox | R-709 |
| `cmp-picker` | S | the displayed (visible) slot comboboxes; profiles pick the first visible | R-709 |
| `cmp-source` | B | hidden list of all comparable items (one entry per item) | R-709 |
| `cmp-list`, `cmp-options`, `cmp-option-1`, `cmp-option-active`, `cmp-more` | B/P/S | the open listbox; its options; first option; highlighted option (`aria-selected` true); the "more"/"No match" row | R-710, R-711 |
| `challenge` | X | none (no bot challenge, D-007) | R-715 |
| `rank-class-select`, `rank-class-menu`, `rank-class-items` | B | button "Select Class" (`aria-expanded`); the menu; its links | R-720 |
| `rank-class-first`, `rank-class-item-1` … `rank-class-item-21` (`rank-class-item-1`, `rank-class-item-2`, `rank-class-item-3`, `rank-class-item-4`, `rank-class-item-5`, `rank-class-item-6`, `rank-class-item-7`, `rank-class-item-8`, `rank-class-item-9`, `rank-class-item-10`, `rank-class-item-11`, `rank-class-item-12`, `rank-class-item-13`, `rank-class-item-14`, `rank-class-item-15`, `rank-class-item-16`, `rank-class-item-17`, `rank-class-item-18`, `rank-class-item-19`, `rank-class-item-20`, `rank-class-item-21`) | P | menu links 1–21 (first = Boats) | R-716 |
| `rank-class-motorcycles` | K | menu link "Motorcycles" | |
| `rank-class-focused` | S | the menu link that has keyboard focus | R-720 |
| `rank-crumb`, `rank-list-title`, `rank-h2` | B | breadcrumb link; list title; every level-2 heading of the ranking content | R-717 |
| `rank-rows`, `rank-row-1`, `rank-row-1-link`, `rank-row-1-badge`, `rank-row-1-labels`, `rank-row-links`, `rank-ratings`, `rank-images` | B/P | rows; first row; its name link; its make badge; its labels ("Based on:", "Road Rating:", "Off-Road Rating:"); every row's name link; every row's rating line; every row's image | R-718 |
| `rank-content-links`, `rank-paragraphs` | B | links / paragraphs of the ranking content area | R-717 |
| `card`, `card-1-link`, `name-search` | B | as F1 (shared) | 18.1 |

### 18.4 F4 — map (F4 suite scopes `search-input`, `login-link`, `sidebar`, `panel` inside `map-root`, TA6)
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `map-root` | B | the map widget root (`data-state`: "sidebar-open", "narrow", "category:<id>" words) | R-801, R-819, R-841 |
| `sidebar` (F4 scope) | B | complementary region "Map sidebar" (`aria-hidden` true while closed) | R-841 |
| `sidebar-close` | B | button "Hide the sidebar" | R-841 |
| `sidebar-open` | B | button "Filters" (caps), tooltip "Search and filter", `aria-expanded`; displayed only while the sidebar is closed | R-841 |
| `guest-line`, `login-link` (F4 scope) | B | guest sentence / its link "Log in" (href `/login`) | R-802 |
| `search-input` (F4 scope) | B | combobox "Search locations or categories" | R-834 |
| `search-clear` | B | button "Clear the search" | R-834 |
| `search-hits`, `search-hit-first` | B/P | listbox options / the first option (`aria-selected`) | R-836, R-839 |
| `search-empty`, `category-none` | B | marker message line / category message line | R-837, R-838 |
| `group-rail` | B | each rail button (name = group name) inside navigation "Groups" | R-810 |
| `rail-robberies`, `rail-food` | K | rail buttons "Robberies", "Food & Drink" (`data-state` on/off) | R-810 |
| `show-hide-all` | B | button "Hide all"/"Show all" (caps) | R-814 |
| `hide-found` | B | button "Hide found"/"Show found" (caps) with tooltips | R-831 |
| `groups` | B | each group block | R-808 |
| `group-robberies-box`, `group-vehicles-box` | K | group checkbox "Robberies" / "Vehicles" | R-815 |
| `group-robberies-toggle` | K | the clickable group name text "Robberies" (toggles the group box) | R-815 |
| `group-robberies-fold` | K | button "Hide Robberies"/"Show Robberies" (`aria-expanded`) | R-816 |
| `group-robberies-body` | K | the rows container of Robberies | R-816 |
| `category-rows` | B | each category row | R-809 |
| `category-rows-visible` | S | rows currently displayed (not hidden by search or folding) | R-838 |
| `category-rows-tracked` | S | rows of trackable categories | R-811 |
| `category-checked` | S | row switches that are on | R-813 |
| `category-names` | B | each row's name link | R-809 |
| `cat-banks-box`, `cat-safehouses-box`, `cat-garages-box`, `cat-hidden-pkg-box`, `cat-atms-box`, `cat-gas-box` | K | switch checkbox of Banks / Safehouses / Garages / Hidden Package / ATMs / Gas Stations | R-809 |
| `cat-banks-toggle`, `cat-safehouses-toggle`, `cat-garages-toggle`, `cat-hidden-pkg-toggle`, `cat-atms-toggle`, `cat-gas-toggle` | K | the row icon of those categories (click toggles the switch) | R-809 |
| `cat-banks-name`, `cat-garages-name` | K | name links "Banks" (`?feature=bank`) / "Garages" (`?feature=garages`) | R-809, R-812 |
| `cat-banks-counter`, `cat-safehouses-counter`, `cat-atms-counter`, `cat-wrath-counter` | K | counters of Banks / Safehouses / ATMs / Liberty City Wrath (tooltip, `aria-hidden` true on trackable) | R-811 |
| `cat-safehouses-sr` | K | screen-reader counter text of Safehouses ("found f of n") | R-811 |
| `cat-garages-only`, `cat-garages-next` | K | "Only"/"All" button and arrow button of Garages | R-817 |
| `cat-atms-row` | K | the ATMs row | |
| `reset-progress` | B | button "Reset progress" | R-832 |
| `reset-dialog` | B | dialog "Reset progress" | R-832 |
| `reset-say`, `reset-select`, `reset-options`, `reset-go`, `reset-cancel` | B | dialog text / choice select / its options / button "Reset" / button "Cancel"→"Close" (caps) | R-832, R-833 |
| `clusters` | B | cluster circles (low zoom) | R-804 |
| `canvas` | B | the marker drawing surface (one canvas) | R-803 |
| `popup` = `map-popup` | B/A | the open marker popup | R-823 |
| `popup-title` = `map-popup-title`, `popup-desc` | B | popup title (caps) / description text | R-823, R-827 |
| `popup-category-link` | B | category link in the popup | R-823 |
| `popup-found-box`, `popup-found-label`, `popup-found-toggle` | B | "Found" checkbox / its label element (text "Found", caps) / the label text that toggles it | R-824, R-828 |
| `popup-navnum`, `popup-prev`, `popup-next` | B | "n / N" text (tooltip) / buttons "Previous in …" / "Next in …" | R-825 |
| `popup-zoom`, `popup-copy`, `popup-fav` = `map-fav-star` | B/A | buttons "Zoom in", "Copy link", star ("Add to favourites", `aria-pressed`) | R-824, R-826, R-1406 |
| `popup-buttons` = `map-popup-buttons` | B/A | exactly the five popup buttons (not the close control) | R-824 |
| `popup-actions` | B | children of the popup action row (the "View details" link when present) | R-823 |
| `popup-details-link` | B | link "View details" (new tab) | R-823 |
| `popup-close` | B | the popup's close control "Close popup" | R-823 |
| `popup-report` | X | none (no report button) | F4-20 |
| `suggest-open`, `own-open` = `map-personal-marker`, `contest-open`, `feedback-open` | B/A | buttons "+ Suggest location", "+ Personal marker", "Map Contest", "Feedback" (caps) | R-843, R-844 |
| `panel` = `map-panel` (F4 scope) | B/A | side panel, role dialog, name = its title | R-843 |
| `panel-title` = `map-panel-title`, `panel-close` = `map-panel-close`, `panel-links` | B/A | panel heading (caps) / button "×" named "Close" / its links ("Log in", "Join") | R-843 |
| `about-open`, `about-dialog` | B | button "About this map" / dialog "About this map" | R-845 |
| `fullscreen` | B | button "Full screen"/"Exit full screen" (name and tooltip) | R-847 |
| `map-zoom-in`, `map-zoom-out` | B | buttons "Zoom in" / "Zoom out" | R-801 |
| `tile-first` | P | the first map artwork image (src ignored) | R-801 |
| `contest-box`, `contest-close` | B | notice box / its button "Close" | R-846 |
| `static-list-groups` | B | group headings of the static list below the map | R-806 |
| `county-labels` | B | region labels on the map | R-801 |

### 18.5 F5 — checklists
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `cl-box` | B | every checklist checkbox ("Mark as completed: …") | R-901, R-910 |
| `cl-box-checked`, `cl-box-disabled`, `cl-box-labelled` | S | ticked boxes / disabled boxes / boxes whose name starts "Mark as completed" | R-902, R-910 |
| `toc-box`, `sec-box` | B | boxes in the 100% contents box / in section headings | R-904 |
| `toc-story`, `toc-kenton`, `toc-exploration` | K | contents-box copies of `story`, `kenton`, `exploration` (pattern `toc-<item id>` exists for all 38) | R-904 |
| `sec-story`, `sec-kenton`, `sec-cards`, `sec-exploration`, `sec-story-tasks`, `sec-optional`, `sec-gang-ops`, `sec-bank-jobs`, `sec-discovery`, `sec-vehicles`, `sec-weapons`, `sec-animals`, `sec-drones` | K | section-heading copies of those items (pattern `sec-<item id>` exists for all 38) | R-904 |
| `sec-exploration-children`, `sec-exploration-children-checked` | K/S | section boxes whose parent is `exploration` / those ticked | R-905 |
| `sec-story-tasks-children-checked` | K/S | ticked section boxes whose parent is `story-tasks` | R-905 |
| `pct-module`, `pct-text`, `pct-bar` | B | progress box (region) / the number / the progressbar | R-915, R-916 |
| `guest-note`, `guest-note-login` | B | guest note / its "Login" link (`/login/`) | R-916 |
| `profile-switcher`, `reset-control` | X | none | R-911, R-912 |
| `chapter-heading` | B | level-2 headings of mission list pages | R-918, R-919 |
| `mission-row`, `mission-first-row` | B/P | every mission card link / the first one | R-918 |
| `mission-row-optional` | S | cards of optional missions | R-918 |
| `mission-row-main-link`, `mission-row-strangers-link` | S | non-optional cards linking to `/gta-6/missions/…` / cards linking to `/gta-6/strangers/…` | R-918, R-919 |
| `mission-box-first` | P | the first `gta6-missions` box of the page (Prologue on the missions page) | R-918 |
| `mission-gone-fishing`, `mission-shirleys-rum`, `mission-skunk-ape` | K | the boxes of missions 7285, 7291, 7319 | R-910 |
| `activity-card` | B | activity cards | R-920 |
| `events-table-header`, `events-table-cell` | B | random-events table headers (caps) / cells | R-921 |

### 18.6 F6 — guide pages
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `section-heading` | B | level-2 headings of the guide content | R-1001 |
| `card-grid`, `guide-card`, `guide-card-link` | B | each card grid / each card / each card link | R-1002, R-1003 |
| `grid-1-cards`, `grid-2-cards`, `grid-3-cards`, `grid-4-cards` | P | cards of grid 1–4 | R-1002 |
| `grid-1-first-link`, `grid-1-first-title-link` | P | the first card's link in grid 1 (name "Read more: <name>"; both tokens on the same title link) | R-1003 |
| `grid-1-first-card` | P | the first card of grid 1 (on gangs the whole card is the link) | R-1003 |
| `grid-3-first-link` | P | the link of the **second** card of grid 3 (position kept from the recorded selector) | F6-08 |
| `plain-person-row` | B | non-link "other characters" rows | R-1002 |
| `faq-question` | B | FAQ question headings (level 3) | R-1002 |
| `card-with-price`, `card-with-location` | S | cards showing "Price:" / "Location:" | R-1002 |
| `bullet-list-1` | P | items of the first bullet list in the guide content | R-1002 |
| `rlta-any` | B | any part of an accordion component (none on guide pages) | R-1001, R-1022 |
| `tabs-script`, `table-controls`, `cheat-copy-or-filter` | X | none on guide pages: no tab script element, no input/select/sort header in radio tables, no form control in cheat article bodies | R-1001, R-1011, R-1013 |
| `map-banner-link` | B | link "Interactive GTA 6 Map & Collectibles Tracker" | R-1005 |
| `inline-gallery` | B | embedded gallery blocks | R-1005 |
| `station-row` | B | each station block | R-1013 |
| `station-without-tracks` | S | station blocks without any playable row | R-1014 |
| `tracklist-header` | P | header cells of the first station's table ("#", "Track", "Play") | R-1013 |
| `track-play` | B | every row Play button | R-1014 |
| `track-play-visible`, `track-play-hidden`, `track-play-pause-state` | S | displayed buttons / buttons not displayed (rows without clip) / the button currently reading "Pause" | R-1014, R-1017 |
| `s1-track1-play`, `s1-track2-play`, `s1-track3-play`, `s1-last-play` | P | Play buttons of station 1 rows 1, 2, 3 and last | R-1017 |
| `s1-track1-title`, `s1-track2-title`, `s1-track3-title`, `s1-last-title`, `s1-track1-artist` | P | titles of those rows / artist line of row 1 | |
| `s3-first-play`, `s3-second-play`, `s3-first-title`, `s3-second-title` | P | Play buttons / titles of the first and second **playable** rows of station 3 | R-1017, R-1018 |
| `floating-player`, `player-title`, `player-artist` | B | the bottom bar / current title / current artist line | R-1013 |
| `player-toggle`, `player-toggle-icon`, `player-next`, `player-prev` | B | buttons "Play/Pause" (icon `data-state` playing/paused), "Next track", "Previous track" | R-1013, R-1017 |
| `player-time`, `player-duration` | B | elapsed / total "m:ss" | R-1020 |
| `youtube-iframe` | B | the hidden player element added when the audio player is ready (name kept for compatibility, D-009) | R-1016 |
| `cheat-row`, `cheat-category` | B | cheat rows / category headings (caps) | R-1009 |
| `cheat-category-1-rows`, `cheat-category-3-rows` | P | rows of category 1 / 3 | |
| `first-cheat-name`, `first-cheat-desc`, `first-cheat-unlock`, `first-cheat-keys`, `first-cheat-key-1`, `first-cheat-key-2` | P | first cheat's name / effect / "How to unlock: …" / its direction images / images 1 and 2 | R-1009 |
| `cheat-key-icons`, `cheat-key-up`, `cheat-key-other` | B/S | all direction images / those with alt "UP" / images with any alt other than UP, DOWN, LEFT, RIGHT (none) | R-1009 |
| `howto-step-icons`, `howto-icon-2`, `howto-icon-3` | B/P | images inside the "How to enter" steps / the 2nd / the 3rd (alt "L1"/"R1" or "LB"/"RB") | R-1010 |
| `platform-link`, `platform-current`, `platform-xbox`, `platform-ps5` | B/S/K | switcher cards / the current one (with "You are here") / the Xbox card / the PS5 card | R-1011 |
| `pc-platform-table-link` | B | links in the PC page's 3-cell table | R-1012 |
| `body-link-pc`, `body-link-ps5`, `body-link-xbox` | S | links inside the article body to the PC / PS5 / Xbox page | R-1011, R-1012 |
| `menu-button` = `menu-toggle` | A | phone "Menu" button | R-1305 |
| `acc-container`, `acc-button`, `acc-open`, `acc-panel-open` | B/S | accordion container (`data-state` ready) / headers / headers with `aria-expanded` true / open panels | R-1022..R-1026 |
| `acc-1`, `acc-2`, `acc-3`, `acc-last` | P | headers 1, 2, 3 and last | |
| `faq-section` | B | the membership FAQ section | R-1408 |

### 18.7 F7 — article lists and articles
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `page-number` | B | the " - Page N" suffix element inside the h1 | R-1108 |
| `list-intro`, `list-banner` | B | description block / banner image (news page 1, videos) | R-1103 |
| `list-item` | B | each list item (article) | R-1105 |
| `item-title-link`, `item-thumb`, `item-thumb-link` | B | title link (in a level-2 heading) / 320×180 thumbnail / its link | R-1105 |
| `item-details-label` | B | the visually hidden term "Details" | R-1105 |
| `item-author`, `item-date`, `item-category`, `item-tags` | B | "by <author>" / date element (machine date) / category link / tag badges | R-1105 |
| `parent-category` | B | link "Rockstar Games News & Guides" → `/news/` | R-1103 |
| `game-filter-toggle`, `game-filter-menu`, `game-filter-links`, `game-filter-gta6` | B/K | menu button "Filter by Game" / its menu / its 8 entries / the "GTA 6" entry | R-1104 |
| `page-counter` | B | "Page N of M" | R-1107 |
| `page-links` | B | every link in the pager (numbers and icon links) | R-1107 |
| `page-current` | S | the current page link ("Page N", `aria-current`, href "#") | R-1107 |
| `page-disabled` | S | disabled pager entries | R-1107 |
| `page-first`, `page-prev`, `page-next`, `page-last`, `page-2-link` | K | links "Go to first page", "Go to previous page", "Go to next page", "Go to last page", "Go to page 2" (absent when disabled) | R-1107 |
| `article-meta`, `article-author`, `article-published`, `article-modified`, `article-category` | B | meta list / "by …" / published date / "Last Updated" date / category link | R-1111 |
| `article-hero` | B | hero image | R-1111 |
| `author-block` | B | author box | R-1113 |
| `related-block`, `related-heading`, `related-cards` | B | related box / its heading (caps) / its cards | R-1114 |
| `article-end` | B | the last element of the article body (scroll target that reveals the pager) | R-1114 |
| `comments-count`, `comment-sort-options`, `comment-sort-current`, `comment-editor`, `comment-limit` | X | none (D-004) | F7-27 |

### 18.8 F8 — galleries
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `media-tab`, `media-tab-active` | B/S | tab-bar links / the current one | R-1201 |
| `media-tab-trailers`, `media-tab-artworks`, `media-tab-videos` | K | tab links "Trailer Screens", "Artworks", "Videos" | R-1201 |
| `gallery-heading` | B | block headings (artworks) | R-1202 |
| `thumb`, `thumb-img` | B | each thumbnail wrapper / thumbnail image | R-1203 |
| `thumb-img-lazy` | X | none (thumbnails are eager) | R-1203 |
| `thumb-1`, `thumb-3`, `thumb-5`, `thumb-100`, `thumb-1-img` | P | clickable thumbnails 1, 3, 5, 100 of the page (page order) / first thumbnail image | R-1205 |
| `g1-thumb`, `g2-thumb`, `g3-thumb` | P | thumbnails of block 1, 2, 3 | R-1207 |
| `g2-thumb-1`, `g1-thumb-2` | P | first clickable thumbnail of block 2 / second of block 1 | R-1205 |
| `g1-active-thumb`, `g1-thumb-2-active`, `g1-active-thumb-img` | S | active thumbnail(s) of block 1 / the first active one / its image | R-1205, R-1211 |
| `g1-main-active`, `g1-main-active-img`, `g1-main-next` | P | block 1's clickable main image / its image / its "next" button | R-1205 |
| `main-image`, `main-slideshow`, `image-description` | B | clickable main image (any block) / main-image area (absent on grid pages) / caption under a cover image | R-1202 |
| `lb-counter`, `lb-total`, `lb-next`, `lb-prev`, `lb-close` | B | counter "k/N" / the N element / "next" / "previous" / "close" | R-1206 |
| `lb-caption`, `lb-bottom`, `lb-image` | B | caption text / caption strip / current large image | R-1206, R-1211 |
| `lb-slot`, `lb-loaded-image` | B | lightbox slots (one per image) / created large images | R-1210 |
| `lb-toolbar-action`, `lb-download` | B | the three action buttons / "Download" | R-1206 |
| `page-scroll-lock` | S | the document root while a lightbox is open | R-1208 |
| `pagination-item`, `pagination-active`, `pagination-disabled` | B/S | items of the first gallery pagination / the current item / disabled items | R-1204 |
| `pagination-page-2`, `pagination-next`, `pagination-last` | K | links "Go to page 2", "Go to next page", "Go to last page" of the first pagination | R-1204 |
| `modal-trigger`, `modal-trigger-login` | B | the two "Log In" controls of the shell (header, phone account menu) | R-1215 |

### 18.9 F9 — hub and shell (F9 suite scopes `search-input` to the header search panel and `login-link` to the header)
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `skip-links` | B | the three skip links | R-1301 |
| `site-logo` | B | logo link to `/` named "Leonida Atlas" | R-1302 |
| `main-menu`, `menu-top-links` | B | main menu list / its top-level links | R-1303 |
| `menu-gta6`, `menu-gta6-sub`, `menu-gta6-sub-links`, `menu-gta6-characters` | K | "GTA 6" link / its sub-menu / its 11 links / the "Characters" link ("GTA 6 - Characters") | R-1303 |
| `menu-more`, `menu-more-sub` | K | "More" entry (href "#") / its sub-menu | R-1303 |
| `menu-toggle` | B | phone button "Menu" (`aria-expanded`; hidden on desktop) | R-1305 |
| `submenu-toggles`, `submenu-toggle-gta6` | B/K | the four disclosure buttons / the one of "GTA 6" | R-1304, R-1305 |
| `game-subnav-links`, `subnav-current` | B/S | the 18 sub-navigation links / the one with `aria-current="page"` | R-1306 |
| `search-toggle`, `search-panel`, `search-input` (F9 scope), `search-submit`, `mobile-search-input` | B | button "Search" / panel / textbox (placeholder "Search …", name q) / button "Search" / phone-menu textbox | R-1305, R-1307 |
| `login-link` (F9 scope) = `header-login` | B/A | header control "Log In" | R-1302 |
| `join-link` = `header-join` | B/A | header link "Join" → `/membership/free/` | R-1302 |
| `login-modal-close` = `modal-close`, `login-heading` = `login-title` | A | dialog close button "close" / dialog title | R-303 |
| `user-dropdown-toggle` = `mobile-join-toggle`, `user-dropdown-items` | B/A | phone account menu button / its items | R-1305 |
| `lang-switcher`, `lang-links`, `footer-social` | X | none (D-006) | R-1302, R-1312 |
| `footer-links`, `footer-copyright`, `footer-game-menu` | B | six bottom links / copyright line / the 10 GTA 6 links | R-1312 |
| `countdown`, `countdown-title`, `countdown-timer`, `countdown-digits` | B | countdown box / heading (caps) / timer area / each digit field (none after release) | R-1318 |
| `info-title`, `info-labels` (hub), `info-values`, `info-links` | B | info box title (caps) / labels / values / value links | R-1315 |
| `hub-section-headings`, `hub-cards`, `hub-card-titles` | B | hub level-2 headings / card links / card titles (caps) | R-1314 |
| `hub-news-items`, `hub-news-dates`, `hub-all-news-link` | B | latest-news items / their "Published on …" lines / link "All GTA 6 news & updates" | R-1314 |
| `sidebar-latest` | B | side column block "Latest GTA 6 Content" | R-1313 |
| `content-links`, `content-list-items` | B | links / list items inside the main content area (404: no links, three reason items) | R-010 |

### 18.10 F10 — favorites and accounts
| Token | Kind | Element — role — accessible name / label | Meaning |
|---|---|---|---|
| `fav-button`, `fav-button-role` | B | button "Add To Favorites" (`type="button"`, `aria-pressed`); `fav-button-role` = the same button (exact accessible name match) | R-1401, R-1402 |
| `compare-button` | A | = `compare-to` | R-618 |
| `modal-root` | A | = `login-modal` | R-302 |
| `login-title` | A | = `login-heading` (dialog title) | R-303 |
| `login-benefits` | X | none (no favorites context, D-002) | R-1409 |
| `header-login`, `header-join` | A | = `login-link` (F9 scope), `join-link` | R-1302 |
| `mobile-join-toggle`, `mobile-login` | B | phone account menu button / its "Log In" item | R-1305 |
| `list-fav-control` | X | none on list pages | R-1404 |
| `map-popup`, `map-popup-title`, `map-popup-buttons`, `map-fav-star` | A | = `popup`, `popup-title`, `popup-buttons`, `popup-fav` | 18.4 |
| `map-panel`, `map-panel-title`, `map-panel-close` | A | = `panel`, `panel-title`, `panel-close` | 18.4 |
| `map-panel-text`, `map-panel-login`, `map-panel-join` | B | panel paragraph / its link "Log in" / its link "Join" (new tab) | R-843 |
| `map-personal-marker` | A | = `own-open` | R-843 |
| `plan`, `plan-title`, `plan-price`, `plan-recommended` | B | plan cards / titles / price lines ("Coming later") / the badge on the yearly card (own text) | R-1408 |
| `plan-free-features`, `plan-vip-year-features`, `plan-vip-month-features` | K | feature titles of the Explorer / Supporter yearly / Supporter monthly cards | R-1408 |
| `plan-free-favorites`, `plan-free-checklists`, `plan-free-collection`, `plan-vip-map`, `plan-vip-profiles` | K | subtitles of the features "Favorites", "Checklists & Progress Tracker", "GTA 6 Collection" (Explorer) and "Interactive Map Extras", "Multiple Profiles per Game" (Supporter yearly) — own subtitles | R-1408 |
| `table-header` | B | column headers of tables in the main content | — |
| `page-form-input` | B | visible form inputs inside the main content (none on `/login/`) | R-306 |

### 18.11 Rebuild-only tokens for recorded steps/reads that used raw selectors of the original
The case files contain a few raw selectors of the original markup (they will never match the rebuild); the vector
profiles should rewrite them to these tokens:
| Token | Element | Replaces the raw selector in |
|---|---|---|
| `sec-<item id>` for every 100% item (e.g. `sec-waink`, `sec-underwater`, `sec-magazines`, `sec-meditation`, `sec-flamingos`, `sec-playlists`, `sec-styles`, `sec-races`, `sec-race-challenges`, `sec-shooting`, `sec-video-games`, `sec-pool`, `sec-mini-golf`, `sec-basketball`, `sec-stunts`, `sec-challenges`, `sec-target-decks`) and `toc-<item id>` | section / contents copies of each item | macro `tick-all-exploration` (F5-07) |
| `walkthrough-box` | the "Mission Completed" box of a walkthrough page | F5-35, F5-38 |
| `mission-row-text` | the description text inside a mission card (clicking it opens the walkthrough) | F5-35 |
| `search-hit-cat` | the "<Category> #n" line of a map search option | reads of F4-35, F4-40, F4-45 |
| `reset-title`, `group-names`, `panel-pills`, `contest-login`, `info-panel-links`, `days` | reset dialog heading / group name texts / popup pill buttons / notice log-in link (none in the rebuild) / About dialog links / countdown days field | reads of F4-02, F4-29, F4-56, F4-70, F4-73, F9-01 |
| `article-info-term` | the visually hidden "Details" term on article pages | F7-48 |
| `rank-content` | the ranking content area | F3-52 |

---

## 19. Module contract (own architecture)

Folder `leonida-atlas/`. Three builders own exclusive folders; they communicate only through the public index
files named below. Interfaces are given in words (inputs, outputs, edge cases), not as code.

### 19.1 Data builder — `src/data/**`
Deterministic sample data (section 16) generated at module load from own word lists and a seeded generator; no
network, no randomness at runtime. Public entry `src/data/index.ts` exports:
- **Types**: Vehicle, Weapon, VehicleClass, WeaponClass, Manufacturer, StandoutSet, Animal, Character, Gang, Property,
  RadioStation, Track, Mission, Activity, RandomEventRow, Cheat, CheatCategory, ChecklistItem, MapGroup, MapCategory,
  Marker, Article, ArticleSection, GuideEntry, Gallery, GalleryImage, HubCard, HubInfoRow, FaqItem, Plan,
  SearchDocument, ListEntry, ListConfig, ArtDescriptor, AudioClip (fields of section 1.1).
- **Catalogues**: `vehicles`, `weapons` (catalogue order, R-1606); `vehicleClasses`, `weaponClasses` (tile order);
  `manufacturers`; `standoutSets` (configured order); `animals`, `characters`, `gangs`, `properties`, `radioStations`,
  `missions`, `activities`, `randomEvents`, `cheats`, `cheatCategories`, `checklist100` (page order), `mapGroups`,
  `mapCategories` (config order), `markers`, `articles`, `guideSectionLinks`, `galleries`, `hub`, `plans`,
  `membershipFaq`, `audioClips`.
- **`listConfig(list)`** — for "vehicles"/"weapons": filters (title, placeholder, hash key, kind, option source),
  sort fields (label, hash key, entry field, numeric or text), defaults (field, direction), plural noun, card label set.
  Exactly the keys and labels of R-505.
- **`getListIndex(list)`** — compact ListEntry per item in catalogue order: slug, compareKey, canonicalPath, name, make
  id + label, class ids + labels, standout set id (or `hide-standouts`), weapon type id, realLife, stats, ratings,
  seats, price, edition badges, image descriptor id. Edge: values missing stay missing (never 0).
- **`getItemByPath(list, slug, pathForm)`** — any detail type; returns the item or nothing (unknown slug → nothing);
  accepts both path forms; also reports the item's canonical path.
- **`getNeighbours(list, slug)`** — previous/next in catalogue order; none at the ends.
- **`getCompareToEntries(list, slug)`** — same primary class (vehicles) / weapon class (weapons), excluding the item,
  A→Z by name ignoring case.
- **`getSimilarVehicles(slug)`** — up to 6 base vehicles of the same primary class and style.
- **`getVehicleClassByPageSlug(pageSlug)`**, **`getVehicleClassById(id)`** — or nothing.
- **`getVehiclesOfClass(classId)`** — vehicles having the class (unordered; rules order them).
- **`getCategoryByLinkKey(key)`** — the map category whose link key equals key, or nothing.
- **`getArticleByPath(pathForm, slug)`**, **`listArticles(list)`** — list ∈ news, guides, videos, all; returns the raw
  members (guides: guide articles + section links); ordering and paging are rules.
- **`getGallery(id)`** — images in display order.
- **`latestContent(limit)`** — side-column items (R-1313).
- **`searchDocuments()`** — one document per searchable thing: type, title, extra text, path.
- **`artFor(kind, id)`** — ArtDescriptor (width, height, palette indices, motif, label) for placeholder images.

### 19.2 Rules builder — `src/lib/**` (pure modules + vitest unit tests next to them)
Every function is pure (inputs → outputs) except the thin storage helpers; each rule cites its R-ids in its tests.
Public entry `src/lib/index.ts`. Modules and contracts:
- **list-hash** — `parseListHash(hash)`: ordered key/value pairs from "#…" (pieces with exactly one "=", values
  URI-decoded). `normalizeListHashOnLoad(pairs, config, validOptions)`: appends missing `sort`/`sortdir` defaults,
  forces a non-"desc" direction to "asc", reports which filter values are valid and whether any was applied (then the
  caller writes `page=1`), keeps unknown keys and values (R-522, R-526). `applyFilterChange(pairs, filterValues)`:
  in-place update / append / remove of filter keys and `page=1` last (R-527). `applySortChange(pairs, field, dir)`:
  in-place (R-528). `serializeListHash(pairs)`: "#k=v&…" with URI-component encoding, multi values joined by ","
  before encoding, `page` last (R-525). Edge cases: empty hash, duplicate keys (first wins), "=" inside values.
- **list-filter** — `textMatches(query, value)`: R-508/R-509 (contains, case-insensitive, untrimmed, literal, one-way
  folding; empty query matches all; missing value never matches a non-empty query). `filterEntries(entries, state,
  config)`: OR inside a choice filter, AND across filters (R-511). `optionCounts(entries, state, config, filterKey)`:
  R-512. `activeFilterCount(state)`. Limit 128 characters is enforced by the UI.
- **list-sort** — `compareEntries(a, b, sortKey, direction, config)` and `sortEntries(...)`: R-521 (empty last in both
  directions, name tie-break, class by label, numeric vs text). Unknown sort key → name ascending (R-522).
- **list-paging** — `renderedCount(total, batchesShown)` (100 per batch), `nextBatchesShown(...)`, constant
  approach distance 400 px (R-523).
- **list-memory** — `listMemoryKey(path)` = "jamg-hash:" + path; `chooseInitialHash(navigationType, urlHash, saved,
  defaults)`: saved wins only on back/forward when different; plain visit → URL hash or defaults (R-530, R-531).
- **class-tiles** — `nextPickedTiles(picked, clicked, modifierHeld, viaAddButton)`: switch / add / remove (R-510),
  keeps pick order.
- **dropdown-search** — `wordStartMatches(label, typed)` (case-insensitive, no folding), `noResultsText(typed)`
  (R-515).
- **compare** — `compareStorageKey(listPath)`; `readPicks(raw)` (bad JSON → empty); `togglePick(picks, {id, name})`
  (append/remove, limit 4, 5th ignored); `isToggleDisabled(picks, id)`; `compareBarLabel(count)` ("Pick 1 more" /
  "Compare (n)"); `compareLink(listPath, type, picks)` (sorted by code-unit order, numbered; "#" under 2) (R-703..R-707);
  `canonicalComparison(params, type, knownKeys)` → keys + whether to redirect (R-713); `removeFromComparisonHref(keys,
  key, ...)` (R-714).
- **picker** — `normalizeForPicker(text)`; `pickerResults(query, items, excludedKeys)` → up to 150 rows + remaining
  count + no-match flag (R-710); `wrapIndex(index, delta, length)` (R-711); `pickHref(slotUrl, param, key)` (R-712).
- **rankings** — `classPageSlug(label)`, `classPluralLabel(label)`, `classMenuTooltip(plural)`,
  `orderRankingRows(rows)` (road rating desc, unrated last, catalogue order ties), `ratingLine(road, offroad)`
  (R-716..R-719).
- **checklist** — `checklistPercentage(items, tickedIds)` (R-914; multipliers, limits, groups, recursion, count once);
  `displayPercentage(value)` → text with two decimals, clamped width, valuenow (R-915); `cascadeToggle(items,
  tickedIds, clickedId)` → new ticked set + changed ids in storage order (R-905, R-906); `applyGuestChecklistChange(raw,
  listId, changes)` → new raw text, `{}` when empty (R-906); `checkboxLabel(rowText)` (R-910); `stripProfileHash(hash)`.
- **map-store** — `readFoundIds(raw)`; `setMapFound(raw, ids, on)` → new raw text or "remove key" (R-828);
  `multiSpawnGroup(markers, id)` (clicked first, then list order) (R-829); `categoryCounter(markers, foundIds,
  categoryId, trackable)` → visible text, screen-reader text, tooltip (R-811); `mapFilterRecord(state)` → JSON text in
  the key order of R-820 or "remove key"; `readMapFilter(raw)`; `mapViewRecord(center, zoom, nowMs)` (rounding) and
  `restoreMapView(raw, nowMs, bounds)` (60 days, clamp 0–8) (R-840); `noticeClosedValue(start, end)` (R-846).
- **map-order** — `collectingOrder(markers)` (R-825 algorithm), `markerNumbers(order, multiSpawn)`, `stepMarker(order,
  id, ±1)` with wrap, `navLabels(category, target, number)`, `numberTooltip(n, trackable)`.
- **map-search** — `normalizeMapText(text)`; `editDistance(a, b)` (adjacent swap = 1); `searchMarkers(query, markers,
  categories)` → ordered hits (max 30) + total (R-836); `visibleCategoryRows(query, categories, groups)` (R-838);
  `mapSearchMessages(rawQuery, totalHits, rowsLeft)` (R-837).
- **map-ui** — `linkKey(category)`, `resolveFeatureKey(key, categories)` (R-812, R-819); `allButtonWord(previousWord,
  onCount, total, afterOnly)` (R-814); `foundButton(hiding)`; `onlyButton(name, isOnly)`; `foldButton(group, open)`;
  `groupBoxState(onInGroup, size)`; `resetDialogText(foundByCategory, chosenCategory)`, `resetOptions(...)`,
  `resetDoneText(n)` (R-832, R-833); `copyLinkValue(pageUrl, markerId)` (R-826); `parseSpotHash(hash)`.
- **news** — `orderArticles(articles)` (R-1102); `pageCount(total)` (30 per page); `pageSlice(items, page)`;
  `pageFromStart(offset, total)` (past the end → last page, empty slice) (R-1106); `listPageHref(listUrl, page)` (page
  1 = list URL); `pagerModel(current, last)` → entries with disabled flags and window (R-1107);
  `articleNeighbours(orderedArticles, slug)` (R-1114).
- **format** — `formatLongDate(iso)` (UTC, R-401), `dateLine(kind, iso)` (R-402), `formatPrice(n)`, `cardStatText(value,
  scale)`, `detailStatText(value)`, `ratingText(avg, votes)` (R-410), `countNoun(n, plural)` (R-403), `formatTime(seconds)`
  (R-408), `headingSlug(text)` (R-413).
- **titles** — `detailTitle(type, h1, classNoun, uniqueVariantName)` (R-603), `oneCategoryMapTitle(singular, count)`,
  `oneCategoryMapHeading(singular)` (R-819), `rankingTitle(plural)` (R-717), `listPageTitle(name, page)` (R-414),
  `breadcrumbLabel(type)` (R-603).
- **countdown** — `countdownState(nowMs, timezoneOffset)` → four two-digit fields or "out" (R-1318).
- **gallery** — `counterText(k, n)`, `nextIndex(k, n)`, `prevIndex(k, n)`, `preloadSet(k, n, alreadyLoaded)`
  (±2, wrap) (R-1209, R-1210); `galleryPaging(total, thumbLimitstart)` → page, pages, slice; `galleryPageHref(path, page)`
  (R-1204).
- **radio** — `playableTracks(station)`, `initialCurrent(stations)`, `nextTrack(current, stations)`, `prevTrack(...)`
  (wrap inside the station) (R-1014..R-1018); action-lock timing constant 3 s.
- **favorites** (HYPOTHESIS) — `readFavorites(raw)`, `toggleFavorite(raw, listKey, key)` → new raw or "remove key",
  `isFavorite(raw, listKey, key)`, `recentFavorites(raw, limit)` (R-1402..R-1405).
- **search** — `localSearch(query, documents)` → grouped results and the message of R-1308.
- **back-to-top** — `backToTopState(scrollY, previousState)` (300/1200 px, sticky faded) (R-1309).
- **storage** — `safeRead(key, area)`, `safeWrite(key, value, area)`, `safeRemove(key, area)`: never throw (R-1508).

### 19.3 UI builder — `src/app/**`, `src/components/**`, `public/**` (phase 6)
- Pages and route handlers for every route of section 0, including the request-level redirect layer (Next.js 16
  request proxy file, formerly "middleware") for R-002..R-004, `/gta-6`, `/login`, `?i=`, `?class=` and comparison
  canonicalisation, HTTP 404 via the framework's not-found mechanism, and the `/art/<kind>/<id>.svg` handler that
  renders ArtDescriptors.
- The shell (header, menus, sub-navigation, side column, lazy footer, back-to-top, accounts-later dialog), every
  feature UI of sections 5–14, the interaction model of section 15 and the own design of section 20.
- The test attribute contract TA1–TA8 and every token of section 18.
- The radio audio clips: generated once by a small script into `public/audio/` (own synthesized tones, 6–12 s,
  deterministic) from `audioClips`.
- Uses only `src/data/index.ts` and `src/lib/index.ts`; never re-implements a rule that exists in `src/lib`.
- Makes the vectors pass with the parity profiles in `tests/e2e/profiles/` (switched to the word-match operator, TA1),
  except the readouts listed as divergences (section 21) or data.

---

## 20. Own design (clean room)

- D-UI-1 **Name and voice**: "Leonida Atlas — a fan-made field guide to GTA 6". Friendly, concise, second person; no
  copied prose. Footer line: "© 2026 Leonida Atlas · Fan-made, not affiliated with Rockstar Games · All data on this
  site is invented sample data."
- D-UI-2 **Logo**: own simple SVG — a stylised compass rose (four long and four short points, deep teal, with a
  lagoon-teal inner ring) whose north point is crossed by a single curved palm leaf in sunset coral; wordmark
  "Leonida Atlas" in Space Grotesk to its right; a square favicon of the rose alone. No resemblance to any game or
  site logo.
- D-UI-3 **Palette** (tokens): ink `#14161B` (text, dark header and footer background), deep teal `#0E4D4F`
  (primary buttons, links on light), lagoon `#1F8A8A` (accents, focus ring on dark, bars), sunset coral `#FF6A4D`
  (highlights: badges, active states, the "best" value in comparisons, map found accent), sand `#F6EEDF` (page
  background), white `#FFFFFF` (cards, dialogs). Derived tints only by opacity. Text contrast ≥ 4.5:1 everywhere.
- D-UI-4 **Fonts**: "Space Grotesk" (headings, buttons shown in capitals, counters) and "Inter" (body), both SIL Open
  Font License, loaded through `next/font` (self-hosted at build time).
- D-UI-5 **Layout and components**: light theme with a dark ink header and footer; content max width 1240 px; right side
  column 320 px on desktop; generous rounded cards (radius 16 px, 1 px sand-dark border, soft shadow on hover); pill
  buttons (radius 999 px); stat bars 8 px tall, lagoon fill on a sand track, coral for "best"; badges as small coral
  pills; tables with sand zebra rows; focus ring 2 px lagoon with 2 px offset.
- D-UI-6 **Imagery**: every image is a generated SVG placeholder from its ArtDescriptor — a two-colour gradient from the
  palette, a simple geometric motif chosen by kind (vehicle: stylised silhouette blocks; weapon: horizontal bars;
  animal: leaf/wave; person: circle-and-arc bust; place: horizon lines; screenshot/artwork: layered dunes and sun) and a
  small caption label; manufacturer logos are monogram roundels (first letters of the make). The map is an own invented
  island outline with lagoons, roads as thin sand lines and five county labels, drawn as SVG and rasterised or tiled
  by the UI builder. Icons: own minimal line icons (star, compass, arrows, play/pause, D-pad directions, controller
  buttons L1/R1/LB/RB drawn as labelled keycaps).
- D-UI-7 **Motion**: 150–300 ms ease-out transitions; none when reduced motion is preferred (R-1510).
- D-UI-8 **Wording**: own headings, intros, descriptions and FAQ answers (W2); functional labels as quoted in this spec
  (W1).

---

## 21. Divergences register

"Vectors affected" lists recorded cases whose readouts will differ by design; they should be marked in
tools/normalize.json (`notComparable` or `ignore`) or reported as expected in the parity report.

| Id | Area | Original | Rebuild | Reason | Vectors affected |
|---|---|---|---|---|---|
| D-001 | Accounts | member login dialog with username/password, social sign-in, member sync of progress | own "accounts are coming later" dialog, no fields, no requests; member-only controls open it | no backend in v1 | F9-27 (title), F10-12..F10-14, F10-19, F10-24 (title), F10-32 |
| D-002 | Favorites | member-only; guests get a login prompt (detail pages) or a members panel (map star) | browser-local favorites in `atlas-favorites`, button toggles "Favorited", map star toggles pressed — **HYPOTHESIS** | useful without accounts | F10-02..F10-08, F10-11, F10-15..F10-18, F10-23..F10-25, F4-49 |
| D-003 | Search | `/search?q=` redirects to an external web search | local results page over the sample data | no third-party redirect | F9-21..F9-25 |
| D-004 | Comments | comment widget (read and write) | placeholder "Comments are coming later." | no backend | F2-26, F7-27/F7-47/F7-48 comment readouts |
| D-005 | Rating | star voting (token fetch on hover, write) | read-only average and count, no request | no backend | F2-11, F2-12 (`calls`) |
| D-006 | Third parties | ads, analytics, share widgets, translation switcher, social links | none; own "Copy link"/"Share…" actions | clean room, privacy | share/lang/social readouts (F2, F7, F9-12, F9-31) |
| D-007 | Comparison URLs | every comparison URL with a query answered a bot challenge to automation | comparison renders directly | no bot protection layer | F3-15, F3-26..F3-29 (already notComparable) |
| D-008 | Filled comparison | not observable (UNKNOWN, U-F3-01) | own board design (R-714), canonical redirect (R-713, HYPOTHESIS) | evidence gap | none recorded |
| D-009 | Radio | hidden video-service player | own short local audio clips; readiness marker keeps the token `youtube-iframe` | no third-party embeds | F6-09/F6-10 `calls`/`blocked`; F6NY-* need the clips blocked to reproduce "not ready" |
| D-010 | Accessibility | hover-only menus, menu toggle without role/name, favorites name with icon glyph, "Clear Filters" not a button, toggle nested in a link, constant direction tooltip, bar without progressbar role, accordion arrows broken | disclosure buttons, real "Menu" button, exact "Add To Favorites", button roles, toggle outside the link, direction names, progressbar role, focus-moving arrows/Home/End | accessibility | F10-01 `count:fav-button-role` (0 → 1); F1 sort-direction title (ignored); F9 menu-toggle role (ignored) |
| D-011 | List deep links | `page=N` started rendering at item (N−1)×100+1 | `page` kept in the URL, rendering starts at the top | quirk (U-F1-02) | F1-44 (already notComparable) |
| D-012 | Scope: other games | main menu and footer list other games; `/news/` covers all games; a member rankings page; Feedback → contact page; "Features Recap" leaves the section; `/` is the all-games home | own menu (Home, News, GTA 6, Database, Media, More), footer with rebuild pages, other games disabled in "Filter by Game", `/mybase/gta-online/` 404, own Feedback panel, own front page | v1 = GTA 6 section only | F9-04/F9-13 `list:menu-top-links`, F9-31 footer, F9-38 (title), F7-21 (entries disabled), F10-31 |
| D-013 | Rankings | unknown `?class` rendered an empty page without h1 | 404 | U-F3-05 | F3-40, F3-46, F3-52 |
| D-014 | Rankings | `/best-vehicles/` showed the Super heading over the Sports rows | Super heading and Super rows | inconsistency (F-F3-07) | F3-30 (`attr:rank-row-1-link@href`) |
| D-015 | News pager | "last page" link pointed to the other category alias because `/gta-6/news/page-M` was 404 | last link `/gta-6/news/page-M`, which exists | quirk (F-F7-03) | F7-02, F7-04 (`attr:page-last@href`), F7-06 (url) |
| D-016 | Membership | paid plans with prices and sign-up links | structure only: own plans, "Coming later", buttons open the accounts-later dialog | no accounts/payments | F10-27..F10-29 |
| D-017 | Wording | original headings, intros, guest notes, 404 reasons, panel texts, contributor credits | own wording (W2); no contributor names | clean room, personal data | `heading`/`title` (already ignored), F4-01 `text:guest-line`, F5-01 `text:guest-note`, F9-35 `list:content-list-items` |
| D-018 | Map member actions | Suggest/Personal marker/Contest/About ask the server first (blocked → "The server did not answer…") | accounts-later panel without request; About is local | no backend | F4-46..F4-48 (`text:panel`), F4-70 (`blocked`), F10-26 |
| D-019 | Map reset | asks the server first (blocked → failure text) | local reset succeeds, "Done: …" | no backend | F4-33 |
| D-020 | Map notice | time-boxed "Map Contest" notice with log-in link | own notice with the same close-and-remember mechanism | no contest | F4-73 texts (ignored) |
| D-021 | Lazy accordion | an accordion rendered after initialisation stayed inert | always initialised | bug | F6-39 |
| D-022 | Videos | embedded video-service player | own placeholder player | no third-party embeds | F7-19 (`count:video-embed` kept, title ignored) |
| D-023 | Brand | the original site's name and logo | "Leonida Atlas" | own brand | F9-37 `attr:site-logo@title` |
| D-024 | Lightbox actions | download, Facebook, Twitter | download, copy link, native share | no third-party widgets | none (count kept at 3) |
| D-025 | Map credits | popup credits with contributor names; "NEW" badges | none | personal data; sample data | none recorded |
| D-026 | Login page | form with Discord/Google buttons, username, password | accounts-later message, no inputs | no accounts, never collect credentials | F10-32 |

### Open points the rebuild decides (summary)
UNKNOWN on the original, with the rebuild's choice: filled comparison layout (R-714), comparison query handling
(R-713), rating format and singular (R-410), class nouns beyond three (R-603), pager window beyond 10 pages (R-1107),
lightbox control fading (R-1213), map zoom bounds (R-805), map sub-path 404 (R-848), singular category names (R-1609),
news tie-break (R-1102), breakpoints (R-1509), phone menu breakpoint (R-1305), search page texts (R-1308), favorites
(D-002).
