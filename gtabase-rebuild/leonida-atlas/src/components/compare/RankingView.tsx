/**
 * Class ranking page (R-716..R-724): breadcrumb link "GTA 6 Cars & Vehicles Database", h1 "GTA 6 Best <Class plural>
 * List: Stats Ranking", the "Select Class" menu, header image, share actions, own intro, list title
 * "Full List of Best <Class plural> in GTA 6:" and one row per vehicle of the class (road rating highest first,
 * unrated after, ties in catalogue order).
 */
import Link from "next/link";
import {
  artUrl,
  articlePaths,
  getManufacturerById,
  getVehiclesOfClass,
  vehicleClasses,
  type VehicleClass,
} from "@/data";
import {
  RANKING_BREADCRUMB,
  basedOnLine,
  classMenuOrder,
  classMenuTooltip,
  classPluralLabel,
  orderRankingRows,
  rankingListTitle,
  rankingPath,
  rankingTitle,
  ratingLine,
} from "@/lib";
import { ArtImage, Breadcrumbs, GTA6_CRUMB, PageHeading, ShareActions } from "@/components/ui";
import { ClassMenu } from "./ClassMenu";
import { tid } from "../lists/tid";

/** Splits a "Label: value" text produced by the rules into its label (with the colon) and value. */
function splitLabel(text: string): [string, string] {
  const i = text.indexOf(": ");
  return i < 0 ? [text, ""] : [text.slice(0, i + 1), text.slice(i + 2)];
}

export function rankingMetadata(cls: VehicleClass, canonical: string) {
  const plural = classPluralLabel(cls.label);
  return {
    title: { absolute: rankingTitle(plural) },
    description: `Every ${plural.toLowerCase()} of the Leonida Atlas sample garage, ranked by road rating.`,
    alternates: { canonical },
  };
}

export function RankingView({ cls }: { cls: VehicleClass }) {
  const plural = classPluralLabel(cls.label);
  const rows = orderRankingRows(getVehiclesOfClass(cls.id));
  const menu = classMenuOrder(vehicleClasses).map((c) => ({
    id: c.id,
    label: c.label,
    href: rankingPath(c.label),
    tooltip: classMenuTooltip(classPluralLabel(c.label)),
  }));
  const top = rows[0];
  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs
        items={[GTA6_CRUMB, { label: "Vehicles", href: "/gta-6/vehicles/" }, { label: `Best ${plural}` }]}
      />
      <header className="flex flex-col gap-3">
        <Link href="/gta-6/vehicles/" data-testid="rank-crumb" className="self-start text-sm font-semibold">
          {RANKING_BREADCRUMB}
        </Link>
        <PageHeading>{rankingTitle(plural)}</PageHeading>
        <div className="flex flex-wrap items-center gap-3">
          <ClassMenu items={menu} currentId={cls.id} />
          <ShareActions title={rankingTitle(plural)} />
        </div>
        {top ? (
          <ArtImage
            art={top.image}
            alt={`${plural} in GTA 6`}
            loading="eager"
            className="aspect-[21/9] w-full rounded-card border border-sand-dark object-cover"
          />
        ) : null}
      </header>

      <section data-testid="rank-content" className="flex flex-col gap-3">
        <p data-testid="rank-paragraphs" className="m-0 max-w-3xl">
          Which {plural.toLowerCase()} are worth your money? This ranking puts every one of them in order of its road
          rating, so the quickest and best-handling picks sit at the top. Want every class at once? Browse the{" "}
          <Link href="/gta-6/vehicles/" data-testid="rank-content-links">
            full GTA 6 vehicles list
          </Link>
          .
        </p>
        <p data-testid="rank-paragraphs" className="m-0 max-w-3xl text-muted">
          Ratings are invented sample values. Vehicles without a road rating are listed after the rated ones. Looking
          for raw speed instead? See the{" "}
          <Link href={articlePaths.fastestCars} data-testid="rank-content-links">
            GTA 6 Fastest Cars ranked by top speed
          </Link>{" "}
          and the{" "}
          <Link href={articlePaths.fastestMotorcycles} data-testid="rank-content-links">
            fastest motorcycles in GTA 6
          </Link>
          .
        </p>

        <h2 data-testid="rank-list-title rank-h2" className="mt-3 text-xl">
          {rankingListTitle(plural)}
        </h2>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((v, i) => {
            const n = i + 1;
            const make = getManufacturerById(v.make)?.label ?? v.make;
            const based = basedOnLine(v.realLife);
            const [roadPart, offPart] = ratingLine(v.roadRating, v.offroadRating).split(" · ");
            const [roadLabel, roadValue] = splitLabel(roadPart);
            const [offLabel, offValue] = splitLabel(offPart);
            const labelTid = tid("rank-row-labels", `rank-row-${n}-labels`);
            return (
              <li
                key={v.slug}
                data-testid={tid("rank-rows", `rank-row-${n}`)}
                className="flex items-center gap-3 rounded-card border border-sand-dark bg-white p-2 pr-4"
              >
                <span className="w-8 shrink-0 text-center font-display text-lg font-bold text-teal">{n}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artUrl(v.image)}
                  alt={`${make} ${v.name}`}
                  loading={i < 6 ? "eager" : "lazy"}
                  data-testid="rank-images"
                  className="h-16 w-28 shrink-0 rounded-xl object-cover"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      data-testid={tid("rank-row-badge", `rank-row-${n}-badge`)}
                      className="rounded-pill bg-coral px-2 py-0.5 font-display text-[0.7rem] font-bold uppercase tracking-wide text-ink"
                    >
                      {make}
                    </span>
                    <Link
                      href={v.canonicalPath}
                      prefetch={false}
                      data-testid={tid("rank-row-links", `rank-row-${n}-link`)}
                      className="font-display text-base font-bold"
                    >
                      {v.name}
                    </Link>
                  </div>
                  {based ? (
                    <p className="m-0 text-sm">
                      <span data-testid={labelTid} className="text-muted">
                        {splitLabel(based)[0]}
                      </span>{" "}
                      {splitLabel(based)[1]}
                    </p>
                  ) : null}
                  <p data-testid="rank-ratings" className="m-0 text-sm tabular-nums">
                    <span data-testid={labelTid} className="text-muted">
                      {roadLabel}
                    </span>{" "}
                    <strong>{roadValue}</strong> ·{" "}
                    <span data-testid={labelTid} className="text-muted">
                      {offLabel}
                    </span>{" "}
                    <strong>{offValue}</strong>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
