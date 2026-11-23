/**
 * Test-only fixtures for the rule tests (not exported from index.ts). The list rules follow the hash keys and
 * defaults of CLONE_SPEC §5.2; the entries are tiny invented samples shaped like the data module's ListEntry.
 */
import type { ListRules } from "./list-hash";

export const VEHICLE_RULES: ListRules = {
  filters: [
    { key: "name", kind: "text", field: "name" },
    { key: "attr.ct1.value", kind: "tiles", field: "classIds" },
    { key: "attr.ct2.value", kind: "dropdown", field: "makeId" },
    { key: "attr.ct734.value", kind: "dropdown", field: "standout" },
    { key: "attr.ct72.value", kind: "text", field: "realLife" },
  ],
  sorts: [
    { key: "name", field: "name", label: "Vehicle Name" },
    { key: "attr.ct2.frontend_value", field: "makeLabel", label: "Manufacturer" },
    { key: "attr.ct1.frontend_value", field: "classLabels", label: "Vehicle Class" },
    { key: "attr.ct6.frontend_value", field: "speed", label: "Speed" },
    { key: "attr.ct665.frontend_value", field: "roadRating", label: "Asphalt OVR" },
    { key: "attr.ct10.frontend_value", field: "offroadRating", label: "Off-Road OVR" },
    { key: "attr.ct11.frontend_value", field: "seats", label: "Seats" },
  ],
  defaultSort: "attr.ct6.frontend_value",
  defaultDir: "desc",
};

export const WEAPON_RULES: ListRules = {
  filters: [
    { key: "name", kind: "text", field: "name" },
    { key: "attr.ct55.value", kind: "tiles", field: "classIds" },
    { key: "attr.ct2.value", kind: "dropdown", field: "makeId" },
    { key: "attr.ct246.value", kind: "dropdown", field: "weaponType" },
    { key: "attr.ct72.value", kind: "text", field: "realLife" },
  ],
  sorts: [
    { key: "name", field: "name", label: "Weapon Name" },
    { key: "attr.ct55.frontend_value", field: "classLabels", label: "Weapon Class" },
    { key: "attr.ct57.frontend_value", field: "price", label: "Price" },
    { key: "attr.ct2.frontend_value", field: "makeLabel", label: "Manufacturer" },
    { key: "attr.ct58.frontend_value", field: "damage", label: "Damage" },
    { key: "attr.ct60.frontend_value", field: "accuracy", label: "Accuracy" },
    { key: "attr.ct61.frontend_value", field: "range", label: "Range" },
    { key: "attr.ct10.frontend_value", field: "overall", label: "Overall Rating" },
    { key: "attr.ct9.frontend_value", field: "handling", label: "Handling" },
  ],
  defaultSort: "name",
  defaultDir: "asc",
};

export const VEHICLE_OPTIONS = {
  "attr.ct1.value": ["super", "sports", "motorcycles", "planes", "helicopters", "boats", "emergency"],
  "attr.ct2.value": ["truffade", "progen", "maibatsu", "ubermacht", "bravado"],
  "attr.ct734.value": ["hide-standouts", "all-terrain", "mudder"],
};

export const WEAPON_OPTIONS = {
  "attr.ct55.value": ["handguns", "shotguns", "melee", "assault-rifles"],
  "attr.ct2.value": ["kozlov", "hawk"],
  "attr.ct246.value": ["base-weapon", "unique-variant"],
};

export interface SampleVehicle {
  slug: string;
  name: string;
  makeId: string;
  makeLabel: string;
  classIds: string[];
  classLabels: string[];
  standout: string;
  realLife?: string;
  speed?: number;
  roadRating?: number;
  offroadRating?: number;
  seats: number;
}

const v = (
  slug: string,
  name: string,
  make: [string, string],
  classes: Array<[string, string]>,
  standout: string,
  extra: Partial<SampleVehicle> = {},
): SampleVehicle => ({
  slug,
  name,
  makeId: make[0],
  makeLabel: make[1],
  classIds: classes.map((c) => c[0]),
  classLabels: classes.map((c) => c[1]),
  standout,
  seats: 2,
  ...extra,
});

const SUPER: [string, string] = ["super", "Super"];
const SPORTS: [string, string] = ["sports", "Sports"];
const MOTO: [string, string] = ["motorcycles", "Motorcycles"];
const BOATS: [string, string] = ["boats", "Boats"];
const HELI: [string, string] = ["helicopters", "Helicopters"];
const EMERG: [string, string] = ["emergency", "Emergency"];

/** Invented sample in catalogue order (relations of §16.2: thrax 9.2 first, three Emerus at 9.1). */
export const SAMPLE_VEHICLES: SampleVehicle[] = [
  v("andrew-nodes-thrax", "Andrew Node's Thrax", ["truffade", "Truffade"], [SUPER], "all-terrain", { speed: 9.2, roadRating: 910 }),
  v("banshee", "Banshee", ["bravado", "Bravado"], [SPORTS], "hide-standouts", { speed: 8.1, roadRating: 800, offroadRating: 300, realLife: "Viper Stand-In" }),
  v("black-widow-emerus", "Black Widow Emerus", ["progen", "Progen"], [SUPER], "all-terrain", { speed: 9.1 }),
  v("comet-s2-cabrio", "Comet S2 Cabrio", ["ubermacht", "Übermacht"], [SPORTS], "hide-standouts", { speed: 8.4, roadRating: 870, realLife: "Huracán Tribute" }),
  v("dinghy", "Dinghy", ["bravado", "Bravado"], [BOATS], "hide-standouts", { speed: 5.5, seats: 4 }),
  v("honeycomb-emerus", "Honeycomb Emerus", ["progen", "Progen"], [SUPER], "mudder", { speed: 9.1 }),
  v("maverick", "Maverick", ["ubermacht", "Übermacht"], [HELI, EMERG], "hide-standouts", { speed: 7.0, seats: 4 }),
  v("sanchez", "Sanchez", ["maibatsu", "Maibatsu"], [MOTO], "hide-standouts", { speed: 6.6, roadRating: 640, offroadRating: 700, seats: 2 }),
  v("seaspray-emerus", "Seaspray Emerus", ["progen", "Progen"], [SUPER], "mudder", { speed: 9.1 }),
  v("slow-wagon", "Slow Wagon", ["bravado", "Bravado"], [SPORTS], "hide-standouts", {}),
];
