/**
 * Server part of a database list page (F1): heading, own intro, footer trail, and the client widget fed with the
 * whole dataset of the list (R-501). Image URLs are resolved here so the client bundle needs no data module.
 */
import { artUrl, getListIndex, listConfig, type ListName } from "@/data";
import { siteTitle } from "@/lib";
import { Breadcrumbs, GTA6_CRUMB, PageHeading } from "@/components/ui";
import { ListPage } from "./ListPage";
import type { ClientEntry } from "./ListCard";

const COPY: Record<ListName, { heading: string; crumb: string; intro: string; title: string; description: string }> = {
  vehicles: {
    heading: "GTA 6 Vehicles Database",
    crumb: "Vehicles",
    title: siteTitle("GTA 6 Vehicles Database: Stats, Classes & Makes"),
    description: "Filter, sort and compare every vehicle of the Leonida Atlas sample database.",
    intro:
      "Every ride in our sample garage in one place. Narrow it down by class, make or standout set, sort by speed or ratings, and tick up to four cards to compare them side by side.",
  },
  weapons: {
    heading: "GTA 6 Weapons Database",
    crumb: "Weapons",
    title: siteTitle("GTA 6 Weapons Database: Stats, Prices & Variants"),
    description: "Filter, sort and compare every weapon of the Leonida Atlas sample database.",
    intro:
      "The whole armoury of our sample data: base weapons and their unique variants. Filter by class, make or type, sort by damage or price, and pick up to four to compare.",
  },
};

export function listPageMetadata(list: ListName) {
  const c = COPY[list];
  return { title: { absolute: c.title }, description: c.description, alternates: { canonical: listConfig(list).path } };
}

export function ListPageShell({ list }: { list: ListName }) {
  const config = listConfig(list);
  const entries: ClientEntry[] = getListIndex(list).map((e) => ({
    ...e,
    imageUrl: artUrl(e.image),
    logoUrl: artUrl(e.makeLogo),
  }));
  const c = COPY[list];
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs items={[GTA6_CRUMB, { label: c.crumb }]} />
      <header className="flex flex-col gap-2">
        <PageHeading>{c.heading}</PageHeading>
        <p className="m-0 max-w-3xl text-muted">{c.intro}</p>
      </header>
      <ListPage config={config} entries={entries} />
    </div>
  );
}
