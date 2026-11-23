// Interactive map configuration (R-1608..R-1612): own island, 10 groups, 102 categories, 928 markers.
// Coordinates are map units: x grows east, y grows north.

import type { MapCategory, MapConfig, MapGroup, Marker } from "./types";
import { art } from "./media";
import { PROPERTY_MARKERS, animals, properties } from "./guides";
import { vehicles } from "./vehicles";
import { weapons } from "./weapons";
import { PLACES, uniquePersonNames } from "./words";
import { Rng } from "./util";

// ---------------------------------------------------------------- geometry (own invented island, D-UI-6)

const ISLAND: [number, number][] = [
  [-6500, 2500], [-4800, 2750], [-3000, 2700], [-1000, 2800], [1000, 2600], [2600, 2450], [3500, 2200], [3800, 1100],
  [3700, 0], [3400, -1100], [3000, -2000], [2500, -3300], [2000, -4500], [1300, -5500], [500, -6500], [-300, -7400],
  [-1200, -8200], [-2000, -8700], [-2600, -8600], [-3200, -8200], [-3600, -7800], [-3900, -6900], [-4200, -6000],
  [-4700, -5100], [-5200, -4200], [-6000, -3600], [-6800, -3000], [-7300, -2000], [-7600, -1000], [-7700, 100],
  [-7400, 1200], [-7000, 2000],
];

function octagon(cx: number, cy: number, r: number): [number, number][] {
  return Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    return [Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)] as [number, number];
  });
}

const LAGOONS: [number, number][][] = [octagon(-5200, 400, 700), octagon(1700, 900, 500), octagon(-2600, -7300, 380)];

export function pointInPolygon(x: number, y: number, poly: readonly [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** True when the point lies on the island and not in a lagoon. */
export function isOnLand(x: number, y: number): boolean {
  return pointInPolygon(x, y, ISLAND) && !LAGOONS.some((l) => pointInPolygon(x, y, l));
}

export const mapConfig: MapConfig = {
  bounds: { minX: -8000, maxX: 4000, minY: -9000, maxY: 3000 },
  minZoom: 0,
  maxZoom: 8,
  startZoom: 2,
  closeZoom: 5,
  clusterBelowZoom: 2,
  startMarkerId: "safehouse-001",
  island: ISLAND,
  lagoons: LAGOONS,
  roads: [
    [[-6800, 1500], [-4000, 2000], [-1000, 2100], [2500, 1800], [3200, 0], [2500, -2200], [1500, -4400], [0, -6300], [-1500, -7900]],
    [[-6500, -1200], [-4500, -2500], [-2600, -2600], [-1500, -3500], [-500, -4800], [-1200, -6400]],
    [[-3000, 2400], [-2600, -2600], [-2352, -5532], [-2900, -7900]],
    [[600, -1800], [-500, -1200], [-3500, 0], [-6000, 600]],
  ],
  regions: [
    { id: "coralwood", name: "Coralwood County", labelX: -5600, labelY: -1500 },
    { id: "saltgrass", name: "Saltgrass County", labelX: -2800, labelY: 1400 },
    { id: "palmhaven", name: "Palmhaven County", labelX: 1600, labelY: -1000 },
    { id: "mangrove-reach", name: "Mangrove Reach", labelX: -3000, labelY: -4200 },
    { id: "sunbreak-keys", name: "Sunbreak Keys", labelX: -900, labelY: -7600 },
  ],
  notice: {
    start: "2026-11-01",
    end: "2027-12-31",
    heading: "Everything here is sample data",
    text: "Every marker on this island was invented for Leonida Atlas. Tick, filter and share as much as you like: your progress stays in this browser.",
  },
};

function regionOf(x: number, y: number): string {
  let best = mapConfig.regions[0];
  let bestD = Infinity;
  for (const r of mapConfig.regions) {
    const d = (r.labelX - x) ** 2 + (r.labelY - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best.name;
}

// ---------------------------------------------------------------- groups (R-1608)

export const mapGroups: MapGroup[] = [
  { id: "properties", name: "Personal", color: "#0E4D4F" },
  { id: "robberies", name: "Robberies", color: "#FF6A4D" },
  { id: "activities", name: "Activities", color: "#1F8A8A" },
  { id: "collectibles", name: "Collectibles", color: "#C98A12" },
  { id: "collectible-cards", name: "Collectible Cards", color: "#B4508C" },
  { id: "vehicles", name: "Vehicles", color: "#3B6FB6" },
  { id: "weapons", name: "Weapons", color: "#8C3B2E" },
  { id: "style", name: "Style", color: "#7A5BB5" },
  { id: "food-drink", name: "Food & Drink", color: "#D9822B" },
  { id: "local-places", name: "Local Places", color: "#5E7D3A" },
].map((g, i) => ({ ...g, order: i + 1 }));

// ---------------------------------------------------------------- categories (R-1609), config order

interface CategoryDef {
  id: string;
  name: string;
  group: string;
  slug?: string;
  nt?: boolean;
  ms?: boolean;
  /** Noun used in generated marker names. */
  noun?: string;
}

const RAW: [id: string, name: string, extra?: Partial<CategoryDef>][] = [
  ["bank", "Banks", { group: "robberies", slug: undefined, noun: "Savings & Loan" }],
  ["fence", "Fences", { noun: "Fence" }],
  ["gang-operation", "Illegal Operations", { noun: "Operation" }],
  ["payday-loan", "Payday Loans", { noun: "Cash Advance" }],
  ["safe", "Safes", { noun: "Office Safe" }],
  ["smash-n-grab", "Smash 'n' Grabs", { noun: "Storefront" }],
  ["towable-atm", "Towable ATMs", { noun: "Towable ATM" }],
  ["mural", "1010 Murals", { group: "collectibles", noun: "Mural" }],
  ["ahol-street-art", "Ahol Street Art", { noun: "Street Art" }],
  ["base-jump", "BASE Jumps", { noun: "BASE Jump" }],
  ["book-swap", "Book Swaps", { noun: "Book Swap Box" }],
  ["comics", "Comics", { noun: "Comic Stash" }],
  ["hidden-package", "Hidden Package", { slug: "hidden-packages", noun: "Hidden Package" }],
  ["easter-egg", "Easter Eggs", { slug: "easter-eggs", noun: "Oddity" }],
  ["knife-flight", "Knife Flights", { noun: "Knife Flight Gate" }],
  ["luxury-watch", "Luxury Watches", { noun: "Watch Box" }],
  ["magazine", "Magazines & Books", { noun: "Magazine" }],
  ["meditation", "Meditations", { noun: "Meditation Spot" }],
  ["message-bottle", "Messages in a Bottle", { noun: "Bottle" }],
  ["meteorite", "Meteorites", { noun: "Meteorite" }],
  ["stunt-jump", "Stunt Jumps", { slug: "stunt-jumps", noun: "Stunt Ramp" }],
  ["treasure", "Treasures", { noun: "Treasure Chest" }],
  ["under-the-bridge", "Under the Bridge", { noun: "Bridge Run" }],
  ["playlist", "Unique Playlists", { noun: "Playlist Tape" }],
  ["waink-curiosity", "Waink: Curiosities", { noun: "Curiosity" }],
  ["waink-landmark", "Waink: Landmarks", { noun: "Landmark Plaque" }],
  ["waink-sculpture", "Waink: Sculptures", { noun: "Sculpture" }],
  ["yellow-loot-box", "Yellow Loot Boxes", { noun: "Loot Box" }],
  ["scoop-container", "SCOOP Containers", { noun: "Container" }],
  ["card-americas-next-top-hooker", "America's Next Top Hooker", { group: "collectible-cards", ms: true }],
  ["card-backyard-wrestling", "Backyard Wrestling", { ms: true }],
  ["card-delights", "Delights Dancers", { ms: true }],
  ["card-ed-comics", "Ed Comics Universe", { ms: true }],
  ["card-jack-of-hearts", "Jack of Hearts Dancers", { ms: true }],
  ["card-liberty-city-penetrators", "Liberty City Penetrators", { ms: true }],
  ["card-liberty-city-swingers", "Liberty City Swingers", { ms: true }],
  ["card-liberty-city-wrath", "Liberty City Wrath", { ms: true }],
  ["card-los-santos-corkers", "Los Santos Corkers", { ms: true }],
  ["card-los-santos-panic", "Los Santos Panic", { ms: true }],
  ["card-los-santos-pounders", "Los Santos Pounders", { ms: true }],
  ["card-nine1nine", "Nine1Nine Dancers", { ms: true }],
  ["card-right-wing", "Right Wing: America's Hero", { ms: true }],
  ["card-legends-of-ratface", "The Legends of Ratface", { ms: true }],
  ["card-vice-city-club-de-futbol", "Vice City Club De Fútbol", { ms: true }],
  ["card-vice-city-flamingos", "Vice City Flamingos", { ms: true }],
  ["card-vice-city-manatees", "Vice City Manatees", { ms: true }],
  ["card-vice-city-narcos", "Vice City Narcos", { ms: true }],
  ["collectible-card", "Other Cards", { ms: true }],
  ["arcade", "Arcade Machines", { group: "activities", noun: "Arcade" }],
  ["basketball", "Basketball", { noun: "Court" }],
  ["car-meet", "Car Meet", { noun: "Car Meet" }],
  ["drone-race", "Drone Races", { noun: "Drone Course" }],
  ["fishing", "Fishing", { noun: "Fishing Spot" }],
  ["gang-compound", "Gang Compound", { noun: "Compound" }],
  ["golf", "Golf", { noun: "Golf Club" }],
  ["gym", "Gym", { noun: "Gym" }],
  ["hunting", "Hunting", { noun: "Hunting Ground" }],
  ["mini-golf", "Mini Golf", { noun: "Mini Golf" }],
  ["parachuting", "Parachuting", { noun: "Jump Tower" }],
  ["pool", "Pool", { noun: "Pool Hall" }],
  ["race", "Races", { noun: "Street Race" }],
  ["random-event", "Random Events", { noun: "Odd Encounter" }],
  ["shooting-range", "Shooting Range", { noun: "Shooting Range" }],
  ["garage", "Garages", { group: "properties", slug: "garages" }],
  ["helipad", "Helipads", { group: "local-places", slug: "helipads", noun: "Helipad" }],
  ["safehouse", "Safehouses", { group: "properties", slug: "safehouses" }],
  ["bus-stop", "Bus Stops", { group: "vehicles", nt: true, noun: "Bus Stop" }],
  ["car-wash", "Car Washes", { noun: "Car Wash" }],
  ["ev-charger", "Electric Chargers", { nt: true, noun: "Charging Point" }],
  ["gas-station", "Gas Stations", { nt: true, noun: "Gas Station" }],
  ["vehicle-mod-shop", "Mod Shops", { noun: "Mod Shop" }],
  ["pay-n-spray", "Pay 'n' Sprays", { noun: "Paint Shop" }],
  ["public-transport", "Train & Metro Stations", { noun: "Station" }],
  ["airport", "Airports & Airfields", { slug: "airports", noun: "Airfield" }],
  ["ferry", "Ferry Terminals", { slug: "ferry-terminals", noun: "Ferry Landing" }],
  ["standout-vehicle", "Standout Vehicles", { ms: true }],
  ["vehicle-rental", "Vehicle Rentals", { noun: "Rentals" }],
  ["vehicle-request", "Vehicle Requests", { noun: "Request Board" }],
  ["vehicle-spawn", "Vehicle Spawns", { noun: "Parking Spot" }],
  ["ammu-nation", "Ammu-Nations", { group: "weapons", noun: "Gun Counter" }],
  ["weapon-spawn", "Weapon Pickups", { noun: "Weapon Cache" }],
  ["unique-weapon", "Unique Weapons" ],
  ["clothing", "Clothing", { group: "style", noun: "Outfitters" }],
  ["electronics", "Electronics", { noun: "Electronics" }],
  ["footwear", "Footwear", { noun: "Shoe Store" }],
  ["haircut", "Hair & Beauty", { noun: "Salon" }],
  ["tattoo", "Tattoos", { noun: "Tattoo Parlor" }],
  ["bar", "Bars", { group: "food-drink", noun: "Bar" }],
  ["cafe-takeout", "Cafes & Takeout", { noun: "Cafe" }],
  ["convenience-store", "Convenience Stores", { noun: "Mini Mart" }],
  ["food-and-drink", "Fast Food", { noun: "Burger Shack" }],
  ["liquor-store", "Liquor Stores", { noun: "Liquor" }],
  ["street-food", "Street Food", { noun: "Food Cart" }],
  ["atm", "ATMs", { group: "local-places", nt: true, noun: "ATM" }],
  ["cinema", "Cinema", { noun: "Cinema" }],
  ["city-town", "Cities & Towns", { noun: "" }],
  ["fire-station", "Fire Stations", { noun: "Fire Station" }],
  ["hospital", "Hospitals", { noun: "Hospital" }],
  ["landmark", "Landmarks", { noun: "Lookout" }],
  ["marina", "Marinas", { slug: "marinas", noun: "Marina" }],
  ["nightclub", "Nightclub", { noun: "Nightclub" }],
  ["police-station", "Police Stations", { noun: "Police Station" }],
];

/** Groups follow the names in parentheses until the next parenthesis (R-1609). */
const DEFS: CategoryDef[] = (() => {
  let group = "robberies";
  return RAW.map(([id, name, extra]) => {
    if (extra?.group) group = extra.group;
    // helipad and safehouse/garage switch the group only for themselves and the rows that follow
    return { id, name, group, slug: extra?.slug, nt: extra?.nt, ms: extra?.ms, noun: extra?.noun };
  });
})();

const SINGULAR: Record<string, string> = {
  bank: "Bank",
  garage: "Garage",
  safehouse: "Safehouse",
  "hidden-package": "Hidden Package",
  helipad: "Helipad",
  airport: "Airport",
  ferry: "Ferry Terminal",
  marina: "Marina",
  "easter-egg": "Easter Egg",
  "stunt-jump": "Stunt Jump",
};

function markerCountFor(d: CategoryDef): number {
  switch (d.id) {
    case "safehouse":
      return 5;
    case "garage":
      return 6;
    case "bank":
      return 12;
    case "hidden-package":
      return 30;
    case "standout-vehicle":
      return 10;
    case "helipad":
      return 4;
    case "bus-stop":
      return 20;
    case "ev-charger":
      return 10;
    case "gas-station":
      return 15;
    case "atm":
      return 30;
  }
  if (d.ms) return 13;
  switch (d.group) {
    case "robberies":
      return 8;
    case "collectibles":
      return 10;
    case "activities":
      return 6;
    case "vehicles":
      return 6;
    case "weapons":
      return 8;
    case "style":
      return 5;
    case "food-drink":
      return 8;
    default:
      return 5;
  }
}

// ---------------------------------------------------------------- markers (R-1610, R-1611)

const SAFEHOUSES: { n: number; name: string; x: number; y: number; details?: string }[] = [
  { n: 1, name: "Gator Point Hideout", x: -2352, y: -5532, details: "gator-point-hideout" },
  { n: 2, name: "Coquina Court Apartment", x: -1500, y: -3500, details: "coquina-court-apartment" },
  { n: 3, name: "Pegassi Residences", x: -1900, y: -5000 },
  { n: 4, name: "Driftline Stilt House", x: -500, y: -1200, details: "driftline-stilt-house" },
  { n: 5, name: "Starlet Motel", x: 300, y: 1500 },
];

const DESC_OPENERS: readonly string[] = [
  "Tucked behind a row of palms",
  "Easy to miss from the road",
  "Best reached by boat",
  "Look for the faded mural nearby",
  "Busy after dark",
  "Quiet most mornings",
  "Next to a bait shop with a hand-painted sign",
  "Up a short flight of rusty stairs",
];
const DESC_TIPS: readonly string[] = [
  "Approach from the water side",
  "Park on the gravel lot across the street",
  "Come back later if the area is busy",
  "Watch out for the guard dog",
  "A ladder on the north wall gets you up",
  "Bring a boat for the last stretch",
];

const DETAIL_SECTION: Record<string, string> = {
  robberies: "/gta-6/missions/",
  activities: "/gta-6/side-missions/",
  collectibles: "/articles/gta-6/gta-6-100-completion-guide-interactive-checklist",
  vehicles: "/gta-6/vehicles/",
  weapons: "/gta-6/weapons/",
  style: "/gta-6/characters/",
  "food-drink": "/gta-6/map-locations/",
  "local-places": "/gta-6/map-locations/",
};

function idFor(category: string, n: number): string {
  return `${category}-${String(n).padStart(3, "0")}`;
}

function buildMap(): { categories: MapCategory[]; markers: Marker[] } {
  const rng = new Rng("map");
  const markers: Marker[] = [];
  const randomPoint = (): [number, number] => {
    const { minX, maxX, minY, maxY } = mapConfig.bounds;
    for (let guard = 0; guard < 10000; guard++) {
      const x = Math.round(minX + rng.next() * (maxX - minX));
      const y = Math.round(minY + rng.next() * (maxY - minY));
      if (isOnLand(x, y)) return [x, y];
    }
    throw new Error("no land point found");
  };
  const cardNames = uniquePersonNames(new Rng("map:cards"), 19 * 9);
  let cardCursor = 0;
  const purchasable = properties.filter((p) => p.grid === "purchasable");
  const standoutPool = new Rng("map:standouts").sample(vehicles.filter((v) => v.standoutSet), 8);
  const uniquePool = new Rng("map:unique").sample(weapons.filter((w) => w.type === "unique-variant"), 8);

  const categories: MapCategory[] = DEFS.map((d, i) => {
    const count = markerCountFor(d);
    const placeOrder = rng.shuffle(PLACES);
    const own: Marker[] = [];
    for (let n = 1; n <= count; n++) {
      const id = idFor(d.id, n);
      let name: string;
      let x: number;
      let y: number;
      let detailsPath: string | undefined;
      if (d.id === "safehouse") {
        const s = SAFEHOUSES[n - 1];
        name = s.name;
        x = s.x;
        y = s.y;
        detailsPath = s.details ? `/gta-6/properties/${s.details}` : undefined;
      } else if (d.id === "garage") {
        const p = purchasable[n - 1];
        const pos = PROPERTY_MARKERS[p.slug];
        name = p.name;
        x = pos.x;
        y = pos.y;
        detailsPath = p.canonicalPath;
      } else {
        [x, y] = randomPoint();
        if (d.ms && d.id !== "standout-vehicle") {
          // 001–009 distinct names; 010–013 repeat the names of 002, 003, 004 and 001 (R-1610)
          const repeatOf = [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 4, 1][n - 1];
          name = repeatOf ? own[repeatOf - 1].name : `${cardNames[cardCursor++]} Card`;
        } else if (d.id === "standout-vehicle") {
          // 8 distinct names; 009 and 010 repeat 002 and 005
          const repeatOf = [0, 0, 0, 0, 0, 0, 0, 0, 2, 5][n - 1];
          const v = repeatOf ? standoutPool[repeatOf - 1] : standoutPool[n - 1];
          name = v.name;
          detailsPath = v.canonicalPath;
        } else if (d.id === "unique-weapon") {
          const w = uniquePool[n - 1];
          name = w.name;
          detailsPath = w.canonicalPath;
        } else if (d.id === "city-town") {
          name = placeOrder[n - 1];
        } else {
          name = `${placeOrder[n - 1]} ${d.noun ?? d.name}`;
        }
        if (!detailsPath) {
          if (d.id === "parachuting") detailsPath = "/side-missions/gta-6/parachuting";
          else if (d.id === "random-event") detailsPath = "/gta-6/random-events/";
          else if (d.id === "hunting") detailsPath = rng.pick(animals.filter((a) => a.grid === "land")).canonicalPath;
          else if (rng.chance(0.08)) detailsPath = DETAIL_SECTION[d.group];
        }
      }
      const m: Marker = { id, name, category: d.id, x, y };
      if (rng.chance(1 / 3)) {
        m.description = `${rng.pick(DESC_OPENERS)}; Area: ${regionOf(x, y)}; Tip: ${rng.pick(DESC_TIPS)}`;
      }
      if (rng.chance(0.2)) m.image = art("marker", id);
      if (detailsPath) m.detailsPath = detailsPath;
      own.push(m);
    }
    markers.push(...own);
    const distinct = new Set(own.map((m) => m.name.toLowerCase().replace(/\s+/g, " ").trim())).size;
    const slug = d.slug;
    return {
      id: d.id,
      name: d.name,
      singularName: SINGULAR[d.id] ?? d.name,
      group: d.group,
      trackable: !d.nt,
      hiddenByDefault: !!d.nt,
      multiSpawn: !!d.ms,
      slug,
      linkKey: slug ?? d.id,
      closedToSuggestions: d.id === "random-event",
      color: undefined,
      order: i + 1,
      markerCount: own.length,
      distinctCount: d.ms ? distinct : own.length,
    };
  });
  return { categories, markers };
}

const built = buildMap();

export const mapCategories: MapCategory[] = built.categories;
export const markers: Marker[] = built.markers;
