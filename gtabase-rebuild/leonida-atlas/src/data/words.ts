// Own word lists for the sample-data generator (R-1601). Nothing here is taken from the reference site;
// names are invented compounds or plain dictionary words.

import { Rng } from "./util";

/** Invented neighbourhood / spot names on the Leonida Atlas island. */
export const PLACES: readonly string[] = [
  "Tarpon Flats", "Sabal Heights", "Gator Bend", "Coquina Point", "Pelican Row", "Mangrove Gardens",
  "Sawgrass Junction", "Lime Key", "Heron Park", "Old Cannery", "Driftwood Pier", "Seagrape Hill",
  "Bayside Market", "Cypress Hollow", "Sunrise Strip", "Palm Terrace", "Mullet Bay", "Saltworks",
  "Beacon Point", "Turnpike Plaza", "Orchid Lane", "Shellcrest", "Brine Harbor", "Cinder Yard",
  "Kestrel Marsh", "Opal Shores", "Cobalt Docks", "Amber Isles", "Tidewater Row", "Reedmoor",
  "Lantern Wharf", "Spoonbill Flats", "Ibis Crossing", "Cane Fields", "Marlow Springs", "Coral Arcade",
  "Starfruit Avenue", "Gulfview", "Quarry Lake", "Saltmarsh Loop", "Banyan Court", "Pinecone Ridge",
  "Hammock Woods", "Riverbend", "Dune Road", "Ferryside", "Neon Mile", "Pastel Quarter",
  "Seawall Park", "Stilt Village", "Cypress Run", "Gator Alley", "Sunfish Bay", "Lighthouse Key",
  "Mango Grove", "Bayou Steps", "Canal Street East", "Breakwater", "Sandbar Point", "Moonrise Inlet",
  "Pelican Bluff", "Tamarind Square", "Driftline", "Old Mill Creek", "Tollgate", "Glasswater",
];

export const PERSON_FIRST: readonly string[] = [
  "Odessa", "Tamsin", "Basil", "Juno", "Marisol", "Dex", "Coral", "Rufus", "Ines", "Lazlo", "Pearl",
  "Ignatius", "Wren", "Cosmo", "Delphine", "Augustin", "Birdie", "Caspian", "Zora", "Thaddeus", "Mirela",
  "Otis", "Fenna", "Lucan", "Vesna", "Harlan", "Imogen", "Bram", "Selma", "Quill", "Ottilie", "Rocco",
  "Saffron", "Tobiah", "Ysolde", "Gideon", "Leontyne", "Merritt", "Nells", "Perpetua", "Ambrose", "Calla",
];

export const PERSON_LAST: readonly string[] = [
  "Vale", "Rook", "Quint", "Pell", "Ardent", "Okonkwo-Reyes", "Starling", "Mallory", "Duquesne", "Brightwater",
  "Fennimore", "Castellane", "Larkspur", "Oduya", "Marchetti-Holm", "Szabo-Lind", "Kettleby", "Ravensdale",
  "Holloway-Cruz", "Pemberton", "Quayle", "Sorrentino-Bly", "Thistlewood", "Underhill", "Voskuijlen",
  "Whitcombe", "Yarborough", "Zeller-Morne", "Ashgrove", "Bellweather", "Coldridge", "Dunmore",
];

/** Invented person name from the two lists (deterministic for the given rng). */
export function personName(rng: Rng): string {
  return `${rng.pick(PERSON_FIRST)} ${rng.pick(PERSON_LAST)}`;
}

/** Unique invented person names. */
export function uniquePersonNames(rng: Rng, count: number, taken: Set<string> = new Set()): string[] {
  const out: string[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 200) {
    guard++;
    const name = personName(rng);
    if (taken.has(name)) continue;
    taken.add(name);
    out.push(name);
  }
  return out;
}

/** Earlier game labels used for "Game Appearances" (R-613). */
export const GAME_LABELS: readonly string[] = [
  "GTA V", "GTA Online", "GTA IV", "GTA San Andreas", "GTA Vice City", "GTA III",
  "GTA Vice City Stories", "GTA Liberty City Stories",
];

/** Generic own sentence pieces for descriptions. */
export const MOODS: readonly string[] = [
  "loud and unapologetic", "quietly confident", "a little rough around the edges", "polished to a mirror shine",
  "built for long sunny afternoons", "happiest after midnight", "surprisingly practical", "pure showboat",
  "tough as a coral reef", "light on its feet",
];

export const SCENES: readonly string[] = [
  "the causeway at dusk", "the back roads of the cane fields", "the neon mile on a Friday night",
  "the marina parking lot", "the swamp trails after a storm", "the long coastal highway",
  "the downtown grid at rush hour", "the dunes south of the lighthouse", "the quiet canal bridges",
  "the airfield perimeter road",
];

export const ADVICE: readonly string[] = [
  "Keep an eye on the minimap for shortcuts through parking lots.",
  "Save often: the island punishes overconfident drivers.",
  "Pair it with a friend who can watch your back.",
  "Check the in-game phone for limited-time offers.",
  "Repair it before a long run so a single bump does not end the fun.",
  "Learn its braking point before you take it on the highway.",
  "It looks best in sunset paint, if you ask us.",
  "Park it somewhere safe: thieves on the island have good taste.",
];

/** Simple sentence-builder: join non-empty parts with spaces. */
export function sentences(...parts: (string | undefined | false)[]): string {
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join(" ");
}
