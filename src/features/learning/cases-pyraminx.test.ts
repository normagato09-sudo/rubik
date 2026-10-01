import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { faceOf } from "@/features/pyraminx/geometry";
import { applyPyraMoves, isSolvedPyraminx, parsePyraAlgorithm, solvedPyraminx, turnsWith } from "@/features/pyraminx/moves";
import { CENTER_STICKERS, EDGE_FACES, EDGE_STICKERS, TIP_STICKERS } from "@/features/pyraminx/pieces";
import {
  L4E_LEARN_CASES,
  L4E_PUNTAS_CASES,
  L4E_V_CASES,
  PYRA_CENTROS_CASES,
  PYRA_PRIMERA_CAPA_CASES,
  PYRA_PUNTAS_CASES,
  PYRA_ULTIMA_CAPA_CASES,
  generatedPyraminxDiagrams,
  pyraCaseState,
} from "./cases-pyraminx";
import { METHOD_STEPS } from "./sets";

const file = (image: string) => join(process.cwd(), "public", image);
const solved = solvedPyraminx();
const edge = (name: string) => EDGE_FACES.findIndex((faces) => faces.join("") === name);
const done = (state: readonly string[], stickers: readonly number[]) => stickers.every((i) => state[i] === solved[i]);
/** The bottom tips: the top one turns with U, together with its center, so it may be turned as a whole. */
const bottomTips = (["L", "R", "B"] as const).flatMap((v) => TIP_STICKERS[v]);
const centers = Object.values(CENTER_STICKERS).flat();
const bottomCenters = (["L", "R", "B"] as const).flatMap((v) => CENTER_STICKERS[v]);

describe("Pyraminx cases in Aprender", () => {
  const all = [
    ...PYRA_PUNTAS_CASES,
    ...PYRA_CENTROS_CASES,
    ...PYRA_PRIMERA_CAPA_CASES,
    ...PYRA_ULTIMA_CAPA_CASES,
    ...L4E_PUNTAS_CASES,
    ...L4E_V_CASES,
    ...L4E_LEARN_CASES,
  ];

  it("every algorithm solves its own case", () => {
    for (const kase of all) {
      const state = pyraCaseState(kase.algorithm);
      // The sheets' cases may still need a final turn of U.
      const after = applyPyraMoves(state, parsePyraAlgorithm(kase.algorithm));
      const solvedUpToU = [[], ["U"], ["U'"]].some((adjust) =>
        isSolvedPyraminx(applyPyraMoves(after, adjust as never[])),
      );
      expect(solvedUpToU, `${kase.setId} ${kase.id}`).toBe(true);
    }
  });

  it("every case has an explanation, and a diagram that exists", () => {
    for (const kase of all) {
      expect(kase.explanation?.length, `${kase.setId} ${kase.id}`).toBeGreaterThan(40);
      expect(existsSync(file(kase.image)), kase.image).toBe(true);
    }
  });

  it("the added steps are marked as added, the sheets' cases only when corrected", () => {
    for (const kase of [...PYRA_PUNTAS_CASES, ...PYRA_CENTROS_CASES, ...PYRA_PRIMERA_CAPA_CASES, ...L4E_PUNTAS_CASES, ...L4E_V_CASES]) {
      expect(kase.note, `${kase.setId} ${kase.id}`).toMatch(/^Añadido/);
    }
    expect(PYRA_ULTIMA_CAPA_CASES.filter((kase) => kase.note?.includes("no resuelve")).map((kase) => kase.number)).toEqual([5]);
    expect(L4E_LEARN_CASES.filter((kase) => kase.note?.includes("no resuelve"))).toEqual([]);
  });

  it("Puntas: only one tip is off; Centros: only the right layer is off, with its center", () => {
    for (const kase of [...PYRA_PUNTAS_CASES, ...L4E_PUNTAS_CASES]) {
      const state = pyraCaseState(kase.algorithm);
      expect(done(state, [...centers, ...EDGE_STICKERS.flat()])).toBe(true);
      expect(done(state, TIP_STICKERS.U)).toBe(false);
    }
    for (const kase of PYRA_CENTROS_CASES) {
      const state = pyraCaseState(kase.algorithm);
      const outside = state.flatMap((_, i) => (turnsWith("R", i) ? [] : [i]));
      expect(done(state, outside)).toBe(true);
      expect(done(state, CENTER_STICKERS.R)).toBe(false);
      expect(state.filter((color, i) => faceOf(i) === "D" && color === "yellow").length).toBeLessThan(9);
    }
  });

  it("Primera capa: bottom tips, bottom centers and two bottom edges done; the algorithm places the third", () => {
    for (const kase of PYRA_PRIMERA_CAPA_CASES) {
      const state = pyraCaseState(kase.algorithm);
      expect(done(state, [...bottomTips, ...bottomCenters, ...EDGE_STICKERS[edge("LD")], ...EDGE_STICKERS[edge("RD")]])).toBe(true);
      expect(done(state, EDGE_STICKERS[edge("FD")])).toBe(false);
    }
  });

  it("V: bottom tips, bottom centers and the left bottom edge done; the algorithm places the right one", () => {
    for (const kase of L4E_V_CASES) {
      const state = pyraCaseState(kase.algorithm);
      expect(done(state, [...bottomTips, ...bottomCenters, ...EDGE_STICKERS[edge("LD")]])).toBe(true);
      expect(done(state, EDGE_STICKERS[edge("RD")])).toBe(false);
    }
  });

  it("the cases of a step are all different", () => {
    for (const cases of [PYRA_PUNTAS_CASES, PYRA_CENTROS_CASES, PYRA_PRIMERA_CAPA_CASES, L4E_V_CASES]) {
      expect(new Set(cases.map((kase) => pyraCaseState(kase.algorithm).join())).size).toBe(cases.length);
    }
  });

  it("each method has its steps, with an explanation each", () => {
    expect(METHOD_STEPS["por-capas"].map((step) => step.title)).toEqual(["Puntas", "Centros", "Primera capa"]);
    expect(METHOD_STEPS.l4e.map((step) => step.title)).toEqual(["Puntas", "V"]);
    for (const step of [...METHOD_STEPS["por-capas"], ...METHOD_STEPS.l4e]) expect(step.intro?.length).toBeGreaterThan(100);
  });
});

describe("the Pyraminx diagrams RUBIKO draws", () => {
  const diagrams = generatedPyraminxDiagrams();

  if (process.env.WRITE_DIAGRAMS === "1") {
    for (const [image, svg] of Object.entries(diagrams)) {
      mkdirSync(dirname(file(image)), { recursive: true });
      writeFileSync(file(image), svg);
    }
  }

  it("are the cases of the added steps", () => {
    expect(Object.keys(diagrams)).toHaveLength(
      PYRA_PUNTAS_CASES.length + PYRA_CENTROS_CASES.length + PYRA_PRIMERA_CAPA_CASES.length + L4E_PUNTAS_CASES.length + L4E_V_CASES.length,
    );
  });

  it("the files in public/learning are exactly what the cases draw", () => {
    for (const [image, svg] of Object.entries(diagrams)) {
      expect(existsSync(file(image)), image).toBe(true);
      // Git may check the files out with CRLF line endings on Windows.
      expect(readFileSync(file(image), "utf8").replace(/\r\n/g, "\n"), image).toBe(svg);
    }
  });
});
