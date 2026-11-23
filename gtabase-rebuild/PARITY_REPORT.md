# Parity report — Leonida Atlas vs www.gtabase.com GTA 6 section (observed 2026-11-23)

Date: 2026-11-23. Method: reap-04 "Validate a clone against the original" (skill loaded via the Skill tool; REAP
checklist in INVESTIGATION_LOG.md complete for phases 1–7). **Equivalence is not claimed beyond the cases listed.**
Passing examples do not prove that the rebuild behaves like the original everywhere; the original also runs on
the live database while the rebuild runs on its own sample data, so only behavior (not live content) is compared.

## 1. Results

| Check | Scope | Result | Evidence |
|---|---|---|---|
| Vectors replayed on the rebuild (production build, `next start`) | 459 vectors from 463 recorded cases (4 harness errors excluded), 11 suites | **399 pass**, 55 fail (every one attributed below), 5 not comparable (Cloudflare challenge recorded on the original: F3-15, F3-26..29) | evidence/parity/replay/<suite>.txt |
| Fresh side-by-side parity run | 101 cases (≈10 per feature, read-only), original run fresh with ONE runner, rebuild with the same cases and tokens | 99 comparable (F8-23/F8-33: original-side harness timeouts on the live covers page): **85 identical**, 14 different — all 14 are documented divergences or sample-data size (table §1.2) | evidence/runs/parity/run-parity-{original,clone}-*.json, evidence/parity/{original,rebuild}/*.txt, evidence/parity/diff-*.txt |
| REA artifact comparison | per-suite normalized parity outputs, identical layout, zipped | status **changed**: 5 suite files unchanged (f1, f2, f3, f6-noyt, f8), 6 changed (f4, f5, f6, f7, f9, f10) + archive root — matches the line diff exactly | compare ev_6f989da0207c893096ed6e9e2eb03ff2ff6b8133e0b5dde8de03b3caa3b35c3c (left ev_4a01bc72…, right ev_4dd32e04…) |
| REA scenario comparison (`compare_web_captures`) | — | not run: the CLI scenario capture needs a scenario per feature; the per-case parity run above covers the same ground | — |
| REA reconstruction verification | — | not available: `verify_reconstruction` has no CLI twin in rea-agents 6.10.1 (MCP-only, MCP not loaded in this cloud session); artifact comparison used instead | — |
| Recovered rules | 54 rule scripts (analysis side) | all PASS (re-run 2026-11-23) | evidence/rules/ |
| Unit tests of the rebuild | src/data + src/lib | 26 files, **339/339** pass | `npx vitest run` |
| Build / types / routes render | all routes, proxy | `npm run build` passes; `tsc --noEmit` clean; 17 key routes × 2 widths render (200; 404 page answers 404) | evidence/parity/screens/ |
| Own design | screenshots desktop 1366×900 + phone 390×844 | own name, compass logo, sand/teal/coral palette, Space Grotesk + Inter, generated SVG art; no original logo, images, colors or copy | evidence/parity/screens/desk_*, phone_* |
| Security / data | no backend | no keys, no env files, no external hosts called, no real personal names (authors/commenters/contributors) in code or sample data | grep checks 2026-11-23 |

### 1.1 Vector replay by suite (comparable vectors)

| Suite | Run | Pass | Fail | Failing vectors → reason |
|---|---|---|---|---|
| f1-lists | 58 | 58 | 0 | — |
| f2-detail | 34 | 34 | 0 | — |
| f3-compare | 48 (+5 n/c) | 45 | 3 | F3-30 → D-014; F3-46, F3-52 → D-013 |
| f4-map | 74 | 68 | 6 | F4-01 → D-017; F4-33 → D-019; F4-46..48 → D-018; F4-49 → D-002 |
| f5-checklists | 38 | 36 | 2 | F5-01 → D-017; F5-24 → data (52 mission boxes in the sample data vs 134 live) |
| f6-guides | 39 | 37 | 2 | F6-33 → D-010 (arrow/Home/End keys work); F6-39 → D-021 |
| f6-guides-noyt | 4 | 4 | 0 | — (profile blocks the rebuild's own clips, D-009) |
| f7-news | 48 | 43 | 5 | F7-02, F7-04, F7-06 → D-015 + data (3 pages vs 6); F7-07, F7-12 → data (page count) |
| f8-galleries | 38 | 33 | 5 | F8-15, F8-20, F8-21, F8-22, F8-27 → data (gallery sizes: counter totals) |
| f9-shell | 41 | 32 | 9 | F9-21..25 → D-003; F9-27 → D-001; F9-35 → D-017; F9-37 → D-023; F9-01 → spec R-1314 adds the "All GTA 6 news" link href the original lacked (vector gap) |
| f10-favorites | 32 | 9 | 23 | F10-02..12, F10-15..18, F10-23..25 → D-002 (local favorites instead of a login prompt); F10-13, F10-19 → D-001; F10-01 → D-010 (exact name "Add To Favorites"); F10-26 → D-018; F10-32 → D-026 |
| **Total** | **454 + 5 n/c** | **399** | **55** | 0 unexplained |

### 1.2 Parity run differences (14 of 99)

| Case | Original | Rebuild | Classification |
|---|---|---|---|
| F4-01, F5-01 | original guest note wording | own wording | D-017 |
| F4-47, F10-26 | "Members … Log in to start" panel | accounts-later panel | D-018 |
| F6-39 | late accordion stays inert (first item stays open) | late accordion works (second item opened, `#alias` pushed) | D-021 (bug not copied) |
| F7-12 | `?start=999` → "Page 6" | → "Page 3" (last page of 84 sample articles) | data |
| F9-01 | "All GTA 6 news" link without href | with href | spec R-1314 (vector gap) |
| F10-01 | favorites button name with icon glyph | exact "Add To Favorites" | D-010 |
| F10-04, -07, -10, -17 | login prompt opens | favorite toggles locally; the prompt the case waits for never opens (case errors) | D-002 |
| F10-13 | "Sign in to MyBase" | "Sign in to Leonida Atlas" | D-001 / D-023 |
| F10-23 | map star opens a members panel | star toggles a local favourite | D-002 |

## 2. Divergences

The full register is CLONE_SPEC.md §21 (D-001…D-026). Summary of the ones the tests touch:

| Id | Area | Original | Rebuild | Why |
|---|---|---|---|---|
| D-001 / D-026 | Accounts, login page | member login, social sign-in, sync | "accounts are coming later" dialog/page, no fields, no requests | no backend in v1 |
| D-002 | Favorites | member-only; guests get a login prompt | browser-local favorites (`atlas-favorites`), button toggles "Favorited" — **HYPOTHESIS** | useful without accounts |
| D-003 | Search | /search?q= redirects to an external web search | local results page | no third-party redirect |
| D-004 / D-005 | Comments, star voting | read/write widgets | placeholder; read-only rating | no backend |
| D-006 / D-009 / D-022 / D-024 | Third parties | ads, analytics, share/translation widgets, video-service embeds | none; own share actions, own audio clips, own placeholder player | clean room, privacy |
| D-007 / D-008 | Comparison | bot challenge on every query URL; filled layout unobservable | renders directly; own side-by-side board | evidence gap |
| D-010 | Accessibility | hover-only menus, glyph in button names, broken accordion keys … | keyboard-operable, exact names | accessibility |
| D-011, D-014, D-015, D-021 | Quirks of the original | page=N start offset, Sports rows under a Super heading, last-page alias link, inert late accordions | not reproduced | bugs |
| D-012 | Scope | other games in menus/footer/news | GTA 6 only | user scope decision |
| D-013 | Rankings | unknown ?class → empty page | 404 | consistency |
| D-016 | Membership | paid plans with prices | own plan structure, "coming later" | no payments |
| D-017 / D-018 / D-019 / D-020 / D-023 / D-025 | Wording, map member actions/reset/notice, brand, credits | original texts, server-first actions, contributor names | own texts, local actions, own brand, no names | clean room, no backend, personal data |

## 3. Behaviors implemented as HYPOTHESIS

From the spec (26 rules tagged HYPOTHESIS, 14 UNKNOWN with the rebuild's choice — CLONE_SPEC §21 "Open points") and
from the builders (evidence/parity/builder-choices.md):
- Filled comparison board layout and canonical comparison redirects (R-713/R-714) — never observable on the original.
- Rating text always with one decimal ("4.0 of 5 (12 Votes)", R-410), although the original showed "4 of 5" once.
- Browser-local favorites (D-002), the side column's "Your favourites".
- Checklist percentage details for unweighted parents and grouped slots (R-914), bottom-up parent re-evaluation (R-905).
- Map: typo-tolerance by word length (R-836/838), view restore rules (R-840), notice window in whole UTC days (R-846),
  centring on search/hash/prev-next, click-on-empty closes the popup, reset dialog counts markers.
- News: bad or negative `?start` → page 1 (R-1106), tie-break by id (R-1102); gallery out-of-range offset → last page.
- Radio: Next/Previous always start playing; duration "0:00" until a track plays; player readiness from the own clips.
- Rankings: ties and unrated rows in catalogue order; best-vehicles shows Super rows.
- Data: invented values everywhere except the fixture identifiers the vectors use (CLONE_SPEC §16.2: ~40 in-game item
  names/slugs, map category names, functional labels), whose stats, descriptions and images are invented too.

## 4. Not yet tested / not implemented

- Everything member-side on the original (login, sync of progress, favorites list, garages/collections, profiles,
  VIP features, leaderboard): not observable without an account — PENDING_FEATURES #1.
- Filled comparison page on the original (Cloudflare challenge) — UNKNOWN U-F3-01.
- Real audio playback states (progress, auto-advance, seek) and lightbox swipe/wheel/auto-hide timing — static only.
- Comments, voting, translation, site-wide search over all games — not in v1.
- Load/performance parity, SEO metadata beyond titles, and browsers other than Chromium were not compared.
- The original's member write endpoints were never exercised (read-only analysis).

## 5. How to reproduce

```bash
cd gtabase-rebuild/leonida-atlas && npm ci && npm run build && npx next start -p 3000
```
```bash
cd gtabase-rebuild/leonida-atlas && npx vitest run
```
```bash
cd gtabase-rebuild/leonida-atlas/tests/e2e && node web/run-cases.mjs --profile profiles/f1-lists.profile.json --vectors ../vectors/f1-lists.json --normalize ../vectors/normalize.json
```
```bash
cd gtabase-rebuild/tools && node web/run-cases.mjs --profile profiles/f1-lists.profile.json --cases ../evidence/cases/parity/f1-lists.json --out ../evidence/runs/parity/run-parity-original-f1-lists.json
```
```bash
cd gtabase-rebuild && node tools/common/print-parity.mjs evidence/runs/parity/run-parity-original-f1-lists.json tools/normalize.json > /tmp/o.txt && node tools/common/print-parity.mjs evidence/runs/parity/run-parity-clone-f1-lists.json tools/normalize.json > /tmp/c.txt && node tools/common/runs.mjs diff /tmp/o.txt /tmp/c.txt
```
(The original-side command reads the live site: run it with one runner at a time; the analysis saw the origin
answer HTTP 500 on uncached pages under parallel load.)
