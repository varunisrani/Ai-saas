// Rule F10-R1 (guest favorite prompt on detail pages).
// Plain words: every GTA 6 detail page (vehicle, weapon, animal, radio station, property, character, mission)
// has one "Add To Favorites" button. For a guest it never changes its label and never sends a request:
// activating it (click, Enter or Space) opens the site's login dialog with the title replaced by
// "Save your GTA 6 favorites" and the extra line "Create a free account to save your favorites, track your
// garages, vehicles and weapons, and much more." Nothing is stored in the browser.
// Observations: run-f10-favorites.json (F10-01..F10-08, F10-15, F10-16, F10-18).
// Standalone: node f10-favorites-guest-prompt.mjs

const TITLE = 'Save your GTA 6 favorites';
const LINE = 'Create a free account to save your favorites, track your garages, vehicles and weapons, and much more.';
const LABEL = 'Add To Favorites';

// the rule: state after a guest activates the button
function guestActivate() {
  return { label: LABEL, dialogOpen: true, title: TITLE, line: LINE, requests: '', stored: '<missing>' };
}

const OBS = [
   {
    "id": "F10-02",
    "page": "vehicle",
    "label": "Add To Favorites",
    "dialogOpen": true,
    "title": "Save your GTA 6 favorites",
    "line": "Create a free account to save your favorites, track your garages, vehicles and weapons, and much more.",
    "calls": "",
    "blocked": "",
    "stored": "<missing>"
   },
   {
    "id": "F10-15",
    "page": "vehicle, Enter key",
    "dialogOpen": true,
    "title": "Save your GTA 6 favorites",
    "calls": "",
    "blocked": ""
   },
   {
    "id": "F10-16",
    "page": "vehicle, Space key",
    "label": "Add To Favorites"
   },
   {
    "id": "F10-18",
    "page": "vehicle, 390x844",
    "label": "Add To Favorites",
    "dialogOpen": true,
    "title": "Save your GTA 6 favorites",
    "calls": "",
    "blocked": ""
   }
  ];

let pass = 0;
for (const o of OBS) {
  const r = guestActivate();
  const diffs = [];
  if (o.label !== undefined && o.label !== r.label) diffs.push(`label ${o.label}`);
  if (o.dialogOpen !== undefined && o.dialogOpen !== r.dialogOpen) diffs.push(`dialog ${o.dialogOpen}`);
  if (o.title !== undefined && o.title !== r.title) diffs.push(`title ${o.title}`);
  if (o.line !== undefined && o.line !== r.line) diffs.push(`line ${o.line}`);
  if (o.calls !== undefined && o.calls !== r.requests) diffs.push(`calls ${o.calls}`);
  if (o.blocked !== undefined && o.blocked !== r.requests) diffs.push(`blocked ${o.blocked}`);
  if (o.stored !== undefined && o.stored !== r.stored) diffs.push(`stored ${o.stored}`);
  const ok = diffs.length === 0;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} (${o.page})${ok ? '' : ': ' + diffs.join('; ')}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length ? 0 : 1;
