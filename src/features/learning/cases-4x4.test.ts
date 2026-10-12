import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LAST_TWO_STARTS,
  OLL_PARITY,
  OLL_PARITY_OTHER,
  PLL_PARITY,
  SETS_4X4,
  cases4x4,
  generated4x4Diagrams,
  type Set4Id,
} from "./cases-4x4";
import {
  EDGES_4,
  SOLVED_4,
  WINGS_4,
  allPaired,
  apply4,
  caseColors4,
  centersSolved,
  edgeOf,
  parse4,
  reaches,
  shortest4,
  wingAt,
  withTurns,
  withWings,
} from "./cube4";
import { METHOD_CATEGORIES, METHOD_CUBE } from "./categories";
import { NOTATION_MOVES_4X4, notationMovesFor } from "./notation";
import { ALGORITHM_SETS, METHOD_STEPS, getSetInfo } from "./sets";

const file = (image: string) => join(process.cwd(), "public", image);
const SET_IDS = Object.keys(SETS_4X4) as Set4Id[];

describe("4×4 cases in Aprender", () => {
  it.each(SET_IDS)("%s: every algorithm reaches its goal", (setId) => {
    for (const kase of cases4x4(setId)) {
      const end = apply4(kase.start, parse4(kase.algorithm));
      expect(reaches(end, kase.goal, kase.frame), `${kase.name}: ${kase.algorithm}`).toBe(true);
      if (kase.also) expect(kase.also(end), kase.name).toBe(true);
      // The case is not already done.
      expect(reaches(kase.start, kase.goal, kase.frame) && (!kase.also || kase.also(kase.start)), kase.name).toBe(false);
    }
  });

  it.each(SET_IDS)("%s: the intuitive steps use the shortest the engine finds with the step's moves", (setId) => {
    for (const kase of cases4x4(setId).filter((k) => k.moves)) {
      const length = parse4(kase.algorithm).length;
      const goal = (colors: Parameters<typeof reaches>[0]) => reaches(colors, kase.goal, kase.frame) && (!kase.also || kase.also(colors));
      const found = shortest4(kase.start, goal, withTurns(kase.moves!), length);
      expect(found.length, `${kase.name}: nothing as short as ${kase.algorithm}`).toBeGreaterThan(0);
      expect(found[0].length, kase.name).toBe(length);
    }
  }, 120_000);

  it("every case has a name, an explanation, its diagram and its source", () => {
    for (const cases of Object.values(SETS_4X4)) {
      for (const kase of cases) {
        expect(kase.name).toBeTruthy();
        expect(kase.explanation?.length, kase.name).toBeGreaterThan(80);
        expect(kase.explanation, kase.name).not.toMatch(/undefined|NaN/);
        expect(kase.research?.url).toMatch(/^https:\/\/www\.speedsolving\.com\/wiki\//);
      }
    }
  });

  it("the cases of one set are all different", () => {
    for (const setId of SET_IDS) {
      const starts = cases4x4(setId).map((kase) => kase.start.join());
      expect(new Set(starts).size, setId).toBe(starts.length);
    }
  });
});

describe("the four 4×4 methods", () => {
  const METHODS = ["reduccion", "freeslice", "hoya", "yau"] as const;

  it("each has its steps, then CFOP's F2L, OLL and PLL and the parities", () => {
    expect(METHOD_STEPS.reduccion.map((step) => step.setId)).toEqual(["r4-centros", "r4-aristas", "c4-cruz", "c4-esquinas"]);
    expect(METHOD_STEPS.freeslice.map((step) => step.setId)).toEqual(["fs4-centros", "fs4-aristas", "fs4-l4e", "c4-cruz", "c4-esquinas"]);
    expect(METHOD_STEPS.hoya.map((step) => step.setId)).toEqual(["hoya-centros", "hoya-cruz", "hoya-centros4", "hoya-aristas"]);
    expect(METHOD_STEPS.yau.map((step) => step.setId)).toEqual(["yau-centros", "yau-cruz3", "yau-centros4", "yau-cruz4", "yau-aristas"]);
    for (const method of METHODS) {
      expect(METHOD_CUBE[method]).toBe("4x4");
      expect(METHOD_CATEGORIES[method].map((block) => block.id).slice(0, 5)).toEqual(["notation", "steps", "c4-f2l", "c4-oll", "c4-pll"]);
      for (const step of METHOD_STEPS[method].filter((step) => step.setId in SETS_4X4)) {
        expect(step.intro?.length, step.setId).toBeGreaterThan(100);
        expect(getSetInfo(step.setId).method).toBe(method);
      }
      for (const block of METHOD_CATEGORIES[method].slice(2)) expect(block.intro?.length, block.id).toBeGreaterThan(100);
    }
  });

  it("every 4×4 set is in one method, and the parities are a block of each", () => {
    const listed = METHODS.flatMap((method) => [
      ...METHOD_STEPS[method].map((step) => step.setId),
      ...METHOD_CATEGORIES[method].map((block) => block.id),
    ]);
    for (const setId of SET_IDS) {
      expect(listed, setId).toContain(setId);
      expect(ALGORITHM_SETS[setId].length, setId).toBeGreaterThan(0);
    }
  });

  it("the notation has the 18 moves of each face: R, Rw and r", () => {
    expect(notationMovesFor("4x4")).toBe(NOTATION_MOVES_4X4);
    expect(NOTATION_MOVES_4X4.map((move) => move.move)).toEqual(
      ["R", "L", "U", "D", "F", "B"].flatMap((face) => [face, `${face}w`, face.toLowerCase()]),
    );
  });
});

describe("the last two edges", () => {
  const places = [...edgeOf("F", "L"), ...edgeOf("F", "R")].map(wingAt);

  it("the four pieces can sit in 24 ways: 8 with both edges paired, and the other 16 are the two cases", () => {
    const permutations = (list: number[]): number[][] =>
      list.length <= 1 ? [list] : list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [x, ...rest]));
    const all = permutations(places).map((pieces) => withWings(SOLVED_4, pieces.map((piece, k) => [piece, places[k]])));
    expect(all).toHaveLength(24);
    expect(all.filter(allPaired)).toHaveLength(8);
    // Each of the other 16 is paired by one of the two algorithms, 8 each.
    const unpaired = all.filter((colors) => !allPaired(colors));
    const pairs = (algorithm: string) =>
      unpaired.filter((start) => {
        const end = apply4(start, parse4(algorithm));
        return allPaired(end) && centersSolved(end);
      }).length;
    const [same, other] = cases4x4("r4-aristas").slice(-2).map((kase) => kase.algorithm);
    expect([pairs(same), pairs(other)]).toEqual([8, 8]);
  });

  it("the two starts leave everything else paired", () => {
    for (const start of [LAST_TWO_STARTS.same, LAST_TWO_STARTS.other]) {
      const unpaired = EDGES_4.filter(([a1, b1, a2, b2]) => start[a1] !== start[b1] || start[a2] !== start[b2]);
      expect(unpaired).toHaveLength(2);
      expect(WINGS_4.length).toBe(24);
    }
  });
});

describe("the parities", () => {
  it("OLL parity flips one edge and nothing else: its two pieces still match, both the wrong way", () => {
    const start = caseColors4(OLL_PARITY);
    const differ = start.flatMap((color, i) => (color === SOLVED_4[i] ? [] : [i]));
    expect(differ).toHaveLength(4);
    expect(allPaired(start)).toBe(true);
    expect(centersSolved(start)).toBe(true);
  });

  it("the other OLL parity flips the same edge, but moves more of the top layer", () => {
    const pure = caseColors4(OLL_PARITY);
    const other = apply4(SOLVED_4, parse4(OLL_PARITY_OTHER).map((m) => m));
    const flipped = (colors: readonly string[]) => colors.flatMap((c, i) => (c === SOLVED_4[i] ? [] : [i]));
    expect(flipped(other)).toEqual(expect.arrayContaining(flipped(pure)));
    expect(flipped(other).length).toBeGreaterThan(4);
  });

  it("PLL parity swaps two opposite edges and nothing else", () => {
    const start = caseColors4(PLL_PARITY);
    expect(allPaired(start)).toBe(true);
    expect(centersSolved(start)).toBe(true);
    const differ = start.flatMap((color, i) => (color === SOLVED_4[i] ? [] : [i]));
    expect(differ).toHaveLength(4);
  });
});

describe("the 4×4 diagrams RUBIKO draws", () => {
  const diagrams = generated4x4Diagrams();

  if (process.env.WRITE_DIAGRAMS === "1") {
    for (const [image, svg] of Object.entries(diagrams)) {
      mkdirSync(dirname(file(image)), { recursive: true });
      writeFileSync(file(image), svg);
    }
  }

  it("one per case and one per move of the notation", () => {
    const cases = Object.values(SETS_4X4).flat();
    expect(Object.keys(diagrams)).toHaveLength(cases.length + NOTATION_MOVES_4X4.length);
    for (const kase of cases) expect(diagrams[kase.image], kase.image).toBeTruthy();
    for (const notation of NOTATION_MOVES_4X4) expect(diagrams[notation.image], notation.image).toBeTruthy();
  });

  it("the files in public/learning are exactly what the cases draw", () => {
    for (const [image, svg] of Object.entries(diagrams)) {
      expect(existsSync(file(image)), image).toBe(true);
      // Git may check the files out with CRLF line endings on Windows.
      expect(readFileSync(file(image), "utf8").replace(/\r\n/g, "\n"), image).toBe(svg);
    }
  });
});
