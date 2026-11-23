// Self-check of the data module against CLONE_SPEC section 16 (counts, fixture identifiers 16.2,
// configured orders) and the section 19.1 contract. Determinism is checked by re-importing the module.

import { describe, expect, it, vi } from "vitest";
import * as D from "./index";
import { naturalCompare, stripAccents } from "./util";

const byClass = <T,>(items: readonly T[], key: (x: T) => string) =>
  items.reduce<Record<string, number>>((acc, x) => {
    acc[key(x)] = (acc[key(x)] ?? 0) + 1;
    return acc;
  }, {});

const fold = (s: string) => stripAccents(s).toLowerCase();
const veh = (slug: string) => {
  const v = D.getVehicleBySlug(slug);
  if (!v) throw new Error(`missing vehicle ${slug}`);
  return v;
};
const wpn = (slug: string) => {
  const w = D.getWeaponBySlug(slug);
  if (!w) throw new Error(`missing weapon ${slug}`);
  return w;
};

/** Info-row labels a detail page shows for a vehicle (R-607 order; rows without value omitted). */
function vehicleInfoLabels(v: D.Vehicle): string[] {
  const rows: [string, unknown][] = [
    ["Standout Set", v.standoutSet],
    ["Vehicle Class", v.classes[0]],
    ["Manufacturer", v.make],
    ["Style", v.style],
    ["Era", v.era],
    ["Specialist", v.specialist],
    ["Seats", v.seats],
    ["Based on (Real Life)", v.realLife],
    ["Mass / Weight", v.mass],
    ["Base Model", v.baseModel],
    ["Drive Train", v.driveTrain],
    ["Gears", v.gears],
    ["Variant / Conversion", v.variants.length ? v.variants : undefined],
    ["Notable Owners", v.notableOwners.length ? v.notableOwners : undefined],
  ];
  return rows.filter(([, val]) => val !== undefined).map(([l]) => l);
}

function weaponInfoLabels(w: D.Weapon): string[] {
  const rows: [string, unknown][] = [
    ["Manufacturer", w.make],
    ["Weapon Class", w.weaponClass],
    ["Based on (Real Life)", w.realLife],
    ["Base Model", w.baseModel],
    ["Ammo Capacity", w.ammoCapacity],
    ["Extended Ammo", w.extendedAmmo],
    ["Acquisition Method", w.acquisitionMethod],
    ["How To Unlock", w.howToUnlock],
    ["Story Mode Price", w.storyModePrice],
    ["Modifications", w.modifications],
    ["Variant / Conversion", w.variants.length ? w.variants : undefined],
  ];
  return rows.filter(([, val]) => val !== undefined).map(([l]) => l);
}

describe("vehicles (R-1603, R-1604, R-1606)", () => {
  it("has the 21 classes in tile order with page slugs, plurals and nouns", () => {
    expect(D.vehicleClasses.map((c) => c.id)).toEqual([
      "super", "sports", "motorcycles", "planes", "helicopters", "boats", "muscle", "off-road", "cycles", "commercial",
      "compacts", "coupes", "emergency", "industrial", "military", "sedans", "service", "sports-classic", "suvs", "utility", "vans",
    ]);
    const az = D.vehicleClasses.slice().sort((a, b) => a.label.localeCompare(b.label));
    expect(az.map((c) => `best-${c.pageSlug}`)).toEqual([
      "best-boats", "best-commercial-vehicles", "best-compacts", "best-coupes", "best-cycles", "best-emergency-vehicles",
      "best-helicopters", "best-industrial-vehicles", "best-military-vehicles", "best-motorcycles", "best-muscle-cars",
      "best-off-road-vehicles", "best-planes", "best-sedans", "best-service-vehicles", "best-sports-cars",
      "best-sports-classic-cars", "best-super-cars", "best-suvs", "best-utility-vehicles", "best-vans",
    ]);
    expect(D.getVehicleClassById("super")?.pluralLabel).toBe("Super Cars");
    expect(D.getVehicleClassById("boats")?.pluralLabel).toBe("Boats");
    expect(D.getVehicleClassById("motorcycles")?.titleNoun).toBe("Bike");
    expect(D.getVehicleClassById("sports")?.titleNoun).toBe("Sports Car");
    expect(D.getVehicleClassById("helicopters")?.titleNoun).toBe("Helicopter");
    expect(D.getVehicleClassByPageSlug("best-super-cars")?.id).toBe("super");
    expect(D.getVehicleClassByPageSlug("off-road-vehicles")?.id).toBe("off-road");
    expect(D.getVehicleClassByPageSlug("unicorns")).toBeUndefined();
  });

  it("has 280 vehicles with the class counts, 170 regular / 110 standout in 25 sets", () => {
    expect(D.vehicles).toHaveLength(280);
    expect(byClass(D.vehicles, (v) => v.classes[0])).toEqual({
      super: 24, sports: 26, motorcycles: 36, planes: 12, helicopters: 10, boats: 14, muscle: 16, "off-road": 14,
      cycles: 6, commercial: 8, compacts: 10, coupes: 12, emergency: 10, industrial: 8, military: 8, sedans: 18,
      service: 8, "sports-classic": 10, suvs: 14, utility: 8, vans: 8,
    });
    expect(D.vehicles.filter((v) => !v.standoutSet)).toHaveLength(170);
    expect(D.vehicles.filter((v) => v.standoutSet)).toHaveLength(110);
    expect(D.standoutSets).toHaveLength(25);
    expect(D.standoutSets[0]).toMatchObject({ id: "all-terrain", label: "All-Terrain", order: 1 });
    expect(new Set(D.vehicles.map((v) => v.standoutSet).filter(Boolean)).size).toBe(25);
    expect(D.vehicles.filter((v) => v.standoutSet === "all-terrain").length).toBeGreaterThanOrEqual(2);
    for (const s of D.vehicles.filter((v) => v.standoutSet)) {
      const base = veh(s.baseModel as string);
      expect(base.standoutSet).toBeUndefined();
      expect(base.classes[0]).toBe(s.classes[0]);
      expect(base.variants).toContain(s.slug);
    }
    expect(D.vehicles.filter((v) => v.classes.length === 2)).toHaveLength(12);
  });

  it("has unique slugs, compare keys and paths, positions in catalogue order", () => {
    for (const key of ["slug", "compareKey", "canonicalPath"] as const) {
      expect(new Set(D.vehicles.map((v) => v[key])).size).toBe(280);
    }
    D.vehicles.forEach((v, i) => {
      expect(v.position).toBe(i + 1);
      expect(v.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
    // regular vehicles A→Z, each followed by its standouts (fixture adjacency aside)
    const regs = D.vehicles.filter((v) => !v.standoutSet);
    for (let i = 1; i < regs.length; i++) expect(naturalCompare(regs[i - 1].name, regs[i].name)).toBeLessThan(0);
  });

  it("has 40 manufacturers, Übermacht with ≥ 2 vehicles and no other word starting with Uber", () => {
    const vehicleMakes = D.manufacturers.filter((m) => m.domain === "vehicle");
    expect(vehicleMakes).toHaveLength(40);
    expect(new Set(D.vehicles.map((v) => v.make)).size).toBe(40);
    for (const label of ["Maibatsu", "Western", "Bravado", "Buckingham", "Principe", "Nagasaki", "Progen", "Truffade", "Übermacht"]) {
      expect(vehicleMakes.some((m) => m.label === label)).toBe(true);
    }
    expect(D.getManufacturerById("ubermacht")?.label).toBe("Übermacht");
    expect(D.vehicles.filter((v) => v.make === "ubermacht").length).toBeGreaterThanOrEqual(2);
    const uberWords = D.manufacturers.filter((m) => m.label.split(/\s+/).some((w) => fold(w).startsWith("uber")));
    expect(uberWords.map((m) => m.id)).toEqual(["ubermacht"]);
    expect(D.manufacturers.filter((m) => m.label.includes("Über")).map((m) => m.id)).toEqual(["ubermacht"]);
  });

  it("follows the value rules of R-1604", () => {
    const regs = D.vehicles.filter((v) => !v.standoutSet);
    const rl = regs.filter((v) => v.realLife).length;
    expect(rl / regs.length).toBeGreaterThan(0.55);
    expect(rl / regs.length).toBeLessThan(0.65);
    expect(D.vehicles.filter((v) => v.standoutSet && v.realLife)).toHaveLength(0);
    expect(D.vehicles.filter((v) => v.realLife?.includes("Huracán"))).toHaveLength(1);
    expect(D.vehicles.filter((v) => v.realLife && v.realLife.toLowerCase().includes("huracan"))).toHaveLength(0);
    const noSpeed = D.vehicles.filter((v) => v.speed === undefined);
    expect(noSpeed).toHaveLength(8);
    expect(noSpeed.filter((v) => v.classes[0] === "sports")).toHaveLength(3);
    const unratedClass = (v: D.Vehicle) => ["boats", "helicopters", "planes"].includes(v.classes[0]);
    expect(D.vehicles.filter(unratedClass).every((v) => v.roadRating === undefined && v.offroadRating === undefined)).toBe(true);
    expect(D.vehicles.filter((v) => !unratedClass(v) && v.roadRating === undefined)).toHaveLength(5);
    expect(D.vehicles.every((v) => v.seats >= 1 && v.seats <= 8 && Number.isInteger(v.seats))).toBe(true);
    expect(D.vehicles.filter((v) => v.editions.includes("Launch Edition"))).toHaveLength(15);
    for (const v of D.vehicles) {
      for (const s of [v.speed, v.acceleration, v.asphaltHandling, v.offroadHandling, v.strength]) {
        if (s !== undefined) expect(s * 10).toBeCloseTo(Math.round(s * 10), 6), expect(s).toBeLessThanOrEqual(10);
      }
      for (const r of [v.roadRating, v.offroadRating]) if (r !== undefined) expect(Number.isInteger(r) && r >= 0 && r <= 1000).toBe(true);
    }
    // text-filter relations of F1-04..F1-06, F1-41
    expect(D.vehicles.some((v) => / an/i.test(v.name))).toBe(true);
    expect(D.vehicles.some((v) => /an /i.test(v.name))).toBe(true);
  });

  it("satisfies the speed ordering fixtures (F1-38, F3-01..F3-07)", () => {
    expect(veh("andrew-nodes-thrax")).toMatchObject({ name: "Andrew Node's Thrax", make: "truffade", classes: ["super"], speed: 9.2 });
    expect(veh("andrew-nodes-thrax").standoutSet).toBeDefined();
    expect(veh("andrew-nodes-thrax").realLife).toBeUndefined();
    for (const [slug, name] of [["seaspray-emerus", "Seaspray Emerus"], ["honeycomb-emerus", "Honeycomb Emerus"], ["black-widow-emerus", "Black Widow Emerus"]]) {
      expect(veh(slug)).toMatchObject({ name, make: "progen", classes: ["super"], speed: 9.1 });
      expect(veh(slug).standoutSet).toBeDefined();
    }
    const fast = new Set(["andrew-nodes-thrax", "seaspray-emerus", "honeycomb-emerus", "black-widow-emerus"]);
    expect(D.vehicles.filter((v) => v.speed === 9.2).map((v) => v.slug)).toEqual(["andrew-nodes-thrax"]);
    expect(D.vehicles.filter((v) => !fast.has(v.slug)).every((v) => v.speed === undefined || v.speed <= 9.0)).toBe(true);
    expect(D.vehicles.filter((v) => /emerus/i.test(v.name)).length).toBeGreaterThanOrEqual(5);
    expect(veh("emerus")).toMatchObject({ canonicalPath: "/vehicles/gta-6/emerus", compareKey: "progen-emerus", name: "Emerus" });
  });

  it("satisfies the detail fixtures (F2-01, F2-02, F2-24, F2-30..F2-32)", () => {
    const sunset = veh("sunset-sanchez");
    expect(sunset).toMatchObject({ name: "Sunset Sanchez", make: "maibatsu", classes: ["motorcycles"], standoutSet: "mudder", baseModel: "sanchez", gallery: null });
    expect(D.getStandoutSetById("mudder")?.label).toBe("Mudder");
    expect(sunset.rating.votes).toBe(0);
    expect(vehicleInfoLabels(sunset)).toEqual(["Standout Set", "Vehicle Class", "Manufacturer", "Style", "Era", "Seats", "Base Model", "Drive Train"]);
    expect(D.getNeighbours("vehicles", "sunset-sanchez")).toMatchObject({ prev: { slug: "mud-crasher-rancher" }, next: { slug: "tormentor-street-blazer" } });
    for (const s of ["mud-crasher-rancher", "tormentor-street-blazer"]) expect(veh(s)).toMatchObject({ make: "nagasaki", classes: ["motorcycles"] });
    expect(veh("tormentor-street-blazer").name).toBe("Tormentor Street Blazer");

    const sanchez = veh("sanchez");
    expect(sanchez).toMatchObject({ name: "Sanchez", make: "maibatsu", compareKey: "maibatsu-sanchez", classes: ["motorcycles"] });
    expect(sanchez.standoutSet).toBeUndefined();
    expect(vehicleInfoLabels(sanchez)).toEqual([
      "Vehicle Class", "Manufacturer", "Style", "Era", "Specialist", "Seats", "Based on (Real Life)", "Mass / Weight",
      "Drive Train", "Gears", "Variant / Conversion", "Notable Owners",
    ]);
    expect(sanchez.variants.length).toBeGreaterThanOrEqual(2);
    expect(sanchez.variants).toContain("sunset-sanchez");
    expect(sanchez.gallery).toHaveLength(9);
    expect(sanchez.appearances.length).toBeGreaterThanOrEqual(2);
    expect(D.getSimilarVehicles("sanchez").length).toBeGreaterThanOrEqual(1);
    expect(D.getSimilarVehicles("sunset-sanchez")).toHaveLength(0);

    expect(veh("nightblade")).toMatchObject({ name: "Nightblade", make: "western", compareKey: "western-nightblade", classes: ["motorcycles"] });
    expect(veh("manchez")).toMatchObject({ name: "Manchez", make: "maibatsu", compareKey: "maibatsu-manchez", canonicalPath: "/vehicles/gta-6/manchez" });
    expect(D.displayName(veh("manchez"))).toBe("Maibatsu Manchez");
    expect(veh("banshee")).toMatchObject({ name: "Banshee", make: "bravado", classes: ["sports"] });
    const maverick = veh("maverick");
    expect(maverick).toMatchObject({ name: "Maverick", make: "buckingham", classes: ["helicopters"] });
    expect(vehicleInfoLabels(maverick)).toEqual(["Vehicle Class", "Manufacturer", "Style", "Era", "Seats", "Based on (Real Life)", "Mass / Weight", "Variant / Conversion"]);
    expect(maverick.roadRating).toBeUndefined();

    const compareTo = D.getCompareToEntries("vehicles", "sunset-sanchez");
    expect(compareTo.find((e) => e.name === "Nightblade")?.compareKey).toBe("western-nightblade");
    expect(compareTo.find((e) => e.name === "Sanchez")?.compareKey).toBe("maibatsu-sanchez");
    expect(compareTo.some((e) => e.slug === "sunset-sanchez")).toBe(false);
    for (let i = 1; i < compareTo.length; i++) expect(naturalCompare(compareTo[i - 1].name, compareTo[i].name)).toBeLessThanOrEqual(0);
  });

  it("satisfies the ranking fixtures (F3-32..F3-38)", () => {
    const rank = (cls: string) =>
      D.getVehiclesOfClass(cls).slice().sort((a, b) => {
        if (a.roadRating === undefined || b.roadRating === undefined) {
          if (a.roadRating === b.roadRating) return a.position - b.position;
          return a.roadRating === undefined ? 1 : -1;
        }
        return b.roadRating - a.roadRating || a.position - b.position;
      });
    const top = (cls: string) => rank(cls)[0];
    expect(top("motorcycles").slug).toBe("burnished-alvino");
    expect(top("motorcycles")).toMatchObject({ name: "Burnished Alvino", make: "principe" });
    expect(top("motorcycles").realLife).toBeUndefined();
    expect(top("sports").slug).toBe("comet-s2-cabrio");
    expect(top("sports").realLife).toBeDefined();
    expect(top("super").slug).toBe("dantes-vitello");
    expect(top("super").realLife).toBeUndefined();
    for (const cls of ["motorcycles", "sports", "super"]) expect(rank(cls)[0].roadRating).toBeGreaterThan(rank(cls)[1].roadRating as number);
    expect(top("boats").slug).toBe("seashark");
    expect(top("planes").slug).toBe("dodo");
    expect(top("helicopters").slug).toBe("maverick");
    for (const slug of ["seashark", "dodo", "maverick", "comet-s2-cabrio"]) expect(veh(slug).realLife).toBeDefined();
  });
});

describe("weapons (R-1605)", () => {
  it("has 10 classes, 180 weapons = 60 base + 120 unique variants with the class counts", () => {
    expect(D.weaponClasses.map((c) => `${c.id}:${c.label}`)).toEqual([
      "handguns:Handguns", "assault-rifles:Assault Rifles", "smg:SMG", "lmg:LMG", "shotguns:Shotguns",
      "sniper-rifles:Sniper Rifles", "tactical-rifles:Tactical Rifles", "launchers:Launchers", "thrown:Throwable", "melee:Melee",
    ]);
    expect(D.weapons).toHaveLength(180);
    expect(D.weapons.filter((w) => w.type === "base-weapon")).toHaveLength(60);
    expect(D.weapons.filter((w) => w.type === "unique-variant")).toHaveLength(120);
    expect(byClass(D.weapons, (w) => w.weaponClass)).toEqual({
      handguns: 36, "assault-rifles": 26, smg: 22, lmg: 8, shotguns: 22, "sniper-rifles": 16, "tactical-rifles": 10,
      launchers: 6, thrown: 10, melee: 24,
    });
    expect(D.weapons.filter((w) => w.price !== undefined)).toHaveLength(70);
    const noDamage = D.weapons.filter((w) => w.damage === undefined);
    expect(noDamage).toHaveLength(10);
    expect(noDamage.filter((w) => w.weaponClass === "handguns").length).toBeGreaterThanOrEqual(2);
    expect(D.weapons.some((w) => w.make === "kozlov")).toBe(true);
    expect(new Set(D.weapons.map((w) => w.make)).size).toBe(D.manufacturers.filter((m) => m.domain === "weapon").length);
    expect(new Set(D.weapons.map((w) => w.slug)).size).toBe(180);
    for (const w of D.weapons.filter((x) => x.type === "unique-variant")) expect(wpn(w.baseModel as string).variants).toContain(w.slug);
  });

  it("puts .38 then 1922 first by name (F1-W15, F3-14)", () => {
    const coll = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
    const names = D.weapons.map((w) => w.name).sort(coll.compare);
    expect(names.slice(0, 2)).toEqual([".38", "1922"]);
    expect(D.weapons[0].slug).toBe("38");
    const p38 = wpn("38");
    expect(p38).toMatchObject({ name: ".38", weaponClass: "handguns", type: "base-weapon", compareKey: "38" });
    expect(p38.realLife).toBeDefined();
    expect(p38.price).toBeDefined();
    expect(p38.damage).toBeDefined();
    expect(wpn("heavy-pistol")).toMatchObject({ name: "1922", weaponClass: "handguns" });
  });

  it("satisfies the KZ-59 and knife fixtures (F2-03, F2-33, F3-21..F3-25b)", () => {
    const kz = wpn("assault-rifle");
    expect(kz).toMatchObject({ name: "KZ-59", make: "kozlov", weaponClass: "assault-rifles", type: "base-weapon", gallery: [] });
    expect(weaponInfoLabels(kz)).toEqual([
      "Manufacturer", "Weapon Class", "Based on (Real Life)", "Ammo Capacity", "Extended Ammo", "Acquisition Method",
      "Story Mode Price", "Modifications", "Variant / Conversion",
    ]);
    expect(kz.appearances.length).toBeGreaterThanOrEqual(2);
    expect(D.getManufacturerById("kozlov")?.label).toBe("Kozlov");
    const mule = wpn("drug-mule-kz-59");
    expect(mule).toMatchObject({ name: "Drug Mule KZ-59", make: "kozlov", weaponClass: "assault-rifles", type: "unique-variant", baseModel: "assault-rifle" });
    expect(weaponInfoLabels(mule)).toEqual(["Manufacturer", "Weapon Class", "Base Model", "Ammo Capacity", "How To Unlock", "Modifications"]);
    const kzVariants = D.weapons.filter((w) => w.baseModel === "assault-rifle");
    expect(kzVariants.length).toBeGreaterThanOrEqual(6);
    for (const w of kzVariants) expect(w.name).toMatch(/^[A-Z][\w' ]* KZ-59$/);
    const matches59kz = D.weapons.filter((w) => ["59", "kz"].every((q) => fold(w.name).includes(q)));
    expect(matches59kz.map((w) => w.slug).sort()).toEqual(["assault-rifle", ...kzVariants.map((w) => w.slug)].sort());
    const knives = D.weapons.filter((w) => fold(w.name).includes("knife"));
    expect(knives.length).toBeGreaterThanOrEqual(4);
    expect(knives.every((w) => w.weaponClass === "melee")).toBe(true);
    expect(knives.filter((w) => w.name === "Knife")).toHaveLength(1);
    expect(D.weapons.length).toBeGreaterThan(150);
  });
});

describe("list configuration and index (R-505, section 5.2)", () => {
  it("has the vehicle filter and sort keys in order", () => {
    const c = D.listConfig("vehicles");
    expect(c.filters.map((f) => [f.title, f.hashKey, f.placeholder])).toEqual([
      ["Vehicle Name", "name", "Enter Vehicle Name"],
      ["Vehicle Class", "attr.ct1.value", ""],
      ["Manufacturer", "attr.ct2.value", "Select Manufacturer"],
      ["Standout Set", "attr.ct734.value", "Select Standout Set"],
      ["Real Life Vehicle", "attr.ct72.value", "Enter Real Life Vehicle"],
    ]);
    expect(c.sortFields.map((s) => [s.label, s.hashKey])).toEqual([
      ["Vehicle Name", "name"], ["Manufacturer", "attr.ct2.frontend_value"], ["Vehicle Class", "attr.ct1.frontend_value"],
      ["Speed", "attr.ct6.frontend_value"], ["Asphalt OVR", "attr.ct665.frontend_value"], ["Off-Road OVR", "attr.ct10.frontend_value"],
      ["Seats", "attr.ct11.frontend_value"],
    ]);
    expect(c.defaultSort).toEqual({ hashKey: "attr.ct6.frontend_value", direction: "desc" });
    expect(c.pluralNoun).toBe("Vehicles");
    expect(c.filters[1].options.map((o) => o.value)).toEqual(D.vehicleClasses.map((x) => x.id));
    const standout = c.filters[3].options;
    expect(standout[0]).toEqual({ value: "hide-standouts", label: "Hide Standout Vehicles" });
    expect(standout[1]).toEqual({ value: "all-terrain", label: "All-Terrain" });
    const makes = c.filters[2].options.map((o) => o.label);
    expect(makes).toEqual(makes.slice().sort(naturalCompare));
    expect(c.card.stats.map((s) => s.label)).toEqual(["Speed", "Off-Road", "Road"]);
  });

  it("has the weapon filter and sort keys in order", () => {
    const c = D.listConfig("weapons");
    expect(c.filters.map((f) => [f.title, f.hashKey, f.placeholder])).toEqual([
      ["Weapon Name", "name", "Enter Weapon Name"],
      ["Weapon Class", "attr.ct55.value", ""],
      ["Manufacturer", "attr.ct2.value", "Select Manufacturer"],
      ["Weapon Type", "attr.ct246.value", "Select Weapon Type"],
      ["Real Life Weapon", "attr.ct72.value", "Enter Real Life Weapon"],
    ]);
    expect(c.filters[3].options).toEqual([{ value: "base-weapon", label: "Base Weapon" }, { value: "unique-variant", label: "Unique Variant" }]);
    expect(c.sortFields.map((s) => [s.label, s.hashKey])).toEqual([
      ["Weapon Name", "name"], ["Weapon Class", "attr.ct55.frontend_value"], ["Price", "attr.ct57.frontend_value"],
      ["Manufacturer", "attr.ct2.frontend_value"], ["Damage", "attr.ct58.frontend_value"], ["Accuracy", "attr.ct60.frontend_value"],
      ["Range", "attr.ct61.frontend_value"], ["Overall Rating", "attr.ct10.frontend_value"], ["Handling", "attr.ct9.frontend_value"],
    ]);
    expect(c.defaultSort).toEqual({ hashKey: "name", direction: "asc" });
  });

  it("indexes every item in catalogue order and keeps missing values missing", () => {
    const vi1 = D.getListIndex("vehicles");
    expect(vi1).toHaveLength(280);
    expect(vi1.map((e) => e.slug)).toEqual(D.vehicles.map((v) => v.slug));
    const thrax = vi1.find((e) => e.slug === "andrew-nodes-thrax");
    expect(thrax).toMatchObject({ makeLabel: "Truffade", classLabels: ["Super"], isStandout: true, canonicalPath: "/gta-6/vehicles/andrew-nodes-thrax" });
    expect(vi1.find((e) => e.slug === "sanchez")?.standoutValue).toBe("hide-standouts");
    const noSpeed = vi1.filter((e) => e.speed === undefined);
    expect(noSpeed).toHaveLength(8);
    expect(noSpeed.every((e) => !("speed" in e) || e.speed === undefined)).toBe(true);
    const wi = D.getListIndex("weapons");
    expect(wi).toHaveLength(180);
    expect(wi.filter((e) => e.damage === undefined)).toHaveLength(10);
    expect(wi.find((e) => e.slug === "drug-mule-kz-59")).toMatchObject({ weaponType: "unique-variant", isUniqueVariant: true });
  });
});

describe("guide items (R-1620, R-1622)", () => {
  it("animals: 64 in 3 grids, albino alligator first, gray fox full with empty gallery", () => {
    expect(D.animals).toHaveLength(64);
    expect(byClass(D.animals, (a) => a.grid)).toEqual({ land: 40, birds: 18, sea: 6 });
    const land = D.animals.filter((a) => a.grid === "land");
    expect(land[0]).toMatchObject({ slug: "albino-american-alligator", name: "Albino American Alligator" });
    for (let i = 1; i < land.length; i++) expect(naturalCompare(land[i - 1].name, land[i].name)).toBeLessThan(0);
    const fox = D.animals.find((a) => a.slug === "gray-fox") as D.Animal;
    expect(fox.name).toBe("Gray Fox");
    for (const f of ["animalCategory", "habitat", "recommendedWeapon", "species", "animalClass"] as const) expect(fox[f]).toBeDefined();
    expect(fox.gallery).toEqual([]);
  });

  it("characters: 2 / 6 / 10 / 24 + 6 other rows, Jason first and complete", () => {
    expect(byClass(D.characters, (c) => c.grid)).toEqual({ protagonists: 2, main: 6, supporting: 10, minor: 24, other: 6 });
    const jason = D.characters[0];
    expect(jason).toMatchObject({ slug: "jason", name: "Jason Duval", grid: "protagonists", canonicalPath: "/gta-6/characters/jason" });
    for (const f of ["role", "gender", "bornInYear", "nationality", "location", "occupation", "alsoKnownAs", "performer", "family", "affiliation", "propertySafehouse"] as const) {
      expect(jason[f]).toBeDefined();
    }
    expect(jason.vehicles.length).toBeGreaterThan(0);
    expect(jason.screenshots).toHaveLength(24);
    expect(jason.artworks).toHaveLength(6);
    expect(D.characters.filter((c) => c.grid === "other").every((c) => c.slug === undefined)).toBe(true);
    expect(new Set(D.characters.filter((c) => c.slug).map((c) => c.slug)).size).toBe(42);
    expect(D.characters.every((c) => c.performer === "Not yet announced")).toBe(true);
    expect(D.characterGuide.mentionedNames).toHaveLength(8);
    expect(D.characterGuide.faq).toHaveLength(5);
  });

  it("gangs and properties", () => {
    expect(D.gangs).toHaveLength(3);
    expect(D.gangs[0]).toMatchObject({ slug: "final-chapter-mc", name: "Final Chapter MC", canonicalPath: "/gangs/gta-6/final-chapter-mc" });
    expect(D.gangs.every((g) => g.grid === "gangs" && g.canonicalPath === `/gangs/gta-6/${g.slug}`)).toBe(true);
    expect(D.gangGuide.lawBullets).toHaveLength(6);
    expect(byClass(D.properties, (p) => p.grid)).toEqual({ purchasable: 6, story: 3, edition: 4, safehouse: 3 });
    expect(D.properties.every((p) => (p.grid === "purchasable") === (p.price !== undefined))).toBe(true);
    const seventh = D.properties.find((p) => p.slug === "7th-avenue-garage") as D.Property;
    expect(seventh).toMatchObject({ name: "7th Avenue Garage", grid: "purchasable", canonicalPath: "/gta-6/properties/7th-avenue-garage", markerId: "garage-003" });
    for (const f of ["propertyType", "propertyStyle", "location", "region", "vehicleCapacity", "howToUnlock", "price"] as const) expect(seventh[f]).toBeDefined();
    const edition = D.properties.filter((p) => p.grid === "edition");
    expect(edition[1]).toMatchObject({ slug: "paradise-garage", name: "Paradise Garage", canonicalPath: "/properties/gta-6/paradise-garage" });
    expect(edition.every((p) => p.canonicalPath.startsWith("/properties/gta-6/"))).toBe(true);
    const sh1 = D.getMarkerById("safehouse-001") as D.Marker;
    expect(D.properties.filter((p) => p.grid === "safehouse").map((p) => p.canonicalPath)).toContain(sh1.detailsPath);
  });

  it("radio: 12 stations with the playable-track pattern and 8 clips", () => {
    const st = D.radioStations;
    expect(st).toHaveLength(12);
    expect(st[1]).toMatchObject({ slug: "flash-fm", name: "Flash FM" });
    expect(st[1].genre).toBeTruthy();
    expect(st[1].host).toBeTruthy();
    expect(st[0].tracks).toHaveLength(14);
    expect(st[0].tracks.every((t) => t.audioClip)).toBe(true);
    expect(st[2].tracks.slice(0, 3).map((t) => !!t.audioClip)).toEqual([false, true, true]);
    expect(st[7].tracks.some((t) => t.audioClip)).toBe(false);
    expect(st.filter((s) => !s.tracks.some((t) => t.audioClip))).toHaveLength(1);
    const all = st.flatMap((s) => s.tracks);
    const ratio = all.filter((t) => t.audioClip).length / all.length;
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(0.7);
    expect(all.every((t) => t.year >= 1975 && t.year <= 2026)).toBe(true);
    expect(D.audioClips).toHaveLength(8);
    expect(D.audioClips.every((c) => c.seconds >= 6 && c.seconds <= 12)).toBe(true);
    const clipIds = new Set(D.audioClips.map((c) => c.id));
    expect(all.every((t) => t.audioClip === undefined || clipIds.has(t.audioClip))).toBe(true);
  });
});

describe("missions, activities, checklist, cheats (R-1617, R-1618, R-1621)", () => {
  it("has 40 main, 12 optional and 16 stranger missions with the fixture ids", () => {
    expect(byClass(D.missions, (m) => m.kind)).toEqual({ main: 40, optional: 12, stranger: 16 });
    const main = D.missions.filter((m) => m.kind === "main");
    expect(byClass(main, (m) => m.chapter)).toMatchObject({ Prologue: 1, "Chapter 1": 9 });
    expect(main.map((m) => m.number)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    expect(D.missions[0]).toMatchObject({ slug: "prologue", title: "Prologue", checklistId: "6644", canonicalPath: "/missions/gta-6/prologue", number: 1 });
    const get = (slug: string) => D.missions.find((m) => m.slug === slug) as D.Mission;
    expect(get("gone-fishing")).toMatchObject({ checklistId: "7285", number: 2, chapter: "Chapter 1", badges: ["CHAPTER 1 POINT OF NO RETURN"], canonicalPath: "/gta-6/missions/gone-fishing" });
    expect(get("breakfast-run")).toMatchObject({ number: 3, title: "Breakfast Run" });
    const br = get("breakfast-run");
    for (const f of ["number", "missionType", "chapter", "giver", "protagonist", "requiredFor100", "featuring", "rewards"] as const) expect(br[f]).toBeDefined();
    expect(get("get-shirleys-rum")).toMatchObject({ kind: "optional", checklistId: "7291", badges: ["OPTIONAL", "MISSABLE"], listedOnStrangersPage: true, title: "Get Shirley's Rum" });
    expect(get("search-for-the-skunk-ape")).toMatchObject({ kind: "stranger", checklistId: "7319", canonicalPath: "/gta-6/strangers/search-for-the-skunk-ape", title: "Search for the Skunk Ape" });
    expect(new Set(D.missions.map((m) => m.checklistId)).size).toBe(68);
    expect(D.missions.every((m) => /^\d+$/.test(m.checklistId))).toBe(true);
    const strangers = D.missions.filter((m) => m.kind === "stranger");
    expect(byClass(strangers, (m) => String(m.strangersChapter))).toEqual({ 1: 4, 2: 4, 3: 4, 4: 4 });
    expect(D.getMissionByChecklistId("7285")?.slug).toBe("gone-fishing");
  });

  it("has 10 activities (first parachuting) and the random-event placeholder row", () => {
    expect(D.activities).toHaveLength(10);
    expect(D.activities[0]).toMatchObject({ slug: "parachuting", name: "Parachuting", canonicalPath: "/side-missions/gta-6/parachuting" });
    expect(D.randomEvents).toEqual([{ event: "TBA", location: "TBA", reward: "TBA", status: "Coming Soon" }]);
  });

  it("has the 38 checklist items of 16.6 adding up to 100 %", () => {
    expect(D.checklist100.map((c) => c.id)).toEqual([
      "story", "story-tasks", "optional", "gang-ops", "bank-jobs", "payday", "smash-grab", "stick-ups", "narcotics",
      "jewelry", "marked-bills", "vaults", "vehicles-fenced", "exploration", "kenton", "cards", "waink", "underwater",
      "magazines", "meditation", "flamingos", "playlists", "styles", "races", "race-challenges", "shooting", "video-games",
      "pool", "mini-golf", "basketball", "drones", "stunts", "challenges", "target-decks", "discovery", "vehicles",
      "weapons", "animals",
    ]);
    const item = (id: string) => D.checklist100.find((c) => c.id === id) as D.ChecklistItem;
    expect(item("story")).toMatchObject({ label: "Story Completion (50%)", weight: 50, parent: undefined });
    expect(item("story-tasks")).toMatchObject({ label: "Tasks (27%)", limit: 27, weight: undefined });
    expect(item("exploration")).toMatchObject({ label: "Exploration & Activities (20%)", weight: 20 });
    expect(item("discovery")).toMatchObject({ label: "Discovery (3%)", weight: 3 });
    expect(item("kenton").label).toBe("5 of 7 Kenton Sets Completed (1%)");
    expect(D.checklist100.filter((c) => c.parent === "story-tasks")).toHaveLength(11);
    expect(D.checklist100.filter((c) => c.parent === "exploration")).toHaveLength(20);
    expect(D.checklist100.filter((c) => c.parent === "discovery")).toHaveLength(3);
    const tasks = D.checklist100.filter((c) => c.parent === "story-tasks").map((c) => c.weight);
    expect(tasks).toEqual([6, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
    expect(D.checklist100.every((c) => c.multiplier === 1 && c.group === undefined && /\(\d+%\)$/.test(c.label))).toBe(true);
    const top = D.checklist100.filter((c) => !c.parent);
    expect(top.reduce((s, c) => s + (c.weight ?? c.limit ?? 0), 0)).toBe(100);
  });

  it("has 36 cheats in 5 categories, the fixed first sequence and three platform pages", () => {
    expect(D.cheatCategories.map((c) => [c.id, c.label])).toEqual([
      ["player-cheats", "Player Cheats"], ["combat-cheats", "Combat Cheats"], ["vehicle-spawn-cheats", "Vehicle Spawn Cheats"],
      ["environment-cheats", "Environment Cheats"], ["screen-filter-cheats", "Screen Filter Cheats"],
    ]);
    expect(D.cheats).toHaveLength(36);
    expect(byClass(D.cheats, (c) => c.category)).toEqual({ "player-cheats": 6, "combat-cheats": 7, "vehicle-spawn-cheats": 12, "environment-cheats": 3, "screen-filter-cheats": 8 });
    expect(D.cheats[0].sequence).toEqual(["UP", "RIGHT", "DOWN", "LEFT", "UP", "UP", "RIGHT", "DOWN"]);
    expect(D.cheats.every((c) => c.sequence.every((s) => ["UP", "DOWN", "LEFT", "RIGHT"].includes(s)))).toBe(true);
    const [ps5, xbox, pc] = D.cheatPages;
    expect(ps5.firstSection).toMatchObject({ heading: "How to Enter GTA 6 Cheats on PS5", anchor: "how-to-enter-gta-6-cheats-on-ps5" });
    expect(ps5.howToIcons).toEqual(["UP", "L1", "R1"]);
    expect(xbox.firstSection.anchor).toBe("how-to-enter-gta-6-cheats-on-xbox");
    expect(xbox.howToIcons).toEqual(["UP", "LB", "RB"]);
    expect(pc.firstSection.anchor).toBe("how-many-cheats-are-there-in-gta-6");
    expect(ps5.ownSections).toHaveLength(2);
    expect(pc.ownSections).toHaveLength(6);
    expect(D.cheatPages.map((p) => p.platformLabel)).toEqual(["GTA 6 Cheats for PS5", "GTA 6 Cheats for Xbox Series X|S", "GTA 6 Cheats for PC"]);
  });
});

describe("map (R-1608..R-1612)", () => {
  const CONFIG_ORDER = [
    "bank", "fence", "gang-operation", "payday-loan", "safe", "smash-n-grab", "towable-atm", "mural", "ahol-street-art",
    "base-jump", "book-swap", "comics", "hidden-package", "easter-egg", "knife-flight", "luxury-watch", "magazine",
    "meditation", "message-bottle", "meteorite", "stunt-jump", "treasure", "under-the-bridge", "playlist",
    "waink-curiosity", "waink-landmark", "waink-sculpture", "yellow-loot-box", "scoop-container",
    "card-americas-next-top-hooker", "card-backyard-wrestling", "card-delights", "card-ed-comics", "card-jack-of-hearts",
    "card-liberty-city-penetrators", "card-liberty-city-swingers", "card-liberty-city-wrath", "card-los-santos-corkers",
    "card-los-santos-panic", "card-los-santos-pounders", "card-nine1nine", "card-right-wing", "card-legends-of-ratface",
    "card-vice-city-club-de-futbol", "card-vice-city-flamingos", "card-vice-city-manatees", "card-vice-city-narcos",
    "collectible-card", "arcade", "basketball", "car-meet", "drone-race", "fishing", "gang-compound", "golf", "gym",
    "hunting", "mini-golf", "parachuting", "pool", "race", "random-event", "shooting-range", "garage", "helipad",
    "safehouse", "bus-stop", "car-wash", "ev-charger", "gas-station", "vehicle-mod-shop", "pay-n-spray",
    "public-transport", "airport", "ferry", "standout-vehicle", "vehicle-rental", "vehicle-request", "vehicle-spawn",
    "ammu-nation", "weapon-spawn", "unique-weapon", "clothing", "electronics", "footwear", "haircut", "tattoo", "bar",
    "cafe-takeout", "convenience-store", "food-and-drink", "liquor-store", "street-food", "atm", "cinema", "city-town",
    "fire-station", "hospital", "landmark", "marina", "nightclub", "police-station",
  ];

  it("has 10 groups and 102 categories in config order", () => {
    expect(D.mapGroups.map((g) => `${g.id}:${g.name}`)).toEqual([
      "properties:Personal", "robberies:Robberies", "activities:Activities", "collectibles:Collectibles",
      "collectible-cards:Collectible Cards", "vehicles:Vehicles", "weapons:Weapons", "style:Style",
      "food-drink:Food & Drink", "local-places:Local Places",
    ]);
    expect(D.mapCategories.map((c) => c.id)).toEqual(CONFIG_ORDER);
    expect(D.mapCategories.filter((c) => c.hiddenByDefault).map((c) => c.id)).toEqual(["bus-stop", "ev-charger", "gas-station", "atm"]);
    expect(D.mapCategories.filter((c) => !c.trackable).map((c) => c.id)).toEqual(["bus-stop", "ev-charger", "gas-station", "atm"]);
    expect(D.mapCategories.filter((c) => c.multiSpawn)).toHaveLength(20);
    const cat = (id: string) => D.getMapCategoryById(id) as D.MapCategory;
    expect(cat("bank")).toMatchObject({ name: "Banks", group: "robberies", linkKey: "bank", singularName: "Bank" });
    expect(cat("garage")).toMatchObject({ group: "properties", linkKey: "garages" });
    expect(cat("helipad")).toMatchObject({ group: "local-places", linkKey: "helipads" });
    expect(cat("safehouse")).toMatchObject({ group: "properties", linkKey: "safehouses" });
    expect(cat("airport")).toMatchObject({ group: "vehicles", linkKey: "airports", singularName: "Airport" });
    expect(cat("ammu-nation").group).toBe("weapons");
    expect(cat("atm").group).toBe("local-places");
    expect(cat("card-liberty-city-wrath")).toMatchObject({ group: "collectible-cards", markerCount: 13, distinctCount: 9 });
    expect(D.getCategoryByLinkKey("hidden-packages")?.id).toBe("hidden-package");
    expect(D.getCategoryByLinkKey("hidden-package")).toBeUndefined();
    expect(D.getCategoryByLinkKey("bank")?.id).toBe("bank");
    expect(D.getCategoryByLinkKey("no-such-category")).toBeUndefined();
    expect(D.mapCategories.every((c) => c.markerCount > 0)).toBe(true);
  });

  it("has the marker counts of R-1610, valid ids and every marker on land", () => {
    expect(D.markers.length).toBeGreaterThanOrEqual(600);
    const counts = byClass(D.markers, (m) => m.category);
    expect(counts).toMatchObject({ safehouse: 5, garage: 6, bank: 12, fence: 8, "hidden-package": 30, mural: 10, "standout-vehicle": 10, arcade: 6, helipad: 4, "bus-stop": 20, "ev-charger": 10, "gas-station": 15, "car-wash": 6, "ammu-nation": 8, clothing: 5, bar: 8, atm: 30, cinema: 5 });
    for (const c of D.mapCategories.filter((x) => x.multiSpawn && x.id !== "standout-vehicle")) expect(counts[c.id]).toBe(13);
    expect(new Set(D.markers.map((m) => m.id)).size).toBe(D.markers.length);
    const { minX, maxX, minY, maxY } = D.mapConfig.bounds;
    for (const m of D.markers) {
      expect(m.id).toMatch(new RegExp(`^${m.category}-\\d{3}$`));
      expect(m.x >= minX && m.x <= maxX && m.y >= minY && m.y <= maxY).toBe(true);
      expect(D.isOnLand(m.x, m.y)).toBe(true);
    }
    const share = (f: (m: D.Marker) => unknown) => D.markers.filter(f).length / D.markers.length;
    expect(share((m) => m.description)).toBeGreaterThan(0.28);
    expect(share((m) => m.image)).toBeGreaterThan(0.15);
    expect(share((m) => m.detailsPath)).toBeGreaterThan(0.08);
  });

  it("satisfies the safehouse, garage, ATM and card fixtures (F4-20..F4-25)", () => {
    const m = (id: string) => D.getMarkerById(id) as D.Marker;
    expect(m("safehouse-001")).toMatchObject({ x: -2352, y: -5532 });
    expect(m("safehouse-001").detailsPath).toMatch(/^\/gta-6\/properties\//);
    expect(m("safehouse-002")).toMatchObject({ x: -1500, y: -3500 });
    expect(m("safehouse-003")).toMatchObject({ x: -1900, y: -5000, name: "Pegassi Residences" });
    expect(m("safehouse-004")).toMatchObject({ x: -500, y: -1200 });
    expect(m("safehouse-005")).toMatchObject({ x: 300, y: 1500, name: "Starlet Motel" });
    // collecting order of R-825
    const remaining = D.getMarkersOfCategory("safehouse").slice();
    const order: string[] = [];
    remaining.sort((a, b) => a.y - b.y);
    let prev = remaining.shift() as D.Marker;
    order.push(prev.id);
    while (remaining.length) {
      remaining.sort((a, b) => a.y - b.y);
      const window = remaining.filter((x) => x.y <= remaining[0].y + 2000);
      window.sort((a, b) => Math.hypot(a.x - prev.x, a.y - prev.y) - Math.hypot(b.x - prev.x, b.y - prev.y) || (a.id < b.id ? -1 : 1));
      prev = window[0];
      remaining.splice(remaining.indexOf(prev), 1);
      order.push(prev.id);
    }
    expect(order).toEqual(["safehouse-001", "safehouse-003", "safehouse-002", "safehouse-004", "safehouse-005"]);
    expect(m("garage-003")).toMatchObject({ name: "7th Avenue Garage", detailsPath: "/gta-6/properties/7th-avenue-garage" });
    expect(m("atm-001").category).toBe("atm");
    const wrath = D.getMarkersOfCategory("card-liberty-city-wrath");
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const sharing = wrath.filter((x) => norm(x.name) === norm(m("card-liberty-city-wrath-001").name)).map((x) => x.id);
    expect(sharing).toEqual(["card-liberty-city-wrath-001", "card-liberty-city-wrath-013"]);
    expect(new Set(wrath.map((x) => norm(x.name))).size).toBe(9);
    expect(new Set(D.getMarkersOfCategory("standout-vehicle").map((x) => norm(x.name))).size).toBe(8);
    expect(D.mapConfig).toMatchObject({ startMarkerId: "safehouse-001", startZoom: 2, closeZoom: 5, minZoom: 0, maxZoom: 8 });
    expect(D.mapConfig.regions).toHaveLength(5);
    expect(D.mapConfig.notice).toMatchObject({ start: "2026-11-01", end: "2027-12-31" });
  });
});

describe("articles (R-1613..R-1616)", () => {
  const A = D.articles;
  const bySlug = (slug: string) => A.find((a) => a.slug === slug) as D.Article;

  it("has 84 articles, the newest ten in order, strictly decreasing dates", () => {
    expect(A).toHaveLength(84);
    expect(A.slice(0, 10).map((a) => a.canonicalPath)).toEqual([
      "how-to-claim-ultimate-edition-benefits-in-gta-6", "how-to-use-turn-signals-and-headlights-in-gta-6",
      "how-to-find-and-use-atms-in-gta-6", "gta-6-military-base-location", "can-you-play-gta-6-in-co-op-or-split-screen",
      "how-to-fly-planes-helicopters-in-gta-6", "gta-6-phone-guide-every-app-explained", "gta-6-driving-tips",
      "gta-6-review-bombed-on-metacritic", "gta-6-mod-shops-repairs-guide",
    ].map((s) => `/gta-6/articles/${s}`));
    expect(A[0].publishedAt).toBe("2026-11-22T21:46:04Z");
    expect(A.slice(0, 8).every((a) => a.publishedAt.startsWith("2026-11-22"))).toBe(true);
    expect(A.slice(8, 10).every((a) => a.publishedAt.startsWith("2026-11-21"))).toBe(true);
    for (let i = 1; i < A.length; i++) expect(A[i].publishedAt < A[i - 1].publishedAt).toBe(true);
    expect(A[83].publishedAt.startsWith("2019-03-24")).toBe(true);
    expect(new Set(A.map((a) => a.slug)).size).toBe(84);
    expect(A.every((a) => a.canonicalPath === (a.pathForm === "gta6" ? `/gta-6/articles/${a.slug}` : `/articles/gta-6/${a.slug}`))).toBe(true);
  });

  it("has the flag counts of R-1615", () => {
    expect(A.filter((a) => a.guide)).toHaveLength(54);
    expect(D.listArticles("guides")).toHaveLength(61);
    expect(D.guideSectionLinks).toHaveLength(7);
    const videos = A.filter((a) => a.video);
    expect(videos).toHaveLength(7);
    expect(videos[0].slug).toBe("grand-theft-auto-vi-launch-trailer");
    expect(videos.every((v) => v.publishedAt >= "2019" && v.publishedAt < "2027" && v.showAuthor && v.authorBio && v.videoPlaceholder)).toBe(true);
    expect(A.filter((a) => a.showModified)).toHaveLength(6);
    expect(A.filter((a) => a.showModified).every((a) => a.modifiedAt && a.modifiedAt > a.publishedAt)).toBe(true);
    expect(A.filter((a) => a.showAuthor)).toHaveLength(59);
    expect(new Set(A.map((a) => a.author)).size).toBe(4);
    const toc = A.filter((a) => a.toc);
    expect(toc).toHaveLength(20);
    expect(toc.every((a) => a.sections.filter((s) => !s.noIndex).length >= 5)).toBe(true);
    const related = A.filter((a) => a.related);
    expect(related).toHaveLength(12);
    expect(related.every((a) => (a.related?.cards.length ?? 0) >= 2 && (a.related?.cards.length ?? 0) <= 4)).toBe(true);
    for (const a of A) expect(new Set(a.sections.map((s) => s.anchor)).size).toBe(a.sections.length);
    expect(D.listArticles("news")).toHaveLength(84);
    expect(D.listArticles("all")).toHaveLength(84);
    expect(D.listArticles("videos")).toHaveLength(7);
  });

  it("satisfies the article fixtures (F7-17..F7-48)", () => {
    expect(bySlug("how-to-claim-ultimate-edition-benefits-in-gta-6").title).toBe("How to Claim All Ultimate Edition Bonuses in GTA 6");
    const driving = bySlug("gta-6-driving-tips");
    expect(driving).toMatchObject({ title: "GTA 6 Driving Tips: Drifting, Ducking, Drive-Bys & Hidden Tricks", shortTitle: "GTA 6 Driving Tips", publishedAt: "2026-11-22T09:44:12Z", showAuthor: false, toc: true, showModified: false });
    const indexed = driving.sections.filter((s) => !s.noIndex);
    expect(indexed).toHaveLength(11);
    expect(indexed[2]).toMatchObject({ heading: "Duck to Hide from the Cops", anchor: "duck-to-hide-from-the-cops" });
    expect(indexed.some((s) => s.heading === "Vehicle Melee" && s.anchor === "vehicle-melee")).toBe(true);
    expect(driving.related?.cards).toHaveLength(2);
    expect(A[6].slug).toBe("gta-6-phone-guide-every-app-explained");
    expect(A[8].slug).toBe("gta-6-review-bombed-on-metacritic");
    const controls = bySlug("gta-6-controls-guide-ps5-xbox-button-layout");
    expect(controls).toMatchObject({ canonicalPath: "/articles/gta-6/gta-6-controls-guide-ps5-xbox-button-layout", title: "GTA 6 Controls Guide: Full PS5 & Xbox Button Layout", shortTitle: "GTA 6 Controls Guide", showModified: true, modifiedAt: "2026-11-22T09:44:22Z", showAuthor: false, toc: true });
    expect(controls.publishedAt < "2026-11-22T09:44:22Z").toBe(true);
    expect(controls.sections.filter((s) => !s.noIndex)).toHaveLength(10);
    expect(controls.related).toMatchObject({ heading: "Controls Across All Games" });
    expect(controls.related?.cards).toHaveLength(2);
    expect(bySlug("grand-theft-auto-vi-launch-trailer")).toMatchObject({ title: "Grand Theft Auto VI Launch Trailer", publishedAt: "2026-10-15T10:49:56Z", video: true, showAuthor: true, canonicalPath: "/articles/gta-6/grand-theft-auto-vi-launch-trailer" });
    for (const p of Object.values(D.articlePaths)) {
      const [, , , slug] = p.split("/");
      const form = p.startsWith("/gta-6/") ? "gta6" : "legacy";
      expect(D.getArticleByPath(form, slug)?.canonicalPath).toBe(p);
    }
    expect(D.getArticleByPath("gta6", "gta-6-controls-guide-ps5-xbox-button-layout")?.isCanonical).toBe(false);
    expect(D.getArticleByPath("legacy", "this-article-does-not-exist-xyz")).toBeUndefined();
  });
});

describe("galleries, hub, membership (R-1619, R-1623, R-1624)", () => {
  it("has the gallery sizes", () => {
    const g = (id: string) => D.getGallery(id) as D.Gallery;
    expect(g("screenshots").images).toHaveLength(260);
    expect(g("trailers").images).toHaveLength(150);
    expect(D.getPageGalleries("/gta-6/artworks/").map((x) => x.images.length)).toEqual([8, 12, 6, 5, 4, 7]);
    expect(D.getPageGalleries("/gta-6/artworks/").every((x) => x.heading)).toBe(true);
    expect(g("covers").images).toHaveLength(1);
    expect(g("covers").images[0].caption).toBeTruthy();
    expect(D.getPageGalleries("/gta-6/map-locations/").map((x) => x.images.length)).toEqual([8, 6, 5, 5, 4, 4]);
    expect(g("vehicle:sanchez").images).toHaveLength(9);
    expect(g("character:jason:screenshots").images).toHaveLength(24);
    expect(g("character:jason:artworks").images).toHaveLength(6);
    expect(g("weapon:assault-rifle").images).toEqual([]);
    expect(g("animal:gray-fox").images).toEqual([]);
    expect(D.getGallery("vehicle:sunset-sanchez")).toBeUndefined();
    expect(D.getGallery("nope")).toBeUndefined();
  });

  it("has the hub info box and 33 cards", () => {
    expect(D.hub.title).toBe("GTA 6 (Grand Theft Auto VI)");
    expect(D.hub.infoRows.map((r) => r.label)).toEqual(["Release Date", "Series / Universe", "Set in Location", "Set in Year", "Publisher", "Developer"]);
    expect(D.hub.infoRows.flatMap((r) => r.values).filter((v) => v.href).map((v) => v.href)).toEqual(["/search?q=GTA+Series", "/search?q=HD+Universe"]);
    expect(D.hub.cardGrids.map((g) => g.cards.length)).toEqual([3, 9, 12, 3, 6]);
    expect(D.hub.cardGrids.map((g) => g.heading)).toEqual([undefined, "GTA 6 Database", "GTA 6 Guides", "GTA 6 Cheat Codes", "GTA 6 Media"]);
    expect(D.hub.sectionHeadings).toHaveLength(7);
    const paths = D.hub.cardGrids.flatMap((g) => g.cards.map((c) => c.path));
    for (const p of paths.filter((x) => x.includes("/articles/"))) {
      expect(D.articles.some((a) => a.canonicalPath === p)).toBe(true);
    }
  });

  it("has three plans and the 8-question FAQ with fixed aliases", () => {
    expect(D.plans.map((p) => p.title)).toEqual(["Explorer", "Supporter — yearly", "Supporter — monthly"]);
    expect(D.plans.every((p) => p.priceLine === "Coming later")).toBe(true);
    expect(D.membershipFaq).toHaveLength(8);
    expect(D.membershipFaq[1].alias).toBe("why-a-paid-membership-where-does-the-money-go");
    expect(D.membershipFaq[2].alias).toBe("will-my-subscription-extend-automatically");
    expect(D.membershipFaq.map((f) => f.openByDefault)).toEqual([true, false, false, false, false, false, false, false]);
    expect(new Set(D.membershipFaq.map((f) => f.alias)).size).toBe(8);
  });
});

describe("lookups (section 19.1)", () => {
  it("resolves detail paths in both forms and rejects unknown slugs", () => {
    expect(D.getItemByPath("vehicles", "sunset-sanchez", "gta6")).toMatchObject({ type: "vehicle", canonicalPath: "/gta-6/vehicles/sunset-sanchez", isCanonical: true });
    expect(D.getItemByPath("vehicles", "sunset-sanchez", "legacy")?.isCanonical).toBe(false);
    expect(D.getItemByPath("vehicles", "manchez", "legacy")).toMatchObject({ canonicalPath: "/vehicles/gta-6/manchez", isCanonical: true });
    expect(D.getItemByPath("vehicles", "no-such-vehicle-xyz", "gta6")).toBeUndefined();
    expect(D.getItemByPath("weapons", "drug-mule-kz-59", "gta6")?.type).toBe("weapon");
    expect(D.getItemByPath("animals", "gray-fox", "legacy")?.canonicalPath).toBe("/gta-6/animals/gray-fox");
    expect(D.getItemByPath("characters", "jason", "gta6")?.type).toBe("character");
    expect(D.getItemByPath("gangs", "final-chapter-mc", "legacy")?.isCanonical).toBe(true);
    expect(D.getItemByPath("properties", "paradise-garage", "legacy")?.isCanonical).toBe(true);
    expect(D.getItemByPath("radio-stations", "flash-fm", "gta6")?.type).toBe("radio");
    expect(D.getItemByPath("missions", "prologue", "legacy")?.isCanonical).toBe(true);
    expect(D.getItemByPath("missions", "breakfast-run", "gta6")?.isCanonical).toBe(true);
    expect(D.getItemByPath("missions", "search-for-the-skunk-ape", "gta6")).toBeUndefined();
    expect(D.getItemByPath("strangers", "search-for-the-skunk-ape", "gta6")?.type).toBe("mission");
    expect(D.getItemByPath("strangers", "search-for-the-skunk-ape", "legacy")).toBeUndefined();
    expect(D.getItemByPath("side-missions", "parachuting", "legacy")?.isCanonical).toBe(true);
    expect(D.getItemByPath("animals", "nonexistent-xyz", "gta6")).toBeUndefined();
  });

  it("returns neighbours, compare-to entries and compare-key lookups", () => {
    const first = D.vehicles[0];
    const last = D.vehicles[D.vehicles.length - 1];
    expect(D.getNeighbours("vehicles", first.slug).prev).toBeUndefined();
    expect(D.getNeighbours("vehicles", last.slug).next).toBeUndefined();
    expect(D.getNeighbours("vehicles", "nope")).toEqual({});
    expect(D.getVehicleByCompareKey("progen-emerus")?.slug).toBe("emerus");
    expect(D.getWeaponByCompareKey("heavy-pistol")?.name).toBe("1922");
    const kzEntries = D.getCompareToEntries("weapons", "assault-rifle");
    expect(kzEntries.every((e) => D.getWeaponBySlug(e.slug)?.weaponClass === "assault-rifles")).toBe(true);
    expect(D.getVehiclesOfClass("emergency").some((v) => v.classes[0] !== "emergency")).toBe(true);
  });

  it("builds latest content, search documents and art descriptors", () => {
    const latest = D.latestContent(8);
    expect(latest).toHaveLength(8);
    expect(latest[0].path).toBe("/gta-6/articles/how-to-claim-ultimate-edition-benefits-in-gta-6");
    const docs = D.searchDocuments();
    const order = ["hub", "vehicle", "weapon", "animal", "character", "gang", "property", "radio", "mission", "activity", "article", "map-category"];
    const seen = [...new Set(docs.map((d) => d.type))];
    expect(seen).toEqual(order);
    expect(docs.filter((d) => d.type === "vehicle")).toHaveLength(280);
    expect(docs.find((d) => d.path === "/gta-6/vehicles/sanchez")?.title).toBe("Maibatsu Sanchez");
    expect(D.artFor("vehicle", "sanchez")).toMatchObject({ kind: "vehicle", motif: "silhouette", label: "Maibatsu Sanchez" });
    expect(D.artFor("logo", "ubermacht")?.label).toBe("Ü");
    expect(D.artFor("shot", "sanchez-01")).toBeDefined();
    expect(D.artFor("vehicle", "nope")).toBeUndefined();
    expect(D.artFor("bogus", "sanchez")).toBeUndefined();
    // every image reference used by the catalogues resolves to a descriptor
    const refs: D.ArtRef[] = [
      ...D.vehicles.map((v) => v.image), ...D.weapons.map((w) => w.image), ...D.animals.map((a) => a.image),
      ...D.characters.map((c) => c.image), ...D.gangs.map((g) => g.image), ...D.properties.flatMap((p) => [p.image, p.mapImage]),
      ...D.radioStations.map((r) => r.image), ...D.missions.map((m) => m.image), ...D.activities.map((a) => a.image),
      ...D.articles.map((a) => a.hero), ...D.manufacturers.map((m) => m.logo), ...D.markers.flatMap((m) => (m.image ? [m.image] : [])),
      ...D.galleries.flatMap((g) => g.images.map((i) => i.art)), ...D.hub.cardGrids.flatMap((g) => g.cards.map((c) => c.image)),
      D.hub.banner, ...D.guideSectionLinks.map((s) => s.image),
    ];
    for (const r of refs) {
      expect(D.artFor(r.kind, r.id), `${r.kind}/${r.id}`).toBeDefined();
      expect(r.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(D.artUrl(r)).toBe(`/art/${r.kind}/${r.id}.svg`);
    }
  });

  it("only links to rebuild paths from marker details", () => {
    const known = new Set([
      ...D.vehicles.map((v) => v.canonicalPath), ...D.weapons.map((w) => w.canonicalPath), ...D.animals.map((a) => a.canonicalPath),
      ...D.properties.map((p) => p.canonicalPath), ...D.activities.map((a) => a.canonicalPath),
      "/gta-6/random-events/", "/gta-6/missions/", "/gta-6/side-missions/", "/gta-6/vehicles/", "/gta-6/weapons/",
      "/gta-6/characters/", "/gta-6/map-locations/", D.articlePaths.checklist,
    ]);
    for (const m of D.markers) if (m.detailsPath) expect(known.has(m.detailsPath), m.detailsPath).toBe(true);
  });
});

describe("determinism (R-1601)", () => {
  it("rebuilds identical data from a fresh module load", async () => {
    const snapshot = (m: typeof D) =>
      JSON.stringify([m.vehicles, m.weapons, m.animals, m.characters, m.properties, m.radioStations, m.missions, m.markers, m.mapCategories, m.articles, m.galleries, m.cheats]);
    const before = snapshot(D);
    vi.resetModules();
    const t0 = Date.now();
    const fresh = (await import("./index")) as typeof D;
    const loadMs = Date.now() - t0;
    expect(snapshot(fresh)).toBe(before);
    expect(fresh.vehicles).not.toBe(D.vehicles);
    expect(loadMs).toBeLessThan(2000);
  });
});
