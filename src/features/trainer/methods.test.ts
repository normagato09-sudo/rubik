import { describe, expect, it } from "vitest";
import { getMethodsForCubeType, getSelectableMethodsForCubeType, METHODS } from "./methods";

describe("getMethodsForCubeType", () => {
  it("returns only methods scoped to the given cube type", () => {
    expect(getMethodsForCubeType("3x3").map((method) => method.id)).toEqual(["cfop", "roux", "zz", "petrus", "lbl"]);
    expect(getMethodsForCubeType("2x2").map((method) => method.id)).toEqual(["ortega", "cll"]);
  });

  it("returns an empty list for a cube type with no methods yet", () => {
    expect(getMethodsForCubeType("skewb")).toEqual([]);
  });
});

describe("getSelectableMethodsForCubeType", () => {
  it("lists only CFOP for 3x3; coming-soon methods stay in METHODS but are hidden", () => {
    expect(getSelectableMethodsForCubeType("3x3").map((method) => method.id)).toEqual(["cfop"]);
    expect(METHODS.map((method) => method.id)).toContain("roux");
  });

  it("lists Ortega and CLL for 2x2, never CFOP", () => {
    expect(getSelectableMethodsForCubeType("2x2").map((method) => method.id)).toEqual(["ortega", "cll"]);
  });

  it("lists the Pyraminx methods, easiest first", () => {
    expect(getSelectableMethodsForCubeType("pyraminx").map((method) => method.id)).toEqual([
      "por-capas",
      "keyhole",
      "l4e-intuitivo",
      "1-flip",
      "wo",
      "l4e",
    ]);
  });
});
