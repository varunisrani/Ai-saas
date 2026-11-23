// Rule F6-R1 (radio navigation): the player always has one "current" station and track.
// Plain words:
//  - On load the current track is the first playable track of the first station that has one; nothing plays,
//    the bar shows that track's title and artist, time 0:00 / 0:00, and the toggle shows the play icon.
//  - Clicking a track's Play button makes that track (and its station) current and starts it; its button
//    reads "Pause", every other track button reads "Play" (at most one "Pause" on the page).
//  - Next = the following playable track of the CURRENT station; after the last it wraps to the first.
//  - Previous = the preceding playable track of the current station; before the first it wraps to the last.
//  - Next/Previous never move to another station; only clicking a track in another station switches station.
// Observations: run-f6-guides.json F6-09..F6-16 (live, 2026-11-23). The readouts compare the player title
// with the title of a known row, so each observation reduces to "current = station S, index I".
// Standalone: node f6-guides-radio-nav.mjs

const STATION_SIZES = { s1: 34, s3: 31 }; // playable tracks: station 1 (all 34 rows playable), station 3 (31 of 86)

function next(cur) { return { st: cur.st, i: cur.i >= STATION_SIZES[cur.st] - 1 ? 0 : cur.i + 1 }; }
function prev(cur) { return { st: cur.st, i: cur.i <= 0 ? STATION_SIZES[cur.st] - 1 : cur.i - 1 }; }
function clickTrack(_cur, st, i) { return { st, i }; }

// Each step: action -> observed current track (derived from title equality in the run's readouts).
const obs = [
  { id: 'F6-09', action: 'load', expect: { st: 's1', i: 0 }, readouts: { 'text:player-title': 'Starting From Zero', 'text:s1-track1-title': 'Starting From Zero', 'count:track-play-pause-state': '0' } },
  { id: 'F6-10', action: ['click', 's1', 1], expect: { st: 's1', i: 1 }, readouts: { 'text:player-title': "That's It", 'text:s1-track2-title': "That's It", 'text:s1-track2-play': 'PAUSE', 'count:track-play-pause-state': '1' } },
  { id: 'F6-11', action: 'next', expect: { st: 's1', i: 2 }, readouts: { 'text:player-title': 'Ahh Yea', 'text:s1-track3-title': 'Ahh Yea', 'text:s1-track2-play': 'PLAY', 'text:s1-track3-play': 'PAUSE' } },
  { id: 'F6-12', action: ['prev', 'prev'], expect: { st: 's1', i: 0 }, readouts: { 'text:player-title': 'Starting From Zero', 'text:s1-track1-title': 'Starting From Zero', 'text:s1-track1-play': 'PAUSE' } },
  { id: 'F6-13', action: 'prev', expect: { st: 's1', i: 33 }, readouts: { 'text:player-title': 'Overtown Lights', 'text:s1-last-title': 'Overtown Lights', 'text:s1-last-play': 'PAUSE', 'text:s1-track1-play': 'PLAY' } },
  { id: 'F6-14', action: 'next', expect: { st: 's1', i: 0 }, readouts: { 'text:player-title': 'Starting From Zero', 'text:s1-track1-title': 'Starting From Zero', 'text:s1-track1-play': 'PAUSE', 'text:s1-last-play': 'PLAY' } },
  { id: 'F6-15', action: ['click', 's3', 0], expect: { st: 's3', i: 0 }, readouts: { 'text:player-title': 'Good Ones', 'text:s3-first-title': 'Good Ones', 'text:s3-first-play': 'PAUSE', 'text:s1-track1-play': 'PLAY' } },
  { id: 'F6-16', action: 'next', expect: { st: 's3', i: 1 }, readouts: { 'text:player-title': 'Electric Feel', 'text:s3-second-title': 'Electric Feel', 'text:s1-track2-title': "That's It", 'text:s3-second-play': 'PAUSE' } },
];

let cur = null;
let pass = 0;
for (const o of obs) {
  const acts = o.action === 'load' ? ['load'] : Array.isArray(o.action) && o.action[0] === 'click' ? [o.action] : [].concat(o.action);
  for (const a of acts) {
    if (a === 'load') cur = { st: 's1', i: 0 };
    else if (a === 'next') cur = next(cur);
    else if (a === 'prev') cur = prev(cur);
    else cur = clickTrack(cur, a[1], a[2]);
  }
  // the observation itself: the player title equals the title of the row the rule predicts
  const r = o.readouts;
  const rowKey = { 's1:0': 'text:s1-track1-title', 's1:1': 'text:s1-track2-title', 's1:2': 'text:s1-track3-title', 's1:33': 'text:s1-last-title', 's3:0': 'text:s3-first-title', 's3:1': 'text:s3-second-title' }[`${cur.st}:${cur.i}`];
  const sameAsExpected = cur.st === o.expect.st && cur.i === o.expect.i;
  const titleMatches = rowKey && r[rowKey] === r['text:player-title'];
  const onePause = r['count:track-play-pause-state'] === undefined || Number(r['count:track-play-pause-state']) <= 1;
  const ok = sameAsExpected && titleMatches && onePause;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${JSON.stringify(o.action)} -> ${cur.st}#${cur.i + 1} (title "${r['text:player-title']}")`);
}
// station isolation: after F6-16 the title is station 3's second track, not station 1's second track
const iso = obs.find((o) => o.id === 'F6-16').readouts;
const isoOk = iso['text:player-title'] !== iso['text:s1-track2-title'];
console.log(`${isoOk ? 'PASS' : 'FAIL'} F6-16 next stays inside the current station`);
if (isoOk) pass++;
const total = obs.length + 1;
console.log(`${pass}/${total} observations reproduced`);
process.exitCode = pass === total ? 0 : 1;
