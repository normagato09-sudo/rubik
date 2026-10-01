/**
 * Pyraminx moves on its 36 stickers. U, L, R and B turn the big layer of
 * that tip (the tip, its center and three edges); u, l, r and b only the
 * tip. A turn is a third of a full turn (120°), clockwise looking at the
 * tip from outside, like the notation sheet; ' turns the other way. There
 * are no double turns: two turns one way are one turn the other way.
 *
 * The permutations are not written by hand: each turn rotates the stickers
 * of its layer around the tip's axis and sees where they land.
 */
import {
  PYRA_FACES,
  PYRA_STICKERS,
  PYRA_VERTICES,
  STICKER_CENTERS,
  VERTEX_POSITION,
  dot,
  rotate,
  type PyraFace,
  type PyraVertex,
  type Vec3,
} from "./geometry";

export type PyraColor = "green" | "red" | "blue" | "yellow";

/** Solved Pyraminx held the standard way. */
export const SOLVED_FACE_COLORS: Record<PyraFace, PyraColor> = {
  F: "green",
  L: "red",
  R: "blue",
  D: "yellow",
};

export const PYRA_COLORS: PyraColor[] = ["green", "red", "blue", "yellow"];

export type PyraMove =
  | "U" | "U'" | "L" | "L'" | "R" | "R'" | "B" | "B'"
  | "u" | "u'" | "l" | "l'" | "r" | "r'" | "b" | "b'";

export const BIG_MOVES: PyraMove[] = ["U", "U'", "L", "L'", "R", "R'", "B", "B'"];
export const TIP_MOVES: PyraMove[] = ["u", "u'", "l", "l'", "r", "r'", "b", "b'"];
export const ALL_PYRA_MOVES: PyraMove[] = [...BIG_MOVES, ...TIP_MOVES];

export type PyraState = readonly PyraColor[];

export function solvedPyraminx(): PyraColor[] {
  return PYRA_FACES.flatMap((face) => Array<PyraColor>(9).fill(SOLVED_FACE_COLORS[face]));
}

export function isSolvedPyraminx(state: readonly (PyraColor | null)[]): boolean {
  return PYRA_FACES.every((_, f) => {
    const face = state.slice(f * 9, f * 9 + 9);
    return face.every((color) => color !== null && color === face[0]);
  });
}

/** The tip a move turns around, and whether it is the whole layer or just the tip. */
export function parsePyraMove(move: PyraMove): { vertex: PyraVertex; tipOnly: boolean; clockwise: boolean } {
  return {
    vertex: move[0].toUpperCase() as PyraVertex,
    tipOnly: move[0] === move[0].toLowerCase(),
    clockwise: !move.endsWith("'"),
  };
}

export const inversePyraMove = (move: PyraMove): PyraMove =>
  (move.endsWith("'") ? move[0] : `${move}'`) as PyraMove;

export function invertPyraMoves(moves: readonly PyraMove[]): PyraMove[] {
  return [...moves].reverse().map(inversePyraMove);
}

const unit = (v: Vec3): Vec3 => {
  const length = Math.hypot(...v);
  return [v[0] / length, v[1] / length, v[2] / length];
};

export const VERTEX_AXIS: Record<PyraVertex, Vec3> = Object.fromEntries(
  PYRA_VERTICES.map((v) => [v, unit(VERTEX_POSITION[v])]),
) as Record<PyraVertex, Vec3>;

/**
 * Along a tip's axis the Pyraminx is cut in three equal slices, from the
 * opposite face (-1/3) to the tip (1): the tip is past 5/9, its big layer
 * past 1/9. No sticker center ever falls on a cut.
 */
const TIP_CUT = 5 / 9;
const LAYER_CUT = 1 / 9;

/** Whether sticker `index` turns with `move`. */
export function turnsWith(move: PyraMove, index: number): boolean {
  const { vertex, tipOnly } = parsePyraMove(move);
  return dot(STICKER_CENTERS[index], VERTEX_AXIS[vertex]) > (tipOnly ? TIP_CUT : LAYER_CUT);
}

/** Signed angle of a move around its tip's axis (right-handed): clockwise seen from the tip is negative. */
export const moveAngle = (move: PyraMove) => ((parsePyraMove(move).clockwise ? -1 : 1) * 2 * Math.PI) / 3;

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
  if (bestDistance > 1e-6) throw new Error("Pyraminx: a sticker did not land on another");
  return best;
}

/** For each move: where each sticker goes (`to[i]` is the new place of the sticker at i). */
export const MOVE_PERMUTATION: Record<PyraMove, number[]> = Object.fromEntries(
  ALL_PYRA_MOVES.map((move) => {
    const axis = VERTEX_AXIS[parsePyraMove(move).vertex];
    const angle = moveAngle(move);
    const to = Array.from({ length: PYRA_STICKERS }, (_, i) =>
      turnsWith(move, i) ? nearestSticker(rotate(STICKER_CENTERS[i], axis, angle)) : i,
    );
    return [move, to];
  }),
) as Record<PyraMove, number[]>;

export function applyPyraMove<T>(state: readonly T[], move: PyraMove): T[] {
  const to = MOVE_PERMUTATION[move];
  const next = [...state];
  state.forEach((color, i) => {
    next[to[i]] = color;
  });
  return next;
}

export function applyPyraMoves<T>(state: readonly T[], moves: readonly PyraMove[]): T[] {
  return moves.reduce<T[]>((current, move) => applyPyraMove(current, move), [...state]);
}

/**
 * Reads an algorithm as written in the sheets: "(R' L R L') U", "R U R')",
 * with ’ or '. A double turn is allowed where a sheet writes one: "L2'" is
 * two L' (which is the same as one L).
 */
export function parsePyraAlgorithm(text: string): PyraMove[] {
  return text
    .replace(/[()]/g, " ")
    .replace(/[’´`]/g, "'")
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .flatMap((token) => {
      const match = token.match(/^([ULRBulrb])(2?)('?)$/);
      if (!match) throw new Error(`Movimiento no válido: ${token}`);
      const move = `${match[1]}${match[3]}` as PyraMove;
      return match[2] ? [move, move] : [move];
    });
}
