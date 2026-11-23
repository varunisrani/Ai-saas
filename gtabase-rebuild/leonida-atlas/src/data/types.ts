// Entity types of the Leonida Atlas sample data (CLONE_SPEC section 1.1, section 19.1).
// Optional fields are left `undefined` when the item has no value (never 0 / empty string), so the rules
// and the UI can apply the missing-value rules of R-406.

// ---------------------------------------------------------------- art

export type ArtKind =
  | "vehicle"
  | "weapon"
  | "animal"
  | "character"
  | "gang"
  | "property"
  | "station"
  | "mission"
  | "activity"
  | "article"
  | "shot"
  | "logo"
  | "card"
  | "banner"
  | "map"
  | "marker"
  | "video";

/** Reference to a generated placeholder image, served at `/art/<kind>/<id>.svg`. */
export interface ArtRef {
  kind: ArtKind;
  id: string;
}

export type ArtMotif =
  | "silhouette"
  | "bars"
  | "leaf"
  | "wave"
  | "bust"
  | "horizon"
  | "dunes"
  | "monogram"
  | "island"
  | "play";

/** Everything the UI needs to draw a placeholder SVG (section 20, D-UI-6). */
export interface ArtDescriptor {
  kind: ArtKind;
  id: string;
  width: number;
  height: number;
  /** Two indices into `artPalette` (gradient from → to). */
  palette: [number, number];
  motif: ArtMotif;
  /** Small caption label drawn on the image (monogram letters for logos). */
  label: string;
  /** 0..7, lets the motif vary deterministically between images of the same kind. */
  variant: number;
}

export interface Rating {
  /** Average 0–5 with one decimal (0 when there are no votes). */
  average: number;
  votes: number;
}

export interface GalleryImage {
  id: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  art: ArtRef;
}

// ---------------------------------------------------------------- vehicles & weapons

export interface VehicleClass {
  id: string;
  label: string;
  tileOrder: number;
  /** Singular noun used in vehicle document titles (R-603). */
  titleNoun: string;
  /** Ranking page slug without the "best-" prefix (R-716), e.g. "super-cars". */
  pageSlug: string;
  /** "Super Cars", "Boats", "Off-Road Vehicles" (R-716). */
  pluralLabel: string;
  /** "/gta-6/vehicles/best-super-cars/" */
  rankingPath: string;
}

export interface WeaponClass {
  id: string;
  label: string;
  tileOrder: number;
}

export interface Manufacturer {
  id: string;
  label: string;
  /** Which database the make belongs to. */
  domain: "vehicle" | "weapon";
  /** Monogram letters of the placeholder roundel logo. */
  monogram: string;
  logo: ArtRef;
}

export interface StandoutSet {
  id: string;
  label: string;
  order: number;
}

export interface Vehicle {
  slug: string;
  compareKey: string;
  canonicalPath: string;
  /** 1-based catalogue order (R-1606). */
  position: number;
  name: string;
  /** Manufacturer id. */
  make: string;
  /** 1–2 class ids, first = primary. */
  classes: string[];
  /** Standout set id; undefined = regular vehicle. */
  standoutSet?: string;
  /** Slug of the regular base vehicle (standout vehicles only). */
  baseModel?: string;
  realLife?: string;
  speed?: number;
  acceleration?: number;
  asphaltHandling?: number;
  offroadHandling?: number;
  strength?: number;
  offroadRating?: number;
  roadRating?: number;
  seats: number;
  style?: string;
  era?: string;
  specialist?: string;
  mass?: string;
  driveTrain?: string;
  gears?: string;
  editions: string[];
  notableOwners: string[];
  appearances: string[];
  howToGet?: string;
  description: string;
  image: ArtRef;
  /** null = no gallery section (standout vehicles); [] = empty gallery ("Coming soon."). */
  gallery: GalleryImage[] | null;
  rating: Rating;
  /** Slugs of the standout vehicles based on this one, catalogue order (computed). */
  variants: string[];
  /** When the item was added to the sample database (UTC, used by latestContent). */
  addedAt: string;
}

export type WeaponType = "base-weapon" | "unique-variant";

export interface Weapon {
  slug: string;
  compareKey: string;
  canonicalPath: string;
  position: number;
  name: string;
  make: string;
  weaponClass: string;
  type: WeaponType;
  /** Slug of the base weapon (unique variants only). */
  baseModel?: string;
  realLife?: string;
  damage?: number;
  accuracy?: number;
  handling?: number;
  range?: number;
  overall?: number;
  /** Whole dollars. */
  price?: number;
  ammoCapacity?: string;
  extendedAmmo?: string;
  acquisitionMethod?: string;
  storyModePrice?: string;
  modifications?: string;
  howToUnlock?: string;
  /** Slugs of the unique variants of this base weapon (computed). */
  variants: string[];
  appearances: string[];
  /** Unique variants have no description section (R-606). */
  description?: string;
  image: ArtRef;
  gallery: GalleryImage[];
  rating: Rating;
  addedAt: string;
}

// ---------------------------------------------------------------- guide items

export type AnimalGrid = "land" | "birds" | "sea";

export interface Animal {
  slug: string;
  canonicalPath: string;
  position: number;
  name: string;
  grid: AnimalGrid;
  animalCategory?: string;
  habitat?: string;
  recommendedWeapon?: string;
  species?: string;
  animalClass?: string;
  description: string;
  image: ArtRef;
  gallery: GalleryImage[];
  rating: Rating;
}

export type CharacterGrid = "protagonists" | "main" | "supporting" | "minor" | "other";

export interface Character {
  /** Undefined for "other" rows, which have no page. */
  slug?: string;
  canonicalPath?: string;
  position: number;
  name: string;
  grid: CharacterGrid;
  role?: string;
  gender?: string;
  bornInYear?: string;
  nationality?: string;
  location?: string;
  occupation?: string;
  alsoKnownAs?: string;
  /** Invented value or "Not yet announced"; never a real person. */
  performer?: string;
  family?: string;
  affiliation?: string;
  propertySafehouse?: string;
  /** Vehicle slugs. */
  vehicles: string[];
  screenshots: GalleryImage[];
  artworks: GalleryImage[];
  /** Placeholder video (D-022). */
  video?: ArtRef;
  description: string;
  image: ArtRef;
  rating: Rating;
}

export interface Gang {
  slug: string;
  canonicalPath: string;
  position: number;
  name: string;
  grid: "gangs" | "law";
  type?: string;
  territory?: string;
  description: string;
  image: ArtRef;
  rating: Rating;
}

export type PropertyGrid = "purchasable" | "story" | "edition" | "safehouse";

export interface Property {
  slug: string;
  canonicalPath: string;
  position: number;
  name: string;
  grid: PropertyGrid;
  propertyType?: string;
  propertyStyle?: string;
  location?: string;
  region?: string;
  vehicleCapacity?: number;
  howToUnlock?: string;
  /** Whole dollars, purchasable properties only. */
  price?: number;
  /** Own text of the "How to get the <NAME>:" section (R-615). */
  howToGet: string;
  mapImage: ArtRef;
  /** Map position (map units) and the related marker, when the property is on the map. */
  mapX?: number;
  mapY?: number;
  markerId?: string;
  description: string;
  image: ArtRef;
  rating: Rating;
}

export interface Track {
  number: number;
  title: string;
  artist: string;
  year: number;
  /** Audio clip id; undefined = row not playable (R-1014). */
  audioClip?: string;
}

export interface RadioStation {
  slug: string;
  canonicalPath: string;
  position: number;
  name: string;
  genre: string;
  host: string;
  tracks: Track[];
  description: string;
  image: ArtRef;
  rating: Rating;
}

/** Own synthesized tone recipe; the UI renders it once to `public/audio/<id>.wav` (section 19.3). */
export interface AudioClip {
  id: string;
  /** Public file path, e.g. "/audio/clip-1.wav". */
  file: string;
  label: string;
  /** Length in seconds (6–12). */
  seconds: number;
  /** Root frequency in Hz. */
  baseHz: number;
  /** Melody as semitone offsets from the root, one per beat, looped. */
  steps: number[];
  bpm: number;
  waveform: "sine" | "triangle" | "square" | "sawtooth";
  sampleRate: number;
}

export type MissionKind = "main" | "optional" | "stranger";

export interface MissionObjective {
  heading: string;
  text: string;
}

export interface Mission {
  /** Text of digits, unique in list `gta6-missions`. */
  checklistId: string;
  slug: string;
  canonicalPath: string;
  position: number;
  kind: MissionKind;
  /** "Prologue", "Chapter 1".."Chapter 5". */
  chapter: string;
  /** 1–4, stranger missions only. */
  strangersChapter?: number;
  /** 1..N in story order, main missions only. */
  number?: number;
  title: string;
  /** Badge texts, stored in capitals (R-1511). */
  badges: string[];
  giver?: string;
  protagonist?: string;
  missionType?: string;
  requiredFor100?: string;
  featuring?: string;
  rewards?: string;
  /** One-line card description. */
  summary: string;
  walkthrough: string[];
  objectives: MissionObjective[];
  trophies: string;
  listedOnStrangersPage: boolean;
  image: ArtRef;
  rating: Rating;
}

export interface Activity {
  slug: string;
  canonicalPath: string;
  position: number;
  name: string;
  activityType: string;
  location: string;
  /** One-line card text. */
  summary: string;
  description: string;
  image: ArtRef;
  rating: Rating;
}

export interface RandomEventRow {
  event: string;
  location: string;
  reward: string;
  status: string;
}

export type CheatDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface CheatCategory {
  /** Anchor id, e.g. "player-cheats". */
  id: string;
  label: string;
  order: number;
}

export interface Cheat {
  id: string;
  category: string;
  name: string;
  effect: string;
  unlock: string;
  sequence: CheatDirection[];
}

export interface CheatPageSection {
  heading: string;
  anchor: string;
  body: string[];
}

export interface CheatPage {
  platform: "ps5" | "xbox" | "pc";
  path: string;
  /** Platform card / table label, e.g. "GTA 6 Cheats for PS5". */
  platformLabel: string;
  /** Own page title (W2). */
  title: string;
  shortTitle: string;
  intro: string;
  /** First indexed section ("How to Enter GTA 6 Cheats on PS5" / "How Many Cheats Are There in GTA 6?"). */
  firstSection: CheatPageSection;
  /** Numbered steps of the "How to enter" section (consoles only). */
  howToSteps: string[];
  /** Exactly three icon alts for the steps (consoles only): UP + the two shoulder buttons. */
  howToIcons: string[];
  /** Own sections after the cheat categories (consoles: 2) or after the first section (PC: 6). */
  ownSections: CheatPageSection[];
}

// ---------------------------------------------------------------- checklist

export interface ChecklistItem {
  id: string;
  /** Label as shown, ending with its weight, e.g. "Tasks (27%)". */
  label: string;
  parent?: string;
  weight?: number;
  limit?: number;
  multiplier: number;
  group?: string;
  /** Own text of the item's section. */
  description: string;
}

// ---------------------------------------------------------------- map

export interface MapGroup {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface MapCategory {
  id: string;
  name: string;
  /** Used in one-category titles (R-819, R-1609). */
  singularName: string;
  group: string;
  trackable: boolean;
  hiddenByDefault: boolean;
  multiSpawn: boolean;
  slug?: string;
  /** slug when present, otherwise id (R-812). */
  linkKey: string;
  closedToSuggestions: boolean;
  color?: string;
  /** 1-based config order (R-1609). */
  order: number;
  markerCount: number;
  /** Distinct marker names (multi-spawn categories count names once, R-811). */
  distinctCount: number;
}

export interface Marker {
  /** `<category id>-<3 digits>`. */
  id: string;
  name: string;
  category: string;
  /** East. */
  x: number;
  /** North. */
  y: number;
  /** ";"-separated sentences; "Label: value" parts become rows. */
  description?: string;
  image?: ArtRef;
  /** A rebuild path. */
  detailsPath?: string;
}

export interface MapRegion {
  id: string;
  name: string;
  labelX: number;
  labelY: number;
}

export interface MapConfig {
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  minZoom: number;
  maxZoom: number;
  startZoom: number;
  closeZoom: number;
  clusterBelowZoom: number;
  startMarkerId: string;
  /** Island outline (map units, clockwise), drawn by the UI and used to keep markers on land. */
  island: [number, number][];
  /** Lagoons cut out of the island. */
  lagoons: [number, number][][];
  /** Main roads as polylines (thin sand lines, D-UI-6). */
  roads: [number, number][][];
  regions: MapRegion[];
  notice: { start: string; end: string; heading: string; text: string };
}

// ---------------------------------------------------------------- articles

export interface ArticleSection {
  heading: string;
  /** Heading slug (R-413). */
  anchor: string;
  /** Left out of the table of contents (and gets no anchor element). */
  noIndex: boolean;
  body: string[];
}

export interface RelatedCard {
  title: string;
  path: string;
  image: ArtRef;
}

export interface Article {
  slug: string;
  canonicalPath: string;
  pathForm: PathForm;
  title: string;
  /** Table-of-contents heading. */
  shortTitle: string;
  /** One-line teaser (own). */
  summary: string;
  publishedAt: string;
  modifiedAt?: string;
  showModified: boolean;
  showAuthor: boolean;
  author: string;
  authorBio?: string;
  guide: boolean;
  video: boolean;
  hero: ArtRef;
  heroAlt: string;
  sections: ArticleSection[];
  toc: boolean;
  related?: { heading: string; cards: RelatedCard[] };
  videoPlaceholder?: ArtRef;
}

/** A member of an article list: an article, or (guides list only) a fixed section link. */
export interface GuideEntry {
  kind: "article" | "section";
  slug: string;
  title: string;
  path: string;
  image: ArtRef;
  /** Sort date (UTC) = publishedAt for articles. */
  sortDate: string;
  article?: Article;
}

// ---------------------------------------------------------------- galleries

export type GalleryMode = "grid" | "cover" | "embedded" | "strip";

export interface Gallery {
  id: string;
  /** Page that shows the gallery. */
  pagePath: string;
  heading?: string;
  mode: GalleryMode;
  images: GalleryImage[];
}

// ---------------------------------------------------------------- hub, membership, search

export interface HubCard {
  label: string;
  path: string;
  image: ArtRef;
}

export interface HubCardGrid {
  id: string;
  /** Level-2 heading; undefined for the first grid. */
  heading?: string;
  cards: HubCard[];
}

export interface HubInfoRow {
  label: string;
  values: { text: string; href?: string }[];
}

export interface Hub {
  title: string;
  banner: ArtRef;
  infoTitle: string;
  infoRows: HubInfoRow[];
  /** "2026-11-19": countdown target, midnight in the viewer's time zone (R-1318). */
  releaseDate: string;
  countdownTitle: string;
  aboutHeading: string;
  about: string[];
  cardGrids: HubCardGrid[];
  latestNewsHeading: string;
  latestNewsCount: number;
  allNewsLink: { text: string; href: string };
  sectionHeadings: string[];
}

export interface FaqItem {
  alias: string;
  question: string;
  answer: string;
  openByDefault: boolean;
}

export interface PlanFeature {
  /** Token key of the feature (plan-free-favorites …), when the spec names one. */
  key?: string;
  title: string;
  subtitle: string;
}

export interface Plan {
  id: "free" | "vip-year" | "vip-month";
  title: string;
  priceLine: string;
  recommended: boolean;
  badge?: string;
  features: PlanFeature[];
}

export type SearchType =
  | "hub"
  | "vehicle"
  | "weapon"
  | "animal"
  | "character"
  | "gang"
  | "property"
  | "radio"
  | "mission"
  | "activity"
  | "article"
  | "map-category";

export interface SearchDocument {
  type: SearchType;
  /** Group heading on the search page. */
  typeLabel: string;
  title: string;
  /** Short title of articles (also searched), category group etc. */
  extra?: string;
  path: string;
  /** Articles: publishedAt (newest first inside the group). */
  date?: string;
}

export interface LatestItem {
  title: string;
  path: string;
  /** Section name shown with the item ("News", "Guides", "Videos", "Vehicles", "Weapons"). */
  section: string;
  date: string;
  image: ArtRef;
}

// ---------------------------------------------------------------- list pages (F1)

export type ListName = "vehicles" | "weapons";

export interface ListEntry {
  list: ListName;
  slug: string;
  compareKey: string;
  canonicalPath: string;
  position: number;
  /** Item name without make (card heading "Name"). */
  name: string;
  makeId: string;
  makeLabel: string;
  makeLogo: ArtRef;
  classIds: string[];
  classLabels: string[];
  /** Vehicles: standout set id, or "hide-standouts" for regular vehicles. */
  standoutValue?: string;
  standoutLabel?: string;
  isStandout: boolean;
  /** Weapons only. */
  weaponType?: WeaponType;
  isUniqueVariant: boolean;
  realLife?: string;
  speed?: number;
  offroadRating?: number;
  roadRating?: number;
  seats?: number;
  damage?: number;
  accuracy?: number;
  handling?: number;
  range?: number;
  overall?: number;
  price?: number;
  editions: string[];
  image: ArtRef;
}

export type ListFilterKind = "text" | "tiles" | "dropdown-search" | "dropdown";

export interface ListOption {
  value: string;
  label: string;
}

export interface ListFilterConfig {
  id: "name" | "class" | "manufacturer" | "standout" | "weapon-type" | "real-life";
  title: string;
  /** Text placeholder ("Enter Vehicle Name") or dropdown placeholder entry ("Select Manufacturer"). */
  placeholder: string;
  hashKey: string;
  kind: ListFilterKind;
  /** ListEntry field the filter matches. */
  field: "name" | "classIds" | "makeId" | "standoutValue" | "weaponType" | "realLife";
  multiValue: boolean;
  optionSource?: "classes" | "manufacturers" | "standout-sets" | "weapon-types";
  /** Choice filters: options in display order (values present in the data only, R-507). */
  options: ListOption[];
  /** Text filters: maximum length (R-508). */
  maxLength?: number;
}

export interface ListSortField {
  id: "name" | "manufacturer" | "class" | "speed" | "asphalt" | "offroad" | "seats" | "price" | "damage" | "accuracy" | "range" | "overall" | "handling";
  label: string;
  hashKey: string;
  field: keyof ListEntry;
  /** "class-labels" compares display labels; numbers compare numerically. */
  valueType: "text" | "number" | "class-labels";
  multiValue: boolean;
}

export interface ListCardStat {
  label: string;
  field: "speed" | "offroadRating" | "roadRating" | "damage";
  /** 10 = "<value>/10" bar value × 10 %; 1000 = raw rating, bar value ÷ 10 %. */
  scale: 10 | 1000;
  /** true = always drawn ("?" when missing); false = only when known (weapons' Damage, R-534). */
  alwaysShown: boolean;
}

export interface ListConfig {
  list: ListName;
  /** "/gta-6/vehicles/" */
  path: string;
  /** Comparison URL type word ("vehicle"/"weapon"). */
  compareType: "vehicle" | "weapon";
  comparisonPath: string;
  pluralNoun: string;
  singularNoun: string;
  filters: ListFilterConfig[];
  sortFields: ListSortField[];
  defaultSort: { hashKey: string; direction: "asc" | "desc" };
  sortLabel: string;
  card: {
    classLabel: string;
    makeLabel: string;
    nameLabel: string;
    basedOnLabel: string;
    stats: ListCardStat[];
    standoutBadge?: string;
    uniqueBadge?: string;
    seatsBadge: boolean;
    pricePill: boolean;
  };
  /** List-mode header row (R-535). */
  listHead: string[];
  pageSize: number;
}

// ---------------------------------------------------------------- detail lookups

export type DetailList =
  | "vehicles"
  | "weapons"
  | "animals"
  | "characters"
  | "properties"
  | "radio-stations"
  | "gangs"
  | "missions"
  | "strangers"
  | "side-missions";

/** "gta6" = `/gta-6/<list>/<slug>`; "legacy" = `/<list>/gta-6/<slug>` (`/soundtrack/gta-6/…` for radio). */
export type PathForm = "gta6" | "legacy";

export type DetailItem =
  | { type: "vehicle"; item: Vehicle }
  | { type: "weapon"; item: Weapon }
  | { type: "animal"; item: Animal }
  | { type: "character"; item: Character }
  | { type: "property"; item: Property }
  | { type: "radio"; item: RadioStation }
  | { type: "gang"; item: Gang }
  | { type: "mission"; item: Mission }
  | { type: "activity"; item: Activity };

export type DetailLookup = DetailItem & {
  canonicalPath: string;
  /** True when the requested path form is the item's canonical one. */
  isCanonical: boolean;
};

export interface NeighbourRef {
  slug: string;
  name: string;
  path: string;
}

export interface CompareToEntry {
  slug: string;
  compareKey: string;
  name: string;
}
