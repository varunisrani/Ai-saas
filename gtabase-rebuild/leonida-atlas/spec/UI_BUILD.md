# UI build brief (phase 6) — shared by the three UI builders

You are a CLEAN-ROOM implementation engineer for "Leonida Atlas" (Next.js 16 App Router + TypeScript + Tailwind 4).
WORKING DIRECTORY: /home/user/Ai-saas/gtabase-rebuild/leonida-atlas

## Clean-room rules (strict)
- Read ONLY: spec/CLONE_SPEC.md, spec/TEST_VECTORS.md, spec/UI_BUILD.md, tests/vectors/*.json, tests/e2e/** and files under
  /home/user/Ai-saas/gtabase-rebuild/leonida-atlas/. Do NOT open anything else under /home/user/Ai-saas/gtabase-rebuild/
  (no evidence/, tools/, FINDINGS.md, FEATURE_TRACES.md, UNKNOWNS.md, INVESTIGATION_LOG.md, ANALYSIS_REPORT.md), do not visit
  gtabase.com, no web search for the original product.
- Never copy the original's markup, CSS, images, icons, fonts, copy text or branding. Follow spec §20 (own design: name, SVG
  logo, palette, fonts via next/font, own wording) and the wording policy W1–W3 (functional labels verbatim, everything else own).
- Never special-case vector ids or hard-code expected outputs: implement the rules, using src/data/index.ts and src/lib/index.ts
  (never re-implement a rule that exists in src/lib; never edit src/data or src/lib — if something is missing or wrong there,
  report it as a spec/module gap and work around it in your own component code only if trivial).
- This Next.js version differs from your training data: read node_modules/next/dist/docs/ for anything you are unsure of
  (App Router params are async, the request proxy file replaces middleware, etc.). next.config.ts has cacheComponents off.

## Shared dev server — do NOT start another
A dev server is already running at http://localhost:3000 with hot reload (log: /tmp/claude-0/-home-user-Ai-saas/381e5d73-a5f8-5205-b881-93589af60445/scratchpad/dev-server.log).
Check it with `curl -s --noproxy '*' -o /dev/null -w "%{http_code}" http://localhost:3000/`. If (and only if) nothing answers on
port 3000, start it with `cd leonida-atlas && (nohup npm run dev -- -p 3000 > /tmp/claude-0/-home-user-Ai-saas/381e5d73-a5f8-5205-b881-93589af60445/scratchpad/dev-server.log 2>&1 &)`.
Do NOT run `npm run build` (three builders share the folder; the orchestrator builds at verification). Use `npx tsc --noEmit`
(errors in other builders' folders are theirs) and the vector replays.

## Test attribute contract (spec Conventions TA1–TA8, §18)
Every element a token names carries `data-testid` = space-separated list of all tokens that apply (base, positional, keyed,
state, alias). Profiles match `[data-testid~="token"]`. Keep the roles and accessible names of §18 and the feature rules.

## Vectors (your acceptance tests)
From leonida-atlas/tests/e2e run, per suite you own:
  node web/run-cases.mjs --profile profiles/<suite>.profile.json --vectors ../vectors/<suite>.json --normalize ../vectors/normalize.json
(`--only <id regex>` to run a subset; vectors run in file order and keep state between cases; resets are in the profile).
Readouts that are data or divergences are already ignored by normalize.json; a vector listed in normalize.json "notComparable"
is out of scope. A vector that can only fail because of an intentional divergence (spec §21) is reported, not chased.
Tip: start with the suite's first vectors (they define the page skeleton), keep the dev server log open for errors.

## Ownership (exclusive — never edit another builder's files)
- UI-A (shell & content): src/app/layout.tsx, src/app/globals.css, src/app/page.tsx, src/app/not-found.tsx, src/app/icon.svg,
  src/proxy.ts (request-level redirects of §0/§19.3, incl. comparison canonicalisation, ?class=, ?i=, /gta-6, /login),
  src/app/art/**, src/app/search/**, src/app/membership/**, src/app/login/**, src/app/news/**, src/app/gta-6/page.tsx,
  src/app/gta-6/{news,guides,videos,articles,screenshots,artworks,covers,gangs,map-locations,gta-6-cheats-*}/**,
  src/app/gta-6/{animals,characters,properties,radio-stations}/page.tsx (the guide LIST pages only),
  src/app/articles/** EXCEPT src/app/articles/gta-6/gta-6-100-completion-guide-interactive-checklist/**, src/app/art/**,
  src/components/shell/**, src/components/ui/**, src/components/content/**, src/components/gallery/**, src/components/radio/**,
  public/**, scripts/** (audio clip generator). Suites: f9-shell, f7-news, f8-galleries, f6-guides, f6-guides-noyt.
- UI-B (database): src/app/gta-6/vehicles/**, src/app/gta-6/weapons/**,
  src/app/gta-6/{animals,characters,properties,radio-stations}/[slug]/** (detail pages), the legacy path forms
  src/app/{vehicles,weapons,animals,characters,properties,radio-stations}/**, src/components/lists/**, src/components/detail/**,
  src/components/compare/**, src/components/favorites/**. Suites: f1-lists, f2-detail (all but mission pages), f3-compare,
  f10-favorites (map star part belongs to UI-C).
- UI-C (map & progress): src/app/gta-6/map/**, src/app/gta-6/{missions,side-missions,strangers-missions,random-events,strangers}/**
  (lists AND mission walkthrough pages), src/app/missions/**, src/app/side-missions/**,
  src/app/articles/gta-6/gta-6-100-completion-guide-interactive-checklist/**, src/components/map/**,
  src/components/checklist/**, src/components/missions/**. Suites: f4-map, f5-checklists, plus the mission-page vectors of
  f2-detail and the map-star vectors of f10-favorites.

## Shared interfaces UI-A provides first (others import; until they exist, build against these names)
- Root layout with the shell (header with menu/search/log-in link, GTA 6 sub-navigation, side column slot, footer, back-to-top),
  design tokens in globals.css (palette/fonts of §20) — pages render their own <main> content.
- src/components/ui/index.ts exporting at least: `AccountsDialogProvider` (mounted in the layout) and `useAccountsDialog()` →
  `{ open(context?: "default" | "favorites" | "map"), close() }` implementing the accounts-later dialog of §3 (R-302..R-305),
  `Breadcrumbs`, `PageHeading`, `SideColumn`, `Pagination` (generic, driven by src/lib news pager model), `Lightbox`
  (generic image viewer of §12, reused by detail-page galleries), `ArtImage` (renders /art/<kind>/<id>.svg via src/data artUrl).
  UI-A: create stubs of these exports within your first steps so B and C can import them, then complete them.

## Final report (≤ 30 lines)
Files/routes created; per-suite vector results you actually saw (pass/fail counts); each failing vector with a one-line reason
(spec gap / divergence / bug left); behaviors you chose where the spec is open (HYPOTHESIS); module gaps found in src/data or src/lib.
