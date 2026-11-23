# Feature traces

Each feature's full trace (T1 static explain, T2 control → effect, T3 rules, cases, command vocabulary,
behavior summary for the spec, findings, unknowns) is in `evidence/traces/<feature>.md`, written by the phase-3
analysis agents from the brief in `evidence/traces/BRIEF.md` and verified by the orchestrator (case counts and
rule scripts re-run 2026-11-23).

| Id | Feature | Trace | Cases (clean/total) | Rule scripts (all PASS) | REA evidence |
|---|---|---|---|---|---|
| F1 | Database lists | evidence/traces/f1-lists.md | 58/60 | 7 (evidence/rules/f1-*.mjs) | ev_cb6c7e907a3e… |
| F2 | Item detail pages | evidence/traces/f2-detail.md | 34/34 | 8 (evidence/rules/f2-*.mjs) | ev_9314a5acfeb8… |
| F3 | Comparison + rankings | evidence/traces/f3-compare.md | 53/53 | 5 (evidence/rules/f3-*.mjs) | ev_4474e414e176… |
| F4 | Interactive map | evidence/traces/f4-map.md | 74/76 | 8 (evidence/rules/f4-*.mjs) | ev_c62f19a5c162… |
| F5 | Checklists & mission lists | evidence/traces/f5-checklists.md | 38/38 | 4 (evidence/rules/f5-*.mjs) | ev_329e3f038cc3… |
| F6 | Guide pages | evidence/traces/f6-guides.md | 43/43 | 5 (evidence/rules/f6-*.mjs) | ev_7642ee3762c3… |
| F7 | News, guides, videos + article | evidence/traces/f7-news.md | 48/48 | 5 (evidence/rules/f7-*.mjs) | ev_02c56b6b18ed… |
| F8 | Media galleries | evidence/traces/f8-galleries.md | 38/38 | 4 (evidence/rules/f8-*.mjs) | ev_27d0c4c71102… |
| F9 | Hub + site shell | evidence/traces/f9-shell.md | 41/41 | 5 (evidence/rules/f9-*.mjs) | ev_4d3b173dab25… |
| F10 | Favorites & personal progress | evidence/traces/f10-favorites.md | 32/32 | 3 (evidence/rules/f10-*.mjs) | ev_83aed0af2dd7… |

Totals: 459/463 clean cases, 54 rule scripts.

Excluded cases: F1-40, F1-W13 (origin HTTP 500 / timeout), F4-17, F4-19 (origin timeout on uncached `?feature=` URLs).
F3-15 and F3-26..29 recorded the Cloudflare challenge page that every comparison URL with a query string receives (filled comparison page unobservable).

Site conditions during phase 3: uncached pages on the origin answered HTTP 500 / timed out from about 10:45 to 11:45 UTC
(cached pages kept working); runs were paused and affected cases re-run and merged per case id (see each run file).
