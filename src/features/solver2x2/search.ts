/**
 * Searches on a 2×2 held with one corner fixed at down-back-left (DBL):
 * with that corner still, R, U and F reach every position, so no other
 * face is needed (L, D and B turn the fixed corner). Pieces use Kociemba's
 * corner slots and the "replaced by" move cubes of features/solver/cubie.
 *
 * - `solveOptimal`: a full distance table (breadth-first, 7!·3⁶ =
 *   3 674 160 positions, one byte each) gives the shortest solution by
 *   always taking a move that gets one closer. God's number for the 2×2
 *   is 11 in this metric, so no solution is longer.
 * - `solveFirstLayer` / `solveFirstFace`: a small table on the three other
 *   bottom corners only (where they are and how they are twisted), for the
 *   first step of the CLL and Ortega methods.
 */
import type { Move } from "@/features/cube/moves";
import { MOVE_CUBES, MOVE_NAMES } from "@/features/solver/cubie";
import type { CornerState } from "./facelets";
import { REFERENCE_SLOT } from "./facelets";

/** U, U2, U', R, R2, R', F, F2, F' in MOVE_CUBES (U R F come first). */
const N_MOVES = 9;
const MOVES = Array.from({ length: N_MOVES }, (_, m) => MOVE_CUBES[m]);
export const SEARCH_MOVE_NAMES = MOVE_NAMES.slice(0, N_MOVES) as Move[];
const faceOf = (m: number) => Math.floor(m / 3);

/** The 7 slots that move (all but DBL), and a piece's rank among them. */
const FREE = [0, 1, 2, 3, 4, 5, 7];
const RANK = [0, 1, 2, 3, 4, 5, -1, 6];

const N_PERM = 5040;
const N_TWIST = 729;
export const N_STATES = N_PERM * N_TWIST;

/** A (corner-only) move applied: b "replaced by" form, as in cubie.ts. */
function multiply(a: CornerState, b: { cp: number[]; co: number[] }): CornerState {
  return {
    cp: b.cp.map((slot) => a.cp[slot]),
    co: b.cp.map((slot, i) => (a.co[slot] + b.co[i]) % 3),
  };
}

function permIndex(cp: number[]): number {
  const ranks = FREE.map((slot) => RANK[cp[slot]]);
  let index = 0;
  for (let i = 0; i < 7; i++) {
    let smaller = 0;
    for (let j = i + 1; j < 7; j++) if (ranks[j] < ranks[i]) smaller++;
    index = index * (7 - i) + smaller;
  }
  return index;
}

function permFromIndex(index: number): number[] {
  const digits: number[] = [];
  for (let i = 6; i >= 0; i--) {
    digits.unshift(index % (7 - i));
    index = Math.floor(index / (7 - i));
  }
  const left = [0, 1, 2, 3, 4, 5, 6];
  const cp = [0, 0, 0, 0, 0, 0, REFERENCE_SLOT, 0];
  digits.forEach((digit, i) => {
    cp[FREE[i]] = FREE[left.splice(digit, 1)[0]];
  });
  return cp;
}

function twistIndex(co: number[]): number {
  return [0, 1, 2, 3, 4, 5].reduce((index, slot) => index * 3 + co[slot], 0);
}

function twistFromIndex(index: number): number[] {
  const co = Array(8).fill(0);
  let sum = 0;
  for (let slot = 5; slot >= 0; slot--) {
    co[slot] = index % 3;
    sum += co[slot];
    index = Math.floor(index / 3);
  }
  co[7] = (3 - (sum % 3)) % 3;
  return co;
}

export function stateIndex(corners: CornerState): number {
  return permIndex(corners.cp) * N_TWIST + twistIndex(corners.co);
}

interface Tables {
  permMove: Uint16Array;
  twistMove: Uint16Array;
  distance: Uint8Array;
}

let tables: Tables | null = null;

/** Builds the move tables and the distance of every position (about a second, once). */
export function initTables2x2(): Tables {
  if (tables) return tables;
  const permMove = new Uint16Array(N_PERM * N_MOVES);
  for (let p = 0; p < N_PERM; p++) {
    const state = { cp: permFromIndex(p), co: Array(8).fill(0) };
    for (let m = 0; m < N_MOVES; m++) permMove[p * N_MOVES + m] = permIndex(multiply(state, MOVES[m]).cp);
  }
  const twistMove = new Uint16Array(N_TWIST * N_MOVES);
  for (let t = 0; t < N_TWIST; t++) {
    const state = { cp: [0, 1, 2, 3, 4, 5, 6, 7], co: twistFromIndex(t) };
    for (let m = 0; m < N_MOVES; m++) twistMove[t * N_MOVES + m] = twistIndex(multiply(state, MOVES[m]).co);
  }

  const distance = new Uint8Array(N_STATES).fill(255);
  const queue = new Uint32Array(N_STATES);
  distance[0] = 0;
  let head = 0;
  let tail = 1;
  while (head < tail) {
    const state = queue[head++];
    const p = Math.floor(state / N_TWIST);
    const t = state % N_TWIST;
    const next = distance[state] + 1;
    for (let m = 0; m < N_MOVES; m++) {
      const target = permMove[p * N_MOVES + m] * N_TWIST + twistMove[t * N_MOVES + m];
      if (distance[target] === 255) {
        distance[target] = next;
        queue[tail++] = target;
      }
    }
  }
  tables = { permMove, twistMove, distance };
  return tables;
}

/** Moves (R, U, F only) from `corners` to solved, as few as possible. */
export function solveOptimal(corners: CornerState): Move[] {
  const { permMove, twistMove, distance } = initTables2x2();
  let state = stateIndex(corners);
  if (distance[state] === 255) throw new Error("Posición inalcanzable");
  const moves: Move[] = [];
  let last = -1;
  while (distance[state] > 0) {
    const p = Math.floor(state / N_TWIST);
    const t = state % N_TWIST;
    let chosen = -1;
    for (let m = 0; m < N_MOVES && chosen === -1; m++) {
      if (faceOf(m) === last) continue;
      const target = permMove[p * N_MOVES + m] * N_TWIST + twistMove[t * N_MOVES + m];
      if (distance[target] === distance[state] - 1) {
        chosen = m;
        state = target;
      }
    }
    moves.push(SEARCH_MOVE_NAMES[chosen]);
    last = faceOf(chosen);
  }
  return moves;
}

/** Distance of a position to solved (R, U, F only). */
export function optimalLength(corners: CornerState): number {
  return initTables2x2().distance[stateIndex(corners)];
}

// ---------- first layer / first face: the three other bottom corners (DFR, DLF, DRB) ----------

/** Where one piece goes: PIECE_MOVE[(slot * 3 + twist) * 9 + m] = new slot * 3 + new twist. */
const PIECE_MOVE = (() => {
  const table = new Uint8Array(24 * N_MOVES);
  for (let slot = 0; slot < 8; slot++) {
    for (let twist = 0; twist < 3; twist++) {
      for (let m = 0; m < N_MOVES; m++) {
        const target = MOVES[m].cp.indexOf(slot);
        table[(slot * 3 + twist) * N_MOVES + m] = target * 3 + ((twist + MOVES[m].co[target]) % 3);
      }
    }
  }
  return table;
})();

const bottomIndex = (a: number, b: number, c: number) => (a * 24 + b) * 24 + c;

/** Where the three bottom pieces are (slot * 3 + twist each). */
function bottomState(corners: CornerState): number {
  const place = (piece: number) => {
    const slot = corners.cp.indexOf(piece);
    return slot * 3 + corners.co[slot];
  };
  return bottomIndex(place(4), place(5), place(7));
}

function moveBottom(state: number, m: number): number {
  const c = state % 24;
  const b = Math.floor(state / 24) % 24;
  const a = Math.floor(state / 576);
  return bottomIndex(PIECE_MOVE[a * N_MOVES + m], PIECE_MOVE[b * N_MOVES + m], PIECE_MOVE[c * N_MOVES + m]);
}

function bottomTable(goals: number[]): Uint8Array {
  const distance = new Uint8Array(24 ** 3).fill(255);
  const queue = [...goals];
  for (const goal of goals) distance[goal] = 0;
  for (let head = 0; head < queue.length; head++) {
    const state = queue[head];
    for (let m = 0; m < N_MOVES; m++) {
      const target = moveBottom(state, m);
      if (distance[target] === 255) {
        distance[target] = distance[state] + 1;
        queue.push(target);
      }
    }
  }
  return distance;
}

/** Bottom layer solved: each corner home, untwisted. */
const LAYER_DISTANCE = bottomTable([bottomIndex(4 * 3, 5 * 3, 7 * 3)]);

/** Bottom face of one color: the three corners in the bottom slots in any order, untwisted. */
const FACE_DISTANCE = bottomTable(
  [
    [4, 5, 7],
    [4, 7, 5],
    [5, 4, 7],
    [5, 7, 4],
    [7, 4, 5],
    [7, 5, 4],
  ].map(([a, b, c]) => bottomIndex(a * 3, b * 3, c * 3)),
);

function walk(distance: Uint8Array, corners: CornerState): Move[] {
  let state = bottomState(corners);
  const moves: Move[] = [];
  let last = -1;
  while (distance[state] > 0) {
    let chosen = -1;
    for (let m = 0; m < N_MOVES && chosen === -1; m++) {
      if (faceOf(m) === last) continue;
      const target = moveBottom(state, m);
      if (distance[target] === distance[state] - 1) {
        chosen = m;
        state = target;
      }
    }
    moves.push(SEARCH_MOVE_NAMES[chosen]);
    last = faceOf(chosen);
  }
  return moves;
}

export const firstLayerLength = (corners: CornerState) => LAYER_DISTANCE[bottomState(corners)];
export const firstFaceLength = (corners: CornerState) => FACE_DISTANCE[bottomState(corners)];

/** Shortest R/U/F sequence that completes the bottom layer around the fixed corner. */
export const solveFirstLayer = (corners: CornerState) => walk(LAYER_DISTANCE, corners);

/** Shortest R/U/F sequence that makes the bottom face one color (sides not matching yet). */
export const solveFirstFace = (corners: CornerState) => walk(FACE_DISTANCE, corners);
