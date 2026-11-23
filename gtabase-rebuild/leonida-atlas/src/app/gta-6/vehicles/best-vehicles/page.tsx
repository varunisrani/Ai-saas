import { notFound, permanentRedirect } from "next/navigation";
import { getVehicleClassById } from "@/data";
import { DEFAULT_RANKING_CLASS_ID } from "@/lib";
import { RankingView, rankingMetadata } from "@/components/compare/RankingView";

const DEFAULT_CLASS = getVehicleClassById(DEFAULT_RANKING_CLASS_ID)!;

export const metadata = rankingMetadata(DEFAULT_CLASS, "/gta-6/vehicles/best-vehicles/");

/** Default ranking (R-721, D-014: the Super class); `?class=` → that class's page, unknown → 404 (R-722, D-013). */
export default async function BestVehiclesPage(props: PageProps<"/gta-6/vehicles/best-vehicles">) {
  const sp = await props.searchParams;
  const raw = sp.class;
  if (raw !== undefined) {
    const id = Array.isArray(raw) ? raw[0] : raw;
    const cls = getVehicleClassById(id ?? "");
    if (!cls) notFound();
    permanentRedirect(cls.rankingPath);
  }
  return <RankingView cls={DEFAULT_CLASS} />;
}
