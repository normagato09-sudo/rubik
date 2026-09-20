/**
 * Timer state machine: pure functions, no React/Three.js, no `setInterval`.
 * Every transition takes the current timestamp as a parameter instead of
 * reading the clock itself, so elapsed time is always a plain subtraction
 * between two timestamps (no accumulation error) and the whole module is
 * trivial to test with made-up numbers instead of real waits.
 */
import { INITIAL_TIMER_STATE } from "./types";
import type { TimerState } from "./types";

/** Starts a run. A no-op if already running, so two starts never overlap. */
export function startTimer(state: TimerState, now: number): TimerState {
  if (state.status === "running") return state;
  return { status: "running", startedAt: now, finalTimeMs: null };
}

/** Stops the current run, freezing its elapsed time. A no-op if not running. */
export function stopTimer(state: TimerState, now: number): TimerState {
  if (state.status !== "running" || state.startedAt === null) return state;
  return { status: "stopped", startedAt: null, finalTimeMs: now - state.startedAt };
}

/** Clears any run in progress and any finished time. */
export function resetTimer(): TimerState {
  return INITIAL_TIMER_STATE;
}

/** Elapsed ms to display for `state` at time `now`. */
export function elapsedMs(state: TimerState, now: number): number {
  if (state.status === "running" && state.startedAt !== null) {
    return now - state.startedAt;
  }
  if (state.status === "stopped" && state.finalTimeMs !== null) {
    return state.finalTimeMs;
  }
  return 0;
}

/**
 * Formats milliseconds the way speedcubers expect: centisecond precision,
 * minutes shown only once the time reaches a minute. E.g. 0 -> "0.00",
 * 12370 -> "12.37", 62450 -> "1:02.45".
 */
export function formatTime(ms: number): string {
  const totalCentiseconds = Math.floor(Math.max(0, ms) / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const pad2 = (n: number) => n.toString().padStart(2, "0");

  if (minutes > 0) {
    return `${minutes}:${pad2(seconds)}.${pad2(centiseconds)}`;
  }
  return `${seconds}.${pad2(centiseconds)}`;
}
