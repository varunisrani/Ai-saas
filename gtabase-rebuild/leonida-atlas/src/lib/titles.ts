/**
 * titles — document titles, breadcrumbs and heading patterns (R-414, R-603, R-606, R-717, R-819, R-1108).
 */

export const SITE_NAME = "Leonida Atlas";

export type DetailType =
  | "vehicle"
  | "weapon"
  | "animal"
  | "character"
  | "property"
  | "radio-station"
  | "mission"
  | "gang"
  | "activity";

const SUFFIX: Record<Exclude<DetailType, "vehicle">, string> = {
  weapon: "Weapon Stats & How To Get",
  animal: "Animals Guide & Locations",
  character: "Characters Guide, Bio & Voice Actor",
  property: "Properties & Garages",
  "radio-station": "Radio Station Songs & Tracklist",
  mission: "Mission Guide & Walkthrough",
  gang: "Gangs & Factions Guide",
  activity: "Activities Guide", // HYPOTHESIS (R-603 table)
};

/** R-603 the part after "GTA 6 " in the detail title / breadcrumb label. */
export function detailTitleSuffix(type: DetailType, classNoun?: string): string {
  if (type === "vehicle") return `${classNoun ?? "Vehicle"} Stats, Price, How To Get`;
  return SUFFIX[type];
}

/**
 * R-603 document title "<h1> | GTA 6 <suffix>"; a unique-variant weapon uses the whole title
 * "<name>: GTA 6 Unique Weapon Location & How To Get" (no make).
 */
export function detailTitle(type: DetailType, h1: string, classNoun?: string, uniqueVariantName?: string): string {
  if (type === "weapon" && uniqueVariantName) {
    return `${uniqueVariantName}: GTA 6 Unique Weapon Location & How To Get`;
  }
  return `${h1} | GTA 6 ${detailTitleSuffix(type, classNoun)}`;
}

/** R-603 h1: vehicles and weapons "<Make label> <name>", every other type its name. */
export function detailH1(type: DetailType, name: string, makeLabel?: string): string {
  if ((type === "vehicle" || type === "weapon") && makeLabel) return `${makeLabel} ${name}`;
  return name;
}

/** R-603 breadcrumb link label (vehicles always use "Vehicle", not the class noun). */
export function breadcrumbLabel(type: DetailType): string {
  if (type === "vehicle") return "GTA 6 Vehicle Stats, Price, How To Get";
  return `GTA 6 ${SUFFIX[type]}`;
}

/** R-603 breadcrumb target (strangers missions → strangers list, HYPOTHESIS in the spec). */
export function breadcrumbHref(type: DetailType, missionKind?: "main" | "optional" | "stranger"): string {
  switch (type) {
    case "vehicle":
      return "/gta-6/vehicles/";
    case "weapon":
      return "/gta-6/weapons/";
    case "animal":
      return "/gta-6/animals/";
    case "character":
      return "/gta-6/characters/";
    case "property":
      return "/gta-6/properties/";
    case "radio-station":
      return "/gta-6/radio-stations/";
    case "mission":
      return missionKind === "stranger" ? "/gta-6/strangers-missions/" : "/gta-6/missions/";
    case "gang":
      return "/gta-6/gangs/";
    case "activity":
      return "/gta-6/side-missions/";
  }
}

export type SectionKey =
  | "info"
  | "how-to-get"
  | "statistics"
  | "description"
  | "screenshots"
  | "artworks"
  | "video"
  | "appearances"
  | "property-intro"
  | "map-location"
  | "tracklist"
  | "walkthrough"
  | "objectives"
  | "completed";

export interface SectionTitle {
  key: SectionKey;
  /** Text in normal case (the DOM text). */
  text: string;
  /** True when the heading is shown in capitals by styling (W3). */
  caps: boolean;
}

export type SectionLayout =
  | "vehicle-standout"
  | "vehicle"
  | "weapon"
  | "weapon-unique"
  | "animal"
  | "character"
  | "property"
  | "radio-station"
  | "mission"
  | "gang"
  | "activity";

/**
 * R-606 level-2 headings in order. `name` = item name without the make, `make` = make label.
 * Sections without content are left out by the caller, except gallery sections (R-609).
 */
export function detailSectionTitles(layout: SectionLayout, name: string, make = ""): SectionTitle[] {
  const s = (key: SectionKey, text: string, caps = true): SectionTitle => ({ key, text, caps });
  const info = s("info", `${name}: GTA 6 Info`);
  const howTo = s("how-to-get", `${name}: How To Get`);
  const stats = s("statistics", `${make} ${name} GTA 6 Statistics`.trim());
  const desc = s("description", `${name} Description:`);
  switch (layout) {
    case "vehicle-standout":
      return [info, stats, desc];
    case "vehicle":
      return [info, howTo, stats, desc, s("screenshots", `${name}: GTA 6 Screenshots`), s("appearances", `${name} Game Appearances`)];
    case "weapon":
      return [desc, info, howTo, stats, s("screenshots", `${name}: GTA 6 Screenshots`, false), s("appearances", `${name} Game Appearances`)];
    case "weapon-unique":
      return [info, howTo, stats, s("screenshots", `${name}: GTA 6 Screenshots`, false)];
    case "animal":
      return [info, s("screenshots", `${name}: Screenshots`, false)];
    case "character":
      return [info, s("screenshots", `${name}: Screenshots`), s("artworks", `${name}: Artworks`), s("video", `${name}: Video`)];
    case "property":
      return [s("property-intro", `How to get the ${name}:`), s("map-location", `${name}: Map Location`), info, howTo];
    case "radio-station":
      return [info, s("tracklist", `${name} Tracklist:`, false)];
    case "mission":
      return [info, s("walkthrough", `Mission Walkthrough - ${name}`), s("objectives", "Mission Objectives"), s("completed", "Mission Completed", false)];
    case "gang":
    case "activity":
      return [info, desc];
  }
}

/** R-608 statistic labels (shown in capitals); vehicles end with "Rating" + an unlabelled road rating. */
export const VEHICLE_STAT_LABELS = ["Speed", "Acceleration", "Asphalt Handling", "Off-Road Handling", "Strength", "Rating"] as const;
export const WEAPON_STAT_LABELS = ["Damage", "Accuracy", "Handling", "Range", "Overall"] as const;

/** R-607 info-row label order per type (rows without a value are omitted by the caller). */
export const INFO_LABELS = {
  vehicle: [
    "Standout Set",
    "Vehicle Class",
    "Manufacturer",
    "Style",
    "Era",
    "Specialist",
    "Seats",
    "Based on (Real Life)",
    "Mass / Weight",
    "Base Model",
    "Drive Train",
    "Gears",
    "Variant / Conversion",
    "Notable Owners",
  ],
  weapon: [
    "Manufacturer",
    "Weapon Class",
    "Based on (Real Life)",
    "Base Model",
    "Ammo Capacity",
    "Extended Ammo",
    "Acquisition Method",
    "How To Unlock",
    "Story Mode Price",
    "Modifications",
    "Variant / Conversion",
  ],
  animal: ["Animal Category", "Habitat", "Recommended Weapon", "Animal Species", "Animal Class"],
  character: [
    "Role",
    "Gender",
    "Born In Year",
    "Nationality",
    "Location",
    "Occupation",
    "Also Known As",
    "Performer / Actor",
    "Family",
    "Affiliation",
    "Property / Safehouse",
    "Vehicles",
  ],
  property: ["Property Type", "Property Style", "Location", "State / Region", "Vehicles Capacity", "How To Unlock", "Story Mode Price"],
  "radio-station": ["Music Genre", "Radio Host"],
  mission: ["Mission Number", "Mission Type", "Chapter", "Mission Giver", "Protagonist (Playable)", "Required for 100%", "Featuring", "Rewards"],
  gang: ["Gang Type", "Territory"],
  activity: ["Activity Type", "Location"],
} as const satisfies Record<DetailType, readonly string[]>;

/** R-819 one-category map document title. */
export function oneCategoryMapTitle(singular: string, count: number): string {
  return `All GTA 6 ${singular} Locations (${count}) | Interactive Map`;
}

/** R-819 one-category map heading. */
export function oneCategoryMapHeading(singular: string): string {
  return `GTA 6 ${singular} Locations Map`;
}

/** R-717 / R-414 ranking page h1 and title. */
export function rankingTitle(plural: string): string {
  return `GTA 6 Best ${plural} List: Stats Ranking`;
}

/** R-717 ranking list title (level 2). */
export function rankingListTitle(plural: string): string {
  return `Full List of Best ${plural} in GTA 6:`;
}

/** R-414 / R-708 comparison page title and h1. */
export function comparisonTitle(type: "vehicle" | "weapon"): string {
  return type === "vehicle" ? "GTA 6 Vehicle Comparison" : "GTA 6 Weapon Comparison";
}

/** R-414: "<text> | Leonida Atlas". */
export function siteTitle(text: string): string {
  return `${text} | ${SITE_NAME}`;
}

/** R-414: list page N ≥ 2 "<list name> - Page N | Leonida Atlas"; page 1 "<list name> | Leonida Atlas". */
export function listPageTitle(name: string, page: number): string {
  return page >= 2 ? `${name} - Page ${page} | ${SITE_NAME}` : `${name} | ${SITE_NAME}`;
}

/** R-1108 list heading: base text + the separate suffix element "- Page N" (null on page 1). */
export function listPageHeading(name: string, page: number): { text: string; suffix: string | null } {
  return { text: name, suffix: page >= 2 ? `- Page ${page}` : null };
}

/** R-010 404 texts. */
export const NOT_FOUND = {
  title: "404 Page Not Found",
  subHeading: "Get back inside the map!",
  breadcrumb: "Home › Page not found",
} as const;
