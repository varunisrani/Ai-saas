import type { Metadata } from "next";
import { ArticleListPage } from "@/components/content/ArticleListPage";
import { LIST_DEFS, listTitle, resolveFirstPage } from "@/components/content/article-lists";

export const metadata: Metadata = {
  title: listTitle("guides", 1),
  description: LIST_DEFS["guides"].description,
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Guides list (R-1101..R-1110). */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <ArticleListPage kind="guides" resolved={resolveFirstPage("guides", first(sp.start))} />;
}
