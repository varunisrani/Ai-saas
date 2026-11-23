# Leonida Atlas — v1 scope and features pending after v1

v1 = everything in gtabase.com's GTA 6 section (user decision, 2026-11-23): F1–F10 in PROGRESS.md.

## v1 (GTA 6 section)
| Feature | Status |
|---|---|
| F1 Database lists (vehicles, weapons) | validated (PARITY_REPORT.md) |
| F2 Item detail pages | validated (PARITY_REPORT.md) |
| F3 Comparison + rankings | validated (PARITY_REPORT.md) |
| F4 Interactive map + found tracking | validated (PARITY_REPORT.md) |
| F5 Checklists & mission lists | validated (PARITY_REPORT.md) |
| F6 Guide pages (animals, characters, gangs, properties, radio, cheats, map-locations) | validated (PARITY_REPORT.md) |
| F7 News, guides, videos + article page | validated (PARITY_REPORT.md) |
| F8 Media galleries + lightbox | validated (PARITY_REPORT.md) |
| F9 GTA 6 hub + site shell | validated (PARITY_REPORT.md) |
| F10 Favorites & personal progress (guest/local) | validated (PARITY_REPORT.md) |

## Pending after v1
| # | Feature or open question | Why pending | Next probe |
|---|---|---|---|
| 1 | Real accounts (MyBase login, cross-device sync, VIP plans, profiles, leaderboard) | ending = no backend for now; sign-in not possible from cloud session | add Supabase later |
| 2 | Comments on pages | needs a backend; posting on the live site is a write | after backend |
| 3 | Machine translation (other languages) | not core; third-party service | — |
| 4 | Site-wide search | covers other games; needs an index | small local search in v1 if spec allows |

## Out of scope
- All other games (GTA V/Online, RDR2, GTA IV, SA, VC, III, …) — user decision.
- Ads (Mediavine), analytics (GTM), the Games Atlas network header, social login providers.

## Added at session close (2026-11-23)
| # | Feature or open question | Why pending | Next probe |
|---|---|---|---|
| 5 | Filled comparison page on the original (U-F3-01) | Cloudflare challenges automated browsers on comparison URLs with a query | one human-browser capture by the owner, or a staging copy without the challenge |
| 6 | Member-side behavior (favorites list/limits, sync merge, garages, profiles) | needs a member test account | owner signs in with `--login` on a test account; read-only cases |
| 7 | Real dataset import | rebuild uses synthetic data | owner exports their data to the src/data entity shapes (CLONE_SPEC §1) |
| 8 | Real audio/video playback, lightbox swipe/wheel timing | static evidence only | headed runs with media allowed |
