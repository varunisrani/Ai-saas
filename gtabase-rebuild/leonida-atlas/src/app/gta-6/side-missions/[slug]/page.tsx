/** Activity page, route form "gta6" (section 0 row 15; F2 family). */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getItemByPath } from "@/data";
import { ActivityDetail, activityMetadata } from "@/components/missions/MissionDetail";

type Params = Promise<{ slug: string }>;

function lookup(slug: string) {
  const found = getItemByPath("side-missions", slug, "gta6");
  return found && found.type === "activity" ? found : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = lookup((await params).slug);
  return found ? activityMetadata(found.item, found.canonicalPath) : {};
}

export default async function Page({ params }: { params: Params }) {
  const found = lookup((await params).slug);
  if (!found) notFound();
  return <ActivityDetail activity={found.item} />;
}
