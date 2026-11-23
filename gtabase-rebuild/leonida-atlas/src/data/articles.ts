// Articles (R-1613..R-1616, fixture rows of 16.2): 84 articles with deterministic, strictly decreasing
// dates, guide/video flags, tables of contents and related boxes; plus the 7 guide section links.
// Titles other than the four quoted in 16.2 and every body text are own wording.

import type { Article, ArticleSection, GuideEntry, PathForm, RelatedCard } from "./types";
import { art } from "./media";
import { Rng, headingAnchor, isoSeconds } from "./util";

export const AUTHORS: readonly string[] = ["Odessa Vale", "Tamsin Rook", "Basil Quint", "Juno Pell"];

const AUTHOR_BIOS: Record<string, string> = {
  "Odessa Vale": "Odessa maps every back road she can find and still gets lost in the swamp. She edits the guides on Leonida Atlas.",
  "Tamsin Rook": "Tamsin writes about cars, boats and anything else with an engine, and keeps the vehicle sample data honest.",
  "Basil Quint": "Basil covers news and video breakdowns. He pauses trailers frame by frame so you do not have to.",
  "Juno Pell": "Juno handles collectibles and checklists, and owns more highlighters than is reasonable.",
};

/** Paths of named articles that other pages link to (hub, sub-navigation, comparison links). */
export const articlePaths = {
  checklist: "/articles/gta-6/gta-6-100-completion-guide-interactive-checklist",
  achievements: "/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series",
  editions: "/articles/gta-6/gta-6-editions-guide-pre-order-bonus-special-editions-content",
  controls: "/articles/gta-6/gta-6-controls-guide-ps5-xbox-button-layout",
  fastestCars: "/articles/gta-6/gta-6-fastest-cars-ranked-list-by-top-speed",
  fastestMotorcycles: "/articles/gta-6/gta-6-fastest-motorcycles-ranked-list-by-top-speed",
  gtaOnline: "/articles/gta-6/when-is-gta-6-online-coming-out",
  featuresRecap: "/gta-6/articles/gta-6-features-recap",
  launchTrailer: "/articles/gta-6/grand-theft-auto-vi-launch-trailer",
  drivingTips: "/gta-6/articles/gta-6-driving-tips",
} as const;

// ---------------------------------------------------------------- named articles

interface NamedDef {
  slug: string;
  title: string;
  shortTitle?: string;
  form: PathForm;
  guide: boolean;
  video?: boolean;
  /** Index in News order (0 = newest). */
  index: number;
  date?: string;
  showAuthor?: boolean;
  showModified?: string;
  toc?: string[];
  related?: { heading: string; cards: string[] };
}

const DRIVING_SECTIONS = [
  "Ease Into the Throttle", "Drift Through Tight Corners", "Duck to Hide from the Cops", "Line Up Your Drive-Bys",
  "Vehicle Melee", "Bail Out Safely", "Use the Cinematic Camera", "Keep Your Ride Repaired", "Read the Road Surface",
  "Night Driving and Headlights", "Hidden Tricks Worth Knowing",
];

const CONTROLS_SECTIONS = [
  "On Foot Controls", "Driving Controls", "Flying Controls", "Boat Controls", "Combat Controls", "Phone Controls",
  "Weapon Wheel", "Camera Controls", "Menu Shortcuts", "Accessibility Options",
];

const NAMED: NamedDef[] = [
  { index: 0, slug: "how-to-claim-ultimate-edition-benefits-in-gta-6", title: "How to Claim All Ultimate Edition Bonuses in GTA 6", form: "gta6", guide: true, date: "2026-11-22T21:46:04Z" },
  { index: 1, slug: "how-to-use-turn-signals-and-headlights-in-gta-6", title: "Turn Signals and Headlights in GTA 6: A Quick How-To", form: "gta6", guide: true, date: "2026-11-22T20:12:37Z" },
  { index: 2, slug: "how-to-find-and-use-atms-in-gta-6", title: "Finding and Using ATMs in GTA 6", form: "gta6", guide: true, date: "2026-11-22T18:30:05Z" },
  { index: 3, slug: "gta-6-military-base-location", title: "Where the Military Base Is in GTA 6, and How to Get In", form: "gta6", guide: true, date: "2026-11-22T16:55:41Z" },
  { index: 4, slug: "can-you-play-gta-6-in-co-op-or-split-screen", title: "Is There Co-op or Split-Screen in GTA 6?", form: "gta6", guide: true, date: "2026-11-22T14:20:18Z" },
  { index: 5, slug: "how-to-fly-planes-helicopters-in-gta-6", title: "Flying Planes and Helicopters in GTA 6: Beginner Tips", form: "gta6", guide: true, date: "2026-11-22T12:48:09Z" },
  { index: 6, slug: "gta-6-phone-guide-every-app-explained", title: "The GTA 6 Phone, App by App", form: "gta6", guide: true, date: "2026-11-22T11:05:53Z" },
  {
    index: 7,
    slug: "gta-6-driving-tips",
    title: "GTA 6 Driving Tips: Drifting, Ducking, Drive-Bys & Hidden Tricks",
    shortTitle: "GTA 6 Driving Tips",
    form: "gta6",
    guide: true,
    date: "2026-11-22T09:44:12Z",
    showAuthor: false,
    toc: DRIVING_SECTIONS,
    related: { heading: "Keep Reading", cards: ["how-to-fly-planes-helicopters-in-gta-6", "gta-6-mod-shops-repairs-guide"] },
  },
  { index: 8, slug: "gta-6-review-bombed-on-metacritic", title: "GTA 6 Hit by a Wave of Angry User Reviews: What Happened", form: "gta6", guide: false, date: "2026-11-21T19:22:40Z" },
  { index: 9, slug: "gta-6-mod-shops-repairs-guide", title: "Mod Shops and Repairs in GTA 6: What Each Option Does", form: "gta6", guide: true, date: "2026-11-21T00:16:15Z" },
  {
    index: 12,
    slug: "gta-6-controls-guide-ps5-xbox-button-layout",
    title: "GTA 6 Controls Guide: Full PS5 & Xbox Button Layout",
    shortTitle: "GTA 6 Controls Guide",
    form: "legacy",
    guide: true,
    showAuthor: false,
    showModified: "2026-11-22T09:44:22Z",
    toc: CONTROLS_SECTIONS,
    related: { heading: "Controls Across All Games", cards: ["gta-6-driving-tips", "how-to-fly-planes-helicopters-in-gta-6"] },
  },
  { index: 15, slug: "gta-6-features-recap", title: "GTA 6 Features Recap: The Big Changes at a Glance", form: "gta6", guide: false },
  {
    index: 18,
    slug: "gta-6-achievements-trophies-list-ps5-xbox-series",
    title: "Every GTA 6 Achievement and Trophy, Listed",
    shortTitle: "GTA 6 Achievements",
    form: "legacy",
    guide: true,
    toc: ["Story Trophies", "Driving Trophies", "Combat Trophies", "Collectible Trophies", "Activity Trophies", "Online Trophies", "Hardest Trophies to Get"],
  },
  {
    index: 22,
    slug: "gta-6-editions-guide-pre-order-bonus-special-editions-content",
    title: "GTA 6 Editions Compared: Bonuses and What You Get",
    shortTitle: "GTA 6 Editions",
    form: "legacy",
    guide: true,
    toc: ["Standard Edition", "Special Edition", "Ultimate Edition", "Pre-Order Bonus", "How to Claim Your Bonuses", "Which Edition Should You Buy?"],
  },
  { index: 26, slug: "gta-6-fastest-cars-ranked-list-by-top-speed", title: "The Fastest Cars in GTA 6, Ranked by Top Speed", shortTitle: "Fastest Cars", form: "legacy", guide: true },
  { index: 27, slug: "gta-6-fastest-motorcycles-ranked-list-by-top-speed", title: "The Fastest Motorcycles in GTA 6, Ranked by Top Speed", shortTitle: "Fastest Motorcycles", form: "legacy", guide: true },
  { index: 33, slug: "when-is-gta-6-online-coming-out", title: "When Will GTA 6 Online Arrive? Everything We Know", form: "legacy", guide: false },
  { index: 36, slug: "gta-6-100-completion-guide-interactive-checklist", title: "GTA 6 100% Completion Checklist: Track Every Requirement", shortTitle: "GTA 6 100% Checklist", form: "legacy", guide: false },
  { index: 40, slug: "grand-theft-auto-vi-launch-trailer", title: "Grand Theft Auto VI Launch Trailer", form: "legacy", guide: false, video: true, date: "2026-10-15T10:49:56Z", showAuthor: true },
];

// ---------------------------------------------------------------- generated titles

const GUIDE_TITLES: readonly string[] = [
  "How to Make Money Fast in GTA 6", "How to Lose a Wanted Level in GTA 6", "How Saving Works in GTA 6",
  "How to Change Outfits in GTA 6", "How to Buy Your First Property in GTA 6", "How to Get a Boat in GTA 6",
  "How to Unlock Fast Travel in GTA 6", "How to Earn Respect With the Gangs in GTA 6", "GTA 6 Fishing Guide: Spots, Bait and Payouts",
  "GTA 6 Hunting Guide: Staying Safe in the Swamp", "How to Start a Heist in GTA 6", "How to Use the Weapon Wheel in GTA 6",
  "How to Tune Your Car in GTA 6", "Where to Get a Tattoo in GTA 6", "GTA 6 Photo Mode Guide", "GTA 6 Stock Market Tips",
  "Best Starter Cars in GTA 6", "Best Boats for Exploring the Keys in GTA 6", "Best Sniper Rifles in GTA 6",
  "Best Safehouses in GTA 6", "Best Places to Watch the Sunset in GTA 6", "Where to Find Every Gym in GTA 6",
  "Where to Find Airboat Rentals in GTA 6", "Where to Find the Arcade Machines in GTA 6", "GTA 6 Golf Guide: Holes and Tips",
  "GTA 6 Pool Guide: Winning Every Table", "How Wanted Levels Work in GTA 6", "How to Heal in GTA 6",
  "How to Swap Protagonists in GTA 6", "How Fuel and Repairs Work in GTA 6", "GTA 6 Radio Guide: Every Station Ranked",
  "How to Find Hidden Packages in GTA 6", "How to Complete Stunt Jumps in GTA 6", "GTA 6 Map Size Explained",
  "Best Weapons for Beginners in GTA 6", "How to Get Rich Without Heists in GTA 6", "GTA 6 Haircuts and Styles Guide",
  "How the In-Game Bank Works in GTA 6", "GTA 6 Shooting Range Guide: Every Medal", "How to Catch Every Fish Species in GTA 6",
  "GTA 6 Drone Race Guide", "How to Rent a Vehicle in GTA 6",
];

const NEWS_TITLES: readonly string[] = [
  "GTA 6 First Weekend in Numbers", "GTA 6 Patch Notes: Week One Fixes", "GTA 6 Photo Mode Contest Winners",
  "GTA 6 Soundtrack: Our Favourite Picks", "GTA 6 Map Compared With Earlier Games", "GTA 6 Sales Milestone Reported",
  "GTA 6 Easter Egg Roundup", "GTA 6 Accessibility Options Praised by Players", "GTA 6 Performance Mode Explained",
  "GTA 6 Countdown: One Week to Go", "GTA 6 Box Art Revealed", "GTA 6 Preload Times Announced", "GTA 6 Price Confirmed",
  "GTA 6 Pre-Orders Open", "GTA 6 Delay Rumours Addressed", "GTA 6 Rating Details Published",
  "GTA 6 Storage Size Revealed", "GTA 6 Community Theories We Love", "GTA 6 Wildlife Sightings Roundup",
  "GTA 6 Fan Art Spotlight", "GTA 6 Trailer Views Break Records", "GTA 6 New Screenshots Show the Keys",
];

const VIDEO_TITLES: readonly string[] = [
  "Video: Ten Things We Spotted in the Coastal Teaser",
  "Video: Leonida Wildlife Supercut",
  "Video: Every Vehicle in the Gameplay Reveal",
  "Video: Fan Theories, Explained",
  "Video: Our Countdown Recap",
  "Video: Looking Back at the First Rumours",
];

const SECTION_POOL: readonly string[] = [
  "Before You Start", "What You Need", "Step by Step", "Where to Go", "Common Mistakes", "Best Time to Do It",
  "Rewards", "Quick Tips", "Frequently Asked Questions", "Things We Are Still Testing", "Our Verdict", "Getting There",
  "What Changes Later", "Money Matters", "Safety First", "Shortcuts", "For Completionists",
];

const OPENERS: readonly string[] = [
  "The game never fully explains this, so here is what we learned.",
  "Most players stumble into this by accident; a little planning goes a long way.",
  "We spent a few evenings testing this so you do not have to.",
  "If this part has been bugging you, the notes below should clear things up.",
  "Here is the short version, with a few details we picked up along the way.",
];
const MIDDLES: readonly string[] = [
  "Keep your phone handy: half of the useful options live in its menus.",
  "The map marks most of what you need once you have visited an area at least once.",
  "Nothing here is permanent, so feel free to experiment and reload if it goes wrong.",
  "Timing matters more than speed; wait for the right moment instead of forcing it.",
  "The two protagonists handle this slightly differently, so try both.",
  "Expect the first attempt to be messy. The second one usually clicks.",
];
const CLOSERS: readonly string[] = [
  "We will update this page as soon as we find anything new.",
  "Spotted something we missed? Accounts are coming later; for now, keep notes and check back.",
  "That is all there is to it.",
  "Give it a try the next time you have a quiet evening in Leonida.",
];

function paragraph(rng: Rng): string {
  return `${rng.pick(OPENERS)} ${rng.pick(MIDDLES)} ${rng.pick(CLOSERS)}`;
}

function sectionsFrom(rng: Rng, headings: string[], noIndexLast = false): ArticleSection[] {
  return headings.map((heading, i) => ({
    heading,
    anchor: headingAnchor(heading),
    noIndex: noIndexLast && i === headings.length - 1,
    body: Array.from({ length: rng.int(1, 2) }, () => paragraph(rng)),
  }));
}

function shortTitleOf(title: string): string {
  const head = title.split(":")[0].replace(/\?$/, "");
  return head.length <= 48 ? head : head.slice(0, 45).replace(/\s+\S*$/, "") + "…";
}

// ---------------------------------------------------------------- dates (R-1616)

function buildDates(): number[] {
  const rng = new Rng("articles:dates");
  const t = (iso: string) => Date.parse(iso);
  const dates: number[] = new Array(84);
  for (const n of NAMED) if (n.date) dates[n.index] = t(n.date);
  const randomDesc = (count: number, from: number, to: number): number[] => {
    const set = new Set<number>();
    while (set.size < count) set.add(Math.floor((from + rng.next() * (to - from)) / 1000) * 1000);
    return [...set].sort((a, b) => b - a);
  };
  const mid = randomDesc(30, t("2026-10-15T12:00:00Z"), t("2026-11-20T22:00:00Z"));
  for (let i = 0; i < 30; i++) dates[10 + i] = mid[i];
  const old = randomDesc(42, t("2019-03-25T06:00:00Z"), t("2026-10-14T22:00:00Z"));
  for (let i = 0; i < 42; i++) dates[41 + i] = old[i];
  dates[83] = t("2019-03-24T15:07:31Z");
  return dates;
}

// ---------------------------------------------------------------- build

export function buildArticles(): Article[] {
  const rng = new Rng("articles");
  const dates = buildDates();
  const named = new Map(NAMED.map((n) => [n.index, n]));
  const videoIndexes = new Set([48, 56, 63, 70, 77, 83]);
  const guideTitles = rng.shuffle(GUIDE_TITLES);
  const newsTitles = rng.shuffle(NEWS_TITLES);
  let gi = 0;
  let ni = 0;
  let vi = 0;

  // which generated slots are guides (40) and news (19)
  const freeSlots: number[] = [];
  for (let i = 10; i < 84; i++) if (!named.has(i) && !videoIndexes.has(i)) freeSlots.push(i);
  const guideSlots = new Set(rng.sample(freeSlots, 40));

  const out: Article[] = [];
  for (let i = 0; i < 84; i++) {
    const n = named.get(i);
    let title: string;
    let slug: string;
    let form: PathForm;
    let guide: boolean;
    let video = false;
    if (n) {
      ({ title, slug, form, guide } = n);
      video = !!n.video;
    } else if (videoIndexes.has(i)) {
      title = VIDEO_TITLES[vi++];
      slug = headingAnchor(title);
      form = "legacy";
      guide = false;
      video = true;
    } else if (guideSlots.has(i)) {
      title = guideTitles[gi++];
      slug = headingAnchor(title);
      form = rng.chance(0.5) ? "gta6" : "legacy";
      guide = true;
    } else {
      title = newsTitles[ni++];
      slug = headingAnchor(title);
      form = rng.chance(0.5) ? "gta6" : "legacy";
      guide = false;
    }
    const shortTitle = n?.shortTitle ?? shortTitleOf(title);
    const a: Article = {
      slug,
      canonicalPath: form === "gta6" ? `/gta-6/articles/${slug}` : `/articles/gta-6/${slug}`,
      pathForm: form,
      title,
      shortTitle,
      summary: rng.pick([
        "Everything you need to know, in one place.",
        "Our notes, tested on the sample island.",
        "A short read for busy players.",
        "What we found out, step by step.",
      ]),
      publishedAt: isoSeconds(dates[i]),
      showModified: false,
      showAuthor: true,
      author: AUTHORS[rng.int(0, AUTHORS.length - 1)],
      guide,
      video,
      hero: art("article", slug),
      heroAlt: `Illustration for ${shortTitle}`,
      sections: [],
      toc: false,
    };
    if (n?.toc) {
      a.toc = true;
      a.sections = sectionsFrom(rng, n.toc);
    } else {
      a.sections = sectionsFrom(rng, rng.sample(SECTION_POOL, rng.int(2, 3)));
    }
    if (video) {
      a.videoPlaceholder = art("video", slug);
      a.sections = sectionsFrom(rng, ["What the Video Shows", "Our Take"]);
    }
    out.push(a);
  }

  const bySlug = new Map(out.map((a) => [a.slug, a]));
  const flagRng = new Rng("articles:flags");

  // tables of contents: 20 articles (driving tips, controls, achievements, editions + 16 guides)
  const tocPool = flagRng.sample(out.filter((a) => a.guide && !a.toc && !a.video), 16);
  for (const a of tocPool) {
    a.toc = true;
    const headings = flagRng.sample(SECTION_POOL, flagRng.int(5, 8));
    a.sections = sectionsFrom(flagRng, headings);
    // some articles close with a short section that stays out of the table of contents (R-1112)
    if (flagRng.chance(0.4)) a.sections.push(...sectionsFrom(flagRng, ["Final Word"], true));
  }

  // related boxes: 12 articles
  for (const n of NAMED) {
    if (!n.related) continue;
    const a = bySlug.get(n.slug) as Article;
    a.related = { heading: n.related.heading, cards: n.related.cards.map((s) => cardOf(bySlug.get(s) as Article)) };
  }
  const relatedPool = flagRng.sample(out.filter((a) => !a.related && !a.video), 10);
  for (const a of relatedPool) {
    const others = flagRng.sample(out.filter((o) => o !== a && o.guide === a.guide), flagRng.int(2, 4));
    a.related = { heading: "Keep Reading", cards: others.map(cardOf) };
  }

  // showModified: 6 articles (controls + 5)
  const controls = bySlug.get("gta-6-controls-guide-ps5-xbox-button-layout") as Article;
  controls.showModified = true;
  controls.modifiedAt = "2026-11-22T09:44:22Z";
  for (const a of flagRng.sample(out.filter((x) => !x.video && x !== controls && x.publishedAt < "2026-11-20"), 5)) {
    a.showModified = true;
    const pub = Date.parse(a.publishedAt);
    a.modifiedAt = isoSeconds(pub + flagRng.int(2, 40) * 86400000 + flagRng.int(0, 86399) * 1000);
    if (a.modifiedAt > "2026-11-22T21:00:00Z") a.modifiedAt = "2026-11-22T08:15:00Z";
  }

  // showAuthor: 59 of 84 (70 %); never on driving tips or controls, always on videos (R-1113)
  const noAuthorFixed = new Set(NAMED.filter((n) => n.showAuthor === false).map((n) => n.slug));
  const authorCandidates = out.filter((a) => !a.video && !noAuthorFixed.has(a.slug));
  const authored = new Set(flagRng.sample(authorCandidates, 59 - out.filter((a) => a.video).length));
  for (const a of out) {
    a.showAuthor = a.video || authored.has(a);
    if (a.video) a.authorBio = AUTHOR_BIOS[a.author];
  }
  return out;
}

function cardOf(a: Article): RelatedCard {
  return { title: a.title, path: a.canonicalPath, image: a.hero };
}

export const articles: Article[] = buildArticles();

/** Fixed section links of the Guides list (R-1101): 3 cheat pages, rankings, map locations, checklist, missions. */
export const guideSectionLinks: GuideEntry[] = [
  { slug: "section-cheats-ps5", title: "GTA 6 Cheats for PS5", path: "/gta-6/gta-6-cheats-ps5-cheat-codes", sortDate: "2026-11-19T15:02:10Z" },
  { slug: "section-cheats-xbox", title: "GTA 6 Cheats for Xbox Series X|S", path: "/gta-6/gta-6-cheats-xbox-series-xs-cheat-codes", sortDate: "2026-11-19T14:58:41Z" },
  { slug: "section-cheats-pc", title: "GTA 6 Cheats for PC", path: "/gta-6/gta-6-cheats-pc-full-list-of-cheat-codes", sortDate: "2026-11-18T10:21:03Z" },
  { slug: "section-best-vehicles", title: "Best Vehicles in GTA 6 by Class", path: "/gta-6/vehicles/best-vehicles/", sortDate: "2026-11-17T17:40:26Z" },
  { slug: "section-map-locations", title: "GTA 6 Locations Guide", path: "/gta-6/map-locations/", sortDate: "2026-11-16T12:09:55Z" },
  { slug: "section-checklist", title: "GTA 6 100% Completion Checklist", path: articlePaths.checklist, sortDate: "2026-11-20T08:33:47Z" },
  { slug: "section-missions", title: "GTA 6 Story Missions List", path: "/gta-6/missions/", sortDate: "2026-11-15T19:51:12Z" },
].map((s) => ({ kind: "section" as const, ...s, image: art("card", s.slug) }));
