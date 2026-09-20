"use client";

import { useEffect, useState } from "react";
import { useInspectionStore } from "@/store/inspectionStore";
import { useTimerStore } from "@/store/timerStore";
import { elapsedMs, formatTime } from "../engine";

const BUTTON_BASE =
  "min-w-[7rem] flex-1 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none";

export function Timer() {
  const status = useTimerStore((s) => s.status);
  const startedAt = useTimerStore((s) => s.startedAt);
  const finalTimeMs = useTimerStore((s) => s.finalTimeMs);
  const start = useTimerStore((s) => s.start);
  const stop = useTimerStore((s) => s.stop);
  const reset = useTimerStore((s) => s.reset);
  const inspectionStatus = useInspectionStore((s) => s.status);
  const inspecting = inspectionStatus === "running";

  // Ticks each frame while running so the display updates smoothly; the
  // actual elapsed time is always derived from this timestamp, not a
  // counter, so it never drifts. Reading the clock happens inside the
  // effect (not during render), which is the only pure way to do it.
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (status !== "running") return;
    let frame: number;
    const loop = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [status]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || event.repeat) return;
      event.preventDefault();
      if (status === "running") {
        stop();
        return;
      }
      // While inspecting, solving must start from the inspection panel's
      // own button, so finishing the countdown is never skipped by accident.
      if (inspecting) return;
      start();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, inspecting, start, stop]);

  const ms = elapsedMs({ status, startedAt, finalTimeMs }, now);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-4">
      <span className="font-mono text-5xl font-semibold tabular-nums tracking-tight text-foreground sm:text-6xl">
        {formatTime(ms)}
      </span>
      <div className="flex w-full flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={start}
          disabled={status === "running" || inspecting}
          className={`${BUTTON_BASE} bg-accent text-accent-foreground hover:opacity-90`}
        >
          Iniciar
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={status !== "running"}
          className={`${BUTTON_BASE} border border-border text-foreground hover:bg-border/60`}
        >
          Detener
        </button>
        <button
          type="button"
          onClick={reset}
          className={`${BUTTON_BASE} border border-border text-foreground hover:bg-border/60`}
        >
          Reiniciar
        </button>
      </div>
      <p className="text-xs text-muted">Espacio para iniciar/detener.</p>
    </div>
  );
}
