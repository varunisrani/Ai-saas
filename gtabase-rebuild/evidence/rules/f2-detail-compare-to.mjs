// Rule F2-R3 (detail "Compare To" menu).
// Plain words: vehicle and weapon pages have a "Compare To" button that opens a menu of other items of the
// same list (vehicles: same class) in A->Z name order (case-insensitive); each entry links to the comparison
// page with exactly two parameters <type>1 and <type>2 = this item's alias and the other item's alias, the two
// aliases sorted A->Z (plain string order), so the current item is <type>1 or <type>2 depending on the order.
// Observations: evidence/runs/run-f2-detail.json. Standalone: node f2-detail-compare-to.mjs
const OBS = [
 {
  "id": "F2-13",
  "page": "/gta-6/vehicles/sunset-sanchez",
  "names": [
   "Alvino V1",
   "Aphid",
   "AudaCity Sanchez",
   "Avarus",
   "Azalea Street Blazer",
   "Berserker Sanchez",
   "Blood Fever Sovereign",
   "Boomazoom",
   "Booty FCR 1000",
   "Burnished Alvino",
   "Carbon RS",
   "Chrome Street Blazer",
   "Cliffhanger '72",
   "Crushed Velvet Double-T",
   "Crusher",
   "Cultist Nightblade",
   "Dirt Rocket Zombie Bobber",
   "Dogfight FCR",
   "Donk Boomazoom",
   "Donk Verus",
   "Double-T",
   "DriveShaft Sovereign",
   "Emerald Zombie Bobber",
   "Emilio's Lectro",
   "Enduro '72",
   "Erode",
   "Esskey",
   "Fan-E",
   "FCR 1000",
   "Final Chapter Avarus",
   "Flipside Enduro",
   "Glacier Erode",
   "Hellraiser Avarus",
   "Highwayman Sanchez",
   "Hung Carbon RS",
   "Independence Boomazoom",
   "Jackals Sanchez",
   "KD's SFB 1000",
   "Lectro",
   "Lombike",
   "Lowrider Boomazoom",
   "Magma Cliffhanger",
   "Malibu Zombie Bobber",
   "Manchez",
   "Memorial Sanchez",
   "Midnight Sun Avarus",
   "Midsummer Erode",
   "Monarch Avarus",
   "MyWays Manchez",
   "Nightblade",
   "Nimbe",
   "Nugget Boomazoom",
   "Obsidian Sovereign",
   "Oxygen Zombie Bobber",
   "Pacific Manchez",
   "Peacock Sovereign",
   "Pharaoh Sanchez",
   "Ragno",
   "Royal Sanchez",
   "Sanchez",
   "Sandblasted Cliffhanger",
   "Searing Zombie Bobber",
   "Seashell Boomazoom",
   "SFB 1000",
   "Smokescreen Carbon RS",
   "Sovereign 107",
   "Sovereign 107 Police",
   "Spec Ops Boomazoom",
   "Speedy Boomazoom",
   "Street Blazer",
   "Thicc Esskey",
   "Tormentor Street Blazer",
   "Verus",
   "Yesteryear Boomazoom",
   "Zombie Bobber"
  ],
  "count": "75",
  "hrefs": {
   "attr:compare-to-item-1@href": "/gta-6/vehicles/comparison/?vehicle1=alvino-v1&vehicle2=sunset-sanchez",
   "attr:compare-to-item-last@href": "/gta-6/vehicles/comparison/?vehicle1=sunset-sanchez&vehicle2=zombie-bobber",
   "attr:compare-to-item-nightblade@href": "/gta-6/vehicles/comparison/?vehicle1=sunset-sanchez&vehicle2=western-nightblade",
   "attr:compare-to-item-sanchez@href": "/gta-6/vehicles/comparison/?vehicle1=maibatsu-sanchez&vehicle2=sunset-sanchez"
  }
 },
 {
  "id": "F2-34",
  "page": "/gta-6/weapons/assault-rifle",
  "names": [],
  "count": "24",
  "hrefs": {
   "attr:compare-to-item-1@href": "/gta-6/weapons/comparison/?weapon1=assault-rifle&weapon2=service-carbine"
  }
 }
];
let pass = 0, n = 0;
function check(id, ok, msg) { n++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${msg}`); }
for (const o of OBS) {
  if (o.names.length) {
    const sorted = o.names.every((x, i) => i === 0 || o.names[i - 1].toLowerCase().localeCompare(x.toLowerCase(), 'en') <= 0);
    check(o.id, sorted && String(o.names.length) === o.count, `menu of ${o.count} names in A->Z order (${sorted})`);
  }
  const self = o.page.split('/').pop();
  const type = o.page.includes('/weapons/') ? 'weapon' : 'vehicle';
  for (const [k, href] of Object.entries(o.hrefs)) {
    const u = new URL(href, 'https://x');
    const keys = [...u.searchParams.keys()];
    const a = u.searchParams.get(type + '1'), b = u.searchParams.get(type + '2');
    const ok = u.pathname === `/gta-6/${type}s/comparison/` && keys.length === 2 && a < b && (a === self || b === self);
    check(o.id, ok, `${k.replace('attr:', '').replace('@href', '')}: ${href} -> two ${type} aliases, sorted (${a} < ${b}), one is this page (${self})`);
  }
}
console.log(`${pass}/${n} observations reproduced`);
process.exitCode = pass === n ? 0 : 1;
