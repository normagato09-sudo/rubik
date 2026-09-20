/**
 * Scramble generator: picks a random sequence of moves from the existing
 * move engine. No cube-state or rendering logic lives here — it only
 * produces a `Move[]`, which the engine (`applyMoves`) then applies for
 * real, exactly like a manual turn.
 */
import { ALL_MOVES, getFaceDef } from "@/features/cube/moves";
import type { Face, Move } from "@/features/cube/moves";

export const DEFAULT_SCRAMBLE_LENGTH = 20;

function randomIndex(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Generates `length` random moves, never picking a move on the same axis
 * as the previous one. This rules out both consecutive same-face moves
 * (e.g. `R R'`) and same-axis opposite-face moves (e.g. `R L`), which
 * commute and would make the sequence trivially reducible.
 */
export function generateScramble(length: number = DEFAULT_SCRAMBLE_LENGTH): Move[] {
  const scramble: Move[] = [];
  let previousAxis: 0 | 1 | 2 | null = null;

  while (scramble.length < length) {
    const candidate = ALL_MOVES[randomIndex(ALL_MOVES.length)];
    const axis = getFaceDef(candidate[0] as Face).axis;
    if (axis === previousAxis) continue;

    scramble.push(candidate);
    previousAxis = axis;
  }

  return scramble;
}
