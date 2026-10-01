import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyPyraTokens, isSolvedPyraminx, parsePyraNotation } from "@/features/pyraminx/moves";
import { L3E_CASES } from "@/features/pyraminx/research";
import { getSelectableMethodsForCubeType } from "@/features/trainer/methods";
import { METHOD_CATEGORIES, isLearningMethodId } from "./categories";
import { L4E_V_CASES, PYRA_PUNTAS_CASES, pyraCaseState } from "./cases-pyraminx";
import { SETS_PYRAMINX_RESEARCH, generatedResearchDiagrams, type ResearchSetId } from "./cases-pyraminx-research";
import { ALGORITHM_SETS, METHOD_STEPS, getSetInfo } from "./sets";

const file = (image: string) => join(process.cwd(), "public", image);
const all = Object.values(SETS_PYRAMINX_RESEARCH).flat();
const algorithms = (setId: ResearchSetId) => SETS_PYRAMINX_RESEARCH[setId].map((kase) => kase.algorithm);

describe("Pyraminx methods taught from research", () => {
  it("Keyhole and L4E intuitivo are in the Método selector, between Por capas and L4E", () => {
    expect(getSelectableMethodsForCubeType("pyraminx").map((method) => method.id)).toEqual([
      "por-capas",
      "keyhole",
      "l4e-intuitivo",
      "l4e",
    ]);
    for (const method of ["keyhole", "l4e-intuitivo"]) expect(isLearningMethodId(method)).toBe(true);
  });

  it("each has notation, steps and its L3E block, and its steps are explained", () => {
    expect(METHOD_CATEGORIES.keyhole.map((category) => category.id)).toEqual(["notation", "steps", "keyhole-l3e"]);
    expect(METHOD_CATEGORIES["l4e-intuitivo"].map((category) => category.id)).toEqual(["notation", "steps", "l4ei-l3e"]);
    expect(METHOD_STEPS.keyhole.map((step) => step.title)).toEqual(["Puntas", "Bloque de detrás", "Centros", "Arista del hueco"]);
    expect(METHOD_STEPS["l4e-intuitivo"].map((step) => step.title)).toEqual(["Puntas", "V", "Arista de arriba"]);
    for (const step of [...METHOD_STEPS.keyhole, ...METHOD_STEPS["l4e-intuitivo"]]) {
      expect(step.intro?.length, step.setId).toBeGreaterThan(100);
      expect(getSetInfo(step.setId).categoryId).toBe("steps");
    }
    expect(getSetInfo("keyhole-l3e")).toMatchObject({ method: "keyhole", title: "L3E (Keyhole)" });
  });

  it("every case is registered, marked as researched with its source, explained and drawn", () => {
    for (const kase of all) {
      expect(ALGORITHM_SETS[kase.setId]).toContain(kase);
      expect(kase.research?.url, `${kase.setId} ${kase.id}`).toMatch(/^https:\/\//);
      expect(kase.explanation?.length, `${kase.setId} ${kase.id}`).toBeGreaterThan(60);
      expect(existsSync(file(kase.image)), kase.image).toBe(true);
    }
  });

  it("every algorithm solves its own case", () => {
    for (const kase of all) {
      const after = applyPyraTokens(pyraCaseState(kase.algorithm), parsePyraNotation(kase.algorithm));
      expect(isSolvedPyraminx(after), `${kase.setId} ${kase.id}`).toBe(true);
    }
  });

  it("reuses what already exists instead of copying it: Puntas, the V, the back edge and L3E", () => {
    expect(algorithms("keyhole-puntas")).toEqual(PYRA_PUNTAS_CASES.map((kase) => kase.algorithm));
    expect(algorithms("l4ei-puntas")).toEqual(PYRA_PUNTAS_CASES.map((kase) => kase.algorithm));
    expect(algorithms("keyhole-bloque")).toEqual(L4E_V_CASES.map((kase) => kase.algorithm));
    expect(algorithms("l4ei-v")).toEqual(L4E_V_CASES.map((kase) => kase.algorithm));
    expect(algorithms("l4ei-arista")).toEqual(algorithms("keyhole-arista"));
    expect(algorithms("l4ei-l3e")).toEqual(algorithms("keyhole-l3e"));
    expect(algorithms("keyhole-l3e")).toEqual(L3E_CASES.map((kase) => kase.algorithm));
  });

  it("the L3E explanations say what each case is", () => {
    const [sledge, hedge, u, uMirror, flip] = SETS_PYRAMINX_RESEARCH["keyhole-l3e"].map((kase) => kase.explanation!);
    // The U cases only move the edges round; the Sledgehammer and the Hedgeslammer also leave two the wrong way.
    for (const text of [u, uMirror]) expect(text).toContain("las tres tienen ya el verde hacia ti");
    for (const text of [sledge, hedge]) expect(text).toContain("2 tienen el verde fuera");
    // Each pair cycles the edges in opposite directions.
    expect(sledge.includes("antihorario")).not.toBe(hedge.includes("antihorario"));
    expect(u.includes("antihorario")).not.toBe(uMirror.includes("antihorario"));
    expect(flip).toContain("están en su sitio, pero");
  });

  it("the centers explanations follow each algorithm's own moves", () => {
    for (const kase of SETS_PYRAMINX_RESEARCH["keyhole-centros"]) {
      const [first, , last] = kase.algorithm.split(" ");
      if (last) expect(kase.explanation).toContain(`${first} lo sube a la posición de arriba`);
      if (last) expect(kase.explanation).toContain(`${last} lo devuelve`);
    }
  });

  it("the back-edge cases say where the red-blue edge is, and note how the guide writes them", () => {
    for (const kase of SETS_PYRAMINX_RESEARCH["keyhole-arista"]) {
      expect(kase.explanation).toContain("La arista roja-azul");
      expect(kase.note).toMatch(/^En la guía está escrito «/);
    }
    expect(new Set(SETS_PYRAMINX_RESEARCH["keyhole-arista"].map((kase) => kase.name)).size).toBe(7);
  });

  it("the centers cases say they were worked out by RUBIKO following the guide", () => {
    for (const kase of SETS_PYRAMINX_RESEARCH["keyhole-centros"]) expect(kase.note).toMatch(/^Calculado con el motor/);
  });
});

describe("the diagrams RUBIKO draws for them", () => {
  const diagrams = generatedResearchDiagrams();

  if (process.env.WRITE_DIAGRAMS === "1") {
    for (const [image, svg] of Object.entries(diagrams)) {
      mkdirSync(dirname(file(image)), { recursive: true });
      writeFileSync(file(image), svg);
    }
  }

  it("one per case", () => {
    expect(Object.keys(diagrams).sort()).toEqual(all.map((kase) => kase.image).sort());
  });

  it("the files in public/learning are exactly what the cases draw", () => {
    for (const [image, svg] of Object.entries(diagrams)) {
      expect(existsSync(file(image)), image).toBe(true);
      // Git may check the files out with CRLF line endings on Windows.
      expect(readFileSync(file(image), "utf8").replace(/\r\n/g, "\n"), image).toBe(svg);
    }
  });
});
