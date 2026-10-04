import { describe, expect, it } from "vitest";
import { parseAlgorithm } from "@/features/solver2x2/algorithm";
import { layerSwap } from "@/features/solver2x2/case-check";
import { isSolved2 } from "@/features/solver2x2/facelets";
import { applyMoves2 } from "@/features/solver2x2/sticker-moves";
import { CLL_LEARN_CASES } from "./cases-2x2";
import {
  EG1_CASES,
  LEG1_ALGORITHMS,
  LEG1_CASES,
  TCLL_CLL_CASES,
  TCLL_MINUS_ALGORITHMS,
  TCLL_MINUS_CASES,
  TCLL_PLUS_ALGORITHMS,
  TCLL_PLUS_CASES,
  caseFacelets2,
  legDone,
  tcllDone,
} from "./cases-2x2-research";
import { caseKey2, firstFaceStates, topShape2, twistedLayerStates } from "./corners-2x2";

const SHAPE: Record<string, string> = { Sune: "S", Antisune: "AS" };

describe("LEG-1", () => {
  const facelets = LEG1_CASES.map((kase) => caseFacelets2(kase.algorithm, legDone));

  it("has speedcube.quest's 40 cases and the 3 with the top oriented", () => {
    expect(LEG1_ALGORITHMS).toHaveLength(40);
    expect(LEG1_CASES).toHaveLength(43);
  });

  it("every algorithm starts with the first face down and the bottom bar on the left, and solves the cube", () => {
    LEG1_CASES.forEach((kase, i) => {
      expect(legDone(facelets[i]), kase.name).toBe(true);
      expect(isSolved2(applyMoves2(facelets[i], parseAlgorithm(kase.algorithm))), kase.name).toBe(true);
    });
  });

  it("the 43 are all different, and are the same cases as EG-1 (every one the engine counts)", () => {
    const keys = facelets.map(caseKey2);
    expect(new Set(keys).size).toBe(43);
    const all = new Set(firstFaceStates().filter((s) => layerSwap(s, "bottom") === "adj").map(caseKey2));
    expect(new Set(keys)).toEqual(all);
    expect(new Set(keys)).toEqual(new Set(EG1_CASES.map((kase) => caseKey2(caseFacelets2(kase.algorithm)))));
  });

  it("each case has the top shape its name says", () => {
    LEG1_CASES.forEach((kase, i) => {
      const group = kase.name!.split(" ")[0];
      expect(topShape2(facelets[i]), kase.name).toBe(kase.number > 40 ? "O" : (SHAPE[group] ?? group));
    });
  });

  it("the explanations put the bar on the left", () => {
    for (const kase of LEG1_CASES) expect(kase.explanation, kase.name).toContain("(la barra) está a la izquierda");
  });
});

describe.each([
  { set: "TCLL+", cases: TCLL_PLUS_CASES, algorithms: TCLL_PLUS_ALGORITHMS, twist: 1 as const, faces: "hacia ti" },
  { set: "TCLL−", cases: TCLL_MINUS_CASES, algorithms: TCLL_MINUS_ALGORITHMS, twist: 2 as const, faces: "a la derecha" },
])("$set", ({ cases, algorithms, twist, faces }) => {
  const facelets = cases.map((kase) => caseFacelets2(kase.algorithm, tcllDone(twist)));

  it("has 43 cases", () => {
    expect(algorithms).toHaveLength(43);
    expect(cases).toHaveLength(43);
  });

  it("every algorithm starts from the first layer with its front-right corner twisted, and solves the cube", () => {
    cases.forEach((kase, i) => {
      expect(tcllDone(twist)(facelets[i]), kase.name).toBe(true);
      expect(isSolved2(applyMoves2(facelets[i], parseAlgorithm(kase.algorithm))), kase.name).toBe(true);
      expect(kase.explanation, kase.name).toContain(`con el blanco mirando ${faces}`);
    });
  });

  it("the 43 are all different, and are every case the engine counts", () => {
    const keys = facelets.map(caseKey2);
    expect(new Set(keys).size).toBe(43);
    expect(new Set(keys)).toEqual(new Set(twistedLayerStates(twist).map(caseKey2)));
  });

  it("says where each algorithm comes from", () => {
    const source = twist === 1 ? "Chris Olson · TCLL+" : "SpeedCubeTrainer · TCLL−";
    for (const kase of cases) expect(kase.research?.name, kase.name).toBe(source);
  });
});

describe("TCLL: CLL for when no corner is twisted", () => {
  it("is the CLL method's", () => {
    expect(TCLL_CLL_CASES.map((kase) => kase.algorithm)).toEqual(CLL_LEARN_CASES.map((kase) => kase.algorithm));
  });
});
