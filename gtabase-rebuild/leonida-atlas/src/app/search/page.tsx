import type { Metadata } from "next";
import Link from "next/link";
import { searchDocuments } from "@/data";
import { localSearch } from "@/lib";
import { Breadcrumbs, GTA6_CRUMB, PageHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Search GTA 6 on Leonida Atlas | Leonida Atlas",
  description: "Search the GTA 6 sample database, guides and map categories of Leonida Atlas.",
};

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Local search results page (R-1308, DIVERGENCE D-003): grouped results over the sample data. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = first((await searchParams).q);
  const result = localSearch(q, searchDocuments());
  return (
    <div className="atlas-search-page">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Search" }]} />
      <PageHeading>Search</PageHeading>
      <form action="/search" method="get" role="search" className="atlas-search-form">
        <label htmlFor="atlas-search-page-q" className="sr-only">
          Search
        </label>
        <input id="atlas-search-page-q" type="search" name="q" defaultValue={q} placeholder="Search …" autoComplete="off" />
        <button type="submit" className="atlas-search-submit">
          Search
        </button>
      </form>
      <p className="atlas-search-message" role="status" data-testid="search-message">
        {result.message}
      </p>
      {result.groups.map((g) => (
        <section key={g.type} className="atlas-search-group" data-testid="search-group">
          <h2>
            {g.label}
            {g.total > g.items.length ? <span className="atlas-note"> (first {g.items.length} of {g.total})</span> : null}
          </h2>
          <ul>
            {g.items.map((d) => (
              <li key={`${d.type}-${d.path}`}>
                <Link href={d.path} data-testid="search-hit">
                  {d.title}
                </Link>
                {d.extra && d.type !== "article" ? <span className="atlas-note"> · {d.extra}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
