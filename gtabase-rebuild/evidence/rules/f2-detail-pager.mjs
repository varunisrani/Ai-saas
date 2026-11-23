// Rule F2-R5 (previous / next item links).
// Plain words: below the content every detail page has one "previous" and one "next" link to neighbouring
// items of the same list (same URL prefix), labelled with their names. They are inserted only when the reader
// scrolls near the end of the article (lazy block): 0 links in the document before, exactly 1 + 1 after.
// Following "next" opens that item's detail page.
// Observations: evidence/runs/run-f2-detail.json. Standalone: node f2-detail-pager.mjs
const OBS = [
 {
  "id": "F2-23",
  "page": "/gta-6/vehicles/sunset-sanchez",
  "scrolled": false,
  "prev": 0,
  "next": 0,
  "prevHref": null,
  "nextHref": null
 },
 {
  "id": "F2-24",
  "page": "/gta-6/vehicles/sunset-sanchez",
  "scrolled": true,
  "prev": 1,
  "next": 1,
  "prevHref": "/gta-6/vehicles/mud-crasher-rancher",
  "nextHref": "/gta-6/vehicles/tormentor-street-blazer"
 }
];
let pass = 0;
let lastNext = null;
for (const o of OBS) {
  let ok, msg;
  if (o.after) {
    ok = o.page === lastNext && Number(o.statBars) > 0;
    msg = `after clicking next -> ${lastNext} (a detail page with stat bars); observed ${o.page}, ${o.statBars} bars`;
  } else {
    const prefix = o.page.replace(/[^/]+$/, '');
    ok = o.scrolled ? (o.prev === 1 && o.next === 1 && o.prevHref.startsWith(prefix) && o.nextHref.startsWith(prefix)) : (o.prev === 0 && o.next === 0);
    msg = `${o.scrolled ? 'scrolled to the end' : 'not scrolled'} -> ${o.scrolled ? '1 prev + 1 next under ' + prefix : 'no links yet'}; observed ${o.prev}/${o.next} ${o.prevHref ?? ''} ${o.nextHref ?? ''}`;
    if (o.scrolled) lastNext = o.nextHref;
  }
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${msg}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length ? 0 : 1;
