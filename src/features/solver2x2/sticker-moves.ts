/**
 * Moves on the 24 stickers of a 2×2, taken from RUBIKO's 3D move engine
 * (features/cube/moves) rather than written out by hand: for every move,
 * each sticker goes wherever the engine sends its piece and its normal.
 * The solver and the methods work on these arrays; the screen replays the
 * same moves on the 3D cube.
 */
import { createSolvedCube } from "@/features/cube/model";
import { EVERY_MOVE, applyMoves, invertMoves, moveVector, parseMove, type Move } from "@/features/cube/moves";
import type { CubeColor, CubeState, Vec3 } from "@/features/cube/types";
import { faceletsFromCubeState } from "@/features/solver/cube-state";
import { FACELET_GEOMETRY_2, isSolved2 } from "./facelets";

const key = ([px, py, pz]: Vec3, [nx, ny, nz]: Vec3) => `${px},${py},${pz}|${nx},${ny},${nz}`;

const INDEX_OF = new Map(FACELET_GEOMETRY_2.map(([position, normal], i) => [key(position, normal), i]));

/** PERMUTATION[move][j]: the sticker that ends up at j after the move. */
const PERMUTATION = new Map<Move, number[]>(
  EVERY_MOVE.map((move) => {
    const source: number[] = Array(FACELET_GEOMETRY_2.length);
    FACELET_GEOMETRY_2.forEach(([position, normal], i) => {
      const target = INDEX_OF.get(key(moveVector(move, position), moveVector(move, position, normal)));
      if (target === undefined) throw new Error(`Movimiento ${move} fuera del 2×2`);
      source[target] = i;
    });
    return [move, source];
  }),
);

export function applyMove2<T>(facelets: readonly T[], move: Move): T[] {
  const source = PERMUTATION.get(move);
  if (!source) throw new Error(`Movimiento no válido: ${move}`);
  return source.map((i) => facelets[i]);
}

export function applyMoves2<T>(facelets: readonly T[], moves: readonly Move[]): T[] {
  return moves.reduce<T[]>((current, move) => applyMove2(current, move), [...facelets]);
}

/** A solved 2×2 held white up, green front, as stickers. */
export function solvedFacelets2(): CubeColor[] {
  return faceletsFromCubeState(createSolvedCube(2), FACELET_GEOMETRY_2);
}

/** The stickers of a 2×2 3D cube state. */
export function faceletsFromCubeState2(state: CubeState): CubeColor[] {
  return faceletsFromCubeState(state, FACELET_GEOMETRY_2);
}

// ---------- whole-cube orientations ----------

/**
 * The 24 ways of holding a cube, each as the shortest sequence of x/y/z
 * rotations that gets there from white up, green front (the empty sequence
 * first, then one rotation, then two).
 */
export const ORIENTATIONS: Move[][] = (() => {
  const rotations = EVERY_MOVE.filter((move) => "xyz".includes(move[0]));
  const labels = FACELET_GEOMETRY_2.map((_, i) => i);
  const seen = new Set<string>([labels.join()]);
  const found: Move[][] = [[]];
  for (let i = 0; i < found.length; i++) {
    for (const rotation of rotations) {
      const sequence = [...found[i], rotation];
      const id = applyMoves2(labels, sequence).join();
      if (seen.has(id)) continue;
      seen.add(id);
      found.push(sequence);
    }
  }
  return found;
})();

/**
 * Joins consecutive turns of the same face (or the same rotation) and drops
 * the ones that cancel: "U U2" → "U'", "R R'" → nothing.
 */
export function simplifyMoves(moves: readonly Move[]): Move[] {
  const out: Move[] = [];
  for (const move of moves) {
    const last = out.at(-1);
    const { face, turns } = parseMove(move);
    if (last && parseMove(last).face === face) {
      out.pop();
      const total = (parseMove(last).turns + turns) % 4;
      if (total !== 0) out.push((total === 1 ? face : total === 2 ? `${face}2` : `${face}'`) as Move);
    } else {
      out.push(move);
    }
  }
  return out;
}

/**
 * The user's 2×2 as a 3D state for playing `moves` back: whatever solved
 * orientation the moves end in, undoing them from there with the 3D
 * engine. Returns null unless that state shows exactly `facelets` — i.e.
 * unless the moves, applied by RUBIKO's own engine, really solve this cube.
 */
export function cubeStateForSolution2(facelets: readonly CubeColor[], moves: readonly Move[]): CubeState | null {
  const end = applyMoves2(facelets, moves);
  if (!isSolved2(end)) return null;
  for (const orientation of ORIENTATIONS) {
    const endState = applyMoves(createSolvedCube(2), orientation);
    if (faceletsFromCubeState2(endState).join() !== end.join()) continue;
    const start = applyMoves(endState, invertMoves([...moves]));
    const shown = faceletsFromCubeState2(start);
    return shown.every((color, i) => color === facelets[i]) ? start : null;
  }
  return null;
}
