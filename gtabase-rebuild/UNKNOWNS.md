# Unknowns (ranked)

Rank = how much the answer would reduce uncertainty in the rebuild × how cheap the probe is.
Status: OPEN / PARTIAL / RESOLVED (→ evidence).

| Rank | Id | Question | Why it matters | Next probe | Status |
|---|---|---|---|---|---|
| 1 | U-001 | Where does the Megafilter get its items (inline JSON, separate JSON request, or server HTML)? | decides the data model and paging rules | network capture of /gta-6/vehicles/ + script trace | OPEN |
| 2 | U-002 | Full hash-state grammar of the lists (sort keys, filter keys, page) | URL contract for F1 vectors | recorded cases changing sort/filter/page | OPEN |
| 3 | U-003 | How does the map store guest found-markers (localStorage key and shape)? | F4 tracking parity | storage inspection after a toggle (local only) | OPEN |
| 4 | U-004 | What does gtab-compare.js store and how are compare URLs formed? | F3 | static trace + recorded cases | OPEN |
| 5 | U-005 | Do checklist ticks persist for guests (localStorage) or need login? | F5 | recorded case: tick, reload | OPEN |
| 6 | U-006 | Signed-in MyBase behavior (favorites, garages) | F10 | cannot sign in from this cloud session → HYPOTHESIS | OPEN |

## Resolved
| Id | Question | Answer (evidence) |
|---|---|---|
