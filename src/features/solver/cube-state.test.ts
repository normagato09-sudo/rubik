/**
 * The solver checked against the 3D cube (features/cube), the source of
 * truth for faces, colors and moves in RUBIKO: a cube turned with the 3D
 * move engine, read sticker by sticker as the solver screen asks the user
 * to, must reach the solver unchanged and be solved.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { createSolvedCube } from "@/features/cube/model";
import { applyMoves, type Move } from "@/features/cube/moves";
import type { CubeColor } from "@/features/cube/types";
import { applyAlgorithm, isSolved, solvedCube } from "./cubie";
import { faceletsFromCubeState } from "./cube-state";
import {
  CENTER_COLORS,
  faceOffset,
  faceletsFromCube,
  findTurnedFace,
  neighborFace,
  parseFacelets,
  type Facelets,
} from "./facelets";
import { initTables, solve } from "./twophase";

const SCRAMBLE = "R U R' U' F2 D L' B U2 R2 F' L D2 B' U' R F2 L2 D' B2";

/** Stickers of the 3D cube after `algorithm`, as the user would paint them. */
const painted = (algorithm: string): Facelets =>
  faceletsFromCubeState(
    applyMoves(createSolvedCube(), algorithm.split(" ").filter(Boolean) as Move[]),
  );

/** Same, typed by hand face by face (U R F D L B, w y r o b g). */
const typed = (faces: string): Facelets => {
  const colors: Record<string, CubeColor> = {
    w: "white",
    y: "yellow",
    r: "red",
    o: "orange",
    b: "blue",
    g: "green",
  };
  return [...faces.replace(/\s/g, "")].map((letter) => colors[letter]);
};

/** The screen's path: validate the stickers, then solve as solver.worker.ts does. */
const solveStickers = (facelets: Facelets) => {
  const parsed = parseFacelets(facelets);
  if (!parsed.ok) throw new Error(parsed.error);
  return { cube: parsed.cube, moves: solve(parsed.cube, { improveForMs: 400 }) };
};

describe("stickers of the 3D cube → solver", () => {
  beforeAll(() => initTables(), 60_000);

  it("a solved cube is accepted and needs no moves", () => {
    const facelets = painted("");
    expect(facelets).toEqual(
      (["U", "R", "F", "D", "L", "B"] as const).flatMap((face) => Array(9).fill(CENTER_COLORS[face])),
    );
    expect(solveStickers(facelets).moves).toEqual([]);
  });

  it.each([
    ["R", "R'"],
    ["U", "U'"],
    ["F", "F'"],
  ])("after %s the solver reads the same cube and undoes it with %s", (move, inverse) => {
    expect(painted(move)).toEqual(faceletsFromCube(applyAlgorithm(solvedCube(), move)));
    expect(solveStickers(painted(move)).moves).toEqual([inverse]);
  });

  it("the solver's 18 moves match the 3D move engine sticker by sticker", () => {
    for (const face of ["U", "R", "F", "D", "L", "B"]) {
      for (const move of [face, `${face}2`, `${face}'`]) {
        expect(painted(move), move).toEqual(faceletsFromCube(applyAlgorithm(solvedCube(), move)));
      }
    }
  });

  it("solves a cube scrambled with a sequence of moves", () => {
    const facelets = painted(SCRAMBLE);
    const { cube, moves } = solveStickers(facelets);
    expect(cube).toEqual(applyAlgorithm(solvedCube(), SCRAMBLE));
    expect(isSolved(applyAlgorithm(cube, moves.join(" ")))).toBe(true);
    // The solution also solves the real 3D cube.
    const solved3D = applyMoves(
      applyMoves(createSolvedCube(), SCRAMBLE.split(" ") as Move[]),
      moves as Move[],
    );
    expect(faceletsFromCubeState(solved3D)).toEqual(painted(""));
  });

  it("internal state → colors → internal state keeps everything", () => {
    const cube = applyAlgorithm(solvedCube(), SCRAMBLE);
    const parsed = parseFacelets(faceletsFromCube(cube));
    expect(parsed).toEqual({ ok: true, cube });
  });

  it("a cube typed by hand, face by face, reaches the solver", () => {
    // The scramble above, copied from a real cube held white up, green front.
    const facelets = typed(`
      rog wwo bow   oyr rrr bgg   rwb ygg yyy
      rgo ryo oww   ybw rob ywb   wbg bby ogg`);
    expect(facelets).toEqual(painted(SCRAMBLE));
    const { cube, moves } = solveStickers(facelets);
    expect(isSolved(applyAlgorithm(cube, moves.join(" ")))).toBe(true);
  }, 60_000);
});

describe("invalid stickers are still rejected", () => {
  it("tells apart incomplete input, wrong counts and impossible cubes", () => {
    const incomplete = painted(SCRAMBLE);
    incomplete[0] = null;
    expect(parseFacelets(incomplete)).toMatchObject({ ok: false, reason: "incomplete" });

    const wrongCount = painted(SCRAMBLE);
    wrongCount[0] = wrongCount[0] === "red" ? "blue" : "red";
    expect(parseFacelets(wrongCount)).toMatchObject({ ok: false, reason: "count" });

    // Every color 9/9, but the URF corner is twisted in place.
    const twisted = painted(SCRAMBLE);
    [twisted[8], twisted[9], twisted[20]] = [twisted[9], twisted[20], twisted[8]];
    expect(parseFacelets(twisted)).toMatchObject({ ok: false, reason: "impossible" });
    expect(findTurnedFace(twisted)).toBeNull();
  });

  it("points at a face that was copied turned, without accepting it", () => {
    const facelets = painted(SCRAMBLE);
    const d = facelets.slice(faceOffset("D"), faceOffset("D") + 9);
    facelets.splice(faceOffset("D"), 9, ...d.reverse()); // read upside down
    expect(parseFacelets(facelets)).toMatchObject({ ok: false, reason: "impossible" });
    expect(findTurnedFace(facelets)).toEqual({ face: "D", turns: 2 });
  });

  it("a valid cube has no turned face to report", () => {
    expect(findTurnedFace(painted(SCRAMBLE))).toBeNull();
  });
});

describe("border markers of the face editor", () => {
  it("show the faces each side of the grid touches", () => {
    expect(["U", "F", "D", "R", "B", "L"].map((face) =>
      ([2, 4, 6, 8] as const).map((n) => neighborFace(face as "U", n)).join(""),
    )).toEqual(["BLRF", "ULRD", "FLRB", "UFBD", "URLD", "UBFD"]);
  });
});
