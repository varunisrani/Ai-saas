# Leonida Atlas

A clean-room rebuild of the GTA 6 section of a game-database website: vehicle and weapon databases with
filters, sorting and side-by-side comparison, detail pages, rankings, an interactive map with found-tracking,
the 100% completion checklist and mission lists, guide pages (animals, characters, gangs, properties, radio
with a player, cheats), news/guides/videos with articles, media galleries with a lightbox, and the site shell.

It was written only from a behavior specification (`spec/CLONE_SPEC.md`) and recorded test vectors
(`tests/vectors/`), by builders that never saw the original's code, markup, styles, images or text. Name,
logo, palette, fonts, wording and artwork are its own.

## Run it

```bash
npm ci
```
```bash
npm run dev
```
Open http://localhost:3000/gta-6/. Production: `npm run build`, then `npx next start -p 3000`.

There is **no backend** in this version: all content is invented sample data generated deterministically
in `src/data` (seed "leonida-atlas"); personal state (checklist ticks, map found/filter/view, compare picks,
list state memory, favorites) lives in the browser's local/session storage. No environment variables or
keys are needed.

## Test it

- Unit tests (data and rules): `npm test` (vitest, 339 tests).
- Behavior vectors (recorded on the original, replayed here). With the app running on port 3000:
  ```bash
  cd tests/e2e && node web/run-cases.mjs --profile profiles/f1-lists.profile.json --vectors ../vectors/f1-lists.json --normalize ../vectors/normalize.json
  ```
  Suites: f1-lists, f2-detail, f3-compare, f4-map, f5-checklists, f6-guides, f6-guides-noyt, f7-news,
  f8-galleries, f9-shell, f10-favorites. Current result: 399 of 454 comparable vectors pass; every failure is
  an intentional divergence or a sample-data size difference (see `../PARITY_REPORT.md`).
- Test ids: every control a vector names carries `data-testid` with a space-separated token list; profiles
  match `[data-testid~="token"]` (spec, Conventions TA1–TA8, §18).

## Structure

| Path | What |
|---|---|
| `src/data/` | entity types, deterministic sample-data generators, lookups, search documents, art descriptors |
| `src/lib/` | pure rules: list hash/filter/sort/paging, compare, picker, rankings, checklist, map store/order/search, news paging, formatting, titles, countdown, gallery, radio, favorites, search, storage |
| `src/app/` | routes (the original's GTA 6 URL paths are kept for deep-link compatibility), `proxy.ts` redirects, `/art/<kind>/<id>.svg` placeholder images |
| `src/components/` | shell, lists, detail, compare, map (own SVG island + canvas markers, no tile server), checklist, missions, gallery, radio, favorites, ui |
| `scripts/generate-audio.mjs` | writes the own synthesized radio clips to `public/audio/` |
| `spec/` | CLONE_SPEC.md, TEST_VECTORS.md, UI_BUILD.md — the only inputs the builders used |
| `tests/` | vectors, normalizer, runner, per-suite profiles |

## Differences from the original (by design)

No accounts (an "accounts are coming later" dialog replaces sign-in), browser-local favorites, local search
results instead of an external web search, no comments, no star voting, no ads/analytics/share or translation
widgets, own audio clips instead of a video-service player, keyboard-accessible menus and accordions, and none
of the original's quirks (see the divergences register, spec §21, and `../PARITY_REPORT.md`).

## Next steps (pending after v1)

Real accounts with a backend (sync of progress and favorites, garages, profiles), comments, the real dataset
imported through the documented data model, other games. See `../PENDING_FEATURES.md`.
