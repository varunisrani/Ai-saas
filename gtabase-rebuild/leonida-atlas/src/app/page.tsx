import type { Metadata } from "next";
import Link from "next/link";
import { CompassRose } from "@/components/shell/Logo";
import { Breadcrumbs, PageHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Leonida Atlas — a fan-made field guide to GTA 6 | Leonida Atlas",
  description: "A fan-made field guide to GTA 6 with a database, an interactive map, checklists and guides — all on invented sample data.",
};

/** Own front page (R-1317, DIVERGENCE D-012). */
export default function FrontPage() {
  return (
    <div className="atlas-front">
      <Breadcrumbs items={[{ label: "Leonida Atlas" }]} />
      <div className="atlas-front-hero">
        <CompassRose size={88} />
        <div>
          <PageHeading>Leonida Atlas</PageHeading>
          <p className="atlas-lead">A fan-made field guide to GTA 6: look things up, plan your route and tick off what you have done.</p>
        </div>
      </div>
      <Link href="/gta-6/" className="atlas-front-card atlas-card">
        <span className="atlas-front-card-kicker caps">Start here</span>
        <span className="atlas-front-card-title">GTA 6 (Grand Theft Auto VI)</span>
        <span className="atlas-front-card-text">
          Vehicles, weapons, the interactive map, missions, checklists, guides, cheats and media — all in one place.
        </span>
      </Link>
      <p className="atlas-note">Everything on this site is invented sample data. Progress, favorites and settings stay in your browser.</p>
    </div>
  );
}
