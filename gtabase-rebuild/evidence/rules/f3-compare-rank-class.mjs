// Rule F3-R5 (class selection for the rankings).
// Plain words: "Select Class" opens a menu of 21 vehicle classes in A->Z order; each is a plain link to
// /gta-6/vehicles/best-<page slug>/ where page slug = the class name in lower case with spaces as "-", plus
// "-cars" for Muscle, Sports, Sports Classic, Super, plus "-vehicles" for Commercial, Emergency, Industrial,
// Military, Off-Road, Service, Utility, and nothing for the others. The old form
// /gta-6/vehicles/best-vehicles/?class=<class slug> redirects to that page; an unknown ?class renders an empty
// shell (no h1, no rows, title "GTA 6 Best Vehicles List: Ranked By Class"); an unknown best-* path is the 404
// page. Arrow keys do not move inside the menu (its links are not menu items); Tab reaches them.
// Observations: evidence/runs/run-f3-compare.json. Standalone: node f3-compare-rank-class.mjs
const CARS = ['Muscle', 'Sports', 'Sports Classic', 'Super'];
const VEHICLES = ['Commercial', 'Emergency', 'Industrial', 'Military', 'Off-Road', 'Service', 'Utility'];
const page = (label) => `/gta-6/vehicles/best-${label.toLowerCase().replace(/ /g, '-')}${CARS.includes(label) ? '-cars' : VEHICLES.includes(label) ? '-vehicles' : ''}/`;
const MENU = [
 [
  "Boats",
  "/gta-6/vehicles/best-boats/"
 ],
 [
  "Commercial",
  "/gta-6/vehicles/best-commercial-vehicles/"
 ],
 [
  "Compacts",
  "/gta-6/vehicles/best-compacts/"
 ],
 [
  "Coupes",
  "/gta-6/vehicles/best-coupes/"
 ],
 [
  "Cycles",
  "/gta-6/vehicles/best-cycles/"
 ],
 [
  "Emergency",
  "/gta-6/vehicles/best-emergency-vehicles/"
 ],
 [
  "Helicopters",
  "/gta-6/vehicles/best-helicopters/"
 ],
 [
  "Industrial",
  "/gta-6/vehicles/best-industrial-vehicles/"
 ],
 [
  "Military",
  "/gta-6/vehicles/best-military-vehicles/"
 ],
 [
  "Motorcycles",
  "/gta-6/vehicles/best-motorcycles/"
 ],
 [
  "Muscle",
  "/gta-6/vehicles/best-muscle-cars/"
 ],
 [
  "Off-Road",
  "/gta-6/vehicles/best-off-road-vehicles/"
 ],
 [
  "Planes",
  "/gta-6/vehicles/best-planes/"
 ],
 [
  "Sedans",
  "/gta-6/vehicles/best-sedans/"
 ],
 [
  "Service",
  "/gta-6/vehicles/best-service-vehicles/"
 ],
 [
  "Sports",
  "/gta-6/vehicles/best-sports-cars/"
 ],
 [
  "Sports Classic",
  "/gta-6/vehicles/best-sports-classic-cars/"
 ],
 [
  "Super",
  "/gta-6/vehicles/best-super-cars/"
 ],
 [
  "SUVs",
  "/gta-6/vehicles/best-suvs/"
 ],
 [
  "Utility",
  "/gta-6/vehicles/best-utility-vehicles/"
 ],
 [
  "Vans",
  "/gta-6/vehicles/best-vans/"
 ]
];
const NAV = [
 {
  "id": "F3-32",
  "how": "click menu link",
  "label": "Motorcycles",
  "final": "/gta-6/vehicles/best-motorcycles/",
  "h1": "GTA 6 Best Motorcycles List: Stats Ranking"
 },
 {
  "id": "F3-51",
  "how": "Enter on the menu toggle, Tab, Enter",
  "label": "Boats",
  "final": "/gta-6/vehicles/best-boats/",
  "h1": "GTA 6 Best Boats List: Stats Ranking"
 },
 {
  "id": "F3-39",
  "how": "best-vehicles/?class=motorcycles",
  "label": "Motorcycles",
  "final": "/gta-6/vehicles/best-motorcycles/",
  "h1": "GTA 6 Best Motorcycles List: Stats Ranking"
 },
 {
  "id": "F3-45",
  "how": "best-vehicles/?class=sports",
  "label": "Sports",
  "final": "/gta-6/vehicles/best-sports-cars/",
  "h1": "GTA 6 Best Sports Cars List: Stats Ranking"
 },
 {
  "id": "F3-46",
  "how": "best-vehicles/?class=no-such-class",
  "label": null,
  "final": "/gta-6/vehicles/best-vehicles/?class=no-such-class",
  "h1": "<missing>",
  "rows": "0",
  "title": "GTA 6 Best Vehicles List: Ranked By Class"
 },
 {
  "id": "F3-41",
  "how": "/gta-6/vehicles/best-unicorns/",
  "label": null,
  "final": "/gta-6/vehicles/best-unicorns/",
  "h1": "404 Page Not Found"
 }
];
let pass = 0, n = 0;
function check(id, ok, msg) { n++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${msg}`); }
const labels = MENU.map((m) => m[0]);
check('F3-44', labels.length === 21 && labels.every((l, i) => i === 0 || labels[i - 1].toLowerCase() <= l.toLowerCase()), `menu has ${labels.length} classes in A->Z order`);
for (const [label, href] of MENU) check('F3-44', href === page(label), `${label} -> ${page(label)}; observed ${href}`);
for (const o of NAV) {
  if (o.label) check(o.id, o.final === page(o.label) && /^GTA 6 Best .+ List: Stats Ranking$/.test(o.h1), `${o.how} -> ${page(o.label)}; observed ${o.final} ("${o.h1}")`);
  else if (o.how.includes('?class=')) check(o.id, o.final.includes('?class=') && o.h1 === '<missing>' && o.rows === '0' && o.title === 'GTA 6 Best Vehicles List: Ranked By Class', `${o.how} -> stays, empty shell; observed h1 ${o.h1}, ${o.rows} rows, "${o.title}"`);
  else check(o.id, o.h1 === '404 Page Not Found', `${o.how} -> 404 page; observed "${o.h1}"`);
}
console.log(`${pass}/${n} observations reproduced`);
process.exitCode = pass === n ? 0 : 1;
