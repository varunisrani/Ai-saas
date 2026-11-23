"use client";

/**
 * One item of a database list (R-532..R-535) plus its compare toggle (R-701, R-702).
 * Grid mode = card; list mode = one row under the list header. The compare toggle sits over the photo, inside the
 * card but outside the card's link (DIVERGENCE D-010).
 */
import Link from "next/link";
import type { KeyboardEvent, MouseEvent } from "react";
import { cardStatBar, compareToggleLabel, formatPrice } from "@/lib";
import type { ListCardStat, ListConfig, ListEntry } from "@/data";
import { tid } from "./tid";
import { badge } from "./styles";

export type ClientEntry = ListEntry & { imageUrl: string; logoUrl: string };

export interface ListCardProps {
  entry: ClientEntry;
  config: ListConfig;
  index: number;
  count: number;
  mode: "grid" | "list";
  picked: boolean;
  disabled: boolean;
  onToggle: (entry: ClientEntry) => void;
}

const STAT_TOKEN: Record<ListCardStat["field"], string> = {
  speed: "speed",
  offroadRating: "offroad",
  roadRating: "road",
  damage: "damage",
};

function CompareToggle({ entry, index, picked, disabled, onToggle }: Omit<ListCardProps, "config" | "count" | "mode">) {
  const act = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    onToggle(entry);
  };
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={picked}
      aria-disabled={disabled}
      aria-label={compareToggleLabel(entry.name)}
      title="Compare"
      tabIndex={0}
      data-testid={tid(
        "compare-toggle",
        "list-compare-toggle",
        `compare-toggle-${index + 1}`,
        picked && "compare-toggle-checked",
        disabled && "compare-toggle-disabled",
      )}
      data-state={picked ? "checked" : disabled ? "disabled" : "unchecked"}
      className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-soft transition-colors ${
        picked ? "border-coral bg-coral text-ink" : "border-white bg-ink/75 text-white hover:bg-teal"
      } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
      onClick={act}
      onKeyDown={(e) => {
        // Space and Enter toggle; the button's own activation is suppressed so a disabled toggle stays inert.
        if (e.key === " " || e.key === "Enter") act(e);
      }}
      onKeyUp={(e) => {
        if (e.key === " ") e.preventDefault();
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        {picked ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M4 7h9M4 12h9M4 17h6M17 9v8M13 13h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}

export function ListCard(props: ListCardProps) {
  const { entry, config, index, count, mode } = props;
  const n = index + 1;
  const first = index === 0;
  const last = index === count - 1;
  const pos = (suffix: string) => [`card-${n}-${suffix}`, last && `card-last-${suffix}`];
  const isVehicle = config.list === "vehicles";
  const classText = entry.classLabels.join(", ");
  const basedOn = entry.realLife && entry.realLife !== entry.name ? entry.realLife : null;
  const labelTid = first ? "card-labels" : undefined;

  const stats = config.card.stats
    .map((s) => ({ s, v: entry[s.field] as number | undefined }))
    .filter(({ s, v }) => s.alwaysShown || typeof v === "number");

  const statBlocks = stats.map(({ s, v }) => {
    const bar = cardStatBar(v, s.scale);
    const key = STAT_TOKEN[s.field];
    const isSpeed = s.field === "speed";
    return (
      <div key={s.field} className="min-w-0">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span data-testid={labelTid} className="font-display font-semibold uppercase tracking-wide text-muted">
            {s.label}
          </span>
          <span data-testid={tid(...pos(key))} className="font-display font-semibold tabular-nums">
            {bar.text}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={s.label}
          aria-valuemin={0}
          aria-valuemax={s.scale}
          aria-valuenow={typeof v === "number" ? v : undefined}
          aria-valuetext={bar.text}
          data-state={bar.state}
          data-testid={tid(
            `card-${n}-${key}-bar`,
            last && `card-last-${key}-bar`,
            first && "card-stat-bar",
            bar.state === "unknown" && "card-unknown-stat",
          )}
          className={`mt-1 h-2 overflow-hidden rounded-full ${bar.state === "unknown" ? "bg-sand-dark/50 [background-image:repeating-linear-gradient(45deg,transparent_0_4px,rgb(20_22_27/0.08)_4px_8px)]" : "bg-sand-dark"}`}
        >
          <span
            data-testid={first && isSpeed ? "card-stat-fill" : undefined}
            className="block h-full rounded-full bg-lagoon"
            style={{ width: `${bar.widthPercent}%` }}
          />
        </div>
      </div>
    );
  });

  const badges = (
    <>
      {entry.isStandout && config.card.standoutBadge ? (
        <span className={badge} data-testid="card-standout-badge">
          {config.card.standoutBadge}
        </span>
      ) : null}
      {entry.isUniqueVariant && config.card.uniqueBadge ? (
        <span className={badge} data-testid="card-unique-badge">
          {config.card.uniqueBadge}
        </span>
      ) : null}
      {entry.editions.map((ed) => (
        <span key={ed} className="inline-block rounded-pill bg-white/90 px-2 py-0.5 text-[0.7rem] font-semibold text-teal">
          {ed}
        </span>
      ))}
    </>
  );

  const toggle = (
    <CompareToggle
      entry={entry}
      index={index}
      picked={props.picked}
      disabled={props.disabled}
      onToggle={props.onToggle}
    />
  );

  if (mode === "list") {
    const cells = isVehicle
      ? [entry.makeLabel, entry.name, classText, entry.realLife ?? "-"]
      : [entry.makeLabel, entry.name, classText, entry.realLife ?? "-"];
    return (
      <li
        data-testid={tid("card", `card-${n}`, last && "card-last")}
        data-slug={entry.slug}
        className="relative flex items-center gap-2 border-b border-sand-dark bg-white px-2 py-1.5 last:border-b-0 hover:bg-sand/60"
      >
        <Link
          href={entry.canonicalPath}
          prefetch={false}
          aria-label={entry.name}
          data-testid={`card-${n}-link`}
          className="grid min-w-0 flex-1 grid-cols-[1fr_1.4fr_1fr_1.2fr_repeat(3,0.8fr)] items-center gap-2 text-sm text-ink! no-underline"
        >
          <span data-testid={tid(...pos("make"))} className="truncate">
            {cells[0]}
          </span>
          <span data-testid={tid(...pos("name"))} className="truncate font-semibold">
            {cells[1]}
          </span>
          <span data-testid={tid(...pos("class"))} className="truncate">
            {cells[2]}
          </span>
          <span className="truncate text-muted">{cells[3]}</span>
          {config.card.stats.map((s) => {
            const v = entry[s.field] as number | undefined;
            const bar = cardStatBar(v, s.scale);
            const key = STAT_TOKEN[s.field];
            return (
              <span key={s.field} data-testid={tid(...pos(key))} className="font-display tabular-nums">
                {typeof v === "number" || s.alwaysShown ? bar.text : "-"}
              </span>
            );
          })}
          {config.card.pricePill ? (
            <span className="font-display tabular-nums">
              {typeof entry.price === "number" ? formatPrice(entry.price) : "-"}
            </span>
          ) : null}
        </Link>
        {toggle}
      </li>
    );
  }

  return (
    <li
      data-testid={tid("card", `card-${n}`, last && "card-last")}
      data-slug={entry.slug}
      className="group relative flex flex-col overflow-hidden rounded-card border border-sand-dark bg-white transition-shadow duration-200 hover:shadow-soft"
    >
      <Link
        href={entry.canonicalPath}
        prefetch={false}
        aria-label={entry.name}
        data-testid={`card-${n}-link`}
        className="flex flex-1 flex-col text-ink! no-underline hover:text-ink!"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.imageUrl}
            alt={`${entry.makeLabel} ${entry.name}`}
            loading={index < 4 ? "eager" : "lazy"}
            decoding="async"
            data-testid={first ? "card-image" : undefined}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">{badges}</div>
          {isVehicle && typeof entry.seats === "number" ? (
            <span
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-pill bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white"
              title="Seats"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
                <path d="M7 4v9h9l2 7M7 13l-1 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="sr-only">Seats: </span>
              <span data-testid={tid(...pos("seats"))}>{entry.seats}</span>
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
            <dt data-testid={labelTid} className="text-muted">
              {config.card.classLabel}
            </dt>
            <dd data-testid={tid(...pos("class"))} className="m-0 truncate">
              {classText}
            </dd>
            <dt data-testid={labelTid} className="text-muted">
              {config.card.makeLabel}
            </dt>
            <dd className="m-0 flex min-w-0 items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.logoUrl} alt="" width={18} height={18} loading="lazy" className="h-[18px] w-[18px] rounded-full" />
              <span data-testid={tid(...pos("make"))} className="truncate">
                {entry.makeLabel}
              </span>
            </dd>
            <dt data-testid={labelTid} className="text-muted">
              {config.card.nameLabel}
            </dt>
            <dd className="m-0 min-w-0">
              <h3 data-testid={tid(...pos("name"))} className="font-display text-base font-bold leading-tight">
                {entry.name}
              </h3>
            </dd>
            {basedOn ? (
              <>
                <dt data-testid={labelTid} className="text-muted">
                  {config.card.basedOnLabel}
                </dt>
                <dd className="m-0 truncate">{basedOn}</dd>
              </>
            ) : null}
          </dl>
          {statBlocks.length ? <div className={`mt-auto grid gap-2 ${statBlocks.length > 1 ? "grid-cols-3" : ""}`}>{statBlocks}</div> : null}
          {config.card.pricePill && typeof entry.price === "number" ? (
            <span
              data-testid="card-price-pill"
              className="self-start rounded-pill bg-teal px-3 py-0.5 font-display text-sm font-semibold text-white"
            >
              {formatPrice(entry.price)}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-[16/10] items-end justify-end p-2">{toggle}</div>
    </li>
  );
}
