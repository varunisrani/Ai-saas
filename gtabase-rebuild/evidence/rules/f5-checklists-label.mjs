// Rule F5-R4 (accessible name of each tick box).
// Plain words: a tick box with no label of its own gets the accessible name "Mark as completed: <row text>",
// where <row text> is the visible text of the row it sits in (the heading, list item or label around it),
// with runs of whitespace collapsed, trimmed, a leading list number such as "12." or "3)" removed, and cut to
// 100 characters. Badge texts inside the row are included as they appear (adjacent badges run together).
// With no row text the name is just "Mark as completed".
// Observations: run-f5-checklists.json F5-20, F5-24, F5-27. Standalone: node f5-checklists-label.mjs

const label = (rowText) => {
  let t = String(rowText ?? '').replace(/\s+/g, ' ').trim();
  t = t.replace(/^\d+\s*[.)]\s*/, '').slice(0, 100);
  return t ? `Mark as completed: ${t}` : 'Mark as completed';
};

// row texts as they are in the page (textContent of the row; badges are separate inline elements)
const obs = [
  ['F5-20 100% section heading', ' Story Completion (50%)', 'Mark as completed: Story Completion (50%)'],
  ['F5-20 100% contents link', '\n Story Completion (50%)', 'Mark as completed: Story Completion (50%)'],
  ['F5-20 exploration item', ' 5 of 7 Kenton Sets Completed (1%)', 'Mark as completed: 5 of 7 Kenton Sets Completed (1%)'],
  ['F5-20 tasks parent', ' Tasks (27%)', 'Mark as completed: Tasks (27%)'],
  ['F5-24 numbered mission', '\n 1. Prologue', 'Mark as completed: Prologue'],
  ['F5-24 mission with badge', ' 2. Gone Fishing CHAPTER 1 POINT OF NO RETURN', 'Mark as completed: Gone Fishing CHAPTER 1 POINT OF NO RETURN'],
  ['F5-24 optional mission, two badges', " Get Shirley's Rum OPTIONALMISSABLE", "Mark as completed: Get Shirley's Rum OPTIONALMISSABLE"],
  ['F5-27 strangers mission (no number)', '\n Search for the Skunk Ape', 'Mark as completed: Search for the Skunk Ape'],
];

let pass = 0;
for (const [id, row, want] of obs) {
  const got = label(row);
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}: "${got}"`);
}
// (count observation, not re-derived here: every tick box on the 100% page (76/76, F5-20) and the missions
// page (134/134, F5-24) carries a "Mark as completed" name.)
console.log(`${pass}/${obs.length} observations reproduced`);
process.exitCode = pass === obs.length ? 0 : 1;
