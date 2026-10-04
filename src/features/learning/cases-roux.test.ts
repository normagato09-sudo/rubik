import { describe, expect, it } from "vitest";
import { parseCubeAlgorithm } from "@/features/cube/algorithm";
import { invertMoves, type Move } from "@/features/cube/moves";
import type { Vec3 } from "@/features/cube/types";
import { FACELET_GEOMETRY } from "@/features/solver/cube-state";
import { expandMoves } from "./cases-3x3-research";
import {
  BOTH_BLOCKS,
  CMLL_ALGORITHMS,
  LSE_EDGES,
  ROUX_CMLL_CASES,
  ROUX_EO_ALGORITHMS,
  ROUX_EO_CASES,
  ROUX_FIRST_BLOCK,
  ROUX_M_ALGORITHMS,
  ROUX_M_CASES,
  ROUX_SECOND_BLOCK,
  ROUX_ULUR_ALGORITHMS,
  ROUX_ULUR_CASES,
  cmllFamily,
} from "./cases-roux";
import { SOLVED_KEY, allCornerCases, caseKey, shapeOf, topCorners } from "./corners-3x3";
import { caseState3 as unheldCase, facelets3, piecesSolved, positionsWhere, sticker3, stickersAt } from "./cube3";
import { colorsOf, shortest, solvedStickers, turn, turnAll, type Stickers } from "./search-3x3";
import { ALGORITHM_SETS } from "./sets";

/** M turns the centers, so the cases are never held again by them. */
const caseState3 = unheldCase;
const same = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const undo = (algorithm: string) => invertMoves(parseCubeAlgorithm(algorithm)).join(" ");
const start = (algorithm: string) => turnAll(solvedStickers(), undo(algorithm));
const length = (algorithm: string) => parseCubeAlgorithm(algorithm).length;

const regionDone = (region: (p: Vec3) => boolean) => {
  const places = [...stickersAt(positionsWhere(region))];
  return (state: Stickers) => places.every((i) => state[i] === i);
};

describe("Roux: the two blocks", () => {
  const steps = [
    { name: "primer bloque", defs: ROUX_FIRST_BLOCK },
    { name: "segundo bloque", defs: ROUX_SECOND_BLOCK },
  ];

  for (const { name, defs } of steps) {
    it(`${name}: only the step's moves, and nothing already built moves`, () => {
      for (const def of defs) {
        const allowed = expandMoves(def.moves!);
        expect(parseCubeAlgorithm(def.algorithm).every((move) => allowed.includes(move)), def.algorithm).toBe(true);
        const built = positionsWhere(def.goal).filter((p) => !def.pieces.some((piece) => same(piece, p)));
        expect(piecesSolved(caseState3(def.algorithm), built), def.algorithm).toBe(true);
        expect(def.pieces.some((piece) => !piecesSolved(caseState3(def.algorithm), [piece])), def.algorithm).toBe(true);
      }
    });

    it(`${name}: each algorithm is the shortest the engine finds`, () => {
      for (const def of defs) {
        const found = shortest(start(def.algorithm), expandMoves(def.moves!) as Move[], regionDone(def.goal), 8);
        expect(found?.length, def.algorithm).toBe(length(def.algorithm));
      }
    }, 120_000);
  }

  it("the second block never touches the first: R, U, M and r leave the left third alone", () => {
    for (const def of ROUX_SECOND_BLOCK) {
      expect(piecesSolved(caseState3(def.algorithm), positionsWhere((p) => p[0] === -1 && p[1] <= 0)), def.algorithm).toBe(true);
    }
  });

  it("the explanations say where the pieces are", () => {
    expect(ALGORITHM_SETS["roux-bloque1"][0].explanation).toMatch(/^La arista blanca-roja está /);
    expect(ALGORITHM_SETS["roux-bloque2"][2].explanation).toMatch(/^La arista blanca-naranja está abajo detrás/);
  });
});

describe("Roux: CMLL", () => {
  it("has SpeedCubeDB's 42 cases", () => {
    expect(CMLL_ALGORITHMS).toHaveLength(42);
    expect(ROUX_CMLL_CASES.every((kase) => kase.research?.name === "SpeedCubeDB · CMLL")).toBe(true);
  });

  it("every algorithm keeps both blocks and the yellow center on top", () => {
    for (const kase of ROUX_CMLL_CASES) {
      const state = caseState3(kase.algorithm);
      expect(piecesSolved(state, positionsWhere(BOTH_BLOCKS)), kase.name).toBe(true);
      expect(facelets3(state)[sticker3("U", 4)], kase.name).toBe("yellow");
    }
  });

  it("the 42 are all different, and are every corner case the engine counts", () => {
    const all = allCornerCases();
    all.delete(SOLVED_KEY);
    const keys = ROUX_CMLL_CASES.map((kase) => caseKey(topCorners(caseState3(kase.algorithm))));
    expect(new Set(keys).size).toBe(42);
    expect(new Set(keys)).toEqual(all);
  });

  it("each case has the corner shape its name says", () => {
    for (const kase of ROUX_CMLL_CASES) expect(shapeOf(caseState3(kase.algorithm)), kase.name).toBe(cmllFamily(kase.name!));
  });
});

// ---------- LSE ----------

const MU = expandMoves(["M", "U"]) as Move[];
const placesOf = (piece: Vec3) => [...stickersAt([piece])];
const U_CENTER = sticker3("U", 4);

/** Each LSE edge as bad (1) or good (0): its yellow or white sticker faces up or down. */
function badBits(state: Stickers): number[] {
  const colors = colorsOf(state);
  return LSE_EDGES.map((edge) => {
    const places = placesOf(edge);
    const key = places.find((i) => colors[i] === "yellow" || colors[i] === "white")!;
    return FACELET_GEOMETRY[key][1][1] !== 0 ? 0 : 1;
  });
}
const centersUpDown = (state: Stickers) => ["yellow", "white"].includes(colorsOf(state)[U_CENTER]);
const eoDone = (state: Stickers) => centersUpDown(state) && badBits(state).every((bit) => bit === 0);

/** The same pattern whatever U turn comes first: the four top edges turn, the two bottom ones stay. */
const turnBits = (b: number[]) => [b[3], b[0], b[1], b[2], b[4], b[5]];
function eoKey(bits: number[]): string {
  const keys: string[] = [];
  for (let k = 0; k < 4; k++, bits = turnBits(bits)) keys.push(bits.join(""));
  return keys.sort()[0];
}

const UL: Vec3 = [-1, 1, 0];
const UR: Vec3 = [1, 1, 0];
const TOP_CORNERS: Vec3[] = [
  [-1, 1, -1],
  [1, 1, -1],
  [1, 1, 1],
  [-1, 1, 1],
];
const exact = (pieces: Vec3[]) => {
  const places = pieces.flatMap(placesOf);
  return (state: Stickers) => places.every((i) => state[i] === i);
};
const ulurExact = exact([UL, UR, ...TOP_CORNERS]);
/** 4b is done when the two edges are in their places, next to their corners, with every edge oriented. */
const ulurDone = (state: Stickers) => eoDone(state) && ulurExact(state);

/** Which of the six LSE places (UF, UR, UB, UL, DF, DB) holds the piece whose home is `home`. */
const slotOf = (state: Stickers, home: Vec3) => LSE_EDGES.findIndex((edge) => placesOf(home).includes(state[placesOf(edge)[0]]) || placesOf(home).includes(state[placesOf(edge)[1]]));
const turnSlot = (slot: number) => (slot < 4 ? (slot + 1) % 4 : slot);

/** Where the two edges are, whatever U turn comes first; both at the bottom is one case whichever is in front. */
function pairKey(state: Stickers): string {
  let [a, b] = [slotOf(state, UL), slotOf(state, UR)];
  if (a >= 4 && b >= 4) return "abajo";
  const keys: string[] = [];
  for (let k = 0; k < 4; k++, [a, b] = [turnSlot(a), turnSlot(b)]) keys.push(`${a}${b}`);
  return keys.sort()[0];
}

describe("Roux: LSE 4a, edge orientation", () => {
  it("only M and U, and each algorithm is the shortest the engine finds", () => {
    for (const algorithm of ROUX_EO_ALGORITHMS) {
      expect(parseCubeAlgorithm(algorithm).every((move) => MU.includes(move)), algorithm).toBe(true);
      expect(centersUpDown(start(algorithm)), algorithm).toBe(true);
      expect(shortest(start(algorithm), MU, eoDone, 12)?.length, algorithm).toBe(length(algorithm));
    }
  }, 60_000);

  it("the 11 are every pattern of bad edges, whatever U turn comes first", () => {
    const all = new Set<string>();
    for (let n = 0; n < 64; n++) {
      const bits = [0, 1, 2, 3, 4, 5].map((i) => (n >> i) & 1);
      if (bits.reduce((a, b) => a + b) % 2 === 0) all.add(eoKey(bits));
    }
    all.delete("000000");
    expect(all.size).toBe(11);
    const keys = ROUX_EO_ALGORITHMS.map((algorithm) => eoKey(badBits(start(algorithm))));
    expect(new Set(keys)).toEqual(all);
    expect(keys).toHaveLength(11);
  });

  it("the explanations count the bad edges", () => {
    expect(ROUX_EO_CASES[0].explanation).toMatch(/^\d aristas malas: /);
    for (const kase of ROUX_EO_CASES) {
      const bad = badBits(start(kase.algorithm)).filter((bit) => bit === 1).length;
      expect(kase.explanation!.startsWith(`${bad} aristas malas`), kase.algorithm).toBe(true);
    }
  });
});

describe("Roux: LSE 4b, the left and right edges", () => {
  it("start with every edge oriented; each algorithm is the shortest the engine finds", () => {
    for (const algorithm of ROUX_ULUR_ALGORITHMS) {
      expect(eoDone(start(algorithm)), algorithm).toBe(true);
      expect(shortest(start(algorithm), MU, ulurDone, 10)?.length, algorithm).toBe(length(algorithm));
    }
  });

  it("the 7 are every place the two edges can be (both at the bottom counts once)", () => {
    const all = new Set<string>();
    for (let a = 0; a < 6; a++) {
      for (let b = 0; b < 6; b++) {
        if (a === b) continue;
        let [x, y] = [a, b];
        if (x >= 4 && y >= 4) {
          all.add("abajo");
          continue;
        }
        const keys: string[] = [];
        for (let k = 0; k < 4; k++, [x, y] = [turnSlot(x), turnSlot(y)]) keys.push(`${x}${y}`);
        all.add(keys.sort()[0]);
      }
    }
    all.delete(pairKey(solvedStickers()));
    expect(all.size).toBe(7);
    const keys = ROUX_ULUR_ALGORITHMS.map((algorithm) => pairKey(start(algorithm)));
    expect(new Set(keys)).toEqual(all);
  });

  it("the explanations name both edges", () => {
    for (const kase of ROUX_ULUR_CASES) expect(kase.explanation).toMatch(/^La arista amarilla-roja está .*la arista amarilla-naranja está /);
  });
});

describe("Roux: LSE 4c, the M layer", () => {
  const M_LAYER: Vec3[] = [
    [0, 1, 1],
    [0, 1, -1],
    [0, -1, 1],
    [0, -1, -1],
  ];
  const solvedAll = (state: Stickers) => state.every((from, i) => from === i);
  const rest = exact([UL, UR, ...TOP_CORNERS]);

  /** Which home place's edge sits on each place of the M layer (the yellow center is on top). */
  const layer = (state: Stickers) =>
    M_LAYER.map((place) => M_LAYER.findIndex((home) => placesOf(home).includes(state[placesOf(place)[0]]))).join("");

  it("start with the yellow center on top and the rest done; each is the shortest the engine finds", () => {
    for (const algorithm of ROUX_M_ALGORITHMS) {
      const state = start(algorithm);
      expect(colorsOf(state)[U_CENTER], algorithm).toBe("yellow");
      expect(eoDone(state) && rest(state), algorithm).toBe(true);
      expect(shortest(state, MU, solvedAll, 10)?.length, algorithm).toBe(length(algorithm));
    }
  }, 60_000);

  it("the 11 are every way the M layer can be, as the engine reaches it with M and U", () => {
    // Every state the engine reaches from solved with M and U keeping the rest done and yellow on top.
    const seen = new Set<string>(["0123"]);
    let frontier: Stickers[] = [solvedStickers()];
    const visited = new Set<string>([solvedStickers().join()]);
    for (let depth = 0; depth < 10; depth++) {
      const next: Stickers[] = [];
      for (const state of frontier) {
        for (const move of MU) {
          const after = turn(state, move);
          const key = after.join();
          if (visited.has(key)) continue;
          visited.add(key);
          next.push(after);
          if (rest(after) && colorsOf(after)[U_CENTER] === "yellow") seen.add(layer(after));
        }
      }
      frontier = next;
    }
    seen.delete("0123");
    expect(seen.size).toBe(11);
    const keys = ROUX_M_ALGORITHMS.map((algorithm) => layer(start(algorithm)));
    expect(new Set(keys)).toEqual(seen);
    expect(keys).toHaveLength(11);
  }, 60_000);

  it("the explanations say where the moved edges are", () => {
    for (const kase of ROUX_M_CASES) expect(kase.explanation).toMatch(/^Con el amarillo arriba: la arista /);
  });
});
