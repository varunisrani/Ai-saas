# F8 — Media galleries (feature id `f8-galleries`)

Observed 2026-11-23 on https://www.gtabase.com as a guest (read-only guard on; gallery hit/rating/comment/download
endpoints additionally blocked in the profile — none was ever requested). Analysis side of the clean-room wall.

Pages: `/gta-6/screenshots/` (+ `?thumb_limitstart=100|200&limit=100`), `/gta-6/screenshots/trailers/`,
`/gta-6/artworks/`, `/gta-6/covers/`, the media tab links (Screenshots / Trailer Screens / Artworks / Videos →
`/gta-6/videos/`), and the embedded galleries of `/gta-6/map-locations/`.
Profile: `tools/profiles/f8-galleries.profile.json`.

## T1 Explain (static)

Scripts (all in `evidence/bundle/all/`; IG and LIB were missing from the phase-2 bundle and were downloaded for
this trace with one GET each):
- **IG** = `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f335e2529658003085ffe1e85c0912960.js`
  (line 2: `/media/com_igallery/js/ignitegallery-42.js`, Ignite Gallery front end, 615 lines, jQuery).
- **LIB** = `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f9f282e7b235bedc688f8de31efdb1a71.js`
  (line 2: `/media/com_igallery/js/lib-42.js`: matchHeight, imagesLoaded, scrollTo, fullscreen, draggabilly and a
  namespaced UIkit 3 build `iguiUIkit` with slideshow + lightboxPanel; minified, line 4 = 111 KB, cited as 4:<col>).
- **RLM** = `media__modals__js__script.min.js` + `modules/{modal,slide,helper}.min.js` (Regular Labs Modals 17).
- **UI** = JCH user-interaction loader (see F6 trace): IG and LIB are *deferred* scripts — they load only after the
  first visitor interaction (or a 10 s fallback) and never for a browser that reports `navigator.webdriver`.
- REA `analyze-javascript-application` on bundle/all with `--source-path` IG, LIB, RLM ×4 → analysis
  **ev_27d0c4c7110281801be3107fcc5ad8ec2ba8ca5af69642cf6af6bc6bbbbecbec**, routes view
  ev_4630b0d06ccace45a703e1e1578f3c210f02b81e4b890b91d8f538f4d2953577 (no error; 6 sources parsed, 0 parse
  failures, 81 318 AST nodes; evidence/rea/f8-galleries/evidence.json).

**Which script is the gallery?** Not Regular Labs Modals. On every F8 page RLM binds only `[data-modals]` triggers
(script.min.js:9) and the only two are the header/menu "Log In" links to `#loginbox` (F8-01). Every gallery is an
Ignite Gallery block (`.ig-gallery-wrapper`, one per gallery, `data-ig-*` options in the markup) driven by IG +
LIB. Gallery options seen on all F8 pages: `data-ig-collecthits="0"` (no hit-counter request),
`data-ig-showhash="javascript"` (no URL updates while browsing), lightbox `infinite=1` (wrap-around),
`fullscreen=none`, `lbox-autoplay=0`, `disable-rightclick=0`.

**Entry point.** IG:4 `jQuery(document).ready` → IG:97 for each `.ig-gallery-wrapper`: read options, find its
lightbox template `#ig-lightbox-template-<id>`.
- Galleries with `data-ig-show-main-image="1"` (covers, map-locations embeds): IG:100–104 build a UIkit slideshow
  (main image) with prev/next arrows; a `?i=<image-alias>` query would select the start image (IG:100).
- IG:344–355 `createPanel('*')` (called at IG:540): copies the template HTML, builds one lightbox item per hidden
  `.ig-lightbox-link` (source = its `href`, the 1080 px image; caption = the item's
  `.ig-lightbox-description-content` HTML; alt = the slideshow image's alt) (IG:355–361) and creates
  `iguiUIkit.lightboxPanel({items, delayControls: 6000, preload: 2, finite: !infinite, animation: fade,
  velocity: 800/300})` (IG:361).

**Functions and hops.**

| Where | Role |
|---|---|
| IG:362 | on `shown`: clicks inside a lightbox slide stop propagating (clicking the picture does nothing) |
| IG:366–371 | on `show`: optional fullscreen (off here); toolbar buttons bound once (download, share, close-modal) |
| IG:432 | `.ig-image-total` = number of items in this gallery (counter "n / N") |
| IG:433–438 | mouse wheel over the open lightbox (non-Mac): wheel up = next, wheel down = previous, one step per 800 ms |
| IG:440–445 | on `beforeitemshow`: `.ig-image-number` = index + 1; URL rewritten only when `showhash=="hash"` (not here) |
| IG:515–517 | on `beforehide`: an embedded slideshow jumps to the image last shown in the lightbox |
| IG:521–531 | on `hidden`: removes `?i=` from the address with `replaceState` (only for galleries without a main image) |
| IG:540–541 | `panel=createPanel('*')`; `data-ig-lbox-view=1` would open at once (0 here) |
| IG:555–559 | deep link: `?i=<alias>` (underscores → hyphens) opens the lightbox at that image on load — **but the server 301-redirects any unknown query parameter to the clean URL, so this never happens on the live site** (F8-16) |
| IG:562–569 | click on the main slideshow image → lightbox at the slideshow's index |
| IG:579–589 | click on a thumbnail (`.ig-img-link`): main-image galleries → slideshow shows that image; others → lightbox opens at that index |
| IG:592–606 `imageUrl` | builds `<url>?i=<alias>` for share links / hash mode |
| IG:199, 511 | hit counter GET `task=imagefront.addHit` — skipped because `collecthits=0` |
| IG:507–508 (lightbox), 242–243 (main slideshow) | download button → navigation to `task=imagefront.download&type=lbox|main&id=`; share buttons open Facebook/Twitter share windows (not exercised: they leave the page) |
| IG:246/254, 380/387 | rating / comment requests — no rating or comment markup on these galleries, never sent |
| LIB 4:97315 | lightboxPanel defaults: `delayControls` (controls fade after inactivity; IG passes 6000 ms), close selector `.igui-close-large`, items `.igui-lightbox-items` |
| LIB 4:98951 | `keyup` on document while open: ArrowLeft (37) previous, ArrowRight (39) next |
| LIB 4:81334 | `keydown` Escape (27) closes the top modal; a document click outside the modal closes it (`bgClose`) — but every click inside the lightbox lands on the lightbox itself (picture, slide, caption strip), so in practice clicks never close it (F8-11, F8-37) |
| LIB 4:99385 | on `itemshow`: caption shown only when non-empty; loads the current item and `preload` (2) neighbours on each side |
| LIB 4:92779 | prev/next get `igui-invisible` at the ends only when `finite` (not here) |
| LIB 4:89348 | pointer drag/swipe with a 10 px threshold moves to the neighbour (touch and mouse) |

**Data flow / dependencies.** Gallery content is entirely in the server HTML (thumbnail `src` = 192 px or 144 px
copies, hidden links to 1080 px originals, captions in hidden blocks). Pagination is server-side:
`?thumb_limitstart=<offset>&limit=100` links inside two `form.ig-thumb-pagination` blocks (above/below the grid).
No same-site XHR, no browser storage (IG only touches `localStorage['ig-gdpr']` for galleries that gate video
embeds behind a GDPR button — none here). **Effects:** DOM (lightbox mounted under `<body>`, class
`igui-lightbox-page` on `<html>` while open), no URL change. **Server-side unknowns:** how galleries/categories are
stored (com_igallery tables), the per-page limit 100 and the redirect allow-list for query parameters.

## T2 Control → effect: a thumbnail on /gta-6/screenshots/

1. **Server page.** The page HTML already holds 100 thumbnails (192 px images, eager), 100 hidden lightbox links to
   1080 px images, the lightbox template (counter text "/ 100", download/share/close buttons, prev/next arrows)
   and two pagination blocks (snapshot; F8-01 `thumb=100`, `pagination=2`).
2. **First interaction → gallery script.** The hover in `macro:wake` lets JCH load IG + LIB (UI:4/50). IG:97 →
   IG:344–361 builds one lightbox panel per gallery from the hidden links; `.ig-image-total` = 100 (IG:432).
3. **Click thumbnail 1** (F8-02). IG:579–589: this gallery has no main image (`show-main-image=0`) and lightbox
   enabled → `panel.show(0)`.
4. **Lightbox opens.** LIB lightboxPanel mounts under `<body>`, adds `igui-lightbox-page` to `<html>` (page
   scroll locked; F8-02 `page-scroll-lock=1`), IG:445 writes the number → counter "1/100" (F8-02); LIB 4:99385
   loads the current image and 2 neighbours on each side (F8-02 `lb-loaded-image`), sets the caption (empty for
   screenshots; F8-02 `lb-caption`). The URL does not change (`showhash=javascript`; F8-02..F8-08 `url`).
5. **Keys / arrows.** LIB 4:98951 `keyup` ArrowRight → next ("2/100", F8-03); ArrowLeft ×2 → wraps to "100/100"
   (F8-04); ArrowRight → wraps to "1/100" (F8-05); next/prev arrows do the same (F8-06, F8-07).
6. **Close.** Escape (LIB 4:81334; F8-08) and the × button (F8-10) close it; `<html>` loses `igui-lightbox-page`
   (F8-08/F8-10 `page-scroll-lock=0`). A click on the caption strip (F8-11) or on the picture (F8-37; IG:362 stops
   the click) leaves it open. Reload closes it with no restore (F8-13).

## Rules (T3)

| Rule id | plain words | script | observations reproduced n/n | proving input |
|---|---|---|---|---|
| F8-R1 counter & wrap | opening from item k shows "k/N" (N = images of that block on this page); next = k%N+1, previous = (k−2+N)%N+1; N=1 stays 1/1; Enter on a thumbnail = click; clicking the picture changes nothing | evidence/rules/f8-galleries-counter.mjs | 17/17 | F8-04: from 2/100, ArrowLeft ×2 → 100/100 |
| F8-R2 open/close/URL/loading | open locks page scroll and shows close/prev/next + 3 toolbar actions; Escape, × and reload close; clicks on the picture or caption strip do not; URL never changes; `?i=` is redirected away; images load current ±2, union over visited | evidence/rules/f8-galleries-lightbox-state.mjs | 17/17 | F8-36: after visiting 100,1..6 → 11 large images loaded |
| F8-R3 paging & tab bar | 100 per page, `?thumb_limitstart=(p−1)*100&limit=100`, first/prev disabled on page 1, next/last on the last; lightbox per page; unknown params stripped, utm kept; tab bar on 3 pages with the current marked | evidence/rules/f8-galleries-pagination.mjs | 21/21 | F8-15: page 3 shows 95, opening 1 then previous → 95/95 |
| F8-R4 blocks, captions, embedded | one lightbox per gallery block; caption = item description; embedded block: thumbnail sets main image, main image opens the lightbox there, closing syncs the main image to the last lightbox image | evidence/rules/f8-galleries-blocks.mjs | 11/11 | F8-27: thumbnail 2 then main image → 2/13 |

## Cases

- File: `evidence/cases/f8-galleries.json` — **38 cases** (F8-01..F8-38; mobile cases F8-31, F8-32, F8-38 are last
  in the file because the viewport carries over); run `evidence/runs/run-f8-galleries.json` (38 cases, merged per case from 7 batch runs started 11:36–11:59 UTC (each case's batch is in its `batch` field) because the origin failed intermittently; the latest error-free record of each case is kept).
- Clean: 38/38. Excluded: none in the final run. Harness fixes on the way (all re-run): (1) JCH defers the
  gallery scripts until interaction and never loads them under `navigator.webdriver` → runner `browser.args`
  patch + `--disable-blink-features=AutomationControlled` and a `wake` macro (hover heading + thumbnail, waits);
  (2) after a page change the gallery script needs a few seconds before a thumbnail click (otherwise the click
  follows `href="#"`) → longer `wake`; (3) origin HTTP 500/timeouts 10:45–11:45 UTC on uncached pages → those
  cases waited for recovery.
- Coverage: happy path (thumbnail → lightbox), keyboard (Enter on a thumbnail, ArrowLeft/Right, Escape), buttons
  (next/prev/close), wrap at both ends (F8-04, F8-05, F8-07, F8-15, F8-21, F8-35), single image (F8-24, F8-25,
  F8-38), non-closing clicks (F8-11, F8-37), reload (F8-13), paging first/middle/last (F8-01, F8-14, F8-15), deep
  link and query redirect (F8-16, F8-17), media tabs (F8-01, F8-18, F8-19, F8-29), multi-block page (F8-19..F8-22),
  embedded gallery (F8-26..F8-28), lazy image loading (F8-02, F8-34, F8-36), RL Modals triggers (F8-01), 404
  (F8-30), 390×844 (F8-31, F8-32, F8-38).
- Data-only readout keys: `heading`, `title`, `count:thumb`, `count:g1-thumb`, `count:g2-thumb`, `count:g3-thumb`,
  `count:gallery`, `list:gallery-heading`, `attr:thumb-1-img@alt`, `attr:lb-image@alt`, `attr:g1-*-img@alt`,
  `text:lb-caption`, `text:image-description`, `text:lb-total`. Behavior keys: `url`, `text:lb-counter` (format and
  position), `count:lightbox`, `count:page-scroll-lock`, `visible:*`, `count:lb-loaded-image`, `count:lb-slot`,
  `count:lb-toolbar-action`, pagination state, media tab labels/active, `count:modal-trigger*`, `calls`.

## Command vocabulary

Selectors live in tools/profiles/f8-galleries.profile.json (CSS copied from the original markup — analysis side only).

| token | role | accessible name / visible label | what it does |
|---|---|---|---|
| heading | heading level 1 | gallery page title | page identity |
| media-tab / media-tab-active | links styled as buttons | "Screenshots", "Trailer Screens", "Artworks", "Videos"; the current page's tab is highlighted (class only, no aria-current) | switch media page |
| gallery | gallery block | — | one per gallery (screenshots 1, trailer screens 1, artworks 6, covers 1, map-locations 6 embedded) |
| gallery-heading | heading level 2 | gallery title on artworks ("GTA 6 Main Artworks", …) | — |
| thumb / thumb-N | link (`href="#"`) wrapping a thumbnail image | image alt text (e.g. "gta 6 screen") — no other accessible name | opens the lightbox at that image (or, in embedded galleries, shows it as the main image) |
| main-image / g1-main-active | clickable main image (embedded/cover galleries) with a zoom icon | image alt | opens the lightbox at the shown image |
| g1-main-next | link | (icon) | main slideshow next |
| image-description | text under the cover image | caption | — |
| lightbox | full-screen dialog layer | — | open while viewing |
| lb-counter | text | "n/N" (`n` then "/" then `N`) | position in the current gallery (page) |
| lb-prev / lb-next | link | aria-label "previous" / "next" (icon arrows) | previous / next image, wrap at the ends |
| lb-close | button | aria-label "close" (icon ×) | close |
| lb-caption | text below the image | caption HTML of the item (empty for most screenshots) | — |
| lb-image | image | alt of the item | the large image |
| lb-toolbar-action | icon buttons (no names) | download, Facebook share, Twitter share | not exercised (download / share leave the page) |
| pagination / pagination-item / pagination-active | navigation "Pagination" (twice: above and below the thumbnails) | "Page 1" (current, aria-current), "Go to page 2", "Go to next page", "Go to last page"; first/previous disabled on page 1 | server page change `?thumb_limitstart=<offset>&limit=100` |
| modal-trigger-login | link | "Log In" | opens the login modal (Regular Labs Modals) — header shell, not a gallery |

## Behavior summary for the spec

1. **Media pages and tab bar.** Screenshots, Trailer Screens, Artworks share a 4-button tab bar
   ("Screenshots", "Trailer Screens", "Artworks", "Videos") under the H1; the current page's button is
   highlighted; each is a normal link. The Videos page (and Covers) has no tab bar (F8-01, F8-18, F8-19, F8-23, F8-29).
2. **Gallery blocks.** A media page holds one or more gallery blocks. Screenshots and Trailer Screens: one block
   of up to 100 thumbnails per page. Artworks: 6 blocks, each under its own H2 (main, characters, postcards, …).
   Covers: one block with a single large image and a caption under it. Map & Locations embeds galleries with a
   large main image + a horizontal thumbnail strip (F8-01, F8-18, F8-19, F8-23, F8-26).
3. **Thumbnails.** Each thumbnail is a link-wrapped image with the image's alt text (often generic, e.g.
   "gta 6 screen"); no visible caption under thumbnails. Thumbnails load eagerly; the large images load only
   when needed (F8-01, F8-02).
4. **Paging.** Large galleries are paged server-side, 100 per page, with two identical pagination bars (above and
   below): first / previous (disabled on page 1), numbered pages (current marked, "Page n"), next, last; links are
   `?thumb_limitstart=<(page-1)*100>&limit=100`. The lightbox only ever covers the current page's images
   (F8-01, F8-14, F8-15, F8-18).
5. **Open.** Clicking a thumbnail — or pressing Enter on a focused thumbnail — opens a full-screen lightbox on that
   image (F8-02, F8-09, F8-12). In galleries with a main image, a thumbnail click only changes the main image;
   clicking the main image opens the lightbox on it (F8-24, F8-26, F8-27).
6. **Lightbox layout.** Top bar: counter "n/N", download, Facebook, Twitter icons, close (×, name "close");
   left/right arrows (names "previous"/"next"); large image (alt = item alt); caption area below (item
   description, empty when none) (F8-02, F8-20, F8-24). With a single image there are no arrows (F8-24, F8-38).
   The page behind does not scroll while open (F8-02). Controls fade after a few seconds without pointer/keyboard
   activity and come back on activity (static).
7. **Navigate.** Next = ArrowRight or the right arrow; Previous = ArrowLeft or the left arrow; it wraps at both
   ends (1 ← N, N → 1); with one image it stays on 1/1 (F8-03..F8-07, F8-15, F8-21, F8-25, F8-35, F8-36).
   Mouse wheel and swipe/drag also step (static). The counter and caption follow the image (F8-20, F8-21).
8. **Close.** Escape or the × button closes it (F8-08, F8-10, F8-33); clicking the image or the caption strip does
   nothing (F8-11, F8-37). After closing, an embedded gallery shows, as its main image, the last image viewed
   (F8-28).
9. **URL.** The address never changes while opening, browsing or closing; there is no per-image deep link (an
   `?i=<image>` link is redirected by the server to the clean page URL and opens nothing); reloading closes the
   lightbox. Paging is the only URL state (F8-02..F8-10, F8-13, F8-16, F8-17).
10. **Preloading.** On open the lightbox loads the shown image and the two neighbours on each side; moving loads
    the next neighbours; loaded images stay (F8-02, F8-34, F8-36).
11. **Mobile (390×844).** Same thumbnails and counter; the arrows and close button stay visible and work
    (F8-31, F8-32, F8-38); swipe (static).
12. **Login modal is not a gallery.** The only Regular Labs modal triggers on these pages are the header "Log In"
    links (out of scope; F9) (F8-01).
13. **Unknown gallery URL** returns the site's 404 page (F8-30).

## Findings

- **F-F8-01** The galleries are Ignite Gallery (com_igallery) blocks driven by `ignitegallery-42.js` + `lib-42.js`
  (a namespaced UIkit 3 lightbox/slideshow), not Regular Labs Modals; Modals only serves the header "Log In" box
  (2 triggers to `#loginbox` on the screenshots page). Evidence: IG:97–361, RLM script.min.js:9, F8-01.
- **F-F8-02** Both gallery scripts were missing from the phase-2 bundle because JCH defers them until the first
  user interaction and never loads them when `navigator.webdriver` is true; the runner needed
  `--disable-blink-features=AutomationControlled` (added as optional `browser.args` in tools/web/run-cases.mjs).
  Before the scripts load, a thumbnail click just follows `href="#"` (URL gains `#`, nothing opens). Evidence:
  UI:4/50; probe of page 2 (11:44 UTC): `…/?thumb_limitstart=100&limit=100#`, 0 lightboxes.
- **F-F8-03** Screenshots: 295 images in 3 server pages (100/100/95); Trailer Screens: 100 on page 1 with the same
  pagination; Artworks: 6 blocks (9, 14, 6, … ; 59 thumbnails in total); Covers: 1 image + caption;
  Map & Locations: 6 embedded blocks (first: 13 images). Evidence: F8-01, F8-14, F8-15, F8-18, F8-19, F8-23,
  F8-26 (data counts; rebuild uses its own).
- **F-F8-04** Lightbox counter "n/N" is per block and per page; navigation wraps both ways; single image has no
  arrows. Evidence: F8-02..F8-07, F8-14, F8-15, F8-20..F8-25, rule f8-galleries-counter.mjs.
- **F-F8-05** Close: Escape and × only (plus reload); clicking the picture or the caption strip does not close;
  page scroll is locked while open. Evidence: F8-08, F8-10, F8-11, F8-13, F8-33, F8-37.
- **F-F8-06** No URL state for the lightbox (`showhash="javascript"`); the script supports `?i=<image-alias>` deep
  links but the server 301-redirects unknown query parameters to the clean URL, so they never work. `utm_*`,
  `thumb_limitstart`, `limit` survive. Evidence: F8-02..F8-10 `url`, F8-16, F8-17, curl redirects.
- **F-F8-07** Large images are loaded on demand: current ±2 on open (5), growing with navigation (11 after 6
  moves); thumbnails are eager (192 px; no `loading="lazy"` on the screenshots page). Evidence: F8-01, F8-02,
  F8-34, F8-36; LIB 4:99385.
- **F-F8-08** Embedded galleries (main image + strip): thumbnail changes the main image without opening; main
  image opens the lightbox at its index; closing syncs the main image. Evidence: F8-26..F8-28; IG:515–517, 562–589.
- **F-F8-09** The Videos tab leads to a page without the tab bar and without galleries; Covers has no tab bar.
  Evidence: F8-29, F8-23.
- **F-F8-10** Hit counting, rating and comments exist in the script but are off for these galleries
  (`data-ig-collecthits="0"`, no rating/comment markup); no gallery request was sent in any case (`calls` empty).
  Evidence: F8-01/F8-02 `calls`, gallery `data-ig-*` attributes.
- **F-F8-11** The lightbox toolbar has download, Facebook and Twitter icon buttons without accessible names;
  arrows are named "previous"/"next", close "close". Evidence: template markup, F8-02.

## Unknowns

- **U-F8-01** Swipe/drag and mouse-wheel navigation were not exercised (runner has no drag/wheel step). Static:
  drag threshold 10 px (LIB 4:89348), wheel up = next / down = previous, 800 ms debounce, not on Mac (IG:433–438).
  Rebuild: support swipe on touch; wheel optional.
- **U-F8-02** Controls auto-hide timing (6 s of inactivity, LIB 4:97315 with IG `delayControls: 6000`) was not
  measured. Rebuild: fade controls after a few seconds of inactivity or keep them visible.
- **U-F8-03** Download/share buttons not exercised (they leave the page / hit a server task). Rebuild: optional
  "open original" link.
- **U-F8-04** Gallery storage/ordering on the server (newest first? manual order) unknown. Rebuild: explicit
  order field in seed data.
