import { describe, expect, it } from "vitest";
import { collectingOrder, markerNumbers, navLabels, navNumberText, nearestMarker, numberTooltip, stepMarker } from "./map-order";
import { SAFEHOUSES, WRATH } from "./map-fixtures.test-helpers";

describe("R-825 collecting order", () => {
  it("F4-54 safehouses: 001, 003, 002, 004, 005 (002 = number 3)", () => {
    const order = collectingOrder(SAFEHOUSES);
    expect(order.map((m) => m.id)).toEqual(["safehouse-001", "safehouse-003", "safehouse-002", "safehouse-004", "safehouse-005"]);
    const { numbers, total } = markerNumbers(order);
    expect(total).toBe(5);
    expect(numbers.get("safehouse-002")).toBe(3);
    expect(navNumberText(numbers.get("safehouse-001")!, total)).toBe("1 / 5");
  });
  it("only markers within 2000 units north of the southernmost remaining one are candidates", () => {
    const markers = [
      { id: "a", x: 0, y: 0 },
      { id: "far-north-but-near", x: 10, y: 2500 },
      { id: "south-far-east", x: 5000, y: 100 },
    ];
    expect(collectingOrder(markers).map((m) => m.id)).toEqual(["a", "south-far-east", "far-north-but-near"]);
  });
  it("ties: smaller id first", () => {
    const markers = [
      { id: "b", x: 0, y: 0 },
      { id: "a", x: 0, y: 0 },
      { id: "d", x: 5, y: 10 },
      { id: "c", x: -5, y: 10 },
    ];
    expect(collectingOrder(markers).map((m) => m.id)).toEqual(["a", "b", "c", "d"]);
    expect(collectingOrder([])).toEqual([]);
  });
  it("R-829 multi-spawn: same-name markers share a number; N counts distinct names", () => {
    const order = collectingOrder(WRATH);
    const { numbers, total } = markerNumbers(order, true);
    expect(total).toBe(9);
    expect(numbers.get("card-liberty-city-wrath-001")).toBe(numbers.get("card-liberty-city-wrath-013"));
    expect(numbers.get("card-liberty-city-wrath-002")).toBe(numbers.get("card-liberty-city-wrath-010"));
    expect(new Set(numbers.values()).size).toBe(9);
  });
});

describe("R-824 / R-825 popup navigation", () => {
  const order = collectingOrder(SAFEHOUSES);
  const { numbers } = markerNumbers(order);
  it("F4-20 previous of the first wraps to the last; labels", () => {
    const prev = stepMarker(order, "safehouse-001", -1)!;
    const next = stepMarker(order, "safehouse-001", 1)!;
    expect(prev.id).toBe("safehouse-005");
    expect(next.id).toBe("safehouse-003");
    expect(
      navLabels("Safehouses", { name: prev.name, number: numbers.get(prev.id)! }, { name: next.name, number: numbers.get(next.id)! }),
    ).toEqual({
      prev: "Previous in Safehouses: Starlet Motel (#5)",
      next: "Next in Safehouses: Pegassi Residences (#2)",
    });
  });
  it("F4-51..F4-53 next of the last wraps to the first; unknown id → null", () => {
    expect(stepMarker(order, "safehouse-005", 1)!.id).toBe("safehouse-001");
    expect(stepMarker(order, "nope", 1)).toBeNull();
  });
  it("number tooltips", () => {
    expect(numberTooltip(1, true)).toBe("Number 1 in a collecting order from south to north");
    expect(numberTooltip(4, false)).toBe("Number 4 of this category, in the order of the list from south to north");
  });
  it("R-817 arrow: the marker nearest to the centre", () => {
    expect(nearestMarker(SAFEHOUSES, { x: -1600, y: -3400 })!.id).toBe("safehouse-002");
    expect(nearestMarker([], { x: 0, y: 0 })).toBeNull();
  });
});
