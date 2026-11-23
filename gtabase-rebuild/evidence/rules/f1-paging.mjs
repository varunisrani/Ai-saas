// Rule F1-R6 (paging / infinite loading). Analysis-side check against the recorded runs; data-free.
// Run: node evidence/rules/f1-paging.mjs
//
// Rule in plain words:
// - The counter always shows the total number of matching items (top and bottom toolbars alike), and the
//   word after it is the list's plural noun regardless of the number ("1 Vehicles" form, never singular).
// - The first render shows the first 100 matching items (all of them if fewer). There are no page buttons.
// - When the viewer scrolls to within 400 px of the end of the rendered cards, the next 100 are appended;
//   a single scroll can append more than one batch. This repeats until all matching items are shown.
// - Loading more never changes the URL hash, the counter or the sort.
// - Any filter change starts again from the first 100 of the new result (the URL gets page=1).
// - A page sentinel after the cards stores how many batches are shown ("page-data"); it stops counting
//   when the last batch is appended, so at the end it equals ceil(total/100) - 1 (for totals over 100).
const PAGE = 100;
const initial = (total) => Math.min(total, PAGE);
function consistent(total, cards, pageData) {
  if (cards === total) return total <= PAGE ? true : pageData === Math.ceil(total / PAGE) - 1 || pageData === undefined;
  return cards % PAGE === 0 && cards < total && (pageData === undefined || pageData === cards / PAGE);
}

// [case, total (counter), cards rendered, page-data (or null), scrolled?, url unchanged by scrolling?]
const OBS = [
  ['F1-01', 590, 100, 1, false, true],
  ['F1-02', 590, 300, 3, true, true],
  ['F1-03', 590, 590, 5, true, true],
  ['F1-04', 115, 100, null, false, true],
  ['F1-07', 0, 0, 1, false, true],
  ['F1-13', 29, 29, null, false, true],
  ['F1-17', 319, 100, null, false, true],
  ['F1-18', 9, 9, null, false, true],
  ['F1-W01', 211, 100, 1, false, true],
  ['F1-W05', 127, 100, null, false, true],
  ['F1-W09', 124, 100, null, false, true],
  ['F1-W11', 211, 211, 2, true, true],
];

let pass = 0, fail = 0;
const ok = (id, cond, msg) => { if (cond) { pass++; console.log(`PASS ${id} ${msg}`); } else { fail++; console.log(`FAIL ${id} ${msg}`); } };
for (const [id, total, cards, pd, scrolled, urlSame] of OBS) {
  if (!scrolled) ok(id, cards === initial(total) && (pd === null || pd === 1), `first render ${cards} of ${total} (rule ${initial(total)})`);
  else ok(id, cards > PAGE && consistent(total, cards, pd ?? undefined) && urlSame, `after scrolling ${cards} of ${total}, page-data ${pd}, hash unchanged`);
}
console.log(`f1-paging: ${pass} PASS, ${fail} FAIL`);
process.exitCode = fail ? 1 : 0;
