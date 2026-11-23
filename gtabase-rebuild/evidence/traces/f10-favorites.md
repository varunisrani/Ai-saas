# F10 — Favorites & personal progress, guest view (feature id `f10-favorites`)

Observed 2026-11-23 on https://www.gtabase.com as a guest only (no account; login never submitted).
Analysis side of the clean-room wall. Personal data: no usernames or other users' values were recorded
(the only MyBase list page is a GTA Online ranking; only its column headers were read).

## Where favorites / tracking controls exist (inventory)

| Place | Control | Guest result | Evidence |
|---|---|---|---|
| Every GTA 6 detail page: vehicle, weapon, animal, radio station, property (garage), character, mission | button "Add To Favorites" (star icon) next to "Compare To" / rating | opens the login dialog in "favorites context"; no request, nothing stored | F10-01..F10-08; inline script identical on all 7 types except the item id |
| GTA 6 map marker popup | star button "Add to favourites" | popup closes, "Favourites" info panel with Log in / Join MyBase; no request | F10-22..F10-25 |
| GTA 6 map | "+ Personal marker" | asks the server who is signed in first (POST, blocked by the read-only runner), then a login panel for guests | F10-26; map.js |
| Checklist pages / map found-markers | tick boxes | work for guests in the browser (see F5 trace) | F5 |
| Vehicle / weapon lists | none (cards have compare toggles only) | — | F10-20, F10-21 |
| "Owned" / "my garage" / collection tracking (MyBase GTA 6 Collection) | none on any guest-visible GTA 6 page | member-only, managed inside MyBase | membership page F10-27/28; F10-30 (/mybase/gta-6/ is 404) |

## T1 Explain (static)

**A. Detail-page favorite button.** Inline script on each detail page (saved from the live HTML as
`evidence/bundle/f10/inline-wishlist-<page>.js`, 7 files, byte-identical except `itemId`; below **WL** =
`inline-wishlist-gta-6_vehicles_sunset-sanchez.js`, 14 lines). REA analysis
**ev_83aed0af2dd7a12c9cf556eede57b5f21ffff6b7874c887cf188e0699eee04cb**, routes view
ev_1ed27e438988dc79909ab1f592715f761195fd23d319d1669f3610c195a09bec (no error; evidence/rea/f10-favorites/evidence.json).

| Hop | Where | REA node | What |
|---|---|---|---|
| entry | WL:1 | L1:45 | runs on DOM ready; the page itself carries `isLoggedIn` (false in the cached guest HTML), `hasContact`, the item id, list key `gta-6`, the endpoint base, `/login/`, the profile-creation URL, both labels ("Add To Favorites" outline star / "Favorited" solid star) and the guest texts |
| label | WL:1 `updateButtonState` | L1:739 | guest: always the "Add To Favorites" label; member: label from POST `…getuserdata…&type=wishlist-status` body `{value:itemId, list:"gta-6"}` (WL:10, REA request L10:411) |
| click | WL:11 | L11:32 | guest → `showLoginPrompt`; member without a MyBase GTA 6 profile → opens the "profile" dialog or goes to the profile-creation form (WL:12); member → POST `type=user-token` then POST `type=toggle-wishlist` `{value, list}` with `X-CSRF-Token`; new label from `inWishlist` (WL:14, REA L14:0, L14:93) |
| prompt | WL:4–8 `showLoginPrompt` | L4:0 | without a login dialog on the page → navigates to `/login/`; otherwise adds the benefits line once, stores the default title and swaps in "Save your GTA 6 favorites", flags the dialog, and opens it by clicking the page's own login-dialog link (`openModal`, WL:2–3, REA L2:0) |
| restore | WL:9–10 | L9:34 | capture-phase document click listener: a trusted click on any link to the login dialog while flagged → removes the flag and restores the default title (the benefits line is not removed) |

**B. Map marker star.** `evidence/bundle/all/images__gta-6__maps__gtab-map__map.js` (minified, all code on
line 2; below **MAP**). REA analysis **ev_ab3af4fab1139d2df7f029898c516310c1d496075a2ced8a1280598fba416c16**,
view ev_e49df5d9d8a1acc41218438787dcceab5956d8a1eba69c81d1958be3d13f9cc6.
- Popup star built at MAP:2 col 115087: label/title "Add to favourites" or "Remove from favourites",
  `aria-pressed`, class `gtab-on` when on; click → `yl` (MAP:2 col 177772, REA L2:177772).
- `yl`: without a signed-in answer from the server (`logged_in`), closes the popup and calls `Ge` with the
  favourites text and the title "Favourites" (MAP:2 col 177978); members → `me("fav",{marker,on})` POST
  (MAP:2 col 203594 → `xe`, col 148976, always POST to `GTAB_CONFIG.submit.url&type=…`), then `er`
  (col 177374) refreshes the "Favourites" personal category.
- `Ge`/`ye` (cols 152655 / 152264): panel with role dialog and the title as its name, a "×" close button
  (name "Close"), a heading, the paragraph, "Log in" (`$o`, col 153101: points at the page's login dialog link
  and clicks it) and "Join MyBase" (register URL, new tab, `rel=noopener`); focus moves to "Log in".
- Same pattern for private notes ("Want to keep notes on the map? … Log in to start.", col 175087) and
  personal markers (col 193140: asks `whoami` first, then "Want to keep your own places on the map? Members
  of GTABase can add personal markers that only they see. Log in to start.").

**C. Login dialog.** Server HTML block `#loginbox` (hidden) opened by Regular Labs Modals from links
`a[data-modals][href="#loginbox"]` (header "Log In", mobile menu "Log In", map panel "Log in"). Contents:
logo, title "Sign in to MyBase", "Login with Discord", "Sign in with Google", "or login with your GTABase
account", Username, Password (+ show-password toggle), Remember Me, "Log in" (submit), "Forgot your
password?", "Forgot your username?", "Create an account" → /membership/free/sign-up. Closing: close button
(name "close") and Escape (F10-09, F10-10); a click on the dimmed backdrop also closes (static: backdrop
marked close-on-click; not recorded). After its first use the library rewrites the opener link's address to
the absolute page URL + `#loginbox` (F10-12).

**Dependencies.** Endpoints (never called for guests): `/index.php?option=com_ajax&plugin=getuserdata&format=raw&type=`
`wishlist-status` | `toggle-wishlist` | `user-token`; map `GTAB_CONFIG.submit.url` with `type=fav|note|whoami|…`.
No browser storage is used by favorites.

**Server-side unknowns.** Favorites list model (`list` key `gta-6` + item id), limits for free members
(map: VIP 100 favourites, free fewer — number not shown to guests), where favorites are listed in MyBase,
GTA 6 garage/vehicle/weapon collection tracking (member-only pages, not reachable as a guest).

## T2 Control → effect (main control: "Add To Favorites" on a vehicle page)

1. Load /gta-6/vehicles/sunset-sanchez: one button "Add To Favorites" (type button) beside "Compare To";
   `<body>` has no `logged-in` class; no request (F10-01; WL:1, WL:10 guest branch → `updateButtonState(false)`).
2. Click → WL:11 guest branch → `showLoginPrompt` (WL:4, REA L4:0).
3. WL:5 adds the benefits line, WL:6–7 swaps the title, WL:8 flags `login-context-favorites` and opens the
   dialog through the page's own "Log In" link (WL:2–3). Observed: dialog visible, title "Save your GTA 6
   favorites", line "Create a free account to save your favorites, track your garages, vehicles and weapons,
   and much more.", class `login-context-favorites`, button label unchanged, `calls`/`blocked`/`dialog`
   empty, nothing stored (F10-02).
4. Close (× or Escape) → dialog hidden, label unchanged (F10-09, F10-10). Reload → fresh state (F10-17).
5. Header "Log In" after the prompt → WL:9–10 restores "Sign in to MyBase", benefits line stays (F10-12).

## Rules (T3)

| Rule id | Plain words | Script | Observations reproduced | Proving input |
|---|---|---|---|---|
| F10-R1 guest prompt | Guest activation of "Add To Favorites" (click/Enter/Space, any detail type, any width) opens the login dialog titled "Save your GTA 6 favorites" with the benefits line; label unchanged; no request; nothing stored | evidence/rules/f10-favorites-guest-prompt.mjs | 10/10 | click on the vehicle page (F10-02) |
| F10-R2 login context | Favorites context sets title + one benefits line; a real "Log In" click restores the title but keeps the line; close keeps context; reload resets | evidence/rules/f10-favorites-login-context.mjs | 10/10 | prompt → Escape → header Log In ⇒ title "Sign in to MyBase", 1 benefits line (F10-12) |
| F10-R3 map star | Guest star on a map marker → popup closes, "Favourites" panel with text, Log in (#loginbox; opens the login dialog with its normal title) and Join MyBase (/membership/free/, new tab), × closes it; heading and links shown in capitals; no request, nothing stored | evidence/rules/f10-favorites-map-guest.mjs | 4/4 | star on #garage-003 (F10-23) |

## Cases

- File: evidence/cases/f10-favorites.json → run evidence/runs/run-f10-favorites.json (profile
  tools/profiles/f10-favorites.profile.json).
- Count: 32 cases; clean: 32; excluded: none.
- Recording history (honest note): the first pass (run-f10-favorites.json, 2026-11-23 ~10:45 UTC) ran while
  the site's origin answered HTTP 500 after ~60 s for uncached pages (curl confirmed for /membership/,
  /login/, weapon, animal, radio pages; several other analysis runners were active). Failed cases were
  re-run after the site recovered and merged into the run file (records carry `retriedAt`; raw retry files
  retry1/retry2a/retry2b/retry3/retry4-f10-favorites.json). Harness fixes in between: F10-12 needed the
  `header-login` token to match by ending (`…#loginbox`) because the modal library rewrites that link to the
  absolute page URL after its first use (F10-12 reads `attr:header-login@href`); F10-24/25 wait for the
  marker popup before clicking; F10-26 starts from the plain map page; navigation timeout raised to 100 s.
  F10-13/14/19 were re-run with the final token (same results as the first pass).
- Data-only readout keys: `heading`, `title`, `text:map-popup-title`, `list:map-popup-buttons` (marker names),
  `list:plan-title`, `list:plan-price`, `list:plan-*-features` and the `plan-*` subtitles (marketing copy),
  `count:plan-*-features`, `list:table-header` (GTA Online ranking columns).

## Command vocabulary

| token | role | accessible name / label | what it does |
|---|---|---|---|
| `fav-button` | button | "Add To Favorites" (outline star icon before it) | favorite toggle on detail pages; guests: opens the login dialog in favorites context |
| `compare-button` | button (menu) | "Compare To" | neighbour control (F3), used as a layout anchor |
| `login-modal` | dialog (hidden title "Modal dialog") | contains title text | the login dialog |
| `login-title` | text | "Sign in to MyBase" / "Save your GTA 6 favorites" | dialog title |
| `login-benefits` | paragraph | "Create a free account to save your favorites, track your garages, vehicles and weapons, and much more." | extra line in favorites context |
| `modal-close` | button | "close" | closes the dialog |
| `header-login` / `mobile-login` | link | "Log In" | opens the login dialog (desktop header / phone menu); hidden at phone width / inside the closed menu |
| `header-join` | link | "Join MyBASE" | → /membership/free/ |
| `mobile-join-toggle` | button (menu) | "Join MyBASE" | phone-width menu with Log In / Create Account / Membership |
| `login-discord` / `login-google` | button | "Login with Discord" / "Sign in with Google" | social sign-in (never clicked) |
| `login-username` / `login-password` / `login-remember` | textbox / password / checkbox | "Username" / "Password" / "Remember Me" | login fields (never filled) |
| `login-submit` | button | "Log in" | submit (never clicked) |
| `login-links` / `login-register` | links | "Forgot your password?", "Forgot your username?", "Create an account" | account help / sign-up |
| `map-popup`, `map-popup-title` | popup / text | marker name | map marker popup |
| `map-fav-star` | button (toggle, `aria-pressed`) | "Add to favourites" / "Remove from favourites" | star a marker |
| `map-panel` | dialog | "Favourites" | guest explanation panel |
| `map-panel-title` / `map-panel-text` | heading / paragraph | "Favourites" / explanation | panel content |
| `map-panel-login` / `map-panel-join` | link | "Log in" / "Join MyBase" | open login dialog / sign-up in new tab |
| `map-panel-close` | button | "Close" (shown as ×) | close the panel |
| `map-personal-marker` | button | "+ Personal marker" | member feature entry point |
| `plan`, `plan-title`, `plan-price`, `plan-recommended`, `plan-*-features` | list items / headings | "Basic Plan", "VIP (1 Year)", "VIP (1 Month)" … | membership plan cards |
| `list-fav-control` | — | — | probe for favorite controls on list pages (none) |
| `table-header` | column header | — | table columns |

## Behavior summary for the spec

1. Each GTA 6 detail page (vehicles, weapons, animals, radio stations, properties, characters, missions) shows
   one "Add To Favorites" button with an outline star, next to "Compare To". (F10-01..F10-08)
2. For a visitor who is not signed in the button never turns into "Favorited"; activating it by mouse, Enter
   or Space opens the login dialog instead, titled "Save your GTA 6 favorites" with the line "Create a free
   account to save your favorites, track your garages, vehicles and weapons, and much more.". No request is
   made and nothing is stored. (F10-02..F10-08, F10-15, F10-16, F10-18)
3. The login dialog's normal title is "Sign in to MyBase". After a favorites prompt, opening the dialog from a
   normal "Log In" link shows the normal title again, while the benefits line remains until reload; the
   favorites line is never duplicated. (F10-11, F10-12, F10-13, F10-17)
4. The dialog closes with its close button ("close") or Escape; closing changes nothing else. (F10-09, F10-10, F10-16)
5. The dialog offers Discord and Google sign-in, username + password (+ show password, Remember Me), "Log in",
   "Forgot your password?", "Forgot your username?" and "Create an account" (→ free sign-up). (F10-14)
6. At phone width the header shows a "Join MyBASE" menu button containing "Log In", "Create Account",
   "Membership"; the favorites button and prompt work the same. (F10-18, F10-19)
7. List pages (vehicles, weapons) have no favorite controls. (F10-20, F10-21)
8. Map: every marker popup has a star "Add to favourites" (not pressed). For a guest it closes the popup and
   shows a "Favourites" panel: "Want to keep your favourite places? Members of GTABase can star any marker and
   find it again under Personal, on every device. Log in to start.", with "Log in" (opens the login dialog) and
   "Join MyBase" (free sign-up, new tab) and a close "×". No request, nothing stored. (F10-22..F10-25)
9. Membership page (/membership/): heading "Track Your GTA 6 & GTA Online Garages, Net Worth and Game Progress", three plan
   cards — Basic Plan (Free, Lifetime), VIP (1 Year) ("Save 40%"), VIP (1 Month) — each with "Sign Up!" and
   "See Full Details". Free capabilities: Checklists & Progress Tracker (stored in your account), GTA 6
   Collection (garages, vehicles, weapons), GTA Online Collection, Red Dead Collection, Total Net Worth Value,
   Custom Pictures for GTA Online, Profile Customization, Favorites (vehicles, weapons, animals, radio stations,
   map locations, …). VIP adds: No Advertisements, Multiple Profiles per Game (up to 4, separate progress),
   Interactive Map Extras (100 personal markers, favorites and notes, screenshots, custom categories), Custom
   Pictures for GTA 6, Property Customization, GTA Online Weapons, Vehicle & Weapon Upgrades, Custom Outfits,
   Red Dead Extras, VIP Badge, Support the Site. (F10-27..F10-29)
10. There is no GTA 6 MyBase page reachable as a guest (/mybase/gta-6/ is "404 Page Not Found"); the only
    MyBase page is the GTA Online ranking ("MyBase Rankings", columns #, Player, Net Worth, Rank — out of GTA 6
    scope, no player data recorded). (F10-30, F10-31)
11. The standalone login page (/login/, used when no dialog is available) shows the same content as the dialog
    under the heading "Sign in to MyBase": Discord and Google buttons, username, password (with "Show
    Password"), Remember Me and "Log in". (F10-32)
12. HYPOTHESIS (rebuild without accounts): offer browser-local favorites instead of the login prompt — the same
    button toggles between "Add To Favorites" (outline star) and "Favorited" (solid star), the state is kept in
    browser storage per game and item (e.g. a map from list key "gta-6" to item ids, like the checklist
    storage), the map star toggles `aria-pressed` and adds the marker to a "Favourites" group, and a short note
    says favorites are saved in this browser only. Not observed on the original; mark as a deliberate
    difference in the parity report. (No case — not observable on the original.)

## Findings

- F-F10-01 Favorites on detail pages are member-only; for guests the button opens the login dialog with a
  favorites-specific title and benefits line, sends nothing and stores nothing. Evidence: F10-02..F10-08; WL:4–11.
- F-F10-02 The same inline favorites script (only the item id differs) is on all 7 GTA 6 detail types; the list
  key is `gta-6`. Evidence: evidence/bundle/f10/*.js (sha-identical after removing the id).
- F-F10-03 The guest/member decision for the favorite button is baked into the cached page (`isLoggedIn`),
  not read from the body class as the checklist does. Evidence: WL:1.
- F-F10-04 After a favorites prompt, a real click on a "Log In" link restores the default title but leaves the
  benefits line (cosmetic leftover). Evidence: F10-12; WL:9–10.
- F-F10-05 Map marker favourites/notes/personal markers are member-only; guests get an explanation panel with
  Log in / Join MyBase. Evidence: F10-23..F10-26; MAP:2 cols 152655, 175087, 177772, 193140.
- F-F10-06 No favorites / owned / garage controls on list pages; collection tracking (garages, vehicles,
  weapons) exists only as a member feature described on /membership/. Evidence: F10-20, F10-21, F10-27, F10-28.
- F-F10-07 /mybase/gta-6/ returns the 404 page; MyBase Rankings exist only for GTA Online. Evidence: F10-30, F10-31.
- F-F10-08 Many uncached GTA 6 pages answered HTTP 500 after ~60 s during this session, while cached ones
  loaded at once; they recovered later. Evidence: curl probes 2026-11-23 10:50–11:30 UTC; retry history above.
- F-F10-09 "+ Personal marker" on the map first asks the server who is signed in (POST
  `…plugin=gtabmap…&type=whoami`); with the request blocked the panel "Personal marker" says "The server did
  not answer. Please try again in a moment." (F10-26). A real guest gets the login panel instead (static,
  MAP:2 col 193140) — the read-only guard changes this outcome.
- F-F10-10 The Regular Labs modal library rewrites the header "Log In" link from `#loginbox` to the absolute
  page URL + `#loginbox` after the dialog has been opened once (F10-12 `attr:header-login@href`). No visible effect.

## Unknowns

- U-F10-1 Member favorites: where they are listed, limits for free members, whether favorites sync with the
  map "Favourites" category. Not observable as a guest → rebuild v1 uses browser-local favorites (HYPOTHESIS,
  behavior item 11).
- U-F10-2 GTA 6 collection tracking (garages, vehicles, weapons, net worth) — member-only pages; no guest UI.
  Rebuild v1: out of scope (or browser-local "owned" toggles as a later HYPOTHESIS).
- U-F10-3 (resolved) The button's accessible name is the icon-font glyph U+F005 followed by " Add To
  Favorites" (probe-f5-f10-aria.json), so an exact name match fails (F10-01 `count:fav-button-role = 0`) while a
  substring match finds it. Rebuild: hide the icon from assistive tech so the name is exactly "Add To Favorites"
  (deliberate improvement; parity profiles should match by substring).
