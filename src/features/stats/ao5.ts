/**
 * Ao5 (average of 5): pure function over `HistoryEntry[]`, no React,
 * Zustand or Three.js. Deliberately not its own store or counter — it
 * has no state of its own, it just reads the real history on every call
 * and derives a result, so it's automatically correct whenever the
 * history changes (a new solve, or +2/DNF applied to the latest one).
 */
import { resultTimeMs } from "@/features/history/engine";
import type { HistoryEntry } from "@/features/history/types";
import { formatTime } from "@/features/timer/engine";

export type Ao5Result =
  | { kind: "notEnoughSolves" }
  | { kind: "dnf" }
  | { kind: "timeMs"; timeMs: number };

/**
 * Computes the Ao5 from the 5 most recent solves in `entries` (assumed
 * newest-first, matching how `historyStore` already orders them — no
 * re-sorting by recency happens here). Never mutates `entries` or any
 * entry in it: everything below reads from copies (`slice`, `map`,
 * `[...].sort`).
 */
export function calculateAo5(entries: HistoryEntry[]): Ao5Result {
  if (entries.length < 5) return { kind: "notEnoughSolves" };

  const last5 = entries.slice(0, 5);
  const values: Array<number | "dnf"> = last5.map((entry) =>
    entry.penalty === "dnf" ? "dnf" : resultTimeMs(entry),
  );

  const dnfCount = values.filter((value) => value === "dnf").length;
  if (dnfCount >= 2) return { kind: "dnf" };

  const numeric = values.filter((value): value is number => value !== "dnf");
  const sorted = [...numeric].sort((a, b) => a - b);

  // A lone DNF already counts as the worst result, so only the best
  // (smallest, at the front) still needs to be dropped. With no DNF,
  // both the best and the worst (front and back) are dropped.
  const trimmed = dnfCount === 1 ? sorted.slice(1) : sorted.slice(1, -1);

  const timeMs = trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
  return { kind: "timeMs", timeMs };
}

/** "—" / "DNF" / a formatted time, ready to show next to an "Ao5" label. */
export function formatAo5(result: Ao5Result): string {
  if (result.kind === "notEnoughSolves") return "—";
  if (result.kind === "dnf") return "DNF";
  return formatTime(result.timeMs);
}
