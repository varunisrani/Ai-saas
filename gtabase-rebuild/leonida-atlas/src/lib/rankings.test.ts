import { describe, expect, it } from "vitest";
import {
  basedOnLine,
  classMenuOrder,
  classMenuTooltip,
  classPageSlug,
  classPluralLabel,
  orderRankingRows,
  rankingPath,
  rankingRowLabels,
  ratingLine,
} from "./rankings";
import { rankingListTitle, rankingTitle } from "./titles";

// R-1603 labels in tile order.
const LABELS = [
  "Super",
  "Sports",
  "Motorcycles",
  "Planes",
  "Helicopters",
  "Boats",
  "Muscle",
  "Off-Road",
  "Cycles",
  "Commercial",
  "Compacts",
  "Coupes",
  "Emergency",
  "Industrial",
  "Military",
  "Sedans",
  "Service",
  "Sports Classic",
  "SUVs",
  "Utility",
  "Vans",
];

describe("R-716 page slugs and plural labels", () => {
  it("F3-30 / F3-44: menu A→Z with the observed hrefs", () => {
    const menu = classMenuOrder(LABELS.map((label) => ({ label })));
    expect(menu.map((c) => c.label).join(" || ")).toBe(
      "Boats || Commercial || Compacts || Coupes || Cycles || Emergency || Helicopters || Industrial || Military || Motorcycles || Muscle || Off-Road || Planes || Sedans || Service || Sports || Sports Classic || Super || SUVs || Utility || Vans",
    );
    expect(menu.map((c) => rankingPath(c.label))).toEqual([
      "/gta-6/vehicles/best-boats/",
      "/gta-6/vehicles/best-commercial-vehicles/",
      "/gta-6/vehicles/best-compacts/",
      "/gta-6/vehicles/best-coupes/",
      "/gta-6/vehicles/best-cycles/",
      "/gta-6/vehicles/best-emergency-vehicles/",
      "/gta-6/vehicles/best-helicopters/",
      "/gta-6/vehicles/best-industrial-vehicles/",
      "/gta-6/vehicles/best-military-vehicles/",
      "/gta-6/vehicles/best-motorcycles/",
      "/gta-6/vehicles/best-muscle-cars/",
      "/gta-6/vehicles/best-off-road-vehicles/",
      "/gta-6/vehicles/best-planes/",
      "/gta-6/vehicles/best-sedans/",
      "/gta-6/vehicles/best-service-vehicles/",
      "/gta-6/vehicles/best-sports-cars/",
      "/gta-6/vehicles/best-sports-classic-cars/",
      "/gta-6/vehicles/best-super-cars/",
      "/gta-6/vehicles/best-suvs/",
      "/gta-6/vehicles/best-utility-vehicles/",
      "/gta-6/vehicles/best-vans/",
    ]);
    expect(classPageSlug("Sports Classic")).toBe("sports-classic-cars");
  });
  it("F3-30..F3-38 titles and list titles", () => {
    expect(classPluralLabel("Super")).toBe("Super Cars");
    expect(classPluralLabel("Off-Road")).toBe("Off-Road Vehicles");
    expect(classPluralLabel("Motorcycles")).toBe("Motorcycles");
    expect(rankingListTitle(classPluralLabel("Super"))).toBe("Full List of Best Super Cars in GTA 6:");
    expect(rankingListTitle(classPluralLabel("Sports"))).toBe("Full List of Best Sports Cars in GTA 6:");
    expect(rankingListTitle(classPluralLabel("Boats"))).toBe("Full List of Best Boats in GTA 6:");
    expect(rankingTitle(classPluralLabel("Helicopters"))).toBe("GTA 6 Best Helicopters List: Stats Ranking");
  });
  it("F3-44 tooltip", () => {
    expect(classMenuTooltip(classPluralLabel("Boats"))).toBe("The Best & Fastest Boats in GTA 6");
  });
});

describe("R-718 / R-719 rows", () => {
  it("road rating highest first, unrated after, ties in catalogue order", () => {
    const rows = [
      { slug: "a", roadRating: 700, position: 1 },
      { slug: "b", roadRating: null, position: 2 },
      { slug: "c", roadRating: 900, position: 3 },
      { slug: "d", roadRating: 700, position: 0 },
      { slug: "e", position: 4 },
    ];
    expect(orderRankingRows(rows).map((r) => r.slug)).toEqual(["c", "d", "a", "b", "e"]);
  });
  it("F3-35 / F3-37 an unrated class keeps catalogue order", () => {
    const boats = [
      { slug: "seashark", position: 40 },
      { slug: "dinghy", position: 12 },
    ];
    expect(orderRankingRows(boats)[0].slug).toBe("dinghy");
  });
  it("rating line and labels (F3-30, F3-32)", () => {
    expect(ratingLine(870, 300)).toBe("Road Rating: 870 · Off-Road Rating: 300");
    expect(ratingLine(null, undefined)).toBe("Road Rating: - · Off-Road Rating: -");
    expect(basedOnLine("Huracán Tribute")).toBe("Based on: Huracán Tribute");
    expect(basedOnLine(undefined)).toBeNull();
    expect(rankingRowLabels(true).join(" || ")).toBe("Based on: || Road Rating: || Off-Road Rating:");
    expect(rankingRowLabels(false).join(" || ")).toBe("Road Rating: || Off-Road Rating:");
  });
});
