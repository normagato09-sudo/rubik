/**
 * Session statistics: pure functions over `HistoryEntry[]`, no React,
 * Zustand or Three.js. Same rules everywhere — a valid result is
 * `resultTimeMs(entry)` (base time, +2 already applied) and DNF is
 * always excluded from anything numeric, never coerced into a time.
 */
import { resultTimeMs } from "@/features/history/engine";
import type { HistoryEntry } from "@/features/history/types";
import { calculateAo5 } from "./ao5";
import type { EvolutionPoint, StatsSummary } from "./types";

function validResults(entries: HistoryEntry[]): number[] {
  return entries.filter((entry) => entry.penalty !== "dnf").map(resultTimeMs);
}

/** Fastest valid result. Null if every solve is DNF (or there are none). */
export function calculateBestSolve(entries: HistoryEntry[]): number | null {
  const results = validResults(entries);
  return results.length === 0 ? null : Math.min(...results);
}

/** Mean of every valid result. Null if every solve is DNF (or there are none). */
export function calculateAverage(entries: HistoryEntry[]): number | null {
  const results = validResults(entries);
  if (results.length === 0) return null;
  return results.reduce((sum, value) => sum + value, 0) / results.length;
}

/** Sum of every valid result. Null if every solve is DNF (or there are none). */
export function calculateTotalTime(entries: HistoryEntry[]): number | null {
  const results = validResults(entries);
  return results.length === 0 ? null : results.reduce((sum, value) => sum + value, 0);
}

/** Share of solves that are DNF, as 0-100. Null with no solves at all. */
export function calculateDnfPercentage(entries: HistoryEntry[]): number | null {
  if (entries.length === 0) return null;
  const dnfCount = entries.filter((entry) => entry.penalty === "dnf").length;
  return (dnfCount / entries.length) * 100;
}

/**
 * Best Ao5 anywhere in the history: reuses `calculateAo5` (the exact
 * same rules as the live Ao5 in /practice) over every consecutive
 * 5-solve window — "the Ao5 as it would have read right after each
 * solve" — and keeps the lowest numeric one. Never a second, parallel
 * implementation of the Ao5 rules.
 */
export function calculateBestAo5(entries: HistoryEntry[]): number | null {
  let best: number | null = null;
  for (let start = 0; start + 5 <= entries.length; start++) {
    const result = calculateAo5(entries.slice(start, start + 5));
    if (result.kind === "timeMs" && (best === null || result.timeMs < best)) {
      best = result.timeMs;
    }
  }
  return best;
}

export function calculateStats(entries: HistoryEntry[]): StatsSummary {
  return {
    totalSolves: entries.length,
    bestSolveMs: calculateBestSolve(entries),
    averageMs: calculateAverage(entries),
    bestAo5Ms: calculateBestAo5(entries),
    plus2Count: entries.filter((entry) => entry.penalty === "plus2").length,
    dnfCount: entries.filter((entry) => entry.penalty === "dnf").length,
    dnfPercentage: calculateDnfPercentage(entries),
    totalTimeMs: calculateTotalTime(entries),
  };
}

/**
 * `entries` (newest-first, as `historyStore` stores them) reversed into
 * chronological order, one point per solve, ready to plot as-is.
 */
export function calculateEvolution(entries: HistoryEntry[]): EvolutionPoint[] {
  const chronological = [...entries].reverse();
  return chronological.map((entry, i) => ({
    id: entry.id,
    index: i + 1,
    value: entry.penalty === "dnf" ? ("dnf" as const) : resultTimeMs(entry),
  }));
}
