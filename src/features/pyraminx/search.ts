/**
 * Optimal Pyraminx solutions. The tips come first: each one is turned
 * (u, l, r, b) until it matches its center, which never needs more than
 * one move per tip. The rest — centers and edges, 933 120 positions — is
 * solved with a full table of distances (BFS from the solved Pyraminx
 * with U, L, R and B), so the answer is always the shortest: 11 big turns
 * at most, plus up to 4 tip turns.
 *
 * Coordinates: where each edge is and which way round (6 edges: order
 * 0–719, flips 0–63) and how far each center is turned (0–80).
 */
import { PYRA_VERTICES, faceOf } from "./geometry";
import { BIG_MOVES, MOVE_PERMUTATION, applyPyraMoves, isSolvedPyraminx, type PyraColor, type PyraMove } from "./moves";
import {
  CENTER_STICKERS,
  EDGE_STICKERS,
  TIP_STICKERS,
  faceColorsFromCenters,
  twistOf,
  type FaceColors,
} from "./pieces";

const EDGES = EDGE_STICKERS.length;
const PERMS = 720;
const FLIPS = 64;
const TWISTS = 81;
export const PYRA_POSITIONS = 933_120;

// ---------- permutations ----------

const FACTORIAL = [1, 1, 2, 6, 24, 120, 720];

export function permIndex(perm: readonly number[]): number {
  let index = 0;
  for (let i = 0; i < perm.length; i++) {
    let smaller = 0;
    for (let j = i + 1; j < perm.length; j++) if (perm[j] < perm[i]) smaller++;
    index += smaller * FACTORIAL[perm.length - 1 - i];
  }
  return index;
}

export function permFromIndex(index: number, n = EDGES): number[] {
  const left = Array.from({ length: n }, (_, i) => i);
  const perm: number[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = Math.floor(index / FACTORIAL[i]);
    index %= FACTORIAL[i];
    perm.push(left.splice(k, 1)[0]);
  }
  return perm;
}

/** Whether a permutation takes an even number of swaps. */
export function isEvenPerm(perm: readonly number[]): boolean {
  let swaps = 0;
  const seen = perm.map(() => false);
  perm.forEach((_, start) => {
    let length = 0;
    for (let i = start; !seen[i]; i = perm[i]) {
      seen[i] = true;
      length++;
    }
    if (length > 0) swaps += length - 1;
  });
  return swaps % 2 === 0;
}

// ---------- what each big move does to the pieces ----------

interface MoveEffect {
  /** Edge in place i goes to place `edgeTo[i]`, flipped if `edgeFlip[i]`. */
  edgeTo: number[];
  edgeFlip: number[];
  /** How much each center's twist changes (by vertex, U L R B). */
  twist: number[];
}

export const MOVE_EFFECT: Record<string, MoveEffect> = Object.fromEntries(
  BIG_MOVES.map((move) => {
    const to = MOVE_PERMUTATION[move];
    const edgeTo: number[] = [];
    const edgeFlip: number[] = [];
    EDGE_STICKERS.forEach(([a]) => {
      const place = EDGE_STICKERS.findIndex((edge) => edge.includes(to[a]));
      edgeTo.push(place);
      edgeFlip.push(EDGE_STICKERS[place][0] === to[a] ? 0 : 1);
    });
    const twist = PYRA_VERTICES.map((v) => {
      const center = CENTER_STICKERS[v];
      const shift = center.indexOf(to[center[0]]);
      if (shift === -1) throw new Error("Pyraminx: a center left its place");
      return (3 - shift) % 3;
    });
    return [move, { edgeTo, edgeFlip, twist }];
  }),
);

// ---------- move tables on the coordinates ----------

let tables: { perm: Uint16Array; flip: Uint8Array; twist: Uint8Array } | null = null;

function moveTables() {
  if (tables) return tables;
  const perm = new Uint16Array(PERMS * BIG_MOVES.length);
  const flip = new Uint8Array(FLIPS * BIG_MOVES.length);
  const twist = new Uint8Array(TWISTS * BIG_MOVES.length);
  BIG_MOVES.forEach((move, m) => {
    const { edgeTo, edgeFlip, twist: delta } = MOVE_EFFECT[move];
    for (let p = 0; p < PERMS; p++) {
      const from = permFromIndex(p);
      const next: number[] = [];
      from.forEach((piece, i) => (next[edgeTo[i]] = piece));
      perm[p * 8 + m] = permIndex(next);
    }
    for (let f = 0; f < FLIPS; f++) {
      let next = 0;
      for (let i = 0; i < EDGES; i++) if (((f >> i) & 1) ^ edgeFlip[i]) next |= 1 << edgeTo[i];
      flip[f * 8 + m] = next;
    }
    for (let t = 0; t < TWISTS; t++) {
      let next = 0;
      for (let v = 3; v >= 0; v--) next = next * 3 + ((Math.floor(t / 3 ** v) % 3) + delta[v]) % 3;
      twist[t * 8 + m] = next;
    }
  });
  tables = { perm, flip, twist };
  return tables;
}

export interface PyraCoords {
  perm: number;
  flip: number;
  twist: number;
}

const indexOf = ({ perm, flip, twist }: PyraCoords) => (perm * FLIPS + flip) * TWISTS + twist;

export function moveCoords(coords: PyraCoords, m: number): PyraCoords {
  const t = moveTables();
  return {
    perm: t.perm[coords.perm * 8 + m],
    flip: t.flip[coords.flip * 8 + m],
    twist: t.twist[coords.twist * 8 + m],
  };
}

// ---------- distance table ----------

let distances: Uint8Array | null = null;

/** Builds the table of distances (about a tenth of a second); later calls reuse it. */
export function initPyraminxTables(): Uint8Array {
  if (distances) return distances;
  const t = moveTables();
  const table = new Uint8Array(PERMS * FLIPS * TWISTS).fill(255);
  const queue = new Int32Array(PYRA_POSITIONS);
  table[0] = 0;
  queue[0] = 0;
  let head = 0;
  let tail = 1;
  while (head < tail) {
    const index = queue[head++];
    const twist = index % TWISTS;
    const flip = Math.floor(index / TWISTS) % FLIPS;
    const perm = Math.floor(index / (TWISTS * FLIPS));
    const next = table[index] + 1;
    for (let m = 0; m < 8; m++) {
      const to = (t.perm[perm * 8 + m] * FLIPS + t.flip[flip * 8 + m]) * TWISTS + t.twist[twist * 8 + m];
      if (table[to] === 255) {
        table[to] = next;
        queue[tail++] = to;
      }
    }
  }
  if (tail !== PYRA_POSITIONS) throw new Error("Pyraminx: unexpected number of positions");
  distances = table;
  return table;
}

export const pyraDistance = (coords: PyraCoords) => initPyraminxTables()[indexOf(coords)];

// ---------- from stickers ----------

/**
 * The coordinates of a full set of colors, relative to the face colors
 * its centers give; null where a piece is not a real one (mirrored
 * center, an edge with a color pair that does not exist or is repeated).
 */
export function coordsFromColors(colors: readonly PyraColor[], faces: FaceColors): PyraCoords | null {
  const perm: number[] = [];
  let flip = 0;
  for (let i = 0; i < EDGES; i++) {
    const [a, b] = EDGE_STICKERS[i];
    const piece = EDGE_STICKERS.findIndex(
      ([x, y]) =>
        (faces[faceOf(x)] === colors[a] && faces[faceOf(y)] === colors[b]) ||
        (faces[faceOf(x)] === colors[b] && faces[faceOf(y)] === colors[a]),
    );
    if (piece === -1) return null;
    perm.push(piece);
    if (faces[faceOf(EDGE_STICKERS[piece][0])] !== colors[a]) flip |= 1 << i;
  }
  if (new Set(perm).size !== EDGES) return null;
  let twist = 0;
  for (let v = 3; v >= 0; v--) {
    const center = CENTER_STICKERS[PYRA_VERTICES[v]];
    const shift = twistOf(
      center.map((i) => colors[i]),
      center.map((i) => faces[faceOf(i)]),
    );
    if (shift === null) return null;
    twist = twist * 3 + shift;
  }
  return { perm: permIndex(perm), flip, twist };
}

/** The tip turns (at most one per tip) that make every tip match its center. */
export function tipMoves(colors: readonly PyraColor[]): PyraMove[] {
  return PYRA_VERTICES.flatMap((v) => {
    const shift = twistOf(
      TIP_STICKERS[v].map((i) => colors[i]),
      CENTER_STICKERS[v].map((i) => colors[i]),
    );
    if (shift === null) throw new Error("Pyraminx: a tip does not match its center");
    const tip = v.toLowerCase();
    return shift === 0 ? [] : [(shift === 1 ? tip : `${tip}'`) as PyraMove];
  });
}

/**
 * The shortest solution of a valid Pyraminx (see facelets.ts): tips
 * first, then the big turns. Checked by replaying it on the stickers.
 */
export function solvePyraminx(colors: readonly PyraColor[]): PyraMove[] {
  const faces = faceColorsFromCenters(colors);
  if (!faces) throw new Error("Pyraminx: invalid centers");
  const tips = tipMoves(colors);
  let coords = coordsFromColors(colors, faces);
  if (!coords) throw new Error("Pyraminx: invalid pieces");
  const table = initPyraminxTables();
  let distance = table[indexOf(coords)];
  if (distance === 255) throw new Error("Pyraminx: unreachable position");
  const moves: PyraMove[] = [...tips];
  while (distance > 0) {
    const current = coords;
    const m = BIG_MOVES.findIndex((_, k) => table[indexOf(moveCoords(current, k))] === distance - 1);
    coords = moveCoords(coords, m);
    moves.push(BIG_MOVES[m]);
    distance--;
  }
  if (!isSolvedPyraminx(applyPyraMoves(colors, moves))) throw new Error("Pyraminx: the solution does not solve it");
  return moves;
}

// ---------- edges only (for the live check) ----------

let edgeTable: Uint8Array | null = null;

/** Whether edges can be where they are, whatever the centers do (46 080 cases, instant). */
export function edgesReachable(perm: number, flip: number): boolean {
  if (!edgeTable) {
    const t = moveTables();
    edgeTable = new Uint8Array(PERMS * FLIPS);
    edgeTable[0] = 1;
    const queue = [0];
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head];
      const p = Math.floor(index / FLIPS);
      const f = index % FLIPS;
      for (let m = 0; m < 8; m++) {
        const to = t.perm[p * 8 + m] * FLIPS + t.flip[f * 8 + m];
        if (!edgeTable[to]) {
          edgeTable[to] = 1;
          queue.push(to);
        }
      }
    }
  }
  return edgeTable[perm * FLIPS + flip] === 1;
}
