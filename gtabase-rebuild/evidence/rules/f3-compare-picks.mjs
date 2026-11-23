// Rule F3-R2 (compare picks: storage, limit, persistence).
// Plain words:
//  - Picks are kept per list page in the tab's session storage under "gtabCompare:<list path>"
//    ("/gta-6/vehicles/" and "/gta-6/weapons/" are separate). The value is a JSON array of {id, name}
//    in pick order; id = the item's URL alias (e.g. "38" for the ".38"), name = the card title.
//  - Nothing is stored until the first change; toggling an unpicked item appends it; toggling a picked item
//    removes it; when 4 are picked, toggling a 5th does nothing; "Clear" stores an empty array.
//  - Picks survive reload, filter/search changes (cards are re-rendered and re-marked), opening an item and
//    coming Back, and visiting the other list; they are lost when the tab's session ends (the reset here).
// Inputs: the actions recorded in each case (c1..c5 = first five cards of the default vehicles order,
// w1/w2 = first two weapon cards); observed = ids read from session storage in that case (null = not read).
// Observations: evidence/runs/run-f3-compare.json. Standalone: node f3-compare-picks.mjs
const MAX = 4;
const CARD = {"c1": "andrew-nodes-thrax", "c2": "seaspray-emerus", "c3": "honeycomb-emerus", "c4": "black-widow-emerus", "c5": "(5th card)", "w1": "38", "w2": "heavy-pistol"};
const OBS = [
 {
  "id": "F3-01",
  "actions": [
   [
    "reset"
   ]
  ],
  "observed": {
   "V": "<missing>",
   "W": null
  }
 },
 {
  "id": "F3-02",
  "actions": [
   [
    "toggle",
    "V",
    "c1"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax"
   ],
   "W": null
  }
 },
 {
  "id": "F3-03",
  "actions": [
   [
    "toggle",
    "V",
    "c2"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax",
    "seaspray-emerus"
   ],
   "W": null
  }
 },
 {
  "id": "F3-04",
  "actions": [
   [
    "toggle",
    "V",
    "c1"
   ]
  ],
  "observed": {
   "V": [
    "seaspray-emerus"
   ],
   "W": null
  }
 },
 {
  "id": "F3-05",
  "actions": [
   [
    "reset"
   ],
   [
    "toggle",
    "V",
    "c1"
   ],
   [
    "toggle",
    "V",
    "c2"
   ],
   [
    "toggle",
    "V",
    "c3"
   ],
   [
    "toggle",
    "V",
    "c4"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax",
    "seaspray-emerus",
    "honeycomb-emerus",
    "black-widow-emerus"
   ],
   "W": null
  }
 },
 {
  "id": "F3-06",
  "actions": [
   [
    "toggle",
    "V",
    "c5"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax",
    "seaspray-emerus",
    "honeycomb-emerus",
    "black-widow-emerus"
   ],
   "W": null
  }
 },
 {
  "id": "F3-07",
  "actions": [
   [
    "toggle",
    "V",
    "c4"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax",
    "seaspray-emerus",
    "honeycomb-emerus"
   ],
   "W": null
  }
 },
 {
  "id": "F3-08",
  "actions": [
   [
    "clear",
    "V"
   ]
  ],
  "observed": {
   "V": [],
   "W": null
  }
 },
 {
  "id": "F3-09",
  "actions": [
   [
    "reset"
   ],
   [
    "toggle",
    "V",
    "c1"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax"
   ],
   "W": null
  }
 },
 {
  "id": "F3-10",
  "actions": [
   [
    "toggle",
    "V",
    "c2"
   ]
  ],
  "observed": {
   "V": null,
   "W": null
  }
 },
 {
  "id": "F3-11",
  "actions": [
   [
    "reload"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax",
    "seaspray-emerus"
   ],
   "W": null
  }
 },
 {
  "id": "F3-12",
  "actions": [
   [
    "filter"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax",
    "seaspray-emerus"
   ],
   "W": null
  }
 },
 {
  "id": "F3-13",
  "actions": [
   [
    "navigate"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax",
    "seaspray-emerus"
   ],
   "W": "<missing>"
  }
 },
 {
  "id": "F3-14",
  "actions": [
   [
    "toggle",
    "W",
    "w1"
   ],
   [
    "toggle",
    "W",
    "w2"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax",
    "seaspray-emerus"
   ],
   "W": [
    "38",
    "heavy-pistol"
   ]
  }
 },
 {
  "id": "F3-17",
  "actions": [
   [
    "reset"
   ],
   [
    "toggle",
    "V",
    "c1"
   ],
   [
    "navigate"
   ],
   [
    "back"
   ]
  ],
  "observed": {
   "V": [
    "andrew-nodes-thrax"
   ],
   "W": null
  }
 }
];

let state = { V: '<missing>', W: '<missing>' };
function apply(a) {
  const [op, list, card] = a;
  if (op === 'reset') state = { V: '<missing>', W: '<missing>' };
  else if (op === 'clear') state[list] = [];
  else if (op === 'toggle') {
    const cur = state[list] === '<missing>' ? [] : [...state[list]];
    const id = CARD[card];
    const at = cur.indexOf(id);
    if (at !== -1) cur.splice(at, 1);
    else if (cur.length < MAX) cur.push(id);
    state[list] = cur;
  } // reload, filter, navigate, back: no change
}

let pass = 0, checks = 0;
for (const o of OBS) {
  o.actions.forEach(apply);
  for (const list of ['V', 'W']) {
    if (o.observed[list] === null) continue;
    checks++;
    const ok = JSON.stringify(o.observed[list]) === JSON.stringify(state[list]);
    if (ok) pass++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${list === 'V' ? 'vehicles' : 'weapons '} after ${o.actions.map((a) => a.join(' ')).join(', ')} -> rule ${JSON.stringify(state[list])} observed ${JSON.stringify(o.observed[list])}`);
  }
}
console.log(`${pass}/${checks} observations reproduced`);
process.exitCode = pass === checks ? 0 : 1;
