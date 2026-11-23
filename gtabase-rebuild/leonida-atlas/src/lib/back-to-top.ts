/**
 * back-to-top — the back-to-top control state (R-1309).
 */

export const BACK_TO_TOP_SHOW_PX = 300;
export const BACK_TO_TOP_FADE_PX = 1200;

/** `data-state` of the control: "" (cleared/hidden), "visible", "visible faded". */
export type BackToTopState = "" | "visible" | "visible faded";

/**
 * R-1309: shown beyond 300 px; beyond 1200 px also faded, which stays while scrolling back up between 300 and
 * 1200 px; both cleared at 300 px or less.
 */
export function backToTopState(scrollY: number, previousState: BackToTopState): BackToTopState {
  if (!(scrollY > BACK_TO_TOP_SHOW_PX)) return "";
  if (scrollY > BACK_TO_TOP_FADE_PX) return "visible faded";
  return previousState === "visible faded" ? "visible faded" : "visible";
}
