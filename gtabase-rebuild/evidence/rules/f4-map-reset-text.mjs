// Rule F4-R5 ("Reset progress" dialog texts and outcome).
// Plain words: "Reset progress" opens an in-page dialog (not a browser confirm) titled "Reset progress".
// - With no found marker: the text "Nothing to reset: no marker is ticked as found yet." and a single "Close" button.
// - Otherwise: a choice "Untick the found markers of" with options "All categories (<n> found)" (value "") followed by
//   one option per trackable category that has found markers, "<category name> (<k> found)" (value = category id);
//   the text "This unticks the <n marker(s)> you found, in every category." or "... you found in <category>.",
//   plus " They are removed from your MyBase account as well." when signed in, then " There is no undo.";
//   buttons "Reset" and "Cancel". "1 marker" / "<n> markers".
// - After Reset: choice and Reset button disappear, Cancel becomes "Close", and the text becomes
//   "Done: <n marker(s)> unticked." on success, or on failure
//   "The reset could not be saved, so nothing was changed. Try again in a moment." (nothing unticked) /
//   "The reset stopped halfway: <k> of <n marker(s)> unticked. Try again in a moment." /
//   "Your MyBase session has ended, so nothing was changed. Log in again, then reset once more."
// Note: on the live site even a guest reset first asks the server (POST ...getuserdata&type=checklist-load); the
// read-only runner blocks that POST, so the recorded outcome is the failure text and nothing is unticked (F4-33).
// Observations: run-f4-map.json F4-29, F4-31, F4-32, F4-33. Standalone: node f4-map-reset-text.mjs

const markers = (n) => (n === 1 ? '1 marker' : `${n} markers`);

function dialog(found, chosen, signedIn = false) {
  const total = Object.values(found).reduce((a, b) => a + b, 0);
  if (!total) return { say: 'Nothing to reset: no marker is ticked as found yet.', options: [], buttons: ['Close'] };
  const options = [`All categories (${total} found)`, ...Object.entries(found).filter(([, k]) => k > 0).map(([c, k]) => `${c} (${k} found)`)];
  const n = chosen ? found[chosen] : total;
  const say = `This unticks the ${markers(n)} you found${chosen ? ` in ${chosen}` : ', in every category'}.` +
    (signedIn ? ' They are removed from your MyBase account as well.' : '') + ' There is no undo.';
  return { say, options, buttons: ['Reset', 'Cancel'] };
}

function outcome(result, n) {
  if (result.ok) return `Done: ${markers(n)} unticked.`;
  if (result.reason === 'session') {
    return (result.done ? `Your MyBase session ended during the reset: ${result.done} of ${markers(n)} unticked.` : 'Your MyBase session has ended, so nothing was changed.') + ' Log in again, then reset once more.';
  }
  return (result.done ? `The reset stopped halfway: ${result.done} of ${markers(n)} unticked.` : 'The reset could not be saved, so nothing was changed.') + ' Try again in a moment.';
}

const obs = [
  ['F4-29 nothing found: text', dialog({}).say, 'Nothing to reset: no marker is ticked as found yet.'],
  ['F4-29 nothing found: only button', dialog({}).buttons.join('|'), 'Close'],
  ['F4-31 one found: options', dialog({ Safehouses: 1 }).options.join(' || '), 'All categories (1 found) || Safehouses (1 found)'],
  ['F4-31 one found, all categories: text', dialog({ Safehouses: 1 }).say, 'This unticks the 1 marker you found, in every category. There is no undo.'],
  ['F4-31 buttons', dialog({ Safehouses: 1 }).buttons.join('|'), 'Reset|Cancel'],
  ['F4-32 category chosen: text', dialog({ Safehouses: 1 }, 'Safehouses').say, 'This unticks the 1 marker you found in Safehouses. There is no undo.'],
  ['F4-33 server check blocked: text', outcome({ ok: false, reason: 'error', done: 0 }, 1), 'The reset could not be saved, so nothing was changed. Try again in a moment.'],
];

let pass = 0;
for (const [id, got, want] of obs) {
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: ${got}`);
}
console.log(`${pass}/${obs.length} observations reproduced`);
process.exitCode = pass === obs.length ? 0 : 1;
