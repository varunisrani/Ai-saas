import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GangDetail, findGang, gangMetadata } from "@/components/content/GangDetail";

export async function generateMetadata({ params }: PageProps<"/gta-6/gangs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const g = findGang(slug);
  return g ? gangMetadata(g) : {};
}

/** Gang detail (section 0.1 row 12): both path forms render the page; the canonical form is the legacy one. */
export default async function Page({ params }: PageProps<"/gta-6/gangs/[slug]">) {
  const { slug } = await params;
  const g = findGang(slug);
  if (!g) notFound();
  return <GangDetail gang={g} />;
}
