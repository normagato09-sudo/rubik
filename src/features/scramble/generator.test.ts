import { describe, expect, it } from "vitest";
import { createSolvedCube } from "@/features/cube/model";
import { ALL_MOVES, applyMoves, getFaceDef, inverseMove } from "@/features/cube/moves";
import type { Face, Move } from "@/features/cube/moves";
import { DEFAULT_SCRAMBLE_LENGTH, generate2x2Scramble, generateScramble } from "./generator";

const ALL_MOVES_SET = new Set<Move>(ALL_MOVES);

describe("generateScramble", () => {
  it("has the expected default length", () => {
    expect(generateScramble()).toHaveLength(DEFAULT_SCRAMBLE_LENGTH);
  });

  it("respects a custom length", () => {
    expect(generateScramble(12)).toHaveLength(12);
  });

  it("only produces moves that exist in the move engine", () => {
    const scramble = generateScramble(50);
    for (const move of scramble) {
      expect(ALL_MOVES_SET.has(move)).toBe(true);
    }
  });

  it("never repeats the same face on consecutive moves", () => {
    const scramble = generateScramble(50);
    for (let i = 1; i < scramble.length; i++) {
      expect(scramble[i][0]).not.toBe(scramble[i - 1][0]);
    }
  });

  it("never puts two consecutive moves on the same axis (rules out e.g. R L)", () => {
    const scramble = generateScramble(50);
    for (let i = 1; i < scramble.length; i++) {
      const prevAxis = getFaceDef(scramble[i - 1][0] as Face).axis;
      const currentAxis = getFaceDef(scramble[i][0] as Face).axis;
      expect(currentAxis).not.toBe(prevAxis);
    }
  });

  it("changes the cube state when applied through the real engine", () => {
    const solved = createSolvedCube();
    const scrambled = applyMoves(solved, generateScramble());
    expect(scrambled).not.toEqual(solved);
  });

  it("applying the scramble then its inverse restores the solved state", () => {
    const solved = createSolvedCube();
    const scramble = generateScramble();
    const scrambled = applyMoves(solved, scramble);
    const inverse = [...scramble].reverse().map(inverseMove);
    const restored = applyMoves(scrambled, inverse);
    expect(restored).toEqual(solved);
  });

  it("produces different sequences across generations", () => {
    const scrambles = Array.from({ length: 5 }, () => generateScramble().join(" "));
    const distinct = new Set(scrambles);
    expect(distinct.size).toBeGreaterThan(1);
  });
});

describe("generate2x2Scramble", () => {
  it("is 9 to 11 moves of R, U and F, never the same face twice in a row", () => {
    const lengths = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const scramble = generate2x2Scramble();
      lengths.add(scramble.length);
      expect(scramble.length).toBeGreaterThanOrEqual(9);
      expect(scramble.length).toBeLessThanOrEqual(11);
      scramble.forEach((move, j) => {
        expect("RUF").toContain(move[0]);
        if (j > 0) expect(move[0]).not.toBe(scramble[j - 1][0]);
      });
    }
    expect([...lengths].sort((a, b) => a - b)).toEqual([9, 10, 11]);
  });

  it("really scrambles a 2×2 with the move engine", () => {
    // A few sequences (like (R2 U2) three times) do nothing on a 2×2, so look at several.
    const solved = createSolvedCube(2);
    const scrambles = Array.from({ length: 20 }, () => applyMoves(solved, generate2x2Scramble()));
    expect(scrambles.some((scrambled) => JSON.stringify(scrambled) !== JSON.stringify(solved))).toBe(true);
  });
});
