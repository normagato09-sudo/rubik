import { describe, expect, it } from "vitest";
import type { CubeColor } from "@/features/cube/types";
import { SKEWB_CORNERS, faceOffsetSkewb } from "./geometry";
import {
  FIXED_CORNER_STICKERS,
  asHeldForSolver,
  emptySkewbFacelets,
  findTurnedSkewbFaces,
  skewbPieceIssues,
  turnSkewbFace,
  validateSkewbFacelets,
} from "./facelets";
import { ALL_SKEWB_MOVES, applySkewbMoves, applySkewbTurns, isSolvedSkewb, solvedSkewb, type SkewbMove, type SkewbRotation } from "./moves";
import { CORNER_STICKERS, piecesFromStickers, skewbDistances, stateIndex } from "./search";
import { solveSkewb } from "./solve";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
}

const randomMoves = (random: () => number, n: number): SkewbMove[] =>
  Array.from({ length: n }, () => ALL_SKEWB_MOVES[Math.floor(random() * ALL_SKEWB_MOVES.length)]);

const ROTATIONS: SkewbRotation[] = ["x", "x'", "x2", "y", "y'", "y2", "z", "z'", "z2"];

/** The same Skewb held another way. */
const turned = (colors: readonly CubeColor[], rotations: SkewbRotation[]) =>
  applySkewbTurns(colors, rotations.map((rotation) => ({ kind: "rotation" as const, rotation })));

const scrambled = (seed: number) => applySkewbMoves(solvedSkewb(), randomMoves(seeded(seed), 30));

describe("Skewb solver", () => {
  it("solves a painted Skewb held any way, in the fewest moves, without turning the corner at up-front-right", () => {
    const random = seeded(5);
    const distance = skewbDistances();
    for (let n = 0; n < 200; n++) {
      const held = turned(
        applySkewbMoves(solvedSkewb(), randomMoves(random, 25)),
        [ROTATIONS[Math.floor(random() * 9)], ROTATIONS[Math.floor(random() * 9)]],
      );
      expect(validateSkewbFacelets(held).kind).toBe("valid");
      const moves = solveSkewb(held);
      expect(moves.length).toBeLessThanOrEqual(11);
      expect(moves).toHaveLength(distance[stateIndex(piecesFromStickers(asHeldForSolver(held)!))]);
      const after = applySkewbMoves(held, moves);
      expect(isSolvedSkewb(after)).toBe(true);
      expect(FIXED_CORNER_STICKERS.map((i) => after[i])).toEqual(FIXED_CORNER_STICKERS.map((i) => held[i]));
    }
  });

  it("knows a solved Skewb held any way, and solves it with no moves", () => {
    for (const rotations of [[], ["x"], ["y", "z"], ["z2", "y'"]] as SkewbRotation[][]) {
      const held = turned(solvedSkewb(), rotations);
      expect(validateSkewbFacelets(held)).toMatchObject({ kind: "valid", solved: true });
      expect(solveSkewb(held)).toEqual([]);
    }
  });

  it("rejects impossible Skewbs with the reason", () => {
    expect(() => solveSkewb(swapCenters(solvedSkewb()))).toThrow(/centros intercambiados/);
  });
});

function swapCenters(colors: readonly CubeColor[]) {
  const next = [...colors];
  [next[0], next[5]] = [next[5], next[0]];
  return next;
}

describe("Skewb validation", () => {
  it("counts what is missing, face by face", () => {
    const facelets = emptySkewbFacelets();
    expect(validateSkewbFacelets(facelets)).toMatchObject({ kind: "incomplete", message: "Faltan 30 pegatinas por pintar." });
    const almost = [...solvedSkewb()] as (CubeColor | null)[];
    almost[faceOffsetSkewb("B") + 2] = null;
    expect(validateSkewbFacelets(almost)).toMatchObject({ kind: "incomplete", message: "Falta 1 pegatina por pintar.", missingByFace: [{ face: "B", missing: 1 }] });
  });

  it("each color has to be there 5 times", () => {
    const colors = [...solvedSkewb()];
    colors[1] = "red";
    const validation = validateSkewbFacelets(colors);
    expect(validation.kind).toBe("count");
    if (validation.kind === "count") expect(validation.message).toBe("Cada color tiene que aparecer 5 veces (blanco: 4, rojo: 6).");
  });

  it("finds impossible pieces as soon as they are painted", () => {
    const only = (pairs: [number, CubeColor][]) => {
      const facelets = emptySkewbFacelets();
      for (const [i, color] of pairs) facelets[i] = color;
      return skewbPieceIssues(facelets).map((issue) => issue.message);
    };
    expect(only([[0, "white"], [5, "white"]])).toEqual(["Hay 2 centros de color blanco: cada color tiene un solo centro."]);
    const [a, b, c] = CORNER_STICKERS[SKEWB_CORNERS.indexOf("DBL")];
    expect(only([[a, "green"], [b, "green"], [c, "red"]])[0]).toMatch(/color repetido/);
    expect(only([[a, "white"], [b, "yellow"], [c, "red"]])[0]).toMatch(/colores opuestos/);
    // The real corner yellow-blue-orange, the other way round.
    const solved = solvedSkewb();
    expect(only([[a, solved[a]], [b, solved[c]], [c, solved[b]]])[0]).toMatch(/como en un espejo/);
    const [d, e, f] = CORNER_STICKERS[SKEWB_CORNERS.indexOf("UFR")];
    expect(only([[a, solved[a]], [b, solved[b]], [c, solved[c]], [d, solved[a]], [e, solved[b]], [f, solved[c]]])[0]).toMatch(/aparece dos veces/);
  });

  it("says why a complete Skewb cannot be: two centers swapped, a corner twisted", () => {
    const centers = validateSkewbFacelets(swapCenters(scrambled(1)));
    expect(centers.kind).toBe("impossible");
    if (centers.kind === "impossible") expect(centers.message).toMatch(/dos centros intercambiados/);

    const twisted = [...scrambled(2)];
    const [a, b, c] = CORNER_STICKERS[SKEWB_CORNERS.indexOf("DBL")];
    [twisted[a], twisted[b], twisted[c]] = [twisted[b], twisted[c], twisted[a]];
    const corners = validateSkewbFacelets(twisted);
    expect(corners.kind).toBe("impossible");
    if (corners.kind === "impossible") expect(corners.message).toMatch(/esquina girada/);
  });

  it("finds a face copied turned and how to turn it back", () => {
    for (const [seed, face, turns] of [
      [3, "R", 1],
      [4, "D", 2],
      [6, "B", 3],
    ] as const) {
      const real = scrambled(seed);
      const copied = turnSkewbFace(real, { face, turns });
      const validation = validateSkewbFacelets(copied);
      expect(validation.kind).toBe("impossible");
      const fix = findTurnedSkewbFaces(copied);
      expect(fix).not.toBeNull();
      expect(validateSkewbFacelets(fix!.reduce(turnSkewbFace, copied)).kind).toBe("valid");
    }
  });

  it("four quarter turns of a face leave it as it was", () => {
    const real = scrambled(9);
    let face = [...real] as (CubeColor | null)[];
    for (let k = 0; k < 4; k++) face = turnSkewbFace(face, { face: "U", turns: 1 });
    expect(face).toEqual(real);
  });
});
