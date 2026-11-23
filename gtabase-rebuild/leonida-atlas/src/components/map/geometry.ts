/**
 * Own map projection (R-805, R-803, R-804): map units (x east, y north) → screen pixels of the map area.
 * At zoom z one map unit is 2^z / 32 px, so zoom 0 shows the whole 12 000-unit island in ~375 px and zoom 8
 * gives 8 px per unit. Pure helpers, no DOM.
 */

export interface View {
  /** Centre of the map area in map units. */
  cx: number;
  cy: number;
  zoom: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const UNIT_PX_AT_ZOOM_0 = 1 / 32;

export function scaleAt(zoom: number): number {
  return Math.pow(2, zoom) * UNIT_PX_AT_ZOOM_0;
}

export function toScreen(x: number, y: number, view: View, size: Size): { sx: number; sy: number } {
  const s = scaleAt(view.zoom);
  return { sx: size.w / 2 + (x - view.cx) * s, sy: size.h / 2 - (y - view.cy) * s };
}

export function toMap(sx: number, sy: number, view: View, size: Size): { x: number; y: number } {
  const s = scaleAt(view.zoom);
  return { x: view.cx + (sx - size.w / 2) / s, y: view.cy - (sy - size.h / 2) / s };
}

export function clampCenter(cx: number, cy: number, b: Bounds): { cx: number; cy: number } {
  return { cx: Math.min(b.maxX, Math.max(b.minX, cx)), cy: Math.min(b.maxY, Math.max(b.minY, cy)) };
}

export function clampZoom(z: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, z));
}

/** Zoom keeping the map point under (sx, sy) fixed on screen. */
export function zoomAround(view: View, size: Size, sx: number, sy: number, zoom: number): View {
  const p = toMap(sx, sy, view, size);
  const s = scaleAt(zoom);
  return { zoom, cx: p.x - (sx - size.w / 2) / s, cy: p.y + (sy - size.h / 2) / s };
}

/**
 * The view that puts map point (x, y) at the centre of the visible region (the map area minus an open
 * sidebar of `insetLeft` px on the left).
 */
export function centerInRegion(x: number, y: number, zoom: number, size: Size, insetLeft: number): View {
  const s = scaleAt(zoom);
  // visible region centre is at sx = insetLeft + (w - insetLeft) / 2; the map centre is at w / 2
  const dx = insetLeft / 2; // px the region centre lies right of the area centre
  return { zoom, cx: x - dx / s, cy: y };
}

/** SVG viewBox (map units, y flipped) of the visible map window. */
export function viewBoxFor(view: View, size: Size): string {
  const s = scaleAt(view.zoom);
  const w = size.w / s;
  const h = size.h / s;
  const x0 = view.cx - w / 2;
  const top = -(view.cy + h / 2);
  return `${x0} ${top} ${w} ${h}`;
}

/** Largest whole zoom at which the box fits into the region. */
export function fitZoom(box: Bounds, region: Size, min: number, max: number, padding = 24): number {
  const bw = box.maxX - box.minX;
  const bh = box.maxY - box.minY;
  const availW = Math.max(40, region.w - padding * 2);
  const availH = Math.max(40, region.h - padding * 2);
  const z = Math.log2(Math.min(availW / (bw * UNIT_PX_AT_ZOOM_0), availH / (bh * UNIT_PX_AT_ZOOM_0)));
  return clampZoom(Math.floor(z), min, max);
}

export function polygonBox(points: readonly [number, number][]): Bounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

export interface ScreenPoint {
  id: string;
  sx: number;
  sy: number;
}

export interface Cluster {
  sx: number;
  sy: number;
  ids: string[];
}

/** Greedy screen-space clustering (R-804, radius 40 px): each point joins the first cluster within reach. */
export function clusterPoints(points: readonly ScreenPoint[], radius: number): Cluster[] {
  const clusters: Cluster[] = [];
  const r2 = radius * radius;
  for (const p of points) {
    let joined = false;
    for (const c of clusters) {
      const dx = c.sx - p.sx;
      const dy = c.sy - p.sy;
      if (dx * dx + dy * dy <= r2) {
        c.ids.push(p.id);
        joined = true;
        break;
      }
    }
    if (!joined) clusters.push({ sx: p.sx, sy: p.sy, ids: [p.id] });
  }
  // move each cluster to the mean of its members
  const byId = new Map(points.map((p) => [p.id, p]));
  for (const c of clusters) {
    if (c.ids.length < 2) continue;
    let sx = 0;
    let sy = 0;
    for (const id of c.ids) {
      const p = byId.get(id)!;
      sx += p.sx;
      sy += p.sy;
    }
    c.sx = sx / c.ids.length;
    c.sy = sy / c.ids.length;
  }
  return clusters;
}

/** Topmost (last drawn) point within `radius` px of (sx, sy), nearest first. */
export function hitTest(points: readonly ScreenPoint[], sx: number, sy: number, radius: number): string | null {
  let best: string | null = null;
  let bestD = radius * radius;
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    const dx = p.sx - sx;
    const dy = p.sy - sy;
    const d = dx * dx + dy * dy;
    if (d <= bestD) {
      if (best === null || d < bestD) {
        best = p.id;
        bestD = d;
      }
    }
  }
  return best;
}
