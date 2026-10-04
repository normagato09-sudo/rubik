import { describe, expect, it } from "vitest";
import { parseAlgorithm } from "@/features/solver2x2/algorithm";
import { layerSwap } from "@/features/solver2x2/case-check";
import { isSolved2 } from "@/features/solver2x2/facelets";
import { applyMoves2 } from "@/features/solver2x2/sticker-moves";
import { CLL_LEARN_CASES, PRIMERA_CARA_CASES } from "./cases-2x2";
import {
  EG1_ALGORITHMS,
  EG1_CASES,
  EG2_ALGORITHMS,
  EG2_CASES,
  EG_CARA_CASES,
  EG_CLL_CASES,
  caseFacelets2,
  firstFaceDown,
} from "./cases-2x2-research";
import { caseKey2, firstFaceStates, topShape2 } from "./corners-2x2";
import { METHOD_CATEGORIES } from "./categories";
import { METHOD_STEPS, getSetInfo } from "./sets";

/** Every case the engine counts with the first face done, by what the bottom layer has. */
const CLASSES = (() => {
  const classes = { solved: new Set<string>(), adj: new Set<string>(), diag: new Set<string>() };
  for (const state of firstFaceStates()) classes[layerSwap(state, "bottom")].add(caseKey2(state));
  return classes;
})();

const SHAPE: Record<string, string> = { Sune: "S", Antisune: "AS" };

describe("EG: how many cases there are", () => {
  it("the engine counts 43 for each bottom (128 in all, with the solved cube out), as the Speedsolving Wiki says", () => {
    expect(CLASSES.solved.size).toBe(43);
    expect(CLASSES.adj.size).toBe(43);
    expect(CLASSES.diag.size).toBe(43);
  });
});

describe.each([
  { set: "EG-1", cases: EG1_CASES, algorithms: EG1_ALGORITHMS, bottom: "adj" as const },
  { set: "EG-2", cases: EG2_CASES, algorithms: EG2_ALGORITHMS, bottom: "diag" as const },
])("$set", ({ cases, algorithms, bottom }) => {
  it("has SpeedCubeDB's 40 cases and the 3 with the top oriented", () => {
    expect(algorithms).toHaveLength(40);
    expect(cases).toHaveLength(43);
    expect(cases.map((kase) => kase.id)).toEqual(Array.from({ length: 43 }, (_, i) => String(i + 1).padStart(2, "0")));
  });

  it("every algorithm solves a case with the first face done and this bottom", () => {
    for (const kase of cases) {
      const facelets = caseFacelets2(kase.algorithm);
      expect(firstFaceDown(facelets), kase.name).toBe(true);
      expect(layerSwap(facelets, "bottom"), kase.name).toBe(bottom);
      expect(isSolved2(applyMoves2(facelets, parseAlgorithm(kase.algorithm))), kase.name).toBe(true);
    }
  });

  it("the 43 are all different, and are every case the engine counts", () => {
    const keys = cases.map((kase) => caseKey2(caseFacelets2(kase.algorithm)));
    expect(new Set(keys).size).toBe(43);
    expect(new Set(keys)).toEqual(CLASSES[bottom]);
  });

  it("each case has the top shape its name says (the last 3, the yellow already on top)", () => {
    for (const kase of cases) {
      const group = kase.name!.split(" ")[0];
      const expected = kase.number > 40 ? "O" : (SHAPE[group] ?? group);
      expect(topShape2(caseFacelets2(kase.algorithm)), kase.name).toBe(expected);
    }
  });

  it("the explanations describe the bottom", () => {
    for (const kase of cases) {
      expect(kase.explanation, kase.name).toContain(bottom === "adj" ? "dos esquinas vecinas cambiadas" : "dos esquinas en diagonal cambiadas");
    }
    const pbl = cases.slice(40);
    expect(pbl.map((kase) => layerSwap(caseFacelets2(kase.algorithm), "top"))).toEqual(["solved", "adj", "diag"]);
    for (const kase of pbl) expect(kase.note).toMatch(/^Es la PBL «.+» de Ortega/);
  });
});

describe("EG: CLL and the first face", () => {
  it("CLL is the one of the CLL method, and covers every case with the bottom solved", () => {
    expect(EG_CLL_CASES.map((kase) => kase.algorithm)).toEqual(CLL_LEARN_CASES.map((kase) => kase.algorithm));
    expect(EG_CLL_CASES.map((kase) => kase.image)).toEqual(CLL_LEARN_CASES.map((kase) => kase.image));
    const keys = new Set(EG_CLL_CASES.map((kase) => caseKey2(caseFacelets2(kase.algorithm))));
    expect(keys.size).toBe(42);
    const unsolved = new Set(CLASSES.solved);
    unsolved.delete(caseKey2(caseFacelets2("")));
    expect(keys).toEqual(unsolved);
  });

  it("the first face is Ortega's step", () => {
    expect(EG_CARA_CASES.map((kase) => kase.algorithm)).toEqual(PRIMERA_CARA_CASES.map((kase) => kase.algorithm));
    expect(METHOD_STEPS.eg.map((step) => step.setId)).toEqual(["eg-cara"]);
    expect(getSetInfo("eg-1")).toMatchObject({ method: "eg", categoryId: "eg-1", title: "EG-1" });
    expect(METHOD_CATEGORIES.eg.map((category) => category.id)).toEqual(["notation", "steps", "eg-cll", "eg-1", "eg-2"]);
  });
});
