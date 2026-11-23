// Rule F6-R3 (guide page structure): a guide page is one long server-rendered article; each sub-list is a
// card grid under its own heading, and the page-wide card count is the sum of its grids (no paging, no
// "load more", no client-side filter or sort; nothing is hidden behind tabs or accordions).
// Plain words:
//  - total cards on the page = sum of the cards of every grid on it;
//  - each card links to one detail page and its link's accessible name is "Read more: <name>";
//  - on the properties guide only the "purchasable" grid's cards show a price; every card shows a location;
//  - no guide page contains tab/accordion components.
// Observations: run-f6-guides.json F6-01 (animals), F6-04 (characters), F6-05 (gangs), F6-07 (properties),
// F6-09 (radio), F6-18/F6-21 (cheats). Values are the live counts of 2026-11-23 (data: the rebuild's own
// sample sizes will differ; the relations must hold).
// Standalone: node f6-guides-grid-counts.mjs

const obs = [
  { id: 'F6-01', page: 'animals', grids: [184, 69, 2], total: 255, gridCount: 3, rlta: 0, linkName: 'Read more: Albino American Alligator', cardName: 'Albino American Alligator' },
  { id: 'F6-04', page: 'characters', grids: [2, 6, 10, 49], total: null, gridCount: 4, rlta: 0 },
  { id: 'F6-05', page: 'gangs', grids: [3, 0], total: null, gridCount: 2, rlta: 0 },
  { id: 'F6-07', page: 'properties', grids: [8, 4, 3, 5], total: 20, gridCount: 4, rlta: 0, withPrice: 8, withLocation: 20 },
  { id: 'F6-09', page: 'radio', rlta: 0 },
  { id: 'F6-18', page: 'cheats-ps5', rlta: 0 },
];

let pass = 0, n = 0;
const check = (name, ok, detail) => { n++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`); };
for (const o of obs) {
  if (o.grids) check(`${o.id} ${o.page}: number of grids`, o.grids.length === o.gridCount, `${o.grids.length} grids`);
  if (o.total != null) check(`${o.id} ${o.page}: total = sum of grids`, o.grids.reduce((a, b) => a + b, 0) === o.total, `${o.grids.join('+')}=${o.total}`);
  if (o.linkName) check(`${o.id} card link name = "Read more: " + card name`, o.linkName === `Read more: ${o.cardName}`);
  if (o.withPrice != null) check(`${o.id} price only on the first (purchasable) grid`, o.withPrice === o.grids[0], `${o.withPrice} priced`);
  if (o.withLocation != null) check(`${o.id} every card shows a location`, o.withLocation === o.total);
  check(`${o.id} ${o.page}: no tab/accordion components`, o.rlta === 0);
}
console.log(`${pass}/${n} observations reproduced`);
process.exitCode = pass === n ? 0 : 1;
