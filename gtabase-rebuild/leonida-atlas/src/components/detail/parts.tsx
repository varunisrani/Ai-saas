/**
 * Building blocks of the item detail pages (F2, section 6): section headings, info rows, statistics, rating,
 * small cards, comments placeholder. Server components (no client state).
 */
import Link from "next/link";
import type { ReactNode } from "react";
import type { ArtRef } from "@/data";
import { detailStatText, detailStatWidth, ratingText, type SectionTitle } from "@/lib";
import { ArtImage } from "@/components/ui";
import { tid } from "../lists/tid";

// ---------------------------------------------------------------- sections

/** Level-2 content heading (R-606); "CAPS" headings are shown in capitals by styling (W3). */
export function SectionHeading({ title, id }: { title: SectionTitle; id?: string }) {
  return (
    <h2
      id={id}
      data-testid="section-titles"
      className={`mb-3! font-display text-xl font-bold text-ink ${title.caps ? "uppercase tracking-wide" : ""}`}
    >
      {title.text}
    </h2>
  );
}

export function DetailSection({ title, children }: { title: SectionTitle; children: ReactNode }) {
  const id = `sec-${title.key}`;
  return (
    <section aria-labelledby={id} className="rounded-card border border-sand-dark bg-white p-4 sm:p-5">
      <SectionHeading title={title} id={id} />
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- info rows (R-607)

export interface InfoRow {
  label: string;
  value: ReactNode;
}

/** Label/value rows; a row without a value is left out by the caller (R-406). */
export function InfoRows({ rows }: { rows: InfoRow[] }) {
  if (!rows.length) return null;
  return (
    <dl className="m-0 grid grid-cols-1 overflow-hidden rounded-xl border border-sand-dark sm:grid-cols-[minmax(10rem,14rem)_1fr]">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt
            data-testid="info-labels"
            className="border-b border-sand-dark bg-sand/60 px-3 py-2 font-display text-sm font-semibold text-muted"
          >
            {r.label}
          </dt>
          <dd data-testid="info-values" className="m-0 border-b border-sand-dark px-3 py-2 text-sm">
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Keeps only rows that have a value (undefined, null, "" and empty arrays are missing). */
export function presentRows(rows: Array<{ label: string; value: ReactNode | undefined | null }>): InfoRow[] {
  return rows.filter((r): r is InfoRow => {
    const v = r.value;
    if (v === undefined || v === null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });
}

// ---------------------------------------------------------------- statistics (R-608)

export interface StatRow {
  label: string;
  value: number | undefined;
  /** Bar on the 0–10 scale; false = number only (vehicle ratings, weapon overall). */
  bar: boolean;
  /** Whole number (0–1000 ratings) instead of one decimal. */
  whole?: boolean;
  /** Unlabelled row (the vehicle road rating). */
  noLabel?: boolean;
}

function wholeText(v: number | undefined): string {
  return typeof v === "number" && Number.isFinite(v) ? String(Math.round(v)) : "-";
}

export function StatsBlock({ rows }: { rows: StatRow[] }) {
  let barIndex = 0;
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => {
        const text = r.whole ? wholeText(r.value) : detailStatText(r.value);
        if (!r.bar) {
          return (
            <div key={`${r.label}-${i}`} className="flex items-baseline justify-between gap-3 border-t border-sand-dark pt-2">
              {r.noLabel ? (
                <span className="text-sm text-muted">
                  <span className="sr-only">Road rating</span>
                </span>
              ) : (
                <span data-testid="stat-labels" className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
                  {r.label}
                </span>
              )}
              <span data-testid="stat-values" className="font-display text-lg font-bold tabular-nums">
                {text}
              </span>
            </div>
          );
        }
        barIndex += 1;
        const width = detailStatWidth(r.value);
        return (
          <div key={`${r.label}-${i}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span data-testid="stat-labels" className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
                {r.label}
              </span>
              <span data-testid="stat-values" className="font-display text-base font-bold tabular-nums">
                {text}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={r.label}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={typeof r.value === "number" ? r.value : undefined}
              aria-valuetext={text}
              className="mt-1 h-2 overflow-hidden rounded-full bg-sand-dark"
            >
              <span
                data-testid={tid("stat-bars", `stat-bar-${barIndex}`)}
                data-state={typeof r.value === "number" ? "known" : "unknown"}
                className="block h-full rounded-full bg-lagoon"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- rating (R-611, DIVERGENCE D-005)

export function RatingBlock({ average, votes }: { average: number; votes: number }) {
  const text = ratingText(average, votes);
  return (
    <div data-testid="rating-block" className="inline-flex items-center gap-2" role="group" aria-label={`Rating: ${text}`}>
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, average - (i - 1)));
          const gid = `rs-${i}-${Math.round(fill * 100)}`;
          return (
            <svg key={i} viewBox="0 0 24 24" width="20" height="20" data-testid="rating-stars" focusable="false">
              <defs>
                <linearGradient id={gid}>
                  <stop offset={`${fill * 100}%`} stopColor="#FF6A4D" />
                  <stop offset={`${fill * 100}%`} stopColor="#FFFFFF" />
                </linearGradient>
              </defs>
              <path
                d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
                fill={`url(#${gid})`}
                stroke="#14161B"
                strokeOpacity="0.55"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          );
        })}
      </span>
      <span data-testid="rating-total" className="text-sm font-semibold text-muted">
        {text}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- small cards

export interface MiniCardData {
  title: string;
  subtitle?: string;
  href?: string;
  /** Placeholder image; text-only card when absent. */
  art?: ArtRef;
}

/** A small linked card (base model, variants, character vehicles, similar vehicles, appearances). */
export function MiniCards({ cards, titleToken }: { cards: MiniCardData[]; titleToken?: string }) {
  if (!cards.length) return null;
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
      {cards.map((c) => {
        const body = (
          <>
            {c.art ? (
              <ArtImage art={c.art} alt="" className="aspect-[16/10] w-full rounded-lg object-cover" />
            ) : (
              <span aria-hidden="true" className="flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-gradient-to-br from-teal to-lagoon text-white">
                <svg viewBox="0 0 24 24" width="36" height="36" focusable="false">
                  <path d="M6 9h12l2 8H4zM9 9V7a3 3 0 0 1 6 0v2M8 13h2M14 13h2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
            <span data-testid={titleToken} className="mt-1.5 block font-display text-sm font-bold leading-tight text-ink">
              {c.title}
            </span>
            {c.subtitle ? <span className="block text-xs text-muted">{c.subtitle}</span> : null}
          </>
        );
        return (
          <li key={`${c.title}-${c.href ?? ""}`} className="rounded-xl border border-sand-dark bg-white p-2 transition-shadow hover:shadow-soft">
            {c.href ? (
              <Link href={c.href} prefetch={false} className="block no-underline">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------- comments (R-621, DIVERGENCE D-004)

export function CommentsPlaceholder({ id = "comments" }: { id?: string }) {
  return (
    <section id={id} data-testid="comments" aria-labelledby={`${id}-title`} className="rounded-card border border-dashed border-sand-dark bg-white/60 p-4">
      <h3 id={`${id}-title`} className="font-display text-lg font-bold">
        Comments
      </h3>
      <p className="m-0 mt-1 text-muted">Comments are coming later.</p>
    </section>
  );
}
