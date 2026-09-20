/**
 * Pure state of a speedcubing timer. Deliberately minimal: `status` is a
 * plain string union so it can grow later (e.g. an "inspecting" state)
 * without touching existing states, and `finalTimeMs` is the one place a
 * finished solve's time lives, ready to be stored later in a history
 * entry alongside the scramble that produced it.
 */
export type TimerStatus = "idle" | "running" | "stopped";

/**
 * The three possible outcomes of a finished solve. Only one applies at a
 * time — DNF and +2 are mutually exclusive, matching how WCA competitions
 * record a single result per solve (DNF always wins if both would apply).
 */
export type Penalty = "none" | "plus2" | "dnf";

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
