# Investigation Log — gtabase.com (GTA 6 section) clean-room rebuild

Target: https://www.gtabase.com/gta-6/ and every GTA 6 route, observed 2026-11-23. No build id (Joomla
CMS; asset cache prefix `/media/com_jchoptimize/cache/js/fe123a57…`).
Goal: behavior-only clean-room rebuild in Next.js named **"Leonida Atlas"**; ending: **no backend for
now** (local synthetic sample data, browser storage for personal progress). Authorization: the user
states they own gtabase.com or have permission to analyze it (2026-11-23). The rebuild still uses its
own code, design and synthetic data (the site carries a database-right notice; an owner can import
real data later through the documented data format).

## Clean-room and safety rules (apply every session)

1. Behavior only. No bundle code, markup, CSS, images, icons, fonts, copy text or branding is copied.
2. Every rule in FINDINGS/CLONE_SPEC cites evidence (REA evidence id, script + line, request seen,
   screenshot path, or a recorded case id).
3. Guesses are tagged **HYPOTHESIS**; open items **UNKNOWN** (UNKNOWNS.md).
4. Wall: the rebuild under `app/` is written only from CLONE_SPEC.md + TEST_VECTORS.md by separate
   builder agents.
5. The live site is read-only for us: runner write guard on, no comment posting, no login, no
   favorites/tracking writes to a real account. Normal browsing pace. No real personal data
   (MyBase leaderboard names, commenter names) in vectors, spec, sample data or rebuild.
6. Captured third-party content (HTML, scripts, screenshots) stays in `evidence/` and is git-ignored.
7. Every vector becomes an automated test. Not done until the parity check passes.

## File map

| Path | Purpose |
|---|---|
| PROGRESS.md / PENDING_FEATURES.md | plan, percent done, v1 scope |
| INVESTIGATION_LOG.md | this log, session by session |
| ANALYSIS_REPORT.md | stack, data flow, page-by-page, issues |
| FINDINGS.md | facts with evidence (F-###) |
| UNKNOWNS.md | open questions, ranked (U-###) |
| FEATURE_TRACES.md | per-feature T1/T2 traces and rules |
| CLONE_SPEC.md / TEST_VECTORS.md | the wall |
| PARITY_REPORT.md | validation result |
| evidence/ | html/, bundle/, rea/, screens/ (git-ignored), cases/, runs/, rules/, parity/ |
| tools/ | runner + common scripts, app.profile.json, normalize.json |
| app/ | the rebuild (builders only) |

## Tooling notes
- REA: `npx -y rea-agents@6.10.1 <command>` (CLI twin; MCP registration not loaded in this cloud
  session). `doctor`: node 22.23.5 OK; native engines (Ghidra/IDA/Hopper/jadx) absent — not needed
  for JavaScript analysis.
- Browser: pre-installed Chromium 153 headless, CDP on 127.0.0.1:9222 through the session proxy
  (no Claude in Chrome / built-in browser in this cloud session). Playwright for the runner.

## REAP checklist (mandatory — one row per template run)

| # | Phase | Skill (Skill tool call) | Template | Target | Status | Outputs / evidence |
|---|---|---|---|---|---|---|
| 1 | Start | anthropic-skills:reap-01-getting-started | First look at an unfamiliar app | www.gtabase.com GTA 6 section | ☑ | Session 1 notes below; REA ev_19f8fac5… (web bundle of /gta-6/vehicles/); evidence/html/*.html (24 GTA 6 pages) |
| 1b | Start | reap-01 | First exercise — trace a CSV export | — | n/a — demo exercise on an example zip, not the target | |
| 2 | Map | anthropic-skills:reap-11-electron-and-javascript | Source-map & bundle recovery | 159 scripts of the GTA 6 pages | ☑ | no maps exposed (all .map → 403, F-015); app scripts readable; full REA ev_cec9d630… 159/159 parsed |
| 3 | Map | reap-11 | Web app API-surface mapping | static grep + walk traffic | ☑ | FINDINGS 'API surface' (megafilter JSON, getuserdata, gtabmap, jlexcomment, gptranslate) |
| 4 | Map | reap-11 | Auth & token flow analysis (web) | user-header.js, store.js, checklist.js, cookies | ☑ | F-020..F-024 (not exercised: read-only) |
| 5 | Map | reap-11 | Website clone (structure + behavior) | 37 GTA 6 routes | ☑ | evidence/walk/walk.json + screens; FINDINGS 'Routes' |
| 6 | Map | reap-11 | Web feature mapping | vehicles list probe + walk | ☑ | feature inventory = ANALYSIS_REPORT §3 (F1–F10) |
| 7 | Map | reap-11 | WASM module inside a web app | — | n/a — no .wasm requested on any GTA 6 route (walk) | |
| 8 | Map | reap-11 | PWA / service-worker offline logic | — | n/a — no service worker registered (site.webmanifest only, no sw script in 159 files) | |
| 9 | Map | reap-11 | Electron app anatomy · IPC review · Browser extension audit | — | n/a — a website | |

---

## Session 1 — 2026-11-23

### Phase 1 (reap-01 loaded via Skill tool)
- Template "First look at an unfamiliar app" on www.gtabase.com, GTA 6 section:
  - **Main parts:** (1) Joomla CMS pages, server-rendered, behind Cloudflare + LiteSpeed cache (F-001..F-003);
    (2) the JA Megafilter database lists for vehicles and weapons (F-004); (3) custom template scripts
    `templates/SDH_J4/js/*` (e.g. `gtab-compare.js`, F-005); (4) the interactive map page (F-008);
    (5) third-party extensions: comments (com_jlexcomment), translation (mod_gptranslate via com_ajax),
    social login, Smart Search (com_finder), Regular Labs modals and tabs/accordions, Ignite Gallery (F-006).
  - **Entry points:** the header menu and the /gta-6/ hub, which link to 24 GTA 6 page types (F-007).
  - **Three features to investigate first:** the database list engine (F1), the interactive map with
    found-tracking (F4), and comparison (F3, custom script).
- User decisions (AskUserQuestion): permission = "I own / have permission"; v1 = all GTA 6 features,
  no other game; ending = no backend for now.

### Phase 2 (reap-11 loaded via Skill tool)
- Browser: headless Chromium via CDP + Playwright walker `tools/walk/walk.mjs` (read-only: non-GET blocked; ads/analytics blocked).
  37 routes walked, all 200 except the deliberate 404. Only Cloudflare's bot-check POST was blocked.
- Full REA: 159 scripts (75 files + 85 inline, one duplicate removed) → ev_cec9d630…; verified parsed 159/159, parse_failures 0,
  no provider_timeout, evidence.json saved. Two earlier attempts failed on the `--view` argument (invalid_request), not on the analysis.
- Runner: skill runner copied to tools/web, patched for bundled Chromium + proxy + ad-host blocking; demo smoke test 13/13 ok.

## Phase 3 REAP checklist rows (reap-02 loaded via Skill tool by the orchestrator; agents followed evidence/traces/BRIEF.md)

| # | Phase | Skill | Template | Target | Status | Outputs / evidence |
|---|---|---|---|---|---|---|
| 10 | Tracing: F1 Database lists | anthropic-skills:reap-02-feature-tracing-any-program | Explain one feature (+ reap-11 Minified / bundled JS feature tracing) | f1-lists | ☑ | evidence/traces/f1-lists.md §T1, REA ev_cb6c7e907a3e… |
| 11 | Tracing: F1 Database lists | reap-02 | Trace a button to its effect | f1-lists | ☑ | evidence/traces/f1-lists.md §T2 |
| 12 | Tracing: F1 Database lists | reap-02 | Recover a rule and rebuild it (+ 20+ recorded cases) | f1-lists | ☑ | 58/60 clean cases evidence/runs/run-f1-lists.json; 7 rule scripts PASS |
| 13 | Tracing: F2 Item detail pages | anthropic-skills:reap-02-feature-tracing-any-program | Explain one feature (+ reap-11 Minified / bundled JS feature tracing) | f2-detail | ☑ | evidence/traces/f2-detail.md §T1, REA ev_9314a5acfeb8… |
| 14 | Tracing: F2 Item detail pages | reap-02 | Trace a button to its effect | f2-detail | ☑ | evidence/traces/f2-detail.md §T2 |
| 15 | Tracing: F2 Item detail pages | reap-02 | Recover a rule and rebuild it (+ 20+ recorded cases) | f2-detail | ☑ | 34/34 clean cases evidence/runs/run-f2-detail.json; 8 rule scripts PASS |
| 16 | Tracing: F3 Comparison + rankings | anthropic-skills:reap-02-feature-tracing-any-program | Explain one feature (+ reap-11 Minified / bundled JS feature tracing) | f3-compare | ☑ | evidence/traces/f3-compare.md §T1, REA ev_4474e414e176… |
| 17 | Tracing: F3 Comparison + rankings | reap-02 | Trace a button to its effect | f3-compare | ☑ | evidence/traces/f3-compare.md §T2 |
| 18 | Tracing: F3 Comparison + rankings | reap-02 | Recover a rule and rebuild it (+ 20+ recorded cases) | f3-compare | ☑ | 53/53 clean cases evidence/runs/run-f3-compare.json; 5 rule scripts PASS |
| 19 | Tracing: F4 Interactive map | anthropic-skills:reap-02-feature-tracing-any-program | Explain one feature (+ reap-11 Minified / bundled JS feature tracing) | f4-map | ☑ | evidence/traces/f4-map.md §T1, REA ev_c62f19a5c162… |
| 20 | Tracing: F4 Interactive map | reap-02 | Trace a button to its effect | f4-map | ☑ | evidence/traces/f4-map.md §T2 |
| 21 | Tracing: F4 Interactive map | reap-02 | Recover a rule and rebuild it (+ 20+ recorded cases) | f4-map | ☑ | 74/76 clean cases evidence/runs/run-f4-map.json; 8 rule scripts PASS |
| 22 | Tracing: F5 Checklists & mission lists | anthropic-skills:reap-02-feature-tracing-any-program | Explain one feature (+ reap-11 Minified / bundled JS feature tracing) | f5-checklists | ☑ | evidence/traces/f5-checklists.md §T1, REA ev_329e3f038cc3… |
| 23 | Tracing: F5 Checklists & mission lists | reap-02 | Trace a button to its effect | f5-checklists | ☑ | evidence/traces/f5-checklists.md §T2 |
| 24 | Tracing: F5 Checklists & mission lists | reap-02 | Recover a rule and rebuild it (+ 20+ recorded cases) | f5-checklists | ☑ | 38/38 clean cases evidence/runs/run-f5-checklists.json; 4 rule scripts PASS |
| 25 | Tracing: F6 Guide pages | anthropic-skills:reap-02-feature-tracing-any-program | Explain one feature (+ reap-11 Minified / bundled JS feature tracing) | f6-guides | ☑ | evidence/traces/f6-guides.md §T1, REA ev_7642ee3762c3… |
| 26 | Tracing: F6 Guide pages | reap-02 | Trace a button to its effect | f6-guides | ☑ | evidence/traces/f6-guides.md §T2 |
| 27 | Tracing: F6 Guide pages | reap-02 | Recover a rule and rebuild it (+ 20+ recorded cases) | f6-guides | ☑ | 43/43 clean cases evidence/runs/run-f6-guides.json; 5 rule scripts PASS |
| 28 | Tracing: F7 News, guides, videos + article | anthropic-skills:reap-02-feature-tracing-any-program | Explain one feature (+ reap-11 Minified / bundled JS feature tracing) | f7-news | ☑ | evidence/traces/f7-news.md §T1, REA ev_02c56b6b18ed… |
| 29 | Tracing: F7 News, guides, videos + article | reap-02 | Trace a button to its effect | f7-news | ☑ | evidence/traces/f7-news.md §T2 |
| 30 | Tracing: F7 News, guides, videos + article | reap-02 | Recover a rule and rebuild it (+ 20+ recorded cases) | f7-news | ☑ | 48/48 clean cases evidence/runs/run-f7-news.json; 5 rule scripts PASS |
| 31 | Tracing: F8 Media galleries | anthropic-skills:reap-02-feature-tracing-any-program | Explain one feature (+ reap-11 Minified / bundled JS feature tracing) | f8-galleries | ☑ | evidence/traces/f8-galleries.md §T1, REA ev_27d0c4c71102… |
| 32 | Tracing: F8 Media galleries | reap-02 | Trace a button to its effect | f8-galleries | ☑ | evidence/traces/f8-galleries.md §T2 |
| 33 | Tracing: F8 Media galleries | reap-02 | Recover a rule and rebuild it (+ 20+ recorded cases) | f8-galleries | ☑ | 38/38 clean cases evidence/runs/run-f8-galleries.json; 4 rule scripts PASS |
| 34 | Tracing: F9 Hub + site shell | anthropic-skills:reap-02-feature-tracing-any-program | Explain one feature (+ reap-11 Minified / bundled JS feature tracing) | f9-shell | ☑ | evidence/traces/f9-shell.md §T1, REA ev_4d3b173dab25… |
| 35 | Tracing: F9 Hub + site shell | reap-02 | Trace a button to its effect | f9-shell | ☑ | evidence/traces/f9-shell.md §T2 |
| 36 | Tracing: F9 Hub + site shell | reap-02 | Recover a rule and rebuild it (+ 20+ recorded cases) | f9-shell | ☑ | 41/41 clean cases evidence/runs/run-f9-shell.json; 5 rule scripts PASS |
| 37 | Tracing: F10 Favorites & personal progress | anthropic-skills:reap-02-feature-tracing-any-program | Explain one feature (+ reap-11 Minified / bundled JS feature tracing) | f10-favorites | ☑ | evidence/traces/f10-favorites.md §T1, REA ev_83aed0af2dd7… |
| 38 | Tracing: F10 Favorites & personal progress | reap-02 | Trace a button to its effect | f10-favorites | ☑ | evidence/traces/f10-favorites.md §T2 |
| 39 | Tracing: F10 Favorites & personal progress | reap-02 | Recover a rule and rebuild it (+ 20+ recorded cases) | f10-favorites | ☑ | 32/32 clean cases evidence/runs/run-f10-favorites.json; 3 rule scripts PASS |

### Phase 3 notes
- 6 analysis agents ran in parallel (F1; F2+F3; F4; F5+F10; F6+F8; F7+F9). Runner patches by agents: `keydown:`/`keyup:` steps, `clickat:x,y`, `browser.args` (used to launch with `--disable-blink-features=AutomationControlled`, because the site's deferred-script loader skips automated browsers).
- Origin outage ~10:45–11:45 UTC on uncached pages (HTTP 500 after ~61 s); parallel agent traffic may have contributed. Phase 7 original-site runs will use a single runner.
- The site search (/search?q=) redirects to Google; 5 redirect hops reached google.com during F9 cases (2 answered with an unusual-traffic page); not repeated.
- Cloudflare challenges every comparison URL with a query string (307 → 403 "Just a moment..."): filled comparison layout = UNKNOWN.

### reap-16 checkpoint — end of phase 3 (context getting long), 2026-11-23

| # | Phase | Skill | Template | Target | Status | Outputs / evidence |
|---|---|---|---|---|---|---|
| 40 | Checkpoint | anthropic-skills:reap-16-long-running-investigations | Continue where you left off | whole investigation | ☑ | UNKNOWNS.md re-ranked (11 open/hypothesis rows, 8 resolved); this entry |

**State.** Phases 1–3 done (47/59 tasks). 463 recorded cases (459 clean), 54 rule scripts (all PASS),
10 traces. Rebuild scaffold `leonida-atlas/` (Next.js 16.4.6, cacheComponents off, playwright-core 1.63.0).
Not yet started: CLONE_SPEC, vectors, builders, UI, validation.

**Discarded hypotheses (with the evidence that killed them).**
- "The lists have page buttons" → infinite append of 100 per scroll, hash unchanged (F1 paging rule, 12/12).
- "Several class checkboxes add up" → a plain click switches; only Ctrl/Cmd/Shift-click adds (f1-class-tiles, 9/9).
- "Galleries use Regular Labs Modals" → Ignite Gallery lightbox; Modals only serves the Log In box (f8 trace).
- "Guide pages use tabs/accordions" → plain HTML; accordions only on /membership/ (f6 trace).
- "Guests can save favorites" → every favorite control opens the login dialog, nothing stored (f10, 32/32).
- "Search has a results page" → /search 302s to Google site: search (f9-shell-search rule 19/19).
- "Closed map categories are collapsed" → "closed" = no member suggestions; all groups start expanded (f4 trace).

**Resume here (numbered).**
1. Load anthropic-skills:reap-04-software-and-feature-cloning; write CLONE_SPEC.md from the ten traces' "Behavior
   summary for the spec" + "Command vocabulary" sections and FINDINGS.md (no code, no CSS class names).
2. Write tools/normalize.json (ignore the data-only readout keys listed in each trace; mask dates/ids) and run
   `node tools/common/build-vectors.mjs evidence/runs leonida-atlas/tests/vectors TEST_VECTORS.md tools/normalize.json
   f1-lists f2-detail f3-compare f4-map f5-checklists f6-guides f6-guides-noyt f7-news f8-galleries f9-shell f10-favorites`
   (explicit suites: extra run-*.part2 files exist).
3. Builders (data, rules) from spec + vectors only; then UI builder; verify each report myself.
4. Phase 7 parity with ONE runner against the original (origin fragility).

### Phase 4 (reap-04 loaded via Skill tool)
| # | Phase | Skill | Template | Target | Status | Outputs / evidence |
|---|---|---|---|---|---|---|
| 41 | Spec + vectors | anthropic-skills:reap-04-software-and-feature-cloning | Full application clone (behavioral) | GTA 6 section, F1–F10 | ☑ | CLONE_SPEC.md (316 rules, written by a spec agent from the traces; orchestrator leak scan: no code fences, no endpoints, no original class names, no personal names); TEST_VECTORS.md (459 vectors, 11 suites) |

- Fixture decision (orchestrator amendment): sample data keeps the identifiers the vectors use (slugs, ids, display names of
  ~40 referenced items, map category names, functional labels) with invented stats/descriptions/images; everything else invented.
- Test attribute contract: tokens live in a space-separated `data-testid`; rebuild profiles match `[data-testid~="token"]`,
  scoped where two suites share a name (F4 map-root, F9 header, F7 main). Raw original selectors in steps are mapped to
  rebuild tokens inside the rebuild profiles (vectors themselves are never hand-edited).
- normalize.json: 333 ignored readout keys (wording/network 7, implementation attributes, raw selectors, divergences, data-only),
  replaces for "Page N of M" and the map-view timestamp; notComparable: F1-44, F3-15, F3-26..29, F9-16.

### Phase 5 (reap-04 "Clone one feature into my own app", one row per builder module)
| # | Phase | Skill | Template | Target | Status | Outputs / evidence |
|---|---|---|---|---|---|---|
| 42 | Build: data | reap-04 | Clone one feature into my own app | src/data (spec §1, §16, §19.1) | ☑ | 18 files, 36 checks; observable differences: synthetic values everywhere except §16.2 fixture identifiers; 16 HYPOTHESIS choices (evidence/parity/builder-choices.md) |
| 43 | Build: rules | reap-04 | Clone one feature into my own app | src/lib (spec §19.2) | ☑ | 25 modules, 303 tests; observable differences: R-410 one-decimal rating vs observed "4 of 5"; 5 spec gaps + 17 HYPOTHESIS choices (builder-choices.md) |

### Phase 6 (reap-04 "UI/UX behavior cloning without assets")
| # | Phase | Skill | Template | Target | Status | Outputs / evidence |
|---|---|---|---|---|---|---|
| 44 | UI | reap-04 | UI/UX behavior cloning without assets | all GTA 6 routes (spec §0, §5–§15, §18, §20) | ☑ | builders UI-A/B/C; screenshots evidence/parity/screens/ (desk_*, phone_*); interaction model documented per rule in CLONE_SPEC §15 |
- Orchestrator checks: `npm run build` passes (all routes, proxy); screenshot review at 1366x900 and 390x844 — own name "Leonida Atlas",
  compass logo, sand/teal/coral palette, Space Grotesk/Inter, generated SVG art; layout logic matches the original (header, GTA 6
  sub-navigation, filters, cards) but not its look, logo, game-logo menu or colors.
- Noted: the §16.2 fixture identifiers keep ~40 real in-game item names that the vectors read (e.g. the four fastest standouts);
  all their stats, descriptions and images are invented.
- Harness: the rebuild's copy of run-cases.mjs was synced with the analysis-side patches (keydown/keyup, clickat, browser.args).

### Phase 7 (reap-04 "Validate a clone against the original")
| # | Phase | Skill | Template | Target | Status | Outputs / evidence |
|---|---|---|---|---|---|---|
| 45 | Validate | reap-04 | Validate a clone against the original | Leonida Atlas (production build) vs live GTA 6 section | ☑ | PARITY_REPORT.md; replay 399/454 comparable pass, 0 unexplained; parity 85/99 identical, 14 explained; REA compare ev_6f989da0… |
- verify_reconstruction: no CLI twin in rea-agents 6.10.1 (MCP-only) → not run; compare-artifacts used. compare_web_captures not run (per-case parity covers it).
- Original-side parity run used ONE runner, sequential suites with 5 s gaps; no origin errors this time.

### reap-16 close — end of session 1 (2026-11-23)
| # | Phase | Skill | Template | Target | Status | Outputs / evidence |
|---|---|---|---|---|---|---|
| 46 | Session close | anthropic-skills:reap-16-long-running-investigations | Continue where you left off | whole investigation | ☑ | this entry; PROGRESS 59/59; PENDING_FEATURES updated; UNKNOWNS.md ranked list unchanged (still valid) |

**State.** v1 complete and validated: Leonida Atlas (gtabase-rebuild/leonida-atlas) builds, 339/339 unit tests, 399/454
comparable vectors pass with every failure attributed (divergence or sample-data size), parity 85/99 identical with 14
explained differences, REA artifact comparison consistent. Everything committed on branch claude/gtabase-webapp-rebuild-dhtctd.

**Discarded hypotheses this session (and what killed them).** See the phase-3 checkpoint list, plus:
- "The rebuild's data can be fully invented" → the vectors read ~40 specific identifiers; fixtures keep them (orchestrator amendment).
- "One merged rebuild profile works" → feature profiles reuse mode/macro names with different steps; per-suite profiles instead.
- "Exact data-testid match" → one element carries several tokens; word match `~=` (spec TA1).
- "The trace data-only lists can be parsed greedily" → it swallowed the Behavior-keys lists; protected core keys.

**Resume here (next session).**
1. Load reap-16, read this log, PROGRESS.md, PENDING_FEATURES.md, UNKNOWNS.md and PARITY_REPORT.md.
2. If the owner wants accounts: choose a backend (Supabase per the skill), write the schema from CLONE_SPEC §1 + D-001/D-002,
   brief a data builder; member behavior needs a test account for recorded cases (PENDING #6).
3. If the owner can capture the filled comparison page (PENDING #5), add cases, re-run reap-02 T3 for F3, update R-713/R-714.
4. Optional: import the owner's real dataset through src/data (PENDING #7) and re-run the vectors without the data ignores.
