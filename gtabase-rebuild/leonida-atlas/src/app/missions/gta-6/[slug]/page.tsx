/** Mission walkthrough page, route form "legacy" of list "missions" (section 0 rows 13–14; R-601, R-602, R-917). */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getItemByPath } from "@/data";
import { MissionDetail, missionMetadata } from "@/components/missions/MissionDetail";

type Params = Promise<{ slug: string }>;

function lookup(slug: string) {
  const found = getItemByPath("missions", slug, "legacy");
  return found && found.type === "mission" ? found : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = lookup((await params).slug);
  return found ? missionMetadata(found.item, found.canonicalPath) : {};
}

export default async function Page({ params }: { params: Params }) {
  const found = lookup((await params).slug);
  if (!found) notFound();
  return <MissionDetail mission={found.item} list="missions" />;
}
