import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyPyraTokens, isSolvedPyraminx, parsePyraNotation } from "@/features/pyraminx/moves";
import {
  KEYHOLE_CENTER_CASES,
  L3E_CASES,
  NUTELLA_EDGE_CASES,
  NUTELLA_L3C_CASES,
  OKA_EDGE_CASES,
  OKA_FINISH_CASES,
  ONE_FLIP_L3C_CASES,
  THIRD_EDGE_CASES,
  WO_L3C_CASES,
} from "@/features/pyraminx/research";
import { getSelectableMethodsForCubeType } from "@/features/trainer/methods";
import { METHOD_CATEGORIES, isLearningMethodId } from "./categories";
import { L4E_V_CASES, PYRA_PUNTAS_CASES } from "./cases-pyraminx";
import {
  SETS_PYRAMINX_RESEARCH,
  generatedResearchDiagrams,
  researchCaseStates,
  type ResearchSetId,
} from "./cases-pyraminx-research";
import { ALGORITHM_SETS, METHOD_STEPS, getSetInfo } from "./sets";

const file = (image: string) => join(process.cwd(), "public", image);
const all = Object.values(SETS_PYRAMINX_RESEARCH).flat();
const algorithms = (setId: ResearchSetId) => SETS_PYRAMINX_RESEARCH[setId].map((kase) => kase.algorithm);

describe("Pyraminx methods taught from research", () => {
  it("Keyhole, L4E intuitivo, Oka, 1-Flip, WO and Nutella are in the Método selector, between Por capas and L4E", () => {
    expect(getSelectableMethodsForCubeType("pyraminx").map((method) => method.id)).toEqual([
      "por-capas",
      "keyhole",
      "l4e-intuitivo",
      "oka",
      "1-flip",
      "wo",
      "nutella",
      "l4e",
    ]);
    for (const method of ["keyhole", "l4e-intuitivo", "oka", "1-flip", "wo", "nutella"]) expect(isLearningMethodId(method)).toBe(true);
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

  it("1-Flip and WO have notation, steps, L3C and L3E, and their steps are explained", () => {
    expect(METHOD_CATEGORIES["1-flip"].map((category) => category.id)).toEqual(["notation", "steps", "1flip-l3c", "1flip-l3e"]);
    expect(METHOD_CATEGORIES.wo.map((category) => category.id)).toEqual(["notation", "steps", "wo-l3c", "wo-l3e"]);
    expect(METHOD_STEPS["1-flip"].map((step) => step.title)).toEqual(["Puntas", "Bloque de detrás", "Arista volteada"]);
    expect(METHOD_STEPS.wo.map((step) => step.title)).toEqual(["Puntas", "Bloque de detrás", "Tercera arista"]);
    for (const step of [...METHOD_STEPS["1-flip"], ...METHOD_STEPS.wo]) {
      expect(step.intro?.length, step.setId).toBeGreaterThan(100);
      expect(getSetInfo(step.setId).categoryId).toBe("steps");
    }
    expect(getSetInfo("wo-l3c")).toMatchObject({ method: "wo", title: "L3C (WO)" });
    expect(getSetInfo("1flip-l3c")).toMatchObject({ method: "1-flip", title: "L3C (1-Flip)" });
  });

  it("Oka and Nutella have notation, steps, their algorithm block and L3E, and their steps are explained", () => {
    expect(METHOD_CATEGORIES.oka.map((category) => category.id)).toEqual(["notation", "steps", "oka-cierre", "oka-l3e"]);
    expect(METHOD_CATEGORIES.nutella.map((category) => category.id)).toEqual(["notation", "steps", "nutella-l3c", "nutella-l3e"]);
    expect(METHOD_STEPS.oka.map((step) => step.title)).toEqual(["Puntas", "Arista Oka", "Centros"]);
    expect(METHOD_STEPS.nutella.map((step) => step.title)).toEqual(["Puntas", "Aristas cambiadas"]);
    for (const step of [...METHOD_STEPS.oka, ...METHOD_STEPS.nutella]) {
      expect(step.intro?.length, step.setId).toBeGreaterThan(100);
      expect(getSetInfo(step.setId).categoryId).toBe("steps");
    }
    expect(getSetInfo("oka-cierre")).toMatchObject({ method: "oka", title: "Cierre del bloque (Oka)" });
    expect(getSetInfo("nutella-l3c")).toMatchObject({ method: "nutella", title: "L3C (Nutella)" });
  });

  it("Oka and Nutella reuse Puntas, Keyhole's centers and L3E, and teach research.ts's cases", () => {
    for (const method of ["oka", "nutella"]) {
      expect(algorithms(`${method}-puntas` as ResearchSetId)).toEqual(algorithms("keyhole-puntas"));
      expect(algorithms(`${method}-l3e` as ResearchSetId)).toEqual(algorithms("keyhole-l3e"));
    }
    expect(algorithms("oka-centros")).toEqual(KEYHOLE_CENTER_CASES.map((kase) => kase.algorithm));
    expect(algorithms("oka-arista")).toEqual(OKA_EDGE_CASES.map((kase) => kase.algorithm));
    expect(algorithms("oka-cierre")).toEqual(OKA_FINISH_CASES.map((kase) => kase.algorithm));
    expect(algorithms("nutella-aristas")).toEqual(NUTELLA_EDGE_CASES.map((kase) => kase.algorithm));
    expect(algorithms("nutella-l3c")).toEqual(NUTELLA_L3C_CASES.map((kase) => kase.algorithm));
  });

  it("each Oka and Nutella case has its own name and says where its edges are", () => {
    for (const [setId, count] of [["oka-arista", 9], ["oka-cierre", 16], ["nutella-aristas", 7]] as const) {
      const cases = SETS_PYRAMINX_RESEARCH[setId];
      expect(cases).toHaveLength(count);
      expect(new Set(cases.map((kase) => kase.name)).size, setId).toBe(count);
    }
    for (const kase of SETS_PYRAMINX_RESEARCH["oka-arista"]) expect(kase.explanation).toMatch(/^La arista roja-azul \(la arista Oka\)/);
    for (const kase of SETS_PYRAMINX_RESEARCH["nutella-aristas"]) expect(kase.explanation).toMatch(/^La arista roja-amarilla/);
    const sides = SETS_PYRAMINX_RESEARCH["oka-cierre"].map((kase) => kase.name!.split(" · ")[0]);
    expect(sides.filter((side) => side === "Oka a la izquierda")).toHaveLength(8);
    expect(sides.filter((side) => side === "Oka a la derecha")).toHaveLength(8);
    for (const kase of SETS_PYRAMINX_RESEARCH["oka-centros"]) expect(kase.explanation).toContain("La arista Oka (abajo a la izquierda)");
  });

  it("Drew Brads' cases cite his text held with the block up; the ones he does not teach say the engine worked them out", () => {
    const oka = SETS_PYRAMINX_RESEARCH["oka-cierre"];
    const drew = /^En la hoja de Drew Brads está escrito «[^»]+», sujetando el Pyraminx con el bloque arriba/;
    expect(oka.filter((kase) => drew.test(kase.note!))).toHaveLength(7);
    expect(oka.filter((kase) => kase.note!.startsWith("La hoja de Drew Brads no trae este caso"))).toHaveLength(9);
    for (const kase of SETS_PYRAMINX_RESEARCH["nutella-l3c"]) {
      expect(kase.note).toMatch(drew);
      expect(kase.explanation).toContain("están cambiadas de sitio");
    }
    // The cases seen from another side of the back tip say so.
    const turned = [...OKA_FINISH_CASES, ...NUTELLA_L3C_CASES].filter((kase) => kase.turnedRound).map((kase) => kase.algorithm);
    expect(turned.length).toBeGreaterThan(0);
    for (const kase of [...oka, ...SETS_PYRAMINX_RESEARCH["nutella-l3c"]].filter((k) => turned.includes(k.algorithm))) {
      expect(kase.note).toContain("desde otro lado de la punta de detrás");
    }
  });

  it("every case is registered, marked as researched with its source, explained and drawn", () => {
    for (const kase of all) {
      expect(ALGORITHM_SETS[kase.setId]).toContain(kase);
      expect(kase.research?.url, `${kase.setId} ${kase.id}`).toMatch(/^https:\/\//);
      expect(kase.explanation?.length, `${kase.setId} ${kase.id}`).toBeGreaterThan(60);
      expect(existsSync(file(kase.image)), kase.image).toBe(true);
    }
  });

  it("every algorithm, with its final turn, solves its own case (some steps leave the block unfinished on purpose)", () => {
    const unfinished = ["1flip-arista", "oka-arista", "oka-centros", "nutella-aristas"];
    for (const setId of Object.keys(SETS_PYRAMINX_RESEARCH) as ResearchSetId[]) {
      researchCaseStates(setId).forEach(({ state, goal, adjust }, index) => {
        const kase = SETS_PYRAMINX_RESEARCH[setId][index];
        const after = applyPyraTokens(state, [...parsePyraNotation(kase.algorithm), ...adjust]);
        const label = `${setId} ${kase.id}`;
        if (unfinished.includes(setId)) expect(after.join(), label).toBe(goal.join());
        else expect(isSolvedPyraminx(after), label).toBe(true);
      });
    }
    for (const setId of unfinished) expect(isSolvedPyraminx(researchCaseStates(setId as ResearchSetId)[0].goal), setId).toBe(false);
  });

  it("reuses what already exists instead of copying it: Puntas, the V, the back edge and L3E", () => {
    expect(algorithms("keyhole-puntas")).toEqual(PYRA_PUNTAS_CASES.map((kase) => kase.algorithm));
    expect(algorithms("l4ei-puntas")).toEqual(PYRA_PUNTAS_CASES.map((kase) => kase.algorithm));
    expect(algorithms("keyhole-bloque")).toEqual(L4E_V_CASES.map((kase) => kase.algorithm));
    expect(algorithms("l4ei-v")).toEqual(L4E_V_CASES.map((kase) => kase.algorithm));
    expect(algorithms("l4ei-arista")).toEqual(algorithms("keyhole-arista"));
    expect(algorithms("l4ei-l3e")).toEqual(algorithms("keyhole-l3e"));
    expect(algorithms("keyhole-l3e")).toEqual(L3E_CASES.map((kase) => kase.algorithm));
    for (const method of ["1flip", "wo"]) {
      expect(algorithms(`${method}-puntas` as ResearchSetId)).toEqual(algorithms("keyhole-puntas"));
      expect(algorithms(`${method}-bloque` as ResearchSetId)).toEqual(algorithms("keyhole-bloque"));
      expect(algorithms(`${method}-arista` as ResearchSetId)).toEqual(THIRD_EDGE_CASES.map((kase) => kase.algorithm));
      expect(algorithms(`${method}-l3e` as ResearchSetId)).toEqual(algorithms("keyhole-l3e"));
    }
    expect(algorithms("wo-l3c")).toEqual(WO_L3C_CASES.map((kase) => kase.algorithm));
    expect(algorithms("1flip-l3c")).toEqual(ONE_FLIP_L3C_CASES.map((kase) => kase.algorithm));
  });

  it("the L3C cases cite Sarah's text, held with the block up; GLHF says the engine worked it out", () => {
    for (const kase of [...SETS_PYRAMINX_RESEARCH["wo-l3c"], ...SETS_PYRAMINX_RESEARCH["1flip-l3c"]]) {
      if (kase.name === "GLHF") expect(kase.note).toMatch(/^La fuente no trae algoritmo/);
      else expect(kase.note).toMatch(/^En la fuente está escrito «[^»]+», sujetando el Pyraminx con el bloque arriba/);
      expect(kase.explanation).toContain("[B]");
    }
    expect(SETS_PYRAMINX_RESEARCH["wo-l3c"]).toHaveLength(10);
    expect(SETS_PYRAMINX_RESEARCH["1flip-l3c"]).toHaveLength(11);
    // WO keeps the block whole; every 1-Flip case names its flipped edge.
    for (const kase of SETS_PYRAMINX_RESEARCH["wo-l3c"]) expect(kase.explanation).not.toContain("dada la vuelta");
    for (const kase of SETS_PYRAMINX_RESEARCH["1flip-l3c"]) expect(kase.explanation).toMatch(/del bloque está dada la vuelta/);
    expect(SETS_PYRAMINX_RESEARCH["1flip-l3c"].at(-1)!.explanation).toMatch(/^Los tres centros de delante ya coinciden/);
    // A center that shows green on the front face is never called wrong.
    for (const kase of [...SETS_PYRAMINX_RESEARCH["wo-l3c"], ...SETS_PYRAMINX_RESEARCH["1flip-l3c"]]) {
      expect(kase.explanation).not.toContain("enseña verde");
    }
    expect(SETS_PYRAMINX_RESEARCH["wo-l3c"][6].explanation).toContain("Al terminar, gira B para alinear el bloque");
  });

  it("the third-edge cases say where the edge is and how it is left", () => {
    for (const kase of SETS_PYRAMINX_RESEARCH["wo-arista"]) expect(kase.explanation).toContain("la deja bien puesta");
    for (const kase of SETS_PYRAMINX_RESEARCH["1flip-arista"]) expect(kase.explanation).toContain("dada la vuelta a propósito");
    for (const setId of ["wo-arista", "1flip-arista"] as const) {
      expect(new Set(SETS_PYRAMINX_RESEARCH[setId].map((kase) => kase.name)).size).toBe(7);
      for (const kase of SETS_PYRAMINX_RESEARCH[setId]) expect(kase.note).toMatch(/^Calculado con el motor/);
    }
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
