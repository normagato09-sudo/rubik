/**
 * The Skewb solver: the shortest solution of a painted Skewb (11 moves at
 * most), in WCA notation. The WCA moves never turn the up-front-right
 * corner, so the Skewb is solved as it is held: that corner stays where it
 * is and the rest is solved around it. Every solution is replayed on the
 * painted stickers before it is returned.
 */
import type { CubeColor } from "@/features/cube/types";
import { asHeldForSolver, skewbImpossible } from "./facelets";
import { applySkewbMoves, isSolvedSkewb, type SkewbMove } from "./moves";
import { piecesFromStickers, skewbDistances, solveSkewbState, stateIndex } from "./search";

/** Builds the distance table (about half a second), so the first solve is instant. */
export const initSkewbTables = () => {
  skewbDistances();
};

/** The fewest WCA moves that solve the Skewb painted with `colors`; throws with a message in Spanish if it cannot be. */
export function solveSkewb(colors: readonly CubeColor[]): SkewbMove[] {
  const problem = skewbImpossible(colors);
  if (problem) throw new Error(problem.message);
  const held = asHeldForSolver(colors)!;
  const moves = solveSkewbState(stateIndex(piecesFromStickers(held)));
  if (!isSolvedSkewb(applySkewbMoves(colors, moves))) throw new Error("La solución no ha superado la comprobación.");
  return moves;
}
