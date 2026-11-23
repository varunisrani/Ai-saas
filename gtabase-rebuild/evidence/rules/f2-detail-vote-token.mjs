// Rule F2-R4 (star rating block, guest view, no vote cast).
// Plain words: every detail page shows 5 stars and "<avg> of 5 (<n> Votes)". Nothing is requested on load.
// The first time the pointer enters the stars (or touch / keyboard focus) the page asks the server once for a
// form token: GET /index.php?option=com_ajax&group=system&plugin=getuserdata&format=raw&type=user-token
// (no-store). Later hovers ask nothing (the token is kept for the page). A star click would send the vote with
// that token (a write; never clicked here). No write request is attempted by hovering.
// Observations: evidence/runs/run-f2-detail.json. Standalone: node f2-detail-vote-token.mjs
const TOKEN = 'GET /index.php?option=com_ajax&group=system&plugin=getuserdata&format=raw&type=user-token';
const OBS = [
 {
  "id": "F2-11",
  "firstHover": true,
  "calls": [
   "GET /index.php?option=com_ajax&group=system&plugin=getuserdata&format=raw&type=user-token PENDING"
  ],
  "blocked": ""
 },
 {
  "id": "F2-12",
  "firstHover": false,
  "calls": [],
  "blocked": ""
 }
];
let pass = 0;
for (const o of OBS) {
  const tokenCalls = o.calls.filter((c) => c.startsWith(TOKEN)).length;
  const want = o.firstHover ? 1 : 0;
  const ok = tokenCalls === want && o.calls.length === want && o.blocked === '';
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${o.firstHover ? 'first' : 'repeat'} hover -> ${want} token request(s), no blocked write; observed ${JSON.stringify(o.calls)} blocked="${o.blocked}"`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length ? 0 : 1;
