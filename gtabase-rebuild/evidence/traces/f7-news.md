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
  gta-6_guides_.html, gta-6_videos_.html, news_.html; curl /gta-6/articles → 200 same list
  (scratch pages, title "Grand Theft Auto VI | Rockstar Games News & Guides").
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
attributes are strictly non-increasing over all 172 news items); whether "Last Updated" vs "on <date>"
in the article meta is a per-article setting (HYPOTHESIS: per-article "show modified date" option);
how the guides list selects its items (it mixes articles with section pages such as cheats and
best-vehicles — HYPOTHESIS: a curated/tagged menu list).


## T2 Control → effect

Main control: **the pager's "Go to next page" link** on `/gta-6/news/`.

| Hop | What happens | Evidence |
|---|---|---|
| 1 | Server renders page 1: description block (banner, own h1 "All GTA 6 News: Latest Updates on Grand Theft Auto VI", intro text, "Filter by Game" dropdown) + 30 items + counter "Page 1 of 6" + a pager kept inside a `<template>` | evidence/html/gta-6_news_.html; F7-01 (`count:page-links`=0 before scrolling) |
| 2 | Scrolling the counter into view (pager within 200 px of the viewport) makes reduce_dom swap the template in: first/previous disabled, numbered links 1–6 (current "1", href "#", aria-current), next → /gta-6/news/page-2, last → /gta-6/articles/page-6 | reduce_dom bundle :4, :11–:13; F7-02 |
| 3 | Click "Go to next page" → full page load GET /gta-6/news/page-2 (200) | F7-03 calls |
| 4 | Page 2: description block gone; heading = category name + " - Page 2" ("Grand Theft Auto VI - Page 2"); title "Grand Theft Auto VI \| Rockstar Games News & Guides - Page 2"; counter "Page 2 of 6"; next 30 items continue the newest-first order | F7-03, F7-04; probe-f7-news-dates.json |
| 5 | Back → page 1 again (from cache/server), counter "Page 1 of 6" | F7-05 |
| 6 | "Go to last page" → /gta-6/articles/page-6: "Page 6 of 6", 22 items, no next/last links | F7-06, F7-07 |

Rule scripts: evidence/rules/f7-news-pagination.mjs, f7-news-order-date.mjs.

## Rules (T3)

__RULES__

__CASES__

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
| item-tags | links (badges) | game tag ("GTA 6" → /gta-6/news/) + type tag ("Guide"/"News" → /news/) | all-news list only |
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

__SUMMARY__

__FINDINGS__
