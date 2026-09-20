/**
 * All fields that can legitimately be "nothing to show yet" are nullable
 * rather than 0 — a 0.00 average or a 0ms best solve would be a
 * misleading number, not an honest empty state.
 */
export interface StatsSummary {
  totalSolves: number;
  /** Fastest valid (non-DNF) result, +2 applied. Null with no valid solves. */
  bestSolveMs: number | null;
  /** Mean of every valid (non-DNF) result, +2 applied. Null with no valid solves. */
  averageMs: number | null;
  /** Best Ao5 found anywhere in the history. Null with fewer than 5 solves. */
  bestAo5Ms: number | null;
  plus2Count: number;
  dnfCount: number;
  /** Null when there are no solves at all (0/0 is not a percentage). */
  dnfPercentage: number | null;
  /** Sum of every valid (non-DNF) result, +2 applied. Null with no valid solves. */
  totalTimeMs: number | null;
}

/** One point per solve, oldest first, for a simple evolution view. */
export interface EvolutionPoint {
  id: string;
  /** 1-based position in chronological order. */
  index: number;
  /** The solve's final result: a time in ms, or "dnf". */
  value: number | "dnf";
}
