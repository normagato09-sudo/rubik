import { describe, expect, it } from "vitest";
import { parseCubeAlgorithm } from "@/features/cube/algorithm";
import { applyMoves, invertMoves, type Move } from "@/features/cube/moves";
import type { CubeState, Vec3 } from "@/features/cube/types";
import { FACELET_GEOMETRY } from "@/features/solver/cube-state";
import {
  BLOCK_223,
  COLL_ALGORITHMS,
  F2L,
  FREE_EDGES,
  PETRUS_222,
  PETRUS_222_CASES,
  PETRUS_223,
  PETRUS_COLL_CASES,
  PETRUS_EO,
  PETRUS_EO_CASES,
  PETRUS_EPLL_CASES,
  PETRUS_F2L,
  STEP_MOVES,
  ALL_EDGES,
  LEFT_BLOCK,
  ZZ_EO,
  ZZ_EO_CASES,
  ZZ_F2L,
  ZZ_LINE,
  ZZ_OCLL_CASES,
  ZZ_PLL_CASES,
  badEdges,
  expandMoves,
  mirrorAlgorithm,
} from "./cases-3x3-research";
import { PLL_CASES } from "./pll-cases";
import { caseState3 as unheldCase, edgeIsGood, heldLike, piecesSolved, positionsWhere, sheetSolved3, stickersAt } from "./cube3";
import { colorsOf, shortest, solvedStickers, turnAll, turnsOf, type Stickers } from "./search-3x3";

const solved = sheetSolved3();
/** The case, held with its centers home (some algorithms start by turning the whole cube). */
const caseState3 = (algorithm: string) => heldLike(unheldCase(algorithm));
const same = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const undo = (algorithm: string) => invertMoves(parseCubeAlgorithm(algorithm)).join(" ");

/** Whether every sticker of the region is home. */
const regionDone = (region: (p: Vec3) => boolean) => {
  const places = [...stickersAt(positionsWhere(region))];
  return (state: Stickers) => places.every((i) => state[i] === i);
};

/** edgeIsGood on stickers, for the search. */
function edgesGood(state: Stickers, edges: Vec3[] = FREE_EDGES): boolean {
  const colors = colorsOf(state);
  return edges.every((edge) => {
    const places = [...stickersAt([edge])];
    const own = places.map((i) => colors[i]);
    let key = own.findIndex((c) => c === "yellow" || c === "white");
    if (key === -1) key = own.findIndex((c) => c === "green" || c === "blue");
    const normal = FACELET_GEOMETRY[places[key]][1];
    return normal[1] !== 0 || (edge[1] === 0 && normal[2] !== 0);
  });
}

describe("Petrus and ZZ: the intuitive steps' cases", () => {
  const steps = [
    { setId: "petrus-222", defs: PETRUS_222 },
    { setId: "petrus-223", defs: PETRUS_223 },
    { setId: "petrus-f2l", defs: PETRUS_F2L },
    { setId: "zz-linea", defs: ZZ_LINE },
    { setId: "zz-f2l", defs: ZZ_F2L },
  ] as const;

  for (const { setId, defs } of steps) {
    it(`${setId}: only the step's moves, and nothing already built moves`, () => {
      for (const def of defs) {
        const allowed = expandMoves(def.moves ?? STEP_MOVES[setId]);
        expect(parseCubeAlgorithm(def.algorithm).every((move) => allowed.includes(move)), def.algorithm).toBe(true);
        const built = positionsWhere(def.goal).filter((p) => !def.pieces.some((piece) => same(piece, p)));
        expect(piecesSolved(caseState3(def.algorithm), built), def.algorithm).toBe(true);
        expect(def.pieces.some((piece) => !piecesSolved(caseState3(def.algorithm), [piece])), def.algorithm).toBe(true);
      }
    });

    it(`${setId}: each algorithm is the shortest the engine finds`, () => {
      for (const def of defs) {
        const allowed = expandMoves(def.moves ?? STEP_MOVES[setId]) as Move[];
        const found = shortest(turnAll(solvedStickers(), undo(def.algorithm)), allowed, regionDone(def.goal), 8);
        expect(found?.length, def.algorithm).toBe(parseCubeAlgorithm(def.algorithm).length);
      }
    });
  }

  it("the F2L and line steps start with the edges oriented, as EO leaves them", () => {
    for (const def of [...PETRUS_F2L, ...ZZ_LINE, ...ZZ_F2L]) {
      const state = caseState3(def.algorithm);
      expect(ALL_EDGES.filter((edge) => !edgeIsGood(state, edge)), def.algorithm).toEqual([]);
    }
  });

  it("ZZ's left block is the mirror of the right one", () => {
    expect(mirrorAlgorithm("R U2 R' U' R U R'")).toBe("L' U2 L U L' U' L");
    expect(ZZ_F2L.slice(0, 7).map((def) => def.algorithm)).toEqual(PETRUS_F2L.map((def) => mirrorAlgorithm(def.algorithm)));
    expect(positionsWhere(LEFT_BLOCK)).toHaveLength(9);
  });

  it("the explanations say where the pieces are", () => {
    expect(PETRUS_EO_CASES[0].explanation).toContain("2 aristas malas: arriba delante y arriba a la derecha.");
    expect(PETRUS_222_CASES[0].explanation).toContain(
      "La esquina blanca-verde-roja está arriba, delante a la izquierda, con el blanco mirando hacia ti; la arista verde-roja está arriba a la izquierda, con el verde mirando hacia arriba.",
    );
  });
});

describe("Petrus: edge orientation", () => {
  it("edgeIsGood: R, U, L, D and half turns of F and B keep it; a quarter turn of F flips 4 edges", () => {
    const good = (state: CubeState) => FREE_EDGES.concat([[0, -1, 1], [-1, 0, 1], [-1, -1, 0], [0, -1, -1], [-1, 0, -1]]).filter((e) => !edgeIsGood(state, e));
    expect(good(applyMoves(solved, parseCubeAlgorithm("R U L' D2 F2 B2 U' R2 L D'")))).toEqual([]);
    expect(good(applyMoves(solved, parseCubeAlgorithm("F")))).toHaveLength(4);
  });

  it("every case keeps the 2×2×3, fixes all its bad edges, and is the shortest with R, U and F", () => {
    for (const { algorithm } of PETRUS_EO) {
      const state = caseState3(algorithm);
      expect(piecesSolved(state, positionsWhere(BLOCK_223)), algorithm).toBe(true);
      expect(badEdges(state).length, algorithm).toBeGreaterThan(0);
      const found = shortest(turnAll(solvedStickers(), undo(algorithm)), turnsOf(STEP_MOVES["petrus-eo"]), (s) => regionDone(BLOCK_223)(s) && edgesGood(s), 5);
      expect(found?.length, algorithm).toBe(parseCubeAlgorithm(algorithm).length);
    }
  });
});

describe("ZZ: edge orientation", () => {
  it("every case leaves the twelve edges good, and is the shortest the engine finds", () => {
    for (const { algorithm } of ZZ_EO) {
      const found = shortest(turnAll(solvedStickers(), undo(algorithm)), turnsOf(STEP_MOVES["zz-eo"]), (s) => edgesGood(s, ALL_EDGES), 3);
      expect(found?.length, algorithm).toBe(parseCubeAlgorithm(algorithm).length);
    }
  });

  it("the explanations name the bad edges the text works with", () => {
    const bad = (index: number) => ZZ_EO_CASES[index].explanation!.split(".")[0];
    expect(bad(0)).toBe("4 aristas malas: arriba delante, en la capa del medio, delante a la derecha, en la capa del medio, delante a la izquierda y abajo delante");
    expect(bad(1)).toContain("abajo a la izquierda");
    expect(bad(2)).toContain("arriba a la izquierda");
    expect(bad(3)).toBe("2 aristas malas: arriba delante y arriba a la derecha");
    expect(bad(4)).toMatch(/^6 aristas malas/);
  });
});

// ---------- the last layer ----------

/** The top corners, clockwise seen from above: back left, back right, front right, front left. */
const SLOTS: Vec3[] = [
  [-1, 1, -1],
  [1, 1, -1],
  [1, 1, 1],
  [-1, 1, 1],
];

/**
 * The top corners as (which corner, how it is turned) per slot. The turn
 * counts where yellow is in a cycle of the corner's three faces that a U
 * turn carries from slot to slot (top, then the side along x or z).
 */
function topCorners(state: CubeState): { piece: number; twist: number }[] {
  return SLOTS.map((slot) => {
    const cubie = state.cubies.find((c) => same(c.position, slot))!;
    const home = solved.cubies.find((c) => c.id === cubie.id)!.position;
    const piece = SLOTS.findIndex((s) => same(s, home));
    const cycle: Vec3[] =
      slot[0] * slot[2] > 0
        ? [[0, 1, 0], [slot[0], 0, 0], [0, 0, slot[2]]]
        : [[0, 1, 0], [0, 0, slot[2]], [slot[0], 0, 0]];
    const yellow = cubie.stickers.find((s) => s.color === "yellow")!;
    const axis = yellow.face[1] as "x" | "y" | "z";
    const sign = yellow.face[0] === "+" ? 1 : -1;
    const normal = cubie.orientation[axis].map((c) => c * sign) as unknown as Vec3;
    return { piece, twist: cycle.findIndex((n) => same(n, normal)) };
  });
}

type Corners = { piece: number; twist: number }[];

/** The same case whatever U turn comes before (slots) or after (which corner is which). */
function caseKey(corners: Corners): string {
  const keys: string[] = [];
  for (let before = 0; before < 4; before++) {
    for (let after = 0; after < 4; after++) {
      keys.push(
        SLOTS.map((_, i) => {
          const { piece, twist } = corners[(i + before) % 4];
          return `${(piece + after) % 4}${twist}`;
        }).join(),
      );
    }
  }
  return keys.sort()[0];
}

/** Every way the top corners can be, as the engine allows them (twists add up to a whole turn). */
function allCornerCases(): Set<string> {
  const keys = new Set<string>();
  const perms = (items: number[]): number[][] =>
    items.length === 0 ? [[]] : items.flatMap((x) => perms(items.filter((y) => y !== x)).map((rest) => [x, ...rest]));
  for (const perm of perms([0, 1, 2, 3])) {
    for (let t = 0; t < 27; t++) {
      const twists = [t % 3, Math.floor(t / 3) % 3, Math.floor(t / 9) % 3];
      twists.push((6 - twists[0] - twists[1] - twists[2]) % 3);
      keys.add(caseKey(perm.map((piece, i) => ({ piece, twist: twists[i] }))));
    }
  }
  return keys;
}

const SOLVED_KEY = caseKey(topCorners(solved));

const SUNE_TWIST = () => topCorners(caseState3("R U R' U R U2 R'")).find((c) => c.twist !== 0)!.twist;

/** The family of the corners' shape on top: O, H, Pi, U, T, L, S (Sune) or AS (Antisune). */
function shapeOf(state: CubeState): string {
  const corners = topCorners(state);
  const up = corners.filter((c) => c.twist === 0).length;
  // Where the yellow of each turned corner looks.
  const looks = SLOTS.flatMap((slot) => {
    const cubie = state.cubies.find((c) => same(c.position, slot))!;
    const yellow = cubie.stickers.find((s) => s.color === "yellow")!;
    const normal = cubie.orientation[yellow.face[1] as "x" | "y" | "z"].map((c) => c * (yellow.face[0] === "+" ? 1 : -1));
    return normal[1] === 1 ? [] : [normal.join()];
  });
  if (up === 4) return "O";
  if (up === 0) return new Set(looks).size === 2 ? "H" : "Pi";
  if (up === 1) return corners.every((c) => c.twist === 0 || c.twist === SUNE_TWIST()) ? "S" : "AS";
  const diagonal = (corners[0].twist === 0 && corners[2].twist === 0) || (corners[1].twist === 0 && corners[3].twist === 0);
  if (diagonal) return "L";
  return looks[0] === looks[1] ? "U" : "T";
}

describe("Petrus: COLL", () => {
  it("has the 40 cases of SpeedCubeDB and the 2 with the corners already turned", () => {
    expect(COLL_ALGORITHMS).toHaveLength(40);
    expect(PETRUS_COLL_CASES).toHaveLength(42);
  });

  it("every algorithm keeps the first two layers and every edge's orientation", () => {
    for (const kase of PETRUS_COLL_CASES) {
      const state = caseState3(kase.algorithm);
      expect(piecesSolved(state, positionsWhere(F2L)), kase.name).toBe(true);
      expect(badEdges(state), kase.name).toEqual([]);
    }
  });

  it("the 42 cases are all different, and are every case the engine counts", () => {
    const all = allCornerCases();
    all.delete(SOLVED_KEY);
    expect(all.size).toBe(42);
    const keys = PETRUS_COLL_CASES.map((kase) => caseKey(topCorners(caseState3(kase.algorithm))));
    expect(new Set(keys).size).toBe(42);
    for (const key of keys) expect(all.has(key)).toBe(true);
  });

  it("each case has the corner shape its name says", () => {
    for (const kase of PETRUS_COLL_CASES) expect(shapeOf(caseState3(kase.algorithm)), kase.name).toBe(kase.name!.split(" ")[0]);
  });
});

describe("ZZ: OCLL and PLL", () => {
  it("are the 7 OCLL of the OLL sheet (Antisune from SpeedCubeDB) and its 21 PLL", () => {
    expect(ZZ_OCLL_CASES.map((kase) => kase.name)).toEqual(["H", "Pi", "U", "T", "L", "Antisune", "Sune"]);
    expect(ZZ_OCLL_CASES[5].research?.name).toBe("SpeedCubeDB · OLL");
    expect(ZZ_PLL_CASES.map((kase) => kase.algorithm)).toEqual(PLL_CASES.map((kase) => kase.algorithm));
  });

  it("every OCLL keeps the first two layers and the edges, and has the shape of its name", () => {
    const family: Record<string, string> = { Antisune: "AS", Sune: "S" };
    for (const kase of ZZ_OCLL_CASES) {
      const state = caseState3(kase.algorithm);
      expect(piecesSolved(state, positionsWhere(F2L)), kase.name).toBe(true);
      expect(badEdges(state), kase.name).toEqual([]);
      expect(shapeOf(state), kase.name).toBe(family[kase.name!] ?? kase.name);
    }
  });

  it("the 7 are every way the corners can be turned, as the engine counts them", () => {
    const shapes = new Set<string>();
    for (let t = 0; t < 27; t++) {
      const twists = [t % 3, Math.floor(t / 3) % 3, Math.floor(t / 9) % 3];
      twists.push((6 - twists[0] - twists[1] - twists[2]) % 3);
      shapes.add([0, 1, 2, 3].map((k) => [0, 1, 2, 3].map((i) => twists[(i + k) % 4]).join("")).sort()[0]);
    }
    shapes.delete("0000");
    expect(shapes.size).toBe(7);
    const cases = ZZ_OCLL_CASES.map((kase) => {
      const twists = topCorners(caseState3(kase.algorithm)).map((c) => c.twist);
      return [0, 1, 2, 3].map((k) => [0, 1, 2, 3].map((i) => twists[(i + k) % 4]).join("")).sort()[0];
    });
    expect(new Set(cases)).toEqual(shapes);
  });
});

describe("Petrus: EPLL", () => {
  /** Top edges, clockwise from above: back, right, front, left. */
  const EDGES: Vec3[] = [
    [0, 1, -1],
    [1, 1, 0],
    [0, 1, 1],
    [-1, 1, 0],
  ];

  /** Where the algorithm takes the edge on each top place (as a place index), up to a final U turn. */
  function edgeMoves(algorithm: string): number[] {
    const state = caseState3(algorithm);
    return EDGES.map((place) => {
      const cubie = state.cubies.find((c) => same(c.position, place))!;
      return EDGES.findIndex((e) => same(e, solved.cubies.find((c) => c.id === cubie.id)!.position));
    });
  }

  it("are Ua, Ub, H and Z of the PLL sheet, which keep everything but the top edges' places", () => {
    expect(PETRUS_EPLL_CASES.map((kase) => kase.name)).toEqual(["Ua", "Ub", "H", "Z"]);
    for (const kase of PETRUS_EPLL_CASES) {
      const state = caseState3(kase.algorithm);
      const notEdges = positionsWhere((p) => !EDGES.some((e) => same(e, p)));
      expect(piecesSolved(state, notEdges), kase.name).toBe(true);
      expect(badEdges(state), kase.name).toEqual([]);
    }
  });

  it("their explanations say how the edges move", () => {
    const [ua, ub, h, z] = PETRUS_EPLL_CASES.map((kase) => edgeMoves(kase.algorithm));
    // Each place holds the edge whose home is `moves[place]`: the algorithm sends it there.
    /** Whether each moved edge goes to the next moved place clockwise (from above), or anticlockwise. */
    const direction = (moves: number[]) => {
      const moved = [0, 1, 2, 3].filter((place) => moves[place] !== place);
      const next = (place: number, step: number) => moved[(moved.indexOf(place) + step + moved.length) % moved.length];
      if (moved.every((place) => moves[place] === next(place, 1))) return "horario";
      if (moved.every((place) => moves[place] === next(place, -1))) return "antihorario";
      return "otro";
    };
    expect(ua.filter((home, place) => home !== place)).toHaveLength(3);
    expect(direction(ua)).toBe("antihorario");
    expect(direction(ub)).toBe("horario");
    expect(PETRUS_EPLL_CASES[0].explanation).toContain("antihorario");
    expect(PETRUS_EPLL_CASES[1].explanation).toContain("en sentido horario");
    expect(h.map((home, place) => (home - place + 4) % 4)).toEqual([2, 2, 2, 2]);
    expect(z.every((home, place) => home !== place && Math.abs(home - place) % 2 === 1)).toBe(true);
  });
});
