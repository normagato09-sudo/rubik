"use client";

import { useCubeStore } from "@/store/cubeStore";

export function ResetButton() {
  const resetCube = useCubeStore((s) => s.resetCube);

  return (
    <div className="flex items-center justify-center rounded-xl border border-border bg-surface p-4">
      <button
        type="button"
        onClick={resetCube}
        className="w-full rounded-full border border-border px-6 py-2.5 text-sm font-semibold tracking-wide text-foreground transition-colors hover:bg-border/60 sm:w-auto"
      >
        RESET
      </button>
    </div>
  );
}
