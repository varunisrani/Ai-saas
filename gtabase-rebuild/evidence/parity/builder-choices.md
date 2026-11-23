# Builder choices (HYPOTHESIS) and spec gaps reported by builders — collected for PARITY_REPORT.md

## Rules builder (src/lib, 25 modules, 303 vitest tests — verified by the orchestrator 2026-11-23: 25 files / 303 passed)
HYPOTHESIS choices: R-410 rating always one decimal ("4.0 of 5 (12 Votes)", "1 Vote") although "4 of 5" was observed;
R-413 accents kept in heading slugs; R-515 typed text trimmed, arrow highlight stops at the ends; R-510 "+" on a picked tile = no change;
R-526 mixed valid/invalid values keep only the valid ones; R-713 redirect only when keys differ from canonical;
R-914 unweighted parent share split over unweighted sub-items, group slot uses first member's multiplier;
R-905 all parents re-evaluated bottom-up; R-836/R-838 typo allowance by word length, prefix match on longer words;
R-840 future timestamp not restored; R-846 notice window whole UTC days inclusive; R-1106 bad/negative ?start = page 1;
R-1204 out-of-range thumb_limitstart = last page; R-1209 swipe left = next; R-1308 extra text searched for articles only, "1 result";
R-1318 caller passes the tz offset for the target date.
Spec gaps: R-003 vs R-713 (unknown params); R-1405 cross-list recency not representable in R-1403 shape;
R-820 folded:[] persists after fold/unfold (literal rule); R-410 observed "4 of 5" vs one-decimal rule; SearchType "radio" naming.
