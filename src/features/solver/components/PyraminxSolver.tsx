"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import {
  PYRA_FACE_LABELS,
  emptyPyraFacelets,
  pyraColorCounts,
  turnPyraFace,
  validatePyraFacelets,
  type PyraFacelets,
  type PyraValidation,
  type TurnedPyraFace,
} from "@/features/pyraminx/facelets";
import type { PyraFace } from "@/features/pyraminx/geometry";
import { PYRA_COLORS, applyPyraMoves, isSolvedPyraminx, type PyraColor, type PyraMove } from "@/features/pyraminx/moves";
import { PYRA_FACE_ORDER } from "@/features/pyraminx/scan";
import { ACCENT, ColorPalette, OK_GREEN } from "./face-guide";
import { PYRA_FACE_HINTS, PyraFaceEditor, PyraFaceThumb, pyraStickerLabel } from "./pyraminx-face";
import { PyraminxCamera } from "./PyraminxCamera";
import { PyraminxSolutionPlayer } from "./PyraminxSolutionPlayer";

const faceOffset = (face: PyraFace) => ["F", "L", "R", "D"].indexOf(face) * 9;

const turnLabel = ({ turns }: TurnedPyraFace) => (turns === 1 ? "un tercio de vuelta" : "dos tercios de vuelta");

type Result =
  | { kind: "idle" }
  | { kind: "solving" }
  | { kind: "error"; message: string }
  | { kind: "already-solved" }
  | { kind: "solved"; id: number; moves: PyraMove[]; start: PyraColor[] };

/**
 * The solver for the Pyraminx: its 36 stickers painted face by face (or
 * read with the camera), checked live, and solved in the shared worker.
 * The stickers live in the solver screen, so switching cubes keeps them.
 */
export function PyraminxSolver({
  mode,
  facelets,
  onChange,
  fromCamera,
  onScanned,
  solve,
  ready,
}: {
  mode: "manual" | "camera";
  facelets: PyraFacelets;
  onChange: (next: PyraFacelets) => void;
  fromCamera: boolean;
  onScanned: (next: PyraFacelets) => void;
  solve: (facelets: PyraColor[]) => Promise<string[]>;
  ready: boolean;
}) {
  const [face, setFace] = useState<PyraFace>("F");
  const [brush, setBrush] = useState<PyraColor | null>("green");
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [confirmReset, setConfirmReset] = useState(false);
  // Bumped on every edit: a solution that arrives for older stickers is dropped.
  const run = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const validation = useMemo(() => validatePyraFacelets(facelets), [facelets]);
  const counts = pyraColorCounts(facelets);
  const painted = facelets.filter((sticker) => sticker !== null).length;
  const problemStickers = new Set(validation.kind === "valid" ? [] : validation.issues.flatMap((issue) => issue.stickers));

  useEffect(() => {
    if (result.kind !== "idle" && result.kind !== "solving") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result.kind]);

  if (mode === "camera") {
    return (
      <PyraminxCamera
        onDone={(next) => {
          run.current++;
          setFace("F");
          setResult({ kind: "idle" });
          onScanned(next);
        }}
      />
    );
  }

  const edit = (next: PyraFacelets) => {
    run.current++;
    onChange(next);
    setResult({ kind: "idle" });
    setConfirmReset(false);
  };

  const paint = (n: number) => {
    const index = faceOffset(face) + n;
    edit(facelets.map((color, i) => (i === index ? brush : color)));
  };

  const clearAll = () => {
    edit(emptyPyraFacelets());
    setFace("F");
    setBrush("green");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Clearing a whole Pyraminx by accident hurts: ask for a second tap. */
  const reset = () => {
    if (painted > 4 && !confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    clearAll();
  };

  const handleSolve = async () => {
    if (validation.kind !== "valid") return;
    const id = ++run.current;
    if (validation.solved) {
      setResult({ kind: "already-solved" });
      return;
    }
    setResult({ kind: "solving" });
    const colors = validation.facelets;
    let moves: PyraMove[];
    try {
      moves = (await solve(colors)) as PyraMove[];
    } catch {
      // The input was already validated, so this is the solver itself failing: never show its technical message.
      if (run.current === id) {
        setResult({ kind: "error", message: "No se ha podido calcular la solución. Vuelve a pulsar Resolver para intentarlo de nuevo." });
      }
      return;
    }
    if (run.current !== id) return;
    // Replayed on the exact stickers painted: only moves that really solve this Pyraminx are shown.
    setResult(
      isSolvedPyraminx(applyPyraMoves(colors, moves))
        ? { kind: "solved", id, moves, start: colors }
        : { kind: "error", message: "La solución calculada no ha superado la comprobación. Vuelve a pulsar Resolver." },
    );
  };

  const faceIndex = PYRA_FACE_ORDER.indexOf(face);
  const faceStickers = facelets.slice(faceOffset(face), faceOffset(face) + 9);
  const faceMissing = faceStickers.filter((color) => color === null).length;

  return (
    <>
      {fromCamera && (
        <p
          className="rounded-2xl border px-4 py-3 text-sm text-foreground"
          style={{ borderColor: `${ACCENT}66`, backgroundColor: `${ACCENT}14` }}
          role="status"
        >
          Colores leídos con la cámara. Mira el aviso de abajo y corrige aquí lo que haga falta antes de pulsar Resolver.
        </p>
      )}

      <div className="flex gap-3 rounded-2xl border border-navy-border bg-navy-2 px-4 py-3 text-sm">
        <svg viewBox="0 0 32 28" className="mt-0.5 h-8 w-8 shrink-0" aria-hidden>
          <polygon points="16,1 1,27 31,27" fill="var(--cube-green)" stroke="var(--navy)" strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
        <p className="text-foreground">
          <span className="font-semibold">Sujeta el Pyraminx con una cara apoyada abajo, una punta arriba y una cara hacia ti.</span>{" "}
          <span className="text-navy-muted">
            Da igual qué colores queden dónde: los centros (las piezas de tres colores bajo cada punta) dicen el color de
            cada cara. Copia las cuatro caras como se indica en cada una; las puntas y los centros también se pintan.
          </span>
        </p>
      </div>

      {/* The four faces; tapping one opens it below. */}
      <div className="grid grid-cols-4 gap-2 rounded-3xl border border-navy-border bg-navy-2 p-3" role="group" aria-label="Caras del Pyraminx">
        {PYRA_FACE_ORDER.map((name) => {
          const selected = name === face;
          const offset = faceOffset(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => setFace(name)}
              aria-pressed={selected}
              aria-label={`Editar cara ${PYRA_FACE_LABELS[name].toLowerCase()}`}
              className="flex flex-col items-center gap-1 rounded-xl p-1.5 transition-colors"
              style={{ backgroundColor: selected ? `${ACCENT}33` : "transparent", outline: selected ? `2px solid ${ACCENT}` : "none" }}
            >
              <PyraFaceThumb
                face={name}
                colors={facelets.slice(offset, offset + 9)}
                problems={Array.from({ length: 9 }, (_, n) => problemStickers.has(offset + n))}
              />
              <span className="text-[11px] text-navy-muted">{PYRA_FACE_LABELS[name]}</span>
            </button>
          );
        })}
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="cara-actual">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setFace(PYRA_FACE_ORDER[(faceIndex + 3) % 4])}
            aria-label="Cara anterior"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-2 text-navy-muted hover:bg-navy-3 hover:text-foreground"
          >
            <ChevronRightIcon className="h-5 w-5 rotate-180" />
          </button>
          <div className="flex flex-col items-center text-center">
            <h2 id="cara-actual" className="text-lg font-semibold">
              {PYRA_FACE_LABELS[face]}
            </h2>
            <span className="text-xs text-navy-muted tabular-nums">
              Cara {faceIndex + 1} de 4 · {faceMissing === 0 ? "completa" : `faltan ${faceMissing}`} · {painted}/36 en total
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFace(PYRA_FACE_ORDER[(faceIndex + 1) % 4])}
            aria-label="Cara siguiente"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-2 text-navy-muted hover:bg-navy-3 hover:text-foreground"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-navy-muted">{PYRA_FACE_HINTS[face]}</p>
        <PyraFaceEditor
          face={face}
          colors={faceStickers}
          flags={faceStickers.map((_, n) => (problemStickers.has(faceOffset(face) + n) ? "problem" : null))}
          onPaint={paint}
          labelOf={(n) => pyraStickerLabel(n, faceStickers[n], problemStickers.has(faceOffset(face) + n) ? ", revisar" : "")}
        />
      </section>

      <ColorPalette brush={brush} onBrush={setBrush} counts={counts} colors={PYRA_COLORS} />

      <PyraStatus validation={validation} onFix={(turned) => edit(turned.reduce(turnPyraFace, facelets))} onSelectFace={setFace} />

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <button
          type="button"
          onClick={handleSolve}
          disabled={validation.kind !== "valid" || result.kind === "solving"}
          className="flex h-13 items-center justify-center gap-2 rounded-2xl text-base font-semibold text-navy transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ backgroundColor: ACCENT }}
        >
          {result.kind === "solving" && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" aria-hidden />
          )}
          {result.kind === "solving" ? (ready ? "Calculando…" : "Preparando…") : "Resolver"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="h-13 rounded-2xl px-5 text-sm font-medium text-foreground transition-colors"
          style={{ backgroundColor: confirmReset ? "var(--cube-red)" : "var(--navy-2)" }}
        >
          {confirmReset ? "¿Borrar todo?" : "Reiniciar"}
        </button>
      </div>

      <div ref={resultRef} className="scroll-mt-4">
        {result.kind === "error" && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-cube-red/40 bg-cube-red/10 px-4 py-3 text-sm text-foreground"
          >
            <p>{result.message}</p>
            <button type="button" onClick={handleSolve} className="h-11 rounded-xl bg-navy-2 font-medium text-foreground hover:bg-navy-3">
              Reintentar
            </button>
          </div>
        )}
        {result.kind === "already-solved" && (
          <p
            className="rounded-2xl border px-4 py-4 text-base font-semibold text-foreground"
            style={{ borderColor: `${OK_GREEN}66`, backgroundColor: `${OK_GREEN}1a` }}
            role="status"
          >
            El Pyraminx ya está resuelto: no hace falta ningún movimiento.
          </p>
        )}
        {result.kind === "solved" && (
          <PyraminxSolutionPlayer key={result.id} moves={result.moves} start={result.start} onNewPuzzle={clearAll} />
        )}
      </div>
    </>
  );
}

/** Live feedback on the stickers, updated on every tap. */
function PyraStatus({
  validation,
  onFix,
  onSelectFace,
}: {
  validation: PyraValidation;
  onFix: (turned: TurnedPyraFace[]) => void;
  onSelectFace: (face: PyraFace) => void;
}) {
  if (validation.kind === "valid") {
    return (
      <div
        className="rounded-2xl border px-4 py-3 text-sm text-foreground"
        style={{ borderColor: `${OK_GREEN}66`, backgroundColor: `${OK_GREEN}14` }}
        role="status"
      >
        <p className="font-semibold">
          {validation.solved ? "✓ Pyraminx completo: ya está resuelto." : "✓ Pyraminx completo y válido. Pulsa Resolver."}
        </p>
      </div>
    );
  }

  const issues = <Issues messages={validation.issues.map((issue) => issue.message)} />;

  if (validation.kind === "incomplete") {
    return (
      <div className="flex flex-col gap-2" role="status">
        <div className="rounded-2xl border border-navy-border bg-navy-2 px-4 py-3 text-sm">
          <p className="font-semibold text-foreground">{validation.message}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {validation.missingByFace.map(({ face, missing }) => (
              <button
                key={face}
                type="button"
                onClick={() => onSelectFace(face)}
                className="rounded-full bg-navy-3 px-2.5 py-1 text-xs text-navy-muted hover:text-foreground"
              >
                {PYRA_FACE_LABELS[face]}: {missing}
              </button>
            ))}
          </div>
        </div>
        {issues}
      </div>
    );
  }

  if (validation.kind === "count") {
    return (
      <div className="flex flex-col gap-2" role="alert">
        <Box title="Los colores no cuadran." lines={[validation.message]} />
        {issues}
      </div>
    );
  }

  const { turned } = validation;
  if (turned) {
    const names = turned.map((fix) => PYRA_FACE_LABELS[fix.face].toLowerCase());
    return (
      <div
        role="alert"
        className="flex flex-col gap-2 rounded-2xl border border-cube-red/40 bg-cube-red/10 px-4 py-3 text-sm text-foreground"
      >
        <p className="font-semibold">
          {turned.length === 1
            ? `Parece que la cara ${names[0]} está copiada girada ${turnLabel(turned[0])}.`
            : `Parece que las caras ${names.join(" y ")} están copiadas giradas.`}
        </p>
        <p className="text-navy-muted">
          {PYRA_FACE_HINTS[turned[0].face]} Comprueba que cada lado toca la cara que indica el dibujo. Si al girarla
          coincide con tu Pyraminx, pulsa el botón.
        </p>
        <p className="text-navy-muted">Detalle: {validation.message}</p>
        <button type="button" onClick={() => onFix(turned)} className="h-11 rounded-xl bg-navy-2 font-medium text-foreground hover:bg-navy-3">
          {turned.length === 1 ? "Girar esa cara" : "Girar esas caras"}
        </button>
      </div>
    );
  }

  return (
    <Box
      title="Estos colores no corresponden a un Pyraminx real."
      lines={[
        validation.message,
        "Revisa las pegatinas marcadas (si las hay) y que cada cara esté copiada con el Pyraminx en la posición que se indica.",
      ]}
    />
  );
}

function Box({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div role="alert" className="flex flex-col gap-1.5 rounded-2xl border border-cube-red/40 bg-cube-red/10 px-4 py-3 text-sm text-foreground">
      <p className="font-semibold">{title}</p>
      {lines.map((line) => (
        <p key={line} className="text-navy-muted">
          {line}
        </p>
      ))}
    </div>
  );
}

function Issues({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  const shown = messages.slice(0, 3);
  return (
    <ul className="flex flex-col gap-1.5 rounded-2xl border border-cube-red/40 bg-cube-red/10 px-4 py-3 text-sm text-foreground">
      {shown.map((message) => (
        <li key={message} className="flex gap-2">
          <span className="font-bold text-cube-red" aria-hidden>
            !
          </span>
          {message}
        </li>
      ))}
      {messages.length > shown.length && <li className="text-navy-muted">Y {messages.length - shown.length} problema(s) más.</li>}
    </ul>
  );
}
