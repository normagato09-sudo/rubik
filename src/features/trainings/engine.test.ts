import { describe, expect, it } from "vitest";
import { addAttempt, attemptsForStage, clearAttempts } from "./engine";
import type { TrainingAttempt } from "./types";

function makeAttempt(overrides: Partial<TrainingAttempt> = {}): TrainingAttempt {
  return {
    id: "id-1",
    cubeId: "cube-1",
    methodId: "cfop",
    stageId: "cross",
    scramble: ["R", "U"],
    timeMs: 4200,
    completedAt: 1000,
    ...overrides,
  };
}

describe("trainings engine", () => {
  it("addAttempt prepends so the newest attempt is first", () => {
    const withFirst = addAttempt([], makeAttempt({ id: "a" }));
    const withBoth = addAttempt(withFirst, makeAttempt({ id: "b" }));
    expect(withBoth.map((a) => a.id)).toEqual(["b", "a"]);
  });

  it("clearAttempts returns an empty list", () => {
    expect(clearAttempts()).toEqual([]);
  });

  it("attemptsForStage only returns attempts matching both method and stage", () => {
    const cross = makeAttempt({ id: "cross-1", methodId: "cfop", stageId: "cross" });
    const f2l = makeAttempt({ id: "f2l-1", methodId: "cfop", stageId: "f2l" });
    const attempts = [f2l, cross];

    expect(attemptsForStage(attempts, "cfop", "cross")).toEqual([cross]);
  });
});
