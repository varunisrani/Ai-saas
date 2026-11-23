// Article list definitions and page resolution (R-1101..R-1110), shared by the list routes.
import { art, listArticles, type ArtRef, type GuideEntry } from "@/data";
import { itemsForStart, listPageTitle, orderArticles, pageCount, pageSlice, resolvePageSegment, siteTitle } from "@/lib";
import type { ArticleListKind } from "./ArticleList";
import { GTA6_CRUMB, type Crumb } from "@/components/ui";

export interface ListDef {
  kind: ArticleListKind;
  /** Name used in document titles. */
  name: string;
  /** Page-1 heading (h1). */
  heading: string;
  /** Heading base on pages ≥ 2 (News uses its category name). */
  pagedHeading: string;
  listUrl: string;
  intro: string;
  banner?: ArtRef;
  crumbs: (pageTitle: string | null) => Crumb[];
  description: string;
}

export const LIST_DEFS: Record<ArticleListKind, ListDef> = {
  news: {
    kind: "news",
    name: "GTA 6 News & Updates",
    heading: "GTA 6 News & Updates",
    pagedHeading: "Grand Theft Auto VI",
    listUrl: "/gta-6/news/",
    intro: "Fresh notes from around Leonida, newest first: patches, discoveries and the stories behind the sample data.",
    banner: art("banner", "hub"),
    crumbs: () => [GTA6_CRUMB, { label: "News" }],
    description: "The latest GTA 6 news and updates, newest first.",
  },
  guides: {
    kind: "guides",
    name: "GTA 6 Guides & Walkthroughs",
    heading: "GTA 6 Guides & Walkthroughs",
    pagedHeading: "GTA 6 Guides & Walkthroughs",
    listUrl: "/gta-6/guides/",
    intro: "Step-by-step help for the whole game: checklists, cheat codes, rankings and how-tos written by our team.",
    crumbs: () => [GTA6_CRUMB, { label: "Guides" }],
    description: "Every GTA 6 guide on Leonida Atlas, newest first.",
  },
  videos: {
    kind: "videos",
    name: "GTA 6 Videos & Trailers",
    heading: "GTA 6 Videos & Trailers",
    pagedHeading: "GTA 6 Videos & Trailers",
    listUrl: "/gta-6/videos/",
    intro: "Our breakdowns of every trailer and video so far, with notes on what to look for.",
    banner: art("banner", "hub"),
    crumbs: () => [GTA6_CRUMB, { label: "Videos" }],
    description: "GTA 6 trailers and video breakdowns.",
  },
  all: {
    kind: "all",
    name: "All News & Guides",
    heading: "All News & Guides",
    pagedHeading: "All News & Guides",
    listUrl: "/news/",
    intro: "Everything we publish across the site. Leonida Atlas covers GTA 6 only, so this list matches the GTA 6 news for now.",
    crumbs: () => [{ label: "News" }],
    description: "Every article published on Leonida Atlas.",
  },
};

const SOURCE: Record<ArticleListKind, "news" | "guides" | "videos" | "all"> = {
  news: "news",
  guides: "guides",
  videos: "videos",
  all: "all",
};

export function orderedEntries(kind: ArticleListKind): GuideEntry[] {
  return orderArticles(listArticles(SOURCE[kind]));
}

export interface ResolvedListPage {
  page: number;
  last: number;
  items: GuideEntry[];
  /** Whether the page-1 description block is shown. */
  showDescription: boolean;
  suffix: string | null;
  heading: string;
}

/** Page 1 of a list, or the page chosen by `?start=` (R-1106, R-1108). */
export function resolveFirstPage(kind: ArticleListKind, start?: string | null): ResolvedListPage {
  const all = orderedEntries(kind);
  const def = LIST_DEFS[kind];
  const last = kind === "videos" ? 1 : pageCount(all.length);
  if (kind !== "videos" && start !== undefined && start !== null) {
    const r = itemsForStart(all, start);
    if (r.page >= 2) {
      return { page: r.page, last, items: r.items, showDescription: false, suffix: `- Page ${r.page}`, heading: def.pagedHeading };
    }
    return { page: 1, last, items: r.items, showDescription: true, suffix: null, heading: def.heading };
  }
  return { page: 1, last, items: kind === "videos" ? all : pageSlice(all, 1), showDescription: true, suffix: null, heading: def.heading };
}

/** Page N ≥ 2 from a "page-N" segment, or null (404). */
export function resolvePagedSegment(kind: ArticleListKind, segment: string): ResolvedListPage | null {
  if (kind === "videos") return null;
  const all = orderedEntries(kind);
  const page = resolvePageSegment(segment, all.length);
  if (page === null) return null;
  const def = LIST_DEFS[kind];
  return {
    page,
    last: pageCount(all.length),
    items: pageSlice(all, page),
    showDescription: false,
    suffix: `- Page ${page}`,
    heading: def.pagedHeading,
  };
}

export function listTitle(kind: ArticleListKind, page: number): string {
  const def = LIST_DEFS[kind];
  return page >= 2 ? listPageTitle(def.name, page) : siteTitle(def.name);
}
