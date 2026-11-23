"use client";

/**
 * Marker popup (R-823..R-826, R-828, R-1406) and the shared-spot popup (R-827).
 */
import type { ReactNode } from "react";
import { SHARED_SPOT } from "@/lib";
import type { MapCategoryData, MapMarkerData } from "./types";

function descriptionParts(text: string): { sentences: string[]; rows: [string, string][] } {
  const sentences: string[] = [];
  const rows: [string, string][] = [];
  for (const raw of text.split(";")) {
    const part = raw.trim();
    if (!part) continue;
    const m = /^([^:]{1,40}):\s*(.+)$/.exec(part);
    if (m) rows.push([m[1].trim(), m[2].trim()]);
    else sentences.push(part.endsWith(".") ? part : `${part}.`);
  }
  return { sentences, rows };
}

function Shell({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      data-testid="popup map-popup"
      role="dialog"
      aria-label={label}
      className="relative w-[300px] max-w-[calc(100vw-48px)] rounded-2xl border border-sand-dark bg-white p-4 text-ink shadow-[0_10px_30px_rgb(20_22_27/0.25)]"
      data-map-scroll=""
    >
      <button
        type="button"
        data-testid="popup-close"
        aria-label="Close popup"
        title="Close popup"
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-muted hover:bg-sand hover:text-ink"
        onClick={onClose}
      >
        <span aria-hidden="true">×</span>
      </button>
      {children}
      <span
        aria-hidden="true"
        className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-sand-dark bg-white"
      />
    </div>
  );
}

export interface MarkerPopupProps {
  marker: MapMarkerData;
  category: MapCategoryData;
  color: string;
  featureHref: string;
  number: number;
  total: number;
  numberTitle: string;
  numberText: string;
  found: boolean;
  favorite: boolean;
  favLabel: string;
  copied: boolean;
  prevLabel: string;
  nextLabel: string;
  onToggleFound: () => void;
  onToggleFavorite: () => void;
  onZoom: () => void;
  onCopy: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onImage: () => void;
}

export function MarkerPopup(p: MarkerPopupProps) {
  const desc = p.marker.description ? descriptionParts(p.marker.description) : null;
  const btn =
    "inline-flex h-9 items-center justify-center gap-1 rounded-full border border-sand-dark bg-white px-3 text-sm font-semibold text-teal hover:bg-sand";
  return (
    <Shell label={p.marker.name} onClose={p.onClose}>
      {p.marker.image ? (
        <button
          type="button"
          className="-mx-1 mb-3 block overflow-hidden rounded-xl border border-sand-dark"
          aria-label={`Open the screenshot of ${p.marker.name}`}
          onClick={p.onImage}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/art/marker/${p.marker.image.id}.svg`}
            alt={`${p.marker.name} screenshot`}
            width={p.marker.image.width}
            height={p.marker.image.height}
            className="block h-auto w-full"
          />
        </button>
      ) : null}
      <h3 data-testid="popup-title map-popup-title" className="pr-8 font-display text-lg font-bold uppercase leading-tight tracking-wide">
        {p.marker.name}
      </h3>
      <a
        data-testid="popup-category-link"
        href={p.featureHref}
        className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-teal underline-offset-2 hover:underline"
      >
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
        {p.category.name}
      </a>
      {desc ? (
        <div data-testid="popup-desc" className="mt-2 text-sm text-muted">
          {desc.sentences.map((s, i) => (
            <p key={i}>{s}</p>
          ))}
          {desc.rows.length ? (
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
              {desc.rows.map(([k, v], i) => (
                <div key={i} className="contents">
                  <dt className="font-semibold text-ink">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
      {p.category.trackable ? (
        <label
          data-testid="popup-found-label"
          className="mt-3 inline-flex cursor-pointer select-none items-center gap-2 rounded-full bg-sand px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide"
        >
          <input
            type="checkbox"
            data-testid="popup-found-box"
            className="h-4 w-4 accent-[#ff6a4d]"
            checked={p.found}
            onChange={p.onToggleFound}
          />
          <span data-testid="popup-found-toggle">Found</span>
        </label>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {p.marker.detailsPath ? (
          <a
            data-testid="popup-actions popup-details-link"
            href={p.marker.detailsPath}
            target="_blank"
            rel="noopener"
            className="inline-flex h-9 items-center rounded-full bg-teal px-4 text-sm font-semibold text-white! hover:bg-[#0b3e40] hover:text-white!"
          >
            View details
          </a>
        ) : null}
        <button
          type="button"
          data-testid="popup-buttons map-popup-buttons popup-fav map-fav-star"
          aria-label={p.favLabel}
          title={p.favLabel}
          aria-pressed={p.favorite}
          className={`${btn} w-9 px-0 ${p.favorite ? "text-coral" : ""}`}
          onClick={p.onToggleFavorite}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path
              d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"
              fill={p.favorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          data-testid="popup-buttons map-popup-buttons popup-zoom"
          aria-label="Zoom in"
          title="Zoom in"
          className={btn}
          onClick={p.onZoom}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M15 15l5 5M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Zoom in
        </button>
        <button
          type="button"
          data-testid="popup-buttons map-popup-buttons popup-copy"
          aria-label="Copy link"
          title="Copy link"
          className={btn}
          onClick={p.onCopy}
        >
          {p.copied ? "Copied!" : "Copy link"}
        </button>
        <span className="sr-only" aria-live="polite">
          {p.copied ? "Copied!" : ""}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-sand-dark pt-3">
        <button
          type="button"
          data-testid="popup-buttons map-popup-buttons popup-prev"
          aria-label={p.prevLabel}
          title={p.prevLabel}
          className={btn}
          onClick={p.onPrev}
        >
          <span aria-hidden="true">‹</span> Previous
        </button>
        <span data-testid="popup-navnum" title={p.numberTitle} className="font-display text-sm font-semibold tabular-nums text-muted">
          {p.numberText}
        </span>
        <button
          type="button"
          data-testid="popup-buttons map-popup-buttons popup-next"
          aria-label={p.nextLabel}
          title={p.nextLabel}
          className={btn}
          onClick={p.onNext}
        >
          Next <span aria-hidden="true">›</span>
        </button>
      </div>
    </Shell>
  );
}

export function SpotPopup({ onClose, onSuggest }: { onClose: () => void; onSuggest: () => void }) {
  return (
    <Shell label={SHARED_SPOT.title} onClose={onClose}>
      <h3 data-testid="popup-title map-popup-title" className="pr-8 font-display text-lg font-bold uppercase leading-tight tracking-wide">
        {SHARED_SPOT.title}
      </h3>
      <p data-testid="popup-desc" className="mt-2 text-sm text-muted">
        {SHARED_SPOT.text}
      </p>
      <div className="mt-3">
        <button
          type="button"
          data-testid="panel-pills"
          className="inline-flex h-9 items-center rounded-full bg-coral px-4 font-display text-sm font-bold uppercase tracking-wide text-ink hover:brightness-95"
          onClick={onSuggest}
        >
          {SHARED_SPOT.pill}
        </button>
      </div>
    </Shell>
  );
}
