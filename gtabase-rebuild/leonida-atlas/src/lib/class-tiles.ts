/**
 * class-tiles — picking rules of the class tiles (R-510).
 */

/**
 * R-510: a click on a picked tile removes only that tile (with or without a modifier); Ctrl/Cmd/Shift + click or
 * the "+" button on an unpicked tile adds it; a plain click on an unpicked tile picks it alone (switch). Pick order
 * is kept. HYPOTHESIS: the "+" button on an already picked tile changes nothing.
 */
export function nextPickedTiles(
  picked: readonly string[],
  clicked: string,
  modifierHeld: boolean,
  viaAddButton = false,
): string[] {
  if (picked.includes(clicked)) {
    return viaAddButton ? picked.slice() : picked.filter((t) => t !== clicked);
  }
  if (modifierHeld || viaAddButton) return [...picked, clicked];
  return [clicked];
}

/** R-510 "+" button accessible name. */
export function addTileLabel(label: string): string {
  return `Add ${label} to the selection`;
}

/** True for the modifier keys that add instead of switching (R-510). */
export function isAddModifier(e: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }): boolean {
  return Boolean(e.ctrlKey || e.metaKey || e.shiftKey);
}
