# F9 — GTA 6 hub + site shell (feature id `f9-shell`)

Observed 2026-11-23 on https://www.gtabase.com as a guest (never signed in). Analysis side of the clean-room
wall: file:line references point at the site's downloaded scripts; the "Behavior summary" is plain language.

Scope: the hub `/gta-6/` (info box, release countdown, section cards, latest news) and the shell around every
GTA 6 page: header (logo, main menu with dropdowns, game sub-navigation, search, language switcher, MyBase
buttons / login modal), phone menu at 390x844, footer, breadcrumbs, back-to-top, 404 page, `<title>` pattern.
The language switcher (gptranslate) is out of scope beyond noting that it exists.

## T1 Explain (static)

REA evidence: **ev_4d3b173dab2581bf14118fbdcccd4dcb4dc76dbc63a5c313ae530db4ea9f2547** (javascript-routes summary view)
of parent **ev_691e339c2bba753eebd830e99a29fa665042828d8ea999392042b526e250e438**
(`analyze-javascript-application` on evidence/bundle/all, 6 selected sources parsed complete, 0 route patterns —
the shell has no client router; every link is a full page load). File = evidence/bundle/all/<name>.

**Entry points**
- Server-rendered HTML on every GTA 6 page: header `#ja-header-main` (logo, main menu `#cssmenu`, search
  dropdown, language switcher, MyBase buttons), game sub-navigation `#ja-subnav1`, content, right sidebar
  ("Latest GTA 6 Content"), footer (lazy). Evidence: evidence/html/gta-6_.html.
- template.js (combined) = `media__com_jchoptimize__cache__js__fe123a…3322421d….js` (loaded as a normal
  deferred script, not interaction-deferred).
- Hub countdown inline script = `inline-4d4e10ada4e9.js` (from gta-6_.html, placed after the timer markup).
- Lazy HTML blocks = `media__com_jchoptimize__cache__js__fe123a…539bfd6c….js` (`/media/com_jchoptimize/dynamic-js/reduce_dom.js`).
- Login modal = `media__modals__js__script.min.js` + `media__modals__js__modules__modal.min.js` (Regular Labs Modals).
- Dropdowns = `media__vendor__bootstrap__js__dropdown.min.js` (search toggle, mobile "Join MyBASE" menu).
- Search form = plain GET form; `media__com_finder__js__finder.min.js` (interaction-deferred).
- Deferred-script loader = `media__com_jchoptimize__cache__js__fe123a…66544a25….js` (user-interact-callback.js + reduce_unused_js.js).

**Functions / hops (file:line)**
| # | What | Where |
|---|---|---|
| 1 | `menumaker(options)`: inserts a `#menu-button` element (text "Menu") as the first child of `#cssmenu`; click toggles class `menu-opened` on it and slides the main list open/closed (class `open`, height animation 0.2 s) | template.js bundle :4 (insert + click handler), :5 `slideUp`, :6 `slideDown` |
| 2 | marks every `li` that holds a sub-list with `has-sub`; in "multitoggle" format inserts an empty `span.submenu-button` into each, click toggles `submenu-opened` + slides that sub-list | template.js :4 (`multiTg`) |
| 3 | parent link click: if `#menu-button` is displayed (phone layout) and the click is a plain left click (no Ctrl/Meta/Shift), prevent navigation and toggle the sub-list instead; on desktop (`#menu-button` display none) the link navigates | template.js :4 (`itemLink.addEventListener('click', …)`) |
| 4 | init on DOMContentLoaded: `menumaker({menuSelector:'#cssmenu', title:'Menu', format:'multitoggle'})` | template.js :6 |
| 5 | back-to-top: on scroll, `pageYOffset > 300` adds `cd-is-visible` to `a.cd-top`, else removes `cd-is-visible` and `cd-fade-out`; `> 1200` adds `cd-fade-out`; click prevents default and smooth-scrolls to top | template.js :6 |
| 6 | page loader overlay `#loader-wrapper` shown on unload only for links/buttons inside `.show-loader` or contact/users components (not used on GTA 6 content pages) | template.js :6–:13 |
| 7 | INP diagnostics tags to Clarity (analytics only) | template.js :14–:17 |
| 8 | countdown: release = `new Date("November 19, 2026 00:00:00")` (viewer's local time); every 1 s computes days/hours/minutes/seconds, 2-digit padded; when the distance is negative: stops the interval and replaces the timer with the heading "GTA 6 is Out Now!" | inline-4d4e10ada4e9.js :2–:5 |
| 9 | lazy HTML: elements with class `jchoptimize-reduce-dom` hold a `<template>`; an IntersectionObserver (rootMargin 200 px) swaps the template content in when the block nears the viewport, then runs its scripts | reduce_dom bundle :4 (ROOT_MARGIN), :11–:13 |
| 10 | interaction-deferred scripts (`type="jchoptimize-text/javascript"`) load on the first pointer/key/scroll/focus event or after 10 s; never when the browser reports itself automated (headless check) | user-interact bundle :4–:20, :24–:50 |
| 11 | login modal: `a[data-modals][href="#loginbox"]` opens the hidden `#loginbox` content in a modal built from a template (`data-modals-element="modal"`, overlay closes on click, close button aria-label "close"), other body elements get `aria-hidden` + `inert` while open; Escape closes | modals script.min.js :5 (template), :15–:19 (hide/restore body elements); modal.min.js :28 (Escape); page options `rl_modals` (closeOnOutsideClick, keyboardNavigation, showCloseButton, width 500 from `data-modals-width`) in evidence/html/gta-6_.html |
| 12 | Smart Search: only adds autocomplete when `finder-search` options exist (they do not on these pages) and disables empty advanced selects on submit; the form itself is a plain GET to `/search` with field `q` | finder.min.js :4; evidence/html/gta-6_.html form markup |
| 13 | logged-in header (name/avatar) only when `body.logged-in`; guests never call it | templates__SDH_J4__js__user-header.js :1–:20, :52 |

**Data flow**: none client-side for the shell. All menu entries, hub cards, info box values and the hub
"Latest News" list are in the server HTML. The countdown reads only the browser clock.

**Dependencies**: no storage keys written by the shell (walk storage on /gta-6/ = empty local + session;
runs F9-* use reset `clear`). No XHR/fetch at all on /gta-6/, /gta-6/news/ or an article for a guest (walk.json
requests). Endpoints: GET `/search?q=` (server answers 302 to Google, see T2); the translation module
(`option=com_ajax&plugin=gptranslate`, out of scope); `joomla-script-options` carries a CSRF token and a
keepalive setting, but no keepalive script is loaded for guests (not among the 159 scripts).

**Effects**: DOM classes only (`menu-opened`, `open`, `has-sub`, `submenu-opened`, `cd-is-visible`,
`cd-fade-out`, `jchoptimize-reduce-dom_loaded`), inline height styles, scroll position.

**Server-side unknowns**: how the server picks the Google redirect (Smart Search component replaced by a
redirect rule — UNKNOWN which layer, it answers in < 1 s with `cache-control: no-store`); the 404 page body
is a Joomla error page rendered without the game sub-navigation and language switcher.


## T2 Control → effect

Static hops cite the scripts analysed in REA ev_4d3b173d… (parent ev_691e339c…); dynamic hops cite recorded cases.

Main control: **the phone menu toggle** (hamburger icon at the top-left at 390x844), followed by a tap on the
"GTA 6" parent entry.

| Hop | What happens | Evidence |
|---|---|---|
| 1 | Server HTML ships `nav#cssmenu` with one list of top entries; entries with a sub-list (GTA 6, Red Dead 2, GTA 5 & Online, More) | evidence/html/gta-6_.html; probe-f9-links-hub.json `mainMenu` (11 / 6 / 9 / 8 sub-links) |
| 2 | On DOMContentLoaded template.js builds the menu: inserts the toggle element (text "Menu", font-size 0 — only the CSS-drawn icon is visible, zero layout width, no role, no tabindex, no accessible name) and one empty `+/-` toggle per sub-list | template.js :4, :6; F9-04 (4 sub-toggles, toggle has no role), explorer: toggle width 0, `::before`/`::after` 22.5 px bars |
| 3 | Desktop (1366 wide): toggle is `display:none`; sub-lists open on pointer hover only (CSS), not on focus | F9-04, F9-05, F9-06, F9-07, F9-08, F9-11 |
| 4 | Phone: list collapsed (height 0, overflow hidden). Tap on the icon (x≈20, y≈30) → toggle class `menu-opened`, list class `open`, height animates to auto in 0.2 s | template.js :4 (click handler), :6 (`slideDown`); F9-12, F9-13 |
| 5 | Tap on "GTA 6" (a link to /gta-6/) → navigation prevented because the toggle is displayed; its `+/-` toggle gets `submenu-opened`, the sub-list `open` with 11 links | template.js :4 (`itemLink` click → `preventDefault`, `submenuButton.click()`); F9-14 (calls show only the first GET /gta-6/ → no reload) |
| 6 | Tap the `+/-` toggle → sub-list closes; tap the icon again → whole menu closes (classes removed, height 0) | template.js :4–:5 (`slideUp`); F9-15, F9-16 |
| 7 | Tap a sub link ("Characters") → normal navigation to /gta-6/characters/ | F9-17 |
| 8 | Contrast: on desktop, Enter on the focused "GTA 6" link navigates (second GET /gta-6/) | F9-09 |

Rule script: evidence/rules/f9-shell-menu.mjs (26/26 PASS).

## Rules (T3)

| Rule id | plain words | script | observations reproduced n/n | proving input |
|---|---|---|---|---|
| F9-R1 | Header search is a GET form to /search with field q; the server never renders results but answers 302 to an external web search for "site:gtabase.com" plus "+" plus the raw q (no trim, no decode); empty q → just "site:gtabase.com"; other parameters dropped | evidence/rules/f9-shell-search-redirect.mjs | 19/19 | `/search?q=%20%20vice%20%20` → `…q=site:gtabase.com+%20%20vice%20%20` (no trimming) |
| F9-R2 | Countdown to 19 Nov 2026 00:00 viewer-local time, 4 two-digit fields (days/hours/minutes/seconds, rounded down) updated every second; once negative it is replaced for good by "GTA 6 is Out Now!" (shown upper-case) and stops | evidence/rules/f9-shell-countdown.mjs | 16/16 | emulated clock 2026-11-18T23:59:59.956Z → all zeros; 2026-11-19T00:00:02Z → "GTA 6 IS OUT NOW!" |
| F9-R3 | Back-to-top link shown when scrolled > 300 px, faded look added > 1200 px and kept until ≤ 300 px; activating it smooth-scrolls to the top without a hash | evidence/rules/f9-shell-back-to-top.mjs | 14/14 | scroll 1500 then 900 → still faded |
| F9-R4 | Desktop dropdowns open on hover only (not on focus/Tab); parent links navigate. Phone: icon toggles the menu; tapping a parent with a sub-menu toggles it instead of navigating | evidence/rules/f9-shell-menu.mjs | 26/26 | phone tap "GTA 6": 1 document load, sub-list open (F9-14) vs desktop Enter: 2 loads (F9-09) |
| F9-R5 | Page `<title>`: item detail "<item> \| GTA 6 <section phrase>"; article = its heading; list page ≥ 2 "Grand Theft Auto VI \| Rockstar Games News & Guides - Page N"; 404 "404 Page Not Found"; hub/section/list pages: own SEO title containing "GTA 6" | evidence/rules/f9-shell-page-title.mjs | 78/78 | /gta-6/guides/page-2 title ignores the guides title |

All rule scripts run with `node <script>` and print PASS/FAIL per observation; all PASS (see Cases).

## Cases

- File: evidence/cases/f9-shell.json — **41 cases**; run file evidence/runs/run-f9-shell.json — **41 clean, 0 excluded**
  (`node common/runs.mjs count ../evidence/runs` → `f9-shell 41 cases 41 clean`).
- Profile: tools/profiles/f9-shell.profile.json (copy of app.profile.json + 56 tokens, phone/desktop modes,
  macros `open-phone-menu` = tap at 20,30, `open-search`, `to-footer` = End key twice). Harness change:
  added the `clickat:<x>,<y>` step to tools/web/run-cases.mjs (mouse tap at viewport coordinates) because the
  phone menu toggle has zero layout width and Playwright refuses to click it (F-F9-04).
- The run file merges 4 passes (`passes` field; per case `captured` + `attempts`). Pass 1 (10:44 UTC) hit the
  origin outage (F-F9-14): F9-09, F9-10, F9-14…F9-17, F9-33…F9-36, F9-38, F9-40, F9-41 failed with
  "page.goto: Timeout" / HTTP 500 and were re-run (F9-09/10/14–17/38 moved from /gta-6/news/ to the cached hub as
  start page — same behavior, the hub is the menu's own target, so "no navigation" is proven by a single
  GET /gta-6/ in `calls`); F9-35 needed 3 attempts (404 page load event slow). No case is excluded.
- Search cases F9-21…F9-25 reached google.com through the redirect (F-F9-15); they were run once and not repeated.
  In F9-24 the runner trimmed the trailing spaces of the step text, so the box held "  vice" (rule script notes it).
- Supporting probes (read-only, saved in evidence/runs/): probe-f9-countdown-clock.json (emulated clock),
  probe-f9-backtop.json (scroll positions), probe-f9-links-hub.json (all hub/header/footer hrefs),
  probe-f9-search-redirect.txt (curl, 9 queries), walk.json titles.
- `attr:hub-all-news-link@href` (F9-01) read `<missing>`: the role/name selector did not match the link (its
  name contains a line break and an icon); the link to /gta-6/news/ is in evidence/html/gta-6_.html. Harness
  selector issue, not app behavior.
- Data-only readout keys (live content, compare only with fixtures): `list:info-values`, `list:hub-news-dates`,
  `list:hub-card-titles` (labels are behavior, but the set is content), `count:hub-cards`, `count:hub-news-items`,
  `title`/`heading` of article and characters pages, `list:breadcrumb-items` last element on articles.
  Everything else is behavior (URLs, classes, visibility, aria attributes, counts of controls, calls).


## Command vocabulary

Selectors live in tools/profiles/f9-shell.profile.json (CSS from the original markup unless noted).

| token | role | accessible name / label | what it does |
|---|---|---|---|
| site-logo | link | "GTA Base" (logo image alt + title) | goes to the site home `/` (F9-38) |
| main-menu | list inside a `nav` without label | — | top entries: Home, News, GTA 6, Red Dead 2, GTA 5 & Online, GTA 4, San Andreas, Vice City, GTA III, More (+ search on phone) |
| menu-top-links | link ×10 | visible text (game entries are logo images with a text label) | navigate; "More" is `href="#"` |
| menu-gta6 | link | "GTA 6" | desktop: navigates to /gta-6/, hover opens dropdown; phone: toggles its sub-list |
| menu-gta6-sub / menu-gta6-sub-links | list / link ×11 | aria-label "GTA 6 - <Label>" (visible "<Label>"), last "All GTA 6 Content" has no aria-label | GTA 6 dropdown: Map, Vehicles, Weapons, Missions, Characters, 100% Checklist, Animals, Radio, Cheats PS5, Cheats Xbox, All GTA 6 Content |
| menu-more / menu-more-sub | link "More" / list of 8 | "More" | hover dropdown (other games, All Games, Media Gallery, MyBase Rankings, VIP Membership) |
| menu-toggle | none (plain element, not focusable, zero width, icon drawn by CSS) | none (hidden text "Menu") | phone only: opens/closes the menu. Rebuild: a real button "Menu" with aria-expanded |
| submenu-toggle-gta6 / submenu-toggles | none (empty element ×4) | none | phone: opens/closes one sub-list (+/−) |
| game-subnav-links / subnav-current | link ×18 / link with aria-current="page" | aria-label "GTA 6 - <Label>"; first is the game logo ("Game Logo", visually hidden text) | second bar on every GTA 6 page: Overview, Map, Vehicles, Weapons, Missions, Characters, 100% Checklist, Achievements, Animals, Properties, Activities, Radio, Guides, Strangers, Cheats PS5, Cheats Xbox, All GTA 6 Content |
| search-toggle | none (plain element, no tabindex, no name; magnifier icon) | none | desktop: opens the search panel (Bootstrap dropdown, sets aria-expanded="true") |
| search-panel / search-input / search-submit | dropdown / textbox / button | label "Search" (visually hidden), placeholder "Search …", name q / button "Search" | submits GET /search?q=… |
| mobile-search-input | textbox | label "Search" | same form, last entry of the phone menu |
| login-link | link | "Log In" (href #loginbox) | desktop: opens the "Sign in to MyBase" modal (never submitted) |
| login-modal / login-modal-close / login-heading | modal container (no dialog role; aria-hidden="false" while open) / button "close" / text "Sign in to MyBase" | — | modal with Discord + Google buttons, username/password, Remember Me, "Log in", forgot links, "Create an account"; closes on Escape, close button or overlay click |
| join-link | link | "Join MyBASE" | /membership/free/ (desktop) |
| user-dropdown-toggle / user-dropdown-items | button / links | "Join MyBASE" / "Log In", "Create Account", "Membership" | phone: Bootstrap dropdown replacing the two desktop buttons |
| lang-switcher | flag + current language | — | translation switcher (out of scope) |
| back-to-top | link | "Back to top" | see F9-R3 |
| footer-links / footer-game-menu / footer-social | links | About, Contact Us, Privacy Policy & Cookies, Search, Partners, Work With Us / 10 game links / 4 icon links | footer (lazy-rendered) |
| breadcrumbs / breadcrumb-items | navigation "Breadcrumbs" / list items | "Home", "GTA 6", section, current page (not a link) | trail at the top of the footer |
| countdown / countdown-timer | region with heading "GTA 6 Release Countdown" (a link to /gta-6/) | — | F9-R2 |
| info-labels / info-values | label/value pairs | Release Date, Series / Universe, Set in Location, Set in Year, Publisher, Developer | hub info box; Series values link to the games list filtered by series |
| hub-cards / hub-section-headings | link cards ×33 / headings | card heading text | section navigation (see Behavior summary 4) |
| hub-news-items | list of 10 | "Published on <Month D, YYYY>" | latest GTA 6 news on the hub |
| skip-links | link ×3 | "Skip to content", "Skip to main navigation", "Skip to 2nd column" | jump to content, main nav, sidebar |

## Behavior summary for the spec

1. Every GTA 6 page has the same shell: header bar (site logo → home; main menu; search; language switcher;
   "Log In" + "Join MyBASE"), a GTA 6 sub-navigation bar, the page content with a right sidebar
   ("Latest GTA 6 Content"), and a footer (breadcrumb trail, game links, network/social links, copyright,
   six bottom links). Three skip links precede the header. (F9-31, F9-37, probe-f9-links-hub.json)
2. Main menu entries: Home, News, GTA 6, Red Dead 2, GTA 5 & Online, GTA 4, San Andreas, Vice City, GTA III,
   More. For the rebuild only "GTA 6" needs a live sub-menu: Map, Vehicles, Weapons, Missions, Characters,
   100% Checklist, Animals, Radio, Cheats PS5, Cheats Xbox, All GTA 6 Content; each sub link's accessible name
   is "GTA 6 - <label>". The GTA 6 entry carries an "active" style on GTA 6 pages ("current" on the hub itself; class only, no aria-current) and none on the 404 page. (F9-04, F9-05, F9-11; evidence/html/gta-6_.html, gta-6_news_.html, gta-6_nonexistent-page-xyz.html)
3. GTA 6 sub-navigation bar (always visible, wraps on phones): game logo, Overview, Map, Vehicles, Weapons,
   Missions, Characters, 100% Checklist, Achievements, Animals, Properties, Activities, Radio, Guides,
   Strangers, Cheats PS5, Cheats Xbox, All GTA 6 Content; the entry of the current page carries
   aria-current="page" (hub → Overview). (F9-12, F9-37; Guides page → Guides current, F9-40; News list and articles have no current entry, F9-33, F9-34)
4. Hub `/gta-6/`: heading "GTA 6 (Grand Theft Auto VI)", a banner image, the release countdown box, an info
   box titled "GTA 6 (Grand Theft Auto VI): Game Info" with 6 label/value rows (Release Date, Series /
   Universe [values link to the games list filtered by series], Set in Location, Set in Year, Publisher,
   Developer), an "About GTA 6" text, then 33 cards (image + title, each linking to a section): a first grid of
   3 (Latest News, Features Recap, Guides), then grids under the headings "GTA 6 Database" (9), "GTA 6 Guides"
   (12), "GTA 6 Cheat Codes" (3), "GTA 6 Media" (6), then "GTA 6: Latest News & Updates" with
   the 10 newest news items ("Published on <Month D, YYYY>", newest first) and a link "All GTA 6 news &
   updates" to the news list. Every GTA 6 area is reachable from a card. (F9-01, F9-03, F9-39, probe-f9-links-hub.json)
5. Countdown: see F9-R2. Today (after 19 Nov 2026) it shows only "GTA 6 is Out Now!" and does not tick;
   before that it ticks every second with 2-digit days/hours/minutes/seconds. (F9-01, F9-02, F9-39, probe-f9-countdown-clock.json)
6. Desktop menu: sub-menus open on pointer hover and close on leave; there is no keyboard way to open them
   (focus/Tab do not open). Rebuild: open on hover AND on focus-within / a disclosure button, so keyboard
   users can reach the sub links. (F9-05..F9-08, F9-11)
7. Phone (≤ ~390 px): the main menu collapses behind an icon at the top-left; the "Log In"/"Join MyBASE"
   pair becomes one "Join MyBASE" dropdown (Log In, Create Account, Membership); the header search icon is
   hidden and the search form becomes the last menu entry. Icon tap toggles the menu; tapping a parent with
   a sub-menu toggles that sub-menu (+/−) instead of navigating; sub links navigate. Escape does nothing
   (exploratory probe).
   Rebuild: make the icon a real button named "Menu" with aria-expanded, and the +/− real buttons.
   (F9-12..F9-18, F9-R4)
8. Search: desktop magnifier opens a dropdown panel with a "Search" textbox (placeholder "Search …") and a
   "Search" button; Enter or the button submits GET /search?q=<text> (form encoding, no trimming, empty
   allowed). The original then redirects to an external site-restricted web search (F9-R1). Rebuild: keep the
   /search?q= URL contract but render a local results page (see Unknowns). (F9-19..F9-25)
9. "Log In" opens a modal "Sign in to MyBase" (social buttons, username, password with show/hide, Remember
   Me, Log in, forgot links, Create an account); Escape, the close button ("close") or a click on the overlay
   closes it; the URL does not change. The rebuild has no accounts in v1: show the same entry point with an
   explanatory modal or omit it (product decision). (F9-26..F9-29)
10. Back-to-top: see F9-R3. (F9-30..F9-32, probe-f9-backtop.json)
11. Footer and the lower content blocks render lazily when scrolled near (the original's DOM-size optimisation);
    the rebuild can render them normally. Breadcrumb trail = Home › GTA 6 › <section> › <current page (text)>;
    hub = Home › GTA 6 › Overview. (F9-30, F9-31, F9-33 Home › GTA 6 › News, F9-34 Home › GTA 6 › News › <article title>, F9-36 404 page Home › Page not found)
12. 404: unknown URLs answer HTTP 404 with heading/title "404 Page Not Found", a picture, "This URL does not
    exist. How did you get here?", three possible reasons, and "Get back inside the map!" advising the menu
    or search; the shell keeps the header and main menu but drops the GTA 6 sub-navigation and the language
    switcher. (F9-35, F9-36; walk.json status 404; evidence/walk/screens/_gta_6_nonexistent_page_xyz.jpg. `/gta-6` without the slash answers 301 to `/gta-6/` (F9-41, curl))
13. Page titles: see F9-R5. (walk.json, F9-01, F9-09, F9-10, F9-17, F9-38)

## Findings

- F-F9-01 The hub countdown targets "November 19, 2026 00:00:00" with no time zone, i.e. midnight in each
  viewer's own time zone, so the switch to "out now" happens at different instants around the world.
  Evidence: inline-4d4e10ada4e9.js:3; probe-f9-countdown-clock.json (UTC run switches between 23:59:59.956Z
  and 00:00:02.962Z).
- F-F9-02 After the release date the countdown fields are replaced by "GTA 6 is Out Now!" (CSS upper-case) and
  the timer stops: no digit fields remain and the text is unchanged 3.5 s later. Evidence: F9-01, F9-02, F9-39;
  walk screenshot evidence/walk/screens/_gta_6_.jpg.
- F-F9-03 Before release the countdown ticks every second: days/hours/minutes/seconds, each rounded down and
  padded to 2 digits ("01 DAYS : 13 HOURS : 39 MINUTES : 27 SECONDS"). Evidence: probe-f9-countdown-clock.json.
- F-F9-04 The phone menu toggle is a plain element inserted by script (text "Menu" at font-size 0, layout width
  0, icon drawn by CSS pseudo-elements): no role, no tabindex, no accessible name, not reachable by keyboard;
  the four +/− sub-menu toggles are empty elements as well. Evidence: template.js :4; F9-04 (`attr:menu-toggle@role`
  missing), F9-12 (`visible:menu-toggle` false while the icon is on screen); harness needed a coordinate tap
  (`clickat:20,30`).
- F-F9-05 Desktop sub-menus are hover-only: focusing "GTA 6" or tabbing into its sub links leaves the sub-menu
  hidden (keyboard users tab through invisible links). Evidence: F9-07, F9-08; exploratory probe (focus lands on
  "Map" while the list stays hidden).
- F-F9-06 On phones a tap on a parent entry with a sub-menu never navigates (plain left click, no modifier);
  on desktop the same link navigates. Evidence: template.js :4; F9-14 (one GET /gta-6/) vs F9-09 (two GETs).
- F-F9-07 The site has no on-site search results page: GET /search?q=<raw> answers 302 (no-store) to
  `https://www.google.com/search?q=site:gtabase.com+<raw q>`; empty q → `q=site:gtabase.com`; extra parameters
  dropped; q is not trimmed or re-encoded. Evidence: probe-f9-search-redirect.txt; F9-21..F9-25 calls.
- F-F9-08 The header search form appears twice (desktop dropdown, phone menu entry) with the same input id, so
  both visually hidden "Search" labels point at the first input. Smart Search autocomplete is not configured on
  these pages (no `finder-search` options). Evidence: evidence/html/gta-6_.html; finder.min.js :4; F9-19
  (`count:form[action="/search"]` = 2).
- F-F9-09 "Log In" (desktop link, phone dropdown item) opens the hidden `#loginbox` form in a Regular Labs
  modal (width 500): heading "Sign in to MyBase", Discord and Google buttons, username, password with a
  show-password button, Remember Me, Log in, "Forgot your password?", "Forgot your username?", "Create an
  account". The modal container has no dialog role; it is removed from the page on close (Escape, close button
  "close"). Nothing is requested on open. Evidence: F9-26..F9-29 (calls only the page GET, blocked empty);
  modals script.min.js :5, :15–:19; modal.min.js :28. (Form never filled or submitted.)
- F-F9-10 Back-to-top thresholds 300 px / 1200 px with a sticky faded state (see F9-R3). Evidence: template.js :6;
  probe-f9-backtop.json; F9-30..F9-32.
- F-F9-11 The footer — including the breadcrumb trail, which therefore sits at the bottom of the page — the
  hub's bottom "next section" pager and the "below content" modules are shipped inside templates and inserted
  only when scrolled within 200 px. Evidence: reduce_dom bundle :4, :11–:13; F9-30 (0 footer links at the top)
  vs F9-31 (6 links after End).
- F-F9-12 Hub content: info box (6 rows; Series values link to `/games/#attr.ct27.value=gta` and `…=hd`), 33
  section cards (one, "Features Recap", leaves the section: /grand-theft-auto-6/), 10 latest news items "Published on
  <date>" and a right sidebar "Latest GTA 6 Content" (cross-section latest items with their section name).
  Evidence: F9-01, F9-03, probe-f9-links-hub.json, evidence/html/gta-6_.html.
- F-F9-13 Interaction-deferred scripts (Smart Search, social login buttons, password view, toasts, messages,
  Regular Labs core) load only after the first pointer/key/scroll/focus event or 10 s, and never in a browser
  that reports automation. None of the shell behaviors above depends on them. Evidence: user-interact bundle
  :4–:20, :50.
- F-F9-14 While several tracing agents browsed (≈10:50–11:18 UTC) uncached pages answered "500 Internal Server
  Error / Request Timeout" after ≈61 s, while cached pages (the hub) kept answering 200. Evidence: F9 pass 1
  errors (F9-09, F9-10, F9-14…F9-17, F9-33…F9-36, F9-38, F9-40, F9-41; `calls` 500), curl status checks. The 404
  page is never cached (no `x-litespeed-cache` header), so it is the slowest page. Not app behavior.
- F-F9-15 Playwright's request routing does not see redirect hops: the 302 from /search was followed to
  google.com despite the profile's block rule (5 requests, two answered with Google's "unusual traffic" page).
  The search cases were not repeated. Evidence: F9-21..F9-25 `url`.
- F-F9-16 The 404 page keeps the header and main menu, drops the GTA 6 sub-navigation and the language switcher,
  has no links in its content and a breadcrumb "Home › Page not found". Evidence: F9-35, F9-36.
- F-F9-17 GTA 6 sub-navigation marks the current section with aria-current="page" (hub → Overview, guides → Guides);
  the news list and articles mark nothing. Evidence: F9-37, F9-40, F9-33, F9-34.
- F-F9-18 Directory-style URLs: `/gta-6` → 301 `/gta-6/`. Evidence: F9-41, curl.

## Unknowns

- U-F9-01 What a real on-site search would return (the site delegates to Google). Rebuild: keep GET /search?q=
  and render a local results page over its own sample data (titles of hub sections, list items, articles),
  "no results" message for no match; never redirect to a third party.
- U-F9-02 Signed-in header (name, avatar, MyBase menu) — user-header.js runs only with body class `logged-in`;
  not observable read-only. Rebuild v1: guest header only (PENDING_FEATURES #1).
- U-F9-03 The language switcher's behavior (machine translation, /de/ /es/ /fr/ /it/ /pt/ URL prefixes) —
  out of scope (PENDING_FEATURES #3). Rebuild: omit or show a disabled switcher.
- U-F9-04 Whether the desktop dropdown has any keyboard path on other devices (touch tablets with hover
  emulation). Rebuild: add focus/click disclosure (accessibility fix, documented deviation).

