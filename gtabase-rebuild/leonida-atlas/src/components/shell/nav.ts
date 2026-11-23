// Navigation structure of the shell (R-1303, R-1306, R-1312) — own menu (DIVERGENCE D-012).
import { articlePaths } from "@/data";

export interface NavLink {
  label: string;
  href: string;
  /** Accessible name when it differs from the visible label ("GTA 6 - Map"). */
  ariaLabel?: string;
  /** Extra test tokens. */
  testId?: string;
}

export interface NavEntry {
  id: string;
  label: string;
  /** Undefined = no page of its own ("Database"). */
  href?: string;
  testId?: string;
  sub?: NavLink[];
}

const g = (label: string, href: string, testId?: string): NavLink => ({ label, href, ariaLabel: `GTA 6 - ${label}`, testId });

export const GTA6_SUB_LINKS: NavLink[] = [
  g("Map", "/gta-6/map/"),
  g("Vehicles", "/gta-6/vehicles/"),
  g("Weapons", "/gta-6/weapons/"),
  g("Missions", "/gta-6/missions/"),
  g("Characters", "/gta-6/characters/", "menu-gta6-characters"),
  g("100% Checklist", articlePaths.checklist),
  g("Animals", "/gta-6/animals/"),
  g("Radio", "/gta-6/radio-stations/"),
  g("Cheats PS5", "/gta-6/gta-6-cheats-ps5-cheat-codes"),
  g("Cheats Xbox", "/gta-6/gta-6-cheats-xbox-series-xs-cheat-codes"),
  { label: "All GTA 6 Content", href: "/gta-6/" },
];

export const MAIN_MENU: NavEntry[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "news", label: "News", href: "/gta-6/news/" },
  { id: "gta6", label: "GTA 6", href: "/gta-6/", testId: "menu-gta6", sub: GTA6_SUB_LINKS },
  {
    id: "database",
    label: "Database",
    sub: [
      { label: "Vehicles", href: "/gta-6/vehicles/" },
      { label: "Weapons", href: "/gta-6/weapons/" },
      { label: "Vehicle Comparison", href: "/gta-6/vehicles/comparison/" },
      { label: "Weapon Comparison", href: "/gta-6/weapons/comparison/" },
      { label: "Best Vehicles by Class", href: "/gta-6/vehicles/best-vehicles/" },
    ],
  },
  {
    id: "media",
    label: "Media",
    sub: [
      { label: "Screenshots", href: "/gta-6/screenshots/" },
      { label: "Trailer Screens", href: "/gta-6/screenshots/trailers/" },
      { label: "Artworks", href: "/gta-6/artworks/" },
      { label: "Cover Art", href: "/gta-6/covers/" },
      { label: "Videos", href: "/gta-6/videos/" },
    ],
  },
  {
    id: "more",
    label: "More",
    href: "#",
    testId: "menu-more",
    sub: [
      { label: "Membership", href: "/membership/" },
      { label: "Search", href: "/search" },
      { label: "About this site", href: "/" },
    ],
  },
];

export interface SubnavLink {
  key: string;
  label: string;
  href: string;
  ariaLabel?: string;
  /** Visually hidden label (the game logo link). */
  logo?: boolean;
}

const s = (key: string, label: string, href: string): SubnavLink => ({ key, label, href, ariaLabel: `GTA 6 - ${label}` });

/** R-1306: 18 links in this order. */
export const SUBNAV_LINKS: SubnavLink[] = [
  { key: "logo", label: "Game Logo", href: "/gta-6/", logo: true },
  s("overview", "Overview", "/gta-6/"),
  s("map", "Map", "/gta-6/map/"),
  s("vehicles", "Vehicles", "/gta-6/vehicles/"),
  s("weapons", "Weapons", "/gta-6/weapons/"),
  s("missions", "Missions", "/gta-6/missions/"),
  s("characters", "Characters", "/gta-6/characters/"),
  s("checklist", "100% Checklist", articlePaths.checklist),
  s("achievements", "Achievements", articlePaths.achievements),
  s("animals", "Animals", "/gta-6/animals/"),
  s("properties", "Properties", "/gta-6/properties/"),
  s("activities", "Activities", "/gta-6/side-missions/"),
  s("radio", "Radio", "/gta-6/radio-stations/"),
  s("guides", "Guides", "/gta-6/guides/"),
  s("strangers", "Strangers", "/gta-6/strangers-missions/"),
  s("cheats-ps5", "Cheats PS5", "/gta-6/gta-6-cheats-ps5-cheat-codes"),
  s("cheats-xbox", "Cheats Xbox", "/gta-6/gta-6-cheats-xbox-series-xs-cheat-codes"),
  { key: "all", label: "All GTA 6 Content", href: "/gta-6/" },
];

/** Key of the sub-navigation entry of the current section (R-1306), or null (news, articles, others). */
export function currentSubnavKey(pathname: string): string | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/gta-6") return "overview";
  if (p === articlePaths.checklist) return "checklist";
  if (p === articlePaths.achievements) return "achievements";
  const starts = (...prefixes: string[]) => prefixes.some((x) => p === x || p.startsWith(`${x}/`));
  if (starts("/gta-6/map")) return "map";
  if (starts("/gta-6/vehicles", "/vehicles/gta-6")) return "vehicles";
  if (starts("/gta-6/weapons", "/weapons/gta-6")) return "weapons";
  if (starts("/gta-6/missions", "/missions/gta-6")) return "missions";
  if (starts("/gta-6/characters", "/characters/gta-6")) return "characters";
  if (starts("/gta-6/animals", "/animals/gta-6")) return "animals";
  if (starts("/gta-6/properties", "/properties/gta-6")) return "properties";
  if (starts("/gta-6/side-missions", "/side-missions/gta-6")) return "activities";
  if (starts("/gta-6/radio-stations", "/soundtrack/gta-6")) return "radio";
  if (starts("/gta-6/guides")) return "guides";
  if (starts("/gta-6/strangers-missions", "/gta-6/strangers")) return "strangers";
  if (p === "/gta-6/gta-6-cheats-ps5-cheat-codes") return "cheats-ps5";
  if (p === "/gta-6/gta-6-cheats-xbox-series-xs-cheat-codes") return "cheats-xbox";
  return null;
}

/** Whether the main menu "GTA 6" entry gets its active look (R-1303). */
export function isGta6Path(pathname: string): boolean {
  return /^\/(gta-6|vehicles\/gta-6|weapons\/gta-6|animals\/gta-6|characters\/gta-6|properties\/gta-6|soundtrack\/gta-6|gangs\/gta-6|missions\/gta-6|side-missions\/gta-6|articles\/gta-6)(\/|$)/.test(pathname);
}

/** R-1312 footer: GTA 6 link list (10) and the six bottom links. */
export const FOOTER_GAME_LINKS: NavLink[] = GTA6_SUB_LINKS.slice(0, 10).map((l) => ({ label: l.label, href: l.href }));
export const FOOTER_BOTTOM_LINKS: NavLink[] = [
  { label: "Overview", href: "/gta-6/" },
  { label: "News", href: "/gta-6/news/" },
  { label: "Guides", href: "/gta-6/guides/" },
  { label: "Map", href: "/gta-6/map/" },
  { label: "Search", href: "/search" },
  { label: "Membership", href: "/membership/" },
];

export const COPYRIGHT_LINE =
  "© 2026 Leonida Atlas · Fan-made, not affiliated with Rockstar Games · All data on this site is invented sample data.";
