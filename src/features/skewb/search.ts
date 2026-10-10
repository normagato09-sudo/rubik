/**
 * Searches on the Skewb with the WCA moves (R, U, L, B). None of them
 * moves the up-front-right corner, so the Skewb never needs turning as a
 * whole and every position is one state here.
 *
 * A position is read as pieces: where each of the 6 centers is, and where
 * each of the 7 other corners is and how it is twisted. Not every
 * arrangement can be reached, so each part is numbered by searching what
 * the moves reach (`CENTERS`: 360, `CORNERS`: 8 748). Together they give
 * the 3 149 280 positions of the Skewb, and a full distance table (one
 * byte each, built in about a second) gives the shortest solution of any
 * position. God's number for the Skewb is 11.
 */
import {
  CORNER_AXIS,
  ALL_SKEWB_MOVES,
  invertSkewbMoves,
  solvedSkewb,
  turnPermutation,
  wcaTurn,
  type SkewbMove,
} from "./moves";
import {
  SKEWB_CORNERS,
  SKEWB_FACES,
  STICKER_CENTERS,
  cornerOfSticker,
  dot,
  isCenterSticker,
  type Vec3,
} from "./geometry";
import type { CubeColor } from "@/features/cube/types";

const sub = (p: Vec3, q: Vec3): Vec3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/**
 * The 3 stickers of each corner: first the one on U or D, then the others
 * clockwise looking at the corner. A corner's twist is the place (0–2)
 * its U or D color has moved to.
 */
export const CORNER_STICKERS: number[][] = SKEWB_CORNERS.map((corner) => {
  const stickers = STICKER_CENTERS.map((_, i) => i).filter(
    (i) => !isCenterSticker(i) && cornerOfSticker(i) === corner,
  );
  const first = stickers.find((i) => Math.abs(STICKER_CENTERS[i][1]) === 1)!;
  const [a, b] = stickers.filter((i) => i !== first);
  const clockwise =
    dot(cross(sub(STICKER_CENTERS[a], STICKER_CENTERS[first]), sub(STICKER_CENTERS[b], STICKER_CENTERS[first])), CORNER_AXIS[corner]) < 0;
  return clockwise ? [first, a, b] : [first, b, a];
});

const CENTER_STICKERS = SKEWB_FACES.map((_, f) => f * 5);


/** Pieces: `centers[place]` is the center there, `corners[place]` the corner and `twists[place]` its twist. */
export interface SkewbPieces {
  centers: number[];
  corners: number[];
  twists: number[];
}

/** What a move does to the pieces: each place's piece goes to `to[place]`, turned `twist[place]`. */
interface PieceMove {
  centerTo: number[];
  cornerTo: number[];
  twist: number[];
}

function pieceMove(stickerTo: number[]): PieceMove {
  const centerTo = CENTER_STICKERS.map((sticker) => CENTER_STICKERS.indexOf(stickerTo[sticker]));
  const cornerTo: number[] = [];
  const twist: number[] = [];
  CORNER_STICKERS.forEach(([first]) => {
    const landed = stickerTo[first];
    const place = CORNER_STICKERS.findIndex((stickers) => stickers.includes(landed));
    cornerTo.push(place);
    twist.push(CORNER_STICKERS[place].indexOf(landed));
  });
  return { centerTo, cornerTo, twist };
}

const MOVES: PieceMove[] = ALL_SKEWB_MOVES.map((move) => pieceMove(turnPermutation(wcaTurn(move))));
const N_MOVES = MOVES.length;

export function applyPieceMove(pieces: SkewbPieces, m: number): SkewbPieces {
  const { centerTo, cornerTo, twist } = MOVES[m];
  const centers = [...pieces.centers];
  const corners = [...pieces.corners];
  const twists = [...pieces.twists];
  pieces.centers.forEach((center, place) => {
    centers[centerTo[place]] = center;
  });
  pieces.corners.forEach((corner, place) => {
    corners[cornerTo[place]] = corner;
    twists[cornerTo[place]] = (pieces.twists[place] + twist[place]) % 3;
  });
  return { centers, corners, twists };
}

export const solvedPieces = (): SkewbPieces => ({
  centers: [0, 1, 2, 3, 4, 5],
  corners: [0, 1, 2, 3, 4, 5, 6, 7],
  twists: [0, 0, 0, 0, 0, 0, 0, 0],
});

/** Every value one part of the position takes, numbered in the order the moves reach them. */
function reachable(start: number[], step: (value: number[], m: number) => number[]): number[][] {
  const seen = new Map([[start.join(), 0]]);
  const values = [start];
  for (let head = 0; head < values.length; head++) {
    for (let m = 0; m < N_MOVES; m++) {
      const next = step(values[head], m);
      const key = next.join();
      if (!seen.has(key)) {
        seen.set(key, values.length);
        values.push(next);
      }
    }
  }
  return values;
}

const solved = solvedPieces();
const CENTERS = reachable(solved.centers, (centers, m) => applyPieceMove({ ...solved, centers }, m).centers);

/**
 * The corners as one part, where they are and how they are twisted
 * (8 places, then 8 twists): the twists alone could be anything, but not
 * with every arrangement of the corners.
 */
const cornersOf = (pieces: SkewbPieces) => [...pieces.corners, ...pieces.twists];
const CORNERS = reachable(cornersOf(solved), (value, m) =>
  cornersOf(applyPieceMove({ ...solved, corners: value.slice(0, 8), twists: value.slice(8) }, m)),
);

export const N_CENTERS = CENTERS.length;
export const N_CORNERS = CORNERS.length;
export const N_STATES = N_CENTERS * N_CORNERS;

const indexer = (values: number[][]) => {
  const index = new Map(values.map((value, i) => [value.join(), i]));
  return (value: number[]) => {
    const i = index.get(value.join());
    if (i === undefined) throw new Error("Posición imposible");
    return i;
  };
};
const centerIndex = indexer(CENTERS);
const cornerIndex = indexer(CORNERS);

const CENTER_MOVE = new Uint16Array(N_CENTERS * N_MOVES);
CENTERS.forEach((centers, i) => {
  for (let m = 0; m < N_MOVES; m++) CENTER_MOVE[i * N_MOVES + m] = centerIndex(applyPieceMove({ ...solved, centers }, m).centers);
});
const CORNER_MOVE = new Uint16Array(N_CORNERS * N_MOVES);
CORNERS.forEach((value, i) => {
  const pieces = { ...solved, corners: value.slice(0, 8), twists: value.slice(8) };
  for (let m = 0; m < N_MOVES; m++) CORNER_MOVE[i * N_MOVES + m] = cornerIndex(cornersOf(applyPieceMove(pieces, m)));
});

/** A position's number (0 is solved); throws if the pieces cannot be reached. */
export function stateIndex(pieces: SkewbPieces): number {
  return centerIndex(pieces.centers) * N_CORNERS + cornerIndex(cornersOf(pieces));
}

export function piecesFromIndex(state: number): SkewbPieces {
  const corners = CORNERS[state % N_CORNERS];
  return {
    centers: [...CENTERS[Math.floor(state / N_CORNERS)]],
    corners: corners.slice(0, 8),
    twists: corners.slice(8),
  };
}

/** The position after move `m` (by number). */
export function moveState(state: number, m: number): number {
  const k = state % N_CORNERS;
  const c = Math.floor(state / N_CORNERS);
  return CENTER_MOVE[c * N_MOVES + m] * N_CORNERS + CORNER_MOVE[k * N_MOVES + m];
}

let distanceTable: Uint8Array | null = null;

/** The distance to solved of every position (built once, about a second). */
export function skewbDistances(): Uint8Array {
  if (distanceTable) return distanceTable;
  const distance = new Uint8Array(N_STATES).fill(255);
  const queue = new Uint32Array(N_STATES);
  distance[0] = 0;
  let head = 0;
  let tail = 1;
  while (head < tail) {
    const state = queue[head++];
    const next = distance[state] + 1;
    for (let m = 0; m < N_MOVES; m++) {
      const target = moveState(state, m);
      if (distance[target] === 255) {
        distance[target] = next;
        queue[tail++] = target;
      }
    }
  }
  distanceTable = distance;
  return distance;
}

/** Same corner twice in a row is never needed: R R is R', R R' is nothing. */
const sameCorner = (a: number, b: number) => a >> 1 === b >> 1;

/** The shortest WCA moves from position `state` to solved. */
export function solveSkewbState(state: number): SkewbMove[] {
  const distance = skewbDistances();
  if (distance[state] === 255) throw new Error("Posición inalcanzable");
  const moves: SkewbMove[] = [];
  while (distance[state] > 0) {
    for (let m = 0; m < N_MOVES; m++) {
      const target = moveState(state, m);
      if (distance[target] === distance[state] - 1) {
        moves.push(ALL_SKEWB_MOVES[m]);
        state = target;
        break;
      }
    }
  }
  return moves;
}

/**
 * Exactly `length` WCA moves from `state` to solved, never the same corner
 * twice in a row, or null if there are none. The moves are tried in a
 * random order, so the same position gives different sequences.
 */
export function solveSkewbExactly(state: number, length: number, random: () => number = Math.random): SkewbMove[] | null {
  const distance = skewbDistances();
  const path: number[] = [];
  const search = (current: number, left: number): boolean => {
    if (left === 0) return current === 0;
    if (distance[current] > left) return false;
    const order = shuffled(N_MOVES, random);
    for (const m of order) {
      if (path.length > 0 && sameCorner(path[path.length - 1], m)) continue;
      path.push(m);
      if (search(moveState(current, m), left - 1)) return true;
      path.pop();
    }
    return false;
  };
  return search(state, length) ? path.map((m) => ALL_SKEWB_MOVES[m]) : null;
}

function shuffled(n: number, random: () => number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** WCA Skewb scrambles are always 11 moves (TNoodle). */
export const SKEWB_SCRAMBLE_LENGTH = 11;

/**
 * A WCA Skewb scramble, as TNoodle makes them: a position chosen at random
 * among all of them (every one equally likely), reached with exactly 11
 * moves, never the same corner twice in a row.
 */
export function randomStateSkewbScramble(random: () => number = Math.random): { scramble: SkewbMove[]; state: number } {
  for (;;) {
    const state = Math.floor(random() * N_STATES);
    const solution = solveSkewbExactly(state, SKEWB_SCRAMBLE_LENGTH, random);
    if (solution) return { scramble: invertSkewbMoves(solution), state };
  }
}


/** The pieces of a Skewb painted with `colors` (30 stickers, held the WCA way); throws if a piece does not exist. */
export function piecesFromStickers(colors: readonly CubeColor[]): SkewbPieces {
  const solvedColors = solvedSkewb();
  const centers = CENTER_STICKERS.map((sticker) => {
    const center = CENTER_STICKERS.findIndex((home) => solvedColors[home] === colors[sticker]);
    if (center < 0) throw new Error("Posición imposible");
    return center;
  });
  const corners: number[] = [];
  const twists: number[] = [];
  CORNER_STICKERS.forEach((stickers) => {
    const seen = stickers.map((sticker) => colors[sticker]);
    const corner = CORNER_STICKERS.findIndex((home) => {
      const own = home.map((sticker) => solvedColors[sticker]);
      return [0, 1, 2].some((k) => own.every((color, j) => color === seen[(j + k) % 3]));
    });
    if (corner < 0) throw new Error("Posición imposible");
    corners.push(corner);
    twists.push(seen.indexOf(solvedColors[CORNER_STICKERS[corner][0]]));
  });
  return { centers, corners, twists };
}
