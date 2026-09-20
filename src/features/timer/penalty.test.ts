import { describe, expect, it } from "vitest";
import { elapsedMs, startTimer, stopTimer } from "./engine";
import { applyPlus2, canApplyDnf, canApplyPlus2, markDnf } from "./penalty";
import { INITIAL_TIMER_STATE } from "./types";

describe("penalty engine (+2)", () => {
  it("cannot be applied before a solve exists", () => {
    expect(canApplyPlus2(INITIAL_TIMER_STATE)).toBe(false);
    expect(applyPlus2(INITIAL_TIMER_STATE)).toEqual(INITIAL_TIMER_STATE);
  });

  it("cannot be applied while a solve is running", () => {
    const running = startTimer(INITIAL_TIMER_STATE, 1000);
    expect(canApplyPlus2(running)).toBe(false);
    expect(applyPlus2(running)).toEqual(running);
  });

  it("can be applied to a finished solve", () => {
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 1000), 13_340);
    expect(canApplyPlus2(stopped)).toBe(true);
    expect(applyPlus2(stopped)).toEqual({ ...stopped, penalty: "plus2" });
  });

  it("increases the displayed time by exactly 2000ms", () => {
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 0), 12_340); // 12.34s
    const penalized = applyPlus2(stopped);
    expect(elapsedMs(stopped, 999_999)).toBe(12_340);
    expect(elapsedMs(penalized, 999_999)).toBe(14_340); // 14.34s
  });

  it("preserves the base time internally", () => {
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 0), 12_340);
    const penalized = applyPlus2(stopped);
    expect(penalized.finalTimeMs).toBe(12_340);
    expect(penalized.penalty).toBe("plus2");
  });

  it("cannot be applied twice to the same solve", () => {
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 0), 12_340);
    const penalizedOnce = applyPlus2(stopped);
    const penalizedTwice = applyPlus2(penalizedOnce);
    expect(penalizedTwice).toEqual(penalizedOnce);
    expect(elapsedMs(penalizedTwice, 999_999)).toBe(14_340); // still +2, never +4
  });

  it("a new solve starts without any previous penalty", () => {
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 0), 12_340);
    const penalized = applyPlus2(stopped);
    const newRun = startTimer(penalized, 20_000);
    expect(newRun.penalty).toBe("none");
  });
});

describe("DNF", () => {
  it("cannot be applied before a solve exists", () => {
    expect(canApplyDnf(INITIAL_TIMER_STATE)).toBe(false);
    expect(markDnf(INITIAL_TIMER_STATE)).toEqual(INITIAL_TIMER_STATE);
  });

  it("cannot be applied while a solve is running", () => {
    const running = startTimer(INITIAL_TIMER_STATE, 1000);
    expect(canApplyDnf(running)).toBe(false);
    expect(markDnf(running)).toEqual(running);
  });

  it("can be applied to a finished solve", () => {
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 1000), 13_340);
    expect(canApplyDnf(stopped)).toBe(true);
    expect(markDnf(stopped)).toEqual({ ...stopped, penalty: "dnf" });
  });

  it("cannot be applied twice to the same solve", () => {
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 1000), 13_340);
    const dnfOnce = markDnf(stopped);
    const dnfTwice = markDnf(dnfOnce);
    expect(dnfTwice).toEqual(dnfOnce);
  });

  it("a solve with +2 can become DNF, and DNF wins as the final result", () => {
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 1000), 13_340);
    const penalized = applyPlus2(stopped);
    const dnf = markDnf(penalized);
    expect(dnf.penalty).toBe("dnf");
    expect(dnf.finalTimeMs).toBe(penalized.finalTimeMs); // raw time preserved either way
  });

  it("once DNF, +2 can no longer be applied", () => {
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 1000), 13_340);
    const dnf = markDnf(stopped);
    expect(canApplyPlus2(dnf)).toBe(false);
    expect(applyPlus2(dnf)).toEqual(dnf);
  });

  it("a new solve starts without any previous DNF", () => {
    const stopped = stopTimer(startTimer(INITIAL_TIMER_STATE, 0), 12_340);
    const dnf = markDnf(stopped);
    const newRun = startTimer(dnf, 20_000);
    expect(newRun.penalty).toBe("none");
  });
});
