"use client";

/**
 * Database list widget (F1, section 5) with the compare toggles and bar (F3, section 7.1).
 * The whole dataset arrives with the page; filtering, sorting and paging run in the browser (R-501). The list state
 * is the URL hash, written with history replace and copied to sessionStorage `jamg-hash:<list path>` (R-525..R-531).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LIST_APPROACH_DISTANCE_PX,
  activeFilterCount,
  applyFilterChange,
  applySortChange,
  chooseInitialHash,
  clearedFilterState,
  compareLink,
  countNoun,
  defaultListHash,
  directionButtonLabel,
  effectiveSort,
  filterEntries,
  flipDirection,
  hasMoreBatches,
  initialListHash,
  isPicked,
  isToggleDisabled,
  listMemoryKey,
  listRulesFromConfig,
  nextBatchesShown,
  nextPickedTiles,
  optionCounts,
  renderedCount,
  safeRead,
  safeWrite,
  serializeListHash,
  shouldWriteListMemory,
  sortEntries,
  validOptionsFromConfig,
  type FilterState,
  type HashPair,
  type NavigationKind,
  type SortDir,
} from "@/lib";
import type { ListConfig, ListFilterConfig } from "@/data";
import { CompareBar } from "../compare/CompareBar";
import { useComparePicks } from "../compare/useComparePicks";
import { ClassTiles } from "./ClassTiles";
import { FilterDropdown, type DropdownItem } from "./FilterDropdown";
import { ListCard, type ClientEntry } from "./ListCard";
import { tid } from "./tid";

export interface ListPageProps {
  config: ListConfig;
  entries: ClientEntry[];
}

// ---------------------------------------------------------------- navigation kind (R-531)

let listMounts = 0;
let lastPopAt = -Infinity;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    lastPopAt = Date.now();
  });
}

/** Back/Forward detection for full loads (Navigation Timing) and in-app traversals (a recent popstate). */
function navigationKind(): NavigationKind {
  const firstMount = listMounts === 0;
  listMounts += 1;
  if (Date.now() - lastPopAt < 3000) return "back_forward";
  if (firstMount) {
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type) return nav.type as NavigationKind;
    } catch {
      /* ignore */
    }
  }
  return "navigate";
}

function sortValueOfPairs(pairs: readonly HashPair[], fallback: string): string {
  return pairs.find(([k]) => k === "sort")?.[1] ?? fallback;
}

export function ListPage({ config, entries }: ListPageProps) {
  const rules = useMemo(() => listRulesFromConfig(config), [config]);
  const validOptions = useMemo(() => validOptionsFromConfig(config), [config]);
  const memoryKey = listMemoryKey(config.path);

  const [mounted, setMounted] = useState(false);
  const [pairs, setPairs] = useState<HashPair[]>([]);
  const [state, setState] = useState<FilterState>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [batches, setBatches] = useState(1);
  const [mode, setMode] = useState<"grid" | "list">("grid");
  const leavingRef = useRef(false);
  const navKindRef = useRef<NavigationKind | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pairsRef = useRef<HashPair[]>([]);
  const hashRef = useRef("");
  const stateRef = useRef<FilterState>({});

  const { picks, toggle, clear } = useComparePicks(config.path);

  const textFilters = config.filters.filter((f) => f.kind === "text");

  // ------------------------------------------------------------ hash writes (R-525, R-530)
  const writeHash = useCallback(
    (next: HashPair[]) => {
      hashRef.current = serializeListHash(next);
      pairsRef.current = next;
      setPairs(next);
      const hash = serializeListHash(next);
      try {
        const url = `${window.location.pathname}${window.location.search}${hash}`;
        // The router's own history state is kept as is (no router action, no request: R-501); the guard installed
        // on mount keeps the hash when the router later rewrites the same entry.
        window.history.replaceState(window.history.state, "", url);
      } catch {
        /* ignore */
      }
      if (shouldWriteListMemory(leavingRef.current)) safeWrite(memoryKey, hash, "session");
    },
    [memoryKey],
  );

  // ------------------------------------------------------------ hash guard
  // The app router rewrites the current history entry with its own URL after internal state changes (e.g. a dev
  // refresh). Its URL lacks the list hash, so while the list is mounted the hash is put back on such writes.
  useEffect(() => {
    const original = window.history.replaceState;
    const guarded: History["replaceState"] = function (this: History, data, unused, url) {
      try {
        const internal = !!data && typeof data === "object" && "__NA" in (data as Record<string, unknown>);
        if (internal && url !== undefined && url !== null && hashRef.current) {
          const u = new URL(String(url), window.location.href);
          if (!u.hash && u.pathname === window.location.pathname && u.search === window.location.search) {
            return original.call(this, data, unused, `${u.pathname}${u.search}${hashRef.current}`);
          }
        }
      } catch {
        /* fall through */
      }
      return original.call(this, data, unused, url);
    };
    // An in-app visit of the bare list URL while the list stays mounted (e.g. its own menu link) is a plain visit:
    // the list starts again from the defaults (R-531).
    const originalPush = window.history.pushState;
    const guardedPush: History["pushState"] = function (this: History, data, unused, url) {
      const before = window.location.pathname;
      const result = originalPush.call(this, data, unused, url);
      try {
        const internal = !!data && typeof data === "object" && "__NA" in (data as Record<string, unknown>);
        if (internal && url !== undefined && url !== null) {
          const u = new URL(String(url), window.location.href);
          if (!u.hash && u.pathname === before) window.setTimeout(() => initRef.current("navigate"), 0);
        }
      } catch {
        /* ignore */
      }
      return result;
    };
    window.history.replaceState = guarded;
    window.history.pushState = guardedPush;
    return () => {
      if (window.history.replaceState === guarded) window.history.replaceState = original;
      if (window.history.pushState === guardedPush) window.history.pushState = originalPush;
    };
  }, []);

  // ------------------------------------------------------------ load (R-526, R-529, R-531)
  const initFrom = useCallback(
    (kind: NavigationKind) => {
      const defaults = defaultListHash(rules);
      const saved = safeRead(memoryKey, "session");
      const choice = chooseInitialHash(kind, window.location.hash, saved, defaults);
      const init = initialListHash(choice.hash, rules, validOptions);
      stateRef.current = init.state;
      setState(init.state);
      setBatches(1);
      const d: Record<string, string> = {};
      for (const f of config.filters) {
        if (f.kind === "text") d[f.hashKey] = typeof init.state[f.hashKey] === "string" ? (init.state[f.hashKey] as string) : "";
      }
      setDrafts(d);
      leavingRef.current = false; // the list stays: this visit's hash is remembered (R-530, R-531)
      writeHash(init.pairs);
      setMounted(true);
    },
    [config.filters, memoryKey, rules, validOptions, writeHash],
  );
  const initRef = useRef(initFrom);
  initRef.current = initFrom;

  useEffect(() => {
    if (navKindRef.current === null) navKindRef.current = navigationKind();
    initFrom(navKindRef.current);
    // leaving after a link click: later writes are not copied to the memory (R-530)
    const onDown = (e: PointerEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a || e.button !== 0) return;
      const href = a.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;
      leavingRef.current = true;
      window.setTimeout(() => {
        leavingRef.current = false;
      }, 1500);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------ derived list
  const sort = useMemo(() => effectiveSort(pairs, rules), [pairs, rules]);
  const filtered = useMemo(() => filterEntries(entries, state, rules), [entries, state, rules]);
  const sorted = useMemo(() => sortEntries(filtered, sort.key, sort.dir, rules), [filtered, sort.key, sort.dir, rules]);
  const total = sorted.length;
  const shownCount = renderedCount(total, batches);
  const shown = sorted.slice(0, shownCount);
  const active = activeFilterCount(state, rules);

  const counts = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const f of config.filters) {
      if (f.kind === "text") continue;
      out[f.hashKey] = optionCounts(entries, state, rules, f.hashKey, f.options.map((o) => o.value));
    }
    return out;
  }, [config.filters, entries, state, rules]);

  // ------------------------------------------------------------ infinite batches (R-523)
  useEffect(() => {
    if (!mounted) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (items) => {
        if (items.some((i) => i.isIntersecting)) setBatches((b) => nextBatchesShown(b, total));
      },
      { rootMargin: `0px 0px ${LIST_APPROACH_DISTANCE_PX}px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, total, shownCount]);

  // ------------------------------------------------------------ changes
  const changeFilters = useCallback(
    (nextState: FilterState) => {
      stateRef.current = nextState;
      setState(nextState);
      setBatches(1);
      writeHash(applyFilterChange(pairsRef.current, nextState, rules));
    },
    [rules, writeHash],
  );

  const setFilter = (key: string, value: string | string[]) => changeFilters({ ...stateRef.current, [key]: value });

  const commitText = (f: ListFilterConfig) => {
    const draft = drafts[f.hashKey] ?? "";
    const current = typeof stateRef.current[f.hashKey] === "string" ? (stateRef.current[f.hashKey] as string) : "";
    if (draft === current) return;
    setFilter(f.hashKey, draft);
  };

  const changeSort = (field: string, dir: SortDir) => {
    setBatches(1);
    writeHash(applySortChange(pairsRef.current, field, dir));
  };

  const clearFilters = () => {
    const cleared = clearedFilterState(rules);
    const d: Record<string, string> = {};
    for (const f of textFilters) d[f.hashKey] = "";
    setDrafts(d);
    changeFilters(cleared);
  };

  const compareHref = compareLink(config.path, config.compareType, picks);

  // ------------------------------------------------------------ render helpers
  const filterBlock = (f: ListFilterConfig) => {
    const titleId = `filter-title-${f.id}`;
    let control: React.ReactNode = null;
    if (f.kind === "text") {
      const token = f.id === "name" ? "name-search" : "real-life-search";
      control = (
        <input
          type="text"
          id={`filter-${f.id}`}
          aria-labelledby={titleId}
          placeholder={f.placeholder}
          maxLength={f.maxLength}
          autoComplete="off"
          spellCheck={false}
          data-testid={token}
          className="w-full rounded-xl border border-sand-dark bg-white px-3 py-2 text-sm placeholder:text-muted/80 hover:border-lagoon"
          value={drafts[f.hashKey] ?? ""}
          onChange={(e) => setDrafts((d) => ({ ...d, [f.hashKey]: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitText(f);
            }
          }}
          onBlur={() => commitText(f)}
        />
      );
    } else if (f.kind === "tiles") {
      const picked = (Array.isArray(state[f.hashKey]) ? state[f.hashKey] : []) as string[];
      control = (
        <ClassTiles
          title={f.title}
          picked={picked}
          options={f.options.map((o) => ({ value: o.value, label: o.label, count: counts[f.hashKey]?.[o.value] ?? 0 }))}
          onPick={(value, modifier, viaAdd) => setFilter(f.hashKey, nextPickedTiles(picked, value, modifier, viaAdd))}
        />
      );
    } else {
      const base = f.id === "manufacturer" ? "manufacturer" : f.id === "standout" ? "standout" : "weapon-type";
      const current = typeof state[f.hashKey] === "string" ? (state[f.hashKey] as string) : "";
      const items: DropdownItem[] = f.options.map((o, i) => {
        const tokens: string[] = [];
        const mirrorTokens: string[] = [];
        if (base === "standout") {
          tokens.push(`standout-option-${i + 1}`);
          mirrorTokens.push(`standout-option-${i + 1}-text`);
          if (o.value === "hide-standouts") tokens.push("standout-option-hide");
        }
        if (base === "weapon-type") tokens.push(`weapon-type-option-${o.value.split("-")[0]}`);
        return { value: o.value, label: o.label, count: counts[f.hashKey]?.[o.value] ?? 0, tokens, mirrorTokens };
      });
      control = (
        <FilterDropdown
          base={base}
          title={f.title}
          items={items}
          value={current}
          placeholder={f.placeholder}
          onSelect={(v) => setFilter(f.hashKey, v)}
        />
      );
    }
    return (
      <div
        key={f.id}
        data-testid="filter-groups"
        className={f.kind === "tiles" ? "col-span-full min-w-0" : "min-w-0"}
      >
        <div id={titleId} data-testid="filter-titles" className="mb-1 font-display text-xs font-bold uppercase tracking-wide text-muted">
          {f.title}
        </div>
        {control}
      </div>
    );
  };

  const sortItems: DropdownItem[] = config.sortFields.map((s) => ({
    value: s.hashKey,
    label: s.label,
    tokens: [`sort-option-${s.id}`],
  }));

  const countText = countNoun(total, config.pluralNoun);
  const countNum = String(total);

  const toolbar = (bottom: boolean) =>
    bottom ? (
      <div className="mt-4 flex items-center justify-end border-t border-sand-dark pt-3 font-display text-sm font-semibold">
        <p className="m-0" aria-hidden={!mounted}>
          <span data-testid="list-count-bottom-number">{mounted ? countNum : ""}</span>
          {mounted ? countText.slice(countNum.length) : ""}
        </p>
      </div>
    ) : null;

  return (
    <div data-testid="megafilter-wrap" className="flex flex-col gap-4">
      <section
        data-testid="filter-panel"
        aria-label="Filters"
        className="rounded-card border border-sand-dark bg-white/70 p-3 sm:p-4"
      >
        <div data-testid="filter-panel-content" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {config.filters.filter((f) => f.kind === "tiles").map(filterBlock)}
          {config.filters.filter((f) => f.kind !== "tiles").map(filterBlock)}
        </div>
        <div data-testid="selected-filters" className="mt-3 flex items-center gap-2">
          <button
            type="button"
            data-testid="clear-filters"
            hidden={active === 0}
            className="rounded-pill border border-coral bg-coral/10 px-3 py-1 font-display text-sm font-semibold text-ink hover:bg-coral"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </section>
      <div data-testid="filter-backdrop" hidden />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          hidden
          data-testid="filters-toggle"
          aria-label={config.list === "vehicles" ? "Open Filters" : undefined}
          aria-expanded="false"
        >
          <span>Open Filter</span> <span>Close Filter</span>
        </button>
        <span id="sort-by-label" className="font-display text-sm font-semibold">
          {config.sortLabel}
        </span>
        <FilterDropdown
          base="sort"
          title={config.sortLabel}
          items={sortItems}
          value={sort.key}
          placeholder={null}
          isSort
          onSelect={(v) => changeSort(v, sort.dir)}
          className="w-48"
        />
        <button
          type="button"
          data-testid="sort-direction"
          data-state={sort.dir}
          aria-label={directionButtonLabel(sort.dir)}
          title={directionButtonLabel(sort.dir)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-sand-dark bg-white hover:border-lagoon"
          onClick={() => changeSort(sortValueOfPairs(pairsRef.current, sort.key), flipDirection(sort.dir))}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" className={sort.dir === "desc" ? "rotate-180" : ""}>
            <path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p role="status" data-testid="list-count" className="m-0 font-display text-sm font-semibold">
          <span data-testid="list-count-number">{mounted ? countNum : ""}</span>
          {mounted ? countText.slice(countNum.length) : ""}
        </p>
        <div className="ml-auto flex gap-1" role="group" aria-label="Layout">
          <button
            type="button"
            aria-label="Grid view"
            title="Grid view"
            aria-pressed={mode === "grid"}
            data-testid="layout-grid"
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${mode === "grid" ? "border-teal bg-teal text-white" : "border-sand-dark bg-white"}`}
            onClick={() => setMode("grid")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="List view"
            title="List view"
            aria-pressed={mode === "list"}
            data-testid="layout-list"
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${mode === "list" ? "border-teal bg-teal text-white" : "border-sand-dark bg-white"}`}
            onClick={() => setMode("list")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path d="M4 5h16M4 12h16M4 19h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div
        data-testid="list-head"
        hidden={mode !== "list"}
        aria-hidden={mode !== "list"}
        className="grid grid-cols-[1fr_1.4fr_1fr_1.2fr_repeat(3,0.8fr)] gap-2 rounded-xl bg-ink px-2 py-2 pr-12 font-display text-xs font-semibold uppercase tracking-wide text-white"
      >
        {config.listHead.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>

      {mounted ? (
        <ul
          data-testid="products-wrapper"
          aria-label={config.pluralNoun}
          className={
            mode === "grid"
              ? "m-0 grid list-none grid-cols-1 gap-4 p-0 min-[560px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4"
              : "m-0 list-none overflow-hidden rounded-card border border-sand-dark p-0"
          }
        >
          {shown.map((e, i) => (
            <ListCard
              key={e.slug}
              entry={e}
              config={config}
              index={i}
              count={shown.length}
              mode={mode}
              picked={isPicked(picks, e.compareKey)}
              disabled={isToggleDisabled(picks, e.compareKey)}
              onToggle={(x) => toggle({ id: x.compareKey, name: x.name })}
            />
          ))}
        </ul>
      ) : (
        <div data-testid="products-wrapper" className="flex min-h-[40vh] items-center justify-center" role="status">
          <span className="inline-flex items-center gap-3 font-display text-sm font-semibold text-muted">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-lagoon border-t-transparent" aria-hidden="true" />
            Loading the {config.pluralNoun.toLowerCase()}…
          </span>
        </div>
      )}
      <div
        ref={sentinelRef}
        data-testid="autopage-sentinel"
        data-state={hasMoreBatches(total, batches) ? "more" : "done"}
        aria-hidden="true"
        className="h-px w-full"
      />
      {toolbar(true)}

      <CompareBar picks={picks} href={compareHref} onClear={clear} />
    </div>
  );
}
