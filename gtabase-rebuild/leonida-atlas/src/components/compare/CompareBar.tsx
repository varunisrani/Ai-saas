"use client";

/**
 * Compare bar of the database lists (R-705, R-706): fixed at the top centre of the viewport. With 0 picks it carries
 * the `hidden` attribute (empty value) and is faded out — transparent and not clickable but still laid out (see
 * compare.css); with 1+ picks it is shown. Content: "<n>/4", the picked names (hidden below 768 px), the action link
 * ("Pick 1 more" inert with href "#" / "Compare (<n>)" to the comparison page, shown in capitals) and a round clear
 * button ("Clear the comparison", tooltip "Clear").
 */
import Link from "next/link";
import { compareBarHidden, compareBarLabel, compareCountText, compareNamesText, type ComparePick } from "@/lib";
import "./compare.css";

export interface CompareBarProps {
  picks: readonly ComparePick[];
  href: string;
  onClear: () => void;
}

export function CompareBar({ picks, href, onClear }: CompareBarProps) {
  const count = picks.length;
  const hidden = compareBarHidden(count);
  const ready = href !== "#";
  return (
    <div
      data-testid="compare-bar"
      data-compare-bar=""
      hidden={hidden}
      aria-hidden={hidden ? true : undefined}
      role="region"
      aria-label="Comparison"
      className="fixed left-1/2 top-3 z-50 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-3 rounded-pill border border-white/20 bg-ink px-3 py-2 text-white shadow-soft transition-opacity duration-200"
    >
      <span data-testid="compare-count" className="font-display text-sm font-bold tabular-nums">
        {compareCountText(count)}
      </span>
      <span data-testid="compare-names" className="hidden max-w-[22rem] truncate text-sm text-white/85 md:inline">
        {compareNamesText(picks)}
      </span>
      {ready ? (
        <Link
          href={href}
          prefetch={false}
          data-testid="compare-go"
          className="rounded-pill bg-coral px-3 py-1 font-display text-sm font-bold uppercase tracking-wide text-ink! no-underline hover:bg-white hover:text-ink!"
        >
          {compareBarLabel(count)}
        </Link>
      ) : (
        <a
          href="#"
          aria-disabled="true"
          data-testid="compare-go"
          tabIndex={hidden ? -1 : undefined}
          className="pointer-events-none rounded-pill bg-white/15 px-3 py-1 font-display text-sm font-bold uppercase tracking-wide text-white/60! no-underline"
          onClick={(e) => e.preventDefault()}
        >
          {compareBarLabel(count)}
        </a>
      )}
      <button
        type="button"
        aria-label="Clear the comparison"
        title="Clear"
        data-testid="compare-clear"
        tabIndex={hidden ? -1 : undefined}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-coral hover:text-ink"
        onClick={onClear}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
