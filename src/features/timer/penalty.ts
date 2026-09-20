/**
 * +2 penalty: same style as engine.ts and inspection.ts — pure, no
 * React/Three.js. Deliberately tiny: the base time already lives in
 * `TimerState.finalTimeMs` (untouched by this module) and `elapsedMs`
 * already knows how to add the penalty when displaying it, so this file
 * only needs the one state transition plus the guard that decides
 * whether it's legal right now.
 */
import type { TimerState } from "./types";

/** +2 only makes sense once, on a solve that has actually finished. */
export function canApplyPlus2(state: Pick<TimerState, "status" | "penalty">): boolean {
  return state.status === "stopped" && state.penalty === "none";
}

/**
 * Applies the +2 penalty. A no-op when it doesn't apply (not stopped
 * yet, or already penalized), so an accidental double click never
 * penalizes a solve twice. `finalTimeMs` is never touched, which is
 * what keeps the base time and the penalty distinguishable — and makes
 * removing the penalty later just a matter of flipping this field back.
 */
export function applyPlus2(state: TimerState): TimerState {
  if (!canApplyPlus2(state)) return state;
  return { ...state, penalty: "plus2" };
}
