import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleListPage } from "@/components/content/ArticleListPage";
import { LIST_DEFS, listTitle, resolvePagedSegment } from "@/components/content/article-lists";

export async function generateMetadata({ params }: PageProps<"/gta-6/guides/[page]">): Promise<Metadata> {
  const { page } = await params;
  const r = resolvePagedSegment("guides", page);
  return r ? { title: listTitle("guides", r.page), description: LIST_DEFS["guides"].description } : {};
}

/** Page N ≥ 2 of the list; page-1 and pages past the end are 404 (R-1106). */
export default async function Page({ params }: PageProps<"/gta-6/guides/[page]">) {
  const { page } = await params;
  const r = resolvePagedSegment("guides", page);
  if (!r) notFound();
  return <ArticleListPage kind="guides" resolved={r} />;
}
