"use client";

import { useRef, useState } from "react";
import { CubeScene } from "@/features/cube/components/CubeScene";
import { applyMove } from "@/features/cube/moves";
import type { Move } from "@/features/cube/moves";
import type { CfopStage } from "@/features/trainer/cfop";
import type { CrossCase } from "@/features/trainer/cross-cases";
import { CROSS_CASES, startingStateFor } from "@/features/trainer/cross-cases";

const BUTTON_BASE =
  "min-w-[7rem] flex-1 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none";

/**
 * One case's walkthrough: its own local cube (never `cubeStore`) and its
 * own move pointer. Mounted with `key={kase.id}` by `CrossTrainer`, so
 * moving to the next case is a fresh mount — a natural reset with no
 * imperative "clear the previous case's state" effect needed.
 */
function CaseTrainer({
  kase,
  progress,
  onLearned,
}: {
  kase: CrossCase;
  progress: string;
  onLearned: () => void;
}) {
  const [cubeState, setCubeState] = useState(() => startingStateFor(kase));
  const [activeMove, setActiveMove] = useState<Move | null>(null);
  const [moveId, setMoveId] = useState(0);
  const [moveIndex, setMoveIndex] = useState(0);
  // Which move is animating, read back (not derived from state) once the
  // animation finishes. Deliberately NOT read via `setActiveMove(current =>
  // ...)`: React Strict Mode (on by default in `next dev`) double-invokes
  // updater functions to catch impurities, and this updater's body used to
  // call setCubeState/setMoveIndex as side effects — so every move got
  // applied twice and the move pointer skipped by 2, silently desyncing
  // the cube from the button that was supposed to be next.
  const pendingMoveRef = useRef<Move | null>(null);

  const animating = activeMove !== null;
  const caseSolved = moveIndex >= kase.algorithm.length;
  const currentMove = caseSolved ? null : kase.algorithm[moveIndex];

  function handlePlayMove(move: Move, index: number) {
    if (animating || index !== moveIndex) return;
    pendingMoveRef.current = move;
    setActiveMove(move);
    setMoveId((id) => id + 1);
  }

  function handleMoveComplete() {
    const move = pendingMoveRef.current;
    pendingMoveRef.current = null;
    setActiveMove(null);
    if (move) {
      setCubeState((state) => applyMove(state, move));
      setMoveIndex((i) => i + 1);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{kase.label}</p>
        <p className="text-sm font-semibold tracking-wide text-muted">{progress}</p>
      </div>
      <p className="text-sm leading-relaxed text-muted">{kase.description}</p>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <CubeScene
          cubeState={cubeState}
          activeMove={activeMove}
          moveId={moveId}
          onMoveComplete={handleMoveComplete}
        />
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {caseSolved ? "Caso resuelto" : "Movimiento actual"}
        </p>
        <span className="font-mono text-5xl font-semibold tracking-tight text-foreground">
          {currentMove ?? "✓"}
        </span>
        <div className="flex w-full flex-wrap justify-center gap-3">
          {kase.algorithm.map((move, index) => {
            const done = index < moveIndex;
            const current = index === moveIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => handlePlayMove(move, index)}
                disabled={!current || animating}
                className={`${BUTTON_BASE} min-w-[4rem] flex-none font-mono ${
                  current
                    ? "bg-accent text-accent-foreground hover:opacity-90"
                    : done
                      ? "border border-border text-muted"
                      : "border border-border text-muted opacity-40"
                }`}
              >
                {move}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onLearned}
        disabled={!caseSolved}
        className={`${BUTTON_BASE} w-full bg-accent text-accent-foreground hover:opacity-90`}
      >
        Ya me lo aprendí
      </button>
    </>
  );
}

/**
 * Visual, step-by-step walkthrough of the 4 titled white-cross cases from
 * `features/trainer/cross-cases.ts`. Takes `stage` as a prop rather than
 * hardcoding it so the Cubo → Método → Etapa data keeps driving the copy;
 * F2L/OLL/PLL will get their own screens later.
 */
export function CrossTrainer({ stage }: { stage: CfopStage }) {
  const [caseIndex, setCaseIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const kase = CROSS_CASES[caseIndex];

  function handleLearned() {
    if (caseIndex < CROSS_CASES.length - 1) {
      setCaseIndex((i) => i + 1);
    } else {
      setCompleted(true);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          Entrenamiento · {stage.label}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{stage.label.toUpperCase()}</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          El objetivo del Cross es resolver las cuatro aristas de la cruz
          blanca, alineándolas también con sus centros laterales.
        </p>
      </div>

      {completed ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">
            {CROSS_CASES.length} / {CROSS_CASES.length}
          </p>
          <p className="text-lg font-semibold text-foreground">
            Has visto los {CROSS_CASES.length} casos de Cross.
          </p>
          <p className="max-w-sm text-sm text-muted">
            Practícalos sobre el cubo real hasta reconocerlos sin pensar.
          </p>
        </div>
      ) : (
        <CaseTrainer
          key={kase.id}
          kase={kase}
          progress={`${caseIndex + 1} / ${CROSS_CASES.length}`}
          onLearned={handleLearned}
        />
      )}
    </div>
  );
}
