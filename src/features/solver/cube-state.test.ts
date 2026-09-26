/**
 * The solver checked against the 3D cube (features/cube), the source of
 * truth for faces, colors and moves in RUBIKO. The whole path the screen
 * follows is exercised end to end:
 *
 *   3D state → 54 stickers → validation → CubieCube → worker request →
 *   solution → moves applied to the 3D cube → solved.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { createSolvedCube } from "@/features/cube/model";
import { ALL_MOVES, applyMoves, inverseMove, type Move } from "@/features/cube/moves";
import type { CubeColor, CubeState } from "@/features/cube/types";
import { generateScramble } from "@/features/scramble/generator";
import { FACE_NAMES, applyAlgorithm, solvedCube } from "./cubie";
import { cubeStateForSolution, faceletsFromCubeState } from "./cube-state";
import {
  CENTER_COLORS,
  faceletsFromCube,
  findTurnedFaces,
  neighborFace,
  parseFacelets,
  turnFace,
  validateFacelets,
  type Facelets,
} from "./facelets";
import { handleSolverRequest } from "./solver-requests";
import { initTables } from "./twophase";

const SCRAMBLE = "R U R' U' F2 D L' B U2 R2 F' L D2 B' U' R F2 L2 D' B2";

const toMoves = (algorithm: string) => algorithm.split(" ").filter(Boolean) as Move[];

/** The 3D cube after `algorithm`. */
const scrambled3D = (algorithm: string): CubeState => applyMoves(createSolvedCube(), toMoves(algorithm));

/** Stickers of the 3D cube after `algorithm`, as the user would paint them. */
const painted = (algorithm: string): Facelets => faceletsFromCubeState(scrambled3D(algorithm));

const SOLVED_STICKERS = painted("");

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

/**
 * The screen's path for some stickers: validate them, send the cube to the
 * worker's handler, check the answer with cubeStateForSolution. Returns
 * the moves shown to the user.
 */
function solveStickers(facelets: Facelets): Move[] {
  const validation = validateFacelets(facelets);
  if (validation.kind !== "valid") throw new Error(`${validation.kind}: ${validation.message}`);
  const response = handleSolverRequest({ type: "solve", id: 1, cube: validation.cube });
  if (response?.type !== "solved") throw new Error(JSON.stringify(response));
  expect(cubeStateForSolution(facelets, response.moves)).not.toBeNull();
  return response.moves as Move[];
}

/** 3D state → stickers → parser → solver → moves applied to the 3D cube → solved. */
function expectFullRoundTrip(algorithm: string) {
  const state = scrambled3D(algorithm);
  const moves = solveStickers(faceletsFromCubeState(state));
  expect(faceletsFromCubeState(applyMoves(state, moves)), algorithm).toEqual(SOLVED_STICKERS);
  return moves;
}

describe("3D cube → stickers → solver → 3D cube solved", () => {
  beforeAll(() => initTables(), 60_000);

  it("a solved cube is accepted, recognized as solved and needs no moves", () => {
    expect(SOLVED_STICKERS).toEqual(FACE_NAMES.flatMap((face) => Array(9).fill(CENTER_COLORS[face])));
    const validation = validateFacelets(SOLVED_STICKERS);
    expect(validation).toMatchObject({ kind: "valid", solved: true });
    expect(solveStickers(SOLVED_STICKERS)).toEqual([]);
  });

  it.each(ALL_MOVES)("after %s it is undone by the inverse move", (move) => {
    const validation = validateFacelets(painted(move));
    expect(validation).toMatchObject({ kind: "valid", solved: false });
    expect(expectFullRoundTrip(move)).toEqual([inverseMove(move)]);
  });

  it.each([
    "R U R' U'",
    "R U R' U' F2",
    "R2 U2 F2 D2 L2 B2",
    "R U R' U' R' F R2 U' R' U' R U R' F'", // T-perm
    "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2", // superflip
    SCRAMBLE,
  ])("solves %s", (algorithm) => {
    const moves = expectFullRoundTrip(algorithm);
    expect(moves.length).toBeLessThanOrEqual(30);
  });

  it("solves the scrambles RUBIKO generates for the timer", () => {
    for (let i = 0; i < 15; i++) {
      expectFullRoundTrip(generateScramble().join(" "));
    }
  }, 60_000);

  it("a cube typed by hand, face by face, reaches the solver", () => {
    // SCRAMBLE, copied from a real cube held white up, green front.
    const facelets = typed(`
      rog wwo bow   oyr rrr bgg   rwb ygg yyy
      rgo ryo oww   ybw rob ywb   wbg bby ogg`);
    expect(facelets).toEqual(painted(SCRAMBLE));
    const moves = solveStickers(facelets);
    expect(faceletsFromCubeState(applyMoves(scrambled3D(SCRAMBLE), moves))).toEqual(SOLVED_STICKERS);
  }, 60_000);
});

describe("stickers ↔ internal state", () => {
  it("the solver's 18 moves match the 3D move engine sticker by sticker", () => {
    for (const move of ALL_MOVES) {
      expect(painted(move), move).toEqual(faceletsFromCube(applyAlgorithm(solvedCube(), move)));
    }
  });

  it("3D state → stickers → CubieCube gives the solver's own model of that state", () => {
    for (const algorithm of ["R", "U2", "F'", "R U R' U'", SCRAMBLE]) {
      expect(parseFacelets(painted(algorithm))).toEqual({
        ok: true,
        cube: applyAlgorithm(solvedCube(), algorithm),
      });
    }
  });

  it("CubieCube → stickers → CubieCube keeps everything", () => {
    const cube = applyAlgorithm(solvedCube(), SCRAMBLE);
    expect(parseFacelets(faceletsFromCube(cube))).toEqual({ ok: true, cube });
  });
});

describe("the solution shown is checked against the 3D cube", () => {
  it("rebuilds the painted cube from its solution", () => {
    const moves = toMoves("R U R' U'").reverse().map(inverseMove);
    const start = cubeStateForSolution(painted("R U R' U'"), moves);
    expect(start && faceletsFromCubeState(start)).toEqual(painted("R U R' U'"));
  });

  it("rejects moves that do not solve the painted cube", () => {
    expect(cubeStateForSolution(painted("R U"), ["U'"])).toBeNull();
    expect(cubeStateForSolution(painted("R"), ["R"])).toBeNull();
    expect(cubeStateForSolution(painted("R"), ["X"])).toBeNull();
    expect(cubeStateForSolution(SOLVED_STICKERS, [])).not.toBeNull();
  });
});

describe("faces copied turned", () => {
  const scrambled = painted(SCRAMBLE);

  it.each(FACE_NAMES.flatMap((face) => ([1, 2, 3] as const).map((turns) => [face, turns] as const)))(
    "face %s turned %i quarter(s) is rejected and pointed at, never accepted",
    (face, turns) => {
      const wrong = turnFace(scrambled, { face, turns });
      expect(parseFacelets(wrong).ok).toBe(false);
      const fix = findTurnedFaces(wrong);
      expect(fix).toEqual([{ face, turns: 4 - turns }]);
      expect(fix!.reduce(turnFace, wrong)).toEqual(scrambled);
    },
  );

  it("finds two faces copied turned at once", () => {
    const wrong = turnFace(turnFace(scrambled, { face: "U", turns: 1 }), { face: "D", turns: 2 });
    expect(parseFacelets(wrong).ok).toBe(false);
    expect(findTurnedFaces(wrong)).toEqual([
      { face: "U", turns: 3 },
      { face: "D", turns: 2 },
    ]);
  });

  it("the screen reports a turned face instead of a bare corner error", () => {
    const wrong = turnFace(scrambled, { face: "F", turns: 1 });
    expect(validateFacelets(wrong)).toMatchObject({
      kind: "impossible",
      turned: [{ face: "F", turns: 3 }],
    });
  });

  it("a valid cube has no turned face to report", () => {
    expect(findTurnedFaces(scrambled)).toBeNull();
  });
});

describe("border markers of the face editor", () => {
  it("show the faces each side of the grid touches", () => {
    expect(
      (["U", "F", "D", "R", "B", "L"] as const).map((face) =>
        ([2, 4, 6, 8] as const).map((n) => neighborFace(face, n)).join(""),
      ),
    ).toEqual(["BLRF", "ULRD", "FLRB", "UFBD", "URLD", "UBFD"]);
  });
});
