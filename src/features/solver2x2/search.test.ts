import { describe, expect, it } from "vitest";
import { createSolvedCube } from "@/features/cube/model";
import { applyMoves, inverseMove, type Move } from "@/features/cube/moves";
import { faceletsFromCorners, isSolved2, parseFacelets2 } from "./facelets";
import { solve2x2 } from "./methods";
import { N_STATES, initTables2x2, optimalLength, solveOptimal } from "./search";
import { applyMoves2, cubeStateForSolution2, faceletsFromCubeState2, solvedFacelets2 } from "./sticker-moves";

const RUF: Move[] = ["R", "R'", "R2", "U", "U'", "U2", "F", "F'", "F2"];

/** A seeded random generator, so a failure can be reproduced. */
function random(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

const cornersOf = (moves: Move[]) => {
  const parsed = parseFacelets2(applyMoves2(solvedFacelets2(), moves));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.corners;
};

describe("optimal 2×2 solver", () => {
  it("knows every position, at the known distances (God's number 11)", () => {
    const { distance } = initTables2x2();
    const counts = Array(12).fill(0);
    for (let i = 0; i < N_STATES; i++) counts[distance[i]]++;
    // Positions of the 2×2 at each distance, half-turn metric (well known).
    expect(counts).toEqual([1, 9, 54, 321, 1847, 9992, 50136, 227536, 870072, 1887748, 623800, 2644]);
  }, 60_000);

  it.each(RUF)("%s is solved by its inverse", (move) => {
    expect(solveOptimal(cornersOf([move]))).toEqual([inverseMove(move)]);
  });

  it("solves random scrambles in at most 11 moves, as short as the table says", () => {
    const next = random(7);
    for (let i = 0; i < 300; i++) {
      const scramble = Array.from({ length: 25 }, () => RUF[Math.floor(next() * RUF.length)]);
      const corners = cornersOf(scramble);
      const moves = solveOptimal(corners);
      expect(moves.length).toBeLessThanOrEqual(11);
      expect(moves.length).toBe(optimalLength(corners));
      expect(isSolved2(applyMoves2(faceletsFromCorners(corners), moves))).toBe(true);
    }
  }, 60_000);

  it("finds the hardest positions in exactly 11 moves", () => {
    const { distance } = initTables2x2();
    const hardest = distance.indexOf(11);
    expect(hardest).toBeGreaterThan(0);
  });

  it("the solution replayed with the 3D engine solves the 3D cube", () => {
    const next = random(11);
    for (let i = 0; i < 50; i++) {
      const scramble = Array.from({ length: 15 }, () => RUF[Math.floor(next() * RUF.length)]);
      const start = applyMoves(createSolvedCube(2), scramble);
      const { moves } = solve2x2(faceletsFromCubeState2(start), "optimal");
      expect(isSolved2(faceletsFromCubeState2(applyMoves(start, moves)))).toBe(true);
    }
  });

  it("rejects impossible cubes", () => {
    const solved = solvedFacelets2();
    // One corner twisted on itself.
    const twisted = [...solved];
    [twisted[3], twisted[4], twisted[9]] = [solved[9], solved[3], solved[4]];
    expect(() => solve2x2(twisted, "optimal")).toThrow(/girada sobre sí misma/);
    // Two stickers of one corner swapped: its mirror image.
    const mirrored = [...solved];
    [mirrored[4], mirrored[9]] = [solved[9], solved[4]];
    expect(() => solve2x2(mirrored, "optimal")).toThrow(/espejo/);
    // A color five times.
    const counted = [...solved];
    counted[0] = "yellow";
    expect(() => solve2x2(counted, "ortega")).toThrow(/4 veces/);
    expect(cubeStateForSolution2(twisted, [])).toBeNull();
  });
});
