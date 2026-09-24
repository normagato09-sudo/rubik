import { beforeAll, describe, expect, it } from "vitest";
import {
  MOVE_NAMES,
  applyAlgorithm,
  isSolved,
  solvedCube,
  type CubieCube,
} from "./cubie";
import { emptyFacelets, faceletsFromCube, parseFacelets, type Facelets } from "./facelets";
import { __coordinates as c, initTables, solve } from "./twophase";

/** Deterministic pseudo-random scrambles, so failures are reproducible. */
function scramble(seed: number, length = 25): string {
  let state = seed;
  const random = () => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
  const moves: string[] = [];
  let lastFace = "";
  while (moves.length < length) {
    const move = MOVE_NAMES[Math.floor(random() * MOVE_NAMES.length)];
    if (move[0] === lastFace) continue;
    lastFace = move[0];
    moves.push(move);
  }
  return moves.join(" ");
}

const roundTrip = (cube: CubieCube) => {
  const parsed = parseFacelets(faceletsFromCube(cube));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.cube;
};

describe("cubie moves", () => {
  it("four quarter turns of any face give back the solved cube", () => {
    for (const face of ["U", "R", "F", "D", "L", "B"]) {
      expect(isSolved(applyAlgorithm(solvedCube(), `${face} ${face} ${face} ${face}`))).toBe(true);
    }
  });

  it("the sexy move repeated 6 times is the identity", () => {
    expect(isSolved(applyAlgorithm(solvedCube(), "R U R' U' ".repeat(6)))).toBe(true);
  });
});

describe("coordinates", () => {
  it("set/get round-trip for every coordinate", () => {
    for (const value of [0, 1, 100, 2186]) expect(c.getTwist(c.setTwist(value))).toBe(value);
    for (const value of [0, 1, 777, 2047]) expect(c.getFlip(c.setFlip(value))).toBe(value);
    for (let value = 0; value < 495; value++) expect(c.getSlice(c.setSlice(value))).toBe(value);
    for (const value of [0, 1, 5040, 40319]) {
      expect(c.getCorners(c.setCorners(value))).toBe(value);
      expect(c.getUdEdges(c.setUdEdges(value))).toBe(value);
    }
    for (let value = 0; value < 24; value++) {
      expect(c.getSlicePerm(c.setSlicePerm(value))).toBe(value);
    }
  });

  it("the solved cube has every phase-2 coordinate at 0", () => {
    const solved = solvedCube();
    expect([c.getTwist(solved), c.getFlip(solved), c.getCorners(solved)]).toEqual([0, 0, 0]);
    expect(c.getSlice(solved)).toBe(c.SLICE_SOLVED);
  });
});

describe("facelets", () => {
  it("round-trips any reachable cube", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const cube = applyAlgorithm(solvedCube(), scramble(seed));
      expect(roundTrip(cube)).toEqual(cube);
    }
  });

  it("asks for the missing stickers", () => {
    const result = parseFacelets(emptyFacelets());
    expect(result).toEqual({ ok: false, error: "Faltan 48 pegatinas por colorear." });
  });

  const broken = (edit: (facelets: Facelets) => void) => {
    const facelets = faceletsFromCube(applyAlgorithm(solvedCube(), scramble(7)));
    edit(facelets);
    const result = parseFacelets(facelets);
    return result.ok ? "ok" : result.error;
  };

  it("rejects a wrong number of stickers of one color", () => {
    expect(broken((f) => (f[0] = f[0] === "red" ? "blue" : "red"))).toMatch(/tienen que ser 9/);
  });

  it("rejects a twisted corner", () => {
    // URF corner: U9, R1, F3 rotated in place.
    expect(broken((f) => ([f[8], f[9], f[20]] = [f[9], f[20], f[8]]))).toMatch(/esquina girada/);
  });

  it("rejects a flipped edge", () => {
    // UR edge: U6, R2 swapped.
    expect(broken((f) => ([f[5], f[10]] = [f[10], f[5]]))).toMatch(/arista dada la vuelta/);
  });

  it("rejects two swapped edges (parity)", () => {
    const cube = applyAlgorithm(solvedCube(), scramble(3));
    [cube.ep[0], cube.ep[1]] = [cube.ep[1], cube.ep[0]];
    [cube.eo[0], cube.eo[1]] = [cube.eo[1], cube.eo[0]];
    const result = parseFacelets(faceletsFromCube(cube));
    expect(result.ok ? "ok" : result.error).toMatch(/intercambiadas/);
  });
});

describe("two-phase solver", () => {
  beforeAll(() => initTables(), 60_000);

  it("returns no moves for a solved cube", () => {
    expect(solve(solvedCube())).toEqual([]);
  });

  it("solves a single move with its inverse", () => {
    expect(solve(applyAlgorithm(solvedCube(), "R"))).toEqual(["R'"]);
  });

  it("solves random cubes read from their stickers, in at most 30 moves", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const scrambled = roundTrip(applyAlgorithm(solvedCube(), scramble(seed)));
      const solution = solve(scrambled, { improveForMs: 0 });
      expect(solution.length).toBeLessThanOrEqual(30);
      expect(isSolved(applyAlgorithm(scrambled, solution.join(" "))), `seed ${seed}`).toBe(true);
    }
  }, 60_000);

  it("finds a short solution when given time to improve", () => {
    const scrambled = applyAlgorithm(solvedCube(), scramble(42));
    const solution = solve(scrambled, { improveForMs: 500 });
    expect(isSolved(applyAlgorithm(scrambled, solution.join(" ")))).toBe(true);
    expect(solution.length).toBeLessThanOrEqual(24);
  }, 60_000);
});
