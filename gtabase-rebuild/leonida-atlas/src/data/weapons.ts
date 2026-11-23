// Weapons database (sections 16.2, 16.3): 10 classes, 180 weapons = 60 base + 120 unique variants.

import type { Weapon, WeaponClass } from "./types";
import { art, galleryImages, makeRating } from "./media";
import { manufacturers } from "./vehicles";
import { GAME_LABELS, PLACES } from "./words";
import { Rng, groupThousands, isoSeconds, naturalCompare, round1, slugify } from "./util";

const CLASS_DEFS: [string, string][] = [
  ["handguns", "Handguns"],
  ["assault-rifles", "Assault Rifles"],
  ["smg", "SMG"],
  ["lmg", "LMG"],
  ["shotguns", "Shotguns"],
  ["sniper-rifles", "Sniper Rifles"],
  ["tactical-rifles", "Tactical Rifles"],
  ["launchers", "Launchers"],
  ["thrown", "Throwable"],
  ["melee", "Melee"],
];

export const weaponClasses: WeaponClass[] = CLASS_DEFS.map(([id, label], i) => ({ id, label, tileOrder: i + 1 }));

export const weaponTypes: { id: "base-weapon" | "unique-variant"; label: string }[] = [
  { id: "base-weapon", label: "Base Weapon" },
  { id: "unique-variant", label: "Unique Variant" },
];

interface BaseDef {
  name: string;
  slug?: string;
  make?: string;
}

/** Own base weapon names (fixtures: ".38" slug 38, "1922" slug heavy-pistol, "KZ-59" slug assault-rifle, "Knife"). */
const BASES: Record<string, (string | BaseDef)[]> = {
  handguns: [
    { name: ".38", slug: "38" }, { name: "1922", slug: "heavy-pistol" }, "Pocket Wren", "Harbor Service Pistol",
    "Marsh Revolver", "Twin Heron", "Reef Compact", "Lantern Pistol", "Coquina Auto", "Signal Revolver",
    "Bayou Pistol", "Starling Sidearm",
  ],
  "assault-rifles": [
    { name: "KZ-59", slug: "assault-rifle", make: "kozlov" }, "Tidewater Rifle", "Sawgrass Carbine", "Breaker Rifle",
    "Cormorant Carbine", "Keyline Service Rifle", "Lagoon Battle Rifle", "Shoal Rifle",
  ],
  smg: ["Skitter SMG", "Firefly Machine Pistol", "Dragonfly SMG", "Sandpiper SMG", "Ripcurrent SMG", "Minnow Machine Pistol", "Ember PDW"],
  lmg: ["Breakwater LMG", "Anchor Gun", "Stormfront MG"],
  shotguns: ["Marsh Pump", "Gator Coach Gun", "Driftwood Shotgun", "Seawall Auto Shotgun", "Stingray Pump", "Brine Sawn-Off", "Levee Shotgun"],
  "sniper-rifles": ["Longshore Rifle", "Heron Marksman", "Glasswater Sniper", "Lighthouse Rifle", "Kingfisher Precision"],
  "tactical-rifles": ["Gale Tactical", "Squall DMR", "Current Tactical Rifle"],
  launchers: ["Flare Launcher", "Surge Launcher", "Waterspout Tube"],
  thrown: ["Coral Grenade", "Smoke Canister", "Bottle Bomb", "Sticky Charge", "Flash Canister", "Tear Gas Can"],
  melee: ["Knife", "Machete", "Crowbar", "Baseball Bat", "Hatchet", "Pool Cue"],
};

/** Unique variants per class (totals per class: 36, 26, 22, 8, 22, 16, 10, 6, 10, 24 — R-1605). */
const VARIANT_COUNTS: Record<string, number> = {
  handguns: 24, "assault-rifles": 18, smg: 15, lmg: 5, shotguns: 15, "sniper-rifles": 11, "tactical-rifles": 7,
  launchers: 3, thrown: 4, melee: 18,
};

/** Fixture variants: KZ-59 gets exactly six ("Drug Mule" + five own words); "Knife" gets three knives. */
const FIXED_VARIANTS: { base: string; prefix: string }[] = [
  { base: "assault-rifle", prefix: "Drug Mule" },
  { base: "assault-rifle", prefix: "Sunburst" },
  { base: "assault-rifle", prefix: "Riptide" },
  { base: "assault-rifle", prefix: "Neon Lagoon" },
  { base: "assault-rifle", prefix: "Gilded" },
  { base: "assault-rifle", prefix: "Hurricane" },
  { base: "knife", prefix: "Coral" },
  { base: "knife", prefix: "Gator Tooth" },
  { base: "knife", prefix: "Dockside" },
];

const VARIANT_PREFIXES: readonly string[] = [
  "Rusted", "Midnight", "Tidal", "Lucky", "Swamp", "Velvet", "Sapphire", "Copper", "Pastel", "Moonlit", "Saltwater",
  "Flamingo", "Mangrove", "Palm", "Sunset", "Lagoon", "Smuggler's", "Bootlegger", "Showtime", "Heirloom", "Cobalt",
  "Jade", "Ivory", "Scarlet", "Ghost Orchid", "Night Market", "Harbor Master", "Lighthouse", "Bayou", "Tin Can",
];

interface StatRange {
  damage: [number, number];
  accuracy: [number, number];
  handling: [number, number];
  range: [number, number];
  price: [number, number];
  ammo?: [number, number];
}

const STATS: Record<string, StatRange> = {
  handguns: { damage: [3.0, 6.5], accuracy: [4.5, 7.5], handling: [6.5, 9.0], range: [2.5, 4.5], price: [900, 9500], ammo: [6, 17] },
  "assault-rifles": { damage: [5.0, 7.5], accuracy: [5.0, 7.5], handling: [5.0, 7.0], range: [5.5, 7.5], price: [6500, 32000], ammo: [25, 40] },
  smg: { damage: [3.5, 5.5], accuracy: [4.0, 6.5], handling: [7.0, 9.2], range: [3.0, 5.0], price: [3500, 18000], ammo: [20, 50] },
  lmg: { damage: [6.0, 8.0], accuracy: [3.5, 5.5], handling: [3.0, 5.0], range: [6.0, 8.0], price: [14000, 42000], ammo: [60, 150] },
  shotguns: { damage: [7.0, 9.5], accuracy: [2.5, 5.0], handling: [4.5, 7.0], range: [1.5, 3.5], price: [2500, 21000], ammo: [2, 12] },
  "sniper-rifles": { damage: [8.0, 9.8], accuracy: [8.0, 9.8], handling: [2.5, 5.0], range: [8.5, 10.0], price: [12000, 48000], ammo: [5, 10] },
  "tactical-rifles": { damage: [5.5, 7.5], accuracy: [6.5, 8.5], handling: [4.5, 6.5], range: [6.5, 8.5], price: [9000, 28000], ammo: [15, 30] },
  launchers: { damage: [9.0, 10.0], accuracy: [3.0, 6.0], handling: [2.0, 4.0], range: [6.0, 9.0], price: [25000, 85000], ammo: [1, 6] },
  thrown: { damage: [5.0, 9.5], accuracy: [2.0, 4.5], handling: [6.0, 9.0], range: [2.0, 4.0], price: [150, 1500] },
  melee: { damage: [2.0, 5.5], accuracy: [7.0, 9.5], handling: [7.0, 9.5], range: [0.5, 1.5], price: [50, 1200] },
};

const GUN_MAKERS: readonly string[] = ["Arvos", "Brannick", "Corrade", "Dessel", "Elmquist", "Fennick", "Galloran", "Hessler", "Ivers", "Jorran", "Kessig", "Lorne"];
const GUN_MODELS: readonly string[] = ["Patrolman", "Service 12", "Field Carbine", "Coastguard", "Ranger Mk 3", "Bayliner Special", "Courier", "Sentinel 40", "Warden", "Outrider", "Wayfarer", "Harbor Model"];
const ACQUISITION: readonly string[] = [
  "Buy it at any Ammu-Nation counter",
  "Reward for finishing the story chapter it first appears in",
  "Picked up from defeated enemies in the field",
  "Delivered to a safehouse after a stranger's favour",
  "Unlocked in the Ammu-Nation catalogue after a mission",
];
const MODS: readonly string[] = ["Suppressor", "Extended Clip", "Flashlight", "Scope", "Grip", "Compensator", "Muzzle Brake", "Holographic Sight", "Custom Livery"];

const GUN_CLASSES = new Set(["handguns", "assault-rifles", "smg", "lmg", "shotguns", "sniper-rifles", "tactical-rifles", "launchers"]);

function weaponDescription(rng: Rng, name: string, makeLabel: string, classLabel: string): string {
  const t = rng.int(0, 2);
  const cls = classLabel.toLowerCase();
  if (t === 0) {
    return `The ${makeLabel} ${name} sits among the ${cls} of the island: steady, honest and easy to keep fed. Most players meet it early and keep it around longer than they planned.`;
  }
  if (t === 1) {
    return `${makeLabel} built the ${name} for people who want one reliable tool in the ${cls} slot. It rewards patience more than spraying, and it looks good doing it.`;
  }
  return `A favourite in the ${cls} wheel, the ${makeLabel} ${name} trades a little flash for consistency. Pair it with a sidearm you trust and you are ready for most of Leonida.`;
}

export function buildWeapons(): Weapon[] {
  const rng = new Rng("weapons");
  // round-robin over the own makes so every weapon make appears in the data (R-507 options)
  const makeQueue = rng.shuffle(manufacturers.filter((m) => m.domain === "weapon" && m.id !== "kozlov").map((m) => m.id));
  let makeCursor = 0;
  const nextMake = () => makeQueue[makeCursor++ % makeQueue.length];
  const labelOf = new Map(manufacturers.map((m) => [m.id, m.label]));
  const classLabel = new Map(weaponClasses.map((c) => [c.id, c.label]));
  const dateRng = new Rng("weapons:added");
  const addedBase = Date.UTC(2026, 1, 2, 10, 0, 0);
  const weapons: Weapon[] = [];
  const bySlug = new Map<string, Weapon>();
  const takenSlugs = new Set<string>();

  // base weapons
  for (const [cls, defs] of Object.entries(BASES)) {
    const st = STATS[cls];
    for (const def of defs) {
      const d: BaseDef = typeof def === "string" ? { name: def } : def;
      const slug = d.slug ?? slugify(d.name);
      const make = d.make ?? nextMake();
      const gun = GUN_CLASSES.has(cls);
      const w: Weapon = {
        slug,
        compareKey: slug,
        canonicalPath: `/gta-6/weapons/${slug}`,
        position: 0,
        name: d.name,
        make,
        weaponClass: cls,
        type: "base-weapon",
        realLife: rng.chance(0.8) ? `${rng.pick(GUN_MAKERS)} ${rng.pick(GUN_MODELS)}` : undefined,
        damage: rng.dec1(st.damage[0], st.damage[1]),
        accuracy: rng.dec1(st.accuracy[0], st.accuracy[1]),
        handling: rng.dec1(st.handling[0], st.handling[1]),
        range: rng.dec1(st.range[0], st.range[1]),
        ammoCapacity: st.ammo ? `${rng.int(st.ammo[0], st.ammo[1])} rounds` : cls === "thrown" ? `${rng.int(3, 10)} carried` : undefined,
        extendedAmmo: gun && rng.chance(0.6) && st.ammo ? `${Math.round(st.ammo[1] * 1.6)} rounds` : undefined,
        acquisitionMethod: rng.pick(ACQUISITION),
        modifications: gun ? rng.sample(MODS, rng.int(2, 4)).join(", ") : undefined,
        variants: [],
        appearances: rng.chance(0.6) ? GAME_LABELS.filter((g) => g !== "GTA Online").slice(0, rng.int(1, 3)) : [],
        description: weaponDescription(rng, d.name, labelOf.get(make) ?? make, classLabel.get(cls) ?? cls),
        image: art("weapon", slug),
        gallery: [],
        rating: makeRating(rng),
        addedAt: isoSeconds(addedBase + dateRng.int(0, 290) * 86400000 + dateRng.int(0, 86399) * 1000),
      };
      const count = rng.chance(0.3) ? 0 : rng.int(1, 12);
      w.gallery = galleryImages({ prefix: slug, count, subject: `${labelOf.get(make)} ${d.name}`, noun: "screenshot", rng });
      weapons.push(w);
      bySlug.set(slug, w);
      takenSlugs.add(slug);
    }
  }

  // unique variants
  const makeVariant = (base: Weapon, prefix: string) => {
    const name = `${prefix} ${base.name}`;
    const slug = slugify(name);
    if (takenSlugs.has(slug)) return false;
    takenSlugs.add(slug);
    const st = STATS[base.weaponClass];
    const bump = (v: number | undefined, max: number) => (v === undefined ? undefined : round1(Math.min(max, v + rng.next() * 0.8)));
    const gun = GUN_CLASSES.has(base.weaponClass);
    const w: Weapon = {
      slug,
      compareKey: slug,
      canonicalPath: `/gta-6/weapons/${slug}`,
      position: 0,
      name,
      make: base.make,
      weaponClass: base.weaponClass,
      type: "unique-variant",
      baseModel: base.slug,
      damage: bump(base.damage, 10),
      accuracy: bump(base.accuracy, 10),
      handling: bump(base.handling, 10),
      range: bump(base.range, 10),
      ammoCapacity: base.ammoCapacity ?? (st.ammo ? `${st.ammo[1]} rounds` : undefined),
      modifications: gun ? rng.sample(MODS, rng.int(1, 3)).join(", ") : undefined,
      howToUnlock: `Found in a locked case at ${rng.pick(PLACES)}; the case only appears once you have reached ${rng.pick(["Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5"])}.`,
      variants: [],
      appearances: [],
      image: art("weapon", slug),
      gallery: [],
      rating: makeRating(rng),
      addedAt: isoSeconds(addedBase + dateRng.int(20, 290) * 86400000 + dateRng.int(0, 86399) * 1000),
    };
    const count = rng.chance(0.4) ? 0 : rng.int(1, 6);
    w.gallery = galleryImages({ prefix: slug, count, subject: name, noun: "screenshot", rng });
    weapons.push(w);
    bySlug.set(slug, w);
    return true;
  };

  for (const f of FIXED_VARIANTS) makeVariant(bySlug.get(f.base) as Weapon, f.prefix);
  for (const cls of Object.keys(BASES)) {
    const have = weapons.filter((w) => w.weaponClass === cls && w.type === "unique-variant").length;
    const bases = weapons.filter((w) => w.weaponClass === cls && w.type === "base-weapon" && w.slug !== "assault-rifle");
    let made = have;
    let guard = 0;
    while (made < VARIANT_COUNTS[cls] && guard++ < 2000) {
      if (makeVariant(rng.pick(bases), rng.pick(VARIANT_PREFIXES))) made++;
    }
  }

  // fixture profiles (16.2)
  const fixtureSlugs = new Set(["38", "heavy-pistol", "assault-rifle", "drug-mule-kz-59", "knife"]);
  const kz = bySlug.get("assault-rifle") as Weapon;
  kz.realLife = kz.realLife ?? "Arvos Field Carbine";
  kz.extendedAmmo = kz.extendedAmmo ?? "50 rounds";
  kz.howToUnlock = undefined;
  kz.gallery = [];
  kz.appearances = ["GTA IV", "GTA V", "GTA Online"];
  const p38 = bySlug.get("38") as Weapon;
  p38.realLife = p38.realLife ?? "Corrade Service 12";

  // prices on 70 weapons: 52 base weapons (".38" always) + 18 unique variants
  const priceRng = new Rng("weapons:prices");
  const priced = new Set<Weapon>();
  const bases = weapons.filter((w) => w.type === "base-weapon");
  priced.add(p38);
  for (const w of priceRng.shuffle(bases.filter((b) => b !== p38)).slice(0, 51)) priced.add(w);
  for (const w of priceRng.sample(weapons.filter((w) => w.type === "unique-variant"), 18)) priced.add(w);
  for (const w of priced) {
    const [lo, hi] = STATS[w.weaponClass].price;
    const step = hi > 5000 ? 50 : 5;
    w.price = Math.round((lo + priceRng.next() * (hi - lo)) / step) * step;
  }
  for (const w of bases) w.storyModePrice = w.price !== undefined ? `$${groupThousands(w.price)}` : "Free (story reward)";

  // overall rating = mean of the four bars
  for (const w of weapons) {
    const parts = [w.damage, w.accuracy, w.handling, w.range].filter((x): x is number => x !== undefined);
    w.overall = round1(parts.reduce((a, b) => a + b, 0) / parts.length);
  }

  // damage missing on 10 weapons (3 handguns)
  const gapRng = new Rng("weapons:gaps");
  const handgunPool = weapons.filter((w) => w.weaponClass === "handguns" && !fixtureSlugs.has(w.slug));
  const otherPool = weapons.filter((w) => w.weaponClass !== "handguns" && !fixtureSlugs.has(w.slug) && w.baseModel !== "assault-rifle");
  for (const w of [...gapRng.sample(handgunPool, 3), ...gapRng.sample(otherPool, 7)]) w.damage = undefined;

  // catalogue order: base weapons A→Z, each followed by its variants A→Z (R-1606)
  const ordered: Weapon[] = [];
  for (const b of bases.slice().sort((a, c) => naturalCompare(a.name, c.name))) {
    ordered.push(b);
    const own = weapons.filter((w) => w.baseModel === b.slug).sort((a, c) => naturalCompare(a.name, c.name));
    b.variants = own.map((w) => w.slug);
    ordered.push(...own);
  }
  ordered.forEach((w, i) => {
    w.position = i + 1;
  });
  return ordered;
}

export const weapons: Weapon[] = buildWeapons();
