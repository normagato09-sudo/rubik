/**
 * Result modifiers for a finished solve (+2 and DNF): same style as
 * engine.ts and inspection.ts — pure, no React/Three.js. Both live in
 * this one file because they're two outcomes of the exact same field
 * (`TimerState.penalty`) with a shared invariant (only one applies at a
 * time), not two independent pieces of state. `finalTimeMs` is never
 * touched by either, which keeps the base time recoverable and is what
 * makes DNF able to simply overwrite a prior +2.
 */
import type { TimerState } from "./types";

/** +2 only makes sense once, on a solve that has finished and isn't already DNF or +2. */
export function canApplyPlus2(state: Pick<TimerState, "status" | "penalty">): boolean {
  return state.status === "stopped" && state.penalty === "none";
}

/**
 * Applies the +2 penalty. A no-op when it doesn't apply (not stopped
 * yet, already +2, or already DNF), so an accidental double click never
 * penalizes a solve twice and can never un-DNF it.
 */
export function applyPlus2(state: TimerState): TimerState {
  if (!canApplyPlus2(state)) return state;
  return { ...state, penalty: "plus2" };
}

/** DNF can be applied to any finished solve that isn't already DNF — including one with +2. */
export function canApplyDnf(state: Pick<TimerState, "status" | "penalty">): boolean {
  return state.status === "stopped" && state.penalty !== "dnf";
}

/**
 * Marks the solve as DNF. Since `penalty` can only hold one value, this
 * simply overwrites a prior "none" or "plus2" — DNF always wins as the
 * final result, and the solve can never be shown as both. A no-op if
 * already DNF, so double-clicking never causes any issue.
 */
export function markDnf(state: TimerState): TimerState {
  if (!canApplyDnf(state)) return state;
  return { ...state, penalty: "dnf" };
}
