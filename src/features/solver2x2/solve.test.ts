import { describe, expect, it } from "vitest";
import { applyMoves } from "@/features/cube/moves";
import type { CubeColor } from "@/features/cube/types";
import { CORNER_FACELETS_2, faceletsFromCorners, isSolved2, validateFacelets2 } from "./facelets";
import { optimalLength } from "./search";
import { cornersFromDbl, solve2x2 } from "./solve";
import { ORIENTATIONS, applyMoves2, cubeStateForSolution2, faceletsFromCubeState2 } from "./sticker-moves";

/** A seeded random generator, so a failure can be reproduced. */
function random(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

/** Uniformly random 2×2s: any corners anywhere, any legal twist. */
function randomCubes(count: number, seed: number): CubeColor[][] {
  const next = random(seed);
  return Array.from({ length: count }, () => {
    const cp = [0, 1, 2, 3, 4, 5, 6, 7];
    for (let i = 7; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [cp[i], cp[j]] = [cp[j], cp[i]];
    }
    const co = Array.from({ length: 7 }, () => Math.floor(next() * 3));
    co.push((21 - co.reduce((a, b) => a + b, 0)) % 3);
    return faceletsFromCorners({ cp, co });
  });
}

describe("2×2 solver", () => {
  it("solves 300 random cubes, held any way, in at most 11 moves of R, U and F", () => {
    for (const cube of randomCubes(300, 17)) {
      const moves = solve2x2(cube);
      expect(moves.length).toBeLessThanOrEqual(11);
      expect(moves.every((move) => "RUF".includes(move[0]))).toBe(true);
      // Replayed with the 3D engine, from exactly these stickers.
      const start = cubeStateForSolution2(cube, moves);
      expect(start).not.toBeNull();
      expect(faceletsFromCubeState2(start!)).toEqual(cube);
      expect(isSolved2(faceletsFromCubeState2(applyMoves(start!, moves)))).toBe(true);
    }
  }, 60_000);

  it("a cube copied in any of the 24 ways is valid and solved without turning it whole, just as short", () => {
    const [cube] = randomCubes(1, 5);
    const shortest = solve2x2(cube).length;
    expect(ORIENTATIONS).toHaveLength(24);
    for (const rotation of ORIENTATIONS) {
      const held = applyMoves2(cube, rotation);
      expect(validateFacelets2(held).kind).toBe("valid");
      const moves = solve2x2(held);
      expect(moves.every((move) => "RUF".includes(move[0]))).toBe(true);
      expect(moves).toHaveLength(shortest);
      expect(isSolved2(applyMoves2(held, moves))).toBe(true);
    }
  });

  it("held as asked, the fixed corner is the yellow-blue-orange one and its colors are untouched", () => {
    const [cube] = randomCubes(1, 8);
    const held = applyMoves2(cube, ORIENTATIONS.find((rotation) => {
      const turned = applyMoves2(cube, rotation);
      return CORNER_FACELETS_2[6].map((i) => turned[i]).join() === "yellow,blue,orange";
    })!);
    const corners = cornersFromDbl(held);
    expect(corners.cp[6]).toBe(6);
    expect(solve2x2(held)).toHaveLength(optimalLength(corners));
  });

  it("an already solved cube needs no moves", () => {
    for (const rotation of ORIENTATIONS) {
      const solved = applyMoves2(faceletsFromCorners({ cp: [0, 1, 2, 3, 4, 5, 6, 7], co: Array(8).fill(0) }), rotation);
      expect(solve2x2(solved)).toEqual([]);
    }
  });
});
