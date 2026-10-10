/**
 * Skewb moves on its 30 stickers. Every move turns half of the Skewb —
 * the corner it is named after, its three neighbouring corners and the
 * three centers around it — a third of a full turn (120°), clockwise
 * looking at that corner from outside; ' turns the other way.
 *
 * Two notations, as in the sources:
 * - WCA (scrambles, Regulation 12a): looking at the up-front-right corner
 *   (U, F and R in sight), R turns the bottom-right corner seen (DBR), U
 *   the top one (UBL), L the bottom-left one (DFL) and B the hidden one at
 *   the back (DBL). None of them moves the up-front-right corner.
 * - Sarah's (the methods of Aprender, sarah.cubing.net): the three top
 *   corners in sight — F the one in front (UFR), R the one on the right
 *   (UBR) and L the one on the left (UFL) — and x, y and z, which turn the
 *   whole Skewb like the R, U and F faces of a 3×3.
 *
 * The permutations are not written by hand: each move rotates the
 * stickers of its half around the corner's axis and sees where they land.
 */
import {
  CORNER_POSITION,
  SKEWB_FACES,
  SKEWB_STICKERS,
  STICKER_CENTERS,
  dot,
  rotate,
  type SkewbCorner,
  type SkewbFace,
  type Vec3,
} from "./geometry";
import type { CubeColor } from "@/features/cube/types";

/** Solved Skewb held the WCA way. */
export const SOLVED_FACE_COLORS: Record<SkewbFace, CubeColor> = {
  U: "white",
  R: "red",
  F: "green",
  D: "yellow",
  L: "orange",
  B: "blue",
};

export function solvedSkewb(): CubeColor[] {
  return SKEWB_FACES.flatMap((face) => Array<CubeColor>(5).fill(SOLVED_FACE_COLORS[face]));
}

/** Every face one color (in any orientation of the whole Skewb). */
export function isSolvedSkewb(state: readonly (CubeColor | null)[]): boolean {
  return SKEWB_FACES.every((_, f) => {
    const face = state.slice(f * 5, f * 5 + 5);
    return face.every((color) => color !== null && color === face[0]);
  });
}

// ---------- WCA notation ----------

export type SkewbMove = "R" | "R'" | "U" | "U'" | "L" | "L'" | "B" | "B'";

export const ALL_SKEWB_MOVES: SkewbMove[] = ["R", "R'", "U", "U'", "L", "L'", "B", "B'"];

/** The corner each WCA letter turns. */
export const WCA_CORNER: Record<"R" | "U" | "L" | "B", SkewbCorner> = { R: "DBR", U: "UBL", L: "DFL", B: "DBL" };

export const inverseSkewbMove = (move: SkewbMove): SkewbMove =>
  (move.endsWith("'") ? move[0] : `${move}'`) as SkewbMove;

export function invertSkewbMoves(moves: readonly SkewbMove[]): SkewbMove[] {
  return [...moves].reverse().map(inverseSkewbMove);
}

// ---------- Sarah's notation and whole-Skewb turns ----------

export type SkewbRotation = "x" | "x'" | "x2" | "y" | "y'" | "y2" | "z" | "z'" | "z2";
export type SarahMove = "F" | "F'" | "R" | "R'" | "L" | "L'";

/** The corner each of Sarah's letters turns: the top corners in sight. */
export const SARAH_CORNER: Record<"F" | "R" | "L", SkewbCorner> = { F: "UFR", R: "UBR", L: "UFL" };

export const ROTATIONS: SkewbRotation[] = ["x", "x'", "x2", "y", "y'", "y2", "z", "z'", "z2"];

/**
 * A turn as the engine sees it: a corner turned (clockwise or not) or the
 * whole Skewb turned. Both notations are read into this.
 */
export type SkewbTurn =
  | { kind: "corner"; corner: SkewbCorner; clockwise: boolean }
  | { kind: "rotation"; rotation: SkewbRotation };

const unit = (v: Vec3): Vec3 => {
  const length = Math.hypot(...v);
  return [v[0] / length, v[1] / length, v[2] / length];
};

export const CORNER_AXIS: Record<SkewbCorner, Vec3> = Object.fromEntries(
  Object.entries(CORNER_POSITION).map(([corner, position]) => [corner, unit(position)]),
) as Record<SkewbCorner, Vec3>;

const ROTATION_AXIS: Record<"x" | "y" | "z", Vec3> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

/** The axis a turn goes around, its signed angle (right-handed) and whether sticker `index` turns. */
export function turnGeometry(turn: SkewbTurn): { axis: Vec3; angle: number; turns: (index: number) => boolean } {
  if (turn.kind === "corner") {
    const axis = CORNER_AXIS[turn.corner];
    // Clockwise seen from the corner is negative around an axis pointing out of it.
    return {
      axis,
      angle: ((turn.clockwise ? -1 : 1) * 2 * Math.PI) / 3,
      turns: (index) => dot(STICKER_CENTERS[index], axis) > 0,
    };
  }
  const { rotation } = turn;
  const quarters = rotation.endsWith("2") ? 2 : rotation.endsWith("'") ? -1 : 1;
  return { axis: ROTATION_AXIS[rotation[0] as "x" | "y" | "z"], angle: (-quarters * Math.PI) / 2, turns: () => true };
}

function nearestSticker(point: Vec3): number {
  let best = 0;
  let bestDistance = Infinity;
  STICKER_CENTERS.forEach((center, i) => {
    const d = Math.hypot(center[0] - point[0], center[1] - point[1], center[2] - point[2]);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  });
  if (bestDistance > 1e-6) throw new Error("Skewb: a sticker did not land on another");
  return best;
}

const turnKey = (turn: SkewbTurn) =>
  turn.kind === "corner" ? `${turn.corner}${turn.clockwise ? "" : "'"}` : turn.rotation;

const permutations = new Map<string, number[]>();

/** Where each sticker goes with `turn` (`to[i]` is the new place of the sticker at i). */
export function turnPermutation(turn: SkewbTurn): number[] {
  const key = turnKey(turn);
  let to = permutations.get(key);
  if (!to) {
    const { axis, angle, turns } = turnGeometry(turn);
    to = Array.from({ length: SKEWB_STICKERS }, (_, i) =>
      turns(i) ? nearestSticker(rotate(STICKER_CENTERS[i], axis, angle)) : i,
    );
    permutations.set(key, to);
  }
  return to;
}

export function applySkewbTurns<T>(state: readonly T[], turns: readonly SkewbTurn[]): T[] {
  return turns.reduce<T[]>((current, turn) => {
    const to = turnPermutation(turn);
    const next = [...current];
    current.forEach((color, i) => {
      next[to[i]] = color;
    });
    return next;
  }, [...state]);
}

/** A WCA move as the engine sees it. */
export const wcaTurn = (move: SkewbMove): SkewbTurn => ({
  kind: "corner",
  corner: WCA_CORNER[move[0] as "R" | "U" | "L" | "B"],
  clockwise: !move.endsWith("'"),
});

export const applySkewbMoves = <T>(state: readonly T[], moves: readonly SkewbMove[]): T[] =>
  applySkewbTurns(state, moves.map(wcaTurn));

/** Splits an algorithm into its tokens: no brackets ( ), and ’ read as '. */
const tokensOf = (text: string) =>
  text
    .replace(/[()]/g, " ")
    .replace(/[’´`]/g, "'")
    .split(/\s+/)
    .filter((token) => token.length > 0);

/** Reads a WCA scramble: "R U' L B' ...". */
export function parseSkewbScramble(text: string): SkewbMove[] {
  return tokensOf(text).map((token) => {
    if (!/^[RULB]'?$/.test(token)) throw new Error(`Movimiento no válido: ${token}`);
    return token as SkewbMove;
  });
}

export type SarahToken = SarahMove | SkewbRotation;

/** Reads an algorithm in Sarah's notation: "R' F R F'", "y' L F' L' F". */
export function parseSarahAlgorithm(text: string): SarahToken[] {
  return tokensOf(text).map((token) => {
    if (/^[FRL]'?$/.test(token) || /^[xyz](2|')?$/.test(token)) return token as SarahToken;
    throw new Error(`Movimiento no válido: ${token}`);
  });
}

export const sarahTurn = (token: SarahToken): SkewbTurn =>
  /^[xyz]/.test(token)
    ? { kind: "rotation", rotation: token as SkewbRotation }
    : { kind: "corner", corner: SARAH_CORNER[token[0] as "F" | "R" | "L"], clockwise: !token.endsWith("'") };

export const applySarahTokens = <T>(state: readonly T[], tokens: readonly SarahToken[]): T[] =>
  applySkewbTurns(state, tokens.map(sarahTurn));
