"use client";

import { useMemo } from "react";
import { useHistoryStore } from "@/store/historyStore";
import { calculateAo5, formatAo5 } from "../ao5";

/**
 * Just the Ao5 number — not a stats panel. It has no state of its own:
 * it recomputes from the real history on every render, so a new solve or
 * a +2/DNF change on the latest one is reflected automatically.
 */
export function Ao5Display() {
  const entries = useHistoryStore((s) => s.entries);
  const result = useMemo(() => calculateAo5(entries), [entries]);

  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
      <span className="text-sm font-medium text-muted">Ao5</span>
      <span
        className={`font-mono text-lg font-semibold tabular-nums ${
          result.kind === "dnf" ? "text-cube-red" : "text-foreground"
        }`}
      >
        {formatAo5(result)}
      </span>
    </div>
  );
}
