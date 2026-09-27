import { describe, expect, it } from "vitest";
import { applyMoves } from "@/features/cube/moves";
import type { CubeColor } from "@/features/cube/types";
import { faceOffset2, faceletsFromCorners, isSolved2 } from "./facelets";
import { countTurns, layerAfter, layerSwap, solve2x2, type Method2x2 } from "./methods";
import { applyMoves2, cubeStateForSolution2, faceletsFromCubeState2 } from "./sticker-moves";

/** A seeded random generator, so a failure can be reproduced. */
function random(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

/** Uniformly random 2×2s: any corners anywhere, any legal twist, held any way. */
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

const face = (f: CubeColor[], name: "U" | "D") => f.slice(faceOffset2(name), faceOffset2(name) + 4);
const uniform = (stickers: CubeColor[]) => stickers.every((c) => c === stickers[0]);

/** Replays the whole solution with the 3D engine, from the user's cube. */
function solvedIn3D(facelets: CubeColor[], moves: ReturnType<typeof solve2x2>["moves"]) {
  const start = cubeStateForSolution2(facelets, moves);
  expect(start).not.toBeNull();
  expect(faceletsFromCubeState2(start!)).toEqual(facelets);
  return isSolved2(faceletsFromCubeState2(applyMoves(start!, moves)));
}

describe.each(["optimal", "ortega", "cll"] as Method2x2[])("método %s", (method) => {
  it("solves 200 random cubes, checked with the 3D engine", () => {
    for (const cube of randomCubes(200, method.length)) {
      const solution = solve2x2(cube, method);
      expect(solution.moves).toEqual(solution.steps.flatMap((step) => step.moves));
      expect(solvedIn3D(cube, solution.moves)).toBe(true);
      for (const step of solution.steps) expect(step.explanation.length).toBeGreaterThan(20);
    }
  }, 60_000);

  it("an already solved cube needs no turns", () => {
    const [cube] = randomCubes(1, 3);
    const solution = solve2x2(cube, method);
    const solved = applyMoves2(cube, solution.moves);
    expect(countTurns(solve2x2(solved, method).moves)).toBe(0);
  });
});

describe("óptima", () => {
  it("never more than 11 turns, only R, U and F after placing the cube", () => {
    for (const cube of randomCubes(200, 21)) {
      const { steps } = solve2x2(cube, "optimal");
      const last = steps.at(-1)!;
      expect(last.title).toBe("Solución óptima");
      expect(last.moves.length).toBeLessThanOrEqual(11);
      expect(last.moves.every((move) => "RUF".includes(move[0]))).toBe(true);
      if (steps.length === 2) {
        expect(steps[0].title).toBe("Coloca el cubo");
        expect(steps[0].moves.every((move) => "xyz".includes(move[0]))).toBe(true);
      }
    }
  }, 60_000);
});

describe("Ortega", () => {
  it("Primera cara → OLL → PBL, each doing its job", () => {
    for (const cube of randomCubes(150, 5)) {
      const { steps } = solve2x2(cube, "ortega");
      expect(steps.map((s) => s.title)).toEqual(["Paso 1 · Primera cara", "Paso 2 · OLL", "Paso 3 · PBL"]);
      const afterFace = applyMoves2(cube, steps[0].moves);
      expect(uniform(face(afterFace, "D"))).toBe(true);
      expect(steps[0].caseName).toBe(`color ${{ white: "blanco", yellow: "amarillo", red: "rojo", orange: "naranja", green: "verde", blue: "azul" }[face(afterFace, "D")[0]]}`);
      const afterOll = applyMoves2(afterFace, steps[1].moves);
      expect(uniform(face(afterOll, "U")) && uniform(face(afterOll, "D"))).toBe(true);
      if (steps[1].moves.length) expect(steps[1].caseName).toMatch(/^caso (Sune|Antisune|Pi|U|T|L|H)$/);
      expect(isSolved2(applyMoves2(afterOll, steps[2].moves))).toBe(true);
    }
  }, 60_000);

  it("recognises all 7 OLL cases and all 5 PBL cases over many cubes", () => {
    const oll = new Set<string>();
    const pbl = new Set<string>();
    for (const cube of randomCubes(400, 9)) {
      const { steps } = solve2x2(cube, "ortega");
      if (steps[1].caseName?.startsWith("caso")) oll.add(steps[1].caseName);
      if (steps[2].caseName?.startsWith("caso")) pbl.add(steps[2].caseName.replace(" (dando la vuelta al cubo)", ""));
    }
    expect(oll.size).toBe(7);
    expect(pbl.size).toBe(5);
  }, 60_000);
});

describe("CLL", () => {
  it("Primera capa → CLL", () => {
    const seen = new Set<string>();
    for (const cube of randomCubes(400, 13)) {
      const { steps } = solve2x2(cube, "cll");
      expect(steps.map((s) => s.title)).toEqual(["Paso 1 · Primera capa", "Paso 2 · CLL"]);
      const afterLayer = applyMoves2(cube, steps[0].moves);
      expect(uniform(face(afterLayer, "D"))).toBe(true);
      expect(layerSwap(afterLayer, "bottom")).toBe("solved");
      expect(isSolved2(applyMoves2(afterLayer, steps[1].moves))).toBe(true);
      if (steps[1].caseName) seen.add(steps[1].caseName);
    }
    // 400 random cubes land in most of the 42 cases (each is 1/43 to 1/172 likely).
    expect(seen.size).toBeGreaterThan(30);
  }, 60_000);

  it("an algorithm that turns the cube (x') ends with the old top in front", () => {
    expect(layerAfter(["x'", "U2", "R"], "U")).toBe("F");
    expect(layerAfter(["y'", "R"], "U")).toBe("U");
  });
});
