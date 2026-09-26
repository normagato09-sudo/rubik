/**
 * Cubie-level model of a 3×3 used by the solver (Kociemba's conventions):
 * which piece sits in each slot and how it is twisted/flipped. Separate from
 * features/cube, which models the 3D pieces for rendering.
 *
 * Corners: URF UFL ULB UBR DFR DLF DBL DRB (0–7).
 * Edges:   UR UF UL UB DR DF DL DB FR FL BL BR (0–11).
 */
export interface CubieCube {
  /** cp[i]: corner currently in slot i. */
  cp: number[];
  /** co[i]: twist (0–2) of the corner in slot i. */
  co: number[];
  /** ep[i]: edge currently in slot i. */
  ep: number[];
  /** eo[i]: flip (0–1) of the edge in slot i. */
  eo: number[];
}

export const FACE_NAMES = ["U", "R", "F", "D", "L", "B"] as const;
export type FaceName = (typeof FACE_NAMES)[number];

export function solvedCube(): CubieCube {
  return {
    cp: [0, 1, 2, 3, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
}

/** Quarter turns (clockwise, seen from the face) in "replaced by" form. */
const BASIC_MOVES: Record<FaceName, CubieCube> = {
  U: {
    cp: [3, 0, 1, 2, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  R: {
    cp: [4, 1, 2, 0, 7, 5, 6, 3],
    co: [2, 0, 0, 1, 1, 0, 0, 2],
    ep: [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  F: {
    cp: [1, 5, 2, 3, 0, 4, 6, 7],
    co: [1, 2, 0, 0, 2, 1, 0, 0],
    ep: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11],
    eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
  },
  D: {
    cp: [0, 1, 2, 3, 5, 6, 7, 4],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  L: {
    cp: [0, 2, 6, 3, 4, 1, 5, 7],
    co: [0, 1, 2, 0, 0, 2, 1, 0],
    ep: [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  B: {
    cp: [0, 1, 3, 7, 4, 5, 2, 6],
    co: [0, 0, 1, 2, 0, 0, 2, 1],
    ep: [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7],
    eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
  },
};

/** a then b (b applied to the result of a). */
export function multiply(a: CubieCube, b: CubieCube): CubieCube {
  return {
    cp: b.cp.map((slot) => a.cp[slot]),
    co: b.cp.map((slot, i) => (a.co[slot] + b.co[i]) % 3),
    ep: b.ep.map((slot) => a.ep[slot]),
    eo: b.ep.map((slot, i) => (a.eo[slot] + b.eo[i]) % 2),
  };
}

/**
 * The 18 face moves, indexed face * 3 + power: U, U2, U', R, R2, R'...
 * (power 0 = quarter turn, 1 = half turn, 2 = inverse).
 */
export const MOVE_CUBES: CubieCube[] = FACE_NAMES.flatMap((face) => {
  const quarter = BASIC_MOVES[face];
  const half = multiply(quarter, quarter);
  return [quarter, half, multiply(half, quarter)];
});

export const MOVE_NAMES: string[] = FACE_NAMES.flatMap((face) => [face, `${face}2`, `${face}'`]);

export function applyMove(cube: CubieCube, move: number): CubieCube {
  return multiply(cube, MOVE_CUBES[move]);
}

/** Applies a space-separated sequence of face moves ("R U2 F'"). */
export function applyAlgorithm(cube: CubieCube, algorithm: string): CubieCube {
  return algorithm
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .reduce((current, token) => {
      const move = MOVE_NAMES.indexOf(token.replace("’", "'"));
      if (move === -1) throw new Error(`Movimiento no válido: ${token}`);
      return applyMove(current, move);
    }, cube);
}

/**
 * Why a cubie cube cannot be reached by turning a real 3×3 (null if it
 * can): every piece exactly once, twists and flips that add up, and corner
 * and edge permutations of the same parity.
 */
export type CubeProblem = "corner-repeated" | "edge-repeated" | "twist" | "flip" | "parity";

export function permutationParity(permutation: number[]): number {
  let swaps = 0;
  for (let i = 0; i < permutation.length; i++) {
    for (let j = i + 1; j < permutation.length; j++) {
      if (permutation[i] > permutation[j]) swaps++;
    }
  }
  return swaps % 2;
}

const isPermutation = (values: number[], n: number) =>
  values.length === n && new Set(values).size === n && values.every((v) => v >= 0 && v < n);

const isOrientation = (values: number[], n: number, mod: number) =>
  values.length === n && values.every((v) => Number.isInteger(v) && v >= 0 && v < mod);

export function cubeProblem(cube: CubieCube): CubeProblem | null {
  if (!isPermutation(cube.cp, 8)) return "corner-repeated";
  if (!isPermutation(cube.ep, 12)) return "edge-repeated";
  if (!isOrientation(cube.co, 8, 3) || cube.co.reduce((sum, t) => sum + t, 0) % 3 !== 0) {
    return "twist";
  }
  if (!isOrientation(cube.eo, 12, 2) || cube.eo.reduce((sum, f) => sum + f, 0) % 2 !== 0) {
    return "flip";
  }
  if (permutationParity(cube.cp) !== permutationParity(cube.ep)) return "parity";
  return null;
}

export function isSolved(cube: CubieCube): boolean {
  const solved = solvedCube();
  return (
    cube.cp.every((value, i) => value === solved.cp[i]) &&
    cube.co.every((value) => value === 0) &&
    cube.ep.every((value, i) => value === solved.ep[i]) &&
    cube.eo.every((value) => value === 0)
  );
}
