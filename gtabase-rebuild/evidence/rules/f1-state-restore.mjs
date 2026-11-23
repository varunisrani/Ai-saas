// Rule F1-R7 (state persistence: URL hash + sessionStorage). Analysis-side check; data-free.
// Run: node evidence/rules/f1-state-restore.mjs
//
// Rule in plain words:
// - The list state lives in the URL hash. Every time the list writes its hash, the same hash is copied to
//   sessionStorage under "jamg-hash:<page path>" (e.g. jamg-hash:/gta-6/vehicles/), unless the viewer is
//   in the middle of leaving the page (a link to another page was just clicked).
// - Opening a list URL that carries a hash (deep link, new tab, reload) restores that state: filters
//   are re-ticked/re-selected, the sort select and direction follow, and the result is recomputed.
// - Only a Back/Forward navigation restores the saved sessionStorage hash when it differs from the URL.
//   A normal visit to the bare list URL starts from the defaults and overwrites the saved hash.
function onLoad(navType, urlHash, saved, defaultHash) {
  const hash = navType === 'back_forward' && saved && saved !== urlHash ? saved : urlHash;
  return hash || defaultHash;
}

const VEH_DEFAULT = '#sort=attr.ct6.frontend_value&sortdir=desc';
// [case, recorded URL hash, recorded sessionStorage value]: session must equal the hash
const MIRROR = [
  ['F1-01', VEH_DEFAULT, VEH_DEFAULT],
  ['F1-02', VEH_DEFAULT, VEH_DEFAULT],
  ['F1-04', '#sort=attr.ct6.frontend_value&sortdir=desc&name=an&page=1', '#sort=attr.ct6.frontend_value&sortdir=desc&name=an&page=1'],
  ['F1-22', '#sort=name&sortdir=desc', '#sort=name&sortdir=desc'],
  ['F1-28', '#sort=name&sortdir=asc&attr.ct1.value=super&page=1', '#sort=name&sortdir=asc&attr.ct1.value=super&page=1'],
  ['F1-W01', '#sort=name&sortdir=asc', '#sort=name&sortdir=asc'],
];
// [case, navigation type, hash in the URL being opened, saved hash before, recorded hash after load, recorded filter ticked]
const NAV = [
  ['F1-28', 'navigate', '#sort=name&sortdir=asc&attr.ct1.value=super', '', '#sort=name&sortdir=asc&attr.ct1.value=super', true],
  ['F1-29', 'reload', '#sort=name&sortdir=asc&attr.ct1.value=super&page=1', '#sort=name&sortdir=asc&attr.ct1.value=super&page=1', '#sort=name&sortdir=asc&attr.ct1.value=super&page=1', true],
  ['F1-32', 'back_forward', '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct1.value=super&page=1', '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct1.value=super&page=1', '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct1.value=super&page=1', true],
  ['F1-33', 'navigate', '', '#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct1.value=super&page=1', VEH_DEFAULT, false],
];

let pass = 0, fail = 0;
const ok = (id, cond, msg) => { if (cond) { pass++; console.log(`PASS ${id} ${msg}`); } else { fail++; console.log(`FAIL ${id} ${msg}`); } };
for (const [id, hash, session] of MIRROR) ok(id, hash === session, `sessionStorage mirrors the hash (${session})`);
for (const [id, nav, urlHash, saved, after, ticked] of NAV) {
  const got = onLoad(nav, urlHash, saved, VEH_DEFAULT);
  // the recorded "after" may carry page=1 added by the restored filter (see f1-hash-grammar)
  const same = got === after || got + '&page=1' === after || got === after.replace(/&page=1$/, '');
  ok(id, same && ticked === /attr\.ct1\.value=super/.test(got), `${nav} with url ${urlHash || '(none)'} and saved ${saved || '(none)'} -> ${got}`);
}
console.log(`f1-state-restore: ${pass} PASS, ${fail} FAIL`);
process.exitCode = fail ? 1 : 0;
