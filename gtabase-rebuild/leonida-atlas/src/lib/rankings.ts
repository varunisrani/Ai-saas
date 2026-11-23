/**
 * rankings — class ranking pages (R-716..R-722).
 */

const CARS = new Set(["Muscle", "Sports", "Sports Classic", "Super"]);
const VEHICLES = new Set(["Commercial", "Emergency", "Industrial", "Military", "Off-Road", "Service", "Utility"]);

/**
 * R-716 page slug: label lower-cased with spaces as "-", plus "-cars" (Muscle, Sports, Sports Classic, Super) or
 * "-vehicles" (Commercial, Emergency, Industrial, Military, Off-Road, Service, Utility).
 * ("Sports Classic" → "sports-classic-cars"; the route segment is "best-<slug>".)
 */
export function classPageSlug(label: string): string {
  const base = label.trim().toLowerCase().replace(/\s+/g, "-");
  if (CARS.has(label)) return `${base}-cars`;
  if (VEHICLES.has(label)) return `${base}-vehicles`;
  return base;
}

/** R-716 ranking page path "/gta-6/vehicles/best-<slug>/". */
export function rankingPath(label: string): string {
  return `/gta-6/vehicles/best-${classPageSlug(label)}/`;
}

/** R-716 plural label: "<label> Cars" / "<label> Vehicles" for those groups, else the label. */
export function classPluralLabel(label: string): string {
  if (CARS.has(label)) return `${label} Cars`;
  if (VEHICLES.has(label)) return `${label} Vehicles`;
  return label;
}

/** R-720 menu link tooltip. */
export function classMenuTooltip(plural: string): string {
  return `The Best & Fastest ${plural} in GTA 6`;
}

const labelCollator = new Intl.Collator("en", { sensitivity: "base" });

/** R-720: the "Select Class" menu lists the classes A→Z by label ("Super" before "SUVs"). */
export function classMenuOrder<T extends { label: string }>(classes: readonly T[]): T[] {
  return classes.slice().sort((a, b) => labelCollator.compare(a.label, b.label));
}

export interface RankingRowInput {
  /** Road rating 0–1000, missing when unrated. */
  roadRating?: number | null;
  /** Catalogue position (R-1606). */
  position: number;
}

/** R-719: road rating highest first; rows without a road rating after all rated rows; ties in catalogue order. */
export function orderRankingRows<T extends RankingRowInput>(rows: readonly T[]): T[] {
  const rated = (r: T) => typeof r.roadRating === "number" && Number.isFinite(r.roadRating);
  return rows.slice().sort((a, b) => {
    const ra = rated(a);
    const rb = rated(b);
    if (ra && rb && a.roadRating !== b.roadRating) return (b.roadRating as number) - (a.roadRating as number);
    if (ra !== rb) return ra ? -1 : 1;
    return a.position - b.position;
  });
}

function ratingValue(v: number | null | undefined): string {
  return typeof v === "number" && Number.isFinite(v) ? String(Math.round(v)) : "-";
}

/** R-718/R-406: "Road Rating: <n> · Off-Road Rating: <n>" with "-" for a missing rating. */
export function ratingLine(road: number | null | undefined, offroad: number | null | undefined): string {
  return `Road Rating: ${ratingValue(road)} · Off-Road Rating: ${ratingValue(offroad)}`;
}

/** R-718 "Based on: <model>" (null when no real-life model). */
export function basedOnLine(model: string | null | undefined): string | null {
  return model ? `Based on: ${model}` : null;
}

/** R-718 row label sequence. */
export function rankingRowLabels(hasRealLife: boolean): string[] {
  return hasRealLife ? ["Based on:", "Road Rating:", "Off-Road Rating:"] : ["Road Rating:", "Off-Road Rating:"];
}

/** R-721: the default ranking (/best-vehicles/) is the Super class (DIVERGENCE D-014). */
export const DEFAULT_RANKING_CLASS_ID = "super";

/** R-717 breadcrumb label of ranking pages. */
export const RANKING_BREADCRUMB = "GTA 6 Cars & Vehicles Database";
