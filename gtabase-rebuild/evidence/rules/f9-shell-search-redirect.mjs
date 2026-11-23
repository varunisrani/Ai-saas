// Rule F9-R1 (header search) - standalone, analysis side only.
// Plain words: the header search box is a GET form to /search with one field "q" (the browser encodes the
// typed text as form data: spaces become "+", other characters percent-encoded, nothing trimmed). The server
// does not render results: it answers 302 to an external web search restricted to the site, whose query is
// "site:gtabase.com" followed by "+" and the raw q value exactly as received (no decoding, no trimming);
// an empty or missing q gives just "site:gtabase.com"; any other parameters are dropped.
// Observations: curl probes (evidence/runs/probe-f9-search-redirect.txt) and runner cases F9-21..F9-25
// (calls readout: the GET /search request and the redirect target it led to). Note F9-24 typed "  vice  ":
// the runner trims a step's trailing spaces, so the field really held "  vice" (leading spaces kept).
const CURL = [["q=cheetah", "https://www.google.com/search?q=site:gtabase.com+cheetah"], ["", "https://www.google.com/search?q=site:gtabase.com"], ["q=", "https://www.google.com/search?q=site:gtabase.com"], ["q=grotti+cheetah", "https://www.google.com/search?q=site:gtabase.com+grotti+cheetah"], ["q=caf%C3%A9", "https://www.google.com/search?q=site:gtabase.com+caf%C3%A9"], ["q=a%26b", "https://www.google.com/search?q=site:gtabase.com+a%26b"], ["q=%3Cb%3Ex%3C%2Fb%3E", "https://www.google.com/search?q=site:gtabase.com+%3Cb%3Ex%3C%2Fb%3E"], ["q=%20%20vice%20%20", "https://www.google.com/search?q=site:gtabase.com+%20%20vice%20%20"], ["q=vice&lang=de", "https://www.google.com/search?q=site:gtabase.com+vice"]];
const RUNS = [
[
"F9-21",
"grotti cheetah",
"GET /gta-6/ 200 || GET /search?q=grotti+cheetah 302 || GET www.google.com/search?q=site:gtabase.com+grotti+cheetah 200 || GET www.google.com/search?q=site:gtabase.com+grotti+cheetah&sei=FxsEa6L7Fuv9ptQP6tjkKA BLOCKED"
],
[
"F9-22",
"",
"GET /gta-6/ 200 || GET /search?q= 302 || GET www.google.com/search?q=site:gtabase.com 302"
],
[
"F9-23",
"<b>x</b> café & co",
"GET /gta-6/ 200 || GET /search?q=%3Cb%3Ex%3C%2Fb%3E+caf%C3%A9+%26+co 302 || GET www.google.com/search?q=site:gtabase.com+%3Cb%3Ex%3C%2Fb%3E+caf%C3%A9+%26+co 200 || GET www.google.com/search?q=site:gtabase.com+%3Cb%3Ex%3C%2Fb%3E+caf%C3%A9+%26+co&sei=KxsEa6KDC-SpptQPvoy54AE BLOCKED"
],
[
"F9-24",
"  vice",
"GET /gta-6/ 200 || GET /search?q=++vice 302 || GET www.google.com/search?q=site:gtabase.com+++vice 302"
],
[
"F9-25",
"vice city",
"GET /gta-6/ 200 || GET /search?q=vice+city 302 || GET www.google.com/search?q=site:gtabase.com+vice+city 200 || GET www.google.com/search?q=site:gtabase.com+vice+city&sei=PxsEa6KcOOGfw8cPpsbmyQo BLOCKED"
]
];
const formEncode = (typed) => new URLSearchParams({ q: typed }).toString().slice(2);
const redirectFor = (rawQuery) => {
  const m = /(?:^|&)q=([^&]*)/.exec(rawQuery);
  const q = m ? m[1] : '';
  return 'https://www.google.com/search?q=site:gtabase.com' + (q ? '+' + q : '');
};
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + detail}`); };
for (const [rawQuery, location] of CURL) check(`curl /search?${rawQuery}`, redirectFor(rawQuery) === location, `${redirectFor(rawQuery)} vs ${location}`);
for (const [caseId, typed, calls] of RUNS) {
  const q = formEncode(typed);
  check(`${caseId} form sends q="${typed}" as /search?q=${q}`, calls.includes(`GET /search?q=${q} 302`), calls.slice(0, 160));
  const target = redirectFor('q=' + q).replace('https://', '');
  check(`${caseId} redirect target ${target}`, calls.includes(`GET ${target} `), calls.slice(0, 200));
}
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
