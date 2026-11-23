// Vehicles database (sections 16.2, 16.3): classes, manufacturers, standout sets and 280 vehicles.

import type { Manufacturer, StandoutSet, Vehicle, VehicleClass } from "./types";
import { art, galleryImages, makeRating } from "./media";
import { ADVICE, GAME_LABELS, MOODS, PLACES, SCENES, uniquePersonNames } from "./words";
import {
  Rng,
  clamp,
  groupThousands,
  isoSeconds,
  naturalCompare,
  round1,
  slugify,
  stripAccents,
  withArticle,
} from "./util";

// ---------------------------------------------------------------- classes (R-1603, R-603, R-716)

type PluralSuffix = "cars" | "vehicles" | null;

const CLASS_DEFS: [id: string, label: string, noun: string, suffix: PluralSuffix][] = [
  ["super", "Super", "Super Car", "cars"],
  ["sports", "Sports", "Sports Car", "cars"],
  ["motorcycles", "Motorcycles", "Bike", null],
  ["planes", "Planes", "Plane", null],
  ["helicopters", "Helicopters", "Helicopter", null],
  ["boats", "Boats", "Boat", null],
  ["muscle", "Muscle", "Muscle Car", "cars"],
  ["off-road", "Off-Road", "Off-Road Vehicle", "vehicles"],
  ["cycles", "Cycles", "Bicycle", null],
  ["commercial", "Commercial", "Commercial Vehicle", "vehicles"],
  ["compacts", "Compacts", "Compact Car", null],
  ["coupes", "Coupes", "Coupe", null],
  ["emergency", "Emergency", "Emergency Vehicle", "vehicles"],
  ["industrial", "Industrial", "Industrial Vehicle", "vehicles"],
  ["military", "Military", "Military Vehicle", "vehicles"],
  ["sedans", "Sedans", "Sedan", null],
  ["service", "Service", "Service Vehicle", "vehicles"],
  ["sports-classic", "Sports Classic", "Sports Classic Car", "cars"],
  ["suvs", "SUVs", "SUV", null],
  ["utility", "Utility", "Utility Vehicle", "vehicles"],
  ["vans", "Vans", "Van", null],
];

export const vehicleClasses: VehicleClass[] = CLASS_DEFS.map(([id, label, noun, suffix], i) => {
  const base = label.toLowerCase().replace(/\s+/g, "-");
  const pageSlug = suffix ? `${base}-${suffix}` : base;
  const pluralLabel = suffix === "cars" ? `${label} Cars` : suffix === "vehicles" ? `${label} Vehicles` : label;
  return {
    id,
    label,
    tileOrder: i + 1,
    titleNoun: noun,
    pageSlug,
    pluralLabel,
    rankingPath: `/gta-6/vehicles/best-${pageSlug}/`,
  };
});

// ---------------------------------------------------------------- manufacturers (R-1604, R-1605)

/** The nine fixture makes plus 31 own invented makes. */
const VEHICLE_MAKE_LABELS: readonly string[] = [
  "Maibatsu", "Western", "Bravado", "Buckingham", "Principe", "Nagasaki", "Progen", "Truffade", "Übermacht",
  "Castavia", "Dunmere", "Ferrowind", "Galvecci", "Harbourne", "Isolde Motors", "Juniper Works", "Kestrava",
  "Lumaro", "Marisco", "Novarra", "Ostrela", "Palmetto Motor Co.", "Quillon", "Rivage", "Saltmarsh", "Tidewell",
  "Ulvane", "Velasca", "Wavecrest", "Xantira", "Yarrow & Finch", "Zephiro", "Ambermoor", "Baysora", "Cindral",
  "Dorvane", "Estuara", "Fendrel", "Glasswing", "Heliora",
];

/** Kozlov plus own invented weapon makes. */
export const WEAPON_MAKE_LABELS: readonly string[] = [
  "Kozlov", "Brightwater Arms", "Corvane Defense", "Halberd & Rook", "Ironquay", "Lagoon Armory",
  "Mangrove Tactical", "Pelican Ordnance", "Redsand Arms", "Saltglass", "Keyline Forge", "Vantor Arms",
];

function monogram(label: string): string {
  const words = label.split(/\s+/).filter((w) => /^[\p{L}]/u.test(w));
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function makeManufacturer(label: string, domain: "vehicle" | "weapon"): Manufacturer {
  const id = slugify(label);
  return { id, label, domain, monogram: monogram(label), logo: art("logo", id) };
}

export const manufacturers: Manufacturer[] = [
  ...VEHICLE_MAKE_LABELS.map((l) => makeManufacturer(l, "vehicle")).sort((a, b) => naturalCompare(a.label, b.label)),
  ...WEAPON_MAKE_LABELS.map((l) => makeManufacturer(l, "weapon")).sort((a, b) => naturalCompare(a.label, b.label)),
];

const makeById = new Map(manufacturers.map((m) => [m.id, m]));

export function makeLabel(id: string): string {
  return makeById.get(id)?.label ?? id;
}

// ---------------------------------------------------------------- standout sets (R-1604)

const SET_LABELS: readonly string[] = [
  "All-Terrain", "Neon Nights", "Sunset Strip", "Swamp Runner", "Mudder", "Beach Bum", "Gator Country",
  "High Roller", "Storm Chaser", "Street King", "Coastline", "Track Day", "Heritage", "Lowrider", "Desert Rally",
  "Harbor Patrol", "Palm Cruise", "Retro Wave", "Showroom", "Workhorse", "Night Shift", "Island Hopper",
  "Hurricane Season", "Glitter Coast", "Backroads",
];

export const standoutSets: StandoutSet[] = SET_LABELS.map((label, i) => ({ id: slugify(label), label, order: i + 1 }));

// ---------------------------------------------------------------- generation plan

/** [regular, standout] per primary class; totals 170 + 110 = 280 (R-1604). */
const CLASS_PLAN: Record<string, [number, number]> = {
  super: [13, 11],
  sports: [14, 12],
  motorcycles: [20, 16],
  planes: [10, 2],
  helicopters: [8, 2],
  boats: [11, 3],
  muscle: [7, 9],
  "off-road": [6, 8],
  cycles: [6, 0],
  commercial: [6, 2],
  compacts: [6, 4],
  coupes: [7, 5],
  emergency: [7, 3],
  industrial: [6, 2],
  military: [6, 2],
  sedans: [9, 9],
  service: [6, 2],
  "sports-classic": [6, 4],
  suvs: [6, 8],
  utility: [6, 2],
  vans: [4, 4],
};

const AIR_OR_SEA = new Set(["planes", "helicopters", "boats"]);
const UNRATED_CLASSES = new Set(["boats", "helicopters", "planes"]);

/** Generated names of a class must sort after its fixture "first in catalogue order" item (16.2). */
const CLASS_NAME_FLOOR: Record<string, string> = { boats: "Seashark", planes: "Dodo", helicopters: "Maverick" };

const STYLES: Record<string, readonly string[]> = {
  super: ["Hypercar", "Supercar", "Track Special"],
  sports: ["Sports Car", "Grand Tourer", "Roadster", "Hot Hatch"],
  motorcycles: ["Dirt Bike", "Sport Bike", "Cruiser", "Chopper", "Scooter"],
  planes: ["Light Aircraft", "Jet", "Seaplane", "Cargo Plane"],
  helicopters: ["Light Helicopter", "Utility Helicopter", "Gunship"],
  boats: ["Speedboat", "Personal Watercraft", "Fishing Boat", "Yacht", "Airboat"],
  muscle: ["Muscle Car", "Pony Car", "Lowrider"],
  "off-road": ["Buggy", "Rock Crawler", "Trophy Truck", "ATV"],
  cycles: ["BMX", "Road Bike", "Mountain Bike"],
  commercial: ["Box Truck", "Semi Truck", "Delivery Van"],
  compacts: ["Hatchback", "City Car", "Microcar"],
  coupes: ["Coupe", "Personal Luxury Coupe"],
  emergency: ["Police Cruiser", "Ambulance", "Fire Truck", "Rescue"],
  industrial: ["Dump Truck", "Forklift", "Mixer"],
  military: ["Armored Car", "Transport", "Tracked"],
  sedans: ["Sedan", "Executive Sedan", "Taxi"],
  service: ["Bus", "Garbage Truck", "Tow Truck"],
  "sports-classic": ["Classic Roadster", "Classic Coupe", "Gran Turismo"],
  suvs: ["SUV", "Crossover", "Luxury SUV"],
  utility: ["Pickup", "Tractor", "Utility Truck"],
  vans: ["Panel Van", "Camper", "Minivan"],
};

const SEATS: Record<string, [number, number]> = {
  super: [2, 2], sports: [2, 4], motorcycles: [1, 2], planes: [1, 8], helicopters: [2, 8], boats: [1, 8],
  muscle: [2, 4], "off-road": [1, 4], cycles: [1, 1], commercial: [2, 3], compacts: [2, 4], coupes: [2, 4],
  emergency: [2, 6], industrial: [1, 2], military: [2, 8], sedans: [4, 4], service: [2, 8],
  "sports-classic": [2, 2], suvs: [4, 6], utility: [1, 2], vans: [2, 8],
};

const MASS_KG: Record<string, [number, number]> = {
  super: [1250, 1700], sports: [1150, 1750], motorcycles: [95, 260], planes: [900, 42000], helicopters: [1400, 9000],
  boats: [350, 24000], muscle: [1450, 1900], "off-road": [400, 3200], cycles: [9, 16], commercial: [5200, 14000],
  compacts: [850, 1250], coupes: [1300, 1800], emergency: [1800, 9500], industrial: [3000, 18000],
  military: [4200, 22000], sedans: [1350, 2100], service: [6000, 15000], "sports-classic": [1050, 1500],
  suvs: [1900, 2800], utility: [1700, 6500], vans: [1800, 3200],
};

interface StatRange {
  speed: [number, number];
  accel: [number, number];
  asphalt: [number, number];
  offroad: [number, number];
  strength: [number, number];
  road?: [number, number];
  offroadRating?: [number, number];
}

const STATS: Record<string, StatRange> = {
  super: { speed: [8.1, 9.0], accel: [8.2, 9.6], asphalt: [8.0, 9.5], offroad: [1.5, 3.5], strength: [3.0, 5.5], road: [780, 960], offroadRating: [120, 380] },
  sports: { speed: [7.4, 8.9], accel: [7.2, 9.0], asphalt: [7.4, 9.2], offroad: [2.0, 4.0], strength: [3.5, 6.0], road: [700, 950], offroadRating: [150, 420] },
  motorcycles: { speed: [6.8, 9.0], accel: [7.5, 9.5], asphalt: [6.0, 8.8], offroad: [3.0, 8.5], strength: [1.5, 4.0], road: [600, 950], offroadRating: [300, 820] },
  planes: { speed: [8.0, 9.0], accel: [5.0, 8.0], asphalt: [3.0, 6.0], offroad: [0.5, 2.0], strength: [3.0, 8.0] },
  helicopters: { speed: [6.4, 8.6], accel: [5.0, 8.0], asphalt: [4.0, 7.0], offroad: [0.5, 2.0], strength: [3.0, 7.5] },
  boats: { speed: [5.5, 8.2], accel: [4.5, 8.5], asphalt: [3.0, 7.0], offroad: [0.5, 2.0], strength: [2.5, 7.0] },
  muscle: { speed: [7.2, 8.6], accel: [6.8, 8.8], asphalt: [5.5, 7.6], offroad: [2.5, 4.5], strength: [5.0, 7.5], road: [600, 860], offroadRating: [200, 450] },
  "off-road": { speed: [6.0, 8.0], accel: [5.5, 8.0], asphalt: [4.0, 6.5], offroad: [7.0, 9.6], strength: [5.5, 8.5], road: [380, 700], offroadRating: [700, 960] },
  cycles: { speed: [2.0, 4.0], accel: [2.5, 4.5], asphalt: [4.0, 7.0], offroad: [2.0, 7.0], strength: [0.5, 2.0], road: [150, 350], offroadRating: [120, 520] },
  commercial: { speed: [4.0, 6.0], accel: [2.5, 4.5], asphalt: [3.0, 5.0], offroad: [2.0, 4.5], strength: [7.0, 9.5], road: [250, 450], offroadRating: [200, 420] },
  compacts: { speed: [5.5, 7.2], accel: [5.0, 7.0], asphalt: [5.5, 7.5], offroad: [2.0, 4.0], strength: [3.0, 5.0], road: [450, 650], offroadRating: [150, 380] },
  coupes: { speed: [7.0, 8.4], accel: [6.5, 8.2], asphalt: [6.5, 8.2], offroad: [2.0, 4.0], strength: [4.0, 6.0], road: [600, 820], offroadRating: [150, 400] },
  emergency: { speed: [6.8, 8.6], accel: [6.0, 8.2], asphalt: [5.5, 7.8], offroad: [3.0, 6.0], strength: [5.5, 8.5], road: [550, 800], offroadRating: [250, 600] },
  industrial: { speed: [3.0, 5.5], accel: [2.0, 4.0], asphalt: [2.5, 4.5], offroad: [3.0, 6.0], strength: [8.0, 9.8], road: [200, 400], offroadRating: [300, 600] },
  military: { speed: [5.0, 7.5], accel: [3.5, 6.5], asphalt: [3.5, 6.0], offroad: [6.0, 9.0], strength: [8.5, 10.0], road: [350, 650], offroadRating: [600, 920] },
  sedans: { speed: [6.2, 8.0], accel: [5.5, 7.8], asphalt: [6.0, 7.8], offroad: [2.0, 4.0], strength: [4.0, 6.0], road: [500, 750], offroadRating: [150, 400] },
  service: { speed: [4.5, 6.5], accel: [2.5, 4.5], asphalt: [3.5, 5.5], offroad: [2.0, 4.0], strength: [7.0, 9.0], road: [300, 500], offroadRating: [200, 420] },
  "sports-classic": { speed: [6.8, 8.5], accel: [6.0, 8.0], asphalt: [6.5, 8.4], offroad: [1.5, 3.5], strength: [3.5, 5.5], road: [600, 850], offroadRating: [120, 360] },
  suvs: { speed: [6.0, 7.8], accel: [5.0, 7.0], asphalt: [5.0, 7.0], offroad: [6.0, 8.5], strength: [6.0, 8.0], road: [480, 700], offroadRating: [550, 820] },
  utility: { speed: [4.0, 6.2], accel: [3.0, 5.0], asphalt: [3.5, 5.5], offroad: [5.0, 8.0], strength: [6.5, 9.0], road: [300, 500], offroadRating: [450, 760] },
  vans: { speed: [5.0, 7.0], accel: [3.5, 5.5], asphalt: [4.0, 6.0], offroad: [2.5, 4.5], strength: [5.5, 7.5], road: [350, 560], offroadRating: [220, 460] },
};

const ERAS: readonly string[] = ["Modern", "Classic", "Retro", "Vintage", "Contemporary"];
const SPECIALISTS: readonly string[] = ["Off-Road", "Drift", "Stunt", "Racing", "Cargo", "Pursuit", "Cruising", "Touring"];
const GEARBOX: readonly string[] = ["Manual", "Automatic", "Sequential"];

/** Heads and tails of invented compound model names. */
const NAME_HEADS: readonly string[] = [
  "Salt", "Reed", "Marsh", "Tide", "Gulf", "Coral", "Dune", "Glass", "Key", "Palm", "Heron", "Sabal", "Moss",
  "Brine", "Shell", "Drift", "Cypress", "Sun", "Lime", "Ember", "Flint", "Cinder", "Haze", "Quartz", "Ivory",
  "Opal", "Cobalt", "Amber", "Anvil", "Breeze", "Cane", "Egret", "Fable", "Gale", "Harbor", "Inlet", "Jetty",
  "Lagoon", "Mullet", "Orchid", "Prism", "Quill", "Rook", "Sable", "Tarpon", "Umber", "Vesper", "Wren",
  "Yarrow", "Zinnia", "Basalt", "Talon", "Shoal", "Spindle", "Teal", "Thistle", "Torch", "Velvet", "Whelk",
];
const NAME_TAILS: readonly string[] = [
  "strider", "fin", "claw", "spur", "crest", "vale", "mark", "stride", "glide", "shade", "forge", "wake", "line",
  "jaw", "horn", "back", "tail", "drifter", "skipper", "dash", "bolt", "fang", "bloom", "sprint", "keel", "ridge",
];
const CAR_SUFFIXES: readonly string[] = ["XR", "Sport", "LX", "Turbo", "Cabrio", "Coupe", "GTS", "S"];
const CAR_SUFFIX_CLASSES = new Set(["super", "sports", "muscle", "coupes", "sedans", "sports-classic", "compacts", "suvs"]);

/** Own prefixes for standout variants ("<prefix> <base name>"). */
const STANDOUT_PREFIXES: readonly string[] = [
  "Toucan", "Pelican", "Midnight Angler", "Coral Reef", "Neon Drift", "Saltwater", "Glass Lagoon",
  "Hurricane Party", "Palm Shadow", "Gold Coast", "Lightning Bug", "Night Heron", "Sun Daze", "Velvet Dusk",
  "Bayou Ghost", "Sand Dollar", "Key Lime", "Mango Tango", "Rip Current", "Storm Surge", "Thunder Egg",
  "Cotton Candy", "Flamingo Pink", "Gator Tail", "Moon Jelly", "Pastel Riot", "Dockside", "Driftwood",
  "Sawgrass", "Orange Grove", "Blue Hour", "Static Shock", "Jungle Juice", "Back Alley", "High Tide", "Low Tide",
  "Sea Glass", "Wild Card", "Boardwalk", "Turnpike", "Overtime", "Afterglow", "Firefly", "Banyan", "Mangrove",
];

/** Own invented "real-life" model names (Based on (Real Life)); exactly one contains "Huracán" (16.2). */
const RL_MAKERS: readonly string[] = [
  "Arvane", "Brucker", "Castellane", "Dovano", "Eskel", "Fallowmere", "Grenadi", "Horvane", "Juvessa", "Kelvane",
  "Lorendt", "Mavrel", "Norvik", "Ossandra", "Pellucid", "Quarrant", "Rovane", "Sarvello", "Tessaline", "Ulmark",
  "Vintrel", "Wexmoor", "Yselde", "Zanobi",
];
const RL_MODELS: readonly string[] = [
  "Siora", "Veltan", "Corvane", "Tessaro", "Amaline", "Durello", "Fiorvane", "Galessa", "Lunaro", "Novessa",
  "Pallado", "Rimesse", "Solvane", "Tirolo", "Ulvessa", "Varenne", "Zelora", "Brisando", "Calvetta", "Delmora",
];
const HURACAN_REAL_LIFE = "Castellane Huracán";

// ---------------------------------------------------------------- fixtures (16.2)

interface RegularFixture {
  slug: string;
  name: string;
  cls: string;
  make?: string;
  compareKey?: string;
  legacyPath?: boolean;
  realLife: "yes" | "no" | "any";
}

const REGULAR_FIXTURES: RegularFixture[] = [
  { slug: "thrax", name: "Thrax", cls: "super", make: "truffade", realLife: "any" },
  { slug: "emerus", name: "Emerus", cls: "super", make: "progen", compareKey: "progen-emerus", legacyPath: true, realLife: "any" },
  { slug: "dantes-vitello", name: "Dantes Vitello", cls: "super", realLife: "no" },
  { slug: "sanchez", name: "Sanchez", cls: "motorcycles", make: "maibatsu", compareKey: "maibatsu-sanchez", realLife: "yes" },
  { slug: "nightblade", name: "Nightblade", cls: "motorcycles", make: "western", compareKey: "western-nightblade", realLife: "any" },
  { slug: "manchez", name: "Manchez", cls: "motorcycles", make: "maibatsu", compareKey: "maibatsu-manchez", legacyPath: true, realLife: "any" },
  { slug: "burnished-alvino", name: "Burnished Alvino", cls: "motorcycles", make: "principe", realLife: "no" },
  { slug: "banshee", name: "Banshee", cls: "sports", make: "bravado", realLife: "any" },
  { slug: "comet-s2-cabrio", name: "Comet S2 Cabrio", cls: "sports", realLife: "yes" },
  { slug: "maverick", name: "Maverick", cls: "helicopters", make: "buckingham", realLife: "yes" },
  { slug: "seashark", name: "Seashark", cls: "boats", realLife: "yes" },
  { slug: "dodo", name: "Dodo", cls: "planes", realLife: "yes" },
];

interface StandoutFixture {
  slug: string;
  name: string;
  /** Base vehicle slug, or "nagasaki-1"/"nagasaki-2" = the first/second generated Nagasaki motorcycle. */
  base: string;
  set?: string;
  speed?: number;
}

const STANDOUT_FIXTURES: StandoutFixture[] = [
  { slug: "andrew-nodes-thrax", name: "Andrew Node's Thrax", base: "thrax", speed: 9.2 },
  { slug: "seaspray-emerus", name: "Seaspray Emerus", base: "emerus", speed: 9.1 },
  { slug: "honeycomb-emerus", name: "Honeycomb Emerus", base: "emerus", speed: 9.1 },
  { slug: "black-widow-emerus", name: "Black Widow Emerus", base: "emerus", speed: 9.1 },
  { slug: "gold-coast-emerus", name: "Gold Coast Emerus", base: "emerus" },
  { slug: "sunset-sanchez", name: "Sunset Sanchez", base: "sanchez", set: "mudder" },
  { slug: "sawgrass-sanchez", name: "Sawgrass Sanchez", base: "sanchez" },
  { slug: "mud-crasher-rancher", name: "Mud Crasher Rancher", base: "nagasaki-1", set: "mudder" },
  { slug: "tormentor-street-blazer", name: "Tormentor Street Blazer", base: "nagasaki-2", set: "mudder" },
  { slug: "storm-surge-maverick", name: "Storm Surge Maverick", base: "maverick" },
];

/** Vehicles whose values the fixture table pins; never picked for random gaps (missing stats etc.). */
const FIXTURE_SLUGS = new Set<string>([
  ...REGULAR_FIXTURES.map((f) => f.slug),
  ...STANDOUT_FIXTURES.map((f) => f.slug),
]);

/** Twelve vehicles get a second class (R-1604). */
const SECOND_CLASS_PLAN: [primary: string, second: string][] = [
  ["helicopters", "emergency"], ["helicopters", "emergency"], ["boats", "military"], ["off-road", "military"],
  ["off-road", "military"], ["vans", "service"], ["vans", "service"], ["commercial", "industrial"],
  ["suvs", "emergency"], ["sedans", "emergency"], ["muscle", "sports-classic"], ["utility", "service"],
];

/** Highest road rating per ranking fixture (16.2); everything else in those classes stays ≤ RANKING_CAP. */
const TOP_ROAD: Record<string, number> = { "dantes-vitello": 990, "comet-s2-cabrio": 985, "burnished-alvino": 980 };
const RANKING_CAP = 960;
const SPEED_CAP = 9.0;

// ---------------------------------------------------------------- text

const SHOPS_ROAD: readonly string[] = ["Leonida Wheels Online", "Dockside Auto Auction", "Pastel Plates", "Sunbelt Motors app"];
const SHOP_AIR = "Skyward Aviation Broker";
const SHOP_SEA = "Gulfside Marine Exchange";

function vehicleDescription(rng: Rng, v: { name: string; makeLabel: string; style?: string; cls: string }): string {
  const style = (v.style ?? "vehicle").toLowerCase();
  const mood = rng.pick(MOODS);
  const scene = rng.pick(SCENES);
  const t = rng.int(0, 2);
  if (t === 0) {
    return `The ${v.makeLabel} ${v.name} is ${withArticle(style)} that feels ${mood}. You will spot it most often on ${scene}. ${rng.pick(ADVICE)}`;
  }
  if (t === 1) {
    return `Think of the ${v.name} as ${v.makeLabel}'s answer to life on the island: ${withArticle(style)}, ${mood}, and right at home on ${scene}. ${rng.pick(ADVICE)}`;
  }
  return `${v.makeLabel} pitched the ${v.name} at drivers who want ${withArticle(style)} that is ${mood}. Take it out on ${scene} to see what it can do. ${rng.pick(ADVICE)}`;
}

function standoutDescription(rng: Rng, name: string, baseName: string, makeLabel: string, setLabel: string): string {
  return `${name} is a one-off take on the ${makeLabel} ${baseName} and part of the ${setLabel} standout set. It keeps the base model's bones but wears its own paint, trim and attitude, so expect a few heads to turn on ${rng.pick(SCENES)}.`;
}

function howToGetText(rng: Rng, cls: string): string {
  if (cls === "planes" || cls === "helicopters") {
    return `Buy it from the ${SHOP_AIR} website and have it delivered to a hangar or helipad you own.`;
  }
  if (cls === "boats") {
    return `Buy it from the ${SHOP_SEA} and collect it at any marina slip you own.`;
  }
  if (rng.chance(0.35)) {
    return `It turns up parked near ${rng.pick(PLACES)} on most mornings; take it and store it in one of your garages.`;
  }
  return `Buy it from ${rng.pick(SHOPS_ROAD)} on the in-game phone and pick it up at your garage.`;
}

// ---------------------------------------------------------------- generator

interface Draft {
  slug: string;
  name: string;
  cls: string;
  make: string;
  regular: boolean;
  baseSlug?: string;
  set?: string;
  fixtureRealLife?: "yes" | "no" | "any";
  compareKey?: string;
  legacyPath?: boolean;
  pinnedSpeed?: number;
}

function pickAppearances(rng: Rng, count: number): string[] {
  const picked = new Set(rng.sample(GAME_LABELS, count));
  return GAME_LABELS.filter((g) => picked.has(g));
}

function compoundName(rng: Rng, cls: string): string {
  let name = rng.pick(NAME_HEADS) + rng.pick(NAME_TAILS);
  if (CAR_SUFFIX_CLASSES.has(cls) && rng.chance(0.18)) name += ` ${rng.pick(CAR_SUFFIXES)}`;
  return name;
}

export function buildVehicles(): Vehicle[] {
  const rng = new Rng("vehicles");
  const takenNames = new Set<string>();
  const takenSlugs = new Set<string>();
  const reserve = (name: string, slug: string) => {
    takenNames.add(stripAccents(name).toLowerCase());
    takenSlugs.add(slug);
  };
  for (const f of REGULAR_FIXTURES) reserve(f.name, f.slug);
  for (const f of STANDOUT_FIXTURES) reserve(f.name, f.slug);

  const vehicleMakeIds = manufacturers.filter((m) => m.domain === "vehicle").map((m) => m.id);
  const makeQueue = rng.shuffle(vehicleMakeIds);
  let makeCursor = 0;
  const nextMake = () => makeQueue[makeCursor++ % makeQueue.length];

  // 1. regular vehicles per class
  const regulars: Draft[] = [];
  let nagasakiBikes = 0;
  for (const cls of Object.keys(CLASS_PLAN)) {
    const [regularCount] = CLASS_PLAN[cls];
    const fixtures = REGULAR_FIXTURES.filter((f) => f.cls === cls);
    for (const f of fixtures) {
      regulars.push({
        slug: f.slug,
        name: f.name,
        cls,
        make: f.make ?? nextMake(),
        regular: true,
        fixtureRealLife: f.realLife,
        compareKey: f.compareKey,
        legacyPath: f.legacyPath,
      });
    }
    const floor = CLASS_NAME_FLOOR[cls];
    for (let i = fixtures.length; i < regularCount; i++) {
      let name = "";
      let slug = "";
      for (let guard = 0; guard < 500; guard++) {
        name = compoundName(rng, cls);
        slug = slugify(name);
        if (takenNames.has(name.toLowerCase()) || takenSlugs.has(slug)) continue;
        if (floor && naturalCompare(name, floor) <= 0) continue;
        break;
      }
      reserve(name, slug);
      let make: string;
      // The two Nagasaki standout fixtures need Nagasaki motorcycles as their base models.
      if (cls === "motorcycles" && nagasakiBikes < 2) {
        make = "nagasaki";
        nagasakiBikes++;
      } else {
        make = nextMake();
      }
      regulars.push({ slug, name, cls, make, regular: true, fixtureRealLife: "any" });
    }
  }
  const nagasakiBases = regulars.filter((d) => d.cls === "motorcycles" && d.make === "nagasaki" && !FIXTURE_SLUGS.has(d.slug));
  const regularBySlug = new Map(regulars.map((d) => [d.slug, d]));

  // 2. standout vehicles per class
  const standouts: Draft[] = [];
  for (const f of STANDOUT_FIXTURES) {
    const baseSlug = f.base === "nagasaki-1" ? nagasakiBases[0].slug : f.base === "nagasaki-2" ? nagasakiBases[1].slug : f.base;
    const base = regularBySlug.get(baseSlug);
    if (!base) throw new Error(`standout fixture ${f.slug}: unknown base ${baseSlug}`);
    standouts.push({
      slug: f.slug,
      name: f.name,
      cls: base.cls,
      make: base.make,
      regular: false,
      baseSlug,
      set: f.set,
      pinnedSpeed: f.speed,
    });
  }
  for (const cls of Object.keys(CLASS_PLAN)) {
    const [, standoutCount] = CLASS_PLAN[cls];
    const have = standouts.filter((s) => s.cls === cls).length;
    const bases = regulars.filter((r) => r.cls === cls && r.slug !== "burnished-alvino" && r.slug !== "dantes-vitello");
    for (let i = have; i < standoutCount; i++) {
      let name = "";
      let slug = "";
      let base = bases[0];
      for (let guard = 0; guard < 500; guard++) {
        base = rng.pick(bases);
        name = `${rng.pick(STANDOUT_PREFIXES)} ${base.name}`;
        slug = slugify(name);
        if (!takenNames.has(name.toLowerCase()) && !takenSlugs.has(slug)) break;
      }
      reserve(name, slug);
      standouts.push({ slug, name, cls, make: base.make, regular: false, baseSlug: base.slug });
    }
  }

  // 3. standout sets: every set used, All-Terrain at least twice, fixtures pinned
  const setQueue = rng.shuffle(standoutSets.map((s) => s.id));
  const freeStandouts = standouts.filter((s) => !s.set);
  const forcedOrder = ["all-terrain", "all-terrain", ...setQueue];
  freeStandouts.forEach((s, i) => {
    s.set = i < forcedOrder.length ? forcedOrder[i] : rng.pick(setQueue);
  });

  // 4. attributes
  const drafts = [...regulars, ...standouts];
  const vehicles = new Map<string, Vehicle>();
  const dateRng = new Rng("vehicles:added");
  const addedBase = Date.UTC(2026, 0, 5, 9, 0, 0);
  const ownerNames = uniquePersonNames(new Rng("vehicles:owners"), 60);

  for (const d of regulars) {
    const st = STATS[d.cls];
    const style = rng.pick(STYLES[d.cls]);
    const land = !AIR_OR_SEA.has(d.cls);
    const [smin, smax] = SEATS[d.cls];
    const [mmin, mmax] = MASS_KG[d.cls];
    const massKg = Math.round((mmin + rng.next() * (mmax - mmin)) / 5) * 5;
    const driveTrain = land
      ? d.cls === "motorcycles" || d.cls === "cycles"
        ? rng.pick(["Chain Drive", "Belt Drive", "Shaft Drive"])
        : rng.pick(["RWD", "AWD", "FWD", "4WD"])
      : undefined;
    const ml = makeLabel(d.make);
    const v: Vehicle = {
      slug: d.slug,
      compareKey: d.compareKey ?? d.slug,
      canonicalPath: d.legacyPath ? `/vehicles/gta-6/${d.slug}` : `/gta-6/vehicles/${d.slug}`,
      position: 0,
      name: d.name,
      make: d.make,
      classes: [d.cls],
      speed: rng.dec1(st.speed[0], st.speed[1]),
      acceleration: rng.dec1(st.accel[0], st.accel[1]),
      asphaltHandling: rng.dec1(st.asphalt[0], st.asphalt[1]),
      offroadHandling: rng.dec1(st.offroad[0], st.offroad[1]),
      strength: rng.dec1(st.strength[0], st.strength[1]),
      roadRating: st.road ? rng.int(st.road[0], st.road[1]) : undefined,
      offroadRating: st.offroadRating ? rng.int(st.offroadRating[0], st.offroadRating[1]) : undefined,
      seats: rng.int(smin, smax),
      style,
      era: rng.pick(ERAS),
      specialist: rng.chance(0.5) ? rng.pick(SPECIALISTS) : undefined,
      mass: rng.chance(0.8) ? `${groupThousands(massKg)} kg` : undefined,
      driveTrain: land && rng.chance(0.9) ? driveTrain : undefined,
      gears:
        land && d.cls !== "cycles" && rng.chance(0.7)
          ? `${rng.int(4, 8)}-Speed ${rng.pick(GEARBOX)}`
          : undefined,
      editions: [],
      notableOwners: rng.chance(0.25) ? rng.sample(ownerNames, rng.int(1, 2)) : [],
      appearances: rng.chance(0.6) ? pickAppearances(rng, rng.int(1, 3)) : [],
      howToGet: howToGetText(rng, d.cls),
      description: vehicleDescription(rng, { name: d.name, makeLabel: ml, style, cls: d.cls }),
      image: art("vehicle", d.slug),
      gallery: null,
      rating: makeRating(rng),
      variants: [],
      addedAt: isoSeconds(addedBase + dateRng.int(0, 320) * 86400000 + dateRng.int(0, 86399) * 1000),
    };
    const galleryCount = rng.chance(0.25) ? 0 : rng.int(1, 12);
    v.gallery = galleryImages({ prefix: d.slug, count: galleryCount, subject: `${ml} ${d.name}`, noun: "screenshot", rng });
    vehicles.set(d.slug, v);
  }

  for (const d of standouts) {
    const base = vehicles.get(d.baseSlug as string) as Vehicle;
    const tweak = (value: number | undefined, spread: number, max: number) =>
      value === undefined ? undefined : round1(clamp(value + (rng.next() * 2 - 1) * spread, 0, max));
    const set = standoutSets.find((s) => s.id === d.set) as StandoutSet;
    const v: Vehicle = {
      slug: d.slug,
      compareKey: d.slug,
      canonicalPath: `/gta-6/vehicles/${d.slug}`,
      position: 0,
      name: d.name,
      make: d.make,
      classes: [d.cls],
      standoutSet: set.id,
      baseModel: base.slug,
      speed: tweak(base.speed, 0.4, SPEED_CAP),
      acceleration: tweak(base.acceleration, 0.5, 10),
      asphaltHandling: tweak(base.asphaltHandling, 0.5, 10),
      offroadHandling: tweak(base.offroadHandling, 0.8, 10),
      strength: tweak(base.strength, 0.5, 10),
      roadRating: base.roadRating === undefined ? undefined : clamp(base.roadRating + rng.int(-40, 40), 0, 1000),
      offroadRating: base.offroadRating === undefined ? undefined : clamp(base.offroadRating + rng.int(-60, 60), 0, 1000),
      seats: base.seats,
      style: base.style,
      era: base.era,
      driveTrain: base.driveTrain ?? (AIR_OR_SEA.has(d.cls) ? undefined : "RWD"),
      editions: [],
      notableOwners: [],
      appearances: [],
      description: standoutDescription(rng, d.name, base.name, makeLabel(d.make), set.label),
      image: art("vehicle", d.slug),
      gallery: null,
      rating: makeRating(rng),
      variants: [],
      addedAt: isoSeconds(addedBase + dateRng.int(30, 320) * 86400000 + dateRng.int(0, 86399) * 1000),
    };
    if (d.pinnedSpeed !== undefined) v.speed = d.pinnedSpeed;
    vehicles.set(d.slug, v);
  }

  const all = [...vehicles.values()];
  const nonFixture = (v: Vehicle) => !FIXTURE_SLUGS.has(v.slug);
  const isRegular = (v: Vehicle) => v.standoutSet === undefined;

  // 5. caps and fixture pins
  for (const v of all) {
    if (v.speed !== undefined && !STANDOUT_FIXTURES.some((f) => f.slug === v.slug && f.speed !== undefined)) {
      v.speed = Math.min(v.speed, SPEED_CAP);
    }
    if (UNRATED_CLASSES.has(v.classes[0])) {
      v.roadRating = undefined;
      v.offroadRating = undefined;
    }
    if (["super", "sports", "motorcycles"].includes(v.classes[0]) && v.roadRating !== undefined) {
      v.roadRating = Math.min(v.roadRating, RANKING_CAP);
    }
  }
  for (const [slug, road] of Object.entries(TOP_ROAD)) (vehicles.get(slug) as Vehicle).roadRating = road;

  // real-life models: about 60 % of the regular vehicles (102 of 170), fixtures pinned
  const regularsAll = all.filter(isRegular);
  const rlTarget = Math.round(regularsAll.length * 0.6);
  const mustHave = regularsAll.filter((v) => regularBySlug.get(v.slug)?.fixtureRealLife === "yes");
  const mayHave = rng.shuffle(regularsAll.filter((v) => regularBySlug.get(v.slug)?.fixtureRealLife === "any"));
  // exactly one vehicle's real-life model contains "Huracán" (16.2): a non-fixture regular Super car
  const huracanHolder = mayHave.find((v) => v.classes[0] === "super" && nonFixture(v)) as Vehicle;
  const restMay = mayHave.filter((v) => v !== huracanHolder);
  const withRealLife = [...mustHave, huracanHolder, ...restMay.slice(0, rlTarget - mustHave.length - 1)];
  const rlRng = new Rng("vehicles:real-life");
  const rlTaken = new Set<string>();
  for (const v of withRealLife) {
    if (v === huracanHolder) {
      v.realLife = HURACAN_REAL_LIFE;
      continue;
    }
    let rl = "";
    for (let guard = 0; guard < 500; guard++) {
      rl = `${rlRng.pick(RL_MAKERS)} ${rlRng.pick(RL_MODELS)}`;
      if (!rlTaken.has(rl)) break;
    }
    rlTaken.add(rl);
    v.realLife = rl;
  }

  // second classes (12)
  const secondRng = new Rng("vehicles:second-class");
  for (const [primary, second] of SECOND_CLASS_PLAN) {
    const pool = regularsAll.filter((v) => v.classes[0] === primary && v.classes.length === 1 && nonFixture(v));
    const pickV = secondRng.pick(pool);
    pickV.classes = [primary, second];
  }

  // 8 vehicles without stats (3 of them Sports)
  const gapRng = new Rng("vehicles:gaps");
  const clearStats = (v: Vehicle) => {
    v.speed = undefined;
    v.acceleration = undefined;
    v.asphaltHandling = undefined;
    v.offroadHandling = undefined;
    v.strength = undefined;
  };
  const sportsPool = all.filter((v) => v.classes[0] === "sports" && nonFixture(v));
  const noSpeed = gapRng.sample(sportsPool, 3);
  const otherPool = all.filter((v) => !["sports"].includes(v.classes[0]) && nonFixture(v) && v.classes[0] !== "super");
  noSpeed.push(...gapRng.sample(otherPool, 5));
  noSpeed.forEach(clearStats);

  // 5 more vehicles without ratings (besides Boats, Helicopters and Planes)
  const ratedPool = all.filter((v) => v.roadRating !== undefined && nonFixture(v) && !noSpeed.includes(v));
  for (const v of gapRng.sample(ratedPool, 5)) {
    v.roadRating = undefined;
    v.offroadRating = undefined;
  }

  // 15 vehicles carry the "Launch Edition" badge
  for (const v of gapRng.sample(all.filter(nonFixture), 15)) v.editions = ["Launch Edition"];

  // fixture detail-page profiles (info rows of 16.2)
  const sanchez = vehicles.get("sanchez") as Vehicle;
  sanchez.style = "Dirt Bike";
  sanchez.specialist = sanchez.specialist ?? "Off-Road";
  sanchez.mass = sanchez.mass ?? "112 kg";
  sanchez.driveTrain = sanchez.driveTrain ?? "Chain Drive";
  sanchez.gears = sanchez.gears ?? "5-Speed Manual";
  if (sanchez.notableOwners.length === 0) sanchez.notableOwners = [ownerNames[0]];
  if (sanchez.appearances.length < 2) sanchez.appearances = ["GTA V", "GTA San Andreas", "GTA Vice City"];
  sanchez.gallery = galleryImages({ prefix: "sanchez", count: 9, subject: "Maibatsu Sanchez", noun: "screenshot", rng: new Rng("vehicles:sanchez-gallery") });
  // a second regular dirt bike so "Similar Vehicles" has at least one card (R-612)
  const dirtPeer = regularsAll.find((v) => v.classes[0] === "motorcycles" && v.slug !== "sanchez" && nonFixture(v)) as Vehicle;
  dirtPeer.style = "Dirt Bike";
  for (const s of all.filter((x) => x.baseModel === "sanchez" || x.baseModel === dirtPeer.slug)) {
    s.style = "Dirt Bike";
  }

  const maverick = vehicles.get("maverick") as Vehicle;
  maverick.specialist = undefined;
  maverick.driveTrain = undefined;
  maverick.gears = undefined;
  maverick.notableOwners = [];
  maverick.mass = maverick.mass ?? "2,350 kg";

  const sunset = vehicles.get("sunset-sanchez") as Vehicle;
  sunset.rating = { average: 0, votes: 0 };
  sunset.driveTrain = "Chain Drive";

  // 6. catalogue order (R-1606)
  const ordered: Vehicle[] = [];
  const sortedRegulars = regularsAll.slice().sort((a, b) => naturalCompare(a.name, b.name));
  for (const r of sortedRegulars) {
    ordered.push(r);
    const own = all.filter((s) => s.baseModel === r.slug).sort((a, b) => naturalCompare(a.name, b.name));
    ordered.push(...own);
  }
  // fixture adjacency: mud-crasher-rancher, sunset-sanchez, tormentor-street-blazer are consecutive
  const moveNextTo = (slug: string, anchor: string, after: boolean) => {
    const from = ordered.findIndex((v) => v.slug === slug);
    const [item] = ordered.splice(from, 1);
    const at = ordered.findIndex((v) => v.slug === anchor);
    ordered.splice(after ? at + 1 : at, 0, item);
  };
  moveNextTo("mud-crasher-rancher", "sunset-sanchez", false);
  moveNextTo("tormentor-street-blazer", "sunset-sanchez", true);
  ordered.forEach((v, i) => {
    v.position = i + 1;
  });
  for (const v of ordered) {
    if (v.baseModel) (vehicles.get(v.baseModel) as Vehicle).variants.push(v.slug);
  }
  return ordered;
}

export const vehicles: Vehicle[] = buildVehicles();
