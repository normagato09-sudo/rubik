/**
 * The Pyraminx's pieces as groups of stickers: 4 tips and 4 centers
 * (3 stickers each, one per face around their tip) and 6 edges (2 each).
 * Tips and centers never leave their place, they only twist; edges move.
 *
 * A tip's or center's stickers are listed in the order its own tip turn
 * (U for the top one) carries them round, and a tip's k-th sticker is on
 * the same face as its center's k-th sticker.
 */
import {
  OPPOSITE_VERTEX,
  PYRA_FACES,
  PYRA_STICKERS,
  PYRA_VERTICES,
  STICKER_CENTERS,
  STICKER_KIND,
  faceOf,
  nearestVertex,
  type PyraFace,
  type PyraVertex,
} from "./geometry";
import { MOVE_PERMUTATION, PYRA_COLORS, type PyraColor, type PyraMove } from "./moves";

const ALL = Array.from({ length: PYRA_STICKERS }, (_, i) => i);
const ofKind = (kind: string) => ALL.filter((i) => STICKER_KIND[i % 9] === kind);

/** The 3 stickers of `vertex`'s piece of `kind`, in the order its turn carries them. */
function around(kind: "tip" | "center", vertex: PyraVertex): number[] {
  const own = ofKind(kind).filter((i) => nearestVertex(STICKER_CENTERS[i]) === vertex);
  const turn = MOVE_PERMUTATION[vertex as PyraMove];
  const first = own.reduce((lowest, i) => Math.min(lowest, i));
  return [first, turn[first], turn[turn[first]]];
}

export const CENTER_STICKERS: Record<PyraVertex, number[]> = Object.fromEntries(
  PYRA_VERTICES.map((v) => [v, around("center", v)]),
) as Record<PyraVertex, number[]>;

/** Tip stickers, each on the same face as the center sticker with the same position. */
export const TIP_STICKERS: Record<PyraVertex, number[]> = Object.fromEntries(
  PYRA_VERTICES.map((v) => {
    const tip = around("tip", v);
    const start = tip.findIndex((i) => faceOf(i) === faceOf(CENTER_STICKERS[v][0]));
    return [v, [0, 1, 2].map((k) => tip[(start + k) % 3])];
  }),
) as Record<PyraVertex, number[]>;

/** The 6 edges, each as its two stickers (lower index first). */
export const EDGE_STICKERS: [number, number][] = (() => {
  const edges = ofKind("edge");
  const pairs: [number, number][] = [];
  for (const a of edges) {
    const distance = (b: number) => Math.hypot(...STICKER_CENTERS[a].map((x, i) => x - STICKER_CENTERS[b][i]));
    const partner = edges
      .filter((b) => faceOf(b) !== faceOf(a))
      .reduce((best, b) => (distance(b) < distance(best) ? b : best));
    if (a < partner) pairs.push([a, partner]);
  }
  return pairs;
})();

/** The two faces an edge joins (same order as its stickers). */
export const EDGE_FACES = EDGE_STICKERS.map(([a, b]) => [faceOf(a), faceOf(b)] as const);

/** The color each face ends with, known from the centers: the one its opposite center lacks. */
export type FaceColors = Record<PyraFace, PyraColor>;

/**
 * The face colors the centers say, or null if they don't give four
 * different ones (a center with a repeated color, or two centers lacking
 * the same color).
 */
export function faceColorsFromCenters(colors: readonly (PyraColor | null)[]): FaceColors | null {
  const result: Partial<FaceColors> = {};
  for (const face of PYRA_FACES) {
    const center = CENTER_STICKERS[OPPOSITE_VERTEX[face]].map((i) => colors[i]);
    if (center.some((c) => c === null) || new Set(center).size !== 3) return null;
    result[face] = PYRA_COLORS.find((c) => !center.includes(c))!;
  }
  return new Set(Object.values(result)).size === 4 ? (result as FaceColors) : null;
}

/**
 * How far a piece of 3 stickers is turned: `shift` such that the sticker
 * in position k shows the color `expected[(k + shift) % 3]`; null if the
 * colors are not those, in that order (a mirrored piece).
 */
export function twistOf(actual: readonly (PyraColor | null)[], expected: readonly PyraColor[]): 0 | 1 | 2 | null {
  for (const shift of [0, 1, 2] as const) {
    if (actual.every((color, k) => color === expected[(k + shift) % 3])) return shift;
  }
  return null;
}
