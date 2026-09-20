import { describe, expect, it } from "vitest";
import {
  INITIAL_INSPECTION_STATE,
  INSPECTION_DURATION_MS,
  cancelInspection,
  finishInspection,
  remainingSeconds,
  startInspection,
  tickInspection,
} from "./inspection";

describe("inspection engine", () => {
  it("starts idle", () => {
    expect(INITIAL_INSPECTION_STATE).toEqual({ status: "idle", startedAt: null });
  });

  it("startInspection begins a running countdown at the given timestamp", () => {
    expect(startInspection(INITIAL_INSPECTION_STATE, 1000)).toEqual({
      status: "running",
      startedAt: 1000,
    });
  });

  it("startInspection is a no-op while already running (no overlapping inspections)", () => {
    const running = startInspection(INITIAL_INSPECTION_STATE, 1000);
    const stillRunning = startInspection(running, 5000);
    expect(stillRunning).toEqual(running);
  });

  it("cancelInspection returns to idle", () => {
    const running = startInspection(INITIAL_INSPECTION_STATE, 1000);
    expect(cancelInspection()).toEqual(INITIAL_INSPECTION_STATE);
    expect(cancelInspection()).not.toBe(running);
  });

  it("finishInspection ends the countdown early", () => {
    const running = startInspection(INITIAL_INSPECTION_STATE, 1000);
    expect(finishInspection(running)).toEqual({ status: "finished", startedAt: null });
  });

  it("finishInspection is a no-op when not running", () => {
    expect(finishInspection(INITIAL_INSPECTION_STATE)).toEqual(INITIAL_INSPECTION_STATE);
  });

  it("tickInspection keeps running before the duration elapses", () => {
    const running = startInspection(INITIAL_INSPECTION_STATE, 1000);
    expect(tickInspection(running, 1000 + INSPECTION_DURATION_MS - 1)).toEqual(running);
  });

  it("tickInspection auto-finishes once the duration elapses", () => {
    const running = startInspection(INITIAL_INSPECTION_STATE, 1000);
    expect(tickInspection(running, 1000 + INSPECTION_DURATION_MS)).toEqual({
      status: "finished",
      startedAt: null,
    });
  });

  it("remainingSeconds counts down 15, 14, ..., 1, 0", () => {
    const running = startInspection(INITIAL_INSPECTION_STATE, 0);
    expect(remainingSeconds(running, 0)).toBe(15);
    expect(remainingSeconds(running, 1000)).toBe(14);
    expect(remainingSeconds(running, 13999)).toBe(2);
    expect(remainingSeconds(running, 14000)).toBe(1);
    expect(remainingSeconds(running, 14999)).toBe(1);
    const finished = tickInspection(running, 15000);
    expect(remainingSeconds(finished, 15000)).toBe(0);
  });

  it("a new inspection can start again after one finishes", () => {
    const running = startInspection(INITIAL_INSPECTION_STATE, 1000);
    const finished = finishInspection(running);
    expect(startInspection(finished, 9000)).toEqual({ status: "running", startedAt: 9000 });
  });

  it("a new inspection can also start again after being cancelled", () => {
    const cancelled = cancelInspection();
    expect(startInspection(cancelled, 9000)).toEqual({ status: "running", startedAt: 9000 });
  });
});
