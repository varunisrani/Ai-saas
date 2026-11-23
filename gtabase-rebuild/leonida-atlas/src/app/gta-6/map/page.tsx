/**
 * Interactive map page (F4, R-801..R-848): `/gta-6/map/`, one-category pages `?feature=<link key>` (R-819), deep
 * links `#<marker id>` / `#spot=<x>,<y>` read in the browser (R-822, R-827). The map data is shipped inline with the
 * page (no request after loading, R-807); below the map a static list of every category serves visitors without
 * scripts (R-806).
 */
import type { Metadata } from "next";
import { artFor, getCategoryByLinkKey, mapCategories, mapConfig, mapGroups, markers, type MapCategory } from "@/data";
import { featureHref, oneCategoryMapHeading, oneCategoryMapTitle, siteTitle } from "@/lib";
import { Breadcrumbs, GTA6_CRUMB } from "@/components/ui";
import { MapApp } from "@/components/map/MapApp";
import type { MapCategoryData, MapMarkerData } from "@/components/map/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const MAP_TITLE = siteTitle("GTA 6 Interactive Map: Collectibles, Robberies & Every Location");
const MAP_HEADING = "GTA 6 Interactive Map";

function featureCategory(sp: Record<string, string | string[] | undefined>): MapCategory | null {
  const raw = sp.feature;
  const key = Array.isArray(raw) ? raw[0] : raw;
  if (!key) return null;
  return getCategoryByLinkKey(key) ?? null;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const cat = featureCategory(await searchParams);
  if (cat) {
    return {
      title: oneCategoryMapTitle(cat.singularName, cat.distinctCount),
      description: `Every ${cat.singularName.toLowerCase()} location of the Leonida Atlas sample island on one interactive map.`,
      alternates: { canonical: featureHref(cat) },
    };
  }
  return {
    title: MAP_TITLE,
    description: "Filter, search and tick off every marker of the Leonida Atlas sample island. Progress stays in your browser.",
    alternates: { canonical: "/gta-6/map/" },
  };
}

export default async function MapPage({ searchParams }: { searchParams: SearchParams }) {
  const feature = featureCategory(await searchParams);
  const withMarkers = mapCategories.filter((c) => c.markerCount > 0);
  const categories: MapCategoryData[] = withMarkers.map((c) => ({
    id: c.id,
    name: c.name,
    singularName: c.singularName,
    group: c.group,
    trackable: c.trackable,
    hiddenByDefault: c.hiddenByDefault,
    multiSpawn: c.multiSpawn,
    slug: c.slug,
    linkKey: c.linkKey,
  }));
  const data: MapMarkerData[] = markers.map((m) => {
    const out: MapMarkerData = { id: m.id, name: m.name, category: m.category, x: m.x, y: m.y };
    if (m.description) out.description = m.description;
    if (m.detailsPath) out.detailsPath = m.detailsPath;
    if (m.image) {
      const d = artFor(m.image.kind, m.image.id);
      out.image = { kind: "marker", id: m.image.id, width: d?.width ?? 640, height: d?.height ?? 360 };
    }
    return out;
  });
  const heading = feature ? oneCategoryMapHeading(feature.singularName) : MAP_HEADING;

  return (
    <div className="la-map-page">
      <Breadcrumbs
        items={
          feature
            ? [GTA6_CRUMB, { label: "Interactive Map", href: "/gta-6/map/" }, { label: feature.name }]
            : [GTA6_CRUMB, { label: "Interactive Map" }]
        }
      />
      <MapApp
        groups={mapGroups.map((g) => ({ id: g.id, name: g.name, color: g.color }))}
        categories={categories}
        markers={data}
        art={{
          bounds: mapConfig.bounds,
          island: mapConfig.island,
          lagoons: mapConfig.lagoons,
          roads: mapConfig.roads,
          regions: mapConfig.regions,
        }}
        settings={{
          minZoom: mapConfig.minZoom,
          maxZoom: mapConfig.maxZoom,
          startZoom: mapConfig.startZoom,
          closeZoom: mapConfig.closeZoom,
          clusterBelowZoom: mapConfig.clusterBelowZoom,
          startMarkerId: mapConfig.startMarkerId,
          notice: mapConfig.notice,
        }}
        featureCategoryId={feature?.id ?? null}
        heading={heading}
      />
      <noscript>
        <p className="mt-3 rounded-2xl border border-coral bg-white p-3 text-sm font-semibold">The interactive map needs JavaScript.</p>
      </noscript>
      <section aria-labelledby="la-map-list-title" className="mt-8">
        <h2 id="la-map-list-title" className="sr-only">
          All map categories
        </h2>
        <p className="text-sm text-muted">
          Every category of the sample island, grouped as in the sidebar. Each link opens the map with only that
          category switched on.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {mapGroups.map((g) => {
            const cats = withMarkers.filter((c) => c.group === g.id);
            if (!cats.length) return null;
            return (
              <div key={g.id}>
                <h2 data-testid="static-list-groups" className="font-display text-base font-bold uppercase tracking-wide text-ink">
                  {g.name}
                </h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {cats.map((c) => (
                    <li key={c.id}>
                      <a href={featureHref(c)} className="text-teal underline-offset-2 hover:underline">
                        {c.name} — {c.markerCount} Locations
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
