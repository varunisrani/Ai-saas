/**
 * Test-only map fixture: the 102 category ids in config order (R-1609, as listed by vector F4-03), their groups,
 * and a few invented markers with the fixed coordinates of R-1611. Not exported from index.ts.
 */
import f4 from "../../tests/vectors/f4-map.json";
import type { MapMarkerInput } from "./map-store";

interface Vector {
  id: string;
  keys: string[];
  expect: Record<string, string>;
}

export const F4 = f4 as unknown as Vector[];

const f403 = F4.find((v) => v.id === "F4-03");
export const CATEGORY_ORDER: string[] = (JSON.parse(f403!.expect["local:gtab-map-filter"]) as { hidden: string[] }).hidden;

export const HIDDEN_BY_DEFAULT = ["bus-stop", "ev-charger", "gas-station", "atm"];

/** Group of each category, by the config-order ranges of R-1609. */
export function groupOf(id: string): string {
  const i = CATEGORY_ORDER.indexOf(id) + 1;
  if (i <= 7) return "robberies";
  if (i <= 29) return "collectibles";
  if (i <= 48) return "collectible-cards";
  if (i <= 63) return "activities";
  if (id === "garage" || id === "safehouse") return "properties";
  if (id === "helipad") return "local-places";
  if (i <= 79) return "vehicles";
  if (i <= 82) return "weapons";
  if (i <= 87) return "style";
  if (i <= 93) return "food-drink";
  return "local-places";
}

export const SAFEHOUSES: MapMarkerInput[] = [
  { id: "safehouse-001", name: "Leonida Keys Bungalow", category: "safehouse", x: -2352, y: -5532 },
  { id: "safehouse-002", name: "Harbor Loft", category: "safehouse", x: -1500, y: -3500 },
  { id: "safehouse-003", name: "Pegassi Residences", category: "safehouse", x: -1900, y: -5000 },
  { id: "safehouse-004", name: "Grassrivers Cabin", category: "safehouse", x: -500, y: -1200 },
  { id: "safehouse-005", name: "Starlet Motel", category: "safehouse", x: 300, y: 1500 },
];

const WRATH_NAMES = ["Wrath One", "Wrath Two", "Wrath Three", "Wrath Four", "Wrath Five", "Wrath Six", "Wrath Seven", "Wrath Eight", "Wrath Nine"];
/** R-1610: 13 card markers, 001–009 distinct, 010–013 repeat the names of 002, 003, 004 and 001. */
export const WRATH: MapMarkerInput[] = Array.from({ length: 13 }, (_, i) => {
  const n = i + 1;
  const nameIndex = n <= 9 ? n - 1 : [1, 2, 3, 0][n - 10];
  const name = n === 13 ? `  ${WRATH_NAMES[nameIndex].toUpperCase()}  ` : WRATH_NAMES[nameIndex];
  return { id: `card-liberty-city-wrath-${String(n).padStart(3, "0")}`, name, category: "card-liberty-city-wrath", x: n * 100, y: -4000 + n * 300 };
});

export const BANKS: MapMarkerInput[] = Array.from({ length: 12 }, (_, i) => ({
  id: `bank-${String(i + 1).padStart(3, "0")}`,
  name: `Fleeca Branch ${i + 1}`,
  category: "bank",
  x: -3000 + i * 400,
  y: -6000 + i * 500,
  description: i === 4 ? "Vault: steel; Guards: two; near the old lighthouse" : undefined,
}));

export const ATMS: MapMarkerInput[] = Array.from({ length: 30 }, (_, i) => ({
  id: `atm-${String(i + 1).padStart(3, "0")}`,
  name: `Cash Point ${i + 1}`,
  category: "atm",
  x: -6000 + i * 300,
  y: -8000 + i * 350,
}));
