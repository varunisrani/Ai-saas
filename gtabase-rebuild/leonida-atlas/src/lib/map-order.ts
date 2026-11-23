/**
 * map-order — collecting order, numbers and popup navigation of a category (R-817, R-825).
 */
import { markerNameKey, type MapMarkerInput } from "./map-store";

/** R-825: window north of the southernmost remaining marker. */
export const COLLECTING_WINDOW = 2000;

type Point = Pick<MapMarkerInput, "id" | "x" | "y">;

function byIdAsc(a: Point, b: Point): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * R-825 collecting order (one category): start with the southernmost marker; then repeatedly take, among the
 * remaining markers at most 2000 map units north of the southernmost remaining one, the one nearest to the
 * previously taken marker (ties: smaller id).
 */
export function collectingOrder<T extends Point>(markers: readonly T[]): T[] {
  const remaining = markers.slice();
  const order: T[] = [];
  if (!remaining.length) return order;
  const southernmost = (list: readonly T[]) =>
    list.reduce((best, m) => (m.y < best.y || (m.y === best.y && byIdAsc(m, best) < 0) ? m : best));
  let prev = southernmost(remaining);
  order.push(prev);
  remaining.splice(remaining.indexOf(prev), 1);
  while (remaining.length) {
    const south = southernmost(remaining);
    const limit = south.y + COLLECTING_WINDOW;
    let best: T | null = null;
    let bestD = Infinity;
    for (const m of remaining) {
      if (m.y > limit) continue;
      const d = dist2(m, prev);
      if (d < bestD || (d === bestD && best !== null && byIdAsc(m, best) < 0)) {
        best = m;
        bestD = d;
      }
    }
    const next = best ?? south;
    order.push(next);
    remaining.splice(remaining.indexOf(next), 1);
    prev = next;
  }
  return order;
}

export interface MarkerNumbers {
  /** Marker id → number (1-based). */
  numbers: Map<string, number>;
  /** N: markers, or distinct names in a multi-spawn category. */
  total: number;
}

/** R-825 numbers 1..N along the order; in multi-spawn categories same-name markers share one number. */
export function markerNumbers(order: readonly Pick<MapMarkerInput, "id" | "name">[], multiSpawn = false): MarkerNumbers {
  const numbers = new Map<string, number>();
  if (!multiSpawn) {
    order.forEach((m, i) => numbers.set(m.id, i + 1));
    return { numbers, total: order.length };
  }
  const byName = new Map<string, number>();
  for (const m of order) {
    const key = markerNameKey(m.name);
    let n = byName.get(key);
    if (n === undefined) {
      n = byName.size + 1;
      byName.set(key, n);
    }
    numbers.set(m.id, n);
  }
  return { numbers, total: byName.size };
}

/** R-825 previous/next marker along the order, wrapping (previous of the first = the last). */
export function stepMarker<T extends { id: string }>(order: readonly T[], id: string, delta: 1 | -1): T | null {
  const i = order.findIndex((m) => m.id === id);
  if (i < 0 || order.length === 0) return null;
  return order[(((i + delta) % order.length) + order.length) % order.length];
}

/** R-824/R-825 navigation button accessible name. */
export function navLabel(direction: "prev" | "next", categoryName: string, targetName: string, targetNumber: number): string {
  return `${direction === "prev" ? "Previous" : "Next"} in ${categoryName}: ${targetName} (#${targetNumber})`;
}

/** R-825 both navigation labels for a popup. */
export function navLabels(
  categoryName: string,
  prev: { name: string; number: number },
  next: { name: string; number: number },
): { prev: string; next: string } {
  return {
    prev: navLabel("prev", categoryName, prev.name, prev.number),
    next: navLabel("next", categoryName, next.name, next.number),
  };
}

/** R-825 popup number tooltip. */
export function numberTooltip(n: number, trackable: boolean): string {
  return trackable
    ? `Number ${n} in a collecting order from south to north`
    : `Number ${n} of this category, in the order of the list from south to north`;
}

/** R-825 popup number text "<n> / <N>". */
export function navNumberText(n: number, total: number): string {
  return `${n} / ${total}`;
}

/** R-817 arrow button: the category's marker nearest to the current centre (ties: smaller id). */
export function nearestMarker<T extends Point>(markers: readonly T[], center: { x: number; y: number }): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const m of markers) {
    const d = dist2(m, center);
    if (d < bestD || (d === bestD && best !== null && byIdAsc(m, best) < 0)) {
      best = m;
      bestD = d;
    }
  }
  return best;
}
