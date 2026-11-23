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
