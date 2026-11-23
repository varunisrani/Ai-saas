"use client";

/**
 * Map sidebar (R-801, R-802, R-808..R-818, R-831, R-834..R-839, R-841, R-843..R-845): heading, guest line,
 * search combobox, group rail, Hide all / Hide found, grouped category rows, reset and member actions.
 */
import { memo, useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import type { CategoryCounter } from "@/lib";

/** Keyed test tokens (TA4, section 18.4) of the categories and groups the vectors name. */
const CATEGORY_TOKEN: Record<string, string> = {
  bank: "banks",
  safehouse: "safehouses",
  garage: "garages",
  "hidden-package": "hidden-pkg",
  atm: "atms",
  "gas-station": "gas",
  "card-liberty-city-wrath": "wrath",
};
const RAIL_TOKEN: Record<string, string> = { "food-drink": "food" };

function tokens(...list: (string | false | null | undefined)[]): string {
  return [...new Set(list.filter(Boolean) as string[])].join(" ");
}

function catTokens(id: string, part: string, ...extra: (string | false | null | undefined)[]): string {
  const alias = CATEGORY_TOKEN[id];
  return tokens(...extra, `cat-${id}-${part}`, alias && `cat-${alias}-${part}`);
}

export interface SidebarRow {
  id: string;
  name: string;
  href: string;
  color: string;
  trackable: boolean;
  on: boolean;
  visible: boolean;
  counter: CategoryCounter;
  onlyText: string;
  onlyLabel: string;
  arrowLabel: string;
}

export interface SidebarGroup {
  id: string;
  name: string;
  color: string;
  rows: SidebarRow[];
  checked: boolean;
  mixed: boolean;
  folded: boolean;
  foldLabel: string;
  /** Has rows left after the search filter. */
  shown: boolean;
  railState: string;
}

export interface SidebarHit {
  id: string;
  name: string;
  line: string;
}

export interface SidebarApi {
  toggleCategory: (id: string) => void;
  setGroup: (id: string, on: boolean) => void;
  fold: (id: string) => void;
  only: (id: string) => void;
  arrow: (id: string) => void;
  allButton: () => void;
  hideFound: () => void;
  query: (text: string) => void;
  searchKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  openHit: (index: number) => void;
  clearSearch: () => void;
  rail: (id: string) => void;
  reset: () => void;
  action: (kind: "suggest" | "personal" | "contest" | "feedback") => void;
  about: () => void;
  close: () => void;
}

export interface MapSidebarProps {
  heading: string;
  headingId: string;
  closed: boolean;
  narrow: boolean;
  groups: SidebarGroup[];
  allWord: string;
  hideFoundText: string;
  hideFoundTitle: string;
  query: string;
  hits: SidebarHit[];
  activeIndex: number;
  markerMessage: string | null;
  categoryMessage: string | null;
  railCurrent: string | null;
  focusSearchToken: number;
  /** Before hydration a narrow map hides the sidebar by a container query (R-841, no flash). */
  hydrated: boolean;
  api: SidebarApi;
}

const LISTBOX_ID = "la-map-hits";

export const MapSidebar = memo(function MapSidebar(p: MapSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { api } = p;

  useEffect(() => {
    if (p.focusSearchToken > 0) inputRef.current?.focus();
  }, [p.focusSearchToken]);

  const railClick = (id: string) => {
    api.rail(id);
    const box = scrollRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-group-id="${id}"]`);
    if (box && el) {
      const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8;
      box.scrollTo({ top, behavior: "auto" });
    }
  };

  const nameClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // follow the link
    e.preventDefault();
    api.toggleCategory(id);
  };

  const expanded = p.hits.length > 0;
  const activeId = p.activeIndex >= 0 && p.activeIndex < p.hits.length ? `la-map-hit-${p.activeIndex}` : undefined;

  return (
    <aside
      id="la-map-sidebar"
      data-testid="sidebar"
      aria-label="Map sidebar"
      aria-hidden={p.closed ? "true" : "false"}
      className={`${p.closed ? "hidden" : "flex"} ${p.hydrated ? "" : "@max-[700px]:hidden"} absolute inset-y-0 left-0 z-30 flex-col border-r border-sand-dark bg-sand/95 shadow-[4px_0_24px_rgb(20_22_27/0.12)] backdrop-blur ${
        p.narrow ? "w-full" : "w-[340px]"
      }`}
      data-map-scroll=""
    >
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
        <div className="flex items-start justify-between gap-2">
          <h1 id={p.headingId} className="font-display text-xl font-bold uppercase leading-tight tracking-wide text-ink">
            {p.heading}
          </h1>
          <button
            type="button"
            data-testid="sidebar-close"
            aria-label="Hide the sidebar"
            title="Hide the sidebar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand-dark bg-white text-teal hover:bg-sand"
            onClick={api.close}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p data-testid="guest-line" className="mt-2 text-sm text-muted">
          Your ticks and filters stay in this browser only.{" "}
          <a data-testid="login-link" href="/login" className="font-semibold text-teal underline underline-offset-2">
            Log in
          </a>{" "}
          to read about accounts.
        </p>

        <div className="relative mt-3">
          <div className="flex items-center rounded-full border border-sand-dark bg-white pl-3 pr-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-lagoon">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" className="shrink-0 text-muted">
              <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M15 15l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              data-testid="search-input"
              role="combobox"
              aria-label="Search locations or categories"
              aria-autocomplete="list"
              aria-controls={LISTBOX_ID}
              aria-expanded={expanded}
              aria-activedescendant={activeId}
              autoComplete="off"
              spellCheck={false}
              placeholder="Search markers or categories…"
              className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm text-ink outline-none! placeholder:text-muted/80"
              value={p.query}
              onChange={(e) => api.query(e.target.value)}
              onKeyDown={api.searchKey}
            />
            <button
              type="button"
              data-testid="search-clear"
              aria-label="Clear the search"
              title="Clear the search"
              className={`flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-sand hover:text-ink ${p.query ? "" : "opacity-40"}`}
              onClick={api.clearSearch}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <ul
            id={LISTBOX_ID}
            role="listbox"
            aria-label="Matching markers"
            className={`${expanded ? "block" : "hidden"} mt-2 max-h-72 overflow-y-auto rounded-2xl border border-sand-dark bg-white py-1 shadow-md`}
          >
            {p.hits.map((h, i) => (
              <li
                key={h.id}
                id={`la-map-hit-${i}`}
                role="option"
                aria-selected={i === p.activeIndex}
                data-testid={tokens("search-hits", i === 0 && "search-hit-first")}
                className={`cursor-pointer px-3 py-1.5 text-sm ${i === p.activeIndex ? "bg-lagoon/15" : "hover:bg-sand"}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => api.openHit(i)}
              >
                <span className="block font-semibold text-ink">{h.name}</span>
                <span data-testid="search-hit-cat" className="block text-xs text-muted">
                  {h.line}
                </span>
              </li>
            ))}
          </ul>
          {p.markerMessage ? (
            <p data-testid="search-empty" className="mt-2 text-sm text-muted" role="status">
              {p.markerMessage}
            </p>
          ) : null}
        </div>

        <nav aria-label="Groups" className="mt-3">
          <ul className="flex flex-wrap gap-1.5">
            {p.groups.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  data-testid={tokens("group-rail", `rail-${g.id}`, RAIL_TOKEN[g.id] && `rail-${RAIL_TOKEN[g.id]}`)}
                  data-state={g.railState || undefined}
                  aria-label={g.name}
                  title={g.name}
                  aria-current={p.railCurrent === g.id ? "true" : undefined}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-display text-xs font-bold text-white transition-opacity ${
                    p.railCurrent === g.id ? "border-ink" : "border-white"
                  } ${g.railState.includes("off") ? "opacity-35" : ""}`}
                  style={{ background: g.color }}
                  onClick={() => railClick(g.id)}
                >
                  <span aria-hidden="true">{g.name.charAt(0)}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            data-testid="show-hide-all"
            className="h-9 flex-1 rounded-full border border-teal bg-white px-3 font-display text-xs font-bold uppercase tracking-wide text-teal hover:bg-teal hover:text-white"
            onClick={api.allButton}
          >
            {p.allWord}
          </button>
          <button
            type="button"
            data-testid="hide-found"
            title={p.hideFoundTitle}
            className="h-9 flex-1 rounded-full border border-teal bg-white px-3 font-display text-xs font-bold uppercase tracking-wide text-teal hover:bg-teal hover:text-white"
            onClick={api.hideFound}
          >
            {p.hideFoundText}
          </button>
        </div>

        {p.categoryMessage ? (
          <p data-testid="category-none" className="mt-3 text-sm text-muted" role="status">
            {p.categoryMessage}
          </p>
        ) : null}

        <div className="mt-3 space-y-3">
          {p.groups.map((g) => {
            const boxId = `la-group-box-${g.id}`;
            return (
              <section
                key={g.id}
                data-testid="groups"
                data-group-id={g.id}
                className={`${g.shown ? "block" : "hidden"} rounded-2xl border border-sand-dark bg-white`}
              >
                <div className="flex items-center gap-2 border-b border-sand-dark px-3 py-2">
                  <GroupBox id={boxId} name={g.name} checked={g.checked} mixed={g.mixed} groupId={g.id} onChange={api.setGroup} />
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.color }} />
                  <label
                    htmlFor={boxId}
                    data-testid={`group-${g.id}-toggle group-names`}
                    className="flex-1 cursor-pointer font-display text-sm font-bold uppercase tracking-wide text-ink"
                  >
                    {g.name}
                  </label>
                  <button
                    type="button"
                    data-testid={`group-${g.id}-fold`}
                    aria-label={g.foldLabel}
                    title={g.foldLabel}
                    aria-expanded={!g.folded}
                    aria-controls={`la-group-body-${g.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-teal hover:bg-sand"
                    onClick={() => api.fold(g.id)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      aria-hidden="true"
                      focusable="false"
                      className={g.folded ? "-rotate-90" : ""}
                    >
                      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <ul
                  id={`la-group-body-${g.id}`}
                  data-testid={`group-${g.id}-body`}
                  className={`${g.folded ? "hidden" : "block"} py-1`}
                >
                  {g.rows.map((r) => (
                    <li
                      key={r.id}
                      data-testid={catTokens(
                        r.id,
                        "row",
                        "category-rows",
                        r.visible && !g.folded && "category-rows-visible",
                        r.trackable && "category-rows-tracked",
                      )}
                      className={`${r.visible ? "flex" : "hidden"} group/row items-center gap-2 px-3 py-1 hover:bg-sand/70 focus-within:bg-sand/70`}
                    >
                      <input
                        type="checkbox"
                        role="switch"
                        aria-label={r.name}
                        data-testid={catTokens(r.id, "box", r.on && "category-checked")}
                        className="h-4 w-4 shrink-0 accent-[#0e4d4f]"
                        checked={r.on}
                        onChange={() => api.toggleCategory(r.id)}
                      />
                      <span
                        data-testid={catTokens(r.id, "toggle")}
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm ${
                          r.on ? "" : "opacity-40 grayscale"
                        }`}
                        style={{ background: r.color }}
                        onClick={() => api.toggleCategory(r.id)}
                      >
                        {r.name.replace(/[^A-Za-z0-9]/g, "").charAt(0)}
                      </span>
                      <a
                        href={r.href}
                        data-testid={catTokens(r.id, "name", "category-names")}
                        className={`min-w-0 flex-1 truncate text-sm ${r.on ? "text-ink! no-underline hover:underline" : "text-muted! line-through decoration-muted/50"}`}
                        onClick={(e) => nameClick(e, r.id)}
                      >
                        {r.name}
                      </a>
                      <span
                        data-testid={catTokens(r.id, "counter")}
                        title={r.counter.tooltip}
                        aria-hidden={r.counter.ariaHidden ? "true" : undefined}
                        className="shrink-0 font-display text-xs font-semibold tabular-nums text-muted"
                      >
                        {r.counter.text === "" ? "" : r.counter.found === null ? (
                          r.counter.text
                        ) : (
                          <>
                            <span className="sr-only">found </span>
                            {r.counter.found}
                            <span className="sr-only"> </span>/<span className="sr-only"> </span>
                            {r.counter.total}
                          </>
                        )}
                      </span>
                      {r.counter.srText ? (
                        <span data-testid={catTokens(r.id, "sr")} className="sr-only">
                          {r.counter.srText}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        data-testid={catTokens(r.id, "only")}
                        aria-label={r.onlyLabel}
                        className="hidden h-6 shrink-0 items-center rounded-full border border-teal px-2 font-display text-[11px] font-bold uppercase tracking-wide text-teal hover:bg-teal hover:text-white group-hover/row:inline-flex group-focus-within/row:inline-flex"
                        onClick={() => api.only(r.id)}
                      >
                        {r.onlyText}
                      </button>
                      <button
                        type="button"
                        data-testid={catTokens(r.id, "next")}
                        aria-label={r.arrowLabel}
                        title={r.arrowLabel}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-teal opacity-0 hover:bg-teal hover:text-white focus-visible:opacity-100 group-hover/row:opacity-100 group-focus-within/row:opacity-100"
                        onClick={() => api.arrow(r.id)}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                          <path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            data-testid="reset-progress"
            className="h-9 w-full rounded-full border border-coral bg-white px-3 text-sm font-semibold text-ink hover:bg-coral/15"
            onClick={api.reset}
          >
            Reset progress
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" data-testid="suggest-open" className={ACTION} onClick={() => api.action("suggest")}>
              + Suggest location
            </button>
            <button
              type="button"
              data-testid="own-open map-personal-marker"
              className={ACTION}
              onClick={() => api.action("personal")}
            >
              + Personal marker
            </button>
            <button type="button" data-testid="contest-open" className={ACTION} onClick={() => api.action("contest")}>
              Map Contest
            </button>
            <button type="button" data-testid="feedback-open" className={ACTION} onClick={() => api.action("feedback")}>
              Feedback
            </button>
          </div>
          <button
            type="button"
            data-testid="about-open"
            aria-label="About this map"
            className="h-9 w-full rounded-full px-3 text-sm font-semibold text-teal underline-offset-2 hover:underline"
            onClick={api.about}
          >
            About this map
          </button>
        </div>
      </div>
    </aside>
  );
});

const ACTION =
  "min-h-9 rounded-full bg-teal px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-white hover:bg-[#0b3e40]";

function GroupBox({
  id,
  groupId,
  name,
  checked,
  mixed,
  onChange,
}: {
  id: string;
  groupId: string;
  name: string;
  checked: boolean;
  mixed: boolean;
  onChange: (id: string, on: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      aria-label={name}
      aria-checked={mixed ? "mixed" : checked}
      data-testid={`group-${groupId}-box`}
      className="h-4 w-4 shrink-0 accent-[#0e4d4f]"
      checked={checked}
      onChange={(e) => onChange(groupId, e.target.checked)}
    />
  );
}
