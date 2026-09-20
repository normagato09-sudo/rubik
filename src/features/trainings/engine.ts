/**
 * Pure logic over recorded training attempts. Same shape as
 * `features/history/engine.ts` on purpose: attempts are only ever added
 * or cleared, never mutated in place.
 */
import type { TrainingAttempt } from "./types";

/** Prepends a new attempt so the most recent is always first. */
export function addAttempt(attempts: TrainingAttempt[], attempt: TrainingAttempt): TrainingAttempt[] {
  return [attempt, ...attempts];
}

export function clearAttempts(): TrainingAttempt[] {
  return [];
}

/** Attempts for one stage of one method, most-recent-first — e.g. "every Cross attempt". */
export function attemptsForStage(
  attempts: TrainingAttempt[],
  methodId: string,
  stageId: string,
): TrainingAttempt[] {
  return attempts.filter((attempt) => attempt.methodId === methodId && attempt.stageId === stageId);
}
