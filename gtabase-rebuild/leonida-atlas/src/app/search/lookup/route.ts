// Names and canonical links of favorite keys for the side column's "Your favourites" block (R-1405).
// Read-only lookup over the sample data; keys: "gta-6:<list>/<slug>" or "gta6-map:<marker id>".
import { getItemByPath, getMapCategoryById, getMarkerById, displayName, type DetailList } from "@/data";

const SECTION: Record<string, string> = {
  vehicles: "Vehicles",
  weapons: "Weapons",
  animals: "Animals",
  characters: "Characters",
  properties: "Properties",
  "radio-stations": "Radio",
  missions: "Missions",
  gangs: "Gangs & Factions",
  "side-missions": "Activities",
};

export function GET(request: Request) {
  const url = new URL(request.url);
  const keys = url.searchParams.getAll("k").slice(0, 20);
  const rows: { key: string; title: string; href: string; section: string }[] = [];
  for (const key of keys) {
    const i = key.indexOf(":");
    if (i < 0) continue;
    const listKey = key.slice(0, i);
    const value = key.slice(i + 1);
    if (listKey === "gta6-map") {
      const m = getMarkerById(value);
      if (!m) continue;
      rows.push({ key, title: m.name, href: `/gta-6/map/#${m.id}`, section: getMapCategoryById(m.category)?.name ?? "Map" });
      continue;
    }
    const [list, slug] = value.split("/");
    if (!list || !slug || !(list in SECTION)) continue;
    let found = getItemByPath(list as DetailList, slug, "gta6") ?? getItemByPath(list as DetailList, slug, "legacy");
    if (!found && list === "missions") found = getItemByPath("strangers", slug, "gta6");
    if (!found) continue;
    const title =
      found.type === "vehicle" || found.type === "weapon"
        ? displayName(found.item)
        : found.type === "mission"
          ? found.item.title
          : found.item.name;
    rows.push({ key, title, href: found.canonicalPath, section: SECTION[list] });
  }
  return Response.json(rows);
}
