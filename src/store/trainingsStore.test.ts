import { beforeEach, describe, expect, it } from "vitest";
import type { TrainingAttempt } from "@/features/trainings/types";
import { useTrainingsStore } from "./trainingsStore";

function attempt(overrides: Partial<TrainingAttempt> = {}): TrainingAttempt {
  return {
    id: "id-1",
    cubeId: "cube-1",
    methodId: "cfop",
    stageId: "cross",
    scramble: ["R"],
    timeMs: 3000,
    completedAt: 1000,
    ...overrides,
  };
}

beforeEach(() => {
  useTrainingsStore.setState({ attempts: [] });
});

describe("trainingsStore", () => {
  it("starts empty", () => {
    expect(useTrainingsStore.getState().attempts).toEqual([]);
  });

  it("record() adds a new attempt at the front", () => {
    useTrainingsStore.getState().record(attempt({ id: "a" }));
    useTrainingsStore.getState().record(attempt({ id: "b" }));
    expect(useTrainingsStore.getState().attempts.map((a) => a.id)).toEqual(["b", "a"]);
  });

  it("clear() empties the list", () => {
    useTrainingsStore.getState().record(attempt());
    useTrainingsStore.getState().clear();
    expect(useTrainingsStore.getState().attempts).toEqual([]);
  });
});
