import type { Move } from "@/features/cube/moves";

/**
 * One completed attempt at a training module inside Aprender (e.g.
 * Aprender → 3×3 → CFOP → Cross). Deliberately a separate shape from
 * `Solve` (`features/history/types.ts`): a technical drill result means
 * something different from a real solve and must never be recorded into
 * the same list, even though both may reuse the same timer/scramble
 * engines under the hood.
 */
export interface TrainingAttempt {
  id: string;
  cubeId: string;
  methodId: string;
  stageId: string;
  scramble: Move[];
  timeMs: number;
  completedAt: number;
}
