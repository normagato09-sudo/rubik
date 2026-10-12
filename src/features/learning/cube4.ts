/**
 * Tools for the 4×4 cases of Aprender: the 96 stickers of a 4×4 read from
 * the 3D engine (features/cube, N×N), each move as a permutation of those
 * stickers, and a search for the shortest way to reach a goal with the
 * moves a step allows. Held like the 3×3 sheets: yellow up, white down,
 * green front (RUBIKO's solved cube turned over with z2).
 *
 * The 4×4 has no fixed centers and its four center pieces of one color
 * look the same, so every goal here is about colors: "these stickers are
 * this color", never about which piece is where.
 */
import { parseBigAlgorithm } from "@/features/cube/algorithm";
import { createSolvedCube, layerCoords } from "@/features/cube/model";
import { applyCubeMoves, layerTurn, type BigMove } from "@/features/cube/moves";
import type { CubeColor, CubeState, StickerFace, Vec3 } from "@/features/cube/types";

export type Face4 = "U" | "R" | "F" | "D" | "L" | "B";
export const FACES_4: Face4[] = ["U", "R", "F", "D", "L", "B"];

const COORDS = layerCoords(4); // -3, -1, 1, 3
const OUTER = 3;

/**
 * How each face is read, row by row (like the 3×3 solver's facelets): its
 * normal, the direction of its columns and of its rows. U has the back at
 * the top, D the front; the sides have U at the top.
 */
const FACE_AXES: Record<Face4, { normal: Vec3; right: Vec3; down: Vec3 }> = {
  U: { normal: [0, 1, 0], right: [1, 0, 0], down: [0, 0, 1] },
  R: { normal: [1, 0, 0], right: [0, 0, -1], down: [0, -1, 0] },
  F: { normal: [0, 0, 1], right: [1, 0, 0], down: [0, -1, 0] },
  D: { normal: [0, -1, 0], right: [1, 0, 0], down: [0, 0, -1] },
  L: { normal: [-1, 0, 0], right: [0, 0, 1], down: [0, -1, 0] },
  B: { normal: [0, 0, -1], right: [-1, 0, 0], down: [0, -1, 0] },
};

export interface Sticker4 {
  face: Face4;
  row: number;
  col: number;
  /** Where its piece is. */
  position: Vec3;
  /** Which way it faces. */
  normal: Vec3;
}

/** The 96 stickers: U, R, F, D, L, B, each face row by row from the top left (16 each). */
export const STICKERS_4: Sticker4[] = FACES_4.flatMap((face) => {
  const { normal, right, down } = FACE_AXES[face];
  const list: Sticker4[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      // Columns go along `right` and rows along `down`, from the far side.
      const c = COORDS[col];
      const r = COORDS[row];
      const position = [0, 1, 2].map((k) => normal[k] * OUTER + right[k] * c + down[k] * r) as unknown as Vec3;
      list.push({ face, row, col, position, normal });
    }
  }
  return list;
});

/** Index of a sticker: face, row and column 0–3. */
export const sticker4 = (face: Face4, row: number, col: number) => FACES_4.indexOf(face) * 16 + row * 4 + col;

const key = (position: Vec3, normal: Vec3) => `${position.join(",")}|${normal.join(",")}`;
const INDEX = new Map(STICKERS_4.map((s, i) => [key(s.position, s.normal), i]));

const LOCAL: Record<StickerFace, Vec3> = {
  "+x": [1, 0, 0],
  "-x": [-1, 0, 0],
  "+y": [0, 1, 0],
  "-y": [0, -1, 0],
  "+z": [0, 0, 1],
  "-z": [0, 0, -1],
};

/** Where each sticker of each piece is, as an index into STICKERS_4. */
function stickerIndices(state: CubeState): { id: string; face: StickerFace; index: number; color: CubeColor }[] {
  return state.cubies.flatMap((cubie) =>
    cubie.stickers.map((s) => {
      const [a, b, c] = LOCAL[s.face];
      const { x, y, z } = cubie.orientation;
      const normal = [0, 1, 2].map((k) => a * x[k] + b * y[k] + c * z[k]) as unknown as Vec3;
      return { id: cubie.id, face: s.face, index: INDEX.get(key(cubie.position, normal))!, color: s.color };
    }),
  );
}

/** The 96 sticker colors of a 4×4 state. */
export function colors4(state: CubeState): CubeColor[] {
  const colors: CubeColor[] = new Array(96);
  for (const { index, color } of stickerIndices(state)) colors[index] = color;
  return colors;
}

/** The sheets hold the cube yellow up: RUBIKO's solved cube turned over. */
export const SHEET_FRAME_4: BigMove[] = ["z2"];

/** The solved 4×4 held like the sheets, as 96 colors. */
export const SOLVED_4: readonly CubeColor[] = colors4(applyCubeMoves(createSolvedCube(4), SHEET_FRAME_4, 4));

// ---------- moves as sticker permutations ----------

/** For each sticker after the move, which sticker was there before. */
export type Perm = Int8Array;

const permCache = new Map<string, Perm>();

/** A move as a permutation of the 96 stickers, read from the engine. */
export function movePerm(move: BigMove): Perm {
  let perm = permCache.get(move);
  if (perm) return perm;
  layerTurn(move, 4);
  const solved = createSolvedCube(4);
  const before = new Map(stickerIndices(solved).map((s) => [`${s.id}${s.face}`, s.index]));
  perm = new Int8Array(96);
  for (const s of stickerIndices(applyCubeMoves(solved, [move], 4))) perm[s.index] = before.get(`${s.id}${s.face}`)!;
  permCache.set(move, perm);
  return perm;
}

export function applyPerm<T>(colors: readonly T[], perm: Perm): T[] {
  const next: T[] = new Array(96);
  for (let i = 0; i < 96; i++) next[i] = colors[perm[i]];
  return next;
}

/** Colors after a sequence of moves. */
export function apply4(colors: readonly CubeColor[], moves: readonly BigMove[]): CubeColor[] {
  return moves.reduce<CubeColor[]>((current, move) => applyPerm(current, movePerm(move)), [...colors]);
}

/** Reads a 4×4 algorithm ("Rw U2 x r2..."). */
export const parse4 = (algorithm: string) => parseBigAlgorithm(algorithm, 4);

export function inverse4(moves: readonly BigMove[]): BigMove[] {
  return [...moves].reverse().map((move) => (move.endsWith("2") ? move : move.endsWith("'") ? move.slice(0, -1) : `${move}'`) as BigMove);
}

/** The case an algorithm solves: the algorithm undone from the solved cube held like the sheets. */
export const caseColors4 = (algorithm: string, from: readonly CubeColor[] = SOLVED_4) => apply4(from, inverse4(parse4(algorithm)));

// ---------- goals ----------

/** Stickers that must show the color they have in the solved cube held like the sheets. */
export type Goal4 = readonly number[];

export const reaches = (colors: readonly CubeColor[], goal: Goal4, target: readonly CubeColor[] = SOLVED_4) =>
  goal.every((i) => colors[i] === target[i]);

/** The 4 center stickers of a face. */
export const centerOf = (face: Face4): number[] => [sticker4(face, 1, 1), sticker4(face, 1, 2), sticker4(face, 2, 1), sticker4(face, 2, 2)];

/** The stickers of the pieces at the given positions. */
export function stickersAtPositions(positions: readonly Vec3[]): number[] {
  return STICKERS_4.flatMap((s, i) => (positions.some((p) => p.every((c, k) => c === s.position[k])) ? [i] : []));
}

/**
 * The two pieces (wings) of a 4×4 edge, by the two faces it joins:
 * edgeOf("U", "F") is the up-front edge.
 */
export function edgeOf(a: Face4, b: Face4): Vec3[] {
  const na = FACE_AXES[a].normal;
  const nb = FACE_AXES[b].normal;
  const along = [0, 1, 2].find((k) => na[k] === 0 && nb[k] === 0)!;
  return [-1, 1].map((c) => [0, 1, 2].map((k) => (k === along ? c : (na[k] + nb[k]) * OUTER)) as unknown as Vec3);
}

/** The 8 stickers of the corners of a layer (with one face). */
export const cornersOf = (face: Face4): Vec3[] => {
  const n = FACE_AXES[face].normal;
  const axis = n.findIndex((c) => c !== 0);
  const out: Vec3[] = [];
  for (const a of [-OUTER, OUTER]) {
    for (const b of [-OUTER, OUTER]) {
      const p = [0, 0, 0];
      p[axis] = n[axis] * OUTER;
      const others = [0, 1, 2].filter((k) => k !== axis);
      p[others[0]] = a;
      p[others[1]] = b;
      out.push(p as unknown as Vec3);
    }
  }
  return out;
};

// ---------- edge pieces (wings) ----------

/** The 24 edge pieces of a 4×4 (two per edge), each with its two stickers. */
export const WINGS_4: { position: Vec3; stickers: [number, number] }[] = (() => {
  const byPosition = new Map<string, number[]>();
  STICKERS_4.forEach((s, i) => {
    if (s.position.filter((c) => Math.abs(c) === OUTER).length !== 2) return;
    const k = s.position.join(",");
    byPosition.set(k, [...(byPosition.get(k) ?? []), i]);
  });
  return [...byPosition.values()].map((stickers) => ({
    position: STICKERS_4[stickers[0]].position,
    stickers: stickers as [number, number],
  }));
})();

/** Which wing is at a position. */
export const wingAt = (position: Vec3) => WINGS_4.findIndex((w) => w.position.every((c, k) => c === position[k]));

/**
 * Where each wing can be and which way it faces there, read from the
 * engine: a 4×4 wing can never be flipped in place, so at each place it
 * has a single way to sit. `PLACEMENT[w][t]` is the stickers of place t
 * that show the first and the second sticker of wing w.
 */
const PLACEMENT: [number, number][][] = (() => {
  const quarter: BigMove[] = ["U", "D", "R", "L", "F", "B", "u", "d", "r", "l", "f", "b"];
  const perms = quarter.map(movePerm);
  return WINGS_4.map((wing) => {
    const seen = new Map<string, [number, number]>([[wing.stickers.join(","), wing.stickers]]);
    const queue: [number, number][] = [wing.stickers];
    while (queue.length > 0) {
      const [a, b] = queue.shift()!;
      for (const perm of perms) {
        const next: [number, number] = [perm.indexOf(a), perm.indexOf(b)];
        const k = next.join(",");
        if (!seen.has(k)) {
          seen.set(k, next);
          queue.push(next);
        }
      }
    }
    return WINGS_4.map((place) => [...seen.values()].find(([a]) => place.stickers.includes(a))!);
  });
})();

/**
 * `colors` with some wings moved: each `[piece, place]` puts the wing
 * whose home is `piece` (with its colors in the solved cube held like the
 * sheets) at `place`, facing the only way it can there.
 */
export function withWings(colors: readonly CubeColor[], moves: readonly [number, number][]): CubeColor[] {
  const next = [...colors];
  for (const [piece, place] of moves) {
    const [a, b] = PLACEMENT[piece][place];
    next[a] = SOLVED_4[WINGS_4[piece].stickers[0]];
    next[b] = SOLVED_4[WINGS_4[piece].stickers[1]];
  }
  return next;
}

/** The 12 edges, each as its two wings' stickers matched face by face: [a1, b1, a2, b2]. */
export const EDGES_4: [number, number, number, number][] = WINGS_4.flatMap((wing) => {
  const axis = wing.position.findIndex((c) => Math.abs(c) !== OUTER);
  if (wing.position[axis] !== -1) return [];
  const twin = WINGS_4[wingAt(wing.position.map((c, k) => (k === axis ? 1 : c)) as unknown as Vec3)];
  const normal = (i: number) => STICKERS_4[i].normal.join(",");
  const [a, b] = wing.stickers;
  return [[a, twin.stickers.find((t) => normal(t) === normal(a))!, b, twin.stickers.find((t) => normal(t) === normal(b))!]];
});

/** Whether every edge has its two wings matching (the colors on each face the same). */
export const allPaired = (colors: readonly CubeColor[]) =>
  EDGES_4.every(([a1, b1, a2, b2]) => colors[a1] === colors[b1] && colors[a2] === colors[b2]);

/** Whether every face has its 4 center stickers of one color, the color of the solved cube held like the sheets. */
export const centersSolved = (colors: readonly CubeColor[], target: readonly CubeColor[] = SOLVED_4) =>
  FACES_4.every((face) => centerOf(face).every((i) => colors[i] === target[i]));

// ---------- search ----------

/** Turns that move the same layers the same way are one "turn" for the search (R, R', R2). */
const base = (move: BigMove) => move.replace(/['2]$/, "");

/** Same axis, so the order between them could be swapped: searched only one way. */
function axisOf(move: BigMove): number {
  return layerTurn(move, 4).axis;
}

/**
 * The shortest sequences (fewest moves) of `moves` that take `start` to
 * `goal`, up to `maxDepth` moves. Returns every one of that length, in
 * the order of `moves`, or [] if there is none.
 */
export function shortest4(
  start: readonly CubeColor[],
  goal: Goal4 | ((colors: readonly CubeColor[]) => boolean),
  moves: readonly BigMove[],
  maxDepth: number,
): BigMove[][] {
  const done = typeof goal === "function" ? goal : (colors: readonly CubeColor[]) => reaches(colors, goal);
  if (done(start)) return [[]];
  const perms = moves.map(movePerm);
  const bases = moves.map(base);
  const axes = moves.map(axisOf);
  const found: BigMove[][] = [];
  const path: number[] = [];
  const search = (colors: readonly CubeColor[], depth: number) => {
    if (depth === 0) {
      if (done(colors)) found.push(path.map((i) => moves[i]));
      return;
    }
    const last = path[path.length - 1];
    for (let i = 0; i < moves.length; i++) {
      if (last !== undefined) {
        if (bases[i] === bases[last]) continue;
        // Moves on one axis commute: keep a single order (by their index in `moves`).
        if (axes[i] === axes[last] && bases.indexOf(bases[i]) < bases.indexOf(bases[last])) continue;
      }
      path.push(i);
      search(applyPerm(colors, perms[i]), depth - 1);
      path.pop();
    }
  };
  for (let depth = 1; depth <= maxDepth && found.length === 0; depth++) search(start, depth);
  return found;
}

/** Every turn of `bases` with ', 2 and plain: ["U", "Rw"] → U U' U2 Rw Rw' Rw2. */
export const withTurns = (bases: readonly string[]): BigMove[] => bases.flatMap((b) => [b, `${b}'`, `${b}2`] as BigMove[]);
