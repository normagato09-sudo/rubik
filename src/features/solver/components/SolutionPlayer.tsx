"use client";

import { useMemo, useRef, useState } from "react";
import { CubeScene } from "@/features/cube/components/CubeScene";
import { applyMove, inverseMove, isRotation, parseMove, type Move } from "@/features/cube/moves";
import type { CubeSize, CubeState } from "@/features/cube/types";
import type { SolutionStep } from "@/features/solver2x2/methods";
import type { FaceName } from "../cubie";
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

/** Whole-cube rotations: which face turn each copies, and what it brings where. */
const ROTATION_ES: Record<string, { like: string; forward: string; back: string }> = {
  x: { like: "R", forward: "la cara de delante pasa arriba", back: "la cara de delante pasa abajo" },
  y: { like: "U", forward: "la cara de la derecha pasa delante", back: "la cara de la izquierda pasa delante" },
  z: { like: "F", forward: "la cara de arriba pasa a la derecha", back: "la cara de arriba pasa a la izquierda" },
};

/**
 * "R'" → "Cara derecha (centro rojo): un cuarto de vuelta en sentido
 * antihorario". A 2×2 has no centers, so there the color is left out; x, y
 * and z turn the whole cube.
 */
export function describeMove(move: Move, size: CubeSize = 3): string {
  const { face, turns } = parseMove(move);
  if (isRotation(move)) {
    const { like, forward, back } = ROTATION_ES[face];
    if (turns === 2) return `Gira el cubo entero media vuelta, como si hicieras ${like}2 con todo el cubo.`;
    return `Gira el cubo entero como si hicieras ${turns === 1 ? like : `${like}'`} con todo el cubo: ${turns === 1 ? forward : back}.`;
  }
  const turn =
    turns === 2
      ? "media vuelta (da igual el sentido)"
      : `un cuarto de vuelta en sentido ${turns === 1 ? "horario" : "antihorario"}, mirándola de frente`;
  if (size === 2) return `${FACE_NAMES_ES[face]}: ${turn}.`;
  return `${FACE_NAMES_ES[face]} (centro ${COLOR_NAMES[CENTER_COLORS[face as FaceName]]}): ${turn}.`;
}

const stepHeading = (step: SolutionStep) => (step.caseName ? `${step.title} – ${step.caseName}` : step.title);

/**
 * The solution, and a player to follow it on a real cube one move at a
 * time. `start` is the user's cube built by the features/cube engine
 * (cubeStateForSolution / cubeStateForSolution2), so each step shows
 * exactly what the physical cube should look like after that move. With
 * `steps` (the 2×2 methods), moves are grouped under each named step and
 * its explanation.
 */
export function SolutionPlayer({
  moves,
  start,
  onNewCube,
  size = 3,
  steps,
  note = "Hazlos con el centro blanco arriba y el verde delante, sin girar el cubo entero.",
}: {
  moves: Move[];
  start: CubeState;
  onNewCube: () => void;
  size?: CubeSize;
  steps?: SolutionStep[];
  note?: string;
}) {
  const states = useMemo(
    () => moves.reduce<CubeState[]>((acc, move) => [...acc, applyMove(acc[acc.length - 1], move)], [start]),
    [moves, start],
  );
  /** For each move, the index of its step (and where each step starts). */
  const groups = useMemo(
    () =>
      (steps ?? []).reduce<{ group: SolutionStep; first: number; last: number }[]>((ranges, group) => {
        const first = ranges.at(-1)?.last ?? 0;
        return [...ranges, { group, first, last: first + group.moves.length }];
      }, []),
    [steps],
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
  const turns = moves.filter((move) => !isRotation(move)).length;
  // The named step the next move belongs to (the last one once finished).
  const current = finished
    ? groups.at(-1)
    : groups.find(({ first, last }) => step >= first && step < last);

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

  const moveButton = (move: Move, index: number) => {
    const done = index < step;
    const isCurrent = index === step;
    return (
      <li key={index}>
        <button
          type="button"
          onClick={() => jumpTo(index)}
          aria-current={isCurrent ? "step" : undefined}
          aria-label={`Paso ${index + 1}: ${move}${done ? ", hecho" : ""}`}
          className="flex w-full flex-col items-center gap-0.5 rounded-xl border py-2.5 transition-colors"
          style={{
            borderColor: isCurrent ? ACCENT : "var(--navy-border)",
            backgroundColor: isCurrent ? `${ACCENT}26` : "var(--navy-2)",
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
  };

  return (
    <section className="flex flex-col gap-4" aria-labelledby="solucion">
      <div className="flex flex-col gap-2">
        <h2
          id="solucion"
          className="flex items-baseline justify-between text-xs font-semibold tracking-wide text-navy-muted uppercase"
        >
          Solución
          <span className="font-normal normal-case tabular-nums">
            {turns} movimientos
            {turns !== moves.length ? ` + ${moves.length - turns} giro${moves.length - turns > 1 ? "s" : ""} del cubo` : ""}
          </span>
        </h2>
        {steps ? (
          <div
            className="flex flex-col gap-1.5 rounded-2xl border border-l-4 border-navy-border bg-navy-2 px-4 py-3"
            style={{ borderLeftColor: ACCENT }}
          >
            {steps.map((group) => (
              <p key={group.title} className="text-sm text-navy-muted">
                <span className="font-semibold text-foreground">{group.title}:</span>{" "}
                <span className="font-mono text-base font-semibold break-words text-foreground">
                  {group.moves.length ? group.moves.join(" ") : "—"}
                </span>
              </p>
            ))}
          </div>
        ) : (
          <p
            className="rounded-2xl border border-l-4 border-navy-border bg-navy-2 px-4 py-4 font-mono text-lg leading-relaxed font-semibold break-words text-foreground"
            style={{ borderLeftColor: ACCENT }}
          >
            {moves.join(" ")}
          </p>
        )}
        <p className="text-sm text-navy-muted">{note}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-navy-border bg-navy-2 p-3">
        <div className="overflow-hidden rounded-2xl bg-[#0b0b0f]">
          <CubeScene
            cubeState={states[step]}
            activeMove={activeMove}
            moveId={moveId}
            onMoveComplete={handleMoveComplete}
            className="h-52 sm:h-60"
            size={size}
          />
        </div>

        {current && (
          <div className="rounded-2xl bg-navy-3 px-3 py-2.5 text-sm" aria-live="polite">
            <p className="font-semibold text-foreground">{stepHeading(current.group)}</p>
            <p className="text-navy-muted">{current.group.explanation}</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-1 px-1 text-center" aria-live="polite">
          <p className="text-xs font-semibold tracking-wide text-navy-muted uppercase tabular-nums">
            {finished ? "Terminado" : `${steps ? "Movimiento" : "Paso"} ${step + 1} de ${moves.length}`}
          </p>
          <p className="font-mono text-5xl font-bold text-foreground">{finished ? "✓" : moves[step]}</p>
          <p className="min-h-10 text-sm text-navy-muted">
            {finished
              ? "Tu cubo debería estar resuelto. Si no, revisa que los colores estuvieran bien copiados."
              : describeMove(moves[step], size)}
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

      {steps ? (
        <div className="flex flex-col gap-4" aria-label="Pasos de la solución">
          {groups.map(({ group, first }) => (
            <div key={group.title} className="flex flex-col gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{stepHeading(group)}</h3>
                  <p className="text-xs text-navy-muted">{group.explanation}</p>
                </div>
                {group.moves.length > 0 ? (
                  <ol className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {group.moves.map((move, i) => moveButton(move, first + i))}
                  </ol>
                ) : (
                  <p className="rounded-xl border border-dashed border-navy-border px-3 py-2 text-xs text-navy-muted">
                    Sin movimientos en este paso.
                  </p>
                )}
            </div>
          ))}
        </div>
      ) : (
        <ol className="grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Pasos de la solución">
          {moves.map(moveButton)}
        </ol>
      )}

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
