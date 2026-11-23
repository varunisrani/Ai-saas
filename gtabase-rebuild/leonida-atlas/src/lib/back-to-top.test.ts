import { describe, expect, it } from "vitest";
import { backToTopState, type BackToTopState } from "./back-to-top";

describe("R-1309 back to top", () => {
  it("hidden ≤ 300, visible > 300, faded > 1200 and sticky while between 300 and 1200", () => {
    let s: BackToTopState = "";
    const seq: Array<[number, BackToTopState]> = [
      [0, ""],
      [300, ""],
      [301, "visible"],
      [1200, "visible"],
      [1201, "visible faded"],
      [800, "visible faded"],
      [301, "visible faded"],
      [300, ""],
      [500, "visible"],
    ];
    for (const [y, want] of seq) {
      s = backToTopState(y, s);
      expect([y, s]).toEqual([y, want]);
    }
  });
});
