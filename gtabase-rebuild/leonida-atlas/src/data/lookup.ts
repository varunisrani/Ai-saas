// Read-only lookups over the catalogues (section 19.1). Indexes are built lazily on first use.

import type {
  Article,
  CompareToEntry,
  DetailItem,
  DetailList,
  DetailLookup,
  Gallery,
  GuideEntry,
  LatestItem,
  ListName,
  MapCategory,
  MapGroup,
  Manufacturer,
  Marker,
  Mission,
  NeighbourRef,
  PathForm,
  SearchDocument,
  StandoutSet,
  Vehicle,
  VehicleClass,
  Weapon,
  WeaponClass,
} from "./types";
import { manufacturers, standoutSets, vehicleClasses, vehicles } from "./vehicles";
import { weaponClasses, weapons } from "./weapons";
import { animals, characters, gangs, properties, radioStations } from "./guides";
import { activities, missions } from "./missions";
import { mapCategories, mapGroups, markers } from "./map";
import { articles, guideSectionLinks } from "./articles";
import { galleries } from "./galleries";
import { hub } from "./hub";
import { lazy, naturalCompare } from "./util";

// ---------------------------------------------------------------- simple indexes

function indexBy<T, K>(items: readonly T[], key: (item: T) => K | undefined): () => Map<K, T> {
  return lazy(() => {
    const m = new Map<K, T>();
    for (const item of items) {
      const k = key(item);
      if (k !== undefined && !m.has(k)) m.set(k, item);
    }
    return m;
  });
}

const vehicleBySlug = indexBy(vehicles, (v) => v.slug);
const vehicleByKey = indexBy(vehicles, (v) => v.compareKey);
const weaponBySlug = indexBy(weapons, (w) => w.slug);
const weaponByKey = indexBy(weapons, (w) => w.compareKey);
const makeById = indexBy(manufacturers, (m) => m.id);
const setById = indexBy(standoutSets, (s) => s.id);
const vClassById = indexBy(vehicleClasses, (c) => c.id);
const vClassByPage = indexBy(vehicleClasses, (c) => c.pageSlug);
const wClassById = indexBy(weaponClasses, (c) => c.id);
const categoryByLinkKey = indexBy(mapCategories, (c) => c.linkKey);
const categoryById = indexBy(mapCategories, (c) => c.id);
const groupById = indexBy(mapGroups, (g) => g.id);
const markerById = indexBy(markers, (m) => m.id);
const articleBySlug = indexBy(articles, (a) => a.slug);
const missionByChecklistId = indexBy(missions, (m) => m.checklistId);
const galleryById = indexBy(galleries, (g) => g.id);

export const getVehicleBySlug = (slug: string): Vehicle | undefined => vehicleBySlug().get(slug);
export const getWeaponBySlug = (slug: string): Weapon | undefined => weaponBySlug().get(slug);
/** Comparison URLs and compare storage use compareKeys (R-703, R-713). */
export const getVehicleByCompareKey = (key: string): Vehicle | undefined => vehicleByKey().get(key);
export const getWeaponByCompareKey = (key: string): Weapon | undefined => weaponByKey().get(key);
export const getManufacturerById = (id: string): Manufacturer | undefined => makeById().get(id);
export const getStandoutSetById = (id: string): StandoutSet | undefined => setById().get(id);
export const getVehicleClassById = (id: string): VehicleClass | undefined => vClassById().get(id);
export const getWeaponClassById = (id: string): WeaponClass | undefined => wClassById().get(id);
export const getMapCategoryById = (id: string): MapCategory | undefined => categoryById().get(id);
export const getMapGroupById = (id: string): MapGroup | undefined => groupById().get(id);
export const getMarkerById = (id: string): Marker | undefined => markerById().get(id);
export const getMissionByChecklistId = (id: string): Mission | undefined => missionByChecklistId().get(id);

/**
 * Ranking class by its page slug (R-716). Accepts the slug with or without the "best-" prefix
 * ("super-cars" or "best-super-cars"); unknown → undefined.
 */
export function getVehicleClassByPageSlug(pageSlug: string): VehicleClass | undefined {
  return vClassByPage().get(pageSlug) ?? vClassByPage().get(pageSlug.replace(/^best-/, ""));
}

/** Vehicles that have the class (primary or second), catalogue order; the rules order rankings. */
export function getVehiclesOfClass(classId: string): Vehicle[] {
  return vehicles.filter((v) => v.classes.includes(classId));
}

/** Map category whose link key (slug, else id) equals key (R-812, R-819). */
export function getCategoryByLinkKey(key: string): MapCategory | undefined {
  return categoryByLinkKey().get(key);
}

export function getMarkersOfCategory(categoryId: string): Marker[] {
  return markers.filter((m) => m.category === categoryId);
}

/** "<Make label> <name>" — the h1 of vehicle and weapon detail pages (R-603). */
export function displayName(item: Vehicle | Weapon): string {
  const make = getManufacturerById(item.make)?.label ?? item.make;
  return `${make} ${item.name}`;
}

// ---------------------------------------------------------------- detail pages

function formOf(path: string): PathForm {
  return path.startsWith("/gta-6/") ? "gta6" : "legacy";
}

function wrap(found: DetailItem | undefined, canonicalPath: string | undefined, form: PathForm): DetailLookup | undefined {
  if (!found || !canonicalPath) return undefined;
  return { ...found, canonicalPath, isCanonical: formOf(canonicalPath) === form };
}

/**
 * Detail item for a route. `list` is the route's list word; both path forms are accepted except for
 * `strangers`, which only exists as `/gta-6/strangers/<slug>`. Unknown slug → undefined (404).
 */
export function getItemByPath(list: DetailList, slug: string, pathForm: PathForm): DetailLookup | undefined {
  switch (list) {
    case "vehicles": {
      const v = getVehicleBySlug(slug);
      return wrap(v && { type: "vehicle", item: v }, v?.canonicalPath, pathForm);
    }
    case "weapons": {
      const w = getWeaponBySlug(slug);
      return wrap(w && { type: "weapon", item: w }, w?.canonicalPath, pathForm);
    }
    case "animals": {
      const a = animals.find((x) => x.slug === slug);
      return wrap(a && { type: "animal", item: a }, a?.canonicalPath, pathForm);
    }
    case "characters": {
      const c = characters.find((x) => x.slug !== undefined && x.slug === slug);
      return wrap(c && { type: "character", item: c }, c?.canonicalPath, pathForm);
    }
    case "properties": {
      const p = properties.find((x) => x.slug === slug);
      return wrap(p && { type: "property", item: p }, p?.canonicalPath, pathForm);
    }
    case "radio-stations": {
      const r = radioStations.find((x) => x.slug === slug);
      return wrap(r && { type: "radio", item: r }, r?.canonicalPath, pathForm);
    }
    case "gangs": {
      const g = gangs.find((x) => x.slug === slug);
      return wrap(g && { type: "gang", item: g }, g?.canonicalPath, pathForm);
    }
    case "missions": {
      const m = missions.find((x) => x.slug === slug && x.kind !== "stranger");
      return wrap(m && { type: "mission", item: m }, m?.canonicalPath, pathForm);
    }
    case "strangers": {
      if (pathForm !== "gta6") return undefined;
      const m = missions.find((x) => x.slug === slug && x.kind === "stranger");
      return wrap(m && { type: "mission", item: m }, m?.canonicalPath, pathForm);
    }
    case "side-missions": {
      const a = activities.find((x) => x.slug === slug);
      return wrap(a && { type: "activity", item: a }, a?.canonicalPath, pathForm);
    }
  }
}

function catalogueOf(list: DetailList): { slug: string; name: string; path: string }[] {
  switch (list) {
    case "vehicles":
      return vehicles.map((v) => ({ slug: v.slug, name: v.name, path: v.canonicalPath }));
    case "weapons":
      return weapons.map((w) => ({ slug: w.slug, name: w.name, path: w.canonicalPath }));
    case "animals":
      return animals.map((a) => ({ slug: a.slug, name: a.name, path: a.canonicalPath }));
    case "characters":
      return characters
        .filter((c) => c.slug && c.canonicalPath)
        .map((c) => ({ slug: c.slug as string, name: c.name, path: c.canonicalPath as string }));
    case "properties":
      return properties.map((p) => ({ slug: p.slug, name: p.name, path: p.canonicalPath }));
    case "radio-stations":
      return radioStations.map((r) => ({ slug: r.slug, name: r.name, path: r.canonicalPath }));
    case "gangs":
      return gangs.map((g) => ({ slug: g.slug, name: g.name, path: g.canonicalPath }));
    case "missions":
      return missions.filter((m) => m.kind !== "stranger").map((m) => ({ slug: m.slug, name: m.title, path: m.canonicalPath }));
    case "strangers":
      return missions.filter((m) => m.kind === "stranger").map((m) => ({ slug: m.slug, name: m.title, path: m.canonicalPath }));
    case "side-missions":
      return activities.map((a) => ({ slug: a.slug, name: a.name, path: a.canonicalPath }));
  }
}

/** Previous / next item of the same list in catalogue order (R-620); none at the ends or for unknown slugs. */
export function getNeighbours(list: DetailList, slug: string): { prev?: NeighbourRef; next?: NeighbourRef } {
  const items = catalogueOf(list);
  const i = items.findIndex((x) => x.slug === slug);
  if (i < 0) return {};
  return { prev: i > 0 ? items[i - 1] : undefined, next: i < items.length - 1 ? items[i + 1] : undefined };
}

/** "Compare To" entries (R-619): same primary vehicle class / weapon class, excluding the item, A→Z by name. */
export function getCompareToEntries(list: ListName, slug: string): CompareToEntry[] {
  if (list === "vehicles") {
    const v = getVehicleBySlug(slug);
    if (!v) return [];
    return vehicles
      .filter((o) => o !== v && o.classes[0] === v.classes[0])
      .sort((a, b) => naturalCompare(a.name, b.name))
      .map((o) => ({ slug: o.slug, compareKey: o.compareKey, name: o.name }));
  }
  const w = getWeaponBySlug(slug);
  if (!w) return [];
  return weapons
    .filter((o) => o !== w && o.weaponClass === w.weaponClass)
    .sort((a, b) => naturalCompare(a.name, b.name))
    .map((o) => ({ slug: o.slug, compareKey: o.compareKey, name: o.name }));
}

/** Up to 6 regular vehicles of the same primary class and style, catalogue order (R-612, HYPOTHESIS). */
export function getSimilarVehicles(slug: string): Vehicle[] {
  const v = getVehicleBySlug(slug);
  if (!v || v.standoutSet) return [];
  return vehicles
    .filter((o) => o !== v && !o.standoutSet && o.classes[0] === v.classes[0] && o.style === v.style)
    .slice(0, 6);
}

// ---------------------------------------------------------------- articles

/** Article by slug; both path forms render it, `isCanonical` tells whether the requested form is canonical. */
export function getArticleByPath(
  pathForm: PathForm,
  slug: string,
): { article: Article; canonicalPath: string; isCanonical: boolean } | undefined {
  const a = articleBySlug().get(slug);
  if (!a) return undefined;
  return { article: a, canonicalPath: a.canonicalPath, isCanonical: a.pathForm === pathForm };
}

function entryOf(a: Article): GuideEntry {
  return { kind: "article", slug: a.slug, title: a.title, path: a.canonicalPath, image: a.hero, sortDate: a.publishedAt, article: a };
}

/**
 * Raw members of an article list (R-1101): news / all = every article, videos = video articles,
 * guides = guide articles + the fixed section links. Ordering and paging are rules (R-1102, R-1106).
 */
export function listArticles(list: "news" | "guides" | "videos" | "all"): GuideEntry[] {
  switch (list) {
    case "news":
    case "all":
      return articles.map(entryOf);
    case "videos":
      return articles.filter((a) => a.video).map(entryOf);
    case "guides":
      return [...articles.filter((a) => a.guide).map(entryOf), ...guideSectionLinks];
  }
}

// ---------------------------------------------------------------- galleries

/**
 * Gallery by id: page galleries ("screenshots", "trailers", "artworks-1".."artworks-6", "covers",
 * "map-locations-1".."map-locations-6") and item galleries ("vehicle:<slug>", "weapon:<slug>",
 * "animal:<slug>", "character:<slug>:screenshots", "character:<slug>:artworks"). Images in display order.
 * A vehicle without a gallery section (standout) → undefined; an empty gallery → images [].
 */
export function getGallery(id: string): Gallery | undefined {
  const page = galleryById().get(id);
  if (page) return page;
  const [kind, slug, part] = id.split(":");
  if (kind === "vehicle") {
    const v = getVehicleBySlug(slug);
    if (!v || v.gallery === null) return undefined;
    return { id, pagePath: v.canonicalPath, heading: `${v.name}: GTA 6 Screenshots`, mode: "strip", images: v.gallery };
  }
  if (kind === "weapon") {
    const w = getWeaponBySlug(slug);
    if (!w) return undefined;
    return { id, pagePath: w.canonicalPath, heading: `${w.name}: GTA 6 Screenshots`, mode: "strip", images: w.gallery };
  }
  if (kind === "animal") {
    const a = animals.find((x) => x.slug === slug);
    if (!a) return undefined;
    return { id, pagePath: a.canonicalPath, heading: `${a.name}: Screenshots`, mode: "strip", images: a.gallery };
  }
  if (kind === "character") {
    const c = characters.find((x) => x.slug === slug);
    if (!c || !c.canonicalPath) return undefined;
    if (part === "screenshots") return { id, pagePath: c.canonicalPath, heading: `${c.name}: Screenshots`, mode: "strip", images: c.screenshots };
    if (part === "artworks") return { id, pagePath: c.canonicalPath, heading: `${c.name}: Artworks`, mode: "strip", images: c.artworks };
  }
  return undefined;
}

/** Page galleries shown on a page, in block order. */
export function getPageGalleries(pagePath: string): Gallery[] {
  return galleries.filter((g) => g.pagePath === pagePath);
}

// ---------------------------------------------------------------- side column

function sectionOf(a: Article): string {
  return a.video ? "Videos" : a.guide ? "Guides" : "News";
}

/**
 * Side-column items (R-1313; HYPOTHESIS for the mix): the newest articles by date fill the first
 * `limit - 2` slots, then the newest vehicle and the newest weapon (by `addedAt`), each with its section name.
 */
export function latestContent(limit = 8): LatestItem[] {
  const newestArticles = articles
    .slice()
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : a.slug < b.slug ? 1 : -1));
  const others: LatestItem[] = [];
  const newest = <T extends { addedAt: string }>(items: readonly T[]) =>
    items.reduce((best, x) => (x.addedAt > best.addedAt ? x : best), items[0]);
  const v = newest(vehicles);
  const w = newest(weapons);
  others.push({ title: displayName(v), path: v.canonicalPath, section: "Vehicles", date: v.addedAt, image: v.image });
  others.push({ title: displayName(w), path: w.canonicalPath, section: "Weapons", date: w.addedAt, image: w.image });
  const articleSlots = Math.max(0, limit - others.length);
  const items: LatestItem[] = newestArticles.slice(0, articleSlots).map((a) => ({
    title: a.title,
    path: a.canonicalPath,
    section: sectionOf(a),
    date: a.publishedAt,
    image: a.hero,
  }));
  return [...items, ...others].slice(0, limit);
}

// ---------------------------------------------------------------- local search (R-1308)

const searchIndex = lazy<SearchDocument[]>(() => {
  const docs: SearchDocument[] = [];
  const seenHub = new Set<string>();
  for (const grid of hub.cardGrids) {
    for (const c of grid.cards) {
      if (seenHub.has(c.path)) continue;
      seenHub.add(c.path);
      docs.push({ type: "hub", typeLabel: "GTA 6 sections", title: c.label, extra: grid.heading, path: c.path });
    }
  }
  for (const v of vehicles) {
    docs.push({ type: "vehicle", typeLabel: "Vehicles", title: displayName(v), extra: v.classes.map((c) => getVehicleClassById(c)?.label).join(", "), path: v.canonicalPath });
  }
  for (const w of weapons) {
    docs.push({ type: "weapon", typeLabel: "Weapons", title: displayName(w), extra: getWeaponClassById(w.weaponClass)?.label, path: w.canonicalPath });
  }
  for (const a of animals) docs.push({ type: "animal", typeLabel: "Animals", title: a.name, path: a.canonicalPath });
  for (const c of characters) {
    if (c.canonicalPath) docs.push({ type: "character", typeLabel: "Characters", title: c.name, extra: c.role, path: c.canonicalPath });
  }
  for (const g of gangs) docs.push({ type: "gang", typeLabel: "Gangs & Factions", title: g.name, extra: g.type, path: g.canonicalPath });
  for (const p of properties) docs.push({ type: "property", typeLabel: "Properties", title: p.name, extra: p.propertyType, path: p.canonicalPath });
  for (const r of radioStations) docs.push({ type: "radio", typeLabel: "Radio Stations", title: r.name, extra: r.genre, path: r.canonicalPath });
  for (const m of missions) docs.push({ type: "mission", typeLabel: "Missions", title: m.title, extra: m.chapter, path: m.canonicalPath });
  for (const a of activities) docs.push({ type: "activity", typeLabel: "Activities", title: a.name, extra: a.activityType, path: a.canonicalPath });
  for (const a of articles) docs.push({ type: "article", typeLabel: "Articles", title: a.title, extra: a.shortTitle, path: a.canonicalPath, date: a.publishedAt });
  for (const c of mapCategories) {
    docs.push({ type: "map-category", typeLabel: "Map Categories", title: c.name, extra: getMapGroupById(c.group)?.name, path: `/gta-6/map/?feature=${c.linkKey}` });
  }
  return docs;
});

/** One document per searchable thing, grouped by type in the order of R-1308. */
export function searchDocuments(): SearchDocument[] {
  return searchIndex();
}
