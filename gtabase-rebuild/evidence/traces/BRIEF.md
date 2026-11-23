# Phase 3 brief for feature-tracing agents (analysis side of the clean-room wall)

You trace features of the live website https://www.gtabase.com (GTA 6 section only) for a clean-room,
behavior-only rebuild. The user states they own the site / have permission for read-only analysis.
You are on the ANALYSIS side: you may read the site's downloaded scripts, but everything you write
for the spec ("Behavior summary") is plain-language behavior, never code or markup copied from the site.

Workspace: /home/user/Ai-saas/gtabase-rebuild — read ANALYSIS_REPORT.md, FINDINGS.md and UNKNOWNS.md
first (phases 1–2 summary).

## Inputs
- Downloaded scripts: evidence/bundle/all/ (159 files; names are the URL path with "/" → "__").
- HTML snapshots: evidence/html/*.html; browser walk: evidence/walk/walk.json (requests, storage, cookies per route).
- REA CLI: `npx -y rea-agents@6.10.1 <command>`. T1 evidence: run
  `npx -y rea-agents@6.10.1 analyze-javascript-application /home/user/Ai-saas/gtabase-rebuild/evidence/bundle/all --artifact-format directory --source-path <file> [--source-path <file> ...] --detail summary --view '{"kind":"javascript-routes","collection":"summary"}' --evidence_output /home/user/Ai-saas/gtabase-rebuild/evidence/rea/<feat>/evidence.json --format json`
  (--evidence_output never overwrites: use a new path; check the summary's evidence_id and that there is no "error").
  Cite the evidence_id and file:line for each hop. Optional: CDP Chromium at http://127.0.0.1:9222
  (open a tab: `curl -s --noproxy '*' -X PUT "http://127.0.0.1:9222/json/new?<url>"`) for
  `inspect-web-event-listeners` / `list-browser-targets`.
- Case runner: tools/web/run-cases.mjs — read its header for the step/read vocabulary, and
  /root/.claude/skills/synced/cc6752fd-7268-4de4-8b31-abc3dda2d885_a8ddf8c5-d246-453c-a73e-06824a829bc9/depth-webapp-analyze-rebuild/references/web-harness.md §4–9.
  Run from tools/: `node web/run-cases.mjs --profile profiles/<feat>.profile.json --cases ../evidence/cases/<feat>.json --out ../evidence/runs/run-<feat>.json`
  then `node common/runs.mjs show ../evidence/runs/run-<feat>.json`. `--only <regex>` re-runs some cases.
- Base profile tools/app.profile.json (chromium, proxy, ads blocked, read-only, reset "clear" = clear local+session storage).
  Copy it to tools/profiles/<feat>.profile.json and add your tokens, modes, macros, resets.
- Probe: `node tools/probe.mjs <url> <file containing one JS expression> [WxH]` prints the expression's value (read-only).

## Rules
1. Read-only. Never log in, post comments, vote, submit forms, or click anything that writes to the
   server. Keep readOnly true; a blocked request is evidence — record it. Browser storage changes are fine.
2. Be gentle: one runner at a time; no tight reload loops; on a Cloudflare challenge/403/429 wait 60 s,
   retry once, then report it.
3. Personal data: never record usernames, commenter names or leaderboard entries.
4. Token names are semantic (e.g. `list-count`, `sort-select`, `compare-bar`) and become the rebuild's
   command vocabulary. Map each to the original's selector in your profile (role=/text= preferred; CSS
   from the original markup allowed here, mark it). In the trace record each token's role and accessible
   name / visible label so the rebuild can expose the same.
5. Readouts: classify each as behavior (URL/hash, labels, enabled/checked state, storage shape, number of
   controls, messages) or data (item names / stat values from the live database). Prefer behavior;
   when reading data prefer counts or relations ("first ≥ second") over raw values — the rebuild uses its
   own synthetic sample data. List data-only readout keys in your report.
6. 20+ recorded cases per feature (web-harness.md §5: happy path, keyboard, input classes, empty/no
   match, sort/filter/paging, reload/back/deep link persistence, 390x844 vs 1366x900, 404). Fix harness
   problems and re-run; list excluded cases with reasons.
7. Two probe rounds max per open question, then HYPOTHESIS/UNKNOWN and move on. Stay inside your features.

## Deliverables per feature
a) evidence/cases/<feat>.json + evidence/runs/run-<feat>.json (20+ cases, clean or excluded with reasons).
b) evidence/rules/<feat>-<rule>.mjs — standalone node scripts embedding observed inputs/outputs from your
   runs, printing PASS/FAIL per observation; run them; all PASS.
c) evidence/traces/<feat>.md with sections:
   - T1 Explain (static): entry point, functions (file:line + REA evidence id), data flow, dependencies
     (storage keys, endpoints), effects, server-side unknowns.
   - T2 Control → effect: one main control, numbered hops with evidence (file:line, case id).
   - Rules (T3): | Rule id | plain words | script | observations reproduced n/n | proving input |
   - Cases: file, count, clean, excluded (ids + reason); data-only readout keys.
   - Command vocabulary: | token | role | accessible name / label | what it does |
   - Behavior summary for the spec: numbered plain-language rules (no code; short functional labels
     only), each citing case ids — builders implement from this.
   - Findings: "F-<FEAT>-NN <fact>. Evidence: …"
   - Unknowns: open questions + what the rebuild should do instead.
Final message: ≤ 25 lines — cases per feature (total/clean/excluded), rules + PASS counts, key behaviors,
unknowns, file paths. Don't paste file contents.
