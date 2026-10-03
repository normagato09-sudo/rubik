/**
 * A small search over RUBIKO's own move engine, for the tests: the 3×3 as
 * its 54 stickers, each move as the way it shuffles them (read once from
 * features/cube/moves.ts), so trying millions of sequences stays fast.
 * Used to check that the cases of the intuitive steps are solved by the
 * shortest sequence of the moves their step allows.
 */
import { parseCubeAlgorithm } from "@/features/cube/algorithm";
import { applyMoves, type Move } from "@/features/cube/moves";
import type { CubeColor, CubeState } from "@/features/cube/types";
import { FACELET_GEOMETRY, faceletsFromCubeState } from "@/features/solver/cube-state";
import { facelets3, sheetSolved3 } from "./cube3";

const goal = sheetSolved3();
const goalFacelets = facelets3(goal);

/** The solved cube with each sticker named by the index of the place it sits on. */
const named: CubeState = {
  cubies: goal.cubies.map((cubie) => ({
    ...cubie,
    stickers: cubie.stickers.map((sticker) => {
      const axis = sticker.face[1] as "x" | "y" | "z";
      const sign = sticker.face[0] === "+" ? 1 : -1;
      const normal = cubie.orientation[axis].map((c) => c * sign);
      const index = FACELET_GEOMETRY.findIndex(
        ([p, n]) => p.join() === cubie.position.join() && n.join() === normal.join(),
      );
      return { ...sticker, color: String(index) as CubeColor };
    }),
  })),
};

const shuffles = new Map<Move, Int8Array>();
function shuffle(move: Move): Int8Array {
  let s = shuffles.get(move);
  if (!s) {
    s = Int8Array.from(faceletsFromCubeState(applyMoves(named, [move])).map(Number));
    shuffles.set(move, s);
  }
  return s;
}

/** Stickers as the index of the place each came from. */
export type Stickers = Int8Array;

export const solvedStickers = (): Stickers => Int8Array.from({ length: 54 }, (_, i) => i);

export function turn(state: Stickers, move: Move): Stickers {
  const s = shuffle(move);
  const next = new Int8Array(54);
  for (let i = 0; i < 54; i++) next[i] = state[s[i]];
  return next;
}

export const turnAll = (state: Stickers, algorithm: string) => parseCubeAlgorithm(algorithm).reduce(turn, state);

/** The color now on each place. */
export const colorsOf = (state: Stickers): CubeColor[] => Array.from(state, (from) => goalFacelets[from]);

/** Every quarter and half turn of the given faces. */
export const turnsOf = (faces: string[]) => faces.flatMap((face) => [face, `${face}'`, `${face}2`]) as Move[];

/**
 * The shortest sequence of `moves` (never the same face twice in a row)
 * that reaches `done`, trying lengths up to `maxLength`; null if none.
 */
export function shortest(start: Stickers, moves: Move[], done: (state: Stickers) => boolean, maxLength: number): Move[] | null {
  const path: Move[] = [];
  const dfs = (state: Stickers, left: number): boolean => {
    if (left === 0) return done(state);
    for (const move of moves) {
      if (path.length > 0 && path[path.length - 1][0] === move[0]) continue;
      path.push(move);
      if (dfs(turn(state, move), left - 1)) return true;
      path.pop();
    }
    return false;
  };
  for (let length = 0; length <= maxLength; length++) if (dfs(start, length)) return [...path];
  return null;
}
