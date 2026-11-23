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

## Data builder (src/data, 18 files, 36 vitest checks — verified by the orchestrator: full suite green)
Counts: vehicles 280 (170 regular / 110 standout, 25 sets), weapons 180 (60 base / 120 unique), animals 64, radio 12 stations
(68/116 playable), missions 40/12/16, checklist 38 items = 100, cheats 36, map 10 groups / 102 categories / 928 markers,
articles 84 (54 guides, 7 videos), screenshots 260, trailer screens 150. Seed "leonida-atlas".
HYPOTHESIS choices: pageSlug without "best-"; per-class counts = primary classes; invented standouts either side of
sunset-sanchez; extra base "thrax"; vehicles without speed have no 0–10 stats; standouts have no real-life model/gallery;
unique variants no description; seashark/dodo/maverick get real-life models; story-tasks limit 27 no weight; 100% article not
a guide; only gone-fishing + optional/missable badges; latestContent mixes newest vehicle/weapon; performers "Not yet announced";
character slug = first name; manufacturers with domain field; artFor undefined → 404.
