# Unknowns (ranked) — reap-16 checkpoint 2026-11-23 (end of phase 3)

Rank = uncertainty removed for the rebuild × cheapness of the probe. Probe limit (2 rounds) reached on
all v1 items below; each has a rebuild default so the build is not blocked. Feature-level detail:
evidence/traces/<feature>.md §Unknowns. (REA's unknowns ledger tools are MCP-only in this setup; the
CLI has no `record_unknown` twin, so this file is the ledger.)

| Rank | Id | Question | Why it matters | Rebuild default | Next probe | Status |
|---|---|---|---|---|---|---|
| 1 | U-F3-01 | Filled comparison page layout / best-value highlight | F3 page body | own side-by-side table: one column per item, rows = stat labels, best value marked | needs a browser Cloudflare lets through (human session) | OPEN (blocked by challenge) |
| 2 | U-F3-02 | Server handling of unsorted/numeric/unknown/duplicate/>4 compare ids | F3 URL contract | sort ids, drop unknown + duplicates, keep first 4 | same as above | OPEN |
| 3 | U-F2-01 | Rating format and voting rules | F2 rating block | show average with one decimal + vote count; voting local-only/disabled | needs a vote (write) | OPEN |
| 4 | U-F1-02 | `page=N` in list hash | F1 deep links | ignore page > 1 | — | HYPOTHESIS |
| 5 | U-F1-04 | Batches appended per scroll | F1 paging vectors | one batch of 100 per approach; assert multiples of 100 | — | PARTIAL |
| 6 | U-F7-01..03 | News sort key / guides selection / "Last Updated" switch | F7 ordering | publishedAt desc; guide flag; showModified flag | — | HYPOTHESIS |
| 7 | U-F6-01 | Radio playback states | F6 player | own audio source, fake player in tests | — | OPEN |
| 8 | U-F4 | Guest answers of checklist-load / whoami; map sub-path 404 | F4 reset + member panels | reset locally; login panel; 404 page | — | HYPOTHESIS |
| 9 | U-F8-01/02 | Swipe/wheel, controls auto-hide | F8 lightbox | swipe on touch, controls stay visible | — | static only |
| 10 | U-F9-01 | Site search results | F9 search | local results page, no third-party redirect | — | DIVERGENCE |
| 11 | U-F10-1/2, U-F5-1, U-F9-02 | All member-side behavior (favorites list, sync, garages, profiles, signed-in header) | accounts | not in v1 (no backend); browser-local favorites as HYPOTHESIS | needs a member test account | PENDING after v1 |

## Resolved
| Id | Question | Answer (evidence) |
|---|---|---|
| U-001 | Where the Megafilter gets its items | one JSON per database: GET /media/com_jamegafilter/en_gb/17.json / 18.json (walk XHR, F-012) |
| U-002 | List hash grammar | evidence/traces/f1-lists.md, rule f1-hash-grammar.mjs (41/41) |
| U-003 | Map guest found storage | localStorage `guest_checklists` {"gta6-map": [...]} + gtab-map-filter / gtab-map-view (f4-map trace, 8 rules) |
| U-004 | Compare storage and URL | sessionStorage `gtabCompare:<list path>`, sorted aliases (f3-compare trace, F-013) |
| U-005 | Checklist guest persistence | localStorage `guest_checklists`, no server contact (f5-checklists trace) |
| U-006 | Signed-in MyBase | moved to PENDING (no sign-in from the cloud session) |
| U-F10-3 | Favorites button name | icon glyph + "Add To Favorites" → rebuild uses exact "Add To Favorites" |
| U-F5-2 | Prologue mission path | real page with a different path pattern |
