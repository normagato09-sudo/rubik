/**
 * Pure state of a speedcubing timer. Deliberately minimal: `status` is a
 * plain string union so it can grow later (e.g. an "inspecting" state)
 * without touching existing states, and `finalTimeMs` is the one place a
 * finished solve's time lives, ready to be paired later with a penalty
 * (+2/DNF) or stored in a history entry alongside the scramble that
 * produced it.
 */
export type TimerStatus = "idle" | "running" | "stopped";

/** "none" (no penalty) or "plus2" (+2s). DNF will extend this later. */
export type Penalty = "none" | "plus2";

export interface TimerState {
  status: TimerStatus;
  /** Timestamp (ms, monotonic clock) when the current run started. */
  startedAt: number | null;
  /**
   * Raw elapsed ms of the last completed run — never touched by a
   * penalty, so the base time is always recoverable. Kept until the
   * next start().
   */
  finalTimeMs: number | null;
  /** Penalty applied to the last completed run, if any. */
  penalty: Penalty;
}

export const INITIAL_TIMER_STATE: TimerState = {
  status: "idle",
  startedAt: null,
  finalTimeMs: null,
  penalty: "none",
};
