import { describe, expect, it } from "vitest";
import {
  allButtonWord,
  arrowButtonLabel,
  copyLinkValue,
  escapeTarget,
  featureHref,
  foldButton,
  foundButton,
  fullscreenLabel,
  groupBoxState,
  isNarrowMap,
  linkKey,
  mapAddressPath,
  onlyButton,
  parseMapHash,
  parseSpotHash,
  railState,
  resetDialogText,
  resetDoneText,
  resetOptions,
  resolveFeatureKey,
  starButton,
  SHARED_SPOT,
  RESET_NOTHING,
  type AllButtonWord,
} from "./map-ui";

const CATS = [
  { id: "bank" },
  { id: "garage", slug: "garages" },
  { id: "safehouse", slug: "safehouses" },
  { id: "hidden-package", slug: "hidden-packages" },
  { id: "atm" },
];

describe("R-812 / R-819 link keys", () => {
  it("F4-02 / F4-20 hrefs", () => {
    expect(linkKey(CATS[0])).toBe("bank");
    expect(featureHref(CATS[0])).toBe("/gta-6/map/?feature=bank");
    expect(featureHref(CATS[1])).toBe("/gta-6/map/?feature=garages");
    expect(featureHref(CATS[2])).toBe("/gta-6/map/?feature=safehouses");
  });
  it("F4-16 / F4-18 valid keys; F4-17 / F4-19 an id of a slugged category or an unknown word → normal map", () => {
    expect(resolveFeatureKey("hidden-packages", CATS)?.id).toBe("hidden-package");
    expect(resolveFeatureKey("bank", CATS)?.id).toBe("bank");
    expect(resolveFeatureKey("hidden-package", CATS)).toBeNull();
    expect(resolveFeatureKey("no-such-category", CATS)).toBeNull();
    expect(resolveFeatureKey("", CATS)).toBeNull();
  });
});

describe("R-814 Hide all / Show all", () => {
  it("F4-01 / F4-03 / F4-04 / F4-05 / F4-11 / F4-12 sequences", () => {
    let word: AllButtonWord = "Hide all"; // start word
    word = allButtonWord(word, 98, 102);
    expect(word).toBe("Hide all"); // F4-01
    word = allButtonWord(word, 0, 102);
    expect(word.toUpperCase()).toBe("SHOW ALL"); // F4-03
    word = allButtonWord(word, 102, 102);
    expect(word.toUpperCase()).toBe("HIDE ALL"); // F4-04
    expect(allButtonWord("Hide all", 97, 102)).toBe("Hide all"); // F4-05
    expect(allButtonWord("Show all", 50, 102)).toBe("Show all"); // keeps previous word
    expect(allButtonWord("Hide all", 1, 102, true)).toBe("Show all"); // F4-11 after Only
    expect(allButtonWord("Show all", 102, 102)).toBe("Hide all"); // F4-12 after All
  });
});

describe("button words, names, tooltips", () => {
  it("R-831 found button (F4-01, F4-26)", () => {
    expect(foundButton(false)).toEqual({ text: "Hide found", title: "Take the markers you found off the map (the counts stay)" });
    expect(foundButton(true)).toEqual({ text: "Show found", title: "Put the markers you found back on the map" });
  });
  it("R-817 Only / All / arrow (F4-02, F4-11)", () => {
    expect(onlyButton("Garages", false)).toEqual({ text: "Only", label: "Show only this category: Garages" });
    expect(onlyButton("Garages", true)).toEqual({ text: "All", label: "Show all categories again: Garages" });
    expect(arrowButtonLabel("Garages")).toBe("Show only this category: Garages");
  });
  it("R-816 fold (F4-02, F4-09)", () => {
    expect(foldButton("Robberies", true)).toEqual({ label: "Hide Robberies", expanded: true });
    expect(foldButton("Robberies", false)).toEqual({ label: "Show Robberies", expanded: false });
  });
  it("R-815 group box; R-810 rail", () => {
    expect(groupBoxState(7, 7)).toEqual({ checked: true, mixed: false });
    expect(groupBoxState(6, 7)).toEqual({ checked: false, mixed: true }); // F4-05
    expect(groupBoxState(0, 7)).toEqual({ checked: false, mixed: false }); // F4-03 / F4-07
    expect(railState(0, false)).toBe("off");
    expect(railState(3, true)).toBe("on");
  });
  it("R-824 / R-1406 star; R-847 full screen; R-841 narrow", () => {
    expect(starButton(false)).toEqual({ label: "Add to favourites", pressed: false }); // F4-20, F10-22
    expect(starButton(true)).toEqual({ label: "Remove from favourites", pressed: true });
    expect(fullscreenLabel(false)).toBe("Full screen");
    expect(fullscreenLabel(true)).toBe("Exit full screen"); // F4-75
    expect(isNarrowMap(390)).toBe(true);
    expect(isNarrowMap(700)).toBe(false);
  });
});

describe("R-818 address while one category is shown by Only/arrow", () => {
  it("F4-11 / F4-13 → ?feature=garages; F4-12 / F4-14 → bare map", () => {
    expect(mapAddressPath(["garage"], "garage", CATS)).toBe("/gta-6/map/?feature=garages");
    expect(mapAddressPath(new Set(["garage", "bank"]), "garage", CATS)).toBe("/gta-6/map/");
    expect(mapAddressPath(["bank"], "garage", CATS)).toBe("/gta-6/map/");
    expect(mapAddressPath(["garage"], null, CATS)).toBe("/gta-6/map/");
  });
});

describe("R-832 / R-833 reset dialog", () => {
  it("F4-29 nothing found", () => {
    expect(resetDialogText([], null)).toBe(RESET_NOTHING);
    expect(RESET_NOTHING).toBe("Nothing to reset: no marker is ticked as found yet.");
  });
  it("F4-31 / F4-32 one safehouse found", () => {
    const found = [
      { id: "bank", name: "Banks", count: 0 },
      { id: "safehouse", name: "Safehouses", count: 1 },
    ];
    expect(resetOptions(found).map((o) => o.label).join(" || ")).toBe("All categories (1 found) || Safehouses (1 found)");
    expect(resetOptions(found)[0].value).toBe("");
    expect(resetDialogText(found, "")).toBe("This unticks the 1 marker you found, in every category. There is no undo.");
    expect(resetDialogText(found, "safehouse")).toBe("This unticks the 1 marker you found in Safehouses. There is no undo.");
  });
  it("plural and done text (R-412)", () => {
    const found = [
      { id: "safehouse", name: "Safehouses", count: 2 },
      { id: "bank", name: "Banks", count: 3 },
    ];
    expect(resetDialogText(found, null)).toBe("This unticks the 5 markers you found, in every category. There is no undo.");
    expect(resetDialogText(found, "bank")).toBe("This unticks the 3 markers you found in Banks. There is no undo.");
    expect(resetDoneText(1)).toBe("Done: 1 marker unticked.");
    expect(resetDoneText(5)).toBe("Done: 5 markers unticked.");
  });
});

describe("R-822 / R-826 / R-827 hashes and links", () => {
  it("copy link drops the query", () => {
    expect(copyLinkValue("https://atlas.example/gta-6/map/?feature=garages", "garage-003")).toBe("https://atlas.example/gta-6/map/#garage-003");
    expect(copyLinkValue("/gta-6/map/#safehouse-001", "safehouse-001")).toBe("/gta-6/map/#safehouse-001");
  });
  it("F4-56 shared spot; marker hashes", () => {
    expect(parseSpotHash("#spot=-2354,-5532")).toEqual({ x: -2354, y: -5532 });
    expect(parseSpotHash("#spot=1.5,2")).toEqual({ x: 1.5, y: 2 });
    expect(parseSpotHash("#spot=a,b")).toBeNull();
    expect(parseMapHash("#spot=-2354,-5532")).toEqual({ kind: "spot", x: -2354, y: -5532 });
    expect(parseMapHash("#safehouse-001")).toEqual({ kind: "marker", id: "safehouse-001" });
    expect(parseMapHash("#no-such-marker-999")).toEqual({ kind: "marker", id: "no-such-marker-999" }); // F4-55: caller finds nothing
    expect(parseMapHash("")).toBeNull();
    expect(SHARED_SPOT.title.toUpperCase()).toBe("SHARED SPOT");
    expect(SHARED_SPOT.text).toBe("Somebody shared this place on the map with you.");
  });
});

describe("R-842 Escape priority", () => {
  it("about > reset > panel > popup > narrow sidebar > full screen", () => {
    expect(escapeTarget({ popup: true, about: true })).toBe("about");
    expect(escapeTarget({ popup: true, reset: true })).toBe("reset");
    expect(escapeTarget({ popup: true, panel: true })).toBe("panel");
    expect(escapeTarget({ popup: true, narrowSidebar: true })).toBe("popup");
    expect(escapeTarget({ narrowSidebar: true, fullscreen: true })).toBe("narrowSidebar");
    expect(escapeTarget({ fullscreen: true })).toBe("fullscreen");
    expect(escapeTarget({})).toBeNull();
  });
});
