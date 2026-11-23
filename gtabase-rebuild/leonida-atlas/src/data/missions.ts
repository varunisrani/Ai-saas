// Missions, activities, random events (R-1618) and the 100% checklist (R-1617).

import type { Activity, ChecklistItem, Mission, MissionKind, MissionObjective, RandomEventRow } from "./types";
import { art, makeRating } from "./media";
import { characters } from "./guides";
import { PLACES, uniquePersonNames } from "./words";
import { Rng, groupThousands, slugify } from "./util";

// ---------------------------------------------------------------- missions

const MAIN_TITLES: readonly string[] = [
  "Prologue", "Gone Fishing", "Breakfast Run",
  "Paper Trail", "Low Tide", "Glass Houses", "Cold Open", "Shell Game", "Dead Air", "Night Ferry", "Hot Property",
  "Backwater", "Saltwater Promise", "Ghost Lights", "Second Chances", "Dry Dock", "Clean Getaway", "Heat Index",
  "The Long Con", "Pastel Panic", "Storm Warning", "Last Call", "Cane Fire", "Open House", "High Water",
  "Crossed Wires", "Sunken Treasure", "Burned Bridges", "Neon Requiem", "Tollbooth", "Blank Check", "Undertow",
  "Fool's Gold", "Mangrove Maze", "Southbound", "The Big Score", "Final Lap", "Daybreak", "Homecoming", "Swan Song",
];

/** Main missions per chapter: Prologue 1, Chapter 1 9, Chapters 2–5 30. */
const CHAPTER_SIZES: [string, number][] = [
  ["Prologue", 1], ["Chapter 1", 9], ["Chapter 2", 8], ["Chapter 3", 8], ["Chapter 4", 7], ["Chapter 5", 7],
];

const OPTIONAL_TITLES: [title: string, chapter: string][] = [
  ["Get Shirley's Rum", "Chapter 1"], ["Bait and Switch", "Chapter 1"], ["Lost Dog Flyers", "Chapter 1"],
  ["Grandma's Airboat", "Chapter 2"], ["Flamingo Lawn Heist", "Chapter 2"], ["Karaoke Rescue", "Chapter 2"],
  ["Yard Sale Shakedown", "Chapter 3"], ["Pool Hall Payback", "Chapter 3"], ["Wrong Number", "Chapter 4"],
  ["Lucky Scratch Card", "Chapter 4"], ["Pier Pressure", "Chapter 5"], ["Ice Cream Run", "Chapter 5"],
];

const STRANGER_TITLES: readonly string[] = [
  "Search for the Skunk Ape", "Alien Abduction Hotline", "The Haunted Motel", "Bigfoot's Cousin",
  "Treasure Map Tattoo", "Message from Mars", "The Lighthouse Keeper", "Psychic Hotline",
  "UFO Over the Glades", "Mermaid Sightings", "The Phantom Hitchhiker", "Swamp Witch Errands",
  "Lost Astronaut", "Gator Wrestling Comeback", "Doomsday Bunker Tour", "Time Traveler's Taxi",
];

const FIXED_CHECKLIST_IDS: Record<string, string> = {
  prologue: "6644",
  "gone-fishing": "7285",
  "get-shirleys-rum": "7291",
  "search-for-the-skunk-ape": "7319",
};

const MISSION_TYPES = ["Story Mission", "Heist Setup", "Heist", "Chase", "Stealth", "Escort", "Getaway"];
const OBJECTIVE_HEADS = [
  "Meet the contact", "Get to the car", "Lose the cops", "Follow the target", "Grab the package", "Clear the area",
  "Head to the marina", "Hide the evidence", "Make the drop", "Get back to the safehouse", "Find a way in",
  "Take the boat", "Watch the meeting", "Pick up the crew",
];

function objectives(rng: Rng): MissionObjective[] {
  return rng.sample(OBJECTIVE_HEADS, rng.int(3, 5)).map((heading) => ({
    heading,
    text: rng.pick([
      "Stick to the yellow route on your map; the shortcut through the parking lots saves a few seconds.",
      "Take it slow here. Rushing tends to alert people you would rather keep calm.",
      "A wanted level is likely, so plan an escape route before you commit.",
      "Your partner handles the talking; you just need to keep the engine running.",
      "There is no timer, so look around for the optional pickup on the way.",
    ]),
  }));
}

export function buildMissions(): Mission[] {
  const rng = new Rng("missions");
  const protagonists = characters.filter((c) => c.grid === "protagonists").map((c) => c.name.split(" ")[0]);
  const cast = characters.filter((c) => c.grid === "main" || c.grid === "supporting").map((c) => c.name);
  const strangerGivers = uniquePersonNames(new Rng("missions:strangers"), 16, new Set(characters.map((c) => c.name)));
  const out: Mission[] = [];

  const make = (title: string, kind: MissionKind, chapter: string, extra: Partial<Mission>): Mission => {
    const slug = slugify(title);
    const canonicalPath =
      kind === "stranger" ? `/gta-6/strangers/${slug}` : slug === "prologue" ? "/missions/gta-6/prologue" : `/gta-6/missions/${slug}`;
    const reward = rng.int(4, 60) * 250;
    return {
      checklistId: "",
      slug,
      canonicalPath,
      position: 0,
      kind,
      chapter,
      title,
      badges: [],
      giver: kind === "stranger" ? undefined : rng.pick(cast),
      protagonist: rng.chance(0.2) ? "Both" : rng.pick(protagonists),
      missionType: kind === "main" ? rng.pick(MISSION_TYPES) : kind === "optional" ? "Optional Mission" : "Strangers & Freaks",
      requiredFor100: kind === "main" ? "Yes" : rng.chance(0.6) ? "Yes" : "No",
      featuring: rng.sample(cast, rng.int(1, 3)).join(", "),
      rewards: `$${groupThousands(reward)}${rng.chance(0.4) ? " and a new contact on your phone" : ""}`,
      summary: rng.pick([
        "A small favour that turns into a long night.",
        "Somebody needs a driver, and you need the money.",
        "Keep your head down and your eyes open.",
        "An easy job, as long as nobody asks questions.",
        "Old friends, new problems.",
        "A detour nobody planned for.",
      ]),
      walkthrough: [
        `${title} starts ${rng.pick(["with a phone call", "at the safehouse", "outside a diner", "at the docks"])} near ${rng.pick(PLACES)}. Follow the marker and listen to the briefing on the way.`,
        rng.pick([
          "The middle section is mostly driving; keep an eye out for the optional shortcut along the canal.",
          "Expect a short fight. Cover is plentiful, so let the enemies come to you.",
          "Stealth is optional but makes the last part much easier.",
        ]),
      ],
      objectives: objectives(rng),
      trophies: rng.pick([
        "No trophy is tied to this mission directly, but it counts toward the story completion award.",
        "Finishing it without losing your vehicle helps with one of the driving trophies.",
        "Counts toward the chapter completion achievement.",
      ]),
      listedOnStrangersPage: kind !== "main",
      image: art("mission", slug),
      rating: makeRating(rng),
      ...extra,
    };
  };

  let titleCursor = 0;
  let number = 1;
  for (const [chapter, size] of CHAPTER_SIZES) {
    for (let i = 0; i < size; i++) {
      const title = MAIN_TITLES[titleCursor++];
      const badges = title === "Gone Fishing" ? ["CHAPTER 1 POINT OF NO RETURN"] : [];
      out.push(make(title, "main", chapter, { number: number++, badges }));
    }
    for (const [title, ch] of OPTIONAL_TITLES) {
      if (ch !== chapter) continue;
      const missable = title === "Get Shirley's Rum" || rng.chance(0.3);
      out.push(make(title, "optional", chapter, { badges: missable ? ["OPTIONAL", "MISSABLE"] : ["OPTIONAL"] }));
    }
  }
  STRANGER_TITLES.forEach((title, i) => {
    const strangersChapter = Math.floor(i / 4) + 1;
    out.push(
      make(title, "stranger", `Chapter ${strangersChapter}`, {
        strangersChapter,
        giver: strangerGivers[i],
      }),
    );
  });

  out.forEach((m, i) => {
    m.position = i + 1;
    m.checklistId = FIXED_CHECKLIST_IDS[m.slug] ?? String(7000 + i);
  });
  return out;
}

export const missions: Mission[] = buildMissions();

// ---------------------------------------------------------------- activities (10, first parachuting)

const ACTIVITY_DEFS: [name: string, type: string][] = [
  ["Parachuting", "Extreme Sport"], ["Spearfishing", "Water Sport"], ["Golf Range", "Sport"], ["Street Races", "Racing"],
  ["Drone Courses", "Challenge"], ["Bowling Alley", "Leisure"], ["Darts Night", "Leisure"], ["Jet Ski Slalom", "Water Sport"],
  ["Arcade High Scores", "Leisure"], ["Yoga on the Pier", "Wellness"],
];

export const activities: Activity[] = (() => {
  const rng = new Rng("activities");
  return ACTIVITY_DEFS.map(([name, activityType], i) => {
    const slug = slugify(name);
    const location = rng.pick(PLACES);
    return {
      slug,
      canonicalPath: `/side-missions/gta-6/${slug}`,
      position: i + 1,
      name,
      activityType,
      location,
      summary: rng.pick([
        "A quick break between jobs.",
        "Good for a few laughs and a little cash.",
        "Practice makes perfect, and medals.",
        "Bring a friend and settle the score.",
      ]),
      description: `${name} is open around ${location}. Drop by whenever the story gives you a breather; scores and medals count toward the 100% checklist.`,
      image: art("activity", slug),
      rating: makeRating(rng),
    };
  });
})();

export const randomEvents: RandomEventRow[] = [{ event: "TBA", location: "TBA", reward: "TBA", status: "Coming Soon" }];

// ---------------------------------------------------------------- 100% checklist (list gta6-100, 38 items)

const C = (id: string, label: string, parent: string | undefined, weight: number | undefined, description: string, limit?: number): ChecklistItem => ({
  id,
  label,
  parent,
  weight,
  limit,
  multiplier: 1,
  description,
});

export const checklist100: ChecklistItem[] = [
  C("story", "Story Completion (50%)", undefined, 50, "Finish every main mission from the Prologue to the final chapter."),
  C("story-tasks", "Tasks (27%)", undefined, undefined, "Side jobs that run alongside the story. The section counts up to 27%.", 27),
  C("optional", "Optional Story Missions (6%)", "story-tasks", 6, "Every optional mission, including the missable ones."),
  C("gang-ops", "Gang Operations (3%)", "story-tasks", 3, "Help out each crew with their operations."),
  C("bank-jobs", "Bank Jobs (2%)", "story-tasks", 2, "Hit every bank on the island at least once."),
  C("payday", "Payday Loan Collections (2%)", "story-tasks", 2, "Collect from every payday loan office."),
  C("smash-grab", "Smash 'n' Grab Runs (2%)", "story-tasks", 2, "Complete each smash and grab job."),
  C("stick-ups", "Store Stick-Ups (2%)", "story-tasks", 2, "Hold up every corner store you can find."),
  C("narcotics", "Narcotics Deliveries (2%)", "story-tasks", 2, "Finish the delivery runs."),
  C("jewelry", "Jewelry Store Scores (2%)", "story-tasks", 2, "Clear out every jewelry counter."),
  C("marked-bills", "Marked Bills Laundered (2%)", "story-tasks", 2, "Wash every stack of marked bills."),
  C("vaults", "Vaults Cracked (2%)", "story-tasks", 2, "Open every vault you come across."),
  C("vehicles-fenced", "Vehicles Fenced (2%)", "story-tasks", 2, "Sell a car to every fence."),
  C("exploration", "Exploration & Activities (20%)", undefined, 20, "Collectibles and pastimes across the island; each item is worth 1%."),
  C("kenton", "5 of 7 Kenton Sets Completed (1%)", "exploration", undefined, "Finish any five of the seven sets."),
  C("cards", "Collectible Card Sets (1%)", "exploration", undefined, "Complete the card collections."),
  C("waink", "Waink Curiosities Found (1%)", "exploration", undefined, "Track down the curiosities, landmarks and sculptures."),
  C("underwater", "Underwater Wrecks Explored (1%)", "exploration", undefined, "Dive every wreck off the coast."),
  C("magazines", "Magazines Collected (1%)", "exploration", undefined, "Pick up every magazine and book."),
  C("meditation", "Meditation Spots (1%)", "exploration", undefined, "Sit still at every meditation spot."),
  C("flamingos", "Lawn Flamingos Found (1%)", "exploration", undefined, "Find the hidden plastic flamingos."),
  C("playlists", "Unique Playlists Heard (1%)", "exploration", undefined, "Listen to every unique playlist."),
  C("styles", "Style Challenges (1%)", "exploration", undefined, "Complete the clothing and tattoo challenges."),
  C("races", "Races Won (1%)", "exploration", undefined, "Win every street race."),
  C("race-challenges", "Race Challenges (1%)", "exploration", undefined, "Beat each race challenge time."),
  C("shooting", "Shooting Range Medals (1%)", "exploration", undefined, "Earn a medal on every range lane."),
  C("video-games", "Arcade Games Beaten (1%)", "exploration", undefined, "Beat the arcade cabinets."),
  C("pool", "Pool Games Won (1%)", "exploration", undefined, "Win a game at every pool table."),
  C("mini-golf", "Mini Golf Courses (1%)", "exploration", undefined, "Finish each mini golf course."),
  C("basketball", "Basketball Games (1%)", "exploration", undefined, "Win a pickup game on every court."),
  C("drones", "Drone Courses (1%)", "exploration", undefined, "Fly every drone course."),
  C("stunts", "Stunt Jumps Landed (1%)", "exploration", undefined, "Land every stunt jump."),
  C("challenges", "Side Challenges (1%)", "exploration", undefined, "Clear the side challenges listed in your phone."),
  C("target-decks", "Target Decks Cleared (1%)", "exploration", undefined, "Shoot down every target deck."),
  C("discovery", "Discovery (3%)", undefined, 3, "Fill in the in-game encyclopedia; each item is worth 1%."),
  C("vehicles", "Vehicles Discovered (1%)", "discovery", undefined, "Drive or ride every vehicle at least once."),
  C("weapons", "Weapons Discovered (1%)", "discovery", undefined, "Fire every weapon at least once."),
  C("animals", "Animals Photographed (1%)", "discovery", undefined, "Photograph every animal species."),
];
