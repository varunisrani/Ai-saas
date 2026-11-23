// Rule F2-R2 (detail stat bars: scale and units).
// Plain words: the statistics block lists bar stats first, each "<Label>" + number with one decimal on a 0-10
// scale + a bar whose filled width is value x 10 percent (5.9 -> 59%). Vehicles: Speed, Acceleration,
// Asphalt Handling, Off-Road Handling, Strength (5 bars) then "Rating" = the off-road overall rating and an
// unlabelled road (asphalt) rating, both whole numbers without a bar. Weapons: Damage, Accuracy, Handling,
// Range (4 bars) then "Overall" with one decimal and no bar. Labels are shown in capitals (CSS).
// Observations: evidence/runs/run-f2-detail.json. Standalone: node f2-detail-statbar.mjs
const OBS = [
 {
  "id": "F2-01",
  "url": "/gta-6/vehicles/sunset-sanchez",
  "labels": [
   "SPEED",
   "ACCELERATION",
   "ASPHALT HANDLING",
   "OFF-ROAD HANDLING",
   "STRENGTH",
   "RATING"
  ],
  "values": [
   "3.9",
   "5.9",
   "5.2",
   "8.1",
   "4.0",
   "728",
   "523"
  ],
  "barCount": 5,
  "barStyles": [
   "width: 39%;",
   "width: 59%;",
   "width: 52%;",
   "width: 81%;",
   "width: 40%;"
  ]
 }
];
let pass = 0, n = 0;
for (const o of OBS) {
  const bars = o.barStyles.filter((s) => s && s !== '<missing>');
  bars.forEach((style, i) => {
    n++;
    const want = `width: ${Math.round(parseFloat(o.values[i]) * 10)}%;`;
    const ok = style === want && /^\d+\.\d$/.test(o.values[i]);
    if (ok) pass++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${o.labels[i]} ${o.values[i]} -> "${want}"${ok ? '' : ` observed "${style}"`}`);
  });
  n++;
  const extra = o.values.slice(o.barCount);
  const isVehicle = o.url.includes('/vehicles/');
  const okTail = isVehicle ? (o.barCount === 5 && extra.length === 2 && extra.every((x) => /^\d+$/.test(x)) && o.labels[5] === 'RATING')
                           : (o.barCount === 4 && extra.length === 1 && /^\d+\.\d$/.test(extra[0]) && o.labels[4] === 'OVERALL');
  if (okTail) pass++;
  console.log(`${okTail ? 'PASS' : 'FAIL'} ${o.id} ${o.barCount} bars, then [${extra.join(', ')}] labelled ${o.labels.slice(o.barCount).join(', ') || '-'}`);
}
console.log(`${pass}/${n} observations reproduced`);
process.exitCode = pass === n ? 0 : 1;
