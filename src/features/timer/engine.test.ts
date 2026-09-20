import { describe, expect, it } from "vitest";
import { elapsedMs, formatTime, resetTimer, startTimer, stopTimer } from "./engine";
import { INITIAL_TIMER_STATE } from "./types";

describe("timer engine", () => {
  it("starts idle with no time", () => {
    expect(INITIAL_TIMER_STATE).toEqual({ status: "idle", startedAt: null, finalTimeMs: null });
    expect(elapsedMs(INITIAL_TIMER_STATE, 1000)).toBe(0);
  });

  it("startTimer moves to running and records the start timestamp", () => {
    const state = startTimer(INITIAL_TIMER_STATE, 1000);
    expect(state).toEqual({ status: "running", startedAt: 1000, finalTimeMs: null });
  });

  it("startTimer is a no-op while already running (no overlapping timers)", () => {
    const running = startTimer(INITIAL_TIMER_STATE, 1000);
    const stillRunning = startTimer(running, 5000);
    expect(stillRunning).toEqual(running);
    expect(stillRunning.startedAt).toBe(1000);
  });

  it("stopTimer freezes the elapsed time and clears startedAt", () => {
    const running = startTimer(INITIAL_TIMER_STATE, 1000);
    const stopped = stopTimer(running, 4500);
    expect(stopped).toEqual({ status: "stopped", startedAt: null, finalTimeMs: 3500 });
  });

  it("stopTimer is a no-op when not running", () => {
    expect(stopTimer(INITIAL_TIMER_STATE, 1000)).toEqual(INITIAL_TIMER_STATE);
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 0), 100);
    expect(stopTimer(stopped, 999)).toEqual(stopped);
  });

  it("resetTimer always returns to the initial state", () => {
    const running = startTimer(INITIAL_TIMER_STATE, 1000);
    const stopped = stopTimer(running, 6000);
    expect(resetTimer()).toEqual(INITIAL_TIMER_STATE);
    expect(resetTimer()).not.toBe(stopped);
  });

  it("elapsedMs grows while running as time passes", () => {
    const running = startTimer(INITIAL_TIMER_STATE, 1000);
    const early = elapsedMs(running, 1500);
    const later = elapsedMs(running, 2500);
    expect(later).toBeGreaterThan(early);
    expect(early).toBe(500);
    expect(later).toBe(1500);
  });

  it("elapsedMs stays exactly at the final time once stopped", () => {
    const running = startTimer(INITIAL_TIMER_STATE, 1000);
    const stopped = stopTimer(running, 3237);
    expect(elapsedMs(stopped, 3237)).toBe(2237);
    expect(elapsedMs(stopped, 999_999)).toBe(2237);
  });

  it("formatTime matches the expected speedcubing format", () => {
    expect(formatTime(0)).toBe("0.00");
    expect(formatTime(12370)).toBe("12.37");
    expect(formatTime(62450)).toBe("1:02.45");
    expect(formatTime(9990)).toBe("9.99");
    expect(formatTime(599990)).toBe("9:59.99");
  });
});
