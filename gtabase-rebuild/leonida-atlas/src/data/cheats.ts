// Cheat codes (R-1009..R-1012, R-1621): 36 cheats in 5 categories, same on PS5 and Xbox, plus the
// three platform pages. Names, effects and unlock texts are own wording.

import type { Cheat, CheatCategory, CheatDirection, CheatPage, CheatPageSection } from "./types";
import { Rng, headingAnchor, slugify } from "./util";

export const cheatCategories: CheatCategory[] = [
  { id: "player-cheats", label: "Player Cheats", order: 1 },
  { id: "combat-cheats", label: "Combat Cheats", order: 2 },
  { id: "vehicle-spawn-cheats", label: "Vehicle Spawn Cheats", order: 3 },
  { id: "environment-cheats", label: "Environment Cheats", order: 4 },
  { id: "screen-filter-cheats", label: "Screen Filter Cheats", order: 5 },
];

const DEFS: Record<string, [name: string, effect: string][]> = {
  "player-cheats": [
    ["Second Wind", "Refills health and body armor."],
    ["Feather Fall", "Lands every fall softly for the next few minutes."],
    ["Track Star", "Lets you sprint without getting tired."],
    ["Deep Breath", "Lets you stay underwater much longer."],
    ["Clean Slate", "Clears your wanted level."],
    ["Most Wanted", "Raises your wanted level by one star."],
  ],
  "combat-cheats": [
    ["Full Arsenal", "Fills your weapon wheel with ammunition."],
    ["Steady Hands", "Slows down time while aiming."],
    ["Hot Rounds", "Makes bullets explode on impact."],
    ["Glove Upgrade", "Makes your punches send people flying."],
    ["Sparkler Shells", "Turns shotgun shells into fireworks."],
    ["Quick Draw", "Switches weapons instantly."],
    ["Bottomless Clip", "Removes the need to reload for a while."],
  ],
  "vehicle-spawn-cheats": [
    ["Spawn Dirt Bike", "Drops a dirt bike next to you."],
    ["Spawn Airboat", "Drops an airboat at the nearest shoreline."],
    ["Spawn Stunt Plane", "Places a stunt plane on the nearest open road."],
    ["Spawn Golf Cart", "Drops a golf cart next to you."],
    ["Spawn Limo", "Drops a stretch limousine next to you."],
    ["Spawn Monster Truck", "Drops a monster truck next to you."],
    ["Spawn Garbage Truck", "Drops a garbage truck next to you."],
    ["Spawn Racing Kart", "Drops a racing kart next to you."],
    ["Spawn Ice Cream Van", "Drops an ice cream van next to you."],
    ["Spawn Swamp Buggy", "Drops a swamp buggy next to you."],
    ["Spawn Speedboat", "Drops a speedboat at the nearest shoreline."],
    ["Spawn Helicopter", "Places a light helicopter nearby."],
  ],
  "environment-cheats": [
    ["Weather Wheel", "Cycles through the weather types."],
    ["Moon Gravity", "Lowers gravity for vehicles."],
    ["Slippery Streets", "Makes every road as slick as ice."],
  ],
  "screen-filter-cheats": [
    ["Sepia Postcard", "Adds an old postcard tint."],
    ["Neon Glow", "Pushes every light into neon colours."],
    ["Night Vision Look", "Switches the screen to a green night look."],
    ["Thermal Look", "Switches the screen to a heat camera look."],
    ["Drunk Cam", "Makes the camera sway."],
    ["Comic Ink", "Draws thick outlines around everything."],
    ["Pixel Mode", "Turns the picture into big pixels."],
    ["Film Grain", "Adds a grainy cinema filter."],
  ],
};

const UNLOCKS: readonly string[] = [
  "Available from the start once you can use the phone.",
  "Unlocks after finishing the Prologue.",
  "Unlocks after the first chapter.",
  "Read the scribbled note in the Old Cannery office to learn it.",
  "Win any street race to have the code texted to you.",
  "Unlocks after the second chapter.",
];

const DIRS: CheatDirection[] = ["UP", "DOWN", "LEFT", "RIGHT"];

export const cheats: Cheat[] = (() => {
  const rng = new Rng("cheats");
  const out: Cheat[] = [];
  const seen = new Set<string>();
  for (const cat of cheatCategories) {
    for (const [name, effect] of DEFS[cat.id]) {
      let sequence: CheatDirection[];
      if (out.length === 0) {
        sequence = ["UP", "RIGHT", "DOWN", "LEFT", "UP", "UP", "RIGHT", "DOWN"];
      } else {
        do {
          sequence = Array.from({ length: rng.int(6, 10) }, () => rng.pick(DIRS));
        } while (seen.has(sequence.join(",")));
      }
      seen.add(sequence.join(","));
      out.push({ id: slugify(name), category: cat.id, name, effect, unlock: rng.pick(UNLOCKS), sequence });
    }
  }
  return out;
})();

function section(heading: string, body: string[]): CheatPageSection {
  return { heading, anchor: headingAnchor(heading), body };
}

const consoleOwnSections = (platform: string): CheatPageSection[] => [
  section(`Do Cheats Disable Trophies on ${platform}?`, [
    "Using a cheat marks your save for the rest of the session, so trophies and achievements pause until you reload a clean save.",
  ]),
  section("Tips for Using Cheats Safely", [
    "Make a manual save before entering a code, and avoid saving while a cheat is active if you care about your 100% run.",
  ]),
];

export const cheatPages: CheatPage[] = [
  {
    platform: "ps5",
    path: "/gta-6/gta-6-cheats-ps5-cheat-codes",
    platformLabel: "GTA 6 Cheats for PS5",
    title: "GTA 6 Cheats for PS5: Every Button Code on Leonida Atlas",
    shortTitle: "GTA 6 PS5 Cheats",
    intro: "Every cheat code we know of for the PlayStation 5 version, grouped by what it does. Enter the sequence quickly with the D-pad.",
    firstSection: section("How to Enter GTA 6 Cheats on PS5", [
      "Cheats are typed in with the directional buttons while the game is running, after opening the cheat prompt.",
    ]),
    howToSteps: [
      "Press UP on the D-pad to open the phone.",
      "Hold L1 to bring up the cheat prompt.",
      "Tap R1, then enter the button sequence of the cheat you want.",
    ],
    howToIcons: ["UP", "L1", "R1"],
    ownSections: consoleOwnSections("PS5"),
  },
  {
    platform: "xbox",
    path: "/gta-6/gta-6-cheats-xbox-series-xs-cheat-codes",
    platformLabel: "GTA 6 Cheats for Xbox Series X|S",
    title: "GTA 6 Cheats for Xbox Series X|S: Every Button Code on Leonida Atlas",
    shortTitle: "GTA 6 Xbox Cheats",
    intro: "Every cheat code we know of for Xbox Series X and Series S, grouped by what it does. Enter the sequence quickly with the D-pad.",
    firstSection: section("How to Enter GTA 6 Cheats on Xbox", [
      "Cheats are typed in with the directional buttons while the game is running, after opening the cheat prompt.",
    ]),
    howToSteps: [
      "Press UP on the D-pad to open the phone.",
      "Hold LB to bring up the cheat prompt.",
      "Tap RB, then enter the button sequence of the cheat you want.",
    ],
    howToIcons: ["UP", "LB", "RB"],
    ownSections: consoleOwnSections("Xbox"),
  },
  {
    platform: "pc",
    path: "/gta-6/gta-6-cheats-pc-full-list-of-cheat-codes",
    platformLabel: "GTA 6 Cheats for PC",
    title: "GTA 6 Cheats for PC: What We Know So Far",
    shortTitle: "GTA 6 PC Cheats",
    intro: "There is no PC version to test yet, so this page collects what is known and points you to the console lists.",
    firstSection: section("How Many Cheats Are There in GTA 6?", [
      `Our console lists hold ${36} codes across five categories. Expect the PC list to match once that version exists.`,
    ]),
    howToSteps: [],
    howToIcons: [],
    ownSections: [
      section("Is There a PC Version Yet?", ["Not yet. We will fill this page in when there is something to test."]),
      section("Will PC Cheats Use Typed Codes?", ["Earlier games let you type words; we will confirm how it works here once we can."]),
      section("Where to Find the Console Codes", ["The PS5 and Xbox pages list every code with its button sequence."]),
      section("Do Cheats Work With Mods?", ["We do not test mods. Use a separate save if you experiment."]),
      section("Cheats and Achievements", ["On consoles, cheats pause trophies and achievements; expect the same on PC."]),
      section("Report a Missing Code", ["Spotted something we missed? Accounts are coming later, so for now keep notes and check back."]),
    ],
  },
];
