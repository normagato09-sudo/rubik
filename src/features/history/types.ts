import type { Move } from "@/features/cube/moves";
import type { Penalty } from "@/features/timer/types";

/**
 * One recorded solve. Deliberately keeps the raw time and the penalty as
 * separate fields (never merges them into a single number), so DNF is
 * never coerced into a time and a base time is never lost once +2 or DNF
 * is applied — the same distinction `TimerState` already makes.
 */
export interface HistoryEntry {
  id: string;
  /** The cube (features/cubes) this solve was done on — Cubos and Tiempos both read this same array, filtered by this field. */
  cubeId: string;
  /** Wall-clock time the solve finished (ms since epoch), for display/sorting. */
  completedAt: number;
  /** Raw solve time in ms, before any penalty. Never mutated once recorded. */
  baseTimeMs: number;
  penalty: Penalty;
  /** The scramble this solve was done on. */
  scramble: Move[];
}
