"use client";

/**
 * The pannable, zoomable map area (R-801, R-803..R-805, R-840): own SVG artwork, one canvas with every marker,
 * region labels, clusters below zoom 2, zoom buttons, the open popup anchored to its marker, and the view memory.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MAP_CLUSTER_RADIUS_PX, MAP_HIT_RADIUS_PX, MAP_VIEW_KEY, mapViewRecord, safeWrite } from "@/lib";
import { MapArt } from "./MapArt";
import {
  centerInRegion,
  clampCenter,
  clampZoom,
  clusterPoints,
  hitTest,
  scaleAt,
  toScreen,
  viewBoxFor,
  zoomAround,
  type Cluster,
  type ScreenPoint,
  type Size,
  type View,
} from "./geometry";
import type { MapArtData, MapMarkerData, MapSettings } from "./types";

export interface MapStageHandle {
  /** Moves to (x, y); `region` centres in the part of the map not covered by an open sidebar. */
  flyTo(x: number, y: number, zoom?: number, opts?: { region?: boolean; instant?: boolean }): void;
  zoomBy(delta: number): void;
  getView(): View | null;
  getSize(): Size;
  setView(view: View): void;
}

export interface MapStageProps {
  art: MapArtData;
  settings: MapSettings;
  markers: MapMarkerData[];
  /** Ids of the markers to draw, in draw order. */
  drawIds: string[];
  colorOf: (categoryId: string) => string;
  found: ReadonlySet<string>;
  /** Draw numbers inside the markers (one-category page). */
  numbers: Map<string, number> | null;
  cluster: boolean;
  selectedId: string | null;
  spot: { x: number; y: number } | null;
  /** Map point the popup is attached to. */
  popupAnchor: { x: number; y: number; key: string } | null;
  popup: ReactNode;
  /** Px covered by the open sidebar on the left (wide layout). */
  insetLeft: number;
  /** Decides the first view once the map area size is known. */
  initialView: (size: Size) => View;
  /** Saves `gtab-map-view` after a visitor touch (false on one-category pages). */
  persistView: boolean;
  onMarkerClick: (id: string) => void;
  /** A click on the map where no marker is. */
  onEmptyClick?: () => void;
  onReady?: () => void;
  children?: ReactNode;
  labelledBy?: string;
}

const MARKER_R = 7;
const NUMBER_R = 11;

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export const MapStage = forwardRef<MapStageHandle, MapStageProps>(function MapStage(props, ref) {
  const {
    art,
    settings,
    markers,
    drawIds,
    colorOf,
    found,
    numbers,
    cluster,
    selectedId,
    spot,
    popupAnchor,
    popup,
    insetLeft,
    initialView,
    persistView,
    onMarkerClick,
    onEmptyClick,
    onReady,
    children,
  } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [view, setViewState] = useState<View | null>(null);
  const viewRef = useRef<View | null>(null);
  const sizeRef = useRef<Size>({ w: 0, h: 0 });
  const touched = useRef(false);
  const anim = useRef<number | null>(null);
  const pointsRef = useRef<ScreenPoint[]>([]);
  const clustersRef = useRef<Cluster[]>([]);
  const persistRef = useRef(persistView);
  persistRef.current = persistView;
  const initialViewRef = useRef(initialView);
  initialViewRef.current = initialView;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const insetLeftRef = useRef(insetLeft);
  insetLeftRef.current = insetLeft;

  const byId = useMemo(() => new Map(markers.map((m) => [m.id, m])), [markers]);

  const bounds = art.bounds;

  const applyView = useCallback(
    (v: View) => {
      const z = clampZoom(v.zoom, settings.minZoom, settings.maxZoom);
      const c = clampCenter(v.cx, v.cy, bounds);
      const next = { cx: c.cx, cy: c.cy, zoom: z };
      viewRef.current = next;
      setViewState(next);
    },
    [bounds, settings.minZoom, settings.maxZoom],
  );

  const moveEnd = useCallback(() => {
    const v = viewRef.current;
    if (!v || !touched.current || !persistRef.current) return;
    safeWrite(MAP_VIEW_KEY, mapViewRecord({ x: v.cx, y: v.cy }, Math.round(v.zoom * 1000) / 1000, Date.now()));
  }, []);

  const stopAnim = useCallback(() => {
    if (anim.current !== null) {
      cancelAnimationFrame(anim.current);
      anim.current = null;
    }
  }, []);

  const animateTo = useCallback(
    (target: View, instant = false) => {
      stopAnim();
      const from = viewRef.current;
      const z = clampZoom(target.zoom, settings.minZoom, settings.maxZoom);
      const c = clampCenter(target.cx, target.cy, bounds);
      const to = { cx: c.cx, cy: c.cy, zoom: z };
      if (!from || instant || prefersReducedMotion()) {
        applyView(to);
        moveEnd();
        return;
      }
      const start = performance.now();
      const dur = 280;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        applyView({
          cx: from.cx + (to.cx - from.cx) * e,
          cy: from.cy + (to.cy - from.cy) * e,
          zoom: from.zoom + (to.zoom - from.zoom) * e,
        });
        if (t < 1) anim.current = requestAnimationFrame(step);
        else {
          anim.current = null;
          applyView(to);
          moveEnd();
        }
      };
      anim.current = requestAnimationFrame(step);
    },
    [applyView, bounds, moveEnd, settings.maxZoom, settings.minZoom, stopAnim],
  );

  useImperativeHandle(
    ref,
    () => ({
      flyTo(x, y, zoom, opts) {
        const v = viewRef.current;
        const z = clampZoom(zoom ?? v?.zoom ?? settings.startZoom, settings.minZoom, settings.maxZoom);
        const target = opts?.region ? centerInRegion(x, y, z, sizeRef.current, insetLeftRef.current) : { cx: x, cy: y, zoom: z };
        animateTo(target, opts?.instant);
      },
      zoomBy(delta) {
        const v = viewRef.current;
        if (!v) return;
        animateTo({ ...v, zoom: Math.round(v.zoom) + delta });
      },
      getView: () => viewRef.current,
      getSize: () => sizeRef.current,
      setView: (v) => applyView(v),
    }),
    [animateTo, applyView, settings.maxZoom, settings.minZoom, settings.startZoom],
  );

  // size tracking + first view
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const s = { w: Math.round(r.width), h: Math.round(r.height) };
      if (s.w === sizeRef.current.w && s.h === sizeRef.current.h) return;
      sizeRef.current = s;
      setSize(s);
      if (!viewRef.current && s.w > 0 && s.h > 0) {
        applyView(initialViewRef.current(s));
        onReadyRef.current?.();
      }
    };
    measure();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [applyView]);

  useEffect(() => () => stopAnim(), [stopAnim]);

  // ---------------------------------------------------------------- drawing

  const projected = useMemo(() => {
    if (!view || size.w === 0) return { points: [] as ScreenPoint[], clusters: [] as Cluster[], singles: [] as ScreenPoint[] };
    const margin = 30;
    const pts: ScreenPoint[] = [];
    for (const id of drawIds) {
      const m = byId.get(id);
      if (!m) continue;
      const { sx, sy } = toScreen(m.x, m.y, view, size);
      if (sx < -margin || sy < -margin || sx > size.w + margin || sy > size.h + margin) continue;
      pts.push({ id, sx, sy });
    }
    if (!cluster || view.zoom >= settings.clusterBelowZoom) return { points: pts, clusters: [], singles: pts };
    const cl = clusterPoints(pts, MAP_CLUSTER_RADIUS_PX);
    const singles: ScreenPoint[] = [];
    const multi: Cluster[] = [];
    for (const c of cl) {
      if (c.ids.length === 1) singles.push({ id: c.ids[0], sx: c.sx, sy: c.sy });
      else multi.push(c);
    }
    return { points: pts, clusters: multi, singles };
  }, [view, size, drawIds, byId, cluster, settings.clusterBelowZoom]);

  useEffect(() => {
    pointsRef.current = projected.singles;
    clustersRef.current = projected.clusters;
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0) return;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const W = Math.round(size.w * dpr);
    const H = Math.round(size.h * dpr);
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    const r = numbers ? NUMBER_R : MARKER_R;
    for (const p of projected.singles) {
      const m = byId.get(p.id);
      if (!m) continue;
      const isFound = found.has(p.id);
      const isSel = p.id === selectedId;
      ctx.globalAlpha = isFound && !isSel ? 0.4 : 1;
      if (isSel) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,106,77,0.35)";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
      ctx.fillStyle = colorOf(m.category);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      if (numbers) {
        const n = numbers.get(p.id);
        if (n !== undefined) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "600 11px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(n), p.sx, p.sy + 0.5);
        }
      } else {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
      if (isFound) {
        // small check tick for found markers
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#ff6a4d";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.sx + r - 3, p.sy - r + 1);
        ctx.lineTo(p.sx + r, p.sy - r + 4);
        ctx.lineTo(p.sx + r + 5, p.sy - r - 3);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (spot && view) {
      const { sx, sy } = toScreen(spot.x, spot.y, view, size);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx - 10, sy - 14, sx - 9, sy - 26, sx, sy - 26);
      ctx.bezierCurveTo(sx + 9, sy - 26, sx + 10, sy - 14, sx, sy);
      ctx.fillStyle = "#ff6a4d";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy - 17, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
  }, [projected, size, byId, found, selectedId, numbers, colorOf, spot, view]);

  // ---------------------------------------------------------------- pointer interaction

  const drag = useRef<{ id: number; x: number; y: number; start: View; moved: boolean } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number; mx: number; my: number } | null>(null);
  const lastWheel = useRef(0);

  const local = (e: { clientX: number; clientY: number }) => {
    const r = rootRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const markTouched = useCallback(() => {
    touched.current = true;
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const v = viewRef.current;
    if (!v) return;
    stopAnim();
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: v.zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      drag.current = null;
      return;
    }
    drag.current = { id: e.pointerId, x: p.x, y: p.y, start: v, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const v = viewRef.current;
    if (!v) return;
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.dist > 0) {
        const z = clampZoom(pinch.current.zoom + Math.log2(d / pinch.current.dist), settings.minZoom, settings.maxZoom);
        applyView(zoomAround(v, sizeRef.current, pinch.current.mx, pinch.current.my, z));
      }
      return;
    }
    const dr = drag.current;
    if (!dr || dr.id !== e.pointerId) return;
    const dx = p.x - dr.x;
    const dy = p.y - dr.y;
    if (!dr.moved && Math.hypot(dx, dy) < 4) return;
    dr.moved = true;
    const s = scaleAt(dr.start.zoom);
    applyView({ cx: dr.start.cx - dx / s, cy: dr.start.cy + dy / s, zoom: dr.start.zoom });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const had = pointers.current.delete(e.pointerId);
    if (!had) return;
    if (pinch.current) {
      if (pointers.current.size < 2) {
        pinch.current = null;
        const v = viewRef.current;
        if (v) animateTo({ ...v, zoom: Math.round(v.zoom) });
      }
      drag.current = null;
      return;
    }
    const dr = drag.current;
    drag.current = null;
    if (!dr || dr.id !== e.pointerId) return;
    if (dr.moved) {
      moveEnd();
      return;
    }
    // a click: clusters first, then the marker under the pointer (R-803, R-804)
    const p = local(e);
    const cl = clustersRef.current.find((c) => Math.hypot(c.sx - p.x, c.sy - p.y) <= 18);
    if (cl) {
      zoomIntoCluster(cl);
      return;
    }
    const id = hitTest(pointsRef.current, p.x, p.y, MAP_HIT_RADIUS_PX);
    if (id) onMarkerClick(id);
    else onEmptyClick?.();
  };

  const zoomIntoCluster = (c: Cluster) => {
    const v = viewRef.current;
    if (!v) return;
    touched.current = true;
    // centre on the cluster and zoom in until it can split (R-804)
    const s = scaleAt(v.zoom);
    const zoom = Math.max(Math.round(v.zoom) + 2, settings.clusterBelowZoom);
    animateTo({ cx: v.cx + (c.sx - sizeRef.current.w / 2) / s, cy: v.cy - (c.sy - sizeRef.current.h / 2) / s, zoom });
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const v = viewRef.current;
    if (!v) return;
    const now = Date.now();
    if (now - lastWheel.current < 180 || e.deltaY === 0) return;
    lastWheel.current = now;
    const p = local(e);
    const z = clampZoom(Math.round(v.zoom) + (e.deltaY < 0 ? 1 : -1), settings.minZoom, settings.maxZoom);
    if (z === v.zoom) return;
    stopAnim();
    applyView(zoomAround(v, sizeRef.current, p.x, p.y, z));
    moveEnd();
  };

  // wheel must not scroll the page while over the map
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => {
      if ((e.target as HTMLElement | null)?.closest("[data-map-scroll]")) return;
      e.preventDefault();
    };
    el.addEventListener("wheel", prevent, { passive: false });
    return () => el.removeEventListener("wheel", prevent);
  }, []);

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = viewRef.current;
    if (!v) return;
    const p = local(e);
    const z = clampZoom(Math.round(v.zoom) + 1, settings.minZoom, settings.maxZoom);
    animateTo(zoomAround(v, sizeRef.current, p.x, p.y, z));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const v = viewRef.current;
    if (!v) return;
    const s = scaleAt(v.zoom);
    const step = 120 / s;
    let next: View | null = null;
    switch (e.key) {
      case "ArrowLeft":
        next = { ...v, cx: v.cx - step };
        break;
      case "ArrowRight":
        next = { ...v, cx: v.cx + step };
        break;
      case "ArrowUp":
        next = { ...v, cy: v.cy + step };
        break;
      case "ArrowDown":
        next = { ...v, cy: v.cy - step };
        break;
      case "+":
      case "=":
        next = { ...v, zoom: Math.round(v.zoom) + 1 };
        break;
      case "-":
      case "_":
        next = { ...v, zoom: Math.round(v.zoom) - 1 };
        break;
    }
    if (next) {
      e.preventDefault();
      animateTo(next);
    }
  };

  // ---------------------------------------------------------------- popup placement (auto-pan into view)

  const anchorScreen = view && popupAnchor ? toScreen(popupAnchor.x, popupAnchor.y, view, size) : null;
  const popupKey = popupAnchor?.key ?? null;

  useLayoutEffect(() => {
    if (!popupKey) return;
    const id = requestAnimationFrame(() => {
      const el = popupRef.current;
      const root = rootRef.current;
      const v = viewRef.current;
      if (!el || !root || !v) return;
      const pr = el.getBoundingClientRect();
      const rr = root.getBoundingClientRect();
      const left = rr.left + insetLeftRef.current + 12;
      const right = rr.right - 60;
      const top = rr.top + 12;
      const bottom = rr.bottom - 12;
      let dx = 0;
      let dy = 0;
      if (pr.left < left) dx = pr.left - left;
      else if (pr.right > right) dx = Math.min(pr.right - right, pr.left - left);
      if (pr.top < top) dy = pr.top - top;
      else if (pr.bottom > bottom) dy = Math.min(pr.bottom - bottom, pr.top - top);
      if (dx === 0 && dy === 0) return;
      const s = scaleAt(v.zoom);
      animateTo({ cx: v.cx + dx / s, cy: v.cy - dy / s, zoom: v.zoom });
    });
    return () => cancelAnimationFrame(id);
    // run once per opened popup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popupKey]);

  const viewBox = view && size.w ? viewBoxFor(view, size) : `${bounds.minX} ${-bounds.maxY} ${bounds.maxX - bounds.minX} ${bounds.maxY - bounds.minY}`;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden bg-[#d4ebe8]"
      onPointerDownCapture={markTouched}
      onWheelCapture={markTouched}
      onKeyDownCapture={markTouched}
      onTouchStartCapture={markTouched}
    >
      <MapArt art={art} viewBox={viewBox} />
      <div
        className="absolute inset-0 touch-none outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-lagoon"
        style={{ cursor: "grab" }}
        tabIndex={0}
        role="application"
        aria-roledescription="map"
        aria-label="Map of the island. Use the arrow keys to move and plus or minus to zoom; reach markers through the search box."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
      >
        <canvas ref={canvasRef} data-testid="canvas" className="absolute inset-0 h-full w-full" aria-hidden="true" />
      </div>
      {view && size.w
        ? art.regions.map((r) => {
            const { sx, sy } = toScreen(r.labelX, r.labelY, view, size);
            return (
              <div
                key={r.id}
                data-testid="county-labels"
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-teal/70"
                style={{ left: sx, top: sy }}
              >
                {r.name}
              </div>
            );
          })
        : null}
      {projected.clusters.map((c) => (
        <button
          key={c.ids[0]}
          type="button"
          data-testid="clusters"
          aria-label={`Zoom in on ${c.ids.length} markers`}
          className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-teal/90 font-display text-xs font-bold text-white shadow-md hover:bg-teal"
          style={{ left: c.sx, top: c.sy }}
          onClick={() => zoomIntoCluster(c)}
        >
          {c.ids.length}
        </button>
      ))}
      {anchorScreen && popup ? (
        <div
          ref={popupRef}
          className="absolute z-20"
          style={{ left: anchorScreen.sx, top: anchorScreen.sy, transform: "translate(-50%, calc(-100% - 16px))" }}
        >
          {popup}
        </div>
      ) : null}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-sand-dark bg-white shadow-md">
          <button
            type="button"
            data-testid="map-zoom-in"
            aria-label="Zoom in"
            title="Zoom in"
            className="flex h-10 w-10 items-center justify-center text-xl font-bold text-teal hover:bg-sand"
            onClick={() => {
              const v = viewRef.current;
              if (v) animateTo({ ...v, zoom: Math.round(v.zoom) + 1 });
            }}
          >
            <span aria-hidden="true">+</span>
          </button>
          <button
            type="button"
            data-testid="map-zoom-out"
            aria-label="Zoom out"
            title="Zoom out"
            className="flex h-10 w-10 items-center justify-center border-t border-sand-dark text-xl font-bold text-teal hover:bg-sand"
            onClick={() => {
              const v = viewRef.current;
              if (v) animateTo({ ...v, zoom: Math.round(v.zoom) - 1 });
            }}
          >
            <span aria-hidden="true">−</span>
          </button>
        </div>
      </div>
      {children}
    </div>
  );
});
