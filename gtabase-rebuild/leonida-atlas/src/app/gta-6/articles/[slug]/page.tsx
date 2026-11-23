import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleByPath } from "@/data";
import { ArticlePage, articleMetadata } from "@/components/content/ArticlePage";
import { ArticleListPage } from "@/components/content/ArticleListPage";
import { LIST_DEFS, listTitle, resolvePagedSegment } from "@/components/content/article-lists";

const PAGE_SEGMENT = /^page-\d+$/;

export async function generateMetadata({ params }: PageProps<"/gta-6/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (PAGE_SEGMENT.test(slug)) {
    const r = resolvePagedSegment("news", slug);
    return r ? { title: listTitle("news", r.page), description: LIST_DEFS.news.description } : {};
  }
  const found = getArticleByPath("gta6", slug);
  return found ? articleMetadata(found.article) : {};
}

/** `/gta-6/articles/<slug>` article (R-1111) or `/gta-6/articles/page-N` (news list alias, R-1101). */
export default async function Page({ params }: PageProps<"/gta-6/articles/[slug]">) {
  const { slug } = await params;
  if (PAGE_SEGMENT.test(slug)) {
    const r = resolvePagedSegment("news", slug);
    if (!r) notFound();
    return <ArticleListPage kind="news" resolved={r} />;
  }
  const found = getArticleByPath("gta6", slug);
  if (!found) notFound();
  return <ArticlePage article={found.article} />;
}
