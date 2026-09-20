import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HistoryEntry } from "@/features/history/types";
import { useCubeStore } from "@/store/cubeStore";
import { useHistoryStore } from "@/store/historyStore";
import { useInspectionStore } from "@/store/inspectionStore";
import { useTimerStore } from "@/store/timerStore";
import { calculateAo5, formatAo5 } from "./ao5";

let nextId = 0;
function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  nextId += 1;
  return {
    id: `entry-${nextId}`,
    completedAt: nextId,
    baseTimeMs: 10_000,
    penalty: "none",
    scramble: ["R"],
    ...overrides,
  };
}

describe("calculateAo5 (pure)", () => {
  it("returns notEnoughSolves with fewer than 5 solves", () => {
    for (let count = 0; count <= 4; count++) {
      const entries = Array.from({ length: count }, () => makeEntry());
      expect(calculateAo5(entries)).toEqual({ kind: "notEnoughSolves" });
    }
  });

  it("calculates correctly with exactly 5 solves (drops best and worst)", () => {
    // Most recent first: 14, 13, 12, 11, 10 (seconds).
    const entries = [14_000, 13_000, 12_000, 11_000, 10_000].map((baseTimeMs) =>
      makeEntry({ baseTimeMs }),
    );
    // Drops 10.00 (best) and 14.00 (worst); average of 11, 12, 13 = 12.00.
    expect(calculateAo5(entries)).toEqual({ kind: "timeMs", timeMs: 12_000 });
  });

  it("uses only the 5 most recent solves when there are more", () => {
    const recent5 = [14_000, 13_000, 12_000, 11_000, 10_000].map((baseTimeMs) =>
      makeEntry({ baseTimeMs }),
    );
    // An older 6th solve, with a wildly different time, must be ignored.
    const older = makeEntry({ baseTimeMs: 999_000 });
    expect(calculateAo5([...recent5, older])).toEqual({ kind: "timeMs", timeMs: 12_000 });
  });

  it("drops exactly one best and one worst regardless of chronological order", () => {
    const entries = [13_000, 10_000, 14_000, 11_000, 12_000].map((baseTimeMs) =>
      makeEntry({ baseTimeMs }),
    );
    expect(calculateAo5(entries)).toEqual({ kind: "timeMs", timeMs: 12_000 });
  });

  it("+2 is calculated as baseTimeMs + 2000ms", () => {
    // 10, 11, 12(+2 -> 14), 13, 14 seconds.
    const entries = [
      makeEntry({ baseTimeMs: 10_000 }),
      makeEntry({ baseTimeMs: 11_000 }),
      makeEntry({ baseTimeMs: 12_000, penalty: "plus2" }),
      makeEntry({ baseTimeMs: 13_000 }),
      makeEntry({ baseTimeMs: 14_000 }),
    ];
    // Effective values: 10, 11, 14, 13, 14 -> sorted 10,11,13,14,14 ->
    // drop one 10 (best) and one 14 (worst) -> average(11,13,14) = 12.667.
    const result = calculateAo5(entries);
    expect(result.kind).toBe("timeMs");
    expect(result).toEqual({ kind: "timeMs", timeMs: (11_000 + 13_000 + 14_000) / 3 });
  });

  it("a single DNF is treated as the worst result", () => {
    const entries = [
      makeEntry({ penalty: "dnf", baseTimeMs: 0 }),
      makeEntry({ baseTimeMs: 13_000 }),
      makeEntry({ baseTimeMs: 12_000 }),
      makeEntry({ baseTimeMs: 11_000 }),
      makeEntry({ baseTimeMs: 10_000 }),
    ];
    // DNF (worst) and 10.00 (best) are both dropped; average(11,12,13) = 12.00.
    expect(calculateAo5(entries)).toEqual({ kind: "timeMs", timeMs: 12_000 });
  });

  it("with one DNF, the average uses the other 3 numeric times after dropping the best", () => {
    const entries = [
      makeEntry({ baseTimeMs: 10_000 }),
      makeEntry({ baseTimeMs: 11_000 }),
      makeEntry({ baseTimeMs: 12_000 }),
      makeEntry({ baseTimeMs: 13_000 }),
      makeEntry({ penalty: "dnf", baseTimeMs: 0 }),
    ];
    expect(calculateAo5(entries)).toEqual({ kind: "timeMs", timeMs: 12_000 });
  });

  it("two or more DNFs make the Ao5 itself DNF", () => {
    const entries = [
      makeEntry({ penalty: "dnf", baseTimeMs: 0 }),
      makeEntry({ penalty: "dnf", baseTimeMs: 0 }),
      makeEntry({ baseTimeMs: 12_000 }),
      makeEntry({ baseTimeMs: 11_000 }),
      makeEntry({ baseTimeMs: 10_000 }),
    ];
    expect(calculateAo5(entries)).toEqual({ kind: "dnf" });
  });

  it("does not modify the order of the entries array", () => {
    const entries = [14_000, 13_000, 12_000, 11_000, 10_000].map((baseTimeMs) =>
      makeEntry({ baseTimeMs }),
    );
    const idsBefore = entries.map((e) => e.id);
    calculateAo5(entries);
    expect(entries.map((e) => e.id)).toEqual(idsBefore);
  });

  it("does not modify any history entry", () => {
    const entries = [14_000, 13_000, 12_000, 11_000, 10_000].map((baseTimeMs) =>
      makeEntry({ baseTimeMs }),
    );
    const snapshot = entries.map((e) => ({ ...e }));
    calculateAo5(entries);
    expect(entries).toEqual(snapshot);
    entries.forEach((entry, i) => expect(entry).toBe(entries[i])); // same references
  });

  it("formatAo5 renders '—', 'DNF' or a formatted time", () => {
    expect(formatAo5({ kind: "notEnoughSolves" })).toBe("—");
    expect(formatAo5({ kind: "dnf" })).toBe("DNF");
    expect(formatAo5({ kind: "timeMs", timeMs: 12_340 })).toBe("12.34");
  });
});

describe("Ao5 integration with the real stores", () => {
  function mockNow(...values: number[]) {
    const spy = vi.spyOn(performance, "now");
    for (const value of values) spy.mockImplementationOnce(() => value);
    return spy;
  }

  beforeEach(() => {
    useTimerStore.setState({
      status: "idle",
      startedAt: null,
      finalTimeMs: null,
      penalty: "none",
      currentEntryId: null,
    });
    useInspectionStore.setState({ status: "idle", startedAt: null });
    useHistoryStore.setState({ entries: [] });
    useCubeStore.getState().resetCube();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("a new solve updates the Ao5 once there are enough solves", () => {
    mockNow(0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000);
    for (let i = 0; i < 4; i++) {
      useTimerStore.getState().start();
      useTimerStore.getState().stop();
    }
    expect(calculateAo5(useHistoryStore.getState().entries)).toEqual({ kind: "notEnoughSolves" });

    useTimerStore.getState().start();
    useTimerStore.getState().stop();

    expect(calculateAo5(useHistoryStore.getState().entries).kind).toBe("timeMs");
  });

  it("changing a solve from +2 to DNF updates the Ao5 accordingly", () => {
    // Base times, oldest to newest: 10000, 11000, 11500, 13000, 14000.
    mockNow(0, 10_000, 20_000, 31_000, 40_000, 51_500, 60_000, 73_000, 80_000, 94_000);
    for (let i = 0; i < 5; i++) {
      useTimerStore.getState().start();
      useTimerStore.getState().stop();
    }

    const entries = useHistoryStore.getState().entries;
    expect(entries).toHaveLength(5);
    const middleEntryId = entries[2].id; // the 11500ms solve, third most recent
    expect(entries[2].baseTimeMs).toBe(11_500);

    useTimerStore.setState({ currentEntryId: middleEntryId });
    useTimerStore.getState().applyPlus2();

    const withPlus2 = calculateAo5(useHistoryStore.getState().entries);
    expect(withPlus2).toEqual({ kind: "timeMs", timeMs: 12_500 });

    useTimerStore.setState({ currentEntryId: middleEntryId, penalty: "plus2" });
    useTimerStore.getState().markDnf();

    const withDnf = calculateAo5(useHistoryStore.getState().entries);
    expect(withDnf).toEqual({ kind: "timeMs", timeMs: (11_000 + 13_000 + 14_000) / 3 });
    expect(withDnf).not.toEqual(withPlus2);
  });

  it("the history keeps recording solves exactly as before", () => {
    mockNow(0, 1000, 2000, 3500);
    useTimerStore.getState().start();
    useTimerStore.getState().stop();
    useTimerStore.getState().start();
    useTimerStore.getState().stop();

    const entries = useHistoryStore.getState().entries;
    expect(entries).toHaveLength(2);
    expect(entries[0].baseTimeMs).toBe(1500);
    expect(entries[1].baseTimeMs).toBe(1000);
  });
});
