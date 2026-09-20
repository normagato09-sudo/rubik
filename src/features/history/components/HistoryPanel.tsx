"use client";

import { formatTime } from "@/features/timer/engine";
import { useHistoryStore } from "@/store/historyStore";
import { resultTimeMs } from "../engine";

export function HistoryPanel() {
  const entries = useHistoryStore((s) => s.entries);
  const clear = useHistoryStore((s) => s.clear);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Historial <span className="font-normal text-muted">({entries.length})</span>
        </h2>
        <button
          type="button"
          onClick={clear}
          disabled={entries.length === 0}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Limpiar historial
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay resoluciones en esta sesión.</p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {entries.map((entry, index) => {
            const position = entries.length - index;
            const dnf = entry.penalty === "dnf";
            const penalized = entry.penalty === "plus2";

            return (
              <li
                key={entry.id}
                className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex shrink-0 items-baseline gap-3">
                  <span className="w-7 text-xs font-medium text-muted">#{position}</span>
                  <span
                    className={`font-mono text-lg font-semibold tabular-nums ${
                      dnf ? "text-cube-red" : penalized ? "text-cube-orange" : "text-foreground"
                    }`}
                  >
                    {dnf ? "DNF" : formatTime(resultTimeMs(entry))}
                    {penalized && <span className="ml-1 text-xs font-semibold">+2</span>}
                  </span>
                </div>
                <span className="min-w-0 break-words font-mono text-xs text-muted">
                  {entry.scramble.length > 0 ? entry.scramble.join(" ") : "Sin scramble"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
