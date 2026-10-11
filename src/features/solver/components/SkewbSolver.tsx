"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { CubeColor } from "@/features/cube/types";
import {
  SKEWB_COLORS,
  SKEWB_FACE_LABELS,
  emptySkewbFacelets,
  skewbColorCounts,
  turnSkewbFace,
  validateSkewbFacelets,
  type SkewbFacelets,
  type SkewbValidation,
  type TurnedSkewbFace,
} from "@/features/skewb/facelets";
import { faceOffsetSkewb, type SkewbFace } from "@/features/skewb/geometry";
import { applySkewbMoves, isSolvedSkewb, type SkewbMove } from "@/features/skewb/moves";
import { SKEWB_FACE_ORDER } from "@/features/skewb/scan";
import { ACCENT, ColorPalette, OK_GREEN } from "./face-guide";
import { SkewbCamera } from "./SkewbCamera";
import { HOLD_SKEWB, SKEWB_FACE_HINTS, SkewbFaceEditor, SkewbFaceThumb, skewbStickerLabel } from "./skewb-face";
import { SkewbSolutionPlayer } from "./SkewbSolutionPlayer";

const turnLabel = ({ turns }: TurnedSkewbFace) =>
  turns === 2 ? "media vuelta" : `un cuarto de vuelta en sentido ${turns === 1 ? "horario" : "antihorario"}`;

type Result =
  | { kind: "idle" }
  | { kind: "solving" }
  | { kind: "error"; message: string }
  | { kind: "already-solved" }
  | { kind: "solved"; id: number; moves: SkewbMove[]; start: CubeColor[] };

/**
 * The solver for the Skewb: its 30 stickers painted face by face (or read
 * with the camera), checked live, and solved in the shared worker. The
 * stickers live in the solver screen, so switching cubes keeps them.
 */
export function SkewbSolver({
  mode,
  facelets,
  onChange,
  fromCamera,
  onScanned,
  solve,
  ready,
}: {
  mode: "manual" | "camera";
  facelets: SkewbFacelets;
  onChange: (next: SkewbFacelets) => void;
  fromCamera: boolean;
  onScanned: (next: SkewbFacelets) => void;
  solve: (facelets: CubeColor[]) => Promise<string[]>;
  ready: boolean;
}) {
  const [face, setFace] = useState<SkewbFace>("U");
  const [brush, setBrush] = useState<CubeColor | null>("white");
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [confirmReset, setConfirmReset] = useState(false);
  // Bumped on every edit: a solution that arrives for older stickers is dropped.
  const run = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const validation = useMemo(() => validateSkewbFacelets(facelets), [facelets]);
  const counts = skewbColorCounts(facelets);
  const painted = facelets.filter((sticker) => sticker !== null).length;
  const problemStickers = new Set(validation.kind === "valid" ? [] : validation.issues.flatMap((issue) => issue.stickers));

  useEffect(() => {
    if (result.kind !== "idle" && result.kind !== "solving") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result.kind]);

  if (mode === "camera") {
    return (
      <SkewbCamera
        onDone={(next) => {
          run.current++;
          setFace("U");
          setResult({ kind: "idle" });
          onScanned(next);
        }}
      />
    );
  }

  const edit = (next: SkewbFacelets) => {
    run.current++;
    onChange(next);
    setResult({ kind: "idle" });
    setConfirmReset(false);
  };

  const paint = (n: number) => {
    const index = faceOffsetSkewb(face) + n;
    edit(facelets.map((color, i) => (i === index ? brush : color)));
  };

  const clearAll = () => {
    edit(emptySkewbFacelets());
    setFace("U");
    setBrush("white");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Clearing a whole Skewb by accident hurts: ask for a second tap. */
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
    let moves: SkewbMove[];
    try {
      moves = (await solve(colors)) as SkewbMove[];
    } catch {
      // The input was already validated, so this is the solver itself failing: never show its technical message.
      if (run.current === id) {
        setResult({ kind: "error", message: "No se ha podido calcular la solución. Vuelve a pulsar Resolver para intentarlo de nuevo." });
      }
      return;
    }
    if (run.current !== id) return;
    // Replayed on the exact stickers painted: only moves that really solve this Skewb are shown.
    setResult(
      isSolvedSkewb(applySkewbMoves(colors, moves))
        ? { kind: "solved", id, moves, start: colors }
        : { kind: "error", message: "La solución calculada no ha superado la comprobación. Vuelve a pulsar Resolver." },
    );
  };

  const faceIndex = SKEWB_FACE_ORDER.indexOf(face);
  const offset = faceOffsetSkewb(face);
  const faceStickers = facelets.slice(offset, offset + 5);
  const faceMissing = faceStickers.filter((color) => color === null).length;
  const step = (by: number) => setFace(SKEWB_FACE_ORDER[(faceIndex + by + 6) % 6]);

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
        <svg viewBox="0 0 32 32" className="mt-0.5 h-8 w-8 shrink-0" aria-hidden>
          <rect x={1} y={1} width={30} height={30} rx={4} fill="var(--navy-3)" />
          <polygon points="16,2 30,16 16,30 2,16" fill="var(--cube-green)" />
          <polygon points="30,2 30,15 17,2" fill={ACCENT} />
        </svg>
        <p className="text-foreground">
          <span className="font-semibold">{HOLD_SKEWB}</span>{" "}
          <span className="text-navy-muted">
            Sus centros se mueven, así que da igual qué colores queden dónde. La solución no gira esa esquina: el
            círculo de rayas marca dónde se ve en las caras de arriba, delante y derecha.
          </span>
        </p>
      </div>

      {/* The six faces; tapping one opens it below. */}
      <div className="grid grid-cols-6 gap-1.5 rounded-3xl border border-navy-border bg-navy-2 p-2.5" role="group" aria-label="Caras del Skewb">
        {SKEWB_FACE_ORDER.map((name) => {
          const selected = name === face;
          const start = faceOffsetSkewb(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => setFace(name)}
              aria-pressed={selected}
              aria-label={`Editar cara ${SKEWB_FACE_LABELS[name].toLowerCase()}`}
              className="flex min-w-0 flex-col items-center gap-1 rounded-xl p-1 transition-colors"
              style={{ backgroundColor: selected ? `${ACCENT}33` : "transparent", outline: selected ? `2px solid ${ACCENT}` : "none" }}
            >
              <SkewbFaceThumb
                colors={facelets.slice(start, start + 5)}
                problems={Array.from({ length: 5 }, (_, n) => problemStickers.has(start + n))}
              />
              <span className="w-full truncate text-center text-[10px] text-navy-muted">{SKEWB_FACE_LABELS[name]}</span>
            </button>
          );
        })}
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="cara-actual">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Cara anterior"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-2 text-navy-muted hover:bg-navy-3 hover:text-foreground"
          >
            <ChevronRightIcon className="h-5 w-5 rotate-180" />
          </button>
          <div className="flex flex-col items-center text-center">
            <h2 id="cara-actual" className="text-lg font-semibold">
              {SKEWB_FACE_LABELS[face]}
            </h2>
            <span className="text-xs text-navy-muted tabular-nums">
              Cara {faceIndex + 1} de 6 · {faceMissing === 0 ? "completa" : `faltan ${faceMissing}`} · {painted}/30 en total
            </span>
          </div>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Cara siguiente"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-2 text-navy-muted hover:bg-navy-3 hover:text-foreground"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-navy-muted">{SKEWB_FACE_HINTS[face]}</p>
        <SkewbFaceEditor
          face={face}
          colors={faceStickers}
          flags={faceStickers.map((_, n) => (problemStickers.has(offset + n) ? "problem" : null))}
          onPaint={paint}
          labelOf={(n) => skewbStickerLabel(n, faceStickers[n], problemStickers.has(offset + n) ? ", revisar" : "")}
        />
      </section>

      <ColorPalette brush={brush} onBrush={setBrush} counts={counts} colors={SKEWB_COLORS} perColor={5} />

      <SkewbStatus validation={validation} onFix={(turned) => edit(turned.reduce(turnSkewbFace, facelets))} onSelectFace={setFace} />

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
            El Skewb ya está resuelto: no hace falta ningún movimiento.
          </p>
        )}
        {result.kind === "solved" && (
          <SkewbSolutionPlayer key={result.id} moves={result.moves} start={result.start} onNewPuzzle={clearAll} />
        )}
      </div>
    </>
  );
}

/** Live feedback on the stickers, updated on every tap. */
function SkewbStatus({
  validation,
  onFix,
  onSelectFace,
}: {
  validation: SkewbValidation;
  onFix: (turned: TurnedSkewbFace[]) => void;
  onSelectFace: (face: SkewbFace) => void;
}) {
  if (validation.kind === "valid") {
    return (
      <div
        className="rounded-2xl border px-4 py-3 text-sm text-foreground"
        style={{ borderColor: `${OK_GREEN}66`, backgroundColor: `${OK_GREEN}14` }}
        role="status"
      >
        <p className="font-semibold">
          {validation.solved ? "✓ Skewb completo: ya está resuelto." : "✓ Skewb completo y válido. Pulsa Resolver."}
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
                {SKEWB_FACE_LABELS[face]}: {missing}
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
    const names = turned.map((fix) => SKEWB_FACE_LABELS[fix.face].toLowerCase());
    return (
      <div
        role="alert"
        className="flex flex-col gap-2 rounded-2xl border border-cube-red/40 bg-cube-red/10 px-4 py-3 text-sm text-foreground"
      >
        <p className="font-semibold">
          {turned.length === 1
            ? `Parece que la cara ${names[0]} está copiada girada (le falta ${turnLabel(turned[0])}).`
            : `Parece que las caras ${names.join(" y ")} están copiadas giradas.`}
        </p>
        <p className="text-navy-muted">
          {SKEWB_FACE_HINTS[turned[0].face]} Comprueba que cada lado toca la cara que indica el dibujo. Si al girarla
          coincide con tu Skewb, pulsa el botón.
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
      title="Estos colores no corresponden a un Skewb real."
      lines={[
        validation.message,
        "Revisa las pegatinas marcadas (si las hay) y que cada cara esté copiada con el Skewb en la posición que se indica.",
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
