import { beforeEach, describe, expect, it } from "vitest";
import type { HistoryEntry } from "@/features/history/types";
import { useHistoryStore } from "./historyStore";

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "id-1",
    cubeId: "cube-1",
    completedAt: 1000,
    baseTimeMs: 12_340,
    penalty: "none",
    scramble: ["R"],
    ...overrides,
  };
}

beforeEach(() => {
  useHistoryStore.setState({ entries: [] });
});

describe("historyStore", () => {
  it("starts empty", () => {
    expect(useHistoryStore.getState().entries).toEqual([]);
  });

  it("record() adds a new entry at the front", () => {
    useHistoryStore.getState().record(entry({ id: "a" }));
    useHistoryStore.getState().record(entry({ id: "b" }));
    expect(useHistoryStore.getState().entries.map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("updatePenalty() updates only the matching entry", () => {
    useHistoryStore.getState().record(entry({ id: "a" }));
    useHistoryStore.getState().record(entry({ id: "b" }));
    useHistoryStore.getState().updatePenalty("a", "plus2");

    const entries = useHistoryStore.getState().entries;
    expect(entries.find((e) => e.id === "a")?.penalty).toBe("plus2");
    expect(entries.find((e) => e.id === "b")?.penalty).toBe("none");
  });

  it("clear() empties the list", () => {
    useHistoryStore.getState().record(entry({ id: "a" }));
    useHistoryStore.getState().clear();
    expect(useHistoryStore.getState().entries).toEqual([]);
  });
});
