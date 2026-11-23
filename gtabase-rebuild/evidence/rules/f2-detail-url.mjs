// Rule F2-R8 (detail URL normalisation, server side).
// Plain words: the canonical detail URL is /gta-6/<list>/<alias> in lower case, no trailing slash, no query.
//  - a trailing slash or upper-case letters -> redirect to the canonical URL;
//  - a query string (e.g. ?i=<image>, ?utm_source=) -> 301 redirect to the bare URL (so gallery deep links
//    "?i=" are lost and no lightbox opens);
//  - the legacy prefix /vehicles/gta-6/<alias> (used by some ranking links) is served as-is, same page, no redirect.
// Observations: evidence/runs/run-f2-detail.json (final URL after the browser followed redirects) and the 301
// in evidence/html/f2f3/snap-log.txt. Standalone: node f2-detail-url.mjs
const OBS = [
 {
  "id": "F2-28",
  "requested": "/gta-6/vehicles/sunset-sanchez/",
  "kind": "trailing-slash",
  "final": "/gta-6/vehicles/sunset-sanchez",
  "bars": "5",
  "lightbox": null
 },
 {
  "id": "F2-29",
  "requested": "/gta-6/vehicles/Sunset-Sanchez",
  "kind": "upper-case",
  "final": "/gta-6/vehicles/sunset-sanchez",
  "bars": "5",
  "lightbox": null
 },
 {
  "id": "F2-30",
  "requested": "/vehicles/gta-6/manchez",
  "kind": "legacy-prefix",
  "final": "/vehicles/gta-6/manchez",
  "bars": "5",
  "lightbox": null
 }
];
function canonical(req, kind) {
  if (kind === 'legacy-prefix') return req;
  return req.split('?')[0].replace(/\/$/, '').toLowerCase();
}
let pass = 0;
for (const o of OBS) {
  const want = canonical(o.requested, o.kind);
  const ok = o.final === want && (o.kind !== 'query-i' || o.lightbox === 'false');
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${o.kind}: ${o.requested} -> ${want}${o.kind === 'query-i' ? ' (no lightbox)' : ''}; observed ${o.final}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length && OBS.length ? 0 : 1;
