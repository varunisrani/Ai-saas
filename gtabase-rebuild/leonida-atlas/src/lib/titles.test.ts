import { describe, expect, it } from "vitest";
import f2 from "../../tests/vectors/f2-detail.json";
import {
  INFO_LABELS,
  NOT_FOUND,
  VEHICLE_STAT_LABELS,
  WEAPON_STAT_LABELS,
  breadcrumbHref,
  breadcrumbLabel,
  comparisonTitle,
  detailH1,
  detailSectionTitles,
  detailTitle,
  listPageHeading,
  listPageTitle,
  oneCategoryMapHeading,
  oneCategoryMapTitle,
  rankingTitle,
  siteTitle,
  type SectionLayout,
} from "./titles";

interface Vector {
  id: string;
  expect: Record<string, string>;
}
const V = f2 as unknown as Vector[];
const exp = (id: string, key: string) => V.find((v) => v.id === id)!.expect[key];
const shown = (layout: SectionLayout, name: string, make?: string) =>
  detailSectionTitles(layout, name, make)
    .map((s) => (s.caps ? s.text.toUpperCase() : s.text))
    .join(" || ");

describe("R-603 titles, h1 and breadcrumbs", () => {
  it("h1: make + name for vehicles and weapons", () => {
    expect(detailH1("vehicle", "Sunset Sanchez", "Maibatsu")).toBe("Maibatsu Sunset Sanchez");
    expect(detailH1("weapon", "KZ-59", "Kozlov")).toBe("Kozlov KZ-59");
    expect(detailH1("vehicle", "Manchez", "Maibatsu")).toBe("Maibatsu Manchez"); // F2-30
    expect(detailH1("animal", "Gray Fox")).toBe("Gray Fox");
  });
  it("document titles", () => {
    expect(detailTitle("vehicle", "Bravado Banshee", "Sports Car")).toBe("Bravado Banshee | GTA 6 Sports Car Stats, Price, How To Get");
    expect(detailTitle("vehicle", "Maibatsu Sunset Sanchez", "Bike")).toBe("Maibatsu Sunset Sanchez | GTA 6 Bike Stats, Price, How To Get");
    expect(detailTitle("weapon", "Kozlov KZ-59")).toBe("Kozlov KZ-59 | GTA 6 Weapon Stats & How To Get");
    expect(detailTitle("weapon", "Kozlov Drug Mule KZ-59", undefined, "Drug Mule KZ-59")).toBe(
      "Drug Mule KZ-59: GTA 6 Unique Weapon Location & How To Get",
    );
    expect(detailTitle("mission", "Breakfast Run")).toBe("Breakfast Run | GTA 6 Mission Guide & Walkthrough");
    expect(detailTitle("gang", "Final Chapter MC")).toBe("Final Chapter MC | GTA 6 Gangs & Factions Guide");
  });
  it("F2-01..F2-08 breadcrumb labels and targets", () => {
    const cases: Array<[string, Parameters<typeof breadcrumbLabel>[0]]> = [
      ["F2-01", "vehicle"],
      ["F2-03", "weapon"],
      ["F2-04", "animal"],
      ["F2-05", "character"],
      ["F2-06", "property"],
      ["F2-07", "radio-station"],
      ["F2-08", "mission"],
    ];
    for (const [id, type] of cases) {
      expect(breadcrumbLabel(type)).toBe(exp(id, "text:breadcrumb"));
      expect(breadcrumbHref(type)).toBe(exp(id, "attr:breadcrumb@href"));
    }
    expect(breadcrumbLabel("gang")).toBe("GTA 6 Gangs & Factions Guide");
    expect(breadcrumbHref("mission", "stranger")).toBe("/gta-6/strangers-missions/");
  });
});

describe("R-606 section headings (shown text)", () => {
  it.each<[string, SectionLayout, string, string?]>([
    ["F2-01", "vehicle-standout", "Sunset Sanchez", "Maibatsu"],
    ["F2-02", "vehicle", "Sanchez", "Maibatsu"],
    ["F2-03", "weapon", "KZ-59", "Kozlov"],
    ["F2-33", "weapon-unique", "Drug Mule KZ-59", "Kozlov"],
    ["F2-04", "animal", "Gray Fox"],
    ["F2-05", "character", "Jason Duval"],
    ["F2-06", "property", "7th Avenue Garage"],
    ["F2-07", "radio-station", "Flash FM"],
    ["F2-08", "mission", "Breakfast Run"],
  ])("%s", (id, layout, name, make) => {
    expect(shown(layout, name, make)).toBe(exp(id, "list:section-titles"));
  });
});

describe("R-607 / R-608 label orders", () => {
  const subsequence = (all: readonly string[], seen: string) => {
    const want = seen.split(" || ");
    const kept = all.filter((l) => want.includes(l));
    return kept.join(" || ");
  };
  it("observed info rows are ordered subsequences of the configured order", () => {
    for (const [id, type] of [
      ["F2-01", "vehicle"],
      ["F2-02", "vehicle"],
      ["F2-32", "vehicle"],
      ["F2-03", "weapon"],
      ["F2-33", "weapon"],
      ["F2-04", "animal"],
      ["F2-05", "character"],
      ["F2-06", "property"],
      ["F2-07", "radio-station"],
      ["F2-08", "mission"],
    ] as const) {
      const seen = exp(id, "list:info-labels");
      expect(subsequence(INFO_LABELS[type], seen)).toBe(seen);
    }
  });
  it("stat labels (shown in capitals)", () => {
    expect(VEHICLE_STAT_LABELS.map((l) => l.toUpperCase()).join(" || ")).toBe(exp("F2-01", "list:stat-labels"));
    expect(WEAPON_STAT_LABELS.map((l) => l.toUpperCase()).join(" || ")).toBe(exp("F2-03", "list:stat-labels"));
  });
});

describe("R-414 / R-717 / R-819 / R-1108 other titles", () => {
  it("map, ranking, comparison, lists, 404", () => {
    expect(oneCategoryMapTitle("Safehouse", 5)).toBe("All GTA 6 Safehouse Locations (5) | Interactive Map");
    expect(oneCategoryMapHeading("Hidden Package")).toBe("GTA 6 Hidden Package Locations Map");
    expect(rankingTitle("Super Cars")).toBe("GTA 6 Best Super Cars List: Stats Ranking");
    expect(comparisonTitle("vehicle")).toBe("GTA 6 Vehicle Comparison");
    expect(comparisonTitle("weapon")).toBe("GTA 6 Weapon Comparison");
    expect(listPageTitle("Grand Theft Auto VI", 2)).toBe("Grand Theft Auto VI - Page 2 | Leonida Atlas");
    expect(listPageTitle("GTA 6 News", 1)).toBe("GTA 6 News | Leonida Atlas");
    expect(siteTitle("GTA 6 Animals")).toBe("GTA 6 Animals | Leonida Atlas");
    expect(listPageHeading("Grand Theft Auto VI", 2)).toEqual({ text: "Grand Theft Auto VI", suffix: "- Page 2" }); // F7-03
    expect(listPageHeading("GTA 6 Guides", 1).suffix).toBeNull();
    expect(NOT_FOUND).toEqual({ title: "404 Page Not Found", subHeading: "Get back inside the map!", breadcrumb: "Home › Page not found" });
  });
});
