import { beforeAll, describe, expect, it } from "vitest";
import {
  MOVE_NAMES,
  applyAlgorithm,
  cubeProblem,
  isSolved,
  solvedCube,
  type CubieCube,
} from "./cubie";
import {
  emptyFacelets,
  faceletsFromCube,
  findTurnedFaces,
  parseFacelets,
  validateFacelets,
  type Facelets,
} from "./facelets";
import { handleSolverRequest } from "./solver-requests";
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

const FACES = ["U", "R", "F", "D", "L", "B"];

describe("cubie moves", () => {
  it("four quarter turns of any face give back the solved cube", () => {
    for (const face of FACES) {
      expect(isSolved(applyAlgorithm(solvedCube(), `${face} ${face} ${face} ${face}`))).toBe(true);
    }
  });

  it("every move followed by its inverse gives back the solved cube", () => {
    for (const face of FACES) {
      expect(isSolved(applyAlgorithm(solvedCube(), `${face} ${face}'`))).toBe(true);
      expect(isSolved(applyAlgorithm(solvedCube(), `${face}' ${face}`))).toBe(true);
    }
  });

  it("a double move is two quarter turns, and undoes itself", () => {
    for (const face of FACES) {
      expect(applyAlgorithm(solvedCube(), `${face}2`)).toEqual(
        applyAlgorithm(solvedCube(), `${face} ${face}`),
      );
      expect(isSolved(applyAlgorithm(solvedCube(), `${face}2 ${face}2`))).toBe(true);
    }
  });

  it("every single move leaves a reachable, unsolved cube", () => {
    for (const move of MOVE_NAMES) {
      const cube = applyAlgorithm(solvedCube(), move);
      expect(isSolved(cube), move).toBe(false);
      expect(cubeProblem(cube), move).toBeNull();
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

/** Stickers of a solved cube with some of them swapped (counts stay 9/9). */
const swapped = (...pairs: [number, number][]) => {
  const facelets = faceletsFromCube(solvedCube());
  for (const [a, b] of pairs) [facelets[a], facelets[b]] = [facelets[b], facelets[a]];
  return facelets;
};

const errorOf = (facelets: Facelets) => {
  const result = parseFacelets(facelets);
  return result.ok ? "ok" : result.error;
};

describe("stickers → cube", () => {
  it("round-trips any reachable cube", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const cube = applyAlgorithm(solvedCube(), scramble(seed));
      expect(roundTrip(cube)).toEqual(cube);
    }
  });

  it("reads a solved cube as solved", () => {
    expect(validateFacelets(faceletsFromCube(solvedCube()))).toEqual({
      kind: "valid",
      cube: solvedCube(),
      solved: true,
    });
  });
});

describe("incomplete input", () => {
  it("asks for the missing stickers, face by face", () => {
    expect(parseFacelets(emptyFacelets())).toEqual({
      ok: false,
      reason: "incomplete",
      error: "Faltan 48 pegatinas por colorear.",
      stickers: [],
    });
    const validation = validateFacelets(emptyFacelets());
    expect(validation).toMatchObject({ kind: "incomplete", issues: [] });
    expect(validation.kind === "incomplete" && validation.missingByFace).toEqual(
      FACES.map((face) => ({ face, missing: 8 })),
    );
  });

  it("counts a single missing sticker in the singular", () => {
    const facelets = faceletsFromCube(solvedCube());
    facelets[0] = null;
    expect(errorOf(facelets)).toBe("Falta 1 pegatina por colorear.");
    expect(validateFacelets(facelets)).toMatchObject({
      kind: "incomplete",
      missingByFace: [{ face: "U", missing: 1 }],
    });
  });

  it("warns about too many stickers of a color before the cube is complete", () => {
    const facelets = emptyFacelets();
    [0, 1, 2, 3, 5, 6, 7, 8, 18, 19].forEach((i) => (facelets[i] = "red"));
    const validation = validateFacelets(facelets);
    expect(validation.kind).toBe("incomplete");
    expect(validation.kind === "incomplete" && validation.issues[0].message).toMatch(
      /Hay 11 pegatinas de color rojo: sobran 2/,
    );
  });

  it("flags an impossible piece as soon as it is painted", () => {
    const facelets = emptyFacelets();
    facelets[8] = "white"; // U9, on the URF corner
    facelets[9] = "white"; // R1, same corner
    const validation = validateFacelets(facelets);
    expect(validation.kind === "incomplete" && validation.issues).toEqual([
      {
        message:
          "La esquina entre los centros blanco, rojo y verde tiene dos pegatinas de color blanco: cada pieza tiene colores distintos.",
        stickers: [8, 9],
      },
    ]);
  });
});

describe("wrong number of stickers of a color", () => {
  it("lists every color that is off", () => {
    const facelets = faceletsFromCube(solvedCube());
    facelets[0] = "red";
    expect(parseFacelets(facelets)).toMatchObject({
      ok: false,
      reason: "count",
      error:
        "Hay 8 pegatinas de color blanco y 10 de color rojo; cada color tiene que aparecer exactamente 9 veces.",
    });
  });

  it("rejects a scrambled cube with one sticker repainted", () => {
    const facelets = faceletsFromCube(applyAlgorithm(solvedCube(), scramble(7)));
    facelets[0] = facelets[0] === "red" ? "blue" : "red";
    expect(validateFacelets(facelets).kind).toBe("count");
  });
});

describe("impossible cubes (every color 9/9)", () => {
  it("impossible corner: the same color twice", () => {
    // U9 (URF corner) ↔ F1 (UFL corner): URF becomes green, red, green.
    expect(errorOf(swapped([8, 18]))).toMatch(
      /esquina entre los centros blanco, rojo y verde tiene dos pegatinas de color verde/,
    );
  });

  it("impossible corner: two opposite colors", () => {
    // F3 (URF) ↔ L1 (ULB): URF becomes white, red, orange.
    expect(errorOf(swapped([20, 36]))).toMatch(/rojo y naranja, que son colores opuestos/);
  });

  it("impossible corner: its mirror image", () => {
    // R1 ↔ F3 on URF: white, green, red — going round the wrong way.
    const facelets = swapped([9, 20]);
    expect(errorOf(facelets)).toMatch(/en un orden que no existe/);
    expect(parseFacelets(facelets)).toMatchObject({ stickers: [8, 9, 20] });
  });

  it("impossible edge: the same color twice", () => {
    // U6 (UR edge) ↔ F2 (UF edge): UF becomes white, white.
    expect(errorOf(swapped([5, 19]))).toMatch(
      /arista entre los centros blanco y verde tiene dos pegatinas de color blanco/,
    );
  });

  it("impossible edge: two opposite colors", () => {
    // U6 (UR edge) ↔ L2 (UL edge): UR becomes orange, red.
    expect(errorOf(swapped([5, 37]))).toMatch(
      /arista entre los centros blanco y rojo tiene naranja y rojo, que son colores opuestos/,
    );
  });

  it("repeated corner (and one missing)", () => {
    const cube = solvedCube();
    cube.cp[1] = 0; // URF twice, UFL missing…
    cube.ep[0] = 2; // …with an edge that keeps the counts at 9/9
    expect(errorOf(faceletsFromCube(cube))).toMatch(/Hay dos esquinas blanco, rojo y verde/);
  });

  it("repeated edge (and one missing)", () => {
    const cube = solvedCube();
    cube.ep[1] = 0; // UR twice, UF missing
    cube.ep[4] = 5; // DF twice, DR missing
    expect(errorOf(faceletsFromCube(cube))).toMatch(/Hay dos aristas blanco y rojo/);
  });

  it("orientation: a twisted corner", () => {
    // URF corner: U9, R1, F3 rotated in place.
    const facelets = faceletsFromCube(applyAlgorithm(solvedCube(), scramble(7)));
    [facelets[8], facelets[9], facelets[20]] = [facelets[9], facelets[20], facelets[8]];
    expect(errorOf(facelets)).toMatch(/esquina girada/);
  });

  it("orientation: a flipped edge", () => {
    // UR edge: U6, R2 swapped.
    const facelets = faceletsFromCube(applyAlgorithm(solvedCube(), scramble(7)));
    [facelets[5], facelets[10]] = [facelets[10], facelets[5]];
    expect(errorOf(facelets)).toMatch(/arista dada la vuelta/);
  });

  it("parity: two swapped edges", () => {
    const cube = applyAlgorithm(solvedCube(), scramble(3));
    [cube.ep[0], cube.ep[1]] = [cube.ep[1], cube.ep[0]];
    [cube.eo[0], cube.eo[1]] = [cube.eo[1], cube.eo[0]];
    expect(errorOf(faceletsFromCube(cube))).toMatch(/intercambiadas/);
  });

  it("parity: two swapped corners", () => {
    const cube = solvedCube();
    [cube.cp[0], cube.cp[1]] = [cube.cp[1], cube.cp[0]];
    expect(errorOf(faceletsFromCube(cube))).toMatch(/intercambiadas/);
  });

  it("an impossible cube is explained, never solved", () => {
    const twisted = swapped();
    [twisted[8], twisted[9], twisted[20]] = [twisted[9], twisted[20], twisted[8]];
    expect(validateFacelets(twisted)).toMatchObject({ kind: "impossible", turned: null });
    expect(findTurnedFaces(twisted)).toBeNull();
  });
});

describe("two-phase solver", () => {
  beforeAll(() => initTables(), 60_000);

  it("returns no moves for a solved cube", () => {
    expect(solve(solvedCube())).toEqual([]);
  });

  it("solves every single move with its inverse", () => {
    for (const move of MOVE_NAMES) {
      const inverse = move.endsWith("'") ? move[0] : move.endsWith("2") ? move : `${move}'`;
      expect(solve(applyAlgorithm(solvedCube(), move)), move).toEqual([inverse]);
    }
  });

  it("solves random cubes read from their stickers, in at most 30 moves", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const scrambled = roundTrip(applyAlgorithm(solvedCube(), scramble(seed)));
      const solution = solve(scrambled, { improveForMs: 0 });
      expect(solution.length).toBeLessThanOrEqual(30);
      expect(isSolved(applyAlgorithm(scrambled, solution.join(" "))), `seed ${seed}`).toBe(true);
    }
  }, 60_000);

  it("refuses impossible cubes instead of searching forever", () => {
    const parity = solvedCube();
    [parity.ep[0], parity.ep[1]] = [parity.ep[1], parity.ep[0]];
    const twist = solvedCube();
    twist.co[0] = 1;
    const flip = solvedCube();
    flip.eo[0] = 1;
    for (const cube of [parity, twist, flip]) expect(() => solve(cube)).toThrow(/Cubo imposible/);
  });

  it("finds a short solution when given time to improve", () => {
    const scrambled = applyAlgorithm(solvedCube(), scramble(42));
    const solution = solve(scrambled, { improveForMs: 500 });
    expect(isSolved(applyAlgorithm(scrambled, solution.join(" ")))).toBe(true);
    expect(solution.length).toBeLessThanOrEqual(24);
  }, 60_000);
});

describe("solver worker requests", () => {
  beforeAll(() => initTables(), 60_000);

  it("warms up the tables", () => {
    expect(handleSolverRequest({ type: "warmup" })).toEqual({ type: "ready" });
  });

  it("answers a solve request with moves that solve the cube", () => {
    const cube = applyAlgorithm(solvedCube(), scramble(11));
    const response = handleSolverRequest({ type: "solve", id: 7, cube });
    expect(response).toMatchObject({ type: "solved", id: 7 });
    const moves = response?.type === "solved" ? response.moves : [];
    expect(isSolved(applyAlgorithm(cube, moves.join(" ")))).toBe(true);
  });

  it("answers with an error (never throws) for a cube it cannot solve", () => {
    const cube = solvedCube();
    cube.co[0] = 2;
    expect(handleSolverRequest({ type: "solve", id: 3, cube })).toMatchObject({ type: "error", id: 3 });
    const broken = { cp: [0], co: [], ep: [], eo: [] };
    expect(handleSolverRequest({ type: "solve", id: 4, cube: broken })).toMatchObject({
      type: "error",
      id: 4,
    });
  });
});
