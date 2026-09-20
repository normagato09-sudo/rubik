import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSolvedCube } from "@/features/cube/model";
import { elapsedMs } from "@/features/timer/engine";
import { INSPECTION_DURATION_MS, remainingSeconds } from "@/features/timer/inspection";
import { useCubeStore } from "./cubeStore";
import { useInspectionStore } from "./inspectionStore";
import { useTimerStore } from "./timerStore";

function state() {
  return useInspectionStore.getState();
}

/** Makes performance.now() return each value in `values` on successive calls. */
function mockNow(...values: number[]) {
  const spy = vi.spyOn(performance, "now");
  for (const value of values) spy.mockImplementationOnce(() => value);
  return spy;
}

beforeEach(() => {
  useInspectionStore.setState({ status: "idle", startedAt: null });
  useTimerStore.setState({ status: "idle", startedAt: null, finalTimeMs: null, penalty: "none" });
  useCubeStore.getState().resetCube();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("inspectionStore", () => {
  it("starts idle", () => {
    expect(state().status).toBe("idle");
    expect(state().startedAt).toBeNull();
  });

  it("start() begins the countdown", () => {
    mockNow(1000);
    state().start();
    expect(state().status).toBe("running");
    expect(state().startedAt).toBe(1000);
  });

  it("the countdown starts at 15 seconds", () => {
    mockNow(1000);
    state().start();
    expect(remainingSeconds(state(), 1000)).toBe(15);
  });

  it("remaining time decreases according to timestamps", () => {
    mockNow(1000);
    state().start();
    expect(remainingSeconds(state(), 6000)).toBe(10);
    expect(remainingSeconds(state(), 11000)).toBe(5);
  });

  it("tick() auto-finishes once 15 seconds pass", () => {
    mockNow(1000, 1000 + INSPECTION_DURATION_MS);
    state().start();
    state().tick();
    expect(state().status).toBe("finished");
  });

  it("cannot have two inspections running simultaneously", () => {
    mockNow(1000, 5000);
    state().start();
    state().start();
    expect(state().startedAt).toBe(1000);
  });

  it("cancel() works and returns to idle", () => {
    mockNow(1000);
    state().start();
    state().cancel();
    expect(state()).toMatchObject({ status: "idle", startedAt: null });
  });

  it("restarting (cancel then start) works correctly", () => {
    mockNow(1000);
    state().start();
    state().cancel();
    mockNow(9000);
    state().start();
    expect(state()).toMatchObject({ status: "running", startedAt: 9000 });
  });

  it("a new inspection can start again after finishing", () => {
    mockNow(1000, 1000 + INSPECTION_DURATION_MS, 9000);
    state().start();
    state().tick();
    expect(state().status).toBe("finished");
    state().start();
    expect(state()).toMatchObject({ status: "running", startedAt: 9000 });
  });

  describe("integration with cube and timer stores", () => {
    it("RESET clears the inspection, as the RESET button does", () => {
      mockNow(1000);
      state().start();
      expect(state().status).toBe("running");

      // Same composition ResetButton performs on click.
      useCubeStore.getState().resetCube();
      useInspectionStore.getState().cancel();

      expect(state()).toMatchObject({ status: "idle", startedAt: null });
      expect(useCubeStore.getState().cubeState).toEqual(createSolvedCube());
    });

    it("SCRAMBLE keeps working and clears an in-progress inspection", () => {
      mockNow(1000);
      state().start();

      // Same composition ScrambleBar performs on click.
      useCubeStore.getState().requestScramble();
      useInspectionStore.getState().cancel();

      expect(useCubeStore.getState().scramble).not.toBeNull();
      expect(state().status).toBe("idle");
    });

    it("inspection time is never added to the solve time", () => {
      mockNow(1000, 1000 + INSPECTION_DURATION_MS, 20_000);
      state().start(); // inspection starts at 1000
      state().tick(); // finishes at 16000
      useTimerStore.getState().start(); // solve starts fresh at 20000

      const solveElapsed = elapsedMs(useTimerStore.getState(), 23_500);
      expect(solveElapsed).toBe(3500); // only the solve duration, inspection excluded
    });

    it("the solve timer starts from 0 right after inspection", () => {
      mockNow(1000, 1000 + INSPECTION_DURATION_MS, 20_000);
      state().start();
      state().tick();
      useTimerStore.getState().start();

      expect(elapsedMs(useTimerStore.getState(), 20_000)).toBe(0);
    });

    it("cube moves keep working while an inspection is running", () => {
      mockNow(1000);
      state().start();

      const before = useCubeStore.getState().cubeState;
      useCubeStore.getState().requestMove("R");
      useCubeStore.getState().finishActiveMove();

      expect(useCubeStore.getState().cubeState).not.toEqual(before);
    });
  });
});
