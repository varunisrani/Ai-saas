// Rule F3-R3 (comparison page picker: search, keyboard, pick -> URL).
// Plain words:
//  - Each "Add a <type>" slot has a search box (combobox, placeholder "Search..."). Focusing it opens the list
//    with every item in A->Z name order, the first one highlighted.
//  - Matching: lower-case, accents removed (query and names), the query is split on spaces and EVERY word must
//    occur somewhere in the name (any order, substrings). Items already in the comparison are left out.
//  - At most 150 rows are listed; when more match, a last row reads "<rest> more: keep typing"; when none
//    match, a single row reads "No match".
//  - ArrowDown/ArrowUp move the highlight and wrap around; Escape closes the list and restores the box text;
//    Enter (or a click) picks the highlighted item and the page goes to <slot url>?<slot param>=<alias>
//    ("&" instead of "?" when the slot url already has a query).
// Inputs: the weapons picker source list (206 names, browser snapshot 2026-11-23 10:35, evidence/html/f2f3/
// gta-6_weapons_comparison_.html); the live list had grown to 211 at run time, so name lists are checked as
// "every snapshot match is shown" plus the per-row rules. Observations: evidence/runs/run-f3-compare.json.
// Standalone: node f3-compare-picker.mjs
const SOURCE = [["38", ".38"], ["heavy-pistol", "1922"], ["service-carbine", "556 Assault Rifle"], ["akulus", "Akulus"], ["assassin-nipper-38", "Assassin Nipper .38"], ["az1200", "AZ1200"], ["backdoor-hobo", "Backdoor Hobo"], ["bae-luxs-w-10", "Bae-Lux's W-10"], ["baseball-bat", "Baseball Bat"], ["basher-gorse-425", "Basher Gorse 425"], ["baton", "Baton"], ["black-eagle-import-kalinga", "Black Eagle Import Kalinga"], ["black-eagle-import-m306-tmr", "Black Eagle Import M306 TMR"], ["boomer", "Boomer"], ["brainwasher-1992", "Brainwasher 1922"], ["knuckle-dusters", "Brass Knuckles"], ["brians-1992", "Brian's 1922"], ["brontasaurus-bat", "Brontasaurus Bat"], ["bruiser-super400", "Bruiser Super400"], ["bushcraft-knife", "Bushcraft Knife"], ["caminos-signature-k17", "Caminos Signature K17"], ["cargo-h-l-38", "Cargo H&L .38"], ["chromium-w-10", "Chromium W-10"], ["chronic-vatra", "Chronic Vatra"], ["clunker-556", "Clunker 556"], ["cockroach-xtreme-556", "Cockroach Xtreme 556"], ["cold-war-556", "Cold War 556"], ["combat-knife", "Combat Knife"], ["comshot-12", "Comshot 12"], ["conspiracist-type-9", "Conspiracist Type 9"], ["convict-kalinga-50", "Convict Kalinga .50"], ["copperheads-w-14", "Copperheads W-14"], ["couch-potato-mustang-357", "Couch Potato Mustang .357"], ["cpd-moreland-850", "CPD Moreland 850"], ["crabshack-vf5", "Crabshack VF5"], ["crowbar", "Crowbar"], ["cruel-huntsmans-sm-69", "Cruel Huntsman's SM-69"], ["cursed-knife", "Cursed Knife"], ["darknite-drifter", "Darknite Drifter"], ["dazzler-dw-9", "Dazzler DW-9"], ["deadringer-1992", "Deadringer 1922"], ["dirty-drifter", "Dirty Drifter"], ["diving-knife", "Diving Knife"], ["donnies-h-l-38", "Donnie's H&L .38"], ["donnies-knife", "Donnie's Knife"], ["double-cross-vatra", "Double Cross Vatra"], ["double-barrel-shotgun", "Drifter"], ["drug-mule-kz-59", "Drug Mule KZ-59"], ["drx", "DRX"], ["spp-mp9", "DSG"], ["dumpster-k17-mcd", "Dumpster K17 MCD"], ["duval-signature-es9", "Duval Signature ES9"], ["mac-12", "DW-9"], ["dwnplys-k17", "DWNPLY's K17"], ["edc-knife", "EDC Knife"], ["ejs-k17", "EJ's K17"], ["eris-fresh-dsg", "Eris Fresh DSG"], ["es18", "ES18"], ["girardi-es9", "ES9"], ["explorers-knife", "Explorer's Knife"], ["ff-50", "FF-50"], ["ff-sr", "FF-SR"], ["fib-sm-69", "FIB SM-69"], ["final-chapter-kvga-12", "Final Chapter KVGA-12"], ["final-chapter-shortstraw", "Final Chapter Shortstraw"], ["fincredible-laird-350", "Fincredible Laird 350"], ["bottle", "Fire Bottle"], ["firebreak-sm-69", "Firebreak SM-69"], ["flashbang", "Flash Grenade"], ["flashlight", "Flashlight"], ["fra", "FRA"], ["grenade", "Frag Grenade"], ["franciscos-lmg-6", "Francisco's LMG 6"], ["furry-dw-9", "Furry DW-9"], ["gils-kalinga-50", "Gil's Kalinga .50"], ["grenade-launcher", "GLR40"], ["ball", "Golf Ball"], ["golf-club", "Golf Club"], ["gorse-425", "Gorse 425"], ["grx-556", "GRX 556"], ["guardia-brothers-fra", "Guardia Brothers FRA"], ["guardia-brothers-vf5", "Guardia Brothers VF5"], ["gun-nut-sms-01", "Gun Nut SMS-01"], ["gutterball-moreland-850", "Gutterball Moreland 850"], ["rpg", "H-AT"], ["hammer", "Hammer"], ["heathen", "Heathen"], ["hellspawn-comshot-12", "Hellspawn Comshot 12"], ["compact-rifle", "Hind"], ["hobo", "Hobo"], ["honky-tonk-mustang-357", "Honky Tonk Mustang .357"], ["hostile-super400", "Hostile Super400"], ["hunters-laird-350", "Hunter's Laird 350"], ["hunting-knife", "Hunting Knife"], ["iaa-sms-01", "IAA SMS-01"], ["internal-affairs-ff-sr", "Internal Affairs FF-SR"], ["iron-oak-wcr-1", "Iron & Oak WCR-1"], ["island-poacher-ff-50", "Island Poacher FF-50"], ["jack-sheepe-h-l-38", "Jack Sheepe H&L .38"], ["jerry-can", "Jerry Can"], ["klose-k17", "K17"], ["k17-mcd", "K17 MCD"], ["kalinga-50", "Kalinga .50"], ["killtelligence-sm-69", "Killtelligence SM-69"], ["kingfishers-akulus", "Kingfishers Akulus"], ["kingfishers-laird-350", "Kingfishers Laird 350"], ["kingfishers-w-22", "Kingfishers W-22"], ["kingpin-heathen", "Kingpin Heathen"], ["knife", "Knife"], ["kolt-associates-556", "Kolt & Associates 556"], ["kolt-associates-vatra", "Kolt & Associates Vatra"], ["kvga-12", "KVGA-12"], ["assault-rifle", "KZ-59"], ["la-polilla-negra-kz-59", "La Polilla Negra KZ-59"], ["la-polilla-negra-vf-g1", "La Polilla Negra VF-G1"], ["bolt-action-sniper", "Laird 350"], ["little-cuba-hind", "Little Cuba Hind"], ["little-friend-w-10", "Little Friend W-10"], ["lmg-6", "LMG 6"], ["longshot", "Longshot"], ["low-point-nipper-38", "Low Point Nipper .38"], ["lyles-h-l-38", "Lyle's H&L .38"], ["springfield-armory-m1a-sniper", "M306"], ["m306-tmr", "M306 TMR"], ["combat-mg", "M350"], ["mahi-nipper-38", "Mahi Nipper .38"], ["marabunta-grande-hobo", "Marabunta Grande Hobo"], ["marabunta-grande-kz-59", "Marabunta Grande KZ-59"], ["marabunta-grande-type-9", "Marabunta Grande Type 9"], ["marthas-1992", "Martha's 1922"], ["mediator", "Mediator"], ["mercenary-lmg-6", "Mercenary LMG 6"], ["midlife-crisis-vf5", "Midlife Crisis VF5"], ["mister-mangrove-laird-350", "Mister Mangrove Laird 350"], ["molotov", "Molotov"], ["money-bag-1992", "Money Bag 1922"], ["moneymaker-w-10", "Moneymaker W-10"], ["montys-1992", "Monty's 1922"], ["moreland-850", "Moreland 850"], ["morgan-revolver", "Morgan Revolver"], ["mossy-mediator", "Mossy Mediator"], ["mustang-357-revolver", "Mustang .357"], ["neon-sunset-type-9", "Neon Sunset Type 9"], ["nipper-38", "Nipper .38"], ["nite-raptor-k17", "Nite Raptor K17"], ["nitepower-az1200", "Nitepower AZ1200"], ["pd-90", "PD-90"], ["petes-kz-59", "Pete's KZ-59"], ["pipe-wrench", "Pipe Wrench"], ["pool-cue", "Pool Cue"], ["ptt-youngin-k17", "PTT Youngin$ K17"], ["quarter-mile-es9", "Quarter Mile ES9"], ["rauls-1992", "Raul's 1922"], ["rauls-cqb-556", "Raul's CQB 556"], ["rauls-heist-556", "Raul's Heist 556"], ["redneck-w-22", "Redneck W-22"], ["ride-free-h-l-38", "Ride Free H&L .38"], ["rogue-alpha-drx", "Rogue Alpha DRX"], ["roxys-w-10", "Roxy's W-10"], ["russos-1992", "Russo's 1922"], ["san4san-gorse-425", "San4San Gorse 425"], ["san4san-k17", "San4San K17"], ["san4san-kz-59", "San4San KZ-59"], ["sand-storm-es9", "Sand Storm ES9"], ["scrapper-vf5c", "Scrapper VF5C"], ["shark-knife", "Shark Knife"], ["shocker", "Shocker"], ["shortstraw", "Shortstraw"], ["sm-69", "SM-69"], ["smoke-grenade", "Smoke Grenade"], ["sms-01", "SMS-01"], ["smuggler-gorse-425", "Smuggler Gorse 425"], ["soldiers-combat-knife", "Soldier's Combat Knife"], ["spangled-vatra", "Spangled Vatra"], ["speargun", "Speargun"], ["star-spangled-556", "Star Spangled 556"], ["sticky-bomb", "Sticky Bomb"], ["stoner-k17-mcd", "Stoner K17 MCD"], ["super400", "Super400"], ["survival-knife", "Survival Knife"], ["swamp-bait-akulus", "Swamp Bait Akulus"], ["switchblade", "Switchblade"], ["tallaloko-knife", "Tallaloko Knife"], ["the-guardian-es18", "The Guardian ES18"], ["the-patriarch-drx", "The Patriarch DRX"], ["the-silver-1922", "The Silver 1922"], ["throttler-verro", "Throttler Verro"], ["turnt-nipper-38", "Turnt Nipper .38"], ["twins-laird-350", "Twin's Laird 350"], ["type-9", "Type 9"], ["tyrones-w-10", "Tyrone's W-10"], ["unarmed", "Unarmed (Fist)"], ["unpacked-comshot-12", "Unpacked Comshot 12"], ["micro-smg", "Vatra"], ["verro", "Verro"], ["vf-g1", "VF-G1"], ["smg", "VF5"], ["vf5c", "VF5C"], ["vice-city-heathen", "Vice City Heathen"], ["mac-11", "W-10"], ["w-14", "W-14"], ["ruger-10-22-sniper", "W-22"], ["watcher-pro-moreland-850", "Watcher Pro Moreland 850"], ["wcr1", "WCR1"], ["woodhatch-longshot", "Woodhatch Longshot"], ["zodiac-nipper-38", "Zodiac Nipper .38"]];
const OBS = {
 "filter": [
  {
   "id": "F3-20",
   "query": "",
   "total": 211,
   "shown": 150,
   "more": "61 more: keep typing",
   "firstActiveClass": "vc-active",
   "first": ".38"
  },
  {
   "id": "F3-21",
   "query": "KNIFE",
   "shown": 13,
   "list": [
    "Bushcraft Knife",
    "Combat Knife",
    "Cursed Knife",
    "Diving Knife",
    "Donnie's Knife",
    "EDC Knife",
    "Explorer's Knife",
    "Hunting Knife",
    "Knife",
    "Shark Knife",
    "Soldier's Combat Knife",
    "Survival Knife",
    "Tallaloko Knife"
   ],
   "moreCount": 0
  },
  {
   "id": "F3-22",
   "query": "zzqx",
   "shown": 0,
   "more": "No match"
  },
  {
   "id": "F3-23",
   "query": "59 kz",
   "shown": 7,
   "list": [
    "Drug Mule KZ-59",
    "KZ-59",
    "La Polilla Negra KZ-59",
    "Marabunta Grande KZ-59",
    "Nightmare KZ-59",
    "Pete's KZ-59",
    "San4San KZ-59"
   ]
  },
  {
   "id": "F3-25b",
   "query": "knífe",
   "shown": 13,
   "sameAs": "F3-21"
  }
 ],
 "keys": {
  "id": "F3-24",
  "list": [
   "Drug Mule KZ-59",
   "KZ-59",
   "La Polilla Negra KZ-59",
   "Marabunta Grande KZ-59",
   "Nightmare KZ-59",
   "Pete's KZ-59",
   "San4San KZ-59"
  ],
  "start": 0,
  "keys": [
   "ArrowDown",
   "ArrowUp",
   "ArrowUp"
  ],
  "activeText": "San4San KZ-59"
 },
 "escape": {
  "id": "F3-25",
  "expanded": "false",
  "value": ""
 },
 "enter": {
  "id": "F3-26",
  "dataUrl": "/gta-6/weapons/comparison/",
  "param": "weapon1",
  "query": "38",
  "url": "/gta-6/weapons/comparison/?weapon1=38&__cf_chl_rt_tk=2dtlcZkiYje53J1EEu1kkzNwCyOcQVpJB1mx3Nju1fw-1795433172-1.0.1.1-DXNnHr1FZqyFIlnw4P7lw4pCokJU_g6XLBBqT2MM1Lk"
 }
};

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const words = (q) => norm(q).split(/\s+/).filter(Boolean);
const matches = (name, q) => words(q).every((w) => norm(name).includes(w));
const sortedAZ = (l) => l.every((x, i) => i === 0 || l[i - 1].toLowerCase() <= x.toLowerCase());

let pass = 0, n = 0;
function check(id, ok, msg) { n++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${msg}`); }

const byId = {};
for (const o of OBS.filter) {
  byId[o.id] = o;
  const snap = SOURCE.filter(([, t]) => matches(t, o.query)).map(([, t]) => t);
  if (o.total !== undefined) {
    const shown = Math.min(o.total, 150);
    check(o.id, o.shown === shown && o.more === `${o.total - 150} more: keep typing` && o.firstActiveClass === 'vc-active' && o.first === snap[0],
      `empty query: ${o.total} items -> ${shown} rows + "${o.total - 150} more: keep typing", first row "${snap[0]}" highlighted; observed ${o.shown} + "${o.more}", "${o.first}" (${o.firstActiveClass})`);
  } else if (o.more !== undefined) {
    check(o.id, snap.length === 0 && o.shown === 0 && o.more === 'No match', `"${o.query}" -> no item -> "No match"; observed ${o.shown} rows, "${o.more}"`);
  } else if (o.list) {
    const allMatch = o.list.every((t) => matches(t, o.query));
    const superset = snap.every((t) => o.list.includes(t));
    check(o.id, allMatch && superset && sortedAZ(o.list) && o.shown === o.list.length && o.shown <= 150,
      `"${o.query}" -> every row contains all words (${allMatch}), all ${snap.length} snapshot matches shown (${superset}), A->Z (${sortedAZ(o.list)}); observed ${o.shown} rows`);
  } else if (o.sameAs) {
    check(o.id, o.shown === byId[o.sameAs].shown, `"${o.query}" (accented) -> same rows as "${byId[o.sameAs].query}" (${byId[o.sameAs].shown}); observed ${o.shown}`);
  }
}
{
  const k = OBS.keys;
  let i = k.start;
  for (const key of k.keys) i = key === 'ArrowDown' ? (i + 1) % k.list.length : (i - 1 + k.list.length) % k.list.length;
  check(k.id, k.list[i] === k.activeText, `${k.keys.join(', ')} from row 1 of ${k.list.length} -> row ${i + 1} "${k.list[i]}"; observed "${k.activeText}"`);
}
{
  const e = OBS.escape;
  check(e.id, e.expanded === 'false' && e.value === '', `Escape -> list closed (aria-expanded false), box restored to the current pick (none = empty); observed ${e.expanded}, "${e.value}"`);
}
{
  const e = OBS.enter;
  const first = SOURCE.find(([, t]) => matches(t, e.query));
  const want = e.dataUrl + (e.dataUrl.includes('?') ? '&' : '?') + e.param + '=' + encodeURIComponent(first[0]);
  const got = e.url.replace(/[?&]__cf_chl_rt_tk=[^&]*/, ''); // token appended by the Cloudflare challenge page
  check(e.id, got === want, `"${e.query}" + Enter -> picks "${first[1]}" -> ${want}; observed ${got}`);
}
console.log(`${pass}/${n} observations reproduced`);
process.exitCode = pass === n ? 0 : 1;
