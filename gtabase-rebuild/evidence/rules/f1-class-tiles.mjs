// Rule F1-R5 (class tile clicks). Analysis-side check against the recorded runs; data-free.
// Run: node evidence/rules/f1-class-tiles.mjs
//
// Rule in plain words (the "Vehicle Class" / "Weapon Class" tiles, i.e. the 2nd filter of each list):
// - Clicking an unpicked tile while NO tile is picked picks it.
// - Clicking an unpicked tile while other tiles are picked SWITCHES: the clicked tile becomes the only
//   picked tile (the others are unpicked automatically).
// - Holding Ctrl, Cmd (Meta) or Shift while clicking an unpicked tile ADDS it to the picked tiles
//   (static code also treats a click in the tile's top-right "+" corner as "add"; not recorded).
// - Clicking a picked tile unpicks only that tile (with or without a modifier).
// - Picked tiles combine with OR; the URL lists them in pick order joined by "," (see f1-hash-grammar).
function click(picked, value, modifier) {
  if (picked.includes(value)) return picked.filter((v) => v !== value);
  if (picked.length && !modifier) return [value];
  return [...picked, value];
}

// [case, picked before, clicked value, modifier held, recorded picked after (from checkbox states + URL order)]
const OBS = [
  ['F1-13', [], 'super', false, ['super']],
  ['F1-14', ['super'], 'sports', false, ['sports']],
  ['F1-15', ['sports'], 'super', true, ['sports', 'super']],
  ['F1-16', ['sports', 'super'], 'super', false, ['sports']],
  ['F1-36', [], 'super', false, ['super']],
  ['F1-W02', [], 'handguns', false, ['handguns']],
  ['F1-W03', ['handguns'], 'shotguns', false, ['shotguns']],
  ['F1-W04', ['shotguns'], 'handguns', true, ['shotguns', 'handguns']],
  ['F1-W16', [], 'melee', false, ['melee']],
];

let pass = 0, fail = 0;
for (const [id, before, value, mod, after] of OBS) {
  const got = click(before, value, mod);
  if (JSON.stringify(got) === JSON.stringify(after)) { pass++; console.log(`PASS ${id} ${JSON.stringify(before)} ${mod ? 'Ctrl+' : ''}click ${value} -> ${JSON.stringify(got)}`); }
  else { fail++; console.log(`FAIL ${id} rule ${JSON.stringify(got)} recorded ${JSON.stringify(after)}`); }
}
console.log(`f1-class-tiles: ${pass} PASS, ${fail} FAIL`);
process.exitCode = fail ? 1 : 0;
