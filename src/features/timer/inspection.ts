/**
 * Inspection countdown: the same timestamp-based pattern as engine.ts,
 * kept as its own pure module so "time spent inspecting" and "time spent
 * solving" are always separate state, never shared or summed.
 *
 * Status mirrors TimerStatus's idle/running naming for consistency.
 * There's no fourth "ready" state: once the countdown is over there is
 * nothing left to track for inspection itself (no elapsed value worth
 * keeping, unlike a finished solve) — "finished" already means "ready to
 * solve", so a separate ready state would just duplicate it.
 */
export type InspectionStatus = "idle" | "running" | "finished";

export interface InspectionState {
  status: InspectionStatus;
  /** Timestamp (ms, monotonic clock) when the countdown started. */
  startedAt: number | null;
}

export const INSPECTION_DURATION_MS = 15_000;

export const INITIAL_INSPECTION_STATE: InspectionState = {
  status: "idle",
  startedAt: null,
};

/** Starts the countdown. A no-op if already running (no overlapping inspections). */
export function startInspection(state: InspectionState, now: number): InspectionState {
  if (state.status === "running") return state;
  return { status: "running", startedAt: now };
}

/** Aborts the countdown entirely, back to idle. Safe to call from any status. */
export function cancelInspection(): InspectionState {
  return INITIAL_INSPECTION_STATE;
}

/** Ends the countdown early, e.g. the user chooses to start solving before it hits 0. */
export function finishInspection(state: InspectionState): InspectionState {
  if (state.status !== "running") return state;
  return { status: "finished", startedAt: null };
}

/** Re-evaluates the countdown against `now`; auto-finishes once time is up. */
export function tickInspection(state: InspectionState, now: number): InspectionState {
  if (state.status !== "running" || state.startedAt === null) return state;
  if (now - state.startedAt >= INSPECTION_DURATION_MS) {
    return { status: "finished", startedAt: null };
  }
  return state;
}

/** Whole seconds left to display: 15, 14, ..., 1, 0. */
export function remainingSeconds(state: InspectionState, now: number): number {
  if (state.status === "idle") return Math.ceil(INSPECTION_DURATION_MS / 1000);
  if (state.status === "finished" || state.startedAt === null) return 0;
  const remainingMs = INSPECTION_DURATION_MS - (now - state.startedAt);
  return Math.max(0, Math.ceil(remainingMs / 1000));
}
