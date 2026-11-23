// Rule F2-R1 (detail page <title> and h1).
// Plain words: the h1 is the item's display name (vehicles and weapons: manufacturer + model name, e.g.
// "<Make> <Model>"; other types: the name). The document title is "<h1> | GTA 6 <type suffix>":
//   vehicle   -> "<class noun> Stats, Price, How To Get"  (class noun from the vehicle class:
//                Motorcycles -> "Bike", Sports -> "Sports Car", Helicopters -> "Helicopter"; others HYPOTHESIS)
//   weapon    -> "Weapon Stats & How To Get"
//   animal    -> "Animals Guide & Locations"
//   character -> "Characters Guide, Bio & Voice Actor"
//   property  -> "Properties & Garages"
//   radio     -> "Radio Station Songs & Tracklist"
//   mission   -> "Mission Guide & Walkthrough"
// Observations: evidence/runs/run-f2-detail.json (url, type from the path, observed h1 and title; class noun
// = the vehicle class shown in the page's info list). Standalone: node f2-detail-title.mjs
const SUFFIX = { weapon: 'Weapon Stats & How To Get', animal: 'Animals Guide & Locations', character: 'Characters Guide, Bio & Voice Actor',
  property: 'Properties & Garages', radio: 'Radio Station Songs & Tracklist', mission: 'Mission Guide & Walkthrough' };
const NOUN = { Motorcycles: 'Bike', Sports: 'Sports Car', Helicopters: 'Helicopter' };
const OBS = [
 {
  "id": "F2-01",
  "url": "/gta-6/vehicles/sunset-sanchez",
  "type": "vehicle",
  "h1": "Maibatsu Sunset Sanchez",
  "title": "Maibatsu Sunset Sanchez | GTA 6 Bike Stats, Price, How To Get",
  "classNoun": "Motorcycles"
 },
 {
  "id": "F2-30",
  "url": "/vehicles/gta-6/manchez",
  "type": "vehicle",
  "h1": "Maibatsu Manchez",
  "title": "Maibatsu Manchez | GTA 6 Bike Stats, Price, How To Get",
  "classNoun": "Motorcycles"
 },
 {
  "id": "F2-31",
  "url": "/gta-6/vehicles/banshee",
  "type": "vehicle",
  "h1": "Bravado Banshee",
  "title": "Bravado Banshee | GTA 6 Sports Car Stats, Price, How To Get",
  "classNoun": "Sports"
 }
];
let pass = 0;
for (const o of OBS) {
  const suffix = o.type === 'vehicle' ? `${NOUN[o.classNoun]} Stats, Price, How To Get` : SUFFIX[o.type];
  const want = `${o.h1} | GTA 6 ${suffix}`;
  const ok = want === o.title;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${o.type}${o.classNoun ? ' (' + o.classNoun + ')' : ''} -> "${want}"${ok ? '' : ` observed "${o.title}"`}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length ? 0 : 1;
