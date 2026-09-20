import { describe, expect, it } from "vitest";
import { getMethodsForCubeType, METHODS } from "./methods";

describe("getMethodsForCubeType", () => {
  it("returns only methods scoped to the given cube type", () => {
    const methods = getMethodsForCubeType("3x3");
    expect(methods).toEqual(METHODS);
  });

  it("returns an empty list for a cube type with no methods yet", () => {
    expect(getMethodsForCubeType("2x2")).toEqual([]);
  });
});
