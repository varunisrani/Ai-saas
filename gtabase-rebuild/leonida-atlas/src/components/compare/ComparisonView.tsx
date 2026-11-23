/**
 * Comparison page (R-708..R-715): breadcrumb link, h1, own intro, share actions, the board — a header column with an
 * "Add a …" slot (normal case) and four item columns (filled ones show the item; empty ones an "ADD A …" slot) — the
 * note under 2 items, and the related links. Filled boards list the detail page's value rows and the statistics with
 * bars; the highest value of each numeric row is marked "best" (DIVERGENCE D-008, own design).
 */
import Link from "next/link";
import {
  artUrl,
  articlePaths,
  getManufacturerById,
  getVehicleByCompareKey,
  getVehicleClassById,
  getWeaponByCompareKey,
  getWeaponClassById,
  listConfig,
  vehicles,
  weapons,
  type Vehicle,
  type Weapon,
} from "@/data";
import {
  addSlotTitle,
  bestValueFlags,
  comparisonHref,
  comparisonNote,
  comparisonTitle,
  detailStatText,
  detailStatWidth,
  removeFromComparisonHref,
  removeFromComparisonLabel,
  showComparisonNote,
  slotTarget,
  type CompareType,
} from "@/lib";
import { Breadcrumbs, GTA6_CRUMB, PageHeading, ShareActions } from "@/components/ui";
import { BoardFrame, ComparePicker } from "./ComparePicker";

type Item = Vehicle | Weapon;

interface Row {
  label: string;
  kind: "text" | "stat" | "number";
  values: (string | number | undefined)[];
}

const COLUMNS = 4;

function wholeOrDash(v: number | undefined): string {
  return typeof v === "number" && Number.isFinite(v) ? String(Math.round(v)) : "-";
}

function vehicleRows(items: Vehicle[]): Row[] {
  const make = (v: Vehicle) => getManufacturerById(v.make)?.label ?? v.make;
  const classes = (v: Vehicle) => v.classes.map((c) => getVehicleClassById(c)?.label ?? c).join(", ");
  const t = (label: string, f: (v: Vehicle) => string | undefined): Row => ({ label, kind: "text", values: items.map(f) });
  const s = (label: string, f: (v: Vehicle) => number | undefined): Row => ({ label, kind: "stat", values: items.map(f) });
  const n = (label: string, f: (v: Vehicle) => number | undefined): Row => ({ label, kind: "number", values: items.map(f) });
  return [
    t("Vehicle Class", classes),
    t("Manufacturer", make),
    t("Style", (v) => v.style),
    t("Era", (v) => v.era),
    t("Seats", (v) => String(v.seats)),
    t("Based on (Real Life)", (v) => v.realLife),
    t("Drive Train", (v) => v.driveTrain),
    s("Speed", (v) => v.speed),
    s("Acceleration", (v) => v.acceleration),
    s("Asphalt Handling", (v) => v.asphaltHandling),
    s("Off-Road Handling", (v) => v.offroadHandling),
    s("Strength", (v) => v.strength),
    n("Off-Road Rating", (v) => v.offroadRating),
    n("Road Rating", (v) => v.roadRating),
  ];
}

function weaponRows(items: Weapon[]): Row[] {
  const t = (label: string, f: (w: Weapon) => string | undefined): Row => ({ label, kind: "text", values: items.map(f) });
  const s = (label: string, f: (w: Weapon) => number | undefined): Row => ({ label, kind: "stat", values: items.map(f) });
  return [
    t("Weapon Class", (w) => getWeaponClassById(w.weaponClass)?.label ?? w.weaponClass),
    t("Manufacturer", (w) => getManufacturerById(w.make)?.label ?? w.make),
    t("Based on (Real Life)", (w) => w.realLife),
    t("Ammo Capacity", (w) => w.ammoCapacity),
    t("Story Mode Price", (w) => w.storyModePrice),
    s("Damage", (w) => w.damage),
    s("Accuracy", (w) => w.accuracy),
    s("Handling", (w) => w.handling),
    s("Range", (w) => w.range),
    s("Overall", (w) => w.overall),
  ];
}

const RELATED: Record<CompareType, { label: string; href: string }[]> = {
  vehicle: [
    { label: "All GTA 6 vehicles", href: "/gta-6/vehicles/" },
    { label: "Weapon comparison", href: "/gta-6/weapons/comparison/" },
    { label: "All GTA 6 weapons", href: "/gta-6/weapons/" },
    { label: "Best vehicles in GTA 6", href: "/gta-6/vehicles/best-vehicles/" },
    { label: "Fastest cars in GTA 6", href: articlePaths.fastestCars },
    { label: "Fastest bikes in GTA 6", href: articlePaths.fastestMotorcycles },
  ],
  weapon: [
    { label: "All GTA 6 weapons", href: "/gta-6/weapons/" },
    { label: "Vehicle comparison", href: "/gta-6/vehicles/comparison/" },
    { label: "All GTA 6 vehicles", href: "/gta-6/vehicles/" },
  ],
};

const CRUMB: Record<CompareType, string> = {
  vehicle: "GTA 6 Vehicles Database & Statistics",
  weapon: "GTA 6 Weapons Database & Statistics",
};

const INTRO: Record<CompareType, string> = {
  vehicle:
    "Line up to four vehicles from the sample garage and read their classes, makes and statistics side by side. The best value in each statistic is highlighted.",
  weapon:
    "Line up to four weapons from the sample armoury and read their classes, makes and statistics side by side. The best value in each statistic is highlighted.",
};

export function comparisonMetadata(type: CompareType) {
  const listPath = type === "vehicle" ? "/gta-6/vehicles/" : "/gta-6/weapons/";
  return {
    title: { absolute: comparisonTitle(type) },
    description: INTRO[type],
    alternates: { canonical: `${listPath}comparison/` },
  };
}

export function ComparisonView({ type, keys }: { type: CompareType; keys: string[] }) {
  const config = listConfig(type === "vehicle" ? "vehicles" : "weapons");
  const listPath = config.path;
  const items: Item[] = keys
    .map((k) => (type === "vehicle" ? getVehicleByCompareKey(k) : getWeaponByCompareKey(k)))
    .filter((x): x is Item => x !== undefined);
  const canonical = comparisonHref(listPath, type, keys);
  const slot = slotTarget(type, keys, canonical, config.comparisonPath);
  const title = addSlotTitle(type);
  const pickerItems = (type === "vehicle" ? vehicles : weapons).map((x) => ({ key: x.compareKey, name: x.name }));
  const rows =
    items.length === 0
      ? []
      : type === "vehicle"
        ? vehicleRows(items as Vehicle[])
        : weaponRows(items as Weapon[]);
  const makeLabel = (x: Item) => getManufacturerById(x.make)?.label ?? x.make;
  const cols = Array.from({ length: COLUMNS }, (_, i) => items[i] ?? null);

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          GTA6_CRUMB,
          { label: type === "vehicle" ? "Vehicles" : "Weapons", href: listPath },
          { label: type === "vehicle" ? "Vehicle Comparison" : "Weapon Comparison" },
        ]}
      />
      <header className="flex flex-col gap-3">
        <Link href={listPath} data-testid="cmp-crumb" className="self-start text-sm font-semibold">
          {CRUMB[type]}
        </Link>
        <PageHeading>{comparisonTitle(type)}</PageHeading>
        <p data-testid="cmp-intro" className="m-0 max-w-3xl text-muted">
          {INTRO[type]}
        </p>
        <ShareActions title={comparisonTitle(type)} />
      </header>

      <BoardFrame items={pickerItems} excluded={keys} className="rounded-card border border-sand-dark bg-white p-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="w-[20%] p-2 align-top font-normal">
                  <ComparePicker title={title} caps={false} slotUrl={slot.url} param={slot.param} />
                </th>
                {cols.map((item, i) =>
                  item ? (
                    <th key={item.compareKey} scope="col" className="w-[20%] p-2 text-left align-top">
                      <div className="flex flex-col gap-2">
                        <div className="relative overflow-hidden rounded-xl bg-sand">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={artUrl(item.image)} alt="" className="aspect-[16/10] w-full object-cover" />
                          <a
                            href={removeFromComparisonHref(keys, item.compareKey, listPath, type)}
                            aria-label={removeFromComparisonLabel(item.name)}
                            title={removeFromComparisonLabel(item.name)}
                            data-testid="cmp-remove"
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/80 text-lg leading-none text-white no-underline hover:bg-coral hover:text-ink"
                          >
                            ×
                          </a>
                        </div>
                        <span className="self-start rounded-pill bg-coral px-2 py-0.5 font-display text-[0.7rem] font-bold uppercase tracking-wide text-ink">
                          {makeLabel(item)}
                        </span>
                        <Link href={item.canonicalPath} data-testid="cmp-item-name" className="font-display text-base font-bold">
                          {item.name}
                        </Link>
                      </div>
                    </th>
                  ) : (
                    <th key={`empty-${i}`} scope="col" className="w-[20%] p-2 align-top font-normal">
                      <ComparePicker title={title} caps slotUrl={slot.url} param={slot.param} />
                    </th>
                  ),
                )}
              </tr>
            </thead>
            {rows.length ? (
              <tbody>
                {rows.map((r) => {
                  const numeric = r.kind !== "text";
                  const best = numeric ? bestValueFlags(r.values.map((v) => (typeof v === "number" ? v : undefined))) : [];
                  return (
                    <tr key={r.label} className="border-t border-sand-dark even:bg-sand/50">
                      <th scope="row" className="p-2 text-left font-display text-xs font-bold uppercase tracking-wide text-muted">
                        {r.label}
                      </th>
                      {cols.map((item, i) => {
                        if (!item) return <td key={`e-${i}`} className="p-2" />;
                        const v = r.values[i];
                        if (r.kind === "text") {
                          return (
                            <td key={item.compareKey} className="p-2">
                              {v === undefined || v === "" ? "-" : String(v)}
                            </td>
                          );
                        }
                        const num = typeof v === "number" ? v : undefined;
                        const isBest = best[i];
                        return (
                          <td key={item.compareKey} className="p-2" data-state={isBest ? "best" : undefined}>
                            <span className={`font-display font-semibold tabular-nums ${isBest ? "text-coral" : ""}`}>
                              {r.kind === "stat" ? detailStatText(num) : wholeOrDash(num)}
                              {isBest ? <span className="sr-only"> (best)</span> : null}
                            </span>
                            {r.kind === "stat" ? (
                              <div
                                role="progressbar"
                                aria-label={r.label}
                                aria-valuemin={0}
                                aria-valuemax={10}
                                aria-valuenow={num}
                                className="mt-1 h-2 overflow-hidden rounded-full bg-sand-dark"
                              >
                                <span
                                  className={`block h-full rounded-full ${isBest ? "bg-coral" : "bg-lagoon"}`}
                                  style={{ width: `${detailStatWidth(num)}%` }}
                                />
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            ) : null}
          </table>
        </div>
        {showComparisonNote(items.length) ? (
          <p data-testid="cmp-note" className="m-0 mt-3 rounded-xl bg-sand px-3 py-2 text-sm font-semibold">
            {comparisonNote(type)}
          </p>
        ) : null}
      </BoardFrame>

      <nav aria-label="Related pages" className="flex flex-wrap gap-2">
        {RELATED[type].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            data-testid="cmp-links"
            className="rounded-pill border border-teal/30 bg-white px-3 py-1.5 text-sm font-semibold no-underline hover:bg-lagoon/10"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <ul hidden aria-hidden="true">
        {pickerItems.map((p) => (
          <li key={p.key} data-testid="cmp-source" data-key={p.key}>
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
