// Rule F2-R6 (unknown detail slug).
// Plain words: a detail URL whose slug matches no item (any type) answers HTTP 404 with the site's 404 page:
// title and h1 "404 Page Not Found", the line "Get back inside the map!", no rating block, no stats.
// Observations: evidence/runs/run-f2-detail.json (+ HTTP status 404 from the browser snapshot log
// evidence/html/f2f3/snap-log.txt). Standalone: node f2-detail-404.mjs
const OBS = [];
let pass = 0;
for (const o of OBS) {
  const ok = o.title === '404 Page Not Found' && o.h1 === '404 Page Not Found' && (o.sub ?? '').includes('Get back inside the map!') && (o.rating ?? '0') === '0' && (o.bars ?? '0') === '0';
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${o.url} -> 404 page; observed title "${o.title}", h1 "${o.h1}", sub "${o.sub}"`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length && OBS.length ? 0 : 1;
