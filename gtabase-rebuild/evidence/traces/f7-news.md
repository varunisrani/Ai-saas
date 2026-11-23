# F7 — News, guides & videos + article page (feature id `f7-news`)

Observed 2026-11-23 on https://www.gtabase.com as a guest (never signed in). Analysis side of the clean-room
wall: file:line references point at the site's downloaded scripts; the "Behavior summary" is plain language.
Author names are people: they are only ever counted here ("author name" placeholder), never recorded.

Pages: `/gta-6/news/` (+ `page-N`, `?start=`), `/gta-6/guides/`, `/gta-6/videos/`, the all-games `/news/`
(only its "Filter by Game" → GTA 6 link matters), article pages `/gta-6/articles/<slug>` and
`/articles/gta-6/<slug>` (e.g. gta-6-driving-tips, gta-6-controls-guide-ps5-xbox-button-layout), and a video
item page (the videos list links to ordinary article pages that embed a YouTube player, e.g.
`/articles/gta-6/grand-theft-auto-vi-launch-trailer`).

## T1 Explain (static)

REA evidence: **ev_02c56b6b18edaed3e79bc9f941d795c5525ab1459809c33239f64fcf648b9a28** (javascript-routes summary view)
of parent **ev_79c4127b8dc1237459bb7000adbc1010b0e11065d074eaa350cdefb24fdfd172**
(`analyze-javascript-application` on evidence/bundle/all, 4 selected sources parsed complete, 0 route patterns).
The lists and articles are plain server-rendered Joomla category-blog and article views; there is no
client-side list engine (unlike F1). JavaScript only lazy-inserts some blocks and loads the comment widget.

**Entry points**
- `/gta-6/news/` (menu item of the "Grand Theft Auto VI" news category; the same category is also reachable
  at its own alias `/gta-6/articles`), `/gta-6/guides/`, `/gta-6/videos/` and the all-games `/news/`
  ("Rockstar Games News & Guides", parent category). Evidence: evidence/html/gta-6_news_.html,
  gta-6_guides_.html, gta-6_videos_.html, news_.html; F7-37 (/gta-6/articles → 200, same list, title
  "Grand Theft Auto VI | Rockstar Games News & Guides").
- Article pages under two URL shapes: `/gta-6/articles/<slug>` (newer) and `/articles/gta-6/<slug>`
  (older), plus legacy `/news/...` and `/articles/<slug>` items that the lists still link to
  (evidence/html/gta-6_videos_.html item hrefs).
- Scripts: reduce_dom (`media__com_jchoptimize__cache__js__fe123a…539bfd6c….js`), AddToAny config
  (`…41e29af5….js`), comment-widget loader (`inline-06b6877c138b.js`, same block on every list/article),
  template.js (`…3322421d….js`, back-to-top).

**Functions / hops (file:line)**
| # | What | Where |
|---|---|---|
| 1 | list pagination, the article prev/next pager, the "below content" modules (related "Controls Across All Games", VIP banner) and the footer (breadcrumbs) are shipped inside `<template>` blocks and only inserted when they come within 200 px of the viewport | reduce_dom bundle :4 (ROOT_MARGIN '200px 0px'), :11–:13 (`activateBlock`, `lazyLoadHtml`) |
| 2 | share block: AddToAny buttons Twitter / Reddit / Copy Link; tweet text template "${title} ${link} - via @GTABase" | AddToAny declaration bundle :3; markup `.addtoany_list` in every list header (guides, videos) and article meta |
| 3 | comment widget: loads its assets when `#jlexcomment` scrolls into view (IntersectionObserver) or at once when the URL hash is `#comment-<n>`; config sort "desc" (Newest), min length 2, max length 5000, request `/index.php?option=com_jlexcomment` | inline-06b6877c138b.js :2–:8; article HTML config `"cm_min_length":2,"cm_max_length":5000` |
| 4 | back-to-top control (shared shell) | template.js :6 |
| 5 | "Filter by Game" = Bootstrap dropdown (button `data-bs-toggle="dropdown"`) whose items are plain links to separate per-game list URLs | evidence/html/news_.html, gta-6_news_.html; media__vendor__bootstrap__js__dropdown.min.js |
| 6 | quick index (table of contents) = Regular Labs markup rendered by the server: `ol.index` of `a.index-link` with `href=<article path>#<anchor>` and `data-heading`, anchors `span.anchor[id]` inside each indexed h2/h3; no script involved (no quickindex script among the 159 files) | evidence/html/gta-6_articles_gta-6-driving-tips.html |

**Data flow**: server → HTML. Page size, ordering, pagination counters, item fields, meta lines and
pager neighbours are all decided by the server (Joomla category blog settings). No XHR/fetch on list or
article pages for a guest (walk.json, routes /gta-6/news/, /gta-6/guides/, /gta-6/videos/, the article).

**Dependencies**: no storage keys (walk storage empty). Endpoints (observe only, never called by our cases):
`POST /index.php?option=com_jlexcomment&task=item.save` (comment form action), jlexcomment list loads.

**Effects**: DOM insertion of lazy blocks; hash navigation for table-of-contents links.

**Server-side unknowns**: the exact sort key (observed: published date, newest first — the `datetime`
attributes never increase over all 172 news items); whether "Last Updated" vs "on <date>"
in the article meta is a per-article setting (HYPOTHESIS: per-article "show modified date" option);
how the guides list selects its items (it mixes articles with section pages such as cheats and
best-vehicles — HYPOTHESIS: a curated/tagged menu list).


## T2 Control → effect

Static hops cite the scripts analysed in REA ev_02c56b6b… (parent ev_79c4127b…); dynamic hops cite recorded cases.

Main control: **the pager's "Go to next page" link** on `/gta-6/news/`.

| Hop | What happens | Evidence |
|---|---|---|
| 1 | Server renders page 1: description block (banner, own h1 "All GTA 6 News: Latest Updates on Grand Theft Auto VI", intro text, "Filter by Game" dropdown) + 30 items + counter "Page 1 of 6" + a pager kept inside a `<template>` | evidence/html/gta-6_news_.html; F7-01 (`count:page-links`=0 before scrolling) |
| 2 | Scrolling the counter into view (pager within 200 px of the viewport) makes reduce_dom swap the template in: first/previous disabled, numbered links 1–6 (current "1", href "#", aria-current), next → /gta-6/news/page-2, last → /gta-6/articles/page-6 | reduce_dom bundle :4, :11–:13; F7-02 |
| 3 | Click "Go to next page" → full page load GET /gta-6/news/page-2 (200) | F7-03 calls |
| 4 | Page 2: description block gone; heading = category name + " - Page 2" ("Grand Theft Auto VI - Page 2"); title "Grand Theft Auto VI \| Rockstar Games News & Guides - Page 2"; counter "Page 2 of 6"; next 30 items continue the newest-first order | F7-03, F7-04; probe-f7-news-dates.json |
| 5 | Back → page 1 again (from cache/server), counter "Page 1 of 6" | F7-05 |
| 6 | "Go to last page" → /gta-6/articles/page-6: "Page 6 of 6", 22 items; next/last become disabled icons, first/previous now link to /gta-6/news/ and /gta-6/news/page-5 | F7-06, F7-07 |

Rule scripts: evidence/rules/f7-news-pagination.mjs, f7-news-order-date.mjs.

## Rules (T3)

| Rule id | plain words | script | observations reproduced n/n | proving input |
|---|---|---|---|---|
| F7-R1 | Lists are newest-first by published date-time; each date line reads "on <Month> <D>, <YYYY>" for the UTC calendar date; 30 per page, counter "Page N of ceil(total/30)" | evidence/rules/f7-news-order-date.mjs | 363/363 | item published 2026-11-21T00:16:15Z shows "on November 21, 2026" (UTC date, not a US date) |
| F7-R2 | Page 1 = list URL, page N ≥ 2 = `<list URL>page-N`, `?start=30*(N-1)` equivalent; `page-1` and pages past the end are 404; a start offset past the end gives the last counter with 0 items; pager shows up to 10 numbers, first/previous and next/last become disabled icons at the ends; the original's news "last" link uses the other alias (/gta-6/articles/page-6) because /gta-6/news/page-6 is a 404 | evidence/rules/f7-news-pagination.mjs | 84/84 | `/gta-6/news/?start=999` → 200, "Page 6 of 6", 0 items, while `/gta-6/news/page-99` → 404 |
| F7-R3 | Fields per list item: News = author + date + category; Guides = category only; Videos = date only; all-news = author + date + tags | evidence/rules/f7-news-item-fields.mjs | 17/17 | guides page: 30 items, 0 dates, 0 authors, 30 category labels (F7-14) |
| F7-R4 | Article pager: previous (rel=prev) = the newer neighbour in the News list order, next (rel=next) = the older neighbour | evidence/rules/f7-news-article-pager.mjs | 9/9 | driving-tips (list position 8): previous = position 7, next = position 9 |
| F7-R5 | Table-of-contents links = "<article path>#<slug of the section heading>" in document order (slug: lower case, "&"/punctuation dropped, spaces → "-") | evidence/rules/f7-news-toc-anchor.mjs | 25/25 | "Getting Out: Stop, Bail or Leave the Engine Running" → `#getting-out-stop-bail-or-leave-the-engine-running` |

Page `<title>` rules for lists/articles are in F9-R5 (evidence/rules/f9-shell-page-title.mjs, includes the F7 runs).

## Cases

- File: evidence/cases/f7-news.json — **48 cases**; run file evidence/runs/run-f7-news.json — **48 clean, 0 excluded**
  (`node common/runs.mjs count ../evidence/runs` → `f7-news 48 cases 48 clean`).
- Profile: tools/profiles/f7-news.profile.json (copy of app.profile.json + 61 tokens, 9 modes, macros
  `show-pagination` = scroll the counter into view so the lazy pager is inserted, `show-pager`, `to-bottom`;
  YouTube and Google hosts blocked; `network.include` limited to document URLs so `calls` shows each page's HTTP status).
- The run file merges 4 passes (`passes`; per case `captured` + `attempts`). A first full run at 11:19 UTC was
  stopped after F7-06 because /gta-6/news/ answered HTTP 500 after 61 s (origin outage, F-F7-19); its results were
  discarded. Pass A (11:22) ran the cases that do not need /gta-6/news/, pass B (11:37) added F7-39…F7-48 on cached
  pages, pass C (11:42, after /gta-6/news/ recovered) ran the news cases, pass D re-ran F7-06/F7-07 (last-page click
  timed out at 6 s while the uncached page-6 loaded) and F7-19 (same, video article). No case is excluded.
- Supporting evidence (read-only): probe-f7-news-dates.json (published date-time + shown date of all 172 news
  items, curl), probe-f7-news-order.json (link order of all 172 items + 3 article pagers), probe-f7-pagination-status.txt
  (curl status/title/counter of 21 list URLs), probe-f7-articles.json (3 article structures; author names replaced).
- Data-only readout keys: `list:item-date`, `attr:item-date@datetime`, `text:item-title-link`,
  `attr:item-title-link@href`, `attr:item-thumb-link@href`, `attr:item-thumb@alt`, `text:article-published`,
  `attr:article-published@datetime`, `text:article-modified`, `attr:article-modified@datetime`, `list:toc-links`,
  `list:section-headings`, `text:toc-heading`, `attr:pager-prev@href`, `attr:pager-next@href`,
  `attr:article-hero@alt`, `text:comments-count`, the last element of `list:breadcrumb-items`, item counts of
  partial pages (22 on news page 6, 1 on guides page 3, 7 videos) and the M of "Page N of M"; `count:item-tags`.
  Author names were never read (only `count:item-author` / `count:article-author`).

## Command vocabulary

Selectors live in tools/profiles/f7-news.profile.json (CSS from the original markup unless noted).

| token | role | accessible name / label | what it does |
|---|---|---|---|
| heading | heading level 1 | page heading (list page 1 of news: the description's own heading) | — |
| page-number | text inside the heading | " - Page N" | shown on list pages N ≥ 2 |
| list-item | article (schema BlogPosting) inside the list | — | one list entry |
| item-thumb / item-thumb-link | image 320x180 (alt = title) inside a link | item title | opens the item |
| item-title-link | link inside a level-2 heading | item title | opens the item |
| item-details-label | visually hidden term | "Details" | labels the meta list for screen readers |
| item-author | text "by <author name>" | — | counted only (never stored) |
| item-date | time element | "on <Month D, YYYY>" (`datetime` = ISO UTC) | — |
| item-category | link | "Grand Theft Auto VI" | → /gta-6/news/ |
| item-tags | links (badges) | game tag ("GTA 6" → /gta-6/news/) + optional type tag ("Guide" → /news/) | all-news list only |
| list-intro / list-banner | block / image | description text, 1200x320 banner | news page 1 and videos only (banner); guides has text only |
| game-filter-toggle | button | "Filter by Game" | Bootstrap dropdown, sets aria-expanded |
| game-filter-links / game-filter-gta6 | links ×8 / link | All News, GTA 6, RDR2 & Online, GTA 5 & GTA Online, GTA 4, GTA San Andreas, GTA Vice City, GTA 3 | each a separate list URL (GTA 6 → /gta-6/news/) |
| parent-category | link | "Rockstar Games News & Guides" | → /news/ (guides, videos header) |
| share-block / share-buttons | group / links ×3 | "Share on Twitter", "Share on Reddit", "Copy Link" | AddToAny share (third-party, blocked in our runs) |
| page-counter | paragraph | "Page N of M" | — |
| pagination | navigation | "Pagination" | lazy-rendered pager |
| page-first / page-prev / page-next / page-last | links | "Go to first page" / "Go to previous page" / "Go to next page" / "Go to last page" | disabled (no link) at the ends |
| page-links / page-current / page-2-link | links | "Go to page N"; current "Page N" (aria-current="true", href "#") | numbered pages, at most 10 |
| article-meta | description list | "Details" | article meta line |
| article-author | text | "by <author name>" | only on some articles (counted only) |
| article-published / article-modified | time | "on <date>" / "Last Updated: <date>" | one of the two per article |
| article-category | link | "Grand Theft Auto VI" | → /gta-6/news/ |
| article-hero | image | article title | full-width image |
| toc / toc-heading / toc-links | box / heading / links | heading = article short title; links = section names | jump to `#<anchor>` |
| section-anchors / section-headings | anchors / h2-h3 text | — | targets of the table of contents |
| video-embed | iframe | "YouTube video player" | video pages |
| author-block | box | "Author: <author name>" + about text | some articles (person data, not recorded) |
| pager / pager-prev / pager-next | navigation / links (rel prev / next) | neighbour article titles | previous = newer neighbour, next = older neighbour |
| related-block / related-cards | box / links | e.g. "Controls Across All Games" | cross-game related guides (some articles) |
| breadcrumbs / breadcrumb-items | navigation "Breadcrumbs" | Home › GTA 6 › News › <article title> | lazy footer |
| comments / comments-count / comment-sort-options | region / text / links | "<n> Comments"; Best, Popular, Newest (default), Oldest | observe only — never written |
| comment-editor / comment-limit | textbox "editor" / counter | max 5000 characters | observe only |

## Behavior summary for the spec

1. Three GTA 6 article lists share one layout: **News** `/gta-6/news/` (all GTA 6 articles), **Guides**
   `/gta-6/guides/` (guide articles plus links to guide sections such as the cheats or best-vehicles pages) and
   **Videos** `/gta-6/videos/` (trailer/video articles). The all-games list `/news/` exists outside the GTA 6
   section; only its "Filter by Game → GTA 6" entry matters (link to `/gta-6/news/`). (F7-01, F7-14, F7-17, F7-20…F7-22)
2. List header. News page 1: a description block with its own heading "All GTA 6 News: Latest Updates on Grand
   Theft Auto VI", a "Filter by Game" button, a 1200x320 banner and an intro sentence. Guides and Videos: heading,
   a parent link "Rockstar Games News & Guides" (→ /news/), the share group (Share on Twitter / Share on Reddit /
   Copy Link, icon buttons), then intro text (Videos also a banner). (F7-01, F7-14, F7-17)
3. "Filter by Game" is a dropdown button (click or Enter opens it, Escape closes it, aria-expanded follows) whose
   menu holds 8 links — All News, GTA 6, RDR2 & Online, GTA 5 & GTA Online, GTA 4, GTA San Andreas, GTA Vice City,
   GTA 3 — each a separate list URL; there is no client-side filtering. Rebuild: only "GTA 6" (and optionally
   "All News") need to exist. (F7-21…F7-24)
4. List item = 320x180 thumbnail (alt = item title) and a title link (level-2 heading), both to the same target,
   then a meta list labelled "Details" for screen readers only, whose fields depend on the list (F7-R3): News =
   "by <author name>", date, category label "Grand Theft Auto VI" (→ /gta-6/news/); Guides = category label
   only; Videos = date only; all-news = author, date and tag badges (game tag on every item → that game's list,
   plus a "Guide" tag on guide items → /news/; 57 badges on 30 items). (F7-01, F7-14, F7-17, F7-20, F7-41)
5. Date line: "on <Month name> <day>, <year>" (no leading zero) of the UTC calendar date of the published
   date-time, which is also exposed machine-readably. Items are ordered newest published first across all
   pages. (F7-R1; F7-01, F7-03, F7-06, F7-17)
6. Paging (F7-R2): 30 items per page; Videos holds all 7 items on one page with no counter and no pager. Page 1
   is the list URL, page N is "<list URL>page-N" (also `?start=<offset>`); `page-1` and numbers past the end
   answer 404; an offset past the end shows the last page's counter and an empty list (no message). Under the
   list: counter "Page N of M" and a navigation "Pagination": first ("Go to first page") and previous ("Go to
   previous page") — disabled icons on page 1 —, numbered links "Go to page N" (at most 10; the current one is
   labelled "Page N", marked current and not a real link), next ("Go to next page") and last ("Go to last page")
   — disabled icons on the last page. Rebuild: the last-page link is "<list URL>page-M" (do not copy the
   original's alias quirk, F-F7-03). (F7-02…F7-13, F7-15, F7-16, F7-18, F7-42)
7. Pages N ≥ 2: the description block (banner, intro, filter button) is not shown; the heading reads
   "<list name> - Page N" (News uses its category name: "Grand Theft Auto VI - Page N"; Guides keeps "GTA 6
   Guides: Tips, Walkthroughs & How-To Guides - Page N"); the page title reads "Grand Theft Auto VI | Rockstar
   Games News & Guides - Page N" (F9-R5). With `?start=` the heading changes the same way but the title stays the
   page-1 title. (F7-03, F7-11, F7-12, F7-13, F7-15)
8. State lives in the URL only: Back returns to the previous page, reload and deep links reproduce a page.
   (F7-05, F7-13, F7-08…F7-12)
9. Article page: heading; meta line with an optional "by <author name>", then either "on <date>" (published) or
   "Last Updated: <date>" (modified) — exactly one of the two —, and the category link "Grand Theft Auto VI" →
   /gta-6/news/; the share group; a full-width hero image (alt text); the body. (F7-26, F7-27, F7-31, F7-47, F7-48)
10. Table of contents (long guides): a box headed with the article's short name (e.g. "GTA 6 Driving Tips") and
    an ordered list of links, one per indexed section heading, each pointing to "<article URL>#<anchor>" where the
    anchor is the slug of the section heading (lower case, words joined by "-", punctuation dropped). Clicking or
    pressing Enter on a link jumps to the section and adds the hash to the URL as a new history entry (Back
    removes it); reload and deep links with a hash keep it. Sections marked "no index" are left out. (F7-27,
    F7-28, F7-38, F7-43…F7-46, probe-f7-articles.json)
11. Video item page = an ordinary article whose body embeds a YouTube player (iframe titled "YouTube video
    player"); such news posts show "by <author name>" in the meta line and end with an author box ("Author:
    <author name>" + short bio). Rebuild: embed a video player for sample video items; invented author names. (F7-19)
12. After the body (in this order): previous/next pager to the neighbours in the News list (F7-R4: previous =
    newer, next = older, each showing the neighbour's title with a chevron); an optional related box (e.g.
    "Controls Across All Games" with 2 cards on the controls guide); a VIP banner; the comments area. (F7-29, F7-31)
13. Comments area (observe only): count label ("Comment" with "Be the first to comment." when empty, "<n>
    Comments" otherwise), a sort menu Best / Popular / Newest (default) / Oldest, a text editor (accessible name
    "editor", 5000 characters max with a "characters left" counter), log-in buttons and "or post as a guest" with
    a name field. Rebuild v1 has no comments (PENDING_FEATURES #2): show a static note or omit. (F7-27, F7-47, F7-48)
14. Breadcrumb trail on articles: Home › GTA 6 › News › <article title, not a link> (also published as
    structured data); on lists: Home › GTA 6 › News|Guides|Videos. (F7-30, F7-31, F9-33, F9-34; guides/videos
    trails in evidence/html/gta-6_guides_.html, gta-6_videos_.html)
15. Unknown article slugs under both URL shapes answer HTTP 404 with the site's 404 page. (F7-32, F7-33)
16. Phone 390x844: lists, table of contents, share group, hero image and the "Filter by Game" button stay
    visible; the sidebar is still rendered (stacked, not hidden). (F7-34, F7-35, F7-39, F7-40, F7-46)
17. Personal data: author and commenter names never enter the rebuild; sample data uses invented authors.

## Findings

- F-F7-01 The lists and articles are server-rendered Joomla category-blog / article views; no XHR or fetch happens
  on them for a guest, and the only scripts involved insert lazy blocks (pager, footer) and the comment widget.
  Evidence: walk.json requests for /gta-6/news/, /gta-6/guides/, /gta-6/videos/, the article; REA ev_02c56b6b…;
  F7-01 (`calls` = the page GET only).
- F-F7-02 Page size 30; page N at "<list>page-N" and at `?start=30*(N-1)`; `page-1` and pages past the end are 404;
  a start offset past the end answers 200 with the last counter and 0 items. Evidence: F7-03, F7-08…F7-12,
  F7-15, F7-16, F7-18; probe-f7-pagination-status.txt; rule F7-R2.
- F-F7-03 Quirk: on /gta-6/news/ the pager's numbered link to the last page and "Go to last page" point to
  `/gta-6/articles/page-6` (the category's own alias), because `/gta-6/news/page-6` is a 404 — the menu alias
  cannot reach its own last page. Pages 2–5 work under both aliases. Evidence: F7-02, F7-04, F7-06, F7-08, F7-37.
- F-F7-04 Pages N ≥ 2 drop the list's description block (heading, banner, intro, filter button) and show the
  category name + " - Page N" as heading, with the title "Grand Theft Auto VI | Rockstar Games News & Guides -
  Page N"; `?start=` pages keep the page-1 title. Evidence: F7-03, F7-11, F7-12, F7-13, F7-15.
- F-F7-05 Order is newest published first; the 172 `datetime` values of all six news pages are non-increasing and
  every shown date equals the UTC calendar date ("on November 21, 2026" for 2026-11-21T00:16:15Z). Evidence:
  probe-f7-news-dates.json; F7-01, F7-03, F7-06, F7-17 lists; rule F7-R1.
- F-F7-06 Meta fields differ per list (News: author + date + category; Guides: category only; Videos: date only;
  all-news: author + date + tags, 57 tag badges on 30 items). Evidence: F7-01, F7-14, F7-17, F7-20; rule F7-R3.
- F-F7-07 The Guides list (61 entries: 30 + 30 + 1) mixes articles with section pages (the three cheats pages,
  best-vehicles and best-weapons rankings, the soundtrack album page, the features recap); it shows no dates, so
  its order cannot be checked by date. Evidence: F7-14, F7-15, probe-f7-pagination-status.txt (guides lines).
- F-F7-08 The Videos list has 7 items (2019–2026) on one page and links to ordinary articles under several URL
  shapes (`/articles/gta-6/<slug>`, `/articles/<slug>`, `/news/grand-theft-auto-6/<slug>`, `/news/<slug>`); the
  item page embeds a YouTube iframe titled "YouTube video player". Evidence: F7-17, F7-19, F7-40, F7-41,
  evidence/html/gta-6_videos_.html.
- F-F7-09 "Filter by Game" is a Bootstrap dropdown of plain links to separate per-game list URLs (8 entries);
  click and Enter open it (aria-expanded="true"), Escape closes it. The all-games list `/news/` has 50 pages.
  Evidence: F7-20…F7-24.
- F-F7-10 Article meta shows exactly one date: "on <date>" (published) or "Last Updated: <date>" (modified;
  the `datetime` attribute still carries the published-date property); the "by <author>" line is a per-article
  option (the driving-tips and controls articles omit it although the News list shows an author for every item;
  the launch-trailer post shows it plus an author box). Evidence: F7-27, F7-31, F7-19, probe-f7-articles.json.
- F-F7-11 The table of contents is server-rendered (no script), its links are "<path>#<slug>" (rule F7-R5);
  Enter on a link works, the hash survives reload, Back removes it. Evidence: F7-27, F7-28, F7-38, F7-43…F7-45.
- F-F7-12 The article pager links the neighbours in the News list (rule F7-R4). Evidence: F7-29,
  probe-f7-news-order.json.
- F-F7-13 Breadcrumbs (footer) for articles: Home › GTA 6 › News › title; the same trail is also emitted as
  schema.org BreadcrumbList JSON-LD. Evidence: F7-30, F7-31, probe-f7-articles.json `ldBreadcrumb`.
- F-F7-14 Comments area structure (observe only): count label, sort Best/Popular/Newest(default)/Oldest, editor
  (5000 max, min 2 in the widget config), guest name field, form action
  `/index.php?option=com_jlexcomment&task=item.save`; its assets load when the area scrolls into view.
  Evidence: F7-27, F7-47, F7-48, inline-06b6877c138b.js :2–:8, probe-f7-articles.json. Nothing was typed or sent.
- F-F7-15 Unknown slugs under `/gta-6/articles/` and `/articles/gta-6/` answer 404. Evidence: F7-32, F7-33.
- F-F7-16 Each list page is cached separately by LiteSpeed, so page snapshots can disagree: one article appeared
  on news page 2 (dated 19 Nov 2026) and again on page 3 (dated 7 Sep 2026) in the same capture. Evidence:
  probe-f7-news-order.json positions 36 and 81. Not a behavior to copy.
- F-F7-17 The pager, the article pager, the "below content" modules and the footer are inserted lazily when
  scrolled within 200 px (before that the pager has 0 links). Evidence: F7-01 (`count:page-links` 0) vs F7-02 (8);
  reduce_dom bundle :4, :11–:13.
- F-F7-18 The share group consists of three icon links labelled "Share on Twitter", "Share on Reddit", "Copy
  Link" (AddToAny, blocked in our runs so the icons stay empty); the tweet text template is "${title} ${link} -
  via @GTABase". Evidence: F7-14, F7-27, F7-47; AddToAny declaration bundle :3.
- F-F7-19 Between ≈10:50 and 11:41 UTC uncached list pages answered "500 Request Timeout" after ≈61 s; runs were
  retried after the origin recovered (see Cases). Not app behavior.

## Unknowns

- U-F7-01 Exact sort key (published vs created date) — the shown and machine dates are the published date and
  are monotone, so HYPOTHESIS: published date descending. Rebuild: sort by `publishedAt` desc, tie-break by id desc.
- U-F7-02 How the Guides list chooses its entries (tag vs hand-picked menu). Rebuild: a `guide` flag on sample
  articles plus a fixed list of section links, sorted like News.
- U-F7-03 When an article shows "Last Updated" instead of the published date. Rebuild: per-article
  `showModified` flag in the sample data.
- U-F7-04 Comment posting/moderation behavior (never exercised: writes are forbidden). Rebuild v1: no comments.
- U-F7-05 Source of the cross-game related box. Rebuild: optional `related` list per article, hidden when empty
  (the driving-tips page renders an empty container).
