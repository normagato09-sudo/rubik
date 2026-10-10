/**
 * Scramble generator: picks a random sequence of moves from the existing
 * move engine. No cube-state or rendering logic lives here — it only
 * produces a `Move[]`, which the engine (`applyMoves`) then applies for
 * real, exactly like a manual turn.
 */
import { ALL_MOVES, getFaceDef } from "@/features/cube/moves";
import type { Face, Move } from "@/features/cube/moves";
import type { PyraMove } from "@/features/pyraminx/moves";
import type { SkewbMove } from "@/features/skewb/moves";
import { randomStateSkewbScramble } from "@/features/skewb/search";

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

/** 2×2 scrambles only use R, U and F: with one corner still, they reach every position. */
const MOVES_2X2: Move[] = ["R", "R'", "R2", "U", "U'", "U2", "F", "F'", "F2"];

export const SCRAMBLE_2X2_LENGTH = { min: 9, max: 11 } as const;

/**
 * A 2×2 scramble of 9 to 11 moves with R, U and F, never turning the same
 * face twice in a row (R R' or R R2 would just be one move, or none).
 */
export function generate2x2Scramble(
  length: number = SCRAMBLE_2X2_LENGTH.min + randomIndex(SCRAMBLE_2X2_LENGTH.max - SCRAMBLE_2X2_LENGTH.min + 1),
): Move[] {
  const scramble: Move[] = [];
  while (scramble.length < length) {
    const candidate = MOVES_2X2[randomIndex(MOVES_2X2.length)];
    if (candidate[0] === scramble.at(-1)?.[0]) continue;
    scramble.push(candidate);
  }
  return scramble;
}

/** Pyraminx scrambles: this many big turns (U, L, R, B), then the tips. */
export const PYRAMINX_SCRAMBLE_LENGTH = 11;

const PYRAMINX_BIG: PyraMove[] = ["U", "U'", "L", "L'", "R", "R'", "B", "B'"];

/**
 * A Pyraminx scramble in the usual format: 11 big turns, never the same
 * tip twice in a row (U U' would undo itself, U U is just U'), then each
 * tip turned or not at random, in the order u, l, r, b.
 */
export function generatePyraminxScramble(length: number = PYRAMINX_SCRAMBLE_LENGTH): PyraMove[] {
  const scramble: PyraMove[] = [];
  while (scramble.length < length) {
    const candidate = PYRAMINX_BIG[randomIndex(PYRAMINX_BIG.length)];
    if (candidate[0] === scramble.at(-1)?.[0]) continue;
    scramble.push(candidate);
  }
  for (const tip of ["u", "l", "r", "b"]) {
    const turn = randomIndex(3);
    if (turn > 0) scramble.push((turn === 1 ? tip : `${tip}'`) as PyraMove);
  }
  return scramble;
}

/**
 * A WCA Skewb scramble, as TNoodle makes them: a random position (every
 * one equally likely) reached with exactly 11 moves of R, U, L and B.
 * The first one builds the Skewb's distance table (under half a second).
 */
export function generateSkewbScramble(): SkewbMove[] {
  return randomStateSkewbScramble().scramble;
}
