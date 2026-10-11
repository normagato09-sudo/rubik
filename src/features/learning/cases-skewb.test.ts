import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { applySarahTokens, parseSarahAlgorithm } from "@/features/skewb/moves";
import { L2L_POSITIONS, caseKey, keepsFirstSide } from "@/features/skewb/l2l";
import {
  L2L_BY_ALGORITHM,
  L2L_BY_CASE,
  LAST_CENTERS,
  OPPOSITE_SIDE_CASES,
  caseOf,
  expandSarah,
  isSolvedAnyWay,
  sarahTokens,
} from "@/features/skewb/sarah";
import { SETS_SKEWB, generatedSkewbDiagrams, skewbCaseChecks, type SkewbSetId } from "./cases-skewb";
import { METHOD_CATEGORIES } from "./categories";
import { NOTATION_MOVES_SKEWB } from "./notation";
import { METHOD_STEPS } from "./sets";

const file = (image: string) => join(process.cwd(), "public", image);
const SET_IDS = Object.keys(SETS_SKEWB) as SkewbSetId[];
const FIRST_SIDE_SETS: SkewbSetId[] = ["skc-primera-cara", "ski-primera-cara", "ska-primera-cara"];

describe("Skewb cases in Aprender", () => {
  it.each(SET_IDS)("%s: every algorithm does what its case needs", (setId) => {
    for (const { state, algorithm, goal } of skewbCaseChecks(setId)) {
      expect(goal(applySarahTokens(state, parseSarahAlgorithm(algorithm))), algorithm).toBe(true);
    }
  });

  it.each(SET_IDS.filter((setId) => !FIRST_SIDE_SETS.includes(setId)))("%s: every case has the first side done", (setId) => {
    for (const { state } of skewbCaseChecks(setId)) expect(keepsFirstSide(state)).toBe(true);
  });

  it("every case has a name, an explanation and its source", () => {
    for (const cases of Object.values(SETS_SKEWB)) {
      for (const kase of cases) {
        expect(kase.name).toBeTruthy();
        expect(kase.explanation?.length, kase.name).toBeGreaterThan(80);
        expect(kase.research?.url).toMatch(/^https:\/\/sarah\.cubing\.net\//);
      }
    }
  });

  it("the cases of one set are all different", () => {
    for (const setId of SET_IDS) {
      const states = skewbCaseChecks(setId).map(({ state }) => (setId.startsWith("ska-") && !FIRST_SIDE_SETS.includes(setId) ? caseKey(state) : state.join()));
      expect(new Set(states).size, setId).toBe(states.length);
    }
  });

  it("each method has its steps and its blocks", () => {
    expect(METHOD_STEPS["skewb-capas"].map((step) => step.title)).toEqual(["Cara blanca", "Esquinas de arriba", "Centro amarillo"]);
    expect(METHOD_STEPS["sarah-intermedio"].map((step) => step.title)).toEqual(["Cara blanca"]);
    expect(METHOD_STEPS["sarah-avanzado"].map((step) => step.title)).toEqual(["Cara blanca"]);
    for (const method of ["skewb-capas", "sarah-intermedio", "sarah-avanzado"] as const) {
      for (const step of METHOD_STEPS[method]) expect(step.intro?.length).toBeGreaterThan(100);
      for (const block of METHOD_CATEGORIES[method].slice(2)) expect(block.intro?.length, block.id).toBeGreaterThan(100);
    }
  });
});

describe("Sarah's Advanced: the last two layers (L2L)", () => {
  const cases = new Set(L2L_POSITIONS.filter((position) => !isSolvedAnyWay(position)).map(caseKey));

  it("540 positions with the first side done, 136 cases once a whole y turn is the same case", () => {
    expect(L2L_POSITIONS).toHaveLength(540);
    expect(L2L_POSITIONS.every(keepsFirstSide)).toBe(true);
    expect(cases.size).toBe(136);
    expect(SETS_SKEWB["ska-peanut"].length + SETS_SKEWB["ska-pi"].length + SETS_SKEWB["ska-l5c"].length).toBe(136);
  });

  it("the by-case guide's 134 places: 115 algorithms, which solve 111 different cases, and 19 without one", () => {
    const listed = L2L_BY_CASE.flatMap(({ algorithms }) => algorithms);
    expect(listed).toHaveLength(134);
    const algorithms = listed.filter((text): text is string => text !== null);
    expect(algorithms).toHaveLength(115);
    const solved = algorithms.map((text) => caseOf(sarahTokens(text)));
    expect(solved.every((state) => state !== null && keepsFirstSide(state))).toBe(true);
    expect(new Set(solved.map((state) => caseKey(state!))).size).toBe(111);
  });

  it("with the printable guide, Sarah's algorithms cover 112 cases; the engine gives the other 24", () => {
    const all = [...L2L_BY_CASE.flatMap(({ algorithms }) => algorithms), ...L2L_BY_ALGORITHM.flatMap(({ algorithms }) => algorithms)];
    const covered = new Set(all.filter((text): text is string => text !== null).map((text) => caseKey(caseOf(sarahTokens(text))!)));
    expect(covered.size).toBe(112);
    const fromEngine = [...SETS_SKEWB["ska-peanut"], ...SETS_SKEWB["ska-pi"], ...SETS_SKEWB["ska-l5c"]].filter((kase) =>
      kase.note?.includes("no trae algoritmo"),
    );
    expect(fromEngine).toHaveLength(24);
  });

  it("writes Sarah's shorthand out in full", () => {
    expect(expandSarah("Sy2H (o)")).toBe("y F' L F L' y2 L F' L' F");
    expect(expandSarah("(y2) (F' L F L')2")).toBe("y2 F' L F L' F' L F L'");
    expect(expandSarah("SSy2z Sy2S (o)")).toBe("y F' L F L' F' L F L' y2 z F' L F L' y2 F' L F L'");
  });

  it("notes where the by-case guide puts a Pi case under R that is L, or the other way round", () => {
    const notes = SETS_SKEWB["ska-pi"].map((kase) => kase.note ?? "");
    expect(notes.filter((note) => note.includes("«Pi - center on L», pero según el motor es de «Pi - center on R»"))).toHaveLength(2);
    expect(notes.filter((note) => note.includes("«Pi - center on R», pero según el motor es de «Pi - center on L»"))).toHaveLength(2);
  });
});

describe("the guide's mistakes, checked with the engine", () => {
  it("the last centers: Sarah's z and x' only work as RUBIKO's x and z", () => {
    for (const { algorithm } of LAST_CENTERS) {
      for (const turn of ["z", "z'"]) {
        const written = `(${turn}) ${algorithm}`;
        expect(caseOf(sarahTokens(written, "front-right")), written).not.toBeNull();
      }
    }
    // As RUBIKO reads them, the two- and four-center cases never keep the first side.
    expect(caseOf(sarahTokens(`(z) ${LAST_CENTERS[1].algorithm}`))).toBeNull();
  });

  it("the intermediate's (y2) R' F R F' and (y2) L F' L' F do not lead to category 1", () => {
    const cards = SETS_SKEWB["ski-cara-arriba"];
    expect(OPPOSITE_SIDE_CASES[3].algorithms).toContain("(y2) R' F R F'");
    expect(OPPOSITE_SIDE_CASES[5].algorithms).toContain("(y2) L F' L' F");
    expect(cards[3].explanation).toContain("y2 F R' F' R");
    expect(cards[5].explanation).toContain("y2 F' L F L'");
    expect(cards[3].note).toContain("no lleva a un caso de la categoría 1");
    expect(cards[5].note).toContain("no lleva a un caso de la categoría 1");
  });
});

describe("the Skewb diagrams RUBIKO draws", () => {
  const diagrams = generatedSkewbDiagrams();

  if (process.env.WRITE_DIAGRAMS === "1") {
    for (const [image, svg] of Object.entries(diagrams)) {
      mkdirSync(dirname(file(image)), { recursive: true });
      writeFileSync(file(image), svg);
    }
  }

  it("one per case and one per move of the notation", () => {
    const cases = Object.values(SETS_SKEWB).flat();
    expect(Object.keys(diagrams)).toHaveLength(cases.length + NOTATION_MOVES_SKEWB.length);
    for (const kase of cases) expect(diagrams[kase.image], kase.image).toBeTruthy();
    for (const notation of NOTATION_MOVES_SKEWB) expect(diagrams[notation.image], notation.image).toBeTruthy();
  });

  it("the files in public/learning are exactly what the cases draw", () => {
    for (const [image, svg] of Object.entries(diagrams)) {
      expect(existsSync(file(image)), image).toBe(true);
      // Git may check the files out with CRLF line endings on Windows.
      expect(readFileSync(file(image), "utf8").replace(/\r\n/g, "\n"), image).toBe(svg);
    }
  });
});
