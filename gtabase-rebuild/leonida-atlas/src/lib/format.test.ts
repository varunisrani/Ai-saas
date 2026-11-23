import { describe, expect, it } from "vitest";
import {
  cardStatBar,
  cardStatText,
  countNoun,
  dateLine,
  detailStatText,
  detailStatWidth,
  formatLongDate,
  formatPrice,
  formatThousands,
  formatTime,
  headingSlug,
  markerCount,
  ratingText,
  twoDigits,
} from "./format";

describe("R-401 / R-402 dates", () => {
  it("UTC calendar date", () => {
    expect(formatLongDate("2026-11-21T00:16:15Z")).toBe("November 21, 2026");
    expect(formatLongDate("2026-11-22T23:59:59-05:00")).toBe("November 23, 2026");
    expect(formatLongDate("2019-03-04T00:00:00Z")).toBe("March 4, 2019");
    expect(formatLongDate("not a date")).toBe("");
  });
  it("F7-41 list date line, article meta, hub line", () => {
    expect(dateLine("published", "2026-10-15T10:49:56Z")).toBe("on October 15, 2026");
    expect(dateLine("modified", "2026-11-22T09:44:22Z")).toBe("Last Updated: November 22, 2026");
    expect(dateLine("hub", "2026-11-22T21:46:04Z")).toBe("Published on November 22, 2026");
  });
});

describe("R-403 / R-404 counters and money", () => {
  it("plural noun for every number", () => {
    expect(countNoun(0, "Vehicles")).toBe("0 Vehicles");
    expect(countNoun(1, "Vehicles")).toBe("1 Vehicles");
    expect(countNoun(211, "Weapons")).toBe("211 Weapons");
  });
  it("thousands separators, no decimals", () => {
    expect(formatPrice(12500)).toBe("$12,500");
    expect(formatPrice(950)).toBe("$950");
    expect(formatPrice(1234567)).toBe("$1,234,567");
    expect(formatPrice(1999.6)).toBe("$2,000");
    expect(formatThousands(1000)).toBe("1,000");
    expect(formatThousands(-4500)).toBe("-4,500");
  });
});

describe("R-405 / R-406 / R-533 stats", () => {
  it("card stat: value as stored on 0–10, raw on 0–1000, '?' when missing", () => {
    expect(cardStatText(7, 10)).toBe("7/10");
    expect(cardStatText(8.5, 10)).toBe("8.5/10");
    expect(cardStatText(640, 1000)).toBe("640");
    expect(cardStatText(undefined, 10)).toBe("?");
    expect(cardStatText(null, 1000)).toBe("?");
  });
  it("card bars: value × 10 % and value ÷ 10 %; unknown look", () => {
    expect(cardStatBar(9.2, 10)).toEqual({ text: "9.2/10", widthPercent: 92, state: "known" });
    expect(cardStatBar(640, 1000)).toEqual({ text: "640", widthPercent: 64, state: "known" });
    expect(cardStatBar(undefined, 10)).toEqual({ text: "?", widthPercent: 0, state: "unknown" });
  });
  it("detail stat: one decimal; missing '-' (HYPOTHESIS R-608)", () => {
    expect(detailStatText(4)).toBe("4.0");
    expect(detailStatText(8.1)).toBe("8.1");
    expect(detailStatText(null)).toBe("-");
    expect(detailStatWidth(8.1)).toBe(81);
    expect(detailStatWidth(undefined)).toBe(0);
  });
});

describe("R-410 rating line (HYPOTHESIS: always one decimal, singular Vote)", () => {
  it("observed forms", () => {
    expect(ratingText(0, 0)).toBe("0.0 of 5 (0 Votes)");
    expect(ratingText(3.6, 7)).toBe("3.6 of 5 (7 Votes)");
    expect(ratingText(4, 12)).toBe("4.0 of 5 (12 Votes)");
    expect(ratingText(4.25, 1)).toBe("4.3 of 5 (1 Vote)");
  });
});

describe("R-408 / R-409 times", () => {
  it("m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(9.9)).toBe("0:09");
    expect(formatTime(75)).toBe("1:15");
    expect(formatTime(3600)).toBe("60:00");
    expect(formatTime(-1)).toBe("0:00");
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
  it("two-digit fields", () => {
    expect(twoDigits(0)).toBe("00");
    expect(twoDigits(7)).toBe("07");
    expect(twoDigits(123)).toBe("123");
  });
});

describe("R-413 heading slugs", () => {
  it.each([
    ["Getting Out: Stop, Bail or Leave the Engine Running", "getting-out-stop-bail-or-leave-the-engine-running"],
    ["Duck to Hide from the Cops", "duck-to-hide-from-the-cops"], // F7-28
    ["Vehicle Melee", "vehicle-melee"], // F7-38
    ["How to Enter GTA 6 Cheats on PS5", "how-to-enter-gta-6-cheats-on-ps5"], // F6-18
    ["How to Enter GTA 6 Cheats on Xbox", "how-to-enter-gta-6-cheats-on-xbox"],
    ["How Many Cheats Are There in GTA 6?", "how-many-cheats-are-there-in-gta-6"], // F6-22
    ["Combat Cheats", "combat-cheats"], // F6-19
    ["Screen Filter Cheats", "screen-filter-cheats"], // F6-23
    ["Why a paid membership? Where does the money go?", "why-a-paid-membership-where-does-the-money-go"], // F6-28
    ["Will my subscription extend automatically?", "will-my-subscription-extend-automatically"], // F6-34
    ["Drifting & Drive-Bys -- Tips", "drifting-drive-bys-tips"],
    ["  - Shirley's 100% Rum -  ", "shirleys-100-rum"],
  ])("%j", (heading, slug) => {
    expect(headingSlug(heading)).toBe(slug);
  });
});

describe("R-412 marker plural", () => {
  it("1 marker / n markers", () => {
    expect(markerCount(1)).toBe("1 marker");
    expect(markerCount(0)).toBe("0 markers");
    expect(markerCount(3)).toBe("3 markers");
  });
});
