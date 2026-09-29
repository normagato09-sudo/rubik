/**
 * The 2×2 solver: the shortest solution (11 moves at most), only R, U and
 * F, so the corner at down-back-left never moves and the cube is never
 * turned whole — the same kind of solution the 3×3 gives.
 *
 * Held as the screen asks, that corner is the yellow-blue-orange one. If
 * the cube was copied another way, whatever corner is down-back-left is
 * kept still instead: the colors are renamed so it reads yellow-blue-orange
 * (opposites stay opposite, so it is still a real cube) and the search runs
 * on that. The moves are the same physical turns either way, and just as
 * short: on a 2×2 the fixed corner does not change how many moves it takes.
 */
import type { Move } from "@/features/cube/moves";
import type { CubeColor } from "@/features/cube/types";
import {
  CORNER_COLORS,
  CORNER_FACELETS_2,
  OPPOSITE_COLOR,
  REFERENCE_SLOT,
  parseFacelets2,
  type CornerState,
} from "./facelets";
import { solveOptimal } from "./search";
import { cubeStateForSolution2 } from "./sticker-moves";

/** The corners, with the corner at down-back-left as the fixed yellow-blue-orange one. */
export function cornersFromDbl(facelets: readonly CubeColor[]): CornerState {
  const [down, back, left] = CORNER_FACELETS_2[REFERENCE_SLOT].map((i) => facelets[i]);
  const [yellow, blue, orange] = CORNER_COLORS[REFERENCE_SLOT];
  const rename = new Map<CubeColor, CubeColor>([
    [down, yellow],
    [back, blue],
    [left, orange],
    [OPPOSITE_COLOR[down], OPPOSITE_COLOR[yellow]],
    [OPPOSITE_COLOR[back], OPPOSITE_COLOR[blue]],
    [OPPOSITE_COLOR[left], OPPOSITE_COLOR[orange]],
  ]);
  const parsed = parseFacelets2(facelets.map((color) => rename.get(color)!));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.corners;
}

/**
 * Solves a valid 2×2 (its 24 stickers, held however it was copied). Throws
 * if the stickers are not a real cube, or — which the tests rule out — if
 * the moves do not solve it when replayed with the 3D engine.
 */
export function solve2x2(facelets: readonly CubeColor[]): Move[] {
  const parsed = parseFacelets2([...facelets]);
  if (!parsed.ok) throw new Error(parsed.error);
  const moves = solveOptimal(cornersFromDbl(facelets));
  if (!cubeStateForSolution2(facelets, moves)) throw new Error("La solución calculada no resuelve el cubo.");
  return moves;
}
