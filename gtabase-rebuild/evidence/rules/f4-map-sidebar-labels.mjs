// Rule F4-R3 (sidebar labels and states: counters, Show all/Hide all, Hide found, Only/All, group fold and box).
// Plain words:
// - Trackable category row: counter text "found <f> / <n>" (the word "found" and the spaces are hidden visually,
//   so it reads "<f>/<n>" on screen), title "Found so far, out of all markers of this category", hidden from
//   screen readers, which get a separate text "found <f> of <n>". Non-trackable row: counter "<n>" with title
//   "Markers in this category", no screen-reader text. The counter is not shown while the category is switched off.
// - "Show all"/"Hide all" button: "Show all" when no category is on, "Hide all" when every category is on,
//   otherwise it keeps its previous word (page starts with "Hide all"); after "Only" it reads "Show all".
//   Clicking it applies the word: all on or all off (including the hidden-by-default categories).
// - "Hide found" button: off -> "Hide found", title "Take the markers you found off the map (the counts stay)";
//   on -> "Show found", title "Put the markers you found back on the map". Counters never change with it.
// - "Only" button per row: "Only" with name "Show only this category: <name>"; while that category is the only
//   one on it reads "All" with name "Show all categories again: <name>" and switches every category on again.
// - Group fold button: open -> name/title "Hide <group>", aria-expanded true; folded -> "Show <group>", false.
// - Group box: ticked when all its categories are on, unticked (and "mixed") when only some are; the group's
//   icon in the top rail gets the "off" look when none of its categories is on.
// Observations: run-f4-map.json F4-01, 02, 03, 04, 05, 07, 09, 11, 12, 21, 26, 28.
// Standalone: node f4-map-sidebar-labels.mjs

const counter = (trackable, on, found, total) => {
  if (!on) return { visible: '', sr: trackable ? `found ${found} of ${total}` : null };
  if (!trackable) return { visible: String(total), sr: null, title: 'Markers in this category' };
  const text = `found ${found} / ${total}`; // textContent
  const visible = text.replace(/^found /, '').replace(/ \/ /, '/'); // word and gaps hidden by CSS
  return { visible, sr: `found ${found} of ${total}`, title: 'Found so far, out of all markers of this category' };
};
function allButton(prevWord, onCount, total, afterOnly = false) {
  if (afterOnly) return 'Show all';
  if (onCount === 0) return 'Show all';
  if (onCount === total) return 'Hide all';
  return prevWord;
}
const foundButton = (hiding) => (hiding
  ? { word: 'Show found', title: 'Put the markers you found back on the map' }
  : { word: 'Hide found', title: 'Take the markers you found off the map (the counts stay)' });
const onlyButton = (name, isOnly) => (isOnly
  ? { word: 'All', label: `Show all categories again: ${name}` }
  : { word: 'Only', label: `Show only this category: ${name}` });
const fold = (group, open) => ({ label: `${open ? 'Hide' : 'Show'} ${group}`, expanded: String(open) });
const groupBox = (onInGroup, sizeOfGroup) => ({ checked: String(onInGroup === sizeOfGroup && sizeOfGroup > 0), railOff: onInGroup === 0 });

const up = (s) => s.toUpperCase(); // buttons and headings are shown upper-case by CSS (innerText)
const obs = [
  ['F4-02 Banks counter (on, 0 found of 22)', counter(true, true, 0, 22).visible, '0/22'],
  ['F4-02 counter title', counter(true, true, 0, 22).title, 'Found so far, out of all markers of this category'],
  ['F4-02 Safehouses screen-reader text', counter(true, true, 0, 5).sr, 'found 0 of 5'],
  ['F4-02 ATMs (non-trackable) counter', counter(false, true, 0, 194).visible, '194'],
  ['F4-02 ATMs counter title', counter(false, true, 0, 194).title, 'Markers in this category'],
  ['F4-21 Safehouses after one tick', counter(true, true, 1, 5).visible, '1/5'],
  ['F4-05 Banks switched off: counter not shown', counter(true, false, 0, 22).visible, ''],
  ['F4-01 first visit (98 of 102 on)', up(allButton('Hide all', 98, 102)), 'HIDE ALL'],
  ['F4-03 after Hide all (0 on)', up(allButton('Hide all', 0, 102)), 'SHOW ALL'],
  ['F4-04 after Show all (102 on)', up(allButton('Show all', 102, 102)), 'HIDE ALL'],
  ['F4-05 one category off (97 on)', up(allButton('Hide all', 97, 102)), 'HIDE ALL'],
  ['F4-11 after Only', up(allButton('Hide all', 1, 102, true)), 'SHOW ALL'],
  ['F4-01 Hide found (off)', up(foundButton(false).word), 'HIDE FOUND'],
  ['F4-01 Hide found title', foundButton(false).title, 'Take the markers you found off the map (the counts stay)'],
  ['F4-26 Hide found on', up(foundButton(true).word), 'SHOW FOUND'],
  ['F4-26 title when on', foundButton(true).title, 'Put the markers you found back on the map'],
  ['F4-28 off again', up(foundButton(false).word), 'HIDE FOUND'],
  ['F4-02 Only button name', onlyButton('Garages', false).label, 'Show only this category: Garages'],
  ['F4-02 Only button word', onlyButton('Garages', false).word, 'Only'],
  ['F4-11 after Only: word', up(onlyButton('Garages', true).word), 'ALL'],
  ['F4-11 after Only: name', onlyButton('Garages', true).label, 'Show all categories again: Garages'],
  ['F4-12 after All: word', up(onlyButton('Garages', false).word), 'ONLY'],
  ['F4-02 fold open', fold('Robberies', true).label + '|' + fold('Robberies', true).expanded, 'Hide Robberies|true'],
  ['F4-09 folded', fold('Robberies', false).label + '|' + fold('Robberies', false).expanded, 'Show Robberies|false'],
  ['F4-05 group box with 6 of 7 on', groupBox(6, 7).checked, 'false'],
  ['F4-07 group box off: rail look', groupBox(0, 7).checked + '|' + (groupBox(0, 7).railOff ? 'gtab-off' : ''), 'false|gtab-off'],
  ['F4-03 Hide all: rail look', groupBox(0, 7).railOff ? 'gtab-off' : '', 'gtab-off'],
];

let pass = 0;
for (const [id, got, want] of obs) {
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: ${got}`);
}
console.log(`${pass}/${obs.length} observations reproduced`);
process.exitCode = pass === obs.length ? 0 : 1;
