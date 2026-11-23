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
// Exception: a weapon that is a unique variant of a base weapon (its info list has "Base Model") is titled
//   "<name without the make>: GTA 6 Unique Weapon Location & How To Get" (h1 still "<Make> <name>").
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
  "id": "F2-02",
  "url": "/gta-6/vehicles/sanchez",
  "type": "vehicle",
  "h1": "Maibatsu Sanchez",
  "title": "Maibatsu Sanchez | GTA 6 Bike Stats, Price, How To Get",
  "classNoun": "Motorcycles"
 },
 {
  "id": "F2-03",
  "url": "/gta-6/weapons/assault-rifle",
  "type": "weapon",
  "h1": "Kozlov KZ-59",
  "title": "Kozlov KZ-59 | GTA 6 Weapon Stats & How To Get",
  "classNoun": null
 },
 {
  "id": "F2-04",
  "url": "/gta-6/animals/gray-fox",
  "type": "animal",
  "h1": "Gray Fox",
  "title": "Gray Fox | GTA 6 Animals Guide & Locations",
  "classNoun": null
 },
 {
  "id": "F2-05",
  "url": "/gta-6/characters/jason",
  "type": "character",
  "h1": "Jason Duval",
  "title": "Jason Duval | GTA 6 Characters Guide, Bio & Voice Actor",
  "classNoun": null
 },
 {
  "id": "F2-06",
  "url": "/gta-6/properties/7th-avenue-garage",
  "type": "property",
  "h1": "7th Avenue Garage",
  "title": "7th Avenue Garage | GTA 6 Properties & Garages",
  "classNoun": null
 },
 {
  "id": "F2-07",
  "url": "/gta-6/radio-stations/flash-fm",
  "type": "radio",
  "h1": "Flash FM",
  "title": "Flash FM | GTA 6 Radio Station Songs & Tracklist",
  "classNoun": null
 },
 {
  "id": "F2-08",
  "url": "/gta-6/missions/breakfast-run",
  "type": "mission",
  "h1": "Breakfast Run",
  "title": "Breakfast Run | GTA 6 Mission Guide & Walkthrough",
  "classNoun": null
 },
 {
  "id": "F2-22",
  "url": "/gta-6/vehicles/sunset-sanchez?utm_source=test",
  "type": "vehicle",
  "h1": "Maibatsu Sunset Sanchez",
  "title": "Maibatsu Sunset Sanchez | GTA 6 Bike Stats, Price, How To Get",
  "classNoun": "Motorcycles"
 },
 {
  "id": "F2-25",
  "url": "/gta-6/vehicles/tormentor-street-blazer",
  "type": "vehicle",
  "h1": "Nagasaki Tormentor Street Blazer",
  "title": "Nagasaki Tormentor Street Blazer | GTA 6 Bike Stats, Price, How To Get",
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
 },
 {
  "id": "F2-32",
  "url": "/gta-6/vehicles/maverick",
  "type": "vehicle",
  "h1": "Buckingham Maverick",
  "title": "Buckingham Maverick | GTA 6 Helicopter Stats, Price, How To Get",
  "classNoun": "Helicopters"
 },
 {
  "id": "F2-33",
  "url": "/gta-6/weapons/drug-mule-kz-59",
  "type": "weapon",
  "h1": "Kozlov Drug Mule KZ-59",
  "title": "Drug Mule KZ-59: GTA 6 Unique Weapon Location & How To Get",
  "classNoun": null,
  "uniqueOf": true,
  "make": "Kozlov"
 }
];
let pass = 0;
for (const o of OBS) {
  const suffix = o.type === 'vehicle' ? `${NOUN[o.classNoun]} Stats, Price, How To Get` : SUFFIX[o.type];
  const want = o.uniqueOf ? `${o.h1.replace(o.make + ' ', '')}: GTA 6 Unique Weapon Location & How To Get` : `${o.h1} | GTA 6 ${suffix}`;
  const ok = want === o.title;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${o.id} ${o.type}${o.classNoun ? ' (' + o.classNoun + ')' : ''} -> "${want}"${ok ? '' : ` observed "${o.title}"`}`);
}
console.log(`${pass}/${OBS.length} observations reproduced`);
process.exitCode = pass === OBS.length ? 0 : 1;
