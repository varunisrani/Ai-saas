// Rule F3-R1 (compare bar: counter, button label, link, toggle states).
// Plain words:
//  - The bar belongs to one list page (vehicles or weapons). It shows "<n>/4" where n = number of picked items.
//  - With no pick the bar is hidden (faded out, not clickable); with 1+ picks it is shown.
//  - Under 2 picks the button reads "Pick 1 more" (shown in capitals), is greyed out and links nowhere ("#").
//  - With 2..4 picks it reads "Compare (<n>)" and links to <list path>comparison/?<type>1=<id>&<type>2=<id>...
//    where <type> is "vehicle" or "weapon", the ids are the items' URL aliases, sorted A->Z by plain string
//    order (not pick order), numbered from 1.
//  - A card toggle is checked when its item is picked (only toggles of cards currently shown are counted);
//    when 4 are picked every other shown toggle is disabled, otherwise none is.
// Observations: evidence/runs/run-f3-compare.json (stored = sessionStorage value read in the same case;
// null = not read in that case; F3-10 is left out: its case did not read the stored value). Standalone: node f3-compare-bar.mjs
const MAX = 4;
const OBS = [
 {
  "id": "F3-01",
  "list": "/gta-6/vehicles/",
  "stored": "<missing>",
  "visibleToggles": 100,
  "observed": {
   "count": "0/4",
   "go": "PICK 1 MORE",
   "href": "#",
   "cls": "gtab-cmp-go gtab-cmp-off",
   "barHidden": true,
   "checked": 0,
   "disabled": 0
  }
 },
 {
  "id": "F3-02",
  "list": "/gta-6/vehicles/",
  "stored": "[{\"id\":\"andrew-nodes-thrax\",\"name\":\"Andrew Node's Thrax\"}]",
  "visibleToggles": 100,
  "observed": {
   "count": "1/4",
   "go": "PICK 1 MORE",
   "href": "#",
   "cls": "gtab-cmp-go gtab-cmp-off",
   "barHidden": false,
   "checked": 1,
   "disabled": 0
  }
 },
 {
  "id": "F3-03",
  "list": "/gta-6/vehicles/",
  "stored": "[{\"id\":\"andrew-nodes-thrax\",\"name\":\"Andrew Node's Thrax\"},{\"id\":\"seaspray-emerus\",\"name\":\"Seaspray Emerus\"}]",
  "visibleToggles": 100,
  "observed": {
   "count": "2/4",
   "go": "COMPARE (2)",
   "href": "/gta-6/vehicles/comparison/?vehicle1=andrew-nodes-thrax&vehicle2=seaspray-emerus",
   "cls": "gtab-cmp-go",
   "barHidden": false,
   "checked": 2,
   "disabled": 0
  }
 },
 {
  "id": "F3-04",
  "list": "/gta-6/vehicles/",
  "stored": "[{\"id\":\"seaspray-emerus\",\"name\":\"Seaspray Emerus\"}]",
  "visibleToggles": 100,
  "observed": {
   "count": "1/4",
   "go": "PICK 1 MORE",
   "href": "#",
   "cls": "gtab-cmp-go gtab-cmp-off",
   "barHidden": false,
   "checked": 1,
   "disabled": 0
  }
 },
 {
  "id": "F3-05",
  "list": "/gta-6/vehicles/",
  "stored": "[{\"id\":\"andrew-nodes-thrax\",\"name\":\"Andrew Node's Thrax\"},{\"id\":\"seaspray-emerus\",\"name\":\"Seaspray Emerus\"},{\"id\":\"honeycomb-emerus\",\"name\":\"Honeycomb Emerus\"},{\"id\":\"black-widow-emerus\",\"name\":\"Black Widow Emerus\"}]",
  "visibleToggles": 100,
  "observed": {
   "count": "4/4",
   "go": "COMPARE (4)",
   "href": "/gta-6/vehicles/comparison/?vehicle1=andrew-nodes-thrax&vehicle2=black-widow-emerus&vehicle3=honeycomb-emerus&vehicle4=seaspray-emerus",
   "cls": "gtab-cmp-go",
   "barHidden": false,
   "checked": 4,
   "disabled": 96
  }
 },
 {
  "id": "F3-06",
  "list": "/gta-6/vehicles/",
  "stored": "[{\"id\":\"andrew-nodes-thrax\",\"name\":\"Andrew Node's Thrax\"},{\"id\":\"seaspray-emerus\",\"name\":\"Seaspray Emerus\"},{\"id\":\"honeycomb-emerus\",\"name\":\"Honeycomb Emerus\"},{\"id\":\"black-widow-emerus\",\"name\":\"Black Widow Emerus\"}]",
  "visibleToggles": 100,
  "observed": {
   "count": "4/4",
   "go": "COMPARE (4)",
   "href": "/gta-6/vehicles/comparison/?vehicle1=andrew-nodes-thrax&vehicle2=black-widow-emerus&vehicle3=honeycomb-emerus&vehicle4=seaspray-emerus",
   "cls": "gtab-cmp-go",
   "barHidden": false,
   "checked": 4,
   "disabled": 96
  }
 },
 {
  "id": "F3-07",
  "list": "/gta-6/vehicles/",
  "stored": "[{\"id\":\"andrew-nodes-thrax\",\"name\":\"Andrew Node's Thrax\"},{\"id\":\"seaspray-emerus\",\"name\":\"Seaspray Emerus\"},{\"id\":\"honeycomb-emerus\",\"name\":\"Honeycomb Emerus\"}]",
  "visibleToggles": 100,
  "observed": {
   "count": "3/4",
   "go": "COMPARE (3)",
   "href": "/gta-6/vehicles/comparison/?vehicle1=andrew-nodes-thrax&vehicle2=honeycomb-emerus&vehicle3=seaspray-emerus",
   "cls": "gtab-cmp-go",
   "barHidden": false,
   "checked": 3,
   "disabled": 0
  }
 },
 {
  "id": "F3-08",
  "list": "/gta-6/vehicles/",
  "stored": "[]",
  "visibleToggles": 100,
  "observed": {
   "count": "0/4",
   "go": "PICK 1 MORE",
   "href": "#",
   "cls": "gtab-cmp-go gtab-cmp-off",
   "barHidden": true,
   "checked": 0,
   "disabled": 0
  }
 },
 {
  "id": "F3-09",
  "list": "/gta-6/vehicles/",
  "stored": "[{\"id\":\"andrew-nodes-thrax\",\"name\":\"Andrew Node's Thrax\"}]",
  "visibleToggles": 100,
  "observed": {
   "count": "1/4",
   "go": "PICK 1 MORE",
   "href": "#",
   "cls": "gtab-cmp-go gtab-cmp-off",
   "barHidden": false,
   "checked": 1,
   "disabled": 0
  }
 },
 {
  "id": "F3-11",
  "list": "/gta-6/vehicles/",
  "stored": "[{\"id\":\"andrew-nodes-thrax\",\"name\":\"Andrew Node's Thrax\"},{\"id\":\"seaspray-emerus\",\"name\":\"Seaspray Emerus\"}]",
  "visibleToggles": 100,
  "observed": {
   "count": "2/4",
   "go": "COMPARE (2)",
   "href": "/gta-6/vehicles/comparison/?vehicle1=andrew-nodes-thrax&vehicle2=seaspray-emerus",
   "cls": "gtab-cmp-go",
   "barHidden": false,
   "checked": 2,
   "disabled": 0
  }
 },
 {
  "id": "F3-12",
  "list": "/gta-6/vehicles/",
  "stored": "[{\"id\":\"andrew-nodes-thrax\",\"name\":\"Andrew Node's Thrax\"},{\"id\":\"seaspray-emerus\",\"name\":\"Seaspray Emerus\"}]",
  "visibleToggles": 6,
  "observed": {
   "count": "2/4",
   "go": "COMPARE (2)",
   "href": "/gta-6/vehicles/comparison/?vehicle1=andrew-nodes-thrax&vehicle2=seaspray-emerus",
   "cls": null,
   "barHidden": null,
   "checked": 1,
   "disabled": null
  }
 },
 {
  "id": "F3-13",
  "list": "/gta-6/weapons/",
  "stored": "<missing>",
  "visibleToggles": 100,
  "observed": {
   "count": "0/4",
   "go": "PICK 1 MORE",
   "href": "#",
   "cls": "gtab-cmp-go gtab-cmp-off",
   "barHidden": true,
   "checked": 0,
   "disabled": 0
  }
 },
 {
  "id": "F3-14",
  "list": "/gta-6/weapons/",
  "stored": "[{\"id\":\"38\",\"name\":\".38\"},{\"id\":\"heavy-pistol\",\"name\":\"1922\"}]",
  "visibleToggles": 100,
  "observed": {
   "count": "2/4",
   "go": "COMPARE (2)",
   "href": "/gta-6/weapons/comparison/?weapon1=38&weapon2=heavy-pistol",
   "cls": "gtab-cmp-go",
   "barHidden": false,
   "checked": 2,
   "disabled": 0
  }
 },
 {
  "id": "F3-17",
  "list": "/gta-6/vehicles/",
  "stored": "[{\"id\":\"andrew-nodes-thrax\",\"name\":\"Andrew Node's Thrax\"}]",
  "visibleToggles": 100,
  "observed": {
   "count": "1/4",
   "go": "PICK 1 MORE",
   "href": "#",
   "cls": "gtab-cmp-go gtab-cmp-off",
   "barHidden": false,
   "checked": 1,
   "disabled": 0
  }
 }
];

function predict(o) {
  const picks = o.stored === '<missing>' ? [] : JSON.parse(o.stored);
  const n = picks.length;
  const type = o.list.includes('/weapons/') ? 'weapon' : 'vehicle';
  const ids = picks.map((p) => p.id).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return {
    count: `${n}/${MAX}`,
    go: (n < 2 ? 'Pick 1 more' : `Compare (${n})`).toUpperCase(),
    href: n < 2 ? '#' : `${o.list}comparison/?` + ids.map((id, i) => `${type}${i + 1}=${encodeURIComponent(id)}`).join('&'),
    cls: n < 2 ? 'gtab-cmp-go gtab-cmp-off' : 'gtab-cmp-go',
    barHidden: n === 0,
    disabled: n >= MAX ? o.visibleToggles - n : 0,
  };
}

let pass = 0;
for (const o of OBS) {
  const p = predict(o);
  const diffs = Object.keys(p).filter((k) => o.observed[k] !== null && o.observed[k] !== undefined && String(o.observed[k]) !== String(p[k]));
  if (!diffs.length) pass++;
  console.log(`${diffs.length ? 'FAIL' : 'PASS'} ${o.id} ${p.count} -> ${p.go} ${p.href}${diffs.length ? ' | ' + diffs.map((k) => `${k}: rule ${p[k]} observed ${o.observed[k]}`).join('; ') : ''}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length ? 0 : 1;
