import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleListPage } from "@/components/content/ArticleListPage";
import { LIST_DEFS, listTitle, resolvePagedSegment } from "@/components/content/article-lists";

export async function generateMetadata({ params }: PageProps<"/news/[page]">): Promise<Metadata> {
  const { page } = await params;
  const r = resolvePagedSegment("all", page);
  return r ? { title: listTitle("all", r.page), description: LIST_DEFS["all"].description } : {};
}

/** Page N ≥ 2 of the list; page-1 and pages past the end are 404 (R-1106). */
export default async function Page({ params }: PageProps<"/news/[page]">) {
  const { page } = await params;
  const r = resolvePagedSegment("all", page);
  if (!r) notFound();
  return <ArticleListPage kind="all" resolved={r} />;
}
