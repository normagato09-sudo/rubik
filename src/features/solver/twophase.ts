/**
 * Kociemba's two-phase algorithm for the 3×3.
 *
 * Phase 1 brings the cube into G1 = <U, D, R2, L2, F2, B2> (no twisted
 * corners, no flipped edges, the four E-slice edges inside the E slice).
 * Phase 2 solves it using only G1 moves. Both phases are IDA* searches
 * guided by pruning tables (exact distances in smaller coordinate spaces).
 *
 * Building the tables takes around a second or two, so run it once (see
 * initTables) and preferably off the main thread (solver.worker.ts).
 */
import { MOVE_CUBES, MOVE_NAMES, applyMove, solvedCube, type CubieCube } from "./cubie";

const N_MOVES = 18;
const N_TWIST = 2187; // 3^7
const N_FLIP = 2048; // 2^11
const N_SLICE = 495; // C(12, 4): where the 4 E-slice edges are
const N_PERM8 = 40320; // 8!
const N_SLICE_PERM = 24; // 4!

/** G1 moves as indexes into the 18 moves: U U2 U' D D2 D' R2 L2 F2 B2. */
const PHASE2_MOVES = [0, 1, 2, 9, 10, 11, 4, 13, 7, 16];

const faceOf = (move: number) => Math.floor(move / 3);

/** Skip a move on the same face, or on the opposite face in the "wrong" order. */
function isRedundant(move: number, lastMove: number): boolean {
  if (lastMove === -1) return false;
  const face = faceOf(move);
  const last = faceOf(lastMove);
  return face === last || (face === (last + 3) % 6 && face < last);
}

// ---------- coordinates ----------

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

const getTwist = (cube: CubieCube) => cube.co.slice(0, 7).reduce((acc, twist) => acc * 3 + twist, 0);
const getFlip = (cube: CubieCube) => cube.eo.slice(0, 11).reduce((acc, flip) => acc * 2 + flip, 0);

function setTwist(value: number): CubieCube {
  const cube = solvedCube();
  let sum = 0;
  for (let i = 6; i >= 0; i--) {
    cube.co[i] = value % 3;
    sum += cube.co[i];
    value = Math.floor(value / 3);
  }
  cube.co[7] = (3 - (sum % 3)) % 3;
  return cube;
}

function setFlip(value: number): CubieCube {
  const cube = solvedCube();
  let sum = 0;
  for (let i = 10; i >= 0; i--) {
    cube.eo[i] = value % 2;
    sum += cube.eo[i];
    value = Math.floor(value / 2);
  }
  cube.eo[11] = sum % 2;
  return cube;
}

const isSliceEdge = (edge: number) => edge >= 8;

/** Which 4 of the 12 edge slots hold E-slice edges, as a combination index. */
function getSlice(cube: CubieCube): number {
  let value = 0;
  let k = 3;
  for (let slot = 11; slot >= 0 && k >= 0; slot--) {
    if (isSliceEdge(cube.ep[slot])) {
      value += binomial(slot, k + 1);
      k--;
    }
  }
  return value;
}

function setSlice(value: number): CubieCube {
  const cube = solvedCube();
  const ep = Array<number>(12).fill(-1);
  let k = 3;
  for (let slot = 11; slot >= 0; slot--) {
    if (k >= 0 && value >= binomial(slot, k + 1)) {
      value -= binomial(slot, k + 1);
      ep[slot] = 8 + k;
      k--;
    }
  }
  let other = 0;
  for (let slot = 0; slot < 12; slot++) if (ep[slot] === -1) ep[slot] = other++;
  cube.ep = ep;
  return cube;
}

/** Lehmer code of a permutation of `values` (identity → 0). */
function permIndex(values: number[]): number {
  let index = 0;
  for (let i = 0; i < values.length; i++) {
    let smaller = 0;
    for (let j = i + 1; j < values.length; j++) if (values[j] < values[i]) smaller++;
    index = index * (values.length - i) + smaller;
  }
  return index;
}

function permFromIndex(index: number, n: number): number[] {
  const digits = Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    digits[i] = index % (n - i);
    index = Math.floor(index / (n - i));
  }
  const pool = Array.from({ length: n }, (_, i) => i);
  return digits.map((digit) => pool.splice(digit, 1)[0]);
}

const getCorners = (cube: CubieCube) => permIndex(cube.cp);
const getUdEdges = (cube: CubieCube) => permIndex(cube.ep.slice(0, 8));
const getSlicePerm = (cube: CubieCube) => permIndex(cube.ep.slice(8).map((edge) => edge - 8));

function setCorners(value: number): CubieCube {
  const cube = solvedCube();
  cube.cp = permFromIndex(value, 8);
  return cube;
}

function setUdEdges(value: number): CubieCube {
  const cube = solvedCube();
  cube.ep = [...permFromIndex(value, 8), 8, 9, 10, 11];
  return cube;
}

function setSlicePerm(value: number): CubieCube {
  const cube = solvedCube();
  cube.ep = [0, 1, 2, 3, 4, 5, 6, 7, ...permFromIndex(value, 4).map((edge) => edge + 8)];
  return cube;
}

const SLICE_SOLVED = getSlice(solvedCube());

// ---------- tables ----------

interface Tables {
  twistMove: Uint16Array;
  flipMove: Uint16Array;
  sliceMove: Uint16Array;
  cornersMove: Uint16Array;
  udEdgesMove: Uint16Array;
  slicePermMove: Uint16Array;
  twistSlicePrune: Int8Array;
  flipSlicePrune: Int8Array;
  cornersSlicePermPrune: Int8Array;
  udEdgesSlicePermPrune: Int8Array;
}

let tables: Tables | null = null;

function buildMoveTable(
  size: number,
  moves: number[],
  set: (value: number) => CubieCube,
  get: (cube: CubieCube) => number,
) {
  const table = new Uint16Array(size * moves.length);
  for (let value = 0; value < size; value++) {
    const cube = set(value);
    moves.forEach((move, m) => {
      table[value * moves.length + m] = get(applyMove(cube, move));
    });
  }
  return table;
}

/** Breadth-first distances in the product space a × b, from the solved pair. */
function buildPruneTable(
  sizeA: number,
  sizeB: number,
  moveA: ArrayLike<number>,
  moveB: ArrayLike<number>,
  nMoves: number,
  solvedB: number,
) {
  const table = new Int8Array(sizeA * sizeB).fill(-1);
  table[solvedB] = 0;
  let filled = 1;
  for (let depth = 0; filled < table.length; depth++) {
    let added = 0;
    for (let index = 0; index < table.length; index++) {
      if (table[index] !== depth) continue;
      const a = Math.floor(index / sizeB);
      const b = index % sizeB;
      for (let m = 0; m < nMoves; m++) {
        const next = moveA[a * nMoves + m] * sizeB + moveB[b * nMoves + m];
        if (table[next] === -1) {
          table[next] = depth + 1;
          added++;
        }
      }
    }
    if (added === 0) break;
    filled += added;
  }
  return table;
}

const ALL_MOVES = Array.from({ length: N_MOVES }, (_, i) => i);

/** Builds every table once; later calls are free. */
export function initTables(): void {
  if (tables) return;
  const twistMove = buildMoveTable(N_TWIST, ALL_MOVES, setTwist, getTwist);
  const flipMove = buildMoveTable(N_FLIP, ALL_MOVES, setFlip, getFlip);
  const sliceMove = buildMoveTable(N_SLICE, ALL_MOVES, setSlice, getSlice);
  const cornersMove = buildMoveTable(N_PERM8, PHASE2_MOVES, setCorners, getCorners);
  const udEdgesMove = buildMoveTable(N_PERM8, PHASE2_MOVES, setUdEdges, getUdEdges);
  const slicePermMove = buildMoveTable(N_SLICE_PERM, PHASE2_MOVES, setSlicePerm, getSlicePerm);
  const n2 = PHASE2_MOVES.length;
  tables = {
    twistMove,
    flipMove,
    sliceMove,
    cornersMove,
    udEdgesMove,
    slicePermMove,
    twistSlicePrune: buildPruneTable(N_TWIST, N_SLICE, twistMove, sliceMove, N_MOVES, SLICE_SOLVED),
    flipSlicePrune: buildPruneTable(N_FLIP, N_SLICE, flipMove, sliceMove, N_MOVES, SLICE_SOLVED),
    cornersSlicePermPrune: buildPruneTable(N_PERM8, N_SLICE_PERM, cornersMove, slicePermMove, n2, 0),
    udEdgesSlicePermPrune: buildPruneTable(N_PERM8, N_SLICE_PERM, udEdgesMove, slicePermMove, n2, 0),
  };
}

// ---------- search ----------

class Timeout extends Error {}

export interface SolveOptions {
  /** Longest solution accepted by the first search. */
  maxLength?: number;
  /** After a first solution, keep looking for shorter ones for this long. */
  improveForMs?: number;
}

/**
 * Face-turn moves that solve `cube` (empty when already solved). Uses the
 * standard orientation of CubieCube: apply them holding U up and F front.
 */
export function solve(cube: CubieCube, options: SolveOptions = {}): string[] {
  initTables();
  const { maxLength = 30, improveForMs = 300 } = options;

  let best = search(cube, maxLength, Infinity);
  if (!best) throw new Error("No se ha encontrado solución.");

  const deadline = Date.now() + improveForMs;
  while (best.length > 0 && Date.now() < deadline) {
    const shorter = search(cube, best.length - 1, deadline);
    if (!shorter) break;
    best = shorter;
  }
  return best.map((move) => MOVE_NAMES[move]);
}

/** One two-phase search for any solution of at most `maxLength` moves. */
function search(cube: CubieCube, maxLength: number, deadline: number): number[] | null {
  const t = tables!;
  const path: number[] = [];
  let nodes = 0;

  const checkTime = () => {
    if (++nodes % 4096 === 0 && Date.now() > deadline) throw new Timeout();
  };

  const phase2 = (
    corners: number,
    udEdges: number,
    slicePerm: number,
    togo: number,
    lastMove: number,
  ): boolean => {
    if (togo === 0) return corners === 0 && udEdges === 0 && slicePerm === 0;
    checkTime();
    const n2 = PHASE2_MOVES.length;
    for (let m = 0; m < n2; m++) {
      const move = PHASE2_MOVES[m];
      if (isRedundant(move, lastMove)) continue;
      const c = t.cornersMove[corners * n2 + m];
      const e = t.udEdgesMove[udEdges * n2 + m];
      const s = t.slicePermMove[slicePerm * n2 + m];
      const bound = Math.max(
        t.cornersSlicePermPrune[c * N_SLICE_PERM + s],
        t.udEdgesSlicePermPrune[e * N_SLICE_PERM + s],
      );
      if (bound >= togo) continue;
      path.push(move);
      if (phase2(c, e, s, togo - 1, move)) return true;
      path.pop();
    }
    return false;
  };

  const startPhase2 = (): boolean => {
    const last = path[path.length - 1] ?? -1;
    // A G1 move ending phase 1 means a shorter phase 1 reaches the same place.
    if (last !== -1 && PHASE2_MOVES.includes(last)) return false;
    const inG1 = path.reduce(applyMove, cube);
    const corners = getCorners(inG1);
    const udEdges = getUdEdges(inG1);
    const slicePerm = getSlicePerm(inG1);
    const start = Math.max(
      t.cornersSlicePermPrune[corners * N_SLICE_PERM + slicePerm],
      t.udEdgesSlicePermPrune[udEdges * N_SLICE_PERM + slicePerm],
    );
    const phase1Length = path.length;
    for (let depth = start; phase1Length + depth <= maxLength; depth++) {
      if (phase2(corners, udEdges, slicePerm, depth, last)) return true;
    }
    return false;
  };

  const phase1 = (
    twist: number,
    flip: number,
    slice: number,
    togo: number,
    lastMove: number,
  ): boolean => {
    if (togo === 0) {
      return twist === 0 && flip === 0 && slice === SLICE_SOLVED && startPhase2();
    }
    checkTime();
    for (let move = 0; move < N_MOVES; move++) {
      if (isRedundant(move, lastMove)) continue;
      const tw = t.twistMove[twist * N_MOVES + move];
      const fl = t.flipMove[flip * N_MOVES + move];
      const sl = t.sliceMove[slice * N_MOVES + move];
      const bound = Math.max(
        t.twistSlicePrune[tw * N_SLICE + sl],
        t.flipSlicePrune[fl * N_SLICE + sl],
      );
      if (bound >= togo) continue;
      path.push(move);
      if (phase1(tw, fl, sl, togo - 1, move)) return true;
      path.pop();
    }
    return false;
  };

  const twist = getTwist(cube);
  const flip = getFlip(cube);
  const slice = getSlice(cube);
  try {
    for (let depth = 0; depth <= maxLength; depth++) {
      if (phase1(twist, flip, slice, depth, -1)) return [...path];
    }
  } catch (error) {
    if (error instanceof Timeout) return null;
    throw error;
  }
  return null;
}

/** Exposed for tests. */
export const __coordinates = {
  getTwist,
  setTwist,
  getFlip,
  setFlip,
  getSlice,
  setSlice,
  getCorners,
  setCorners,
  getUdEdges,
  setUdEdges,
  getSlicePerm,
  setSlicePerm,
  SLICE_SOLVED,
  MOVE_CUBES,
};
