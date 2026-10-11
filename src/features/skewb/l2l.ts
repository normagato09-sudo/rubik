/**
 * The last two layers of the Skewb, once the first side is solved: what
 * Sarah's intermediate and advanced variations solve. With the first side
 * in place the top corners can only be twisted (9 ways) and the five
 * other centers can be anywhere (60 ways): 540 positions.
 *
 * Positions are grouped the way the guides do: by the top corners' shape
 * — Pi (all four twisted) or Peanut (two opposite ones twisted) — and by
 * where the yellow center is, looking at the shape from the same side
 * (`describeTop`). Two positions are the same case when one is the other
 * seen from another side (`caseKey`: the whole Skewb turned with y).
 */
import type { CubeColor } from "@/features/cube/types";
import { SKEWB_CORNERS, SKEWB_FACES, type SkewbFace } from "./geometry";
import { applySarahTokens, type SarahToken } from "./moves";
import { CORNER_STICKERS } from "./search";
import { CENTERS, FIRST_SIDE, SARAH_SOLVED, sarahTokens } from "./sarah";

const key = (state: readonly CubeColor[]) => state.join();

/**
 * The Skewb turned with y and recolored, so that it is the same position
 * seen from the side that was on the right: what a case looks like held
 * another way.
 */
export function seenFromRight(state: readonly CubeColor[]): CubeColor[] {
  const turned = applySarahTokens(state, ["y"]);
  const turnedSolved = applySarahTokens(SARAH_SOLVED, ["y"]);
  const recolor = new Map(CENTERS.map((c) => [turnedSolved[c], SARAH_SOLVED[c]]));
  return turned.map((color) => recolor.get(color)!);
}

const sides = (state: readonly CubeColor[]) => {
  const all = [state];
  for (let k = 0; k < 3; k++) all.push(seenFromRight(all[all.length - 1]));
  return all;
};

/** The same for every way of looking at one case (the smallest of the four). */
export const caseKey = (state: readonly CubeColor[]) => sides(state).map(key).sort()[0];

/** Every position with the first side solved, from the sledgehammer and hedgeslammer seen from each side. */
export const L2L_POSITIONS: CubeColor[][] = (() => {
  const moves: SarahToken[][] = (["", "y", "y2", "y'"] as const).flatMap((turn) => {
    const pre = turn ? ([turn] as SarahToken[]) : [];
    const back = turn ? ([turn === "y" ? "y'" : turn === "y'" ? "y" : "y2"] as SarahToken[]) : [];
    return [sarahTokens("S"), sarahTokens("H")].map((alg) => [...pre, ...alg, ...back]);
  });
  const found = new Map([[key(SARAH_SOLVED), SARAH_SOLVED]]);
  const queue = [SARAH_SOLVED];
  for (let head = 0; head < queue.length; head++) {
    for (const move of moves) {
      const next = applySarahTokens(queue[head], move);
      if (!found.has(key(next))) {
        found.set(key(next), next);
        queue.push(next);
      }
    }
  }
  return queue;
})();

export const keepsFirstSide = (state: readonly CubeColor[]) => FIRST_SIDE.every((i) => state[i] === SARAH_SOLVED[i]);

/** Top corners, going round from the front one: UFR, UBR, UBL, UFL. */
export const TOP_CORNER_NAMES = ["UFR", "UBR", "UBL", "UFL"] as const;
const TOP = TOP_CORNER_NAMES.map((corner) => SKEWB_CORNERS.indexOf(corner));

/** How each top corner is twisted: 0 yellow up, 1 and 2 turned (clockwise order). */
export const topTwists = (state: readonly CubeColor[]) =>
  TOP.map((corner) => CORNER_STICKERS[corner].findIndex((i) => state[i] === "yellow"));

export const yellowCenter = (state: readonly CubeColor[]): SkewbFace =>
  SKEWB_FACES[CENTERS.findIndex((i) => state[i] === "yellow")];

export type TopShape = "solved" | "pi" | "peanut";

export function topShape(state: readonly CubeColor[]): TopShape {
  const twisted = topTwists(state).filter((t) => t !== 0).length;
  return twisted === 0 ? "solved" : twisted === 4 ? "pi" : "peanut";
}

/**
 * The shape of the top and where the yellow center is, looked at from the
 * side that puts the shape in one fixed way (so "R" is always the same
 * place relative to the shape). For L5C (corners solved) every side is
 * the same, so it is where the yellow center is as held.
 */
export function describeTop(state: readonly CubeColor[]): { shape: TopShape; center: SkewbFace; turns: number } {
  const shape = topShape(state);
  if (shape === "solved") return { shape, center: yellowCenter(state), turns: 0 };
  const views = sides(state);
  let best = 0;
  views.forEach((view, k) => {
    if (topTwists(view).join() < topTwists(views[best]).join()) best = k;
  });
  return { shape, center: yellowCenter(views[best]), turns: best };
}

// ---------- the shortest algorithm, for the cases the guides leave out ----------

const MOVES: SarahToken[] = ["F", "F'", "R", "R'", "L", "L'"];

/** Positions up to `depth` moves away from `start`, each with the moves that reach it. */
function around(start: readonly CubeColor[], depth: number): Map<string, SarahToken[]> {
  const reached = new Map<string, SarahToken[]>([[key(start), []]]);
  let frontier: { state: CubeColor[]; path: SarahToken[] }[] = [{ state: [...start], path: [] }];
  for (let d = 0; d < depth; d++) {
    const next: typeof frontier = [];
    for (const { state, path } of frontier) {
      for (const move of MOVES) {
        if (path.length > 0 && path[path.length - 1][0] === move[0]) continue;
        const moved = applySarahTokens(state, [move]);
        const k = key(moved);
        if (reached.has(k)) continue;
        reached.set(k, [...path, move]);
        next.push({ state: moved, path: [...path, move] });
      }
    }
    frontier = next;
  }
  return reached;
}

let fromSolved: Map<string, SarahToken[]> | null = null;
const HALF = 6;

const inverse = (move: SarahToken) => (move.endsWith("'") ? move[0] : `${move}'`) as SarahToken;

/**
 * The fewest of Sarah's moves (F, R and L, no turning the Skewb) that
 * solve `state`: half the way from each end. None of them moves the
 * bottom back left corner, so the Skewb ends up held as it started.
 */
export function shortestSarah(state: readonly CubeColor[]): SarahToken[] {
  fromSolved ??= around(SARAH_SOLVED, HALF);
  const ahead = around(state, HALF);
  let best: SarahToken[] | null = null;
  for (const [k, path] of ahead) {
    const back = fromSolved.get(k);
    if (!back) continue;
    const solution = [...path, ...[...back].reverse().map(inverse)];
    if (!best || solution.length < best.length) best = solution;
  }
  if (!best) throw new Error("Sin solución en 12 giros");
  return best;
}
