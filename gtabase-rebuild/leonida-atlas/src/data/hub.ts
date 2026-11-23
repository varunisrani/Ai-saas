// GTA 6 hub (R-1314..R-1319, R-1619), membership plans and FAQ (R-1408, R-1624), and own guide-page copy (W2).

import type { FaqItem, Hub, HubCard, HubCardGrid, Plan } from "./types";
import { art } from "./media";
import { articlePaths } from "./articles";
import { slugify } from "./util";

function card(label: string, path: string): HubCard {
  return { label, path, image: art("card", `hub-${slugify(label)}`) };
}

const grids: HubCardGrid[] = [
  {
    id: "head",
    cards: [card("Latest News", "/gta-6/news/"), card("Features Recap", articlePaths.featuresRecap), card("Guides", "/gta-6/guides/")],
  },
  {
    id: "database",
    heading: "GTA 6 Database",
    cards: [
      card("Vehicles", "/gta-6/vehicles/"),
      card("Weapons", "/gta-6/weapons/"),
      card("Interactive Map", "/gta-6/map/"),
      card("Characters", "/gta-6/characters/"),
      card("Gangs & Factions", "/gta-6/gangs/"),
      card("Animals", "/gta-6/animals/"),
      card("Properties", "/gta-6/properties/"),
      card("Vehicles Comparison", "/gta-6/vehicles/comparison/"),
      card("Weapons Comparison", "/gta-6/weapons/comparison/"),
    ],
  },
  {
    id: "guides",
    heading: "GTA 6 Guides",
    cards: [
      card("100% Completion", articlePaths.checklist),
      card("Story Missions", "/gta-6/missions/"),
      card("Strangers & Freaks", "/gta-6/strangers-missions/"),
      card("Activities", "/gta-6/side-missions/"),
      card("Random Events", "/gta-6/random-events/"),
      card("Locations Guide", "/gta-6/map-locations/"),
      card("Controls Guide", articlePaths.controls),
      card("Achievements & Trophies", articlePaths.achievements),
      card("Ultimate Edition", articlePaths.editions),
      card("Best Vehicles by Class", "/gta-6/vehicles/best-vehicles/"),
      card("Fastest Cars", articlePaths.fastestCars),
      card("Fastest Motorcycles", articlePaths.fastestMotorcycles),
    ],
  },
  {
    id: "cheats",
    heading: "GTA 6 Cheat Codes",
    cards: [
      card("GTA 6 Cheats for PS5", "/gta-6/gta-6-cheats-ps5-cheat-codes"),
      card("GTA 6 Cheats for Xbox", "/gta-6/gta-6-cheats-xbox-series-xs-cheat-codes"),
      card("GTA 6 Cheats for PC (Coming Soon)", "/gta-6/gta-6-cheats-pc-full-list-of-cheat-codes"),
    ],
  },
  {
    id: "media",
    heading: "GTA 6 Media",
    cards: [
      card("Screenshots", "/gta-6/screenshots/"),
      card("Videos & Trailers", "/gta-6/videos/"),
      card("Radio Stations", "/gta-6/radio-stations/"),
      card("Artworks & Wallpapers", "/gta-6/artworks/"),
      card("Cover Art", "/gta-6/covers/"),
      card("GTA 6 Online", articlePaths.gtaOnline),
    ],
  },
];

export const hub: Hub = {
  title: "GTA 6 (Grand Theft Auto VI)",
  banner: art("banner", "hub"),
  infoTitle: "GTA 6 (Grand Theft Auto VI): Game Info",
  infoRows: [
    { label: "Release Date", values: [{ text: "November 19, 2026" }] },
    {
      label: "Series / Universe",
      values: [
        { text: "GTA Series", href: "/search?q=GTA+Series" },
        { text: "HD Universe", href: "/search?q=HD+Universe" },
      ],
    },
    { label: "Set in Location", values: [{ text: "State of Leonida; Vice City" }] },
    { label: "Set in Year", values: [{ text: "2026" }] },
    { label: "Publisher", values: [{ text: "Rockstar Games" }] },
    { label: "Developer", values: [{ text: "Rockstar Games studios" }] },
  ],
  releaseDate: "2026-11-19",
  countdownTitle: "GTA 6 Release Countdown",
  aboutHeading: "About GTA 6",
  about: [
    "Leonida Atlas is a fan-made field guide to GTA 6. Every list, stat and marker on this site is invented sample data, built so you can try the tools before real data exists.",
    "Use the database to compare vehicles and weapons, tick off the 100% checklist, track collectibles on the interactive map and browse our own guides. Your progress stays in this browser.",
  ],
  cardGrids: grids,
  latestNewsHeading: "GTA 6: Latest News & Updates",
  latestNewsCount: 10,
  allNewsLink: { text: "All GTA 6 news & updates", href: "/gta-6/news/" },
  sectionHeadings: [
    "GTA 6 (Grand Theft Auto VI): Game Info",
    "About GTA 6",
    "GTA 6 Database",
    "GTA 6 Guides",
    "GTA 6 Cheat Codes",
    "GTA 6 Media",
    "GTA 6: Latest News & Updates",
  ],
};

// ---------------------------------------------------------------- membership (structure only, D-016)

export const plans: Plan[] = [
  {
    id: "free",
    title: "Explorer",
    priceLine: "Coming later",
    recommended: false,
    features: [
      { key: "plan-free-favorites", title: "Favorites", subtitle: "Star vehicles, weapons and map markers and find them again in the side column." },
      { key: "plan-free-checklists", title: "Checklists & Progress Tracker", subtitle: "Tick missions and 100% requirements; progress stays in your browser." },
      { key: "plan-free-collection", title: "GTA 6 Collection", subtitle: "Keep a personal list of the rides and weapons you own in the game." },
    ],
  },
  {
    id: "vip-year",
    title: "Supporter — yearly",
    priceLine: "Coming later",
    recommended: true,
    badge: "Best value",
    features: [
      { key: "plan-vip-map", title: "Interactive Map Extras", subtitle: "Personal markers, custom colours and route notes on the map." },
      { key: "plan-vip-profiles", title: "Multiple Profiles per Game", subtitle: "Separate progress for every playthrough." },
      { title: "Sync Across Devices", subtitle: "Pick up where you left off on any device, once accounts exist." },
    ],
  },
  {
    id: "vip-month",
    title: "Supporter — monthly",
    priceLine: "Coming later",
    recommended: false,
    features: [
      { title: "Interactive Map Extras", subtitle: "Everything the yearly plan has, billed monthly." },
      { title: "Multiple Profiles per Game", subtitle: "Separate progress for every playthrough." },
      { title: "Cancel Any Time", subtitle: "No commitment beyond the current month." },
    ],
  },
];

const FAQ: [alias: string | null, question: string, answer: string][] = [
  [null, "What is a Leonida Atlas membership?", "A plan for people who want extra tools on top of the free guide. Accounts and plans are coming later; nothing can be bought today."],
  ["why-a-paid-membership-where-does-the-money-go", "Why would there be paid plans, and what would the money pay for?", "Hosting, new tools and more hours spent on guides. Until accounts exist, everything on the site stays free."],
  ["will-my-subscription-extend-automatically", "Would a plan renew on its own?", "When plans launch, renewals will be clearly marked and easy to switch off. For now there is nothing to renew."],
  [null, "Do I need an account to use the checklists?", "No. Checklist ticks, map progress and favorites are saved in this browser without any account."],
  [null, "Will my browser progress move to an account later?", "That is the plan: when accounts arrive you will be offered a one-time import of what this browser holds."],
  [null, "Can I use Leonida Atlas on my phone?", "Yes. Every page works on small screens, including the map and the radio player."],
  [null, "Is any of the data on this site real?", "No. Every list, stat, marker and article is invented sample data for a fan-made guide."],
  [null, "How do I report a problem?", "Accounts and feedback forms are coming later. Until then, please check back for updates."],
];

export const membershipFaq: FaqItem[] = FAQ.map(([alias, question, answer], i) => ({
  alias: alias ?? slugify(question),
  question,
  answer,
  openByDefault: i === 0,
}));

// ---------------------------------------------------------------- own page copy (W2, D-017)

export interface PageCopy {
  title: string;
  heading: string;
  intro: string;
  /** Level-2 headings in order (grid headings first where the page has grids). */
  sections: string[];
}

export const guideCopy: Record<string, PageCopy> = {
  animals: {
    title: "GTA 6 Animals: Every Species on the Island | Leonida Atlas",
    heading: "GTA 6 Animals",
    intro: "Every creature we have catalogued so far, from the swamp to the reef. Open a card to see where it lives and how to approach it.",
    sections: ["Land Animals", "Birds", "Sea Life"],
  },
  characters: {
    title: "GTA 6 Characters: Who's Who in Leonida | Leonida Atlas",
    heading: "GTA 6 Characters",
    intro: "The people you will meet, grouped by how much of the story they share with you.",
    sections: ["Protagonists", "Main Characters", "Supporting Characters", "Minor Characters", "Other Characters", "Also Mentioned", "Characters FAQ"],
  },
  gangs: {
    title: "GTA 6 Gangs & Factions | Leonida Atlas",
    heading: "GTA 6 Gangs & Factions",
    intro: "The crews that run the streets and the people trying to stop them.",
    sections: ["Gangs & Crews", "Law Enforcement", "Who Answers the Calls", "How Factions Change the Map"],
  },
  properties: {
    title: "GTA 6 Properties & Garages | Leonida Atlas",
    heading: "GTA 6 Properties & Garages",
    intro: "Places to park, sleep and plan. Purchasable garages show their price; the rest unlock through the story or the editions.",
    sections: ["Purchasable Garages", "Story Properties", "Edition Properties", "Safehouses"],
  },
  "radio-stations": {
    title: "GTA 6 Radio Stations & Songs | Leonida Atlas",
    heading: "GTA 6 Radio Stations",
    intro: "Every station with its tracklist. Press Play on a row to hear a short sample tone of our own.",
    sections: ["All Stations"],
  },
  "map-locations": {
    title: "GTA 6 Map Locations Guide | Leonida Atlas",
    heading: "GTA 6 Map & Locations",
    intro: "A county-by-county tour of the island with a few pictures from each area.",
    sections: ["Coralwood County", "Saltgrass County", "Palmhaven County", "Mangrove Reach", "Sunbreak Keys", "Offshore Islands", "Getting Around"],
  },
  missions: {
    title: "GTA 6 Missions List | Leonida Atlas",
    heading: "GTA 6 Missions",
    intro: "Every story mission in order, without story spoilers. Tick the box on a card to keep track of what you have finished.",
    sections: ["GTA 6 Story Missions List:", "Prologue", "Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5"],
  },
  "strangers-missions": {
    title: "GTA 6 Strangers & Freaks | Leonida Atlas",
    heading: "GTA 6 Strangers & Freaks",
    intro: "Odd people with odder requests. Tick the checkbox next to a mission to track your progress.",
    sections: ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Other Optional Missions"],
  },
  "side-missions": {
    title: "GTA 6 Activities | Leonida Atlas",
    heading: "GTA 6 Activities",
    intro: "Pastimes for the quiet hours between jobs.",
    sections: ["All Activities"],
  },
  "random-events": {
    title: "GTA 6 Random Events | Leonida Atlas",
    heading: "GTA 6 Random Events",
    intro: "We are still collecting random events. This table fills in as we find them.",
    sections: ["Random Events"],
  },
};
