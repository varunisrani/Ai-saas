import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GangDetail, findGang, gangMetadata } from "@/components/content/GangDetail";

export async function generateMetadata({ params }: PageProps<"/gangs/gta-6/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const g = findGang(slug);
  return g ? gangMetadata(g) : {};
}

/** Gang detail (section 0.1 row 12): both path forms render the page; the canonical form is the legacy one. */
export default async function Page({ params }: PageProps<"/gangs/gta-6/[slug]">) {
  const { slug } = await params;
  const g = findGang(slug);
  if (!g) notFound();
  return <GangDetail gang={g} />;
}
