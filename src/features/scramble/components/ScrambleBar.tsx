"use client";

import { useCubeStore } from "@/store/cubeStore";

export function ScrambleBar() {
  const scramble = useCubeStore((s) => s.scramble);
  const requestScramble = useCubeStore((s) => s.requestScramble);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={requestScramble}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold tracking-wide text-accent-foreground transition-opacity hover:opacity-90"
        >
          SCRAMBLE
        </button>
        <span className="text-sm text-muted">
          {scramble ? "Pulsa de nuevo para generar otro." : "Genera una mezcla para empezar."}
        </span>
      </div>
      <p
        className="min-w-0 break-words font-mono text-sm leading-relaxed text-foreground"
        aria-live="polite"
      >
        {scramble ? scramble.join(" ") : "—"}
      </p>
    </div>
  );
}
