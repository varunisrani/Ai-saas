// Rule F5-R3 (display of the percentage).
// Plain words: the computed percentage is first clamped to 0..100. The number next to "% Completed!"
// shows it with exactly two decimals (standard JavaScript-style rounding of the two-decimal form); the
// progress bar's width is the clamped value in percent (not rounded), and the bar's accessible value
// (aria-valuenow) is the two-decimal text. Nothing else (no "%" sign inside the number, no thousands sep).
// Observations: run-f5-checklists.json (text:pct-text, attr:pct-bar@style, attr:pct-bar@aria-valuenow)
// and probe-f5-checklists-synthetic.json (S-*). Standalone: node f5-checklists-display.mjs

const show = (raw) => {
  const v = Math.min(100, Math.max(0, raw));
  return { text: v.toFixed(2), width: v, valuenow: v.toFixed(2) };
};
// browsers serialise a percentage width with up to 6 significant digits
const cssWidth = (v) => `${Number(v.toPrecision(6))}%`;

const obs = [
  // [id, raw computed value, observed text, observed width (as read), observed aria-valuenow or null]
  ['F5-01', 0, '0.00', 'width: 0%;', null],
  ['F5-02', 50, '50.00', 'width: 50%;', '50.00'],
  ['F5-12', 11, '11.00', 'width: 11%;', null],
  ['F5-14', 100, '100.00', 'width: 100%;', '100.00'],
  ['F5-16', 51, '51.00', 'width: 51%;', null],
  ['S-A1', (20 / 22) * 3, '2.73', '2.72727%', '2.73'],
  ['S-A2', (20 / 22) * 4, '3.64', '3.63636%', '3.64'],
  ['S-C1', 1.5, '1.50', '1.5%', '1.50'],
  ['S-D1', 150, '100.00', '100%', '100.00'],
  ['S-E1', 12.345, '12.35', '12.345%', '12.35'],
];

let pass = 0;
for (const [id, raw, text, width, valuenow] of obs) {
  const d = show(raw);
  const w = cssWidth(d.width);
  const widthOk = width.startsWith('width:') ? width === `width: ${w};` : width === w;
  const ok = d.text === text && widthOk && (valuenow === null || d.valuenow === valuenow);
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: raw ${raw} -> "${d.text}" width ${w} valuenow ${d.valuenow}`);
}
console.log(`${pass}/${obs.length} observations reproduced`);
process.exitCode = pass === obs.length ? 0 : 1;
