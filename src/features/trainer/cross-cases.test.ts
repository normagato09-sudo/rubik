import { describe, expect, it } from "vitest";
import { createSolvedCube } from "@/features/cube/model";
import { applyMoves } from "@/features/cube/moves";
import { CROSS_CASES, startingStateFor } from "./cross-cases";

describe("CROSS_CASES", () => {
  it("has exactly the 4 titled ruwix cases", () => {
    expect(CROSS_CASES.map((c) => c.id)).toEqual([
      "flip-edge",
      "bottom-layer",
      "middle-layer",
      "middle-layer-mirror",
    ]);
  });

  it.each(CROSS_CASES)("$id: playing the algorithm from its starting state solves it", (kase) => {
    const start = startingStateFor(kase);
    expect(start).not.toEqual(createSolvedCube());

    const solved = applyMoves(start, kase.algorithm);
    expect(solved).toEqual(createSolvedCube());
  });
});
