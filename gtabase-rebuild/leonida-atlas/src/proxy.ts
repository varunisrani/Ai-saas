/**
 * Request-level redirect layer (CLONE_SPEC section 0, R-002..R-004, R-012, R-713, R-722, section 19.3).
 * One permanent redirect (308) to the canonical URL when any rule changes it:
 *  - upper-case path → lower case (R-004);
 *  - `?i=` removed on detail and gallery pages (R-003);
 *  - trailing slash: hub, list, guide, gallery, map, comparison, ranking, membership and login pages WITH a slash;
 *    detail, article, cheat, checklist, page-N pages and /search WITHOUT one; /gta-6/articles served as is (R-002);
 *  - comparison query canonicalisation (R-713);
 *  - `/gta-6/vehicles/best-vehicles/?class=<id>` → that class's ranking page; unknown class → 404 (R-722, D-013).
 */
import { NextResponse, type NextRequest } from "next/server";
import { getVehicleClassById, vehicles, weapons } from "@/data";
import { canonicalComparison } from "@/lib";

const SLASH_EXACT = new Set([
  "/gta-6",
  "/news",
  "/membership",
  "/membership/free",
  "/login",
  "/gta-6/screenshots/trailers",
  "/gta-6/vehicles/comparison",
  "/gta-6/weapons/comparison",
]);

const GTA6_SLASH_SECTIONS = new Set([
  "vehicles",
  "weapons",
  "news",
  "guides",
  "videos",
  "missions",
  "strangers-missions",
  "side-missions",
  "random-events",
  "animals",
  "characters",
  "gangs",
  "properties",
  "radio-stations",
  "map-locations",
  "screenshots",
  "artworks",
  "covers",
  "map",
]);

const DETAIL_LISTS = new Set([
  "vehicles",
  "weapons",
  "animals",
  "characters",
  "properties",
  "radio-stations",
  "gangs",
  "missions",
  "strangers",
  "side-missions",
]);

const LEGACY_LISTS = new Set([
  "vehicles",
  "weapons",
  "animals",
  "characters",
  "properties",
  "soundtrack",
  "gangs",
  "missions",
  "side-missions",
]);

const GALLERY_PATHS = new Set(["/gta-6/screenshots", "/gta-6/screenshots/trailers", "/gta-6/artworks", "/gta-6/covers", "/gta-6/map-locations"]);

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

type SlashRule = "slash" | "noslash" | "keep";

/** Path kind for the slash rule; `p` is the path without trailing slashes. */
function slashRule(p: string): SlashRule {
  if (p === "" || p === "/") return "keep";
  if (SLASH_EXACT.has(p)) return "slash";
  if (p === "/search" || p === "/gta-6/articles") return "noslash";
  const parts = p.split("/").slice(1);
  if (parts[0] === "gta-6") {
    if (parts.length === 2) {
      if (GTA6_SLASH_SECTIONS.has(parts[1])) return "slash";
      if (parts[1].startsWith("gta-6-cheats-")) return "noslash";
      return "keep";
    }
    if (parts.length === 3) {
      const [, list, leaf] = parts;
      if (list === "vehicles" && /^best-[a-z0-9-]+$/.test(leaf)) return "slash";
      if (["news", "articles", "guides", "videos"].includes(list) && /^page-\d+$/.test(leaf)) return "noslash";
      if (list === "articles" && SLUG.test(leaf)) return "noslash";
      if (DETAIL_LISTS.has(list) && SLUG.test(leaf)) return "noslash";
      return "keep";
    }
    return "keep";
  }
  if (parts[0] === "news" && parts.length === 2 && /^page-\d+$/.test(parts[1])) return "noslash";
  if (parts.length === 3 && parts[1] === "gta-6" && SLUG.test(parts[2])) {
    if (parts[0] === "articles" || LEGACY_LISTS.has(parts[0])) return "noslash";
  }
  return "keep";
}

function isDetailOrGallery(p: string): boolean {
  if (GALLERY_PATHS.has(p)) return true;
  const parts = p.split("/").slice(1);
  if (parts.length !== 3) return false;
  if (parts[0] === "gta-6") return DETAIL_LISTS.has(parts[1]) && parts[2] !== "comparison" && !parts[2].startsWith("best-");
  return parts[1] === "gta-6" && LEGACY_LISTS.has(parts[0]);
}

let vehicleKeys: Set<string> | null = null;
let weaponKeys: Set<string> | null = null;

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const originalPath = url.pathname;
  const originalSearch = url.search;
  let path = originalPath;
  const params = new URLSearchParams(url.search);
  let paramsChanged = false;

  // R-004 upper case → lower case
  if (/[A-Z]/.test(path)) path = path.toLowerCase();

  const bare = path.length > 1 ? path.replace(/\/+$/, "") : path;

  // R-003 image parameter on detail and gallery pages
  if (params.has("i") && isDetailOrGallery(bare)) {
    params.delete("i");
    paramsChanged = true;
  }

  // R-002 trailing slash
  const rule = slashRule(bare);
  if (rule === "slash") path = `${bare}/`;
  else if (rule === "noslash") path = bare;

  // R-722 ranking class query
  if (bare === "/gta-6/vehicles/best-vehicles" && params.has("class")) {
    const cls = getVehicleClassById(params.get("class") ?? "");
    if (!cls) {
      return NextResponse.rewrite(new URL("/atlas-not-found", request.url));
    }
    const target = new URL(cls.rankingPath, request.url);
    params.delete("class");
    target.search = params.toString() ? `?${params.toString()}` : "";
    return NextResponse.redirect(target, 308);
  }

  // R-713 comparison query canonicalisation
  if (bare === "/gta-6/vehicles/comparison" || bare === "/gta-6/weapons/comparison") {
    const type = bare.includes("/vehicles/") ? "vehicle" : "weapon";
    if (type === "vehicle" && !vehicleKeys) vehicleKeys = new Set(vehicles.map((v) => v.compareKey));
    if (type === "weapon" && !weaponKeys) weaponKeys = new Set(weapons.map((w) => w.compareKey));
    const known = (type === "vehicle" ? vehicleKeys : weaponKeys) as Set<string>;
    const result = canonicalComparison(params, type, known);
    if (result.redirect) {
      return NextResponse.redirect(new URL(result.href, request.url), 308);
    }
  }

  const search = paramsChanged ? (params.toString() ? `?${params.toString()}` : "") : originalSearch;
  if (path !== originalPath || search !== originalSearch) {
    const target = new URL(request.url);
    target.pathname = path;
    target.search = search;
    return NextResponse.redirect(target, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|art/|audio/|favicon|icon|apple-icon|robots.txt|sitemap.xml|__nextjs).*)"],
};
