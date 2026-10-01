"use client";

import { useMemo, useRef, useState } from "react";
import { PyraminxScene } from "@/features/pyraminx/components/PyraminxScene";
import { VERTEX_NAMES } from "@/features/pyraminx/facelets";
import { applyPyraMove, inversePyraMove, parsePyraMove, type PyraColor, type PyraMove } from "@/features/pyraminx/moves";
import { ACCENT } from "./face-guide";

/**
 * "R'" → "Capa de la derecha (la punta, su centro y sus 3 aristas): un
 * tercio de vuelta en sentido antihorario, mirándola desde la punta".
 */
export function describePyraMove(move: PyraMove): string {
  const { vertex, tipOnly, clockwise } = parsePyraMove(move);
  const turn = `un tercio de vuelta en sentido ${clockwise ? "horario" : "antihorario"}, mirándola desde la punta`;
  return tipOnly
    ? `Solo la punta ${VERTEX_NAMES[vertex]}: ${turn}.`
    : `Capa ${VERTEX_NAMES[vertex]} (la punta, su centro y sus 3 aristas): ${turn}.`;
}

/**
 * The Pyraminx solution and a player to follow it one move at a time on
 * the real one. `start` is the painted Pyraminx; each step shows what it
 * should look like after that move.
 */
export function PyraminxSolutionPlayer({
  moves,
  start,
  onNewPuzzle,
}: {
  moves: PyraMove[];
  start: readonly PyraColor[];
  onNewPuzzle: () => void;
}) {
  const states = useMemo(
    () => moves.reduce<PyraColor[][]>((acc, move) => [...acc, applyPyraMove(acc[acc.length - 1], move)], [[...start]]),
    [moves, start],
  );
  const [step, setStep] = useState(0);
  const [activeMove, setActiveMove] = useState<PyraMove | null>(null);
  const [moveId, setMoveId] = useState(0);
  // Step reached once the animation ends, read back (never through a state updater, which Strict Mode runs twice).
  const targetRef = useRef<number | null>(null);

  const animating = activeMove !== null;
  const finished = step === moves.length;
  const tips = moves.filter((move) => parsePyraMove(move).tipOnly).length;

  const animateTo = (target: number) => {
    if (animating || target < 0 || target > moves.length || target === step) return;
    targetRef.current = target;
    setActiveMove(target > step ? moves[step] : inversePyraMove(moves[target]));
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
          Hazlos con el Pyraminx como al copiarlo — una cara hacia ti y una punta arriba —, sin girarlo entero.
          {tips > 0 && " Las letras en minúscula giran solo la punta: por eso van primero."} Es la solución más corta
          posible.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-navy-border bg-navy-2 p-3">
        <div className="overflow-hidden rounded-2xl bg-[#0b0b0f]">
          <PyraminxScene
            state={states[step]}
            activeMove={activeMove}
            moveId={moveId}
            onMoveComplete={handleMoveComplete}
          />
        </div>

        <div className="flex flex-col items-center gap-1 px-1 text-center" aria-live="polite">
          <p className="text-xs font-semibold tracking-wide text-navy-muted uppercase tabular-nums">
            {finished ? "Terminado" : `Paso ${step + 1} de ${moves.length}`}
          </p>
          <p className="font-mono text-5xl font-bold text-foreground">{finished ? "✓" : moves[step]}</p>
          <p className="min-h-10 text-sm text-navy-muted">
            {finished
              ? "Tu Pyraminx debería estar resuelto. Si no, revisa que los colores estuvieran bien copiados."
              : describePyraMove(moves[step])}
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
          onClick={onNewPuzzle}
          className="h-12 rounded-2xl bg-navy-2 text-sm font-medium text-foreground hover:bg-navy-3"
        >
          Resolver otro Pyraminx
        </button>
      </div>
    </section>
  );
}
