"use client";

import { useCubeStore } from "@/store/cubeStore";
import { useInspectionStore } from "@/store/inspectionStore";
import { useTimerStore } from "@/store/timerStore";

export function ResetButton() {
  const resetCube = useCubeStore((s) => s.resetCube);
  const cancelInspection = useInspectionStore((s) => s.cancel);
  const resetTimer = useTimerStore((s) => s.reset);

  function handleReset() {
    resetCube();
    // A reset cube invalidates whatever was being inspected...
    cancelInspection();
    // ...and any finished time (and its +2, if any) from the previous solve.
    resetTimer();
  }

  return (
    <div className="flex items-center justify-center rounded-xl border border-border bg-surface p-4">
      <button
        type="button"
        onClick={handleReset}
        className="w-full rounded-full border border-border px-6 py-2.5 text-sm font-semibold tracking-wide text-foreground transition-colors hover:bg-border/60 sm:w-auto"
      >
        RESET
      </button>
    </div>
  );
}
