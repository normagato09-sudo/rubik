"use client";

import { useEffect, useState } from "react";
import { useInspectionStore } from "@/store/inspectionStore";
import { useTimerStore } from "@/store/timerStore";
import { remainingSeconds } from "../inspection";

const BUTTON_BASE =
  "min-w-[7rem] flex-1 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none";

/**
 * Countdown before a solve. Deliberately its own widget (not merged into
 * Timer.tsx): inspection and the solve clock are conceptually separate
 * pieces of state (separate stores, never share a startedAt), and this
 * keeps Timer.tsx's already-working start/stop logic untouched.
 */
export function InspectionPanel() {
  const status = useInspectionStore((s) => s.status);
  const startedAt = useInspectionStore((s) => s.startedAt);
  const start = useInspectionStore((s) => s.start);
  const cancel = useInspectionStore((s) => s.cancel);
  const finishEarly = useInspectionStore((s) => s.finishEarly);
  const tick = useInspectionStore((s) => s.tick);

  const solveStatus = useTimerStore((s) => s.status);
  const startSolve = useTimerStore((s) => s.start);

  const [now, setNow] = useState(0);

  useEffect(() => {
    if (status !== "running") return;
    let frame: number;
    const loop = () => {
      setNow(performance.now());
      tick();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [status, tick]);

  const seconds = remainingSeconds({ status, startedAt }, now);
  const solveInProgress = solveStatus === "running";

  function handleStartSolve() {
    finishEarly();
    startSolve();
  }

  if (status === "running") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-4">
        <span
          className="font-mono text-5xl font-semibold tabular-nums tracking-tight text-foreground sm:text-6xl"
          aria-live="polite"
        >
          {seconds}
        </span>
        <div className="flex w-full flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={cancel}
            className={`${BUTTON_BASE} border border-border text-foreground hover:bg-border/60`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleStartSolve}
            className={`${BUTTON_BASE} bg-accent text-accent-foreground hover:opacity-90`}
          >
            Empezar a resolver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-muted">
        {status === "finished"
          ? "Inspección terminada. Pulsa Iniciar en el cronómetro cuando quieras."
          : "Inspecciona el cubo 15 segundos antes de resolver (opcional)."}
      </p>
      <button
        type="button"
        onClick={start}
        disabled={solveInProgress}
        className={`${BUTTON_BASE} border border-border text-foreground hover:bg-border/60`}
      >
        {status === "finished" ? "Repetir inspección" : "Iniciar inspección"}
      </button>
    </div>
  );
}
