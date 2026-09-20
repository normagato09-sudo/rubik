import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSolvedCube } from "@/features/cube/model";
import { elapsedMs } from "@/features/timer/engine";
import { useCubeStore } from "./cubeStore";
import { useHistoryStore } from "./historyStore";
import { useInspectionStore } from "./inspectionStore";
import { useTimerStore } from "./timerStore";

function state() {
  return useTimerStore.getState();
}

/** Makes performance.now() return each value in `values` on successive calls. */
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
  useHistoryStore.setState({ entries: [] });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("timerStore", () => {
  it("starts idle/stopped, ready to run", () => {
    expect(state().status).toBe("idle");
    expect(state().startedAt).toBeNull();
    expect(state().finalTimeMs).toBeNull();
  });

  it("start() transitions to running", () => {
    mockNow(1000);
    state().start();
    expect(state().status).toBe("running");
    expect(state().startedAt).toBe(1000);
  });

  it("stop() transitions to stopped and keeps the elapsed time", () => {
    mockNow(1000, 4200);
    state().start();
    state().stop();
    expect(state().status).toBe("stopped");
    expect(state().finalTimeMs).toBe(3200);
    expect(state().startedAt).toBeNull();
  });

  it("reset() returns to idle", () => {
    mockNow(1000, 4200);
    state().start();
    state().stop();
    state().reset();
    expect(state().status).toBe("idle");
    expect(state().startedAt).toBeNull();
    expect(state().finalTimeMs).toBeNull();
  });

  it("time increases while running", () => {
    mockNow(1000);
    state().start();
    const early = elapsedMs(state(), 1500);
    const later = elapsedMs(state(), 2500);
    expect(later).toBeGreaterThan(early);
  });

  it("stopping conserves exactly the final time until the next start", () => {
    mockNow(1000, 4237);
    state().start();
    state().stop();
    const frozen = state().finalTimeMs;
    expect(frozen).toBe(3237);
    // No further ticking happens: reading it again gives the same value.
    expect(state().finalTimeMs).toBe(frozen);
  });

  it("cannot have two timers running simultaneously", () => {
    mockNow(1000, 5000);
    state().start();
    state().start(); // second call while already running must be a no-op
    expect(state().startedAt).toBe(1000);
  });

  it("resetting mid-run cleanly clears the state", () => {
    mockNow(1000);
    state().start();
    expect(state().status).toBe("running");
    state().reset();
    expect(state()).toMatchObject({ status: "idle", startedAt: null, finalTimeMs: null });
  });

  describe("integration with the cube store", () => {
    beforeEach(() => {
      useCubeStore.getState().resetCube();
    });

    it("does not break an active scramble", () => {
      useCubeStore.getState().requestScramble();
      while (useCubeStore.getState().activeMove !== null) {
        useCubeStore.getState().finishActiveMove();
      }
      const scrambleBefore = useCubeStore.getState().scramble;

      mockNow(1000, 2000);
      state().start();
      state().stop();

      expect(useCubeStore.getState().scramble).toEqual(scrambleBefore);
    });

    it("does not break RESET", () => {
      mockNow(1000);
      state().start();

      useCubeStore.getState().resetCube();

      expect(useCubeStore.getState().cubeState).toEqual(createSolvedCube());
      expect(state().status).toBe("running"); // resetting the cube must not touch the timer
    });

    it("cube moves keep working while the timer runs", () => {
      mockNow(1000);
      state().start();

      const before = useCubeStore.getState().cubeState;
      useCubeStore.getState().requestMove("R");
      useCubeStore.getState().finishActiveMove();

      expect(useCubeStore.getState().cubeState).not.toEqual(before);
    });
  });

  describe("+2 penalty", () => {
    beforeEach(() => {
      useInspectionStore.setState({ status: "idle", startedAt: null });
    });

    it("can be applied to a finished solve and adds exactly 2000ms", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      expect(state().finalTimeMs).toBe(12_340);

      state().applyPlus2();

      expect(state().penalty).toBe("plus2");
      expect(state().finalTimeMs).toBe(12_340); // base time untouched
      expect(elapsedMs(state(), 999_999)).toBe(14_340);
    });

    it("cannot be applied before any solve has finished", () => {
      state().applyPlus2();
      expect(state().penalty).toBe("none");
    });

    it("cannot be applied while the timer is running", () => {
      mockNow(1000);
      state().start();
      state().applyPlus2();
      expect(state().penalty).toBe("none");
    });

    it("cannot be applied twice to the same solve", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      state().applyPlus2();
      state().applyPlus2();
      expect(elapsedMs(state(), 999_999)).toBe(14_340); // still +2, never +4
    });

    it("a new solve starts without the previous penalty", () => {
      mockNow(1000, 13_340, 20_000);
      state().start();
      state().stop();
      state().applyPlus2();

      state().start();

      expect(state().penalty).toBe("none");
    });

    it("cannot be applied while an inspection is running", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();

      useInspectionStore.setState({ status: "running", startedAt: 20_000 });
      state().applyPlus2();

      expect(state().penalty).toBe("none");
    });

    it("full flow: inspection -> resolve -> stop -> +2", () => {
      mockNow(1000, 16_000, 20_000, 32_340);
      useInspectionStore.getState().start(); // 1000
      useInspectionStore.getState().tick(); // 16000: auto-finishes
      expect(useInspectionStore.getState().status).toBe("finished");

      state().start(); // 20000, a fresh solve
      state().stop(); // 32340 -> 12340ms raw

      state().applyPlus2();

      expect(state().penalty).toBe("plus2");
      expect(elapsedMs(state(), 999_999)).toBe(14_340);
    });

    it("RESET clears the penalty, as the RESET button does", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      state().applyPlus2();
      expect(state().penalty).toBe("plus2");

      // Same composition ResetButton performs on click.
      useCubeStore.getState().resetCube();
      useInspectionStore.getState().cancel();
      state().reset();

      expect(state().penalty).toBe("none");
      expect(state().finalTimeMs).toBeNull();
    });

    it("does not break scramble or cube moves", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      state().applyPlus2();

      useCubeStore.getState().requestScramble();
      expect(useCubeStore.getState().scramble).not.toBeNull();
      while (useCubeStore.getState().activeMove !== null) {
        useCubeStore.getState().finishActiveMove();
      }

      const before = useCubeStore.getState().cubeState;
      useCubeStore.getState().requestMove("R");
      useCubeStore.getState().finishActiveMove();
      expect(useCubeStore.getState().cubeState).not.toEqual(before);
    });
  });

  describe("DNF", () => {
    beforeEach(() => {
      useInspectionStore.setState({ status: "idle", startedAt: null });
    });

    it("can be applied to a finished solve", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();

      state().markDnf();

      expect(state().penalty).toBe("dnf");
      expect(state().finalTimeMs).toBe(12_340); // raw time still preserved internally
    });

    it("cannot be applied before any solve has finished", () => {
      state().markDnf();
      expect(state().penalty).toBe("none");
    });

    it("cannot be applied while the timer is running", () => {
      mockNow(1000);
      state().start();
      state().markDnf();
      expect(state().penalty).toBe("none");
    });

    it("cannot be applied while an inspection is running", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();

      useInspectionStore.setState({ status: "running", startedAt: 20_000 });
      state().markDnf();

      expect(state().penalty).toBe("none");
    });

    it("cannot be applied twice to the same solve", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      state().markDnf();
      const afterFirst = state();
      state().markDnf();
      expect(state()).toEqual(afterFirst);
    });

    it("a solve with +2 can become DNF, and the result is DNF, not +2", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      state().applyPlus2();
      expect(state().penalty).toBe("plus2");

      state().markDnf();

      expect(state().penalty).toBe("dnf");
    });

    it("a new solve starts without any previous DNF", () => {
      mockNow(1000, 13_340, 20_000);
      state().start();
      state().stop();
      state().markDnf();

      state().start();

      expect(state().penalty).toBe("none");
    });

    it("RESET clears DNF, as the RESET button does", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      state().markDnf();
      expect(state().penalty).toBe("dnf");

      // Same composition ResetButton performs on click.
      useCubeStore.getState().resetCube();
      useInspectionStore.getState().cancel();
      state().reset();

      expect(state().penalty).toBe("none");
      expect(state().finalTimeMs).toBeNull();
    });

    it("full flow: inspection -> resolve -> stop -> DNF", () => {
      mockNow(1000, 16_000, 20_000, 32_340);
      useInspectionStore.getState().start();
      useInspectionStore.getState().tick(); // auto-finishes at 16000
      expect(useInspectionStore.getState().status).toBe("finished");

      state().start(); // 20000
      state().stop(); // 32340

      state().markDnf();

      expect(state().penalty).toBe("dnf");
    });

    it("full flow: +2 then DNF ends as DNF", () => {
      mockNow(1000, 16_000, 20_000, 32_340);
      useInspectionStore.getState().start();
      useInspectionStore.getState().tick();

      state().start();
      state().stop();
      state().applyPlus2();
      state().markDnf();

      expect(state().penalty).toBe("dnf");
    });

    it("a fresh resolution after DNF or +2 starts clean", () => {
      mockNow(1000, 13_340, 20_000);
      state().start();
      state().stop();
      state().markDnf();

      // New attempt: scramble, then a brand-new solve.
      useCubeStore.getState().requestScramble();
      useInspectionStore.getState().cancel();
      state().start();

      expect(state().penalty).toBe("none");
      expect(state().finalTimeMs).toBeNull();
    });

    it("does not break scramble or cube moves", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      state().markDnf();

      useCubeStore.getState().requestScramble();
      expect(useCubeStore.getState().scramble).not.toBeNull();
      while (useCubeStore.getState().activeMove !== null) {
        useCubeStore.getState().finishActiveMove();
      }

      const before = useCubeStore.getState().cubeState;
      useCubeStore.getState().requestMove("R");
      useCubeStore.getState().finishActiveMove();
      expect(useCubeStore.getState().cubeState).not.toEqual(before);
    });
  });

  describe("history integration", () => {
    beforeEach(() => {
      useInspectionStore.setState({ status: "idle", startedAt: null });
      useCubeStore.getState().resetCube();
    });

    it("records a normal solve exactly once, with the scramble it was done on", () => {
      useCubeStore.getState().requestScramble();
      while (useCubeStore.getState().activeMove !== null) {
        useCubeStore.getState().finishActiveMove();
      }
      const scramble = useCubeStore.getState().scramble;

      mockNow(1000, 13_340);
      state().start();
      state().stop();

      const entries = useHistoryStore.getState().entries;
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ baseTimeMs: 12_340, penalty: "none" });
      expect(entries[0].scramble).toEqual(scramble);
    });

    it("STOP then +2 produces a single entry with +2, not two entries", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      state().applyPlus2();

      const entries = useHistoryStore.getState().entries;
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ baseTimeMs: 12_340, penalty: "plus2" });
    });

    it("STOP then DNF produces a single DNF entry", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      state().markDnf();

      const entries = useHistoryStore.getState().entries;
      expect(entries).toHaveLength(1);
      expect(entries[0].penalty).toBe("dnf");
    });

    it("+2 then DNF produces a single entry whose final result is DNF", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      state().applyPlus2();
      state().markDnf();

      const entries = useHistoryStore.getState().entries;
      expect(entries).toHaveLength(1);
      expect(entries[0].penalty).toBe("dnf");
    });

    it("two distinct solves produce two distinct entries with unique ids", () => {
      mockNow(1000, 13_340, 20_000, 25_000);
      state().start();
      state().stop();
      state().start();
      state().stop();

      const entries = useHistoryStore.getState().entries;
      expect(entries).toHaveLength(2);
      expect(entries[0].id).not.toBe(entries[1].id);
    });

    it("orders solves from most recent to oldest", () => {
      mockNow(1000, 13_340, 20_000, 25_000);
      state().start();
      state().stop(); // solve 1: 12340ms
      state().start();
      state().stop(); // solve 2: 5000ms

      const entries = useHistoryStore.getState().entries;
      expect(entries[0].baseTimeMs).toBe(5000); // most recent first
      expect(entries[1].baseTimeMs).toBe(12_340);
    });

    it("a new solve does not inherit a previous +2/DNF and gets its own entry", () => {
      mockNow(1000, 13_340, 20_000, 23_500);
      state().start();
      state().stop();
      state().markDnf();

      state().start();
      state().stop();

      const entries = useHistoryStore.getState().entries;
      expect(entries).toHaveLength(2);
      expect(entries[0].penalty).toBe("none"); // the new solve
      expect(entries[1].penalty).toBe("dnf"); // the old one, left untouched
    });

    it("clear() removes every entry without touching the cube, timer or inspection", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      useCubeStore.getState().requestScramble();

      const cubeStateBefore = useCubeStore.getState().cubeState;
      const scrambleBefore = useCubeStore.getState().scramble;
      const timerStatusBefore = state().status;
      const finalTimeBefore = state().finalTimeMs;
      const inspectionStatusBefore = useInspectionStore.getState().status;

      useHistoryStore.getState().clear();

      expect(useHistoryStore.getState().entries).toEqual([]);
      expect(useCubeStore.getState().cubeState).toEqual(cubeStateBefore);
      expect(useCubeStore.getState().scramble).toEqual(scrambleBefore);
      expect(state().status).toBe(timerStatusBefore);
      expect(state().finalTimeMs).toBe(finalTimeBefore);
      expect(useInspectionStore.getState().status).toBe(inspectionStatusBefore);
    });

    it("does not create duplicates from repeated state reads (simulated re-renders)", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();
      // Reading the store repeatedly (as re-renders would) must never re-record.
      state();
      state();
      state();
      expect(useHistoryStore.getState().entries).toHaveLength(1);
    });

    it("full flow: inspection -> resolve -> stop -> +2 -> DNF ends as one DNF entry", () => {
      mockNow(1000, 16_000, 20_000, 32_340);
      useInspectionStore.getState().start();
      useInspectionStore.getState().tick(); // auto-finishes at 16000

      state().start(); // 20000
      state().stop(); // 32340 -> 12340ms
      state().applyPlus2();
      state().markDnf();

      const entries = useHistoryStore.getState().entries;
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ baseTimeMs: 12_340, penalty: "dnf" });
    });

    it("scramble and cube moves keep working", () => {
      mockNow(1000, 13_340);
      state().start();
      state().stop();

      useCubeStore.getState().requestScramble();
      expect(useCubeStore.getState().scramble).not.toBeNull();
      while (useCubeStore.getState().activeMove !== null) {
        useCubeStore.getState().finishActiveMove();
      }

      const before = useCubeStore.getState().cubeState;
      useCubeStore.getState().requestMove("R");
      useCubeStore.getState().finishActiveMove();
      expect(useCubeStore.getState().cubeState).not.toEqual(before);
    });
  });
});
