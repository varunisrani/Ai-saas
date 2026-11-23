// Guide-page items (sections 16.2, 16.8, R-1620, R-1622): animals, characters, gangs, properties,
// radio stations and the own synthesized audio clips.

import type {
  Animal,
  AnimalGrid,
  AudioClip,
  Character,
  CharacterGrid,
  FaqItem,
  Gang,
  Property,
  PropertyGrid,
  RadioStation,
  Track,
} from "./types";
import { art, galleryImages, makeRating } from "./media";
import { vehicles } from "./vehicles";
import { PLACES, uniquePersonNames } from "./words";
import { Rng, groupThousands, headingAnchor, naturalCompare, slugify } from "./util";

// ---------------------------------------------------------------- animals (64: land 40, birds 18, sea 6)

const LAND: readonly string[] = [
  "Albino American Alligator", "American Alligator", "American Crocodile", "Armadillo", "Black Bear", "Bobcat",
  "Wild Boar", "Coyote", "Cottonmouth", "Eastern Coral Snake", "White-tailed Deer", "Gray Fox", "Red Fox",
  "Leonida Panther", "Raccoon", "Opossum", "Marsh Rabbit", "Striped Skunk", "Burmese Python", "Key Deer",
  "Green Iguana", "Gopher Tortoise", "Box Turtle", "Diamondback Rattlesnake", "Black Racer", "River Otter",
  "Mink", "Fox Squirrel", "Feral Cat", "Stray Dog", "Wild Horse", "Cattle", "Goat", "Pig", "Coati",
  "Tegu Lizard", "Nile Monitor", "Cane Toad", "Bullfrog", "Marsh Rat",
];
const BIRDS: readonly string[] = [
  "American Flamingo", "Roseate Spoonbill", "Great Blue Heron", "Great Egret", "Brown Pelican", "White Ibis",
  "Anhinga", "Osprey", "Bald Eagle", "Red-tailed Hawk", "Turkey Vulture", "Wild Turkey", "Sandhill Crane",
  "Wood Stork", "Laughing Gull", "Fish Crow", "Rock Pigeon", "Monk Parakeet",
];
const SEA: readonly string[] = ["Bottlenose Dolphin", "Manatee", "Bull Shark", "Hammerhead Shark", "Loggerhead Turtle", "Southern Stingray"];

const HABITATS: Record<AnimalGrid, readonly string[]> = {
  land: ["Swamps", "Pine Woods", "Farmland", "Mangroves", "Suburbs", "Grassland", "Riverbanks"],
  birds: ["Wetlands", "Beaches", "Lakeshores", "City Rooftops", "Open Sky"],
  sea: ["Coastal Waters", "Open Ocean", "Reefs", "Estuaries"],
};
const CATEGORY: Record<AnimalGrid, readonly string[]> = {
  land: ["Predator", "Prey", "Domestic", "Scavenger", "Reptile"],
  birds: ["Bird", "Bird of Prey", "Shorebird"],
  sea: ["Marine Life", "Predator"],
};
const ANIMAL_CLASS: Record<AnimalGrid, readonly string[]> = {
  land: ["Mammal", "Reptile", "Amphibian"],
  birds: ["Bird"],
  sea: ["Mammal", "Fish", "Reptile"],
};
const RECOMMENDED: readonly string[] = ["Sniper Rifles", "Shotguns", "Hunting Rifle", "Bow", "Handguns", "Camera only"];

function animalSpecies(name: string): string {
  const words = name.split(" ");
  return words[words.length - 1];
}

export function buildAnimals(): Animal[] {
  const rng = new Rng("animals");
  const grids: [AnimalGrid, readonly string[]][] = [["land", LAND], ["birds", BIRDS], ["sea", SEA]];
  const out: Animal[] = [];
  for (const [grid, names] of grids) {
    const sorted = names.slice().sort(naturalCompare);
    for (const name of sorted) {
      const slug = slugify(name);
      const full = slug === "gray-fox" || rng.chance(0.75);
      const galleryCount = slug === "gray-fox" || rng.chance(0.35) ? 0 : rng.int(1, 10);
      out.push({
        slug,
        canonicalPath: `/gta-6/animals/${slug}`,
        position: out.length + 1,
        name,
        grid,
        animalCategory: rng.pick(CATEGORY[grid]),
        habitat: rng.pick(HABITATS[grid]),
        recommendedWeapon: full || rng.chance(0.5) ? rng.pick(RECOMMENDED) : undefined,
        species: full || rng.chance(0.5) ? animalSpecies(name) : undefined,
        animalClass: rng.pick(ANIMAL_CLASS[grid]),
        description: `The ${name.toLowerCase()} turns up around the ${rng.pick(HABITATS[grid]).toLowerCase()} of ${rng.pick(PLACES)}. ${
          grid === "sea" ? "Watch for it from a boat on calm mornings." : grid === "birds" ? "It is easiest to photograph at first light." : "Move slowly and keep the wind in your face if you want a closer look."
        }`,
        image: art("animal", slug),
        gallery: galleryImages({ prefix: slug, count: galleryCount, subject: name, noun: "photo", rng }),
        rating: makeRating(rng),
      });
    }
  }
  return out;
}

export const animals: Animal[] = buildAnimals();

// ---------------------------------------------------------------- characters (2 / 6 / 10 / 24 + 6 other rows)

const ROLES: Record<Exclude<CharacterGrid, "other">, string> = {
  protagonists: "Protagonist",
  main: "Main Character",
  supporting: "Supporting Character",
  minor: "Minor Character",
};
const OCCUPATIONS: readonly string[] = [
  "Bait shop owner", "Club promoter", "Charter boat captain", "Pawn broker", "Tow truck driver", "Real estate agent",
  "Bail bondsman", "Radio host", "Airboat guide", "Motel manager", "Street racer", "Private investigator",
  "Food truck cook", "Tattoo artist", "Car dealer", "Lifeguard",
];
const AFFILIATIONS: readonly string[] = ["Final Chapter MC", "Coral Syndicate", "Saltmarsh Kings", "Independent", "Leonida Port Authority", "The Neon Mile crowd"];

export function buildCharacters(): Character[] {
  const rng = new Rng("characters");
  const taken = new Set<string>(["Jason Duval"]);
  const names = uniquePersonNames(rng, 1 + 6 + 10 + 24 + 6, taken);
  const plan: [CharacterGrid, number][] = [["protagonists", 2], ["main", 6], ["supporting", 10], ["minor", 24], ["other", 6]];
  const vehicleSlugs = vehicles.filter((v) => !v.standoutSet).map((v) => v.slug);
  const safehouseNames = ["Gator Point Hideout", "Coquina Court Apartment", "Driftline Stilt House"];
  const out: Character[] = [];
  const takenSlugs = new Set<string>();
  let cursor = 0;
  for (const [grid, count] of plan) {
    for (let i = 0; i < count; i++) {
      const isJason = grid === "protagonists" && i === 0;
      const name = isJason ? "Jason Duval" : names[cursor++];
      const first = name.split(" ")[0];
      let slug = grid === "other" ? undefined : isJason ? "jason" : slugify(first);
      if (slug && takenSlugs.has(slug)) slug = slugify(name);
      if (slug) takenSlugs.add(slug);
      const full = isJason || grid === "protagonists" || (grid === "main" && rng.chance(0.7));
      const opt = <T,>(value: T, p: number): T | undefined => (full || rng.chance(p) ? value : undefined);
      const shots = isJason ? 24 : grid === "other" ? 0 : rng.chance(0.3) ? 0 : rng.int(1, 8);
      const arts = isJason ? 6 : grid === "other" ? 0 : rng.chance(0.5) ? 0 : rng.int(1, 4);
      const c: Character = {
        slug,
        canonicalPath: slug ? `/gta-6/characters/${slug}` : undefined,
        position: out.length + 1,
        name,
        grid,
        role: grid === "other" ? "Mentioned" : ROLES[grid],
        gender: opt(rng.pick(["Male", "Female", "Non-binary"]), 0.8),
        bornInYear: opt(String(rng.int(1958, 2004)), 0.5),
        nationality: opt(rng.pick(["American", "Cuban-American", "Haitian-American", "Canadian", "Venezuelan-American"]), 0.5),
        location: opt(rng.pick(PLACES), 0.7),
        occupation: opt(rng.pick(OCCUPATIONS), 0.7),
        alsoKnownAs: opt(`"${rng.pick(["Lucky", "Boots", "Sundown", "Professor", "Gator", "Smokey", "Ace", "Pastel", "Moonshine"])}"`, 0.3),
        performer: "Not yet announced",
        family: opt(rng.pick(["No known family", "Older brother in Brine Harbor", "Raised by an aunt", "Two cousins on the Neon Mile"]), 0.3),
        affiliation: opt(rng.pick(AFFILIATIONS), 0.5),
        propertySafehouse: grid === "protagonists" ? safehouseNames[i] : opt(rng.pick(PLACES), 0.2),
        vehicles: full ? rng.sample(vehicleSlugs, rng.int(1, 3)) : [],
        screenshots: galleryImages({ prefix: `${slug ?? "other"}-screenshot`, count: shots, subject: name, noun: "screenshot", rng }),
        artworks: galleryImages({ prefix: `${slug ?? "other"}-artwork`, count: arts, subject: name, noun: "artwork", rng, width: 1200, height: 1600 }),
        video: slug ? art("video", `character-${slug}`) : undefined,
        description: `${name} ${rng.pick([
          "keeps one foot in the legitimate world and one firmly out of it",
          "knows every back road between the cane fields and the coast",
          "talks fast, laughs loud and remembers every favour owed",
          "has a soft spot for stray dogs and a hard line on loyalty",
          "turns up wherever there is money moving and nobody watching",
        ])}. ${grid === "protagonists" ? "You will spend a lot of the story in their shoes." : "Expect to cross paths more than once."}`,
        image: art("character", slug ?? slugify(name)),
        rating: makeRating(rng),
      };
      out.push(c);
    }
  }
  return out;
}

export const characters: Character[] = buildCharacters();

/** Extras of the characters guide (R-1002, R-1620): 8 mentioned names and a 5-question FAQ (own wording). */
export const characterGuide: { mentionedNames: string[]; faq: FaqItem[] } = (() => {
  const rng = new Rng("characters:mentioned");
  const taken = new Set(characters.map((c) => c.name));
  const mentionedNames = uniquePersonNames(rng, 8, taken);
  const qa: [string, string][] = [
    ["Who are the playable characters?", "Two protagonists share the story; the first one listed on this page is Jason Duval."],
    ["Are the performers known?", "Not yet. Every performer field on Leonida Atlas reads \"Not yet announced\" until there is something to say."],
    ["Can I meet minor characters more than once?", "Many of them return in side activities and stranger missions, so keep an eye on the map."],
    ["Why do some rows have no page?", "Those characters are only mentioned in passing, so there is not enough to fill a page yet."],
    ["Is this character data official?", "No. Everything on Leonida Atlas is invented sample data for a fan-made guide."],
  ];
  return {
    mentionedNames,
    faq: qa.map(([question, answer], i) => ({ alias: headingAnchor(question), question, answer, openByDefault: i === 0 })),
  };
})();

// ---------------------------------------------------------------- gangs (3 gang cards, empty law grid, 6 bullets)

export const gangs: Gang[] = (() => {
  const rng = new Rng("gangs");
  const defs: [string, string, string][] = [
    ["Final Chapter MC", "Motorcycle Club", "Inland highways and the truck stops along them"],
    ["Coral Syndicate", "Smuggling Crew", "The marinas and the outer keys"],
    ["Saltmarsh Kings", "Street Gang", "The canal blocks east of downtown"],
  ];
  return defs.map(([name, type, territory], i) => {
    const slug = slugify(name);
    return {
      slug,
      canonicalPath: `/gangs/gta-6/${slug}`,
      position: i + 1,
      name,
      grid: "gangs" as const,
      type,
      territory,
      description: `${name} runs ${territory.toLowerCase()}. ${rng.pick([
        "They are loud about loyalty and quiet about everything else.",
        "Cross them once and the whole crew remembers your face.",
        "Their rides are as recognisable as their colours.",
      ])}`,
      image: art("gang", slug),
      rating: makeRating(rng),
    };
  });
})();

/** Bullet list after the empty law-enforcement grid (own names). */
export const gangGuide: { lawBullets: string[] } = {
  lawBullets: [
    "Leonida Highway Patrol",
    "County Sheriff's Office",
    "Port Authority Police",
    "State Wildlife Officers",
    "Federal Task Force",
    "Coast Guard Cutter Crews",
  ],
};

// ---------------------------------------------------------------- properties (6 / 3 / 4 / 3)

interface PropertyDef {
  name: string;
  grid: PropertyGrid;
  legacy?: boolean;
}

const PROPERTY_DEFS: PropertyDef[] = [
  { name: "Tarpon Flats Garage", grid: "purchasable" },
  { name: "Lantern Wharf Lockup", grid: "purchasable" },
  { name: "7th Avenue Garage", grid: "purchasable" },
  { name: "Seagrape Hill Carport", grid: "purchasable" },
  { name: "Cobalt Docks Warehouse", grid: "purchasable" },
  { name: "Neon Mile Parking Deck", grid: "purchasable" },
  { name: "Old Cannery Office", grid: "story" },
  { name: "Saltworks Boathouse", grid: "story" },
  { name: "Cypress Hollow Cabin", grid: "story" },
  { name: "Lime Key Bungalow", grid: "edition", legacy: true },
  { name: "Paradise Garage", grid: "edition", legacy: true },
  { name: "Opal Shores Penthouse", grid: "edition", legacy: true },
  { name: "Amber Isles Hangar", grid: "edition", legacy: true },
  { name: "Gator Point Hideout", grid: "safehouse" },
  { name: "Coquina Court Apartment", grid: "safehouse" },
  { name: "Driftline Stilt House", grid: "safehouse" },
];

/** Map positions of the properties that have a marker (filled by the map module's fixed coordinates). */
export const PROPERTY_MARKERS: Record<string, { markerId: string; x: number; y: number }> = {
  "tarpon-flats-garage": { markerId: "garage-001", x: -3100, y: -4300 },
  "lantern-wharf-lockup": { markerId: "garage-002", x: -1200, y: -6400 },
  "7th-avenue-garage": { markerId: "garage-003", x: -2600, y: -2600 },
  "seagrape-hill-carport": { markerId: "garage-004", x: 600, y: -1800 },
  "cobalt-docks-warehouse": { markerId: "garage-005", x: 1800, y: -3600 },
  "neon-mile-parking-deck": { markerId: "garage-006", x: -400, y: -4800 },
  "gator-point-hideout": { markerId: "safehouse-001", x: -2352, y: -5532 },
  "coquina-court-apartment": { markerId: "safehouse-002", x: -1500, y: -3500 },
  "driftline-stilt-house": { markerId: "safehouse-004", x: -500, y: -1200 },
};

export const properties: Property[] = (() => {
  const rng = new Rng("properties");
  return PROPERTY_DEFS.map((d, i) => {
    const slug = slugify(d.name);
    const purchasable = d.grid === "purchasable";
    const price = purchasable ? Math.round((40000 + rng.next() * 460000) / 500) * 500 : undefined;
    const type = { purchasable: "Garage", story: "Story Property", edition: "Edition Bonus", safehouse: "Safehouse" }[d.grid];
    const capacity = purchasable || d.grid === "edition" ? rng.pick([2, 4, 6, 10, 20]) : d.grid === "safehouse" ? rng.int(1, 2) : undefined;
    const howToUnlock = {
      purchasable: "Buy it from the property tab of the in-game phone.",
      story: "Unlocks automatically as the story moves on.",
      edition: "Included with the special editions; claim it from the phone's mail app.",
      safehouse: "Becomes available during the story chapters.",
    }[d.grid];
    const marker = PROPERTY_MARKERS[slug];
    return {
      slug,
      canonicalPath: d.legacy ? `/properties/gta-6/${slug}` : `/gta-6/properties/${slug}`,
      position: i + 1,
      name: d.name,
      grid: d.grid,
      propertyType: type,
      propertyStyle: rng.pick(["Modern", "Art Deco", "Industrial", "Beach Shack", "Mid-Century", "Stilt House"]),
      location: rng.pick(PLACES),
      region: rng.pick(["Coralwood County", "Saltgrass County", "Palmhaven County", "Mangrove Reach", "Sunbreak Keys"]),
      vehicleCapacity: capacity,
      howToUnlock,
      price,
      howToGet: purchasable
        ? `Open the property tab on your phone, find the ${d.name} and pay $${groupThousands(price as number)}. Once the deal closes the doors open straight away.`
        : d.grid === "edition"
          ? `The ${d.name} comes with the special editions. Claim it from the mail app on your phone and it appears on the map.`
          : `Keep playing the story: the ${d.name} unlocks on its own and is marked on your map.`,
      mapImage: art("map", `property-${slug}`),
      mapX: marker?.x,
      mapY: marker?.y,
      markerId: marker?.markerId,
      description: `${d.name} is ${rng.pick(["a tidy little base", "a place to lie low", "a handy spot to store your rides", "a step up from sleeping in your car"])} near ${rng.pick(PLACES)}.`,
      image: art("property", slug),
      rating: makeRating(rng),
    };
  });
})();

// ---------------------------------------------------------------- radio (12 stations, 8 own clips)

export const audioClips: AudioClip[] = (() => {
  const rng = new Rng("audio");
  const waves: AudioClip["waveform"][] = ["sine", "triangle", "square", "sawtooth"];
  return Array.from({ length: 8 }, (_, i) => {
    const steps = Array.from({ length: rng.int(4, 8) }, () => rng.pick([0, 2, 3, 5, 7, 9, 10, 12]));
    return {
      id: `clip-${i + 1}`,
      file: `/audio/clip-${i + 1}.wav`,
      label: `Tone ${i + 1}`,
      seconds: rng.int(6, 12),
      baseHz: rng.pick([196, 220, 247, 262, 294, 330]),
      steps,
      bpm: rng.int(84, 132),
      waveform: waves[i % waves.length],
      sampleRate: 22050,
    };
  });
})();

const STATION_DEFS: [name: string, genre: string][] = [
  ["Lagoon Lights FM", "Synth Pop"],
  ["Flash FM", "80s Pop"],
  ["Swamp Gospel Radio", "Gospel & Soul"],
  ["Neon Static", "Electronic"],
  ["Bassline Bayou", "Hip-Hop"],
  ["Palmetto Country", "Country"],
  ["Low Tide Lounge", "Lounge & Jazz"],
  ["Talk Leonida", "Talk Radio"],
  ["Sunburn Rock", "Classic Rock"],
  ["Gator Beats", "Dancehall"],
  ["Static Bloom", "Indie"],
  ["Coral Wave Latino", "Latin"],
];

const TITLE_A: readonly string[] = ["Velvet", "Midnight", "Paper", "Electric", "Lonely", "Golden", "Broken", "Salty", "Neon", "Sunday", "Crooked", "Tangerine", "Slow", "Wild", "Hollow", "Sugar"];
const TITLE_B: readonly string[] = ["Causeway", "Heatwave", "Lagoon", "Motel", "Turnpike", "Hurricane", "Postcard", "Satellite", "Mangrove", "Boardwalk", "Telephone", "Riverboat", "Parade", "Engine", "Mirror", "Lantern"];
const ARTIST_A: readonly string[] = ["The", "Lady", "DJ", "Captain", "Little", "Big", "Saint", "Doctor"];
const ARTIST_B: readonly string[] = ["Pelicans", "Marlowe", "Static Kids", "Ibis", "Tarpon Twins", "Coquina", "Breakwater", "Hammocks", "Sawgrass", "Moonrise", "Gulfstream Five", "Cinder"];

export const radioStations: RadioStation[] = (() => {
  const rng = new Rng("radio");
  const titleTaken = new Set<string>();
  return STATION_DEFS.map(([name, genre], si) => {
    const stationNo = si + 1;
    const count = stationNo === 1 ? 14 : rng.int(6, 12);
    const tracks: Track[] = [];
    for (let n = 1; n <= count; n++) {
      let title = "";
      for (let guard = 0; guard < 200; guard++) {
        title = `${rng.pick(TITLE_A)} ${rng.pick(TITLE_B)}`;
        if (!titleTaken.has(title)) break;
      }
      titleTaken.add(title);
      const artist = `${rng.pick(ARTIST_A)} ${rng.pick(ARTIST_B)}`;
      let playable: boolean;
      if (stationNo === 1) playable = true;
      else if (stationNo === 3) playable = n !== 1 && (n <= 3 || rng.chance(0.5));
      else if (stationNo === 8) playable = false;
      else playable = rng.chance(0.55);
      tracks.push({
        number: n,
        title,
        artist,
        year: rng.int(1975, 2026),
        audioClip: playable ? audioClips[rng.int(0, audioClips.length - 1)].id : undefined,
      });
    }
    const slug = slugify(name);
    return {
      slug,
      canonicalPath: `/gta-6/radio-stations/${slug}`,
      position: stationNo,
      name,
      genre,
      host: rng.pick(["Marisol Starling", "Dex Quayle", "Pearl Oduya", "Rocco Thistlewood", "Calla Bellweather", "Otis Dunmore", "Juno Ravensdale", "Nells Kettleby"]),
      tracks,
      description: `${name} plays ${genre.toLowerCase()} around the clock, ${rng.pick([
        "with a host who never seems to sleep",
        "perfect for long drives down the coast",
        "best enjoyed with the windows down",
        "and a call-in hour nobody should miss",
      ])}.`,
      image: art("station", slug),
      rating: makeRating(rng),
    };
  });
})();
