import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleByPath } from "@/data";
import { ArticlePage, articleMetadata } from "@/components/content/ArticlePage";

export async function generateMetadata({ params }: PageProps<"/articles/gta-6/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = getArticleByPath("legacy", slug);
  return found ? articleMetadata(found.article) : {};
}

/** `/articles/gta-6/<slug>` article (R-1111); both path forms render each article (R-008). */
export default async function Page({ params }: PageProps<"/articles/gta-6/[slug]">) {
  const { slug } = await params;
  const found = getArticleByPath("legacy", slug);
  if (!found) notFound();
  return <ArticlePage article={found.article} />;
}
