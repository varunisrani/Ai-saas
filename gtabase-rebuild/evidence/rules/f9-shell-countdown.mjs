// Rule F9-R2 (hub release countdown) - standalone, analysis side only.
// Plain words: the hub shows a "Release Countdown" box. Target = 19 November 2026 00:00:00 in the viewer's
// own time zone. Once per second it shows the remaining time as four 2-digit fields - days, hours, minutes,
// seconds - each rounded down (days may exceed 99 with more digits). When the remaining time becomes negative
// the fields are replaced, once and for good, by the single line "GTA 6 is Out Now!" (shown upper-case) and
// the ticking stops. During the last second it shows 00 DAYS : 00 HOURS : 00 MINUTES : 00 SECONDS.
// Observations: probe-f9-countdown-clock.json (emulated clock, time zone UTC) and runner cases F9-01, F9-02, F9-39
// (live date 2026-11-23, after release: no digit fields, text unchanged after 3.5 s).
const CLOCK = [
[
"2026-11-17T10:20:32.787Z",
"01 DAYS : 13 HOURS : 39 MINUTES : 27 SECONDS"
],
[
"2026-11-17T10:20:33.789Z",
"01 DAYS : 13 HOURS : 39 MINUTES : 26 SECONDS"
],
[
"2026-11-17T10:20:34.790Z",
"01 DAYS : 13 HOURS : 39 MINUTES : 25 SECONDS"
],
[
"2026-11-17T10:20:37.791Z",
"01 DAYS : 13 HOURS : 39 MINUTES : 22 SECONDS"
],
[
"2026-11-17T10:20:47.793Z",
"01 DAYS : 13 HOURS : 39 MINUTES : 12 SECONDS"
],
[
"2026-11-18T23:59:57.951Z",
"00 DAYS : 00 HOURS : 00 MINUTES : 02 SECONDS"
],
[
"2026-11-18T23:59:58.952Z",
"00 DAYS : 00 HOURS : 00 MINUTES : 01 SECONDS"
],
[
"2026-11-18T23:59:59.956Z",
"00 DAYS : 00 HOURS : 00 MINUTES : 00 SECONDS"
],
[
"2026-11-19T00:00:02.962Z",
"GTA 6 IS OUT NOW!"
],
[
"2026-11-19T00:00:12.968Z",
"GTA 6 IS OUT NOW!"
]
];
const LIVE = [["F9-01", "2026-11-23", "GTA 6 IS OUT NOW!", "0"], ["F9-02", "2026-11-23", "GTA 6 IS OUT NOW!", "0"], ["F9-39", "2026-11-23", "GTA 6 IS OUT NOW!", "0"]];
const RELEASE_LOCAL = { y: 2026, m: 10, d: 19 }; // month index 10 = November; tz of these observations = UTC
const pad = (n) => String(n).padStart(2, '0');
function countdownText(nowIso) {
  const release = Date.UTC(RELEASE_LOCAL.y, RELEASE_LOCAL.m, RELEASE_LOCAL.d);
  const left = release - Date.parse(nowIso);
  if (left < 0) return 'GTA 6 IS OUT NOW!';
  const s = Math.floor(left / 1000);
  const days = Math.floor(s / 86400), hours = Math.floor((s % 86400) / 3600), minutes = Math.floor((s % 3600) / 60), seconds = s % 60;
  return `${pad(days)} DAYS : ${pad(hours)} HOURS : ${pad(minutes)} MINUTES : ${pad(seconds)} SECONDS`;
}
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + detail}`); };
for (const [at, text] of CLOCK) check(`clock ${at}`, countdownText(at) === text, `expected "${countdownText(at)}" got "${text}"`);
for (const [id, day, text, digits] of LIVE) {
  check(`${id} live ${day}: out-now text`, countdownText(day + 'T12:00:00Z') === text, text);
  check(`${id} live ${day}: no digit fields left`, digits === '0', digits);
}
console.log(`${pass} pass, ${fail} fail`);
process.exitCode = fail ? 1 : 0;
