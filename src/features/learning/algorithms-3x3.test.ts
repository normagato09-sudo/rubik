import { describe, expect, it } from "vitest";
import { parseCubeAlgorithm } from "@/features/cube/algorithm";
import { createSolvedCube } from "@/features/cube/model";
import { applyMoves, type Move } from "@/features/cube/moves";
import type { CubeState, Cubie } from "@/features/cube/types";
import { CRUZ_CASES } from "./cruz-cases";
import { ESQUINAS_CASES } from "./esquinas-cases";
import { F2L_CASES } from "./f2l-cases";
import { OLL_CASES } from "./oll-cases";
import { PLL_CASES } from "./pll-cases";

/**
 * The 3×3 sheets' algorithms run on RUBIKO's engine, now that it turns
 * M, E, S and wide moves too: each must leave alone what its step has
 * already solved.
 */
const solved = createSolvedCube();
const coords = (cubie: Cubie) => cubie.id.split(",").map(Number);
const isCenter = (cubie: Cubie) => coords(cubie).filter((c) => c === 0).length === 2;
const layer = (cubie: Cubie) => coords(cubie)[1];

/** The 24 ways of holding the cube. */
const HOLDS: Move[][] = ([[], ["x"], ["x2"], ["x'"], ["z"], ["z'"]] as Move[][]).flatMap((a) =>
  ([[], ["y"], ["y2"], ["y'"]] as Move[][]).map((b) => [...a, ...b]),
);

/** The cube after `algorithm`, held again with its centers home (an algorithm may turn the whole cube). */
function after(algorithm: string): CubeState {
  const state = applyMoves(solved, parseCubeAlgorithm(algorithm));
  for (const hold of HOLDS) {
    const held = applyMoves(state, hold);
    if (held.cubies.every((cubie, i) => !isCenter(cubie) || cubie.position.join() === solved.cubies[i].position.join())) return held;
  }
  throw new Error(`${algorithm}: los centros no vuelven a su sitio`);
}

/** The pieces (not centers) chosen by `which` that the algorithm moved or turned. */
function moved(algorithm: string, which: (cubie: Cubie) => boolean): string[] {
  return after(algorithm)
    .cubies.filter((cubie, i) => !isCenter(cubie) && which(solved.cubies[i]))
    .filter((cubie) => {
      const home = solved.cubies.find((piece) => piece.id === cubie.id)!;
      return cubie.position.join() !== home.position.join() || JSON.stringify(cubie.orientation) !== JSON.stringify(home.orientation);
    })
    .map((cubie) => cubie.id);
}

const firstTwoLayers = (cubie: Cubie) => layer(cubie) < 1;
const cross = (cubie: Cubie) => layer(cubie) === -1 && coords(cubie).filter((c) => c === 0).length === 1;

describe("the 3×3 sheets' algorithms on the engine", () => {
  it("every algorithm of Cruz, Esquinas, F2L, OLL and PLL can be read and turned", () => {
    for (const kase of [...CRUZ_CASES, ...ESQUINAS_CASES, ...F2L_CASES, ...OLL_CASES, ...PLL_CASES]) {
      expect(() => after(kase.algorithm), `${kase.setId} ${kase.id}`).not.toThrow();
    }
  });

  it("F2L keeps the cross", () => {
    for (const kase of F2L_CASES) expect(moved(kase.algorithm, cross), `F2L ${kase.id}`).toEqual([]);
  });

  it("OLL and PLL keep the first two layers", () => {
    for (const kase of [...OLL_CASES, ...PLL_CASES]) expect(moved(kase.algorithm, firstTwoLayers), `${kase.setId} ${kase.id}`).toEqual([]);
  });

  it("PLL also keeps the top layer's white on top", () => {
    for (const kase of PLL_CASES) {
      for (const cubie of after(kase.algorithm).cubies.filter((piece) => layer(piece) === 1 && !isCenter(piece))) {
        const white = cubie.stickers.find((sticker) => sticker.color === "white")!;
        const axis = white.face[1] as "x" | "y" | "z";
        const sign = white.face[0] === "+" ? 1 : -1;
        expect(cubie.orientation[axis][1] * sign, `PLL ${kase.id} ${cubie.id}`).toBe(1);
      }
    }
  });
});
