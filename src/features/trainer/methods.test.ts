import { describe, expect, it } from "vitest";
import { getMethodsForCubeType, getSelectableMethodsForCubeType, METHODS } from "./methods";

describe("getMethodsForCubeType", () => {
  it("returns only methods scoped to the given cube type", () => {
    const methods = getMethodsForCubeType("3x3");
    expect(methods).toEqual(METHODS);
  });

  it("returns an empty list for a cube type with no methods yet", () => {
    expect(getMethodsForCubeType("2x2")).toEqual([]);
  });
});

describe("getSelectableMethodsForCubeType", () => {
  it("lists only CFOP for 3x3; coming-soon methods stay in METHODS but are hidden", () => {
    expect(getSelectableMethodsForCubeType("3x3").map((method) => method.id)).toEqual(["cfop"]);
    expect(METHODS.map((method) => method.id)).toContain("roux");
  });
});
