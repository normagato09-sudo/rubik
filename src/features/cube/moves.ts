/**
 * Move engine: pure functions that transform a CubeState. No React, no
 * Three.js — this can be reused later for scrambles, algorithm playback
 * and the solver exactly as-is.
 *
 * Each face turn is an exact 90 degree rotation about a principal axis,
 * expressed with integer coordinate swaps so repeated turns never drift.
 * A move is represented as that quarter turn applied 1 (plain), 2 (double)
 * or 3 times (prime, i.e. three quarter turns = one turn backwards).
 *
 * The same engine turns a 3×3 and a 2×2: a face turn moves every piece
 * whose coordinate on its axis is ±1, and a 2×2 simply has no 0 layer.
 * x, y and z turn the whole cube (like R, U and F), which some 2×2
 * algorithms use; the 3×3 solver and scrambles never do. The middle
 * layers M (as L), E (as D) and S (as F) and the wide turns r, l, u, d,
 * f and b (a face and the middle layer next to it) are for the methods'
 * algorithms; on a 2×2 there is no middle layer, so M does nothing and
 * r is R.
 */
import type { CubeState, Cubie, Vec3 } from "./types";

export type Face = "R" | "L" | "U" | "D" | "F" | "B";
/** Middle layers: M turns as L, E as D, S as F. */
export type Slice = "M" | "E" | "S";
/** Wide turns: a face and the middle layer next to it (r = R + M'). */
export type Wide = "r" | "l" | "u" | "d" | "f" | "b";
/** Whole-cube rotations: x as R, y as U, z as F. */
export type Rotation = "x" | "y" | "z";
export type Turn = Face | Slice | Wide | Rotation;
export type Move = Turn | `${Turn}'` | `${Turn}2`;

type Axis = 0 | 1 | 2;

function rotate90(axis: Axis, sign: 1 | -1) {
  return ([x, y, z]: Vec3): Vec3 => {
    switch (axis) {
      case 0:
        return sign === 1 ? [x, -z, y] : [x, z, -y];
      case 1:
        return sign === 1 ? [z, y, -x] : [-z, y, x];
      case 2:
        return sign === 1 ? [-y, x, z] : [y, -x, z];
    }
  };
}

interface FaceDef {
  axis: Axis;
  /** Which layers (values of position[axis]) the turn moves; "all" for a whole-cube rotation. */
  layers: readonly number[] | "all";
  /** Rotation sign of a single quarter turn, see rotate90. */
  sign: 1 | -1;
}

// Every face turns clockwise when viewed from outside that face. Signs
// below encode that using the right-hand rotation about the principal
// (not necessarily outward-facing) axis.
const FACE_DEF: Record<Turn, FaceDef> = {
  R: { axis: 0, layers: [1], sign: -1 },
  L: { axis: 0, layers: [-1], sign: 1 },
  U: { axis: 1, layers: [1], sign: -1 },
  D: { axis: 1, layers: [-1], sign: 1 },
  F: { axis: 2, layers: [1], sign: -1 },
  B: { axis: 2, layers: [-1], sign: 1 },
  M: { axis: 0, layers: [0], sign: 1 },
  E: { axis: 1, layers: [0], sign: 1 },
  S: { axis: 2, layers: [0], sign: -1 },
  r: { axis: 0, layers: [0, 1], sign: -1 },
  l: { axis: 0, layers: [-1, 0], sign: 1 },
  u: { axis: 1, layers: [0, 1], sign: -1 },
  d: { axis: 1, layers: [-1, 0], sign: 1 },
  f: { axis: 2, layers: [0, 1], sign: -1 },
  b: { axis: 2, layers: [-1, 0], sign: 1 },
  x: { axis: 0, layers: "all", sign: -1 },
  y: { axis: 1, layers: "all", sign: -1 },
  z: { axis: 2, layers: "all", sign: -1 },
};

export function getFaceDef(face: Turn): { axis: Axis; layers: readonly number[] | "all" } {
  const { axis, layers } = FACE_DEF[face];
  return { axis, layers };
}

/** Whether a piece at `position` moves when `face` turns. */
export function isInLayer(face: Turn, position: Vec3): boolean {
  const { axis, layers } = FACE_DEF[face];
  return layers === "all" || layers.includes(position[axis]);
}

export function isRotation(move: Move): boolean {
  return FACE_DEF[move[0] as Turn].layers === "all";
}

/** Signed angle (radians) of a single quarter turn of this face. */
export function baseQuarterAngle(face: Turn): number {
  return FACE_DEF[face].sign * (Math.PI / 2);
}

export function parseMove(move: Move): { face: Turn; turns: 1 | 2 | 3 } {
  const face = move[0] as Turn;
  const modifier = move.slice(1);
  const turns = modifier === "'" ? 3 : modifier === "2" ? 2 : 1;
  return { face, turns };
}

export function turnsToMove(face: Turn, turns: 1 | 2 | 3): Move {
  if (turns === 1) return face;
  if (turns === 2) return `${face}2`;
  return `${face}'`;
}

export function inverseMove(move: Move): Move {
  const { face, turns } = parseMove(move);
  return turnsToMove(face, ((4 - turns) % 4) as 1 | 2 | 3);
}

/** Inverse of a whole sequence — reversed order, each move inverted — undoes it exactly. */
export function invertMoves(moves: Move[]): Move[] {
  return [...moves].reverse().map(inverseMove);
}

/** Where a vector at `position` ends up after `move` (unchanged if its piece does not move). */
export function moveVector(move: Move, position: Vec3, vector: Vec3 = position): Vec3 {
  const { face, turns } = parseMove(move);
  if (!isInLayer(face, position)) return vector;
  const { axis, sign } = FACE_DEF[face];
  const rotateQuarter = rotate90(axis, sign);
  let result = vector;
  for (let i = 0; i < turns; i++) result = rotateQuarter(result);
  return result;
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const { face, turns } = parseMove(move);
  const { axis, sign } = FACE_DEF[face];
  const rotateQuarter = rotate90(axis, sign);

  const cubies = state.cubies.map((cubie): Cubie => {
    if (!isInLayer(face, cubie.position)) return cubie;

    let position = cubie.position;
    let orientation = cubie.orientation;
    for (let i = 0; i < turns; i++) {
      position = rotateQuarter(position);
      orientation = {
        x: rotateQuarter(orientation.x),
        y: rotateQuarter(orientation.y),
        z: rotateQuarter(orientation.z),
      };
    }

    return { ...cubie, position, orientation };
  });

  return { cubies };
}

export function applyMoves(state: CubeState, moves: Move[]): CubeState {
  return moves.reduce(applyMove, state);
}

export const FACES: Face[] = ["R", "L", "U", "D", "F", "B"];

/** The 18 face turns (no whole-cube rotations): what scrambles and the 3×3 solver use. */
export const ALL_MOVES: Move[] = FACES.flatMap((face) => [
  face,
  `${face}'` as Move,
  `${face}2` as Move,
]);

export const ROTATIONS: Rotation[] = ["x", "y", "z"];

const withModifiers = (turns: Turn[]): Move[] =>
  turns.flatMap((turn) => [turn, `${turn}'` as Move, `${turn}2` as Move]);

/** Face turns and whole-cube rotations: what the 2×2 reads. */
export const EVERY_MOVE: Move[] = withModifiers([...FACES, ...ROTATIONS]);

export const SLICES: Slice[] = ["M", "E", "S"];
export const WIDES: Wide[] = ["r", "l", "u", "d", "f", "b"];

/** Every move the engine understands: face turns, middle layers, wide turns and rotations. */
export const ALGORITHM_MOVES: Move[] = withModifiers([...FACES, ...SLICES, ...WIDES, ...ROTATIONS]);
