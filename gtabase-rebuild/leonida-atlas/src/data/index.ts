// Public entry of the Leonida Atlas data module (CLONE_SPEC section 19.1).
// Deterministic invented sample data (section 16); no network, no runtime randomness.

export type {
  Activity,
  Animal,
  AnimalGrid,
  ArtDescriptor,
  ArtKind,
  ArtMotif,
  ArtRef,
  Article,
  ArticleSection,
  AudioClip,
  Character,
  CharacterGrid,
  Cheat,
  CheatCategory,
  CheatDirection,
  CheatPage,
  CheatPageSection,
  ChecklistItem,
  CompareToEntry,
  DetailItem,
  DetailList,
  DetailLookup,
  FaqItem,
  Gallery,
  GalleryImage,
  GalleryMode,
  Gang,
  GuideEntry,
  Hub,
  HubCard,
  HubCardGrid,
  HubInfoRow,
  LatestItem,
  ListCardStat,
  ListConfig,
  ListEntry,
  ListFilterConfig,
  ListFilterKind,
  ListName,
  ListOption,
  ListSortField,
  Manufacturer,
  MapCategory,
  MapConfig,
  MapGroup,
  MapRegion,
  Marker,
  Mission,
  MissionKind,
  MissionObjective,
  NeighbourRef,
  PathForm,
  Plan,
  PlanFeature,
  Property,
  PropertyGrid,
  RadioStation,
  RandomEventRow,
  Rating,
  RelatedCard,
  SearchDocument,
  SearchType,
  StandoutSet,
  Track,
  Vehicle,
  VehicleClass,
  Weapon,
  WeaponClass,
  WeaponType,
} from "./types";
export type { PageCopy } from "./hub";

// catalogues
export { vehicles, vehicleClasses, manufacturers, standoutSets } from "./vehicles";
export { weapons, weaponClasses, weaponTypes } from "./weapons";
export { animals, characters, characterGuide, gangs, gangGuide, properties, radioStations, audioClips } from "./guides";
export { missions, activities, randomEvents, checklist100 } from "./missions";
export { cheats, cheatCategories, cheatPages } from "./cheats";
export { mapGroups, mapCategories, markers, mapConfig, isOnLand } from "./map";
export { articles, guideSectionLinks, articlePaths, AUTHORS as articleAuthors } from "./articles";
export { galleries } from "./galleries";
export { hub, plans, membershipFaq, guideCopy } from "./hub";

// list pages
export { listConfig, getListIndex, HIDE_STANDOUTS_VALUE, HIDE_STANDOUTS_LABEL } from "./lists";

// lookups
export {
  getItemByPath,
  getNeighbours,
  getCompareToEntries,
  getSimilarVehicles,
  getVehicleClassByPageSlug,
  getVehicleClassById,
  getWeaponClassById,
  getVehiclesOfClass,
  getVehicleBySlug,
  getWeaponBySlug,
  getVehicleByCompareKey,
  getWeaponByCompareKey,
  getManufacturerById,
  getStandoutSetById,
  getCategoryByLinkKey,
  getMapCategoryById,
  getMapGroupById,
  getMarkerById,
  getMarkersOfCategory,
  getMissionByChecklistId,
  getArticleByPath,
  listArticles,
  getGallery,
  getPageGalleries,
  latestContent,
  searchDocuments,
  displayName,
} from "./lookup";

// placeholder art
export { artFor, artPalette } from "./art";
export { art, artUrl } from "./media";
