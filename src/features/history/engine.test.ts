import { describe, expect, it } from "vitest";
import { addEntry, clearHistory, resultTimeMs, solvesForCube, updateEntryPenalty } from "./engine";
import type { HistoryEntry } from "./types";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "id-1",
    cubeId: "cube-1",
    completedAt: 1000,
    baseTimeMs: 12_340,
    penalty: "none",
    scramble: ["R", "U", "R'"],
    ...overrides,
  };
}

describe("history engine", () => {
  it("creates a valid entry shape", () => {
    const entry = makeEntry();
    expect(entry).toMatchObject({ id: "id-1", baseTimeMs: 12_340, penalty: "none" });
    expect(entry.scramble).toEqual(["R", "U", "R'"]);
  });

  it("addEntry prepends so the newest entry is first", () => {
    const withFirst = addEntry([], makeEntry({ id: "a" }));
    const withBoth = addEntry(withFirst, makeEntry({ id: "b" }));
    expect(withBoth.map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("updateEntryPenalty updates only the matching entry", () => {
    const a = makeEntry({ id: "a", penalty: "none" });
    const b = makeEntry({ id: "b", penalty: "none" });
    const updated = updateEntryPenalty([b, a], "a", "plus2");
    expect(updated.find((e) => e.id === "a")?.penalty).toBe("plus2");
    expect(updated.find((e) => e.id === "b")?.penalty).toBe("none");
  });

  it("updateEntryPenalty never touches baseTimeMs or the scramble", () => {
    const a = makeEntry({ id: "a" });
    const updated = updateEntryPenalty([a], "a", "dnf");
    expect(updated[0].baseTimeMs).toBe(a.baseTimeMs);
    expect(updated[0].scramble).toEqual(a.scramble);
  });

  it("updateEntryPenalty is a no-op for an unknown id", () => {
    const a = makeEntry({ id: "a" });
    expect(updateEntryPenalty([a], "unknown", "dnf")).toEqual([a]);
  });

  it("clearHistory returns an empty list", () => {
    expect(clearHistory()).toEqual([]);
  });

  it("resultTimeMs adds 2000ms only for plus2, and ignores dnf", () => {
    expect(resultTimeMs(makeEntry({ penalty: "none", baseTimeMs: 10_000 }))).toBe(10_000);
    expect(resultTimeMs(makeEntry({ penalty: "plus2", baseTimeMs: 10_000 }))).toBe(12_000);
    expect(resultTimeMs(makeEntry({ penalty: "dnf", baseTimeMs: 10_000 }))).toBe(10_000);
  });

  it("solvesForCube keeps only entries for the given cube, same order", () => {
    const a = makeEntry({ id: "a", cubeId: "cube-1" });
    const b = makeEntry({ id: "b", cubeId: "cube-2" });
    const c = makeEntry({ id: "c", cubeId: "cube-1" });

    expect(solvesForCube([a, b, c], "cube-1")).toEqual([a, c]);
  });
});
