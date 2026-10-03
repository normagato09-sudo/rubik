import { describe, expect, it } from "vitest";
import { CUBES } from "./cubes";
import { LEVELS, getMethodLevel, getMethodsForCubeType, getSelectableMethodsForCubeType, METHODS } from "./methods";

describe("getMethodsForCubeType", () => {
  it("returns only methods scoped to the given cube type", () => {
    expect(getMethodsForCubeType("3x3").map((method) => method.id)).toEqual(["cfop", "petrus", "zz", "roux", "lbl"]);
    expect(getMethodsForCubeType("2x2").map((method) => method.id)).toEqual(["ortega", "cll"]);
  });

  it("returns an empty list for a cube type with no methods yet", () => {
    expect(getMethodsForCubeType("skewb")).toEqual([]);
  });
});

describe("getSelectableMethodsForCubeType", () => {
  it("lists CFOP, Petrus and ZZ for 3x3; coming-soon methods stay in METHODS but are hidden", () => {
    expect(getSelectableMethodsForCubeType("3x3").map((method) => method.id)).toEqual(["cfop", "petrus", "zz"]);
    expect(METHODS.map((method) => method.id)).toContain("roux");
  });

  it("lists Ortega and CLL for 2x2, never CFOP", () => {
    expect(getSelectableMethodsForCubeType("2x2").map((method) => method.id)).toEqual(["ortega", "cll"]);
  });

  it("lists the Pyraminx methods by level, easiest first", () => {
    expect(getSelectableMethodsForCubeType("pyraminx").map((method) => method.id)).toEqual([
      "por-capas",
      "keyhole",
      "l4e-intuitivo",
      "l4e",
      "oka",
      "1-flip",
      "wo",
      "nutella",
    ]);
  });
});

describe("method levels", () => {
  it("every active method has a level", () => {
    for (const method of METHODS.filter((m) => m.status === "active")) expect(LEVELS, method.id).toContain(method.level);
  });

  it("each cube lists its methods easiest first", () => {
    for (const cube of CUBES) {
      const ranks = getSelectableMethodsForCubeType(cube.id).map((method) => LEVELS.indexOf(method.level!));
      expect(ranks, cube.id).toEqual([...ranks].sort((a, b) => a - b));
    }
  });

  it("the levels agreed in docs/plan-metodos.md", () => {
    expect(getMethodLevel("cfop")).toBe("Intermedio");
    expect(getMethodLevel("petrus")).toBe("Intermedio");
    expect(getMethodLevel("zz")).toBe("Avanzado");
    expect(getMethodLevel("ortega")).toBe("Intermedio");
    expect(getMethodLevel("cll")).toBe("Avanzado");
    expect(getMethodLevel("por-capas")).toBe("Principiante");
    expect(["keyhole", "l4e-intuitivo", "l4e"].map(getMethodLevel)).toEqual(["Intermedio", "Intermedio", "Intermedio"]);
    expect(["oka", "1-flip", "wo"].map(getMethodLevel)).toEqual(["Avanzado", "Avanzado", "Avanzado"]);
    expect(getMethodLevel("nutella")).toBe("Experto");
  });
});
