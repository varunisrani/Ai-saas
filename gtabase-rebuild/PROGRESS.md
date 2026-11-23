# Progress — gtabase.com (GTA 6 section) → "Leonida Atlas"

Status line (copy into every progress message):
`Progress: <done>/<total> tasks (<percent>%) · Phase <n> of 8 — <phase name> · done now: <task> · next: <task>`

Plan made: 2026-11-23. Estimate: 14–18 hours, 4+ sessions. Ending: **no backend for now** (local
synthetic sample data, browser storage for progress/favorites; Supabase can be added later).
v1 scope (user, 2026-11-23): **everything in the GTA 6 section, nothing for other games** — 10 feature
groups F1–F10 below. After-v1 features: see PENDING_FEATURES.md.

| Id | v1 feature group | Original routes |
|---|---|---|
| F1 | Database lists (filter / sort / paging) | /gta-6/vehicles/, /gta-6/weapons/ |
| F2 | Item detail pages | /gta-6/vehicles/<slug>, /gta-6/weapons/<slug>, /gta-6/animals/<slug>, /gta-6/characters/<slug> |
| F3 | Comparison + rankings | /gta-6/vehicles/comparison/, /gta-6/weapons/comparison/, /gta-6/vehicles/best-*/ |
| F4 | Interactive map + found tracking | /gta-6/map/ |
| F5 | Checklists & mission lists | 100% completion checklist, /gta-6/missions/, /side-missions/, /strangers-missions/, /random-events/ |
| F6 | Guide pages | /gta-6/animals/, /characters/, /gangs/, /properties/, /radio-stations/, cheats (PS5/Xbox/PC), /map-locations/ |
| F7 | News, guides & videos + article page | /gta-6/news/, /gta-6/guides/, /gta-6/videos/, /gta-6/articles/<slug> |
| F8 | Media galleries + lightbox | /gta-6/screenshots/, /artworks/, /covers/ |
| F9 | GTA 6 hub + site shell | /gta-6/, header/nav/footer, countdown, search box |
| F10 | Favorites & personal progress (guest, local) | favorite buttons, MyBase GTA 6 tracking (signed-in part = HYPOTHESIS) |

## Summary
| Phase | Planned | Done | Remaining | % |
|---|---|---|---|---|
| 1 Start | 1 | 1 | 0 | 100 |
| 2 Bundle, API and auth map (reap-11 + browser walk) | 6 | 6 | 0 | 100 |
| 3 Feature tracing (4 per v1 feature × 10) | 40 | 40 | 0 | 100 |
| 4 Spec + vectors | 2 | 2 | 0 | 100 |
| 5 Build: data + rules (2 builders + verify) | 3 | 3 | 0 | 100 |
| 6 UI (build + screenshot review) | 2 | 2 | 0 | 100 |
| 7 Validate | 4 | 4 | 0 | 100 |
| 8 Close / resume | 1 | 0 | 1 | 0 |
| **Total** | **59** | **58** | **1** | **98** |

## Tasks
| # | Phase | Task | Status | Result / evidence |
|---|---|---|---|---|
| 1 | 1 | reap-01 first look | ☑ | INVESTIGATION_LOG session 1; F-001..F-011; U-001..U-006 |
| 2 | 2 | full REA bundle run, verified complete | ☑ | see INVESTIGATION_LOG phase 2 |
| 3 | 2 | reap-11 source-map & bundle recovery | ☑ | see INVESTIGATION_LOG phase 2 |
| 4 | 2 | reap-11 API-surface mapping | ☑ | see INVESTIGATION_LOG phase 2 |
| 5 | 2 | reap-11 auth & token flow | ☑ | see INVESTIGATION_LOG phase 2 |
| 6 | 2 | reap-11 website clone (structure + behavior): browser walk of every GTA 6 route | ☑ | see INVESTIGATION_LOG phase 2 |
| 7 | 2 | reap-11 web feature mapping → feature inventory | ☑ | see INVESTIGATION_LOG phase 2 |
| 8–11 | 3 | F1 Database lists: T1 · T2 · 20+ cases · T3 | ☑ | 58/60 clean cases, 7 rules, evidence/traces/f1-lists.md |
| 12–15 | 3 | F2 Item detail pages: T1 · T2 · 20+ cases · T3 | ☑ | 34/34 clean cases, 8 rules, evidence/traces/f2-detail.md |
| 16–19 | 3 | F3 Comparison + rankings: T1 · T2 · 20+ cases · T3 | ☑ | 53/53 clean cases, 5 rules, evidence/traces/f3-compare.md |
| 20–23 | 3 | F4 Interactive map: T1 · T2 · 20+ cases · T3 | ☑ | 74/76 clean cases, 8 rules, evidence/traces/f4-map.md |
| 24–27 | 3 | F5 Checklists & mission lists: T1 · T2 · 20+ cases · T3 | ☑ | 38/38 clean cases, 4 rules, evidence/traces/f5-checklists.md |
| 28–31 | 3 | F6 Guide pages: T1 · T2 · 20+ cases · T3 | ☑ | 43/43 clean cases, 5 rules, evidence/traces/f6-guides.md |
| 32–35 | 3 | F7 News/guides/videos + article: T1 · T2 · 20+ cases · T3 | ☑ | 48/48 clean cases, 5 rules, evidence/traces/f7-news.md |
| 36–39 | 3 | F8 Media galleries: T1 · T2 · 20+ cases · T3 | ☑ | 38/38 clean cases, 4 rules, evidence/traces/f8-galleries.md |
| 40–43 | 3 | F9 Hub + shell: T1 · T2 · 20+ cases · T3 | ☑ | 41/41 clean cases, 5 rules, evidence/traces/f9-shell.md |
| 44–47 | 3 | F10 Favorites & progress: T1 · T2 · 20+ cases · T3 | ☑ | 32/32 clean cases, 3 rules, evidence/traces/f10-favorites.md |
| 48 | 4 | CLONE_SPEC.md | ☑ | 2,416 lines, 316 rules, 639+ tokens, 26 divergences; leak scan clean |
| 49 | 4 | TEST_VECTORS.md + vector files | ☑ | 459 vectors / 11 suites (4 harness errors excluded); tools/normalize.json; per-suite rebuild profiles leonida-atlas/tests/e2e/profiles/ |
| 50 | 5 | data builder (synthetic sample data + loaders) | ☑ | src/data, 36 checks |
| 51 | 5 | rules builder (filter/sort/compare/progress logic) | ☑ | src/lib, 25 modules, 303 tests |
| 52 | 5 | verify builder reports (build, typecheck, unit, vectors) | ☑ | orchestrator re-run: vitest 339/339, tsc clean except scaffold LayoutProps (generated at build) |
| 53 | 6 | UI build | ☑ | 3 clean-room UI builders (shell/content, database, map/progress); production build passes (orchestrator) |
| 54 | 6 | screenshot review (desktop + phone) | ☑ | evidence/parity/screens/ (17 routes × 2 widths): own name/logo/palette/fonts/art; no imitation of the original look |
| 55 | 7 | vector replay on rebuild | ☑ | 459 run: 399 pass, 55 fail (all attributed), 5 not comparable |
| 56 | 7 | fresh original parity run | ☑ | 101 cases, one runner, 99 clean |
| 57 | 7 | rebuild parity run + diff | ☑ | 99 comparable: 85 identical, 14 explained differences |
| 58 | 7 | REA comparison + PARITY_REPORT.md | ☑ | compare_artifacts ev_6f989da0… (changed: 5 unchanged / 6 changed, matches diff); PARITY_REPORT.md; README |
| 59 | 8 | reap-16 close | ☐ | |

## Re-plan log (every change to the total, with the reason)
| When | Change | Reason | New total |
|---|---|---|---|
| 2026-11-23 | v1 = all GTA 6 (10 groups) instead of a 4-feature core | user choice: "all GTA 6, no other game" | 59 |
