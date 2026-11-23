// Rule F6-R2 (radio playable tracks and labels).
// Plain words:
//  - Every tracklist row has a Play button, but a row is playable only when it carries a video reference;
//    the player hides the button of every row without one. Hidden + shown = all rows.
//  - A station whose tracklist has no playable row is skipped by the player (never becomes current).
//  - Each shown button reads "Play" with a play icon; the current track's button reads "Pause" while it is
//    starting/playing; the bar's toggle shows only the icon (pause while starting/playing, play otherwise).
//  - Clicking the current track (or the bar toggle) after the 3-second action lock toggles it; while the
//    track is still starting (buffering) a toggle pauses it (label back to "Play").
//  - Until the video player is ready (its script not loaded yet, or unreachable) Play/Next/Previous/toggle
//    change nothing on screen: labels stay "Play", the bar keeps the first track (a Play click is remembered
//    and started once the player becomes ready).
// Observations: run-f6-guides.json F6-09, F6-10, F6-17, F6-38, run-f6-guides-noyt.json F6NY-01..04 (live) and the static per-station counts of the
// 2026-11-23 snapshot (evidence/html/gta-6_radio-stations_.html).
// Standalone: node f6-guides-radio-playable.mjs

// snapshot: [rows, rows with a video reference] per station, in page order
const stations = [[34, 34], [43, 43], [86, 31], [24, 12], [24, 8], [39, 16], [30, 14], [31, 8], [70, 16], [36, 7], [17, 7], [27, 1], [35, 12], [52, 11], [16, 14], [0, 0], [40, 10], [18, 4], [25, 10], [2, 2], [70, 9], [41, 21], [23, 7], [36, 4]];

const rows = stations.reduce((a, [r]) => a + r, 0);
const playable = stations.reduce((a, [, p]) => a + p, 0);
const hidden = rows - playable;
const stationsWithoutPlayable = stations.filter(([, p]) => p === 0).length;

const live = { // F6-09 readouts
  'count:station-row': '24', 'count:track-play': '819', 'count:track-play-visible': '301', 'count:track-play-hidden': '518', 'count:station-without-tracks': '1',
  'attr:player-toggle-icon@class': 'fa-solid fa-play', 'count:track-play-pause-state': '0', 'text:player-time': '0:00', 'text:player-duration': '0:00',
};
const checks = [
  ['F6-09 stations', String(stations.length), live['count:station-row']],
  ['F6-09 all rows have a button', String(rows), live['count:track-play']],
  ['F6-09 shown buttons = rows with a video reference', String(playable), live['count:track-play-visible']],
  ['F6-09 hidden buttons = rows without one', String(hidden), live['count:track-play-hidden']],
  ['F6-09 stations with nothing playable', String(stationsWithoutPlayable), live['count:station-without-tracks']],
  ['F6-09 idle toggle icon', 'fa-solid fa-play', live['attr:player-toggle-icon@class']],
  ['F6-09 idle: no Pause label', '0', live['count:track-play-pause-state']],
  ['F6-09 idle time', '0:00|0:00', `${live['text:player-time']}|${live['text:player-duration']}`],
  // F6-10: clicked track label + bar icon
  ['F6-10 clicked track label', 'PAUSE', 'PAUSE'],
  ['F6-10 bar toggle icon while starting', 'fa-solid fa-pause', 'fa-solid fa-pause'],
  // F6-17: toggle after the lock while still buffering (YouTube data request blocked by the read-only guard)
  ['F6-17 toggle -> paused label', 'PLAY', 'PLAY'],
  ['F6-17 toggle -> play icon', 'fa-solid fa-play', 'fa-solid fa-play'],
  // F6-38: same counts at 390x844
  ['F6-38 shown buttons at 390x844', String(playable), '301'],
  // run-f6-guides-noyt.json: YouTube unreachable -> no player
  ['F6NY-01 Play click without player: label unchanged', 'PLAY', 'PLAY'],
  ['F6NY-01 Play click without player: bar still on first track', 'Starting From Zero', 'Starting From Zero'],
  ['F6NY-02 Next without player: bar unchanged', 'Starting From Zero', 'Starting From Zero'],
  ['F6NY-03 toggle without player: icon stays play', 'fa-solid fa-play', 'fa-solid fa-play'],
  ['F6NY-04 Previous without player: bar unchanged', 'Starting From Zero', 'Starting From Zero'],
];
// the F6-10/F6-17 rows restate the run values (rule: label = state); recompute from a state model too
const label = (state) => (state === 'playing' || state === 'buffering' ? 'PAUSE' : 'PLAY');
const icon = (state) => (state === 'playing' || state === 'buffering' ? 'fa-solid fa-pause' : 'fa-solid fa-play');
const noPlayer = (cur) => cur; // every action is ignored (or deferred) while the player is not ready
const first = 'Starting From Zero'; // F6NY-01 readout text:s1-track1-title
const model = { 'F6-10 clicked track label': label('buffering'), 'F6-10 bar toggle icon while starting': icon('buffering'), 'F6-17 toggle -> paused label': label('paused'), 'F6-17 toggle -> play icon': icon('paused'),
  'F6NY-01 Play click without player: label unchanged': label('idle'), 'F6NY-01 Play click without player: bar still on first track': noPlayer(first),
  'F6NY-02 Next without player: bar unchanged': noPlayer(first), 'F6NY-03 toggle without player: icon stays play': icon('idle'), 'F6NY-04 Previous without player: bar unchanged': noPlayer(first) };

let pass = 0;
for (const [name, expectedFromRule, observed] of checks) {
  const exp = model[name] ?? expectedFromRule;
  const ok = exp === observed;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: rule=${exp} observed=${observed}`);
}
console.log(`${pass}/${checks.length} observations reproduced`);
process.exitCode = pass === checks.length ? 0 : 1;
