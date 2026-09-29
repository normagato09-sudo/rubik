import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CubeColor } from "@/features/cube/types";
import { parseAlgorithm } from "@/features/solver2x2/algorithm";
import { CLL_CASES, ORTEGA_OLL, ORTEGA_PBL } from "@/features/solver2x2/algorithms";
import { layerSwap } from "@/features/solver2x2/case-check";
import { CORNER_FACELETS_2, faceOffset2 } from "@/features/solver2x2/facelets";
import { applyMoves2, solvedFacelets2 } from "@/features/solver2x2/sticker-moves";
import { IMAGE_SIZE, getSteps, matchesCase, type AlgorithmSetId } from "./algorithm-sets";
import { SHEET_FRAME, caseFacelets } from "./cases-2x2";
import {
  METHOD_CATEGORIES,
  getCategory,
  isLearningCategoryId,
  isLearningMethodId,
  learnHref,
} from "./categories";
import { NOTATION_MOVES_2X2, notationMovesFor, NOTATION_MOVES } from "./notation";
import { ALGORITHM_SETS, METHOD_STEPS, getCase, getSetInfo } from "./sets";

const SETS_2X2: [AlgorithmSetId, number][] = [
  ["primera-cara", 3],
  ["primera-capa", 3],
  ["ortega-oll", 7],
  ["ortega-pbl", 5],
  ["cll", 42],
];

/** The cube held like the sheets (yellow up, white down), solved. */
const SHEET_SOLVED = applyMoves2(solvedFacelets2(), SHEET_FRAME);

/** A move as the engine reads it: "R2'" is "R2". */
const normalize = (move: string) => move.replace(/2'$/, "2");

describe.each(SETS_2X2)("%s cases", (setId, count) => {
  const cases = ALGORITHM_SETS[setId];

  it(`has exactly ${count} cases, numbered from 01`, () => {
    expect(cases.map((algorithmCase) => algorithmCase.id)).toEqual(
      Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, "0")),
    );
  });

  it("each case has its own existing diagram", () => {
    const images = new Set(cases.map((algorithmCase) => algorithmCase.image));
    expect(images.size).toBe(count);
    for (const image of images) {
      const file = join(process.cwd(), "public", image);
      expect(existsSync(file), image).toBe(true);
      const head = readFileSync(file).subarray(0, 5).toString();
      expect(image.endsWith(".svg") ? head : head.slice(1, 4), image).toBe(
        image.endsWith(".svg") ? "<svg " : "PNG",
      );
    }
    expect(IMAGE_SIZE[setId].width).toBeGreaterThan(0);
  });

  it("every case explains how to recognize it", () => {
    for (const algorithmCase of cases) expect(algorithmCase.explanation?.length).toBeGreaterThan(40);
  });

  it("the numbered steps are the moves the 3D engine checks", () => {
    for (const algorithmCase of cases) {
      expect(getSteps(algorithmCase).map(normalize)).toEqual(parseAlgorithm(algorithmCase.algorithm));
    }
  });

  it("the steps page belongs to its own method, never to the 3×3", () => {
    const info = getSetInfo(setId);
    expect(info.method).not.toBe("cfop");
    expect(METHOD_CATEGORIES[info.method].map((category) => category.id)).toContain(info.categoryId);
  });
});

describe("Aprender 2×2 uses the algorithms of features/solver2x2/algorithms.ts", () => {
  const algorithms = (setId: AlgorithmSetId) => ALGORITHM_SETS[setId].map((kase) => kase.algorithm);

  it("same cases, same order, same text", () => {
    expect(algorithms("ortega-oll")).toEqual(ORTEGA_OLL.map((kase) => kase.algorithm));
    expect(algorithms("ortega-pbl")).toEqual(ORTEGA_PBL.map((kase) => kase.algorithm));
    expect(algorithms("cll")).toEqual(CLL_CASES.map((kase) => kase.algorithm));
    expect(ALGORITHM_SETS["ortega-oll"].map((kase) => kase.name)).toEqual(ORTEGA_OLL.map((kase) => kase.name));
  });

  it("the sheets' diagrams are used row by row; RUBIKO draws only the cases they lack", () => {
    expect(ALGORITHM_SETS["ortega-oll"].map((kase) => kase.image)).toEqual(
      ORTEGA_OLL.map((_, i) => `/learning/ortega-oll/ortega-oll-0${i + 1}.png`),
    );
    const drawn = ALGORITHM_SETS.cll.filter((kase) => kase.image.endsWith(".svg"));
    expect(drawn.map((kase) => kase.id)).toEqual(["41", "42"]);
    expect(CLL_CASES.filter((kase) => kase.picture === null)).toHaveLength(2);
  });

  it("says where the algorithm is not the sheet's own, and only there", () => {
    const sources = [...ORTEGA_OLL, ...ORTEGA_PBL, ...CLL_CASES];
    const learn = [...ALGORITHM_SETS["ortega-oll"], ...ALGORITHM_SETS["ortega-pbl"], ...ALGORITHM_SETS.cll];
    sources.forEach((source, i) => {
      if (source.source === "documento") expect(learn[i].note, source.name).toBeUndefined();
      else expect(learn[i].note, source.name).toMatch(/^(Añadido|En (Ortega|CLL)\.docx \(fila \d+\) pone «)/);
    });
    // The 4 Ortega rows that were wrong quote what the sheet said.
    const corrected = ALGORITHM_SETS["ortega-oll"].concat(ALGORITHM_SETS["ortega-pbl"]).filter((kase) => kase.note);
    expect(corrected.map((kase) => kase.name)).toEqual([
      "Pi",
      "Diagonal arriba",
      "Diagonal arriba y abajo",
      "Adyacente arriba y diagonal abajo",
    ]);
  });
});

describe("Paso 1: the three corner cases (added)", () => {
  /** Where the white sticker of the corner above the front-right slot faces. */
  const whiteFaces = (facelets: CubeColor[]) => {
    const [u, r, f] = CORNER_FACELETS_2[0].map((index) => facelets[index]);
    return u === "white" ? "U" : r === "white" ? "R" : f === "white" ? "F" : null;
  };

  it.each(["primera-cara", "primera-capa"] as const)("%s: white faces right, front, then up", (setId) => {
    const cases = ALGORITHM_SETS[setId];
    expect(cases.map((kase) => whiteFaces(caseFacelets(kase.algorithm)))).toEqual(["R", "F", "U"]);
    for (const kase of cases) expect(kase.note).toMatch(/^Añadido/);
  });

  it("the other bottom corners are already placed, and the algorithm puts the corner in its slot", () => {
    for (const kase of ALGORITHM_SETS["primera-capa"]) {
      const start = caseFacelets(kase.algorithm);
      for (const slot of [5, 6, 7]) {
        const stickers = CORNER_FACELETS_2[slot];
        expect(stickers.map((i) => start[i]), `${kase.name}, slot ${slot}`).toEqual(stickers.map((i) => SHEET_SOLVED[i]));
      }
      const end = applyMoves2(start, parseAlgorithm(kase.algorithm));
      expect(end).toEqual(SHEET_SOLVED);
    }
  });

  it("the step intro is shown for both 2×2 methods", () => {
    expect(METHOD_STEPS.ortega.map((step) => step.setId)).toEqual(["primera-cara"]);
    expect(METHOD_STEPS.cll.map((step) => step.setId)).toEqual(["primera-capa"]);
    for (const step of [...METHOD_STEPS.ortega, ...METHOD_STEPS.cll]) expect(step.intro).toBeTruthy();
    expect(getSetInfo("primera-cara")).toMatchObject({ method: "ortega", categoryId: "steps", title: "Paso 1 · Primera cara" });
    expect(getSetInfo("primera-capa")).toMatchObject({ method: "cll", categoryId: "steps", title: "Paso 1 · Primera capa" });
  });
});

describe("the explanations match the cases", () => {
  const topYellows = (picture: string) => [...picture.slice(0, 4)].filter((c) => c === "y").length;

  it("OLL: how many corners have yellow on top, as the diagram shows", () => {
    for (const [i, kase] of ORTEGA_OLL.entries()) {
      const explanation = ALGORITHM_SETS["ortega-oll"][i].explanation!;
      const expected = { 0: /^Ninguna/, 1: /^Solo una/, 2: /^Dos/ }[topYellows(kase.picture) as 0 | 1 | 2];
      expect(explanation, kase.name).toMatch(expected);
    }
  });

  /** Sides of a layer whose two stickers match (the "faros"). */
  const headlights = (facelets: CubeColor[], row: 0 | 2) =>
    (["F", "R", "B", "L"] as const).filter((side) => {
      const o = faceOffset2(side) + row;
      return facelets[o] === facelets[o + 1];
    });

  it("PBL: the swaps and the side the headlights go on", () => {
    const at = (id: string) => {
      const kase = ORTEGA_PBL.find((pbl) => pbl.id === id)!;
      return { kase, facelets: caseFacelets(kase.algorithm) };
    };
    for (const kase of ORTEGA_PBL) {
      const facelets = caseFacelets(kase.algorithm);
      expect(layerSwap(facelets, "top"), kase.name).toBe(kase.top);
      expect(layerSwap(facelets, "bottom"), kase.name).toBe(kase.bottom);
    }
    // "ponlo a la izquierda"
    expect(headlights(at("adj").facelets, 0)).toEqual(["L"]);
    // "Pon los faros de las dos capas detrás"
    expect(headlights(at("adj-adj").facelets, 0)).toEqual(["B"]);
    expect(headlights(at("adj-adj").facelets, 2)).toEqual(["B"]);
    // "Pon los faros de arriba delante", as the sheet's diagram (fila 5) shows them
    expect(headlights(at("adj-diag").facelets, 0)).toEqual(["F"]);
  });

  it("CLL: the two added cases only swap corners, with the headlights on the left", () => {
    const [adj, diag] = ALGORITHM_SETS.cll.slice(40).map((kase) => caseFacelets(kase.algorithm));
    for (const facelets of [adj, diag]) {
      expect([0, 1, 2, 3].map((n) => facelets[faceOffset2("U") + n])).toEqual(["yellow", "yellow", "yellow", "yellow"]);
      expect(layerSwap(facelets, "bottom")).toBe("solved");
    }
    expect(layerSwap(adj, "top")).toBe("adj");
    expect(headlights(adj, 0)).toEqual(["L"]);
    expect(layerSwap(diag, "top")).toBe("diag");
  });
});

describe("notation 2×2", () => {
  it("has the sheet's 5 diagrams in document order, then B, y and x (added)", () => {
    expect(NOTATION_MOVES_2X2.map((notation) => notation.move)).toEqual(["U", "D", "R", "L", "F", "B", "y", "x"]);
    expect(NOTATION_MOVES_2X2.filter((notation) => notation.note).map((notation) => notation.move)).toEqual(["B", "y", "x"]);
    expect(existsSync(join(process.cwd(), "docs/source/Notacion 2x2.docx"))).toBe(true);
  });

  it("each move has an existing diagram, and progress ids apart from the 3×3", () => {
    for (const notation of NOTATION_MOVES_2X2) {
      expect(existsSync(join(process.cwd(), "public", notation.image)), notation.image).toBe(true);
      expect(notation.id.startsWith("2x2-")).toBe(true);
    }
    expect(notationMovesFor("2x2")).toBe(NOTATION_MOVES_2X2);
    expect(notationMovesFor("3x3")).toBe(NOTATION_MOVES);
  });

  it("covers every move in every 2×2 algorithm", () => {
    const letters = new Set(NOTATION_MOVES_2X2.map((notation) => notation.move));
    for (const setId of SETS_2X2.map(([id]) => id)) {
      for (const kase of ALGORITHM_SETS[setId]) {
        for (const move of parseAlgorithm(kase.algorithm)) expect(letters, `${kase.algorithm}: ${move}`).toContain(move[0]);
      }
    }
  });
});

describe("Aprender by method", () => {
  it("the 3×3 keeps its blocks and its address", () => {
    expect(METHOD_CATEGORIES.cfop.map((category) => category.id)).toEqual(["notation", "steps", "f2l", "oll", "pll"]);
    expect(learnHref("cfop", "notation")).toBe("/entrenar?abierto=notation");
    expect(learnHref("cfop")).toBe("/entrenar");
  });

  it("Ortega and CLL have their own blocks", () => {
    expect(METHOD_CATEGORIES.ortega.map((category) => category.id)).toEqual(["notation", "steps", "ortega-oll", "ortega-pbl"]);
    expect(METHOD_CATEGORIES.cll.map((category) => category.id)).toEqual(["notation", "steps", "cll"]);
    expect(getCategory("notation", "ortega").title).toBe("Notación del 2×2");
    expect(learnHref("ortega", "ortega-pbl")).toBe("/entrenar?metodo=ortega&abierto=ortega-pbl");
  });

  it("only accepts a block of the method being shown", () => {
    expect(isLearningMethodId("cll")).toBe(true);
    expect(isLearningMethodId("roux")).toBe(false);
    expect(isLearningCategoryId("pll", "ortega")).toBe(false);
    expect(isLearningCategoryId("ortega-pbl", "ortega")).toBe(true);
  });

  it("search finds 2×2 cases by number, name or algorithm", () => {
    expect(matchesCase(getCase("ortega-oll", "01")!, "sune")).toBe(true);
    expect(matchesCase(getCase("cll", "07")!, "cll 7")).toBe(true);
    expect(matchesCase(getCase("ortega-pbl", "03")!, "r2f2r2")).toBe(true);
  });
});
