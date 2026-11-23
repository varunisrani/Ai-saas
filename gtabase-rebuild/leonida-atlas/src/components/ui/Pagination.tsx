"use client";

/**
 * Generic pager navigation "Pagination" driven by the pager model of src/lib (`pagerModel`,
 * `galleryPagerModel`): first / previous / numbered / next / last; disabled entries are not links; the current
 * page is a link labelled "Page N" with href "#" and aria-current (R-1107, R-1204).
 *
 * `variant` picks the test tokens: "news" (F7: page-links, page-current, page-disabled, page-first …),
 * "gallery" (F8 first navigation: pagination-item, pagination-active, pagination-disabled, pagination-page-2 …),
 * "gallery-secondary" (F8 second navigation: only `pagination`), "plain" (no item tokens).
 */
import type { PagerEntry } from "@/lib";

export type PaginationVariant = "news" | "gallery" | "gallery-secondary" | "plain";

export interface PaginationProps {
  entries: PagerEntry[];
  variant?: PaginationVariant;
  className?: string;
}

function Chevron({ dir, double }: { dir: "left" | "right"; double?: boolean }) {
  const d = dir === "left" ? "M14 6l-6 6 6 6" : "M10 6l6 6-6 6";
  const d2 = dir === "left" ? "M19 6l-6 6 6 6" : "M5 6l6 6-6 6";
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {double ? <path d={d2} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </svg>
  );
}

function icon(kind: PagerEntry["kind"]) {
  if (kind === "first") return <Chevron dir="left" double />;
  if (kind === "prev") return <Chevron dir="left" />;
  if (kind === "next") return <Chevron dir="right" />;
  if (kind === "last") return <Chevron dir="right" double />;
  return null;
}

function linkTokens(e: PagerEntry, variant: PaginationVariant): string | undefined {
  const t: string[] = [];
  if (variant === "news") {
    t.push("page-links");
    if (e.current) t.push("page-current");
    if (e.kind === "first") t.push("page-first");
    if (e.kind === "prev") t.push("page-prev");
    if (e.kind === "next") t.push("page-next");
    if (e.kind === "last") t.push("page-last");
    if (e.kind === "page" && !e.current) t.push(`page-${e.page}-link`);
  } else if (variant === "gallery") {
    if (e.kind === "page" && !e.current) t.push(`pagination-page-${e.page}`);
    if (e.kind === "next") t.push("pagination-next");
    if (e.kind === "last") t.push("pagination-last");
    if (e.kind === "first") t.push("pagination-first");
    if (e.kind === "prev") t.push("pagination-prev");
  }
  return t.length ? t.join(" ") : undefined;
}

function itemTokens(e: PagerEntry, variant: PaginationVariant): string | undefined {
  const t: string[] = [];
  if (variant === "gallery") {
    t.push("pagination-item");
    if (e.current) t.push("pagination-active");
    if (e.disabled) t.push("pagination-disabled");
  } else if (variant === "news") {
    if (e.disabled) t.push("page-disabled");
  }
  return t.length ? t.join(" ") : undefined;
}

export function Pagination({ entries, variant = "plain", className }: PaginationProps) {
  return (
    <nav aria-label="Pagination" data-testid="pagination" className={`atlas-pager ${className ?? ""}`}>
      <ul>
        {entries.map((e) => {
          const isIcon = e.kind !== "page";
          const content = isIcon ? icon(e.kind) : String(e.page);
          const key = `${e.kind}-${e.page}`;
          const li = itemTokens(e, variant);
          if (e.disabled || e.href === null) {
            return (
              <li key={key} data-testid={li} className="is-disabled">
                <span aria-disabled="true" aria-label={e.label} title={e.label} className="atlas-pager-entry">
                  {content}
                </span>
              </li>
            );
          }
          return (
            <li key={key} data-testid={li} className={e.current ? "is-current" : undefined}>
              <a
                href={e.href}
                aria-label={e.label}
                title={isIcon ? e.label : undefined}
                aria-current={e.current ? "true" : undefined}
                data-testid={linkTokens(e, variant)}
                className="atlas-pager-entry"
                onClick={
                  e.current
                    ? (ev) => {
                        ev.preventDefault();
                      }
                    : undefined
                }
              >
                {content}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
