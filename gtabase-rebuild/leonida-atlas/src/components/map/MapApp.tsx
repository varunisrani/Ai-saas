"use client";

/**
 * Interactive map (F4, CLONE_SPEC section 8): state, persistence and wiring of the sidebar, the map stage, the
 * popup, the dialogs and the side panels. Every rule comes from src/lib (map-store, map-order, map-search,
 * map-ui, favorites); this file only decides when to apply them.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  COPIED_FEEDBACK_MS,
  FAVORITES_KEY,
  FAVORITE_LISTS,
  GUEST_CHECKLISTS_KEY,
  MAP_ARROW_MIN_ZOOM,
  MAP_FILTER_KEY,
  MAP_NOTICE_KEY,
  MAP_PANEL_TITLES,
  MAP_VIEW_KEY,
  allButtonWord,
  arrowButtonLabel,
  categoryCounter,
  collectingOrder,
  copyLinkValue,
  enterTargetIndex,
  escapeTarget,
  featureHref,
  foldButton,
  foundButton,
  groupBoxState,
  isFavorite,
  isNarrowMap,
  mapAddressPath,
  mapFilterRecord,
  mapSearchMessages,
  markerNumbers,
  multiSpawnGroup,
  navLabels,
  navNumberText,
  nearestMarker,
  noticeClosedValue,
  noticeVisible,
  numberTooltip,
  onlyButton,
  parseMapHash,
  railState,
  readFoundIds,
  readMapFilter,
  resetDialogText,
  resetDoneText,
  resetOptions,
  restoreMapView,
  safeApply,
  safeRead,
  safeWrite,
  searchMarkers,
  setMapFound,
  starButton,
  stepMarker,
  toggleFavorite,
  visibleCategoryRows,
  wrapIndex,
  fullscreenLabel,
  type AllButtonWord,
  type FoundByCategory,
} from "@/lib";
import { Lightbox, notifyFavoritesChanged, useAccountsDialog } from "@/components/ui";
import { MapSidebar, type SidebarApi, type SidebarGroup } from "./MapSidebar";
import { MapStage, type MapStageHandle } from "./MapStage";
import { MarkerPopup, SpotPopup } from "./MapPopup";
import { AboutDialog, ResetDialog, SidePanel, type PanelKind } from "./MapDialogs";
import { centerInRegion, fitZoom, polygonBox, type Size, type View } from "./geometry";
import type { MapAppProps, MapCategoryData, MapMarkerData } from "./types";

const SIDEBAR_PX = 340;

interface FilterState {
  off: ReadonlySet<string>;
  folded: string[] | null;
  sidebarPref: "open" | "closed" | null;
  hideFound: boolean;
}

type PopupState =
  | { kind: "marker"; id: string; key: number }
  | { kind: "spot"; x: number; y: number; key: number }
  | null;

function byNameOtherLast(a: MapCategoryData, b: MapCategoryData): number {
  const ao = /^other\b/i.test(a.name) ? 1 : 0;
  const bo = /^other\b/i.test(b.name) ? 1 : 0;
  if (ao !== bo) return ao - bo;
  return a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true });
}

function currentHash(): string {
  try {
    return window.location.hash;
  } catch {
    return "";
  }
}

export function MapApp(props: MapAppProps) {
  const { groups, categories, markers, art, settings, featureCategoryId, heading } = props;
  const oneCategory = featureCategoryId !== null;
  const accounts = useAccountsDialog();

  // ---------------------------------------------------------------- static derived data
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
  const markerById = useMemo(() => new Map(markers.map((m) => [m.id, m])), [markers]);
  const markersByCat = useMemo(() => {
    const m = new Map<string, MapMarkerData[]>();
    for (const mk of markers) {
      const list = m.get(mk.category) ?? [];
      list.push(mk);
      m.set(mk.category, list);
    }
    return m;
  }, [markers]);
  const orders = useMemo(() => {
    const m = new Map<string, { order: MapMarkerData[]; numbers: Map<string, number>; total: number }>();
    for (const c of categories) {
      const order = collectingOrder(markersByCat.get(c.id) ?? []);
      const nums = markerNumbers(order, c.multiSpawn);
      m.set(c.id, { order, numbers: nums.numbers, total: nums.total });
    }
    return m;
  }, [categories, markersByCat]);
  const categoryOrder = useMemo(() => categories.map((c) => c.id), [categories]);
  const hiddenByDefault = useMemo(() => categories.filter((c) => c.hiddenByDefault).map((c) => c.id), [categories]);
  const colorOf = useCallback(
    (catId: string) => groupById.get(catById.get(catId)?.group ?? "")?.color ?? "#0E4D4F",
    [catById, groupById],
  );
  const groupCats = useMemo(
    () => groups.map((g) => ({ group: g, cats: categories.filter((c) => c.group === g.id).sort(byNameOtherLast) })),
    [groups, categories],
  );

  // ---------------------------------------------------------------- state
  const defaultOff = useMemo<ReadonlySet<string>>(
    () =>
      oneCategory
        ? new Set(categoryOrder.filter((id) => id !== featureCategoryId))
        : new Set(hiddenByDefault),
    [oneCategory, categoryOrder, featureCategoryId, hiddenByDefault],
  );
  const [filter, setFilterState] = useState<FilterState>(() => ({
    off: defaultOff,
    folded: null,
    sidebarPref: null,
    hideFound: false,
  }));
  const filterRef = useRef(filter);
  const [allWord, setAllWord] = useState<AllButtonWord>(oneCategory ? "Show all" : "Hide all");
  const allWordRef = useRef(allWord);
  const [found, setFound] = useState<ReadonlySet<string>>(() => new Set());
  const [favRaw, setFavRaw] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState>(null);
  const popupRef = useRef<PopupState>(null);
  const popupSeq = useRef(0);
  const popupReturn = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [railCurrent, setRailCurrent] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetChoice, setResetChoice] = useState("");
  const [resetDone, setResetDone] = useState<number | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const [notice, setNotice] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const narrowRef = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [focusSearch, setFocusSearch] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<MapStageHandle>(null);
  const dialogOpener = useRef<HTMLElement | null>(null);
  const copyTimer = useRef<number | null>(null);

  // ---------------------------------------------------------------- filter commits (R-814, R-818, R-820)
  const persistFilter = useCallback(
    (f: FilterState) => {
      if (oneCategory) return; // one-category pages write nothing (R-819)
      safeApply(
        MAP_FILTER_KEY,
        mapFilterRecord({
          off: f.off,
          categoryOrder,
          hiddenByDefault,
          folded: f.folded,
          sidebar: f.sidebarPref,
          hideFound: f.hideFound,
        }),
      );
    },
    [oneCategory, categoryOrder, hiddenByDefault],
  );

  const setFilter = useCallback(
    (next: FilterState, save = true) => {
      filterRef.current = next;
      setFilterState(next);
      if (save) persistFilter(next);
    },
    [persistFilter],
  );

  const syncAddress = useCallback(
    (off: ReadonlySet<string>, only: string | null) => {
      const on = new Set(categoryOrder.filter((id) => !off.has(id)));
      const path = mapAddressPath(on, only, categories);
      try {
        const loc = window.location;
        if (loc.pathname + loc.search !== path) window.history.replaceState(window.history.state, "", path + loc.hash);
      } catch {
        /* ignore */
      }
    },
    [categoryOrder, categories],
  );

  /** Applies a new set of switched-off categories (every visible-set change goes through here). */
  const commitOff = useCallback(
    (off: ReadonlySet<string>, opts: { only?: string | null; afterOnly?: boolean } = {}) => {
      const onCount = categoryOrder.length - categoryOrder.filter((id) => off.has(id)).length;
      const word = allButtonWord(allWordRef.current, onCount, categoryOrder.length, opts.afterOnly ?? false);
      allWordRef.current = word;
      setAllWord(word);
      const only = opts.only !== undefined ? opts.only : null;
      setFilter({ ...filterRef.current, off });
      syncAddress(off, only);
    },
    [categoryOrder, setFilter, syncAddress],
  );

  // ---------------------------------------------------------------- popup
  const openMarker = useCallback(
    (id: string, how: "click" | "move" | "initial") => {
      const m = markerById.get(id);
      if (!m) return false;
      if (filterRef.current.off.has(m.category)) {
        const off = new Set(filterRef.current.off);
        off.delete(m.category);
        commitOff(off); // opening a marker of a switched-off category switches it on (R-822)
      }
      if (!popupRef.current) {
        const active = document.activeElement as HTMLElement | null;
        popupReturn.current = active && active !== document.body ? active : null;
      }
      const next: PopupState = { kind: "marker", id, key: ++popupSeq.current };
      popupRef.current = next;
      setPopup(next);
      setCopied(false);
      if (how === "move") {
        const v = stageRef.current?.getView();
        const zoom = Math.max(Math.round(v?.zoom ?? settings.startZoom), settings.clusterBelowZoom);
        stageRef.current?.flyTo(m.x, m.y, zoom, { region: true });
      }
      return true;
    },
    [markerById, commitOff, settings.startZoom, settings.clusterBelowZoom],
  );

  const openSpot = useCallback(
    (x: number, y: number, move: boolean) => {
      if (!popupRef.current) {
        const active = document.activeElement as HTMLElement | null;
        popupReturn.current = active && active !== document.body ? active : null;
      }
      const next: PopupState = { kind: "spot", x, y, key: ++popupSeq.current };
      popupRef.current = next;
      setPopup(next);
      if (move) {
        const v = stageRef.current?.getView();
        stageRef.current?.flyTo(x, y, Math.max(Math.round(v?.zoom ?? settings.startZoom), settings.clusterBelowZoom), { region: true });
      }
    },
    [settings.startZoom, settings.clusterBelowZoom],
  );

  const closePopup = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    const focusInPopup = !!active?.closest?.('[data-testid~="popup"]');
    popupRef.current = null;
    setPopup(null);
    setCopied(false);
    const back = popupReturn.current;
    popupReturn.current = null;
    try {
      if (back && document.contains(back)) back.focus({ preventScroll: true });
      else if (focusInPopup) stageRef.current?.focusMap();
    } catch {
      /* ignore */
    }
  }, []);

  const openFromHash = useCallback(
    (hash: string, move: boolean) => {
      const t = parseMapHash(hash);
      if (!t) return;
      if (t.kind === "spot") openSpot(t.x, t.y, move);
      else if (markerById.has(t.id)) openMarker(t.id, move ? "move" : "initial");
    },
    [markerById, openMarker, openSpot],
  );

  // ---------------------------------------------------------------- first view (R-805, R-819, R-840)
  const initialView = useCallback(
    (size: Size): View => {
      const wide = !isNarrowMap(size.w);
      const saved = readMapFilter(safeRead(MAP_FILTER_KEY));
      const inset = wide && (oneCategory || saved?.sidebar !== "closed") ? SIDEBAR_PX : 0;
      if (oneCategory) {
        const box = polygonBox(art.island);
        const region = { w: size.w - inset, h: size.h };
        const zoom = fitZoom(box, region, settings.minZoom, settings.maxZoom);
        return centerInRegion((box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, zoom, size, inset);
      }
      const t = parseMapHash(currentHash());
      const minZoom = Math.max(settings.startZoom, settings.clusterBelowZoom);
      if (t?.kind === "spot") return centerInRegion(t.x, t.y, minZoom, size, inset);
      if (t?.kind === "marker") {
        const m = markerById.get(t.id);
        if (m) return centerInRegion(m.x, m.y, minZoom, size, inset);
      }
      const restored = restoreMapView(safeRead(MAP_VIEW_KEY), Date.now(), art.bounds);
      if (restored) return { cx: restored.center.x, cy: restored.center.y, zoom: restored.zoom };
      const start = markerById.get(settings.startMarkerId);
      return { cx: start?.x ?? 0, cy: start?.y ?? 0, zoom: settings.startZoom };
    },
    [art, markerById, oneCategory, settings],
  );

  // ---------------------------------------------------------------- mount: restore personal state
  useEffect(() => {
    setFound(new Set(readFoundIds(safeRead(GUEST_CHECKLISTS_KEY))));
    setFavRaw(safeRead(FAVORITES_KEY));
    const width = rootRef.current?.getBoundingClientRect().width ?? 1024;
    const isNarrow = isNarrowMap(width);
    narrowRef.current = isNarrow;
    setNarrow(isNarrow);
    let pref: "open" | "closed" | null = null;
    if (!oneCategory) {
      const saved = readMapFilter(safeRead(MAP_FILTER_KEY));
      if (saved) {
        const known = new Set(categoryOrder);
        const off = new Set(saved.hidden.filter((id) => known.has(id)));
        pref = saved.sidebar ?? null;
        const next: FilterState = {
          off,
          folded: saved.folded ? saved.folded.filter((id) => groupById.has(id)) : null,
          sidebarPref: pref,
          hideFound: saved.hideFound,
        };
        filterRef.current = next;
        setFilterState(next);
        const onCount = categoryOrder.length - off.size;
        const word = allButtonWord("Hide all", onCount, categoryOrder.length);
        allWordRef.current = word;
        setAllWord(word);
      }
    }
    setSidebarOpen(!isNarrow && pref !== "closed");
    setHydrated(true);
    try {
      setNotice(noticeVisible(Date.now(), settings.notice.start, settings.notice.end, safeRead(MAP_NOTICE_KEY)));
    } catch {
      setNotice(false);
    }
    openFromHash(currentHash(), false);
    const onHash = () => openFromHash(currentHash(), true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === GUEST_CHECKLISTS_KEY || e.key === null) setFound(new Set(readFoundIds(safeRead(GUEST_CHECKLISTS_KEY))));
      if (e.key === FAVORITES_KEY || e.key === null) setFavRaw(safeRead(FAVORITES_KEY));
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("storage", onStorage);
    };
    // mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // narrow / wide follows the map width (R-841)
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const isNarrow = isNarrowMap(el.getBoundingClientRect().width);
      if (isNarrow === narrowRef.current) return;
      narrowRef.current = isNarrow;
      setNarrow(isNarrow);
      setSidebarOpen(!isNarrow && filterRef.current.sidebarPref !== "closed");
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---------------------------------------------------------------- found, favourites, copy
  const toggleFound = useCallback(
    (id: string) => {
      const m = markerById.get(id);
      if (!m) return;
      const cat = catById.get(m.category);
      const raw = safeRead(GUEST_CHECKLISTS_KEY);
      const current = new Set(readFoundIds(raw));
      const on = !current.has(id);
      const ids = cat?.multiSpawn ? multiSpawnGroup(markers, id) : [id];
      const next = setMapFound(raw, ids, on);
      safeApply(GUEST_CHECKLISTS_KEY, next);
      setFound(new Set(readFoundIds(next)));
    },
    [markerById, catById, markers],
  );

  const toggleFav = useCallback((id: string) => {
    const next = toggleFavorite(safeRead(FAVORITES_KEY), FAVORITE_LISTS.map, id);
    safeApply(FAVORITES_KEY, next);
    setFavRaw(next);
    notifyFavoritesChanged();
  }, []);

  const copyLink = useCallback(async (id: string) => {
    const value = copyLinkValue(window.location.href, id);
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        window.prompt("Copy this link:", value);
      } catch {
        /* ignore */
      }
    }
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }, []);

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);

  // ---------------------------------------------------------------- sidebar open / close (R-841)
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    if (!narrowRef.current && !oneCategory) setFilter({ ...filterRef.current, sidebarPref: "closed" });
  }, [oneCategory, setFilter]);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
    if (!narrowRef.current && !oneCategory) setFilter({ ...filterRef.current, sidebarPref: "open" });
    if (narrowRef.current) setFocusSearch((n) => n + 1);
  }, [oneCategory, setFilter]);

  // ---------------------------------------------------------------- search (R-834..R-839)
  const search = useMemo(() => searchMarkers(query, markers, categories), [query, markers, categories]);
  const rows = useMemo(() => visibleCategoryRows(query, categories, groups), [query, categories, groups]);
  const messages = useMemo(() => mapSearchMessages(query, search.total, rows.rowsLeft), [query, search.total, rows.rowsLeft]);

  const searchRef = useRef(search);
  searchRef.current = search;
  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;
  const queryRef = useRef(query);
  queryRef.current = query;

  const openHit = useCallback(
    (index: number) => {
      const hit = searchRef.current.hits[index];
      if (!hit) return;
      openMarker(hit.marker.id, "move");
      setQuery("");
      setActiveIndex(-1);
      if (narrowRef.current) setSidebarOpen(false);
    },
    [openMarker],
  );

  // ---------------------------------------------------------------- dialogs and panels
  const rememberOpener = () => {
    const a = document.activeElement as HTMLElement | null;
    dialogOpener.current = a && a !== document.body ? a : null;
  };
  const returnFocus = () => {
    const el = dialogOpener.current;
    dialogOpener.current = null;
    if (el && document.contains(el)) window.setTimeout(() => el.focus({ preventScroll: true }), 0);
  };
  const closeReset = useCallback(() => {
    setResetOpen(false);
    returnFocus();
  }, []);
  const closeAbout = useCallback(() => {
    setAboutOpen(false);
    returnFocus();
  }, []);
  const closePanel = useCallback(() => {
    setPanel(null);
    returnFocus();
  }, []);

  const foundByCategory: FoundByCategory[] = useMemo(() => {
    const out: FoundByCategory[] = [];
    for (const c of categories) {
      if (!c.trackable) continue;
      const count = (markersByCat.get(c.id) ?? []).filter((m) => found.has(m.id)).length;
      if (count > 0) out.push({ id: c.id, name: c.name, count });
    }
    return out;
  }, [categories, markersByCat, found]);

  const doReset = useCallback(() => {
    const chosen = resetChoice ? [resetChoice] : foundByCategory.map((f) => f.id);
    const ids: string[] = [];
    for (const cid of chosen) for (const m of markersByCat.get(cid) ?? []) if (found.has(m.id)) ids.push(m.id);
    const next = setMapFound(safeRead(GUEST_CHECKLISTS_KEY), ids, false);
    safeApply(GUEST_CHECKLISTS_KEY, next);
    setFound(new Set(readFoundIds(next)));
    setResetDone(ids.length);
  }, [resetChoice, foundByCategory, markersByCat, found]);

  // ---------------------------------------------------------------- full screen (R-847)
  const nativeFs = useRef(false);
  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!fullscreenRef.current) {
      setFullscreen(true);
      try {
        if (el?.requestFullscreen) {
          await el.requestFullscreen();
          nativeFs.current = true;
        }
      } catch {
        nativeFs.current = false;
      }
    } else {
      setFullscreen(false);
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          /* ignore */
        }
      }
      nativeFs.current = false;
    }
  }, []);
  const fullscreenRef = useRef(fullscreen);
  fullscreenRef.current = fullscreen;
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement && nativeFs.current) {
        nativeFs.current = false;
        setFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ---------------------------------------------------------------- Escape priority (R-842)
  const lightboxOpen = useRef(false);
  lightboxOpen.current = lightbox !== null;
  const escState = useRef({ about: false, reset: false, panel: false, popup: false, narrowSidebar: false, fullscreen: false });
  escState.current = {
    about: aboutOpen,
    reset: resetOpen,
    panel: panel !== null,
    popup: popup !== null,
    narrowSidebar: narrow && sidebarOpen,
    fullscreen,
  };
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      // another dialog of the page (e.g. the accounts-later dialog) handles its own Escape
      const dlg = t?.closest?.("dialog");
      if (dlg && !rootRef.current?.contains(dlg)) return;
      if (document.querySelector('[data-testid~="login-modal"]')) return;
      if (lightboxOpen.current) return; // the lightbox closes itself first
      switch (escapeTarget(escState.current)) {
        case "about":
          closeAbout();
          break;
        case "reset":
          closeReset();
          break;
        case "panel":
          closePanel();
          break;
        case "popup":
          closePopup();
          break;
        case "narrowSidebar":
          setSidebarOpen(false);
          break;
        case "fullscreen":
          void toggleFullscreen();
          break;
        default:
          return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAbout, closeReset, closePanel, closePopup, toggleFullscreen]);

  // ---------------------------------------------------------------- sidebar api (stable)
  const api = useMemo<SidebarApi>(
    () => ({
      toggleCategory(id) {
        const off = new Set(filterRef.current.off);
        if (off.has(id)) off.delete(id);
        else off.add(id);
        commitOff(off);
      },
      setGroup(gid, on) {
        const off = new Set(filterRef.current.off);
        for (const c of categories) if (c.group === gid) (on ? off.delete(c.id) : off.add(c.id));
        commitOff(off);
      },
      fold(gid) {
        const folded = new Set(filterRef.current.folded ?? []);
        if (folded.has(gid)) folded.delete(gid);
        else folded.add(gid);
        setFilter({ ...filterRef.current, folded: groups.map((g) => g.id).filter((id) => folded.has(id)) });
      },
      only(id) {
        const off = filterRef.current.off;
        const onIds = categoryOrder.filter((c) => !off.has(c));
        if (onIds.length === 1 && onIds[0] === id) commitOff(new Set());
        else commitOff(new Set(categoryOrder.filter((c) => c !== id)), { only: id, afterOnly: true });
      },
      arrow(id) {
        commitOff(new Set(categoryOrder.filter((c) => c !== id)), { only: id, afterOnly: true });
        const v = stageRef.current?.getView();
        const target = nearestMarker(markersByCat.get(id) ?? [], { x: v?.cx ?? 0, y: v?.cy ?? 0 });
        if (target) {
          const zoom = Math.max(Math.round(v?.zoom ?? 0), MAP_ARROW_MIN_ZOOM);
          stageRef.current?.flyTo(target.x, target.y, zoom, { region: true });
        }
      },
      allButton() {
        if (allWordRef.current === "Hide all") commitOff(new Set(categoryOrder));
        else commitOff(new Set());
      },
      hideFound() {
        setFilter({ ...filterRef.current, hideFound: !filterRef.current.hideFound });
      },
      query(text) {
        setQuery(text.slice(0, 128));
        setActiveIndex(-1);
      },
      searchKey(e: KeyboardEvent<HTMLInputElement>) {
        const hits = searchRef.current.hits;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          if (!hits.length) return;
          e.preventDefault();
          setActiveIndex(wrapIndex(activeRef.current, e.key === "ArrowDown" ? 1 : -1, hits.length));
        } else if (e.key === "Enter") {
          const i = enterTargetIndex(activeRef.current, hits.length);
          if (i >= 0) {
            e.preventDefault();
            openHit(i);
          }
        } else if (e.key === "Escape") {
          if (queryRef.current) {
            e.preventDefault();
            setQuery("");
            setActiveIndex(-1);
          } else {
            e.currentTarget.blur();
          }
        }
      },
      openHit,
      clearSearch() {
        setQuery("");
        setActiveIndex(-1);
      },
      rail(id) {
        setRailCurrent(id);
      },
      reset() {
        rememberOpener();
        setResetChoice("");
        setResetDone(null);
        setResetOpen(true);
      },
      action(kind) {
        rememberOpener();
        setPanel(kind);
      },
      about() {
        rememberOpener();
        setAboutOpen(true);
      },
      close: closeSidebar,
    }),
    [categories, categoryOrder, commitOff, groups, markersByCat, openHit, setFilter, closeSidebar],
  );

  // ---------------------------------------------------------------- sidebar view model
  const sidebarGroups: SidebarGroup[] = useMemo(() => {
    const folded = new Set(filter.folded ?? []);
    const onIds = categoryOrder.filter((id) => !filter.off.has(id));
    return groupCats.map(({ group, cats }) => {
      const onInGroup = cats.filter((c) => !filter.off.has(c.id)).length;
      const box = groupBoxState(onInGroup, cats.length);
      const isFolded = folded.has(group.id);
      return {
        id: group.id,
        name: group.name,
        color: group.color,
        checked: box.checked,
        mixed: box.mixed,
        folded: isFolded,
        foldLabel: foldButton(group.name, !isFolded).label,
        shown: rows.groupIds.has(group.id),
        railState: railState(onInGroup, railCurrent === group.id),
        rows: cats.map((c) => {
          const on = !filter.off.has(c.id);
          const isOnly = onIds.length === 1 && onIds[0] === c.id;
          const ob = onlyButton(c.name, isOnly);
          return {
            id: c.id,
            name: c.name,
            href: featureHref(c),
            color: group.color,
            trackable: c.trackable,
            on,
            visible: rows.categoryIds.has(c.id),
            counter: categoryCounter(markersByCat.get(c.id) ?? [], found, c.id, c.trackable, c.multiSpawn, on),
            onlyText: ob.text,
            onlyLabel: ob.label,
            arrowLabel: arrowButtonLabel(c.name),
          };
        }),
      };
    });
  }, [filter, categoryOrder, groupCats, rows, railCurrent, markersByCat, found]);

  const sidebarHits = useMemo(
    () => search.hits.map((h) => ({ id: h.marker.id, name: h.marker.name, line: h.line })),
    [search.hits],
  );

  // ---------------------------------------------------------------- stage view model
  const popupMarker = popup?.kind === "marker" ? markerById.get(popup.id) ?? null : null;
  const drawIds = useMemo(() => {
    const out: string[] = [];
    for (const m of markers) {
      if (filter.off.has(m.category)) continue;
      if (filter.hideFound && found.has(m.id) && m.id !== popupMarker?.id) continue;
      out.push(m.id);
    }
    if (popupMarker && filter.off.has(popupMarker.category)) out.push(popupMarker.id);
    return out;
  }, [markers, filter.off, filter.hideFound, found, popupMarker]);

  const featureNumbers = useMemo(
    () => (featureCategoryId ? orders.get(featureCategoryId)?.numbers ?? null : null),
    [featureCategoryId, orders],
  );

  let popupNode: React.ReactNode = null;
  let popupAnchor: { x: number; y: number; key: string } | null = null;
  if (popup?.kind === "marker" && popupMarker) {
    const cat = catById.get(popupMarker.category)!;
    const ord = orders.get(cat.id)!;
    const n = ord.numbers.get(popupMarker.id) ?? 0;
    const prev = stepMarker(ord.order, popupMarker.id, -1) ?? popupMarker;
    const next = stepMarker(ord.order, popupMarker.id, 1) ?? popupMarker;
    const labels = navLabels(
      cat.name,
      { name: prev.name, number: ord.numbers.get(prev.id) ?? 0 },
      { name: next.name, number: ord.numbers.get(next.id) ?? 0 },
    );
    const fav = isFavorite(favRaw, FAVORITE_LISTS.map, popupMarker.id);
    popupAnchor = { x: popupMarker.x, y: popupMarker.y, key: String(popup.key) };
    popupNode = (
      <MarkerPopup
        marker={popupMarker}
        category={cat}
        color={colorOf(cat.id)}
        featureHref={featureHref(cat)}
        number={n}
        total={ord.total}
        numberTitle={numberTooltip(n, cat.trackable)}
        numberText={navNumberText(n, ord.total)}
        found={found.has(popupMarker.id)}
        favorite={fav}
        favLabel={starButton(fav).label}
        copied={copied}
        prevLabel={labels.prev}
        nextLabel={labels.next}
        onToggleFound={() => toggleFound(popupMarker.id)}
        onToggleFavorite={() => toggleFav(popupMarker.id)}
        onZoom={() => stageRef.current?.flyTo(popupMarker.x, popupMarker.y, settings.closeZoom, { region: true })}
        onCopy={() => void copyLink(popupMarker.id)}
        onPrev={() => openMarker(prev.id, "move")}
        onNext={() => openMarker(next.id, "move")}
        onClose={closePopup}
        onImage={() => setLightbox(popupMarker.id)}
      />
    );
  } else if (popup?.kind === "spot") {
    popupAnchor = { x: popup.x, y: popup.y, key: String(popup.key) };
    popupNode = (
      <SpotPopup
        onClose={closePopup}
        onSuggest={() => {
          rememberOpener();
          setPanel("suggest");
        }}
      />
    );
  }

  const lightboxMarker = lightbox ? markerById.get(lightbox) : undefined;
  const lightboxImages = useMemo(
    () =>
      lightboxMarker?.image
        ? [
            {
              id: lightboxMarker.id,
              alt: `${lightboxMarker.name} screenshot`,
              caption: lightboxMarker.name,
              width: lightboxMarker.image.width,
              height: lightboxMarker.image.height,
              art: { kind: "marker" as const, id: lightboxMarker.image.id },
            },
          ]
        : [],
    [lightboxMarker],
  );

  const stateWords = [
    sidebarOpen ? "sidebar-open" : "sidebar-closed",
    narrow ? "narrow" : "wide",
    featureCategoryId ? `category:${featureCategoryId}` : null,
    fullscreen ? "fullscreen" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const insetLeft = !narrow && sidebarOpen ? SIDEBAR_PX : 0;
  const hideFoundBtn = foundButton(filter.hideFound);
  const fsLabel = fullscreenLabel(fullscreen);

  return (
    <div
      ref={rootRef}
      data-testid="map-root"
      data-state={stateWords}
      className={
        fullscreen
          ? "fixed inset-0 z-[90] h-[100dvh] w-screen overflow-hidden bg-[#d4ebe8]"
          : "@container relative h-[calc(100svh-150px)] max-h-[860px] min-h-[480px] w-full overflow-hidden rounded-2xl border border-sand-dark bg-[#d4ebe8]"
      }
    >
      <MapSidebar
          heading={heading}
          headingId="la-map-heading"
          closed={!sidebarOpen}
          narrow={narrow}
          groups={sidebarGroups}
          allWord={allWord}
          hideFoundText={hideFoundBtn.text}
          hideFoundTitle={hideFoundBtn.title}
          query={query}
          hits={sidebarHits}
          activeIndex={activeIndex}
          markerMessage={messages.marker}
          categoryMessage={messages.category}
          railCurrent={railCurrent}
          focusSearchToken={focusSearch}
          hydrated={hydrated}
          api={api}
        />
      <MapStage
        ref={stageRef}
        art={art}
        settings={settings}
        markers={markers}
        drawIds={drawIds}
        colorOf={colorOf}
        found={found}
        numbers={featureNumbers}
        cluster={!oneCategory}
        selectedId={popupMarker?.id ?? null}
        spot={popup?.kind === "spot" ? { x: popup.x, y: popup.y } : null}
        popupAnchor={popupAnchor}
        popup={popupNode}
        insetLeft={insetLeft}
        initialView={initialView}
        persistView={!oneCategory}
        onMarkerClick={(id) => openMarker(id, "click")}
        onEmptyClick={() => {
          if (popupRef.current) {
            popupRef.current = null;
            setPopup(null);
            popupReturn.current = null;
          }
        }}
      >
        <button
          type="button"
          data-testid="sidebar-open"
          title="Search and filter"
          aria-expanded={sidebarOpen}
          aria-controls="la-map-sidebar"
          className={`${sidebarOpen ? "hidden" : "inline-flex"} ${hydrated ? "" : "@max-[700px]:inline-flex"} absolute left-3 top-3 z-10 h-10 items-center gap-2 rounded-full bg-teal px-4 font-display text-sm font-bold uppercase tracking-wide text-white shadow-md hover:bg-[#0b3e40]`}
          onClick={openSidebar}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          Filters
        </button>
        <button
          type="button"
          data-testid="fullscreen"
          aria-label={fsLabel}
          title={fsLabel}
          className="absolute right-3 top-[104px] z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-sand-dark bg-white text-teal shadow-md hover:bg-sand"
          onClick={() => void toggleFullscreen()}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            {fullscreen ? (
              <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>
        {notice ? (
          <div
            data-testid="contest-box"
            role="note"
            className={`absolute bottom-3 z-10 rounded-2xl border border-sand-dark bg-white/95 p-3 text-ink shadow-md ${
              narrow ? "left-3 right-3" : "right-3 w-[300px]"
            }`}
          >
            <p className="font-display text-sm font-bold uppercase tracking-wide">{settings.notice.heading}</p>
            <p className="mt-1 text-xs text-muted">{settings.notice.text}</p>
            <button
              type="button"
              data-testid="contest-close"
              className="mt-2 h-8 rounded-full border border-teal px-3 text-xs font-semibold text-teal hover:bg-sand"
              onClick={() => {
                safeWrite(MAP_NOTICE_KEY, noticeClosedValue(settings.notice.start, settings.notice.end));
                setNotice(false);
              }}
            >
              Close
            </button>
          </div>
        ) : null}
        {panel ? (
          <SidePanel
            kind={panel}
            title={MAP_PANEL_TITLES[panel]}
            onClose={closePanel}
            onLogin={() => {
              setPanel(null);
              accounts.open("map");
            }}
          />
        ) : null}
      </MapStage>
      {resetOpen ? (
        <ResetDialog
          total={foundByCategory.reduce((s, f) => s + f.count, 0) + (resetDone ?? 0)}
          options={resetOptions(foundByCategory)}
          choice={resetChoice}
          text={resetDone !== null ? resetDoneText(resetDone) : resetDialogText(foundByCategory, resetChoice)}
          done={resetDone !== null}
          onChoice={setResetChoice}
          onReset={doReset}
          onClose={closeReset}
        />
      ) : null}
      {aboutOpen ? <AboutDialog onClose={closeAbout} /> : null}
      <Lightbox
        images={lightboxImages}
        openIndex={lightboxImages.length ? 0 : null}
        label={lightboxMarker?.name ?? "Screenshot"}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
