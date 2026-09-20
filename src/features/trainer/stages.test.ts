import { describe, expect, it } from "vitest";
import { CFOP_STAGES } from "./cfop";
import { getStagesForMethod } from "./stages";

describe("getStagesForMethod", () => {
  it("returns CFOP's stages for cfop", () => {
    expect(getStagesForMethod("cfop")).toEqual(CFOP_STAGES);
  });

  it("returns an empty list for a method with no stages yet", () => {
    expect(getStagesForMethod("roux")).toEqual([]);
  });
});
