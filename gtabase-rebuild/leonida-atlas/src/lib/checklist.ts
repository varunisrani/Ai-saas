/**
 * checklist — F5 tick boxes, cascade, percentage and guest storage (R-901..R-916; CD2 `guest_checklists`).
 */
import { STORAGE_KEYS } from "./storage";
import { clamp } from "./format";
import { collapseSpaces, isPlainObject, parseJson, stringArray } from "./text";

export const GUEST_CHECKLISTS_KEY = STORAGE_KEYS.guestChecklists;
/** List ids of `guest_checklists` (R-901, R-828). */
export const CHECKLIST_LISTS = { hundred: "gta6-100", missions: "gta6-missions", map: "gta6-map" } as const;

export interface ChecklistItemInput {
  id: string;
  /** Parent item id, none for top-level requirements. */
  parent?: string | null;
  /** Own weight in percent (optional). */
  weight?: number | null;
  /** Cap of a requirement with sub-items (optional). */
  limit?: number | null;
  /** Whole number, default 1. */
  multiplier?: number | null;
  /** Sub-items sharing a group key form one slot (optional). */
  group?: string | null;
}

interface Tree<T extends ChecklistItemInput> {
  byId: Map<string, T>;
  children: Map<string, T[]>;
  order: Map<string, number>;
  top: T[];
}

function buildTree<T extends ChecklistItemInput>(items: readonly T[]): Tree<T> {
  const byId = new Map<string, T>();
  const order = new Map<string, number>();
  // R-914 "each item counts at most once even when shown several times": first occurrence wins.
  for (const it of items) {
    if (!byId.has(it.id)) {
      byId.set(it.id, it);
      order.set(it.id, order.size);
    }
  }
  const children = new Map<string, T[]>();
  const top: T[] = [];
  for (const it of byId.values()) {
    const p = it.parent ?? null;
    if (p && byId.has(p) && p !== it.id) {
      const list = children.get(p) ?? [];
      list.push(it);
      children.set(p, list);
    } else {
      top.push(it);
    }
  }
  return { byId, children, order, top };
}

function mult(it: ChecklistItemInput): number {
  return typeof it.multiplier === "number" && Number.isFinite(it.multiplier) && it.multiplier > 0 ? it.multiplier : 1;
}

function hasNum(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Children grouped into slots: ungrouped children are their own slot; a group key forms one slot. */
function slotsOf<T extends ChecklistItemInput>(kids: readonly T[]): T[][] {
  const slots: T[][] = [];
  const byGroup = new Map<string, T[]>();
  for (const k of kids) {
    if (k.group) {
      let slot = byGroup.get(k.group);
      if (!slot) {
        slot = [];
        byGroup.set(k.group, slot);
        slots.push(slot);
      }
      slot.push(k);
    } else {
      slots.push([k]);
    }
  }
  return slots;
}

/**
 * R-914 percentage. Only top-level requirements are summed. A requirement without sub-items counts its share
 * when ticked (top level: weight × multiplier). A requirement with sub-items counts the sum of its ticked
 * sub-items' shares, capped at its limit. A sub-item's share is its own weight × multiplier, otherwise the parent's
 * share split over the unweighted sub-items in proportion to their multipliers, a group key forming one slot
 * (HYPOTHESIS: a slot counts once when any member is ticked; its multiplier is its first member's). Sub-items with
 * sub-items recurse with their share as the parent weight. A parent without weight uses its limit as its share.
 */
export function checklistPercentage(items: readonly ChecklistItemInput[], tickedIds: Iterable<string>): number {
  const tree = buildTree(items);
  const ticked = new Set(tickedIds);

  const contribution = (it: ChecklistItemInput, share: number, depth: number): number => {
    if (depth > 50) return 0;
    const kids = tree.children.get(it.id) ?? [];
    if (kids.length === 0) return ticked.has(it.id) ? share : 0;
    const slots = slotsOf(kids);
    const unweighted = slots.filter((s) => !hasNum(s[0].weight));
    const totalMult = unweighted.reduce((sum, s) => sum + mult(s[0]), 0);
    let sum = 0;
    for (const slot of slots) {
      const first = slot[0];
      const slotShare = hasNum(first.weight)
        ? first.weight * mult(first)
        : totalMult > 0
          ? (share * mult(first)) / totalMult
          : 0;
      if (slot.length === 1) {
        sum += contribution(first, slotShare, depth + 1);
      } else {
        // A group slot counts once: the best member contribution.
        sum += Math.max(...slot.map((m) => contribution(m, slotShare, depth + 1)));
      }
    }
    return hasNum(it.limit) ? Math.min(sum, it.limit) : sum;
  };

  let total = 0;
  for (const it of tree.top) {
    const share = hasNum(it.weight) ? it.weight * mult(it) : hasNum(it.limit) ? it.limit : 0;
    total += contribution(it, share, 0);
  }
  return total;
}

export interface PercentageDisplay {
  /** Exactly two decimals, clamped ("0.00", "2.73", "100.00"). */
  text: string;
  /** Clamped numeric value for the bar width in percent. */
  widthPercent: number;
  /** Inline style value of the bar ("50%"). */
  width: string;
  /** `aria-valuenow` of the progressbar (the two-decimal text). */
  valueNow: string;
  /** Progress box heading "<n>% Completed!". */
  heading: string;
}

/** R-407/R-915/R-916 display of the percentage. */
export function displayPercentage(value: number): PercentageDisplay {
  const v = clamp(Number.isFinite(value) ? value : 0, 0, 100);
  const rounded = Math.round(v * 100) / 100;
  const text = rounded.toFixed(2);
  const widthPercent = Math.round(v * 10000) / 10000;
  return { text, widthPercent, width: `${widthPercent}%`, valueNow: text, heading: `${text}% Completed!` };
}

export interface ChecklistChange {
  id: string;
  on: boolean;
}

export interface CascadeResult {
  /** Ticked ids after the change, in page order. */
  ticked: string[];
  /** Changed items in storage order: the clicked item, changed sub-items (page order), changed parents. */
  changes: ChecklistChange[];
}

function isSatisfied<T extends ChecklistItemInput>(parent: T, tree: Tree<T>, ticked: Set<string>): boolean {
  const kids = tree.children.get(parent.id) ?? [];
  if (kids.length === 0) return ticked.has(parent.id);
  return slotsOf(kids).every((slot) => slot.some((k) => ticked.has(k.id)));
}

function depthOf<T extends ChecklistItemInput>(it: T, tree: Tree<T>): number {
  let d = 0;
  let cur: T | undefined = it;
  const seen = new Set<string>();
  while (cur && cur.parent && tree.byId.has(cur.parent) && !seen.has(cur.id) && d < 50) {
    seen.add(cur.id);
    cur = tree.byId.get(cur.parent);
    d++;
  }
  return d;
}

/**
 * R-905/R-906: toggles `clickedId`. Ticking a parent ticks every not-yet-ticked sub-item (recursively); unticking
 * unticks them all. Then every parent is re-evaluated bottom-up (ticked when every sub-item slot is ticked, a group
 * needing one ticked member). Changes come back in storage order.
 */
export function cascadeToggle(
  items: readonly ChecklistItemInput[],
  tickedIds: Iterable<string>,
  clickedId: string,
): CascadeResult {
  const tree = buildTree(items);
  const ticked = new Set(tickedIds);
  const changes: ChecklistChange[] = [];
  const set = (id: string, on: boolean) => {
    if (ticked.has(id) === on) return;
    if (on) ticked.add(id);
    else ticked.delete(id);
    changes.push({ id, on });
  };
  if (!tree.byId.has(clickedId)) {
    return { ticked: [...ticked], changes };
  }
  const on = !ticked.has(clickedId);
  set(clickedId, on);

  // Descendants in page order.
  const descendants: ChecklistItemInput[] = [];
  const walk = (id: string, depth: number) => {
    if (depth > 50) return;
    for (const k of tree.children.get(id) ?? []) {
      descendants.push(k);
      walk(k.id, depth + 1);
    }
  };
  walk(clickedId, 0);
  descendants.sort((a, b) => (tree.order.get(a.id) ?? 0) - (tree.order.get(b.id) ?? 0));
  for (const d of descendants) set(d.id, on);

  // Re-evaluate every parent, deepest first (nearest ancestor first), page order within a depth.
  const parents = [...tree.byId.values()].filter((it) => (tree.children.get(it.id) ?? []).length > 0);
  parents.sort((a, b) => depthOf(b, tree) - depthOf(a, tree) || (tree.order.get(a.id) ?? 0) - (tree.order.get(b.id) ?? 0));
  for (const p of parents) set(p.id, isSatisfied(p, tree, ticked));

  const ticks = [...tree.byId.keys()].filter((id) => ticked.has(id));
  // Keep ids that are not part of this item list (other pages of the same list) at the end.
  for (const id of ticked) if (!tree.byId.has(id)) ticks.push(id);
  return { ticked: ticks, changes };
}

/** Reads one list of `guest_checklists` (unreadable JSON → empty, R-909). */
export function readChecklistIds(raw: string | null | undefined, listId: string): string[] {
  const parsed = parseJson(raw);
  if (!isPlainObject(parsed)) return [];
  return stringArray(parsed[listId]);
}

/**
 * R-906 guest storage: each changed item is appended once when ticked or removed when unticked, in change order; a
 * list that becomes empty is removed; the object is always written back (`{}` after the last untick). Other lists
 * are kept. Unreadable JSON is treated as `{}` (R-909).
 */
export function applyGuestChecklistChange(
  raw: string | null | undefined,
  listId: string,
  changes: readonly ChecklistChange[],
): string {
  const parsed = parseJson(raw);
  const obj: Record<string, unknown> = isPlainObject(parsed) ? { ...parsed } : {};
  const list = stringArray(obj[listId]);
  for (const c of changes) {
    const idx = list.indexOf(c.id);
    if (c.on && idx < 0) list.push(c.id);
    else if (!c.on && idx >= 0) list.splice(idx, 1);
  }
  if (list.length) obj[listId] = list;
  else delete obj[listId];
  return JSON.stringify(obj);
}

/**
 * R-910 accessible name: "Mark as completed: <row text>" where row text has whitespace runs collapsed, is trimmed,
 * loses a leading list number ("12." or "3)") and is cut to 100 characters; "Mark as completed" without text.
 */
export function checkboxLabel(rowText: string | null | undefined): string {
  let text = collapseSpaces(rowText ?? "");
  text = text.replace(/^\d+[.)]\s*/, "").trim();
  text = Array.from(text).slice(0, 100).join("").trim();
  return text ? `Mark as completed: ${text}` : "Mark as completed";
}

/** R-911: a "#profile=<n>" hash is removed (returns "" = no hash); any other hash is returned unchanged. */
export function stripProfileHash(hash: string): string {
  return /^#?profile=[^&]*$/.test(hash) ? "" : hash;
}
