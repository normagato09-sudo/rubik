import { describe, expect, it } from "vitest";
import { createSolvedCube } from "@/features/cube/model";
import { ALL_MOVES, applyMoves, getFaceDef, inverseMove } from "@/features/cube/moves";
import type { Face, Move } from "@/features/cube/moves";
import { DEFAULT_SCRAMBLE_LENGTH, generateScramble } from "./generator";

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
