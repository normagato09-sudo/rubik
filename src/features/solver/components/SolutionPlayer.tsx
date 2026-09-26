"use client";

import { useMemo, useRef, useState } from "react";
import { CubeScene } from "@/features/cube/components/CubeScene";
import { applyMove, inverseMove, parseMove, type Move } from "@/features/cube/moves";
import type { CubeState } from "@/features/cube/types";
import { COLOR_NAMES, CENTER_COLORS } from "../facelets";

const ACCENT = "#22d3ee";

const FACE_NAMES_ES: Record<string, string> = {
  U: "Cara de arriba",
  D: "Cara de abajo",
  R: "Cara derecha",
  L: "Cara izquierda",
  F: "Cara de delante",
  B: "Cara de detrás",
};

/** "R'" → "Cara derecha (centro rojo): un cuarto de vuelta en sentido antihorario". */
export function describeMove(move: Move): string {
  const { face, turns } = parseMove(move);
  const turn =
    turns === 2
      ? "media vuelta (da igual el sentido)"
      : `un cuarto de vuelta en sentido ${turns === 1 ? "horario" : "antihorario"}, mirándola de frente`;
  return `${FACE_NAMES_ES[face]} (centro ${COLOR_NAMES[CENTER_COLORS[face]]}): ${turn}.`;
}

/**
 * The solution, and a player to follow it on a real cube one move at a
 * time. `start` is the user's cube built by the features/cube engine
 * (cubeStateForSolution), so each step shows exactly what the physical
 * cube should look like after that move.
 */
export function SolutionPlayer({
  moves,
  start,
  onNewCube,
}: {
  moves: Move[];
  start: CubeState;
  onNewCube: () => void;
}) {
  const states = useMemo(
    () => moves.reduce<CubeState[]>((acc, move) => [...acc, applyMove(acc[acc.length - 1], move)], [start]),
    [moves, start],
  );
  /** How many moves are done. */
  const [step, setStep] = useState(0);
  const [activeMove, setActiveMove] = useState<Move | null>(null);
  const [moveId, setMoveId] = useState(0);
  // Step reached once the animation ends, read back (never through a state
  // updater, which Strict Mode runs twice).
  const targetRef = useRef<number | null>(null);

  const animating = activeMove !== null;
  const finished = step === moves.length;

  const animateTo = (target: number) => {
    if (animating || target < 0 || target > moves.length || target === step) return;
    targetRef.current = target;
    setActiveMove(target > step ? moves[step] : inverseMove(moves[target]));
    setMoveId((id) => id + 1);
  };

  const handleMoveComplete = () => {
    const target = targetRef.current;
    targetRef.current = null;
    setActiveMove(null);
    if (target !== null) setStep(target);
  };

  const jumpTo = (target: number) => {
    if (!animating) setStep(target);
  };

  return (
    <section className="flex flex-col gap-4" aria-labelledby="solucion">
      <div className="flex flex-col gap-2">
        <h2
          id="solucion"
          className="flex items-baseline justify-between text-xs font-semibold tracking-wide text-navy-muted uppercase"
        >
          Solución
          <span className="font-normal normal-case tabular-nums">{moves.length} movimientos</span>
        </h2>
        <p
          className="rounded-2xl border border-l-4 border-navy-border bg-navy-2 px-4 py-4 font-mono text-lg leading-relaxed font-semibold break-words text-foreground"
          style={{ borderLeftColor: ACCENT }}
        >
          {moves.join(" ")}
        </p>
        <p className="text-sm text-navy-muted">
          Hazlos con el centro blanco arriba y el verde delante, sin girar el cubo entero.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-navy-border bg-navy-2 p-3">
        <div className="overflow-hidden rounded-2xl bg-[#0b0b0f]">
          <CubeScene
            cubeState={states[step]}
            activeMove={activeMove}
            moveId={moveId}
            onMoveComplete={handleMoveComplete}
            className="h-52 sm:h-60"
          />
        </div>

        <div className="flex flex-col items-center gap-1 px-1 text-center" aria-live="polite">
          <p className="text-xs font-semibold tracking-wide text-navy-muted uppercase tabular-nums">
            {finished ? "Terminado" : `Paso ${step + 1} de ${moves.length}`}
          </p>
          <p className="font-mono text-5xl font-bold text-foreground">{finished ? "✓" : moves[step]}</p>
          <p className="min-h-10 text-sm text-navy-muted">
            {finished
              ? "Tu cubo debería estar resuelto. Si no, revisa que los colores estuvieran bien copiados."
              : describeMove(moves[step])}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => animateTo(step - 1)}
            disabled={step === 0 || animating}
            className="h-13 rounded-2xl bg-navy-3 text-base font-semibold text-foreground transition-all active:scale-[0.98] disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => animateTo(step + 1)}
            disabled={finished || animating}
            className="h-13 rounded-2xl text-base font-semibold text-navy transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ backgroundColor: ACCENT }}
          >
            Siguiente
          </button>
        </div>
      </div>

      <ol className="grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Pasos de la solución">
        {moves.map((move, index) => {
          const done = index < step;
          const current = index === step;
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => jumpTo(index)}
                aria-current={current ? "step" : undefined}
                aria-label={`Paso ${index + 1}: ${move}${done ? ", hecho" : ""}`}
                className="flex w-full flex-col items-center gap-0.5 rounded-xl border py-2.5 transition-colors"
                style={{
                  borderColor: current ? ACCENT : "var(--navy-border)",
                  backgroundColor: current ? `${ACCENT}26` : "var(--navy-2)",
                  opacity: done ? 0.5 : 1,
                }}
              >
                <span className="text-[11px] font-medium text-navy-muted tabular-nums">
                  {done ? "✓" : String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-xl font-semibold text-foreground">{move}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => jumpTo(0)}
          disabled={step === 0 || animating}
          className="h-12 rounded-2xl bg-navy-2 text-sm font-medium text-foreground hover:bg-navy-3 disabled:opacity-40"
        >
          Volver al paso 1
        </button>
        <button
          type="button"
          onClick={onNewCube}
          className="h-12 rounded-2xl bg-navy-2 text-sm font-medium text-foreground hover:bg-navy-3"
        >
          Resolver otro cubo
        </button>
      </div>
    </section>
  );
}
