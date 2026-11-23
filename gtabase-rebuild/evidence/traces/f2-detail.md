# F2 Item detail pages — trace (feature id `f2-detail`)

Routes (GTA 6 only): `/gta-6/vehicles/<alias>` (e.g. sunset-sanchez = a Standout variant, sanchez = its base
model), `/gta-6/weapons/<alias>` (assault-rifle → "Kozlov KZ-59"), `/gta-6/animals/<alias>` (gray-fox),
`/gta-6/characters/<alias>` (jason), `/gta-6/properties/<alias>` (7th-avenue-garage),
`/gta-6/radio-stations/<alias>` (flash-fm), `/gta-6/missions/<alias>` (breakfast-run); unknown slug → 404.
Observed 2026-11-23 on the live site, read-only: no star was clicked, no comment form touched, the
"Add To Favorites" button (F10) not clicked; `blocked` stayed empty.

File abbreviations (under `evidence/bundle/all/`):

| Abbr | File | Original |
|---|---|---|
| UH | `templates__SDH_J4__js__user-header.js` (131 lines) | gamesatlas.com/templates/SDH_J4/js/user-header.js (plain script) |
| IG | `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f335e2529658003085ffe1e85c0912960.js` (615 lines) | /media/com_igallery/js/ignitegallery-42.js (deferred) |
| IGL | `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f9f282e7b235bedc688f8de31efdb1a71.js` | /media/com_igallery/js/lib-42.js (UIkit-based lightbox, "igui") |
| RD | `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f539bfd6cae0fe9d0e1e13294e3b5fb00.js` | /media/com_jchoptimize/dynamic-js/reduce_dom.js |
| MOD | `media__modals__js__script.min.js` | Regular Labs Modals |
| JCHI | `media__com_jchoptimize__cache__js__fe123a5753c24740882d962a63ab8e2f66544a25c89cf2b55a76799c57dc3d90.js` | JCH user-interaction loader |

REA T1 evidence: `analyze-javascript-application` over UH, IG, RD, MOD: view
**ev_9314a5acfeb87b2e1c42557c86c1b5e628b97528cf629d5185c6f7918c2c96cc**, parent
**ev_b8701ff0d92f6ba7c3460e9b24913f8999c4adb83d993db16bc1ae5b6ccc4138** (4/4 selected sources complete, no
error). REA recorded the network endpoint `call:fetch` →
`/index.php?option=com_ajax&group=system&plugin=getuserdata&format=raw&type=user-token` (UH:88), reads of
`window.lscToken` (UH:86, UH:109), `history.replaceState` (IG:530, IG:605) and `IntersectionObserver` (RD:13).
Evidence file: `evidence/rea/f2-detail/evidence.json` (git-ignored).
