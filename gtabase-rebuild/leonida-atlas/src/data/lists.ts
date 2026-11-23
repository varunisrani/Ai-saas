// List pages (F1): configuration with the exact hash keys and labels of R-505 / section 5.2, and the
// compact per-item index the list widget filters, sorts and renders in the browser (R-501).

import type { ListConfig, ListEntry, ListName, ListOption } from "./types";
import { manufacturers, standoutSets, vehicleClasses, vehicles } from "./vehicles";
import { weaponClasses, weaponTypes, weapons } from "./weapons";
import { lazy, naturalCompare } from "./util";

const makeById = new Map(manufacturers.map((m) => [m.id, m]));
const vClassById = new Map(vehicleClasses.map((c) => [c.id, c]));
const wClassById = new Map(weaponClasses.map((c) => [c.id, c]));
const setById = new Map(standoutSets.map((s) => [s.id, s]));

export const HIDE_STANDOUTS_VALUE = "hide-standouts";
export const HIDE_STANDOUTS_LABEL = "Hide Standout Vehicles";

const vehicleIndex = lazy<ListEntry[]>(() =>
  vehicles.map((v) => {
    const make = makeById.get(v.make);
    return {
      list: "vehicles",
      slug: v.slug,
      compareKey: v.compareKey,
      canonicalPath: v.canonicalPath,
      position: v.position,
      name: v.name,
      makeId: v.make,
      makeLabel: make?.label ?? v.make,
      makeLogo: make?.logo ?? { kind: "logo", id: v.make },
      classIds: v.classes.slice(),
      classLabels: v.classes.map((c) => vClassById.get(c)?.label ?? c),
      standoutValue: v.standoutSet ?? HIDE_STANDOUTS_VALUE,
      standoutLabel: v.standoutSet ? setById.get(v.standoutSet)?.label : undefined,
      isStandout: v.standoutSet !== undefined,
      isUniqueVariant: false,
      realLife: v.realLife,
      speed: v.speed,
      offroadRating: v.offroadRating,
      roadRating: v.roadRating,
      seats: v.seats,
      editions: v.editions.slice(),
      image: v.image,
    };
  }),
);

const weaponIndex = lazy<ListEntry[]>(() =>
  weapons.map((w) => {
    const make = makeById.get(w.make);
    return {
      list: "weapons",
      slug: w.slug,
      compareKey: w.compareKey,
      canonicalPath: w.canonicalPath,
      position: w.position,
      name: w.name,
      makeId: w.make,
      makeLabel: make?.label ?? w.make,
      makeLogo: make?.logo ?? { kind: "logo", id: w.make },
      classIds: [w.weaponClass],
      classLabels: [wClassById.get(w.weaponClass)?.label ?? w.weaponClass],
      isStandout: false,
      weaponType: w.type,
      isUniqueVariant: w.type === "unique-variant",
      realLife: w.realLife,
      damage: w.damage,
      accuracy: w.accuracy,
      handling: w.handling,
      range: w.range,
      overall: w.overall,
      price: w.price,
      editions: [],
      image: w.image,
    };
  }),
);

/** Compact entries of every item in catalogue order; missing values stay missing (never 0). */
export function getListIndex(list: ListName): ListEntry[] {
  return list === "vehicles" ? vehicleIndex() : weaponIndex();
}

// ---------------------------------------------------------------- options (R-506, R-507)

function presentClassOptions(list: ListName): ListOption[] {
  const present = new Set(getListIndex(list).flatMap((e) => e.classIds));
  const classes = list === "vehicles" ? vehicleClasses : weaponClasses;
  return classes.filter((c) => present.has(c.id)).map((c) => ({ value: c.id, label: c.label }));
}

function presentMakeOptions(list: ListName): ListOption[] {
  const present = new Set(getListIndex(list).map((e) => e.makeId));
  return manufacturers
    .filter((m) => present.has(m.id))
    .slice()
    .sort((a, b) => naturalCompare(a.label, b.label))
    .map((m) => ({ value: m.id, label: m.label }));
}

function standoutOptions(): ListOption[] {
  const present = new Set(vehicles.map((v) => v.standoutSet).filter((s): s is string => !!s));
  return [
    { value: HIDE_STANDOUTS_VALUE, label: HIDE_STANDOUTS_LABEL },
    ...standoutSets.filter((s) => present.has(s.id)).map((s) => ({ value: s.id, label: s.label })),
  ];
}

// ---------------------------------------------------------------- configs (section 5.2)

const vehicleConfig = lazy<ListConfig>(() => ({
  list: "vehicles",
  path: "/gta-6/vehicles/",
  compareType: "vehicle",
  comparisonPath: "/gta-6/vehicles/comparison/",
  pluralNoun: "Vehicles",
  singularNoun: "Vehicle",
  filters: [
    { id: "name", title: "Vehicle Name", placeholder: "Enter Vehicle Name", hashKey: "name", kind: "text", field: "name", multiValue: false, options: [], maxLength: 128 },
    { id: "class", title: "Vehicle Class", placeholder: "", hashKey: "attr.ct1.value", kind: "tiles", field: "classIds", multiValue: true, optionSource: "classes", options: presentClassOptions("vehicles") },
    { id: "manufacturer", title: "Manufacturer", placeholder: "Select Manufacturer", hashKey: "attr.ct2.value", kind: "dropdown-search", field: "makeId", multiValue: false, optionSource: "manufacturers", options: presentMakeOptions("vehicles") },
    { id: "standout", title: "Standout Set", placeholder: "Select Standout Set", hashKey: "attr.ct734.value", kind: "dropdown-search", field: "standoutValue", multiValue: false, optionSource: "standout-sets", options: standoutOptions() },
    { id: "real-life", title: "Real Life Vehicle", placeholder: "Enter Real Life Vehicle", hashKey: "attr.ct72.value", kind: "text", field: "realLife", multiValue: false, options: [], maxLength: 128 },
  ],
  sortFields: [
    { id: "name", label: "Vehicle Name", hashKey: "name", field: "name", valueType: "text", multiValue: false },
    { id: "manufacturer", label: "Manufacturer", hashKey: "attr.ct2.frontend_value", field: "makeLabel", valueType: "text", multiValue: false },
    { id: "class", label: "Vehicle Class", hashKey: "attr.ct1.frontend_value", field: "classLabels", valueType: "class-labels", multiValue: true },
    { id: "speed", label: "Speed", hashKey: "attr.ct6.frontend_value", field: "speed", valueType: "number", multiValue: false },
    { id: "asphalt", label: "Asphalt OVR", hashKey: "attr.ct665.frontend_value", field: "roadRating", valueType: "number", multiValue: false },
    { id: "offroad", label: "Off-Road OVR", hashKey: "attr.ct10.frontend_value", field: "offroadRating", valueType: "number", multiValue: false },
    { id: "seats", label: "Seats", hashKey: "attr.ct11.frontend_value", field: "seats", valueType: "number", multiValue: true },
  ],
  defaultSort: { hashKey: "attr.ct6.frontend_value", direction: "desc" },
  sortLabel: "Sort By",
  card: {
    classLabel: "Class",
    makeLabel: "Make",
    nameLabel: "Name",
    basedOnLabel: "Based On",
    stats: [
      { label: "Speed", field: "speed", scale: 10, alwaysShown: true },
      { label: "Off-Road", field: "offroadRating", scale: 1000, alwaysShown: true },
      { label: "Road", field: "roadRating", scale: 1000, alwaysShown: true },
    ],
    standoutBadge: "★ Standout",
    seatsBadge: true,
    pricePill: false,
  },
  listHead: ["Make", "Name", "Class", "Real Life Vehicle", "Speed", "Off-Road", "Road"],
  pageSize: 100,
}));

const weaponConfig = lazy<ListConfig>(() => ({
  list: "weapons",
  path: "/gta-6/weapons/",
  compareType: "weapon",
  comparisonPath: "/gta-6/weapons/comparison/",
  pluralNoun: "Weapons",
  singularNoun: "Weapon",
  filters: [
    { id: "name", title: "Weapon Name", placeholder: "Enter Weapon Name", hashKey: "name", kind: "text", field: "name", multiValue: false, options: [], maxLength: 128 },
    { id: "class", title: "Weapon Class", placeholder: "", hashKey: "attr.ct55.value", kind: "tiles", field: "classIds", multiValue: true, optionSource: "classes", options: presentClassOptions("weapons") },
    { id: "manufacturer", title: "Manufacturer", placeholder: "Select Manufacturer", hashKey: "attr.ct2.value", kind: "dropdown-search", field: "makeId", multiValue: false, optionSource: "manufacturers", options: presentMakeOptions("weapons") },
    { id: "weapon-type", title: "Weapon Type", placeholder: "Select Weapon Type", hashKey: "attr.ct246.value", kind: "dropdown", field: "weaponType", multiValue: false, optionSource: "weapon-types", options: weaponTypes.map((t) => ({ value: t.id, label: t.label })) },
    { id: "real-life", title: "Real Life Weapon", placeholder: "Enter Real Life Weapon", hashKey: "attr.ct72.value", kind: "text", field: "realLife", multiValue: false, options: [], maxLength: 128 },
  ],
  sortFields: [
    { id: "name", label: "Weapon Name", hashKey: "name", field: "name", valueType: "text", multiValue: false },
    { id: "class", label: "Weapon Class", hashKey: "attr.ct55.frontend_value", field: "classLabels", valueType: "class-labels", multiValue: true },
    { id: "price", label: "Price", hashKey: "attr.ct57.frontend_value", field: "price", valueType: "number", multiValue: false },
    { id: "manufacturer", label: "Manufacturer", hashKey: "attr.ct2.frontend_value", field: "makeLabel", valueType: "text", multiValue: false },
    { id: "damage", label: "Damage", hashKey: "attr.ct58.frontend_value", field: "damage", valueType: "number", multiValue: false },
    { id: "accuracy", label: "Accuracy", hashKey: "attr.ct60.frontend_value", field: "accuracy", valueType: "number", multiValue: false },
    { id: "range", label: "Range", hashKey: "attr.ct61.frontend_value", field: "range", valueType: "number", multiValue: false },
    { id: "overall", label: "Overall Rating", hashKey: "attr.ct10.frontend_value", field: "overall", valueType: "number", multiValue: false },
    { id: "handling", label: "Handling", hashKey: "attr.ct9.frontend_value", field: "handling", valueType: "number", multiValue: false },
  ],
  defaultSort: { hashKey: "name", direction: "asc" },
  sortLabel: "Sort By",
  card: {
    classLabel: "Type",
    makeLabel: "Make",
    nameLabel: "Name",
    basedOnLabel: "Based On",
    stats: [{ label: "Damage", field: "damage", scale: 10, alwaysShown: false }],
    uniqueBadge: "★ Unique Variant",
    seatsBadge: false,
    pricePill: true,
  },
  listHead: ["Make", "Name", "Class", "Real Life Weapon", "Damage", "Price"],
  pageSize: 100,
}));

/** Filters, sort fields, defaults and card labels of a list page (exact keys and labels of R-505). */
export function listConfig(list: ListName): ListConfig {
  return list === "vehicles" ? vehicleConfig() : weaponConfig();
}
