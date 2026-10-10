import { describe, expect, it } from "vitest";
import { ALL_SKEWB_MOVES, applySkewbMoves, isSolvedSkewb, solvedSkewb, type SkewbMove } from "./moves";
import {
  N_STATES,
  SKEWB_SCRAMBLE_LENGTH,
  moveState,
  piecesFromIndex,
  piecesFromStickers,
  randomStateSkewbScramble,
  skewbDistances,
  solveSkewbState,
  stateIndex,
} from "./search";

/** A seeded random, so a failure can be repeated. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
}

const randomMoves = (random: () => number, n: number): SkewbMove[] =>
  Array.from({ length: n }, () => ALL_SKEWB_MOVES[Math.floor(random() * ALL_SKEWB_MOVES.length)]);

describe("Skewb search", () => {
  it("has the 3 149 280 positions of the Skewb, all reached, at most 11 moves away", () => {
    expect(N_STATES).toBe(3_149_280);
    const counts: number[] = [];
    skewbDistances().forEach((d) => {
      counts[d] = (counts[d] ?? 0) + 1;
    });
    // The known distribution of the Skewb (God's number 11).
    expect(counts).toEqual([1, 8, 48, 288, 1728, 10248, 59304, 315198, 1225483, 1455856, 81028, 90]);
  });

  it("numbers positions the same way as the stickers move", () => {
    const random = seeded(7);
    for (let n = 0; n < 200; n++) {
      const moves = randomMoves(random, 1 + Math.floor(random() * 25));
      const stickers = applySkewbMoves(solvedSkewb(), moves);
      const byTable = moves.reduce((state, move) => moveState(state, ALL_SKEWB_MOVES.indexOf(move)), 0);
      const index = stateIndex(piecesFromStickers(stickers));
      expect(index).toBe(byTable);
      expect(stateIndex(piecesFromIndex(index))).toBe(index);
    }
  });

  it("solves any position in the fewest moves", () => {
    const random = seeded(11);
    const distance = skewbDistances();
    for (let n = 0; n < 300; n++) {
      const stickers = applySkewbMoves(solvedSkewb(), randomMoves(random, 30));
      const state = stateIndex(piecesFromStickers(stickers));
      const solution = solveSkewbState(state);
      expect(solution).toHaveLength(distance[state]);
      expect(solution.length).toBeLessThanOrEqual(11);
      expect(isSolvedSkewb(applySkewbMoves(stickers, solution))).toBe(true);
    }
  });

  it("rejects pieces that do not exist", () => {
    const stickers = solvedSkewb();
    [stickers[1], stickers[6]] = [stickers[6], stickers[1]];
    expect(() => stateIndex(piecesFromStickers(stickers))).toThrow();
  });

  it("makes WCA scrambles: a random position reached with exactly 11 moves", () => {
    const random = seeded(3);
    const start = Date.now();
    for (let n = 0; n < 100; n++) {
      const { scramble, state } = randomStateSkewbScramble(random);
      expect(scramble).toHaveLength(SKEWB_SCRAMBLE_LENGTH);
      scramble.slice(1).forEach((move, i) => expect(move[0]).not.toBe(scramble[i][0]));
      expect(stateIndex(piecesFromStickers(applySkewbMoves(solvedSkewb(), scramble)))).toBe(state);
    }
    expect((Date.now() - start) / 100).toBeLessThan(50);
  });
});
