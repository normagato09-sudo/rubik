/**
 * Solve history: pure functions, no React/Three.js/Zustand. Entries are
 * only ever added, penalty-updated (when +2/DNF is applied to the solve
 * that was just recorded) or cleared — never mutated in place — so the
 * whole list is trivial to reason about and to test.
 */
import type { Penalty } from "@/features/timer/types";
import type { HistoryEntry } from "./types";

/** Prepends a new entry so the most recent solve is always first. */
export function addEntry(entries: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...entries];
}

/**
 * Updates the penalty of one entry (+2 or DNF applied after it was
 * recorded). Every other field, including `baseTimeMs`, is left exactly
 * as it was. A no-op if the id isn't found.
 */
export function updateEntryPenalty(
  entries: HistoryEntry[],
  id: string,
  penalty: Penalty,
): HistoryEntry[] {
  return entries.map((entry) => (entry.id === id ? { ...entry, penalty } : entry));
}

export function clearHistory(): HistoryEntry[] {
  return [];
}

/** The result to show/use for an entry: the raw time plus any +2, ignored for DNF. */
export function resultTimeMs(entry: HistoryEntry): number {
  return entry.penalty === "plus2" ? entry.baseTimeMs + 2000 : entry.baseTimeMs;
}
