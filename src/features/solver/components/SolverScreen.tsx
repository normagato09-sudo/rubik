"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { CameraIcon, ChevronRightIcon, GridIcon } from "@/components/ui/icons";
import type { Move } from "@/features/cube/moves";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import type { CubeColor, CubeState } from "@/features/cube/types";
import { FACE_NAMES, type FaceName } from "../cubie";
import { cubeStateForSolution } from "../cube-state";
import {
  CENTER_COLORS,
  CENTER_INDEX,
  COLOR_NAMES,
  FACE_LABELS,
  colorCounts,
  emptyFacelets,
  faceOffset,
  turnFace,
  validateFacelets,
  type Facelets,
  type TurnedFace,
  type Validation,
} from "../facelets";
import { useSolver } from "../use-solver";
import { CameraScanner } from "./CameraScanner";
import {
  ACCENT,
  ColorPalette,
  FACE_HINTS,
  FACE_ORDER,
  FaceFrame,
  OK_GREEN,
  StickerButton,
} from "./face-guide";
import { SolutionPlayer } from "./SolutionPlayer";

/** Where each face sits in the 4×3 net: [column, row]. */
const NET_POSITION: Record<FaceName, [number, number]> = {
  U: [2, 1],
  L: [1, 2],
  F: [2, 2],
  R: [3, 2],
  B: [4, 2],
  D: [2, 3],
};

const isCenter = (index: number) => FACE_NAMES.some((name) => CENTER_INDEX(name) === index);

const turnLabel = ({ turns }: TurnedFace) =>
  turns === 2 ? "media vuelta" : "un cuarto de vuelta";

/** How the stickers are entered: chosen on arrival, changeable any time. */
type Mode = "choose" | "manual" | "camera";

type Result =
  | { kind: "idle" }
  | { kind: "solving" }
  | { kind: "error"; message: string }
  | { kind: "already-solved" }
  | { kind: "solved"; id: number; moves: Move[]; start: CubeState };

export function SolverScreen() {
  const [mode, setMode] = useState<Mode>("choose");
  const [fromCamera, setFromCamera] = useState(false);
  const [facelets, setFacelets] = useState<Facelets>(emptyFacelets);
  const [face, setFace] = useState<FaceName>("U");
  const [brush, setBrush] = useState<CubeColor | null>("white");
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [confirmReset, setConfirmReset] = useState(false);
  const { ready, solve } = useSolver();
  // Bumped on every edit: a solution that arrives for older stickers is dropped.
  const run = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const modeHeading = useRef<HTMLHeadingElement>(null);

  const validation = useMemo(() => validateFacelets(facelets), [facelets]);
  const counts = colorCounts(facelets);
  const painted = facelets.filter((sticker) => sticker !== null).length;
  const problemStickers = new Set(
    validation.kind === "valid" ? [] : validation.issues.flatMap((issue) => issue.stickers),
  );

  useEffect(() => {
    if (result.kind !== "idle" && result.kind !== "solving") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result.kind]);

  const edit = (next: Facelets) => {
    run.current++;
    setFacelets(next);
    setResult({ kind: "idle" });
    setConfirmReset(false);
  };

  const changeMode = (next: Mode) => {
    run.current++;
    setMode(next);
    setResult({ kind: "idle" });
    // Focus the new section's heading once it is on screen.
    requestAnimationFrame(() => modeHeading.current?.focus());
  };

  /** The camera read all six faces: the editor and its validation take over. */
  const scanned = (next: Facelets) => {
    edit(next);
    setFace("U");
    setFromCamera(true);
    changeMode("manual");
  };

  const paint = (index: number) => {
    if (isCenter(index)) return;
    edit(facelets.map((color, i) => (i === index ? brush : color)));
  };

  const fixTurnedFaces = (turned: TurnedFace[]) => {
    edit(turned.reduce(turnFace, facelets));
  };

  const clearAll = () => {
    edit(emptyFacelets());
    setFace("U");
    setBrush("white");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Clearing 48 stickers by accident hurts: ask for a second tap. */
  const reset = () => {
    if (painted > 6 && !confirmReset) {
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
    const snapshot = facelets;
    let moves: string[];
    try {
      moves = await solve(validation.cube);
    } catch {
      // The input was already validated, so this is the solver itself
      // failing: never show its technical message.
      if (run.current === id) {
        setResult({
          kind: "error",
          message: "No se ha podido calcular la solución. Vuelve a pulsar Resolver para intentarlo de nuevo.",
        });
      }
      return;
    }
    if (run.current !== id) return;
    // Replay the moves with RUBIKO's own cube engine on the exact stickers
    // painted: only moves that really solve this cube are ever shown.
    const start = cubeStateForSolution(snapshot, moves);
    setResult(
      start
        ? { kind: "solved", id, moves: moves as Move[], start }
        : {
            kind: "error",
            message: "La solución calculada no ha superado la comprobación. Vuelve a pulsar Resolver.",
          },
    );
  };

  const faceIndex = FACE_ORDER.indexOf(face);
  const faceMissing = facelets
    .slice(faceOffset(face), faceOffset(face) + 9)
    .filter((color) => color === null).length;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="flex w-fit items-center gap-1 text-sm text-navy-muted hover:text-foreground"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180" />
          Inicio
        </Link>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: ACCENT }}>
            3×3
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Solucionador</h1>
          <p className="text-sm text-navy-muted">
            Introduce los colores de tu cubo, a mano o con la cámara, y obtén los movimientos para resolverlo.
          </p>
        </div>
      </div>

      {mode === "choose" ? (
        <ModePicker headingRef={modeHeading} onPick={changeMode} />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <h2 ref={modeHeading} tabIndex={-1} className="text-sm font-semibold outline-none">
            {mode === "manual" ? "Modo manual" : "Modo cámara / foto"}
          </h2>
          <button
            type="button"
            onClick={() => changeMode("choose")}
            className="h-11 rounded-xl bg-navy-2 px-4 text-sm font-medium text-foreground hover:bg-navy-3"
          >
            Cambiar forma
          </button>
        </div>
      )}

      {mode === "camera" && <CameraScanner onDone={scanned} />}

      {mode === "manual" && (
        <>
      {fromCamera && (
        <p
          className="rounded-2xl border px-4 py-3 text-sm text-foreground"
          style={{ borderColor: `${ACCENT}66`, backgroundColor: `${ACCENT}14` }}
          role="status"
        >
          Colores leídos con la cámara. Mira el aviso de abajo y corrige aquí lo que haga falta antes de
          pulsar Resolver.
        </p>
      )}

      <div className="flex gap-3 rounded-2xl border border-navy-border bg-navy-2 px-4 py-3 text-sm">
        <span
          className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border-t-[6px]"
          style={{ backgroundColor: CUBE_COLOR_HEX.green, borderTopColor: CUBE_COLOR_HEX.white }}
          aria-hidden
        />
        <p className="text-foreground">
          <span className="font-semibold">Sujeta el cubo con el centro blanco arriba y el verde delante.</span>{" "}
          <span className="text-navy-muted">
            Esa es la posición inicial. Los centros no se mueven: ya están puestos. Las barras de color junto a
            cada cara indican qué centro toca ese lado.
          </span>
        </p>
      </div>

      {/* Whole cube as a net; tapping a face opens it below. */}
      <div
        className="grid grid-cols-4 gap-1.5 rounded-3xl border border-navy-border bg-navy-2 p-3"
        role="group"
        aria-label="Caras del cubo"
      >
        {FACE_NAMES.map((name) => {
          const [column, row] = NET_POSITION[name];
          const selected = name === face;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setFace(name)}
              aria-pressed={selected}
              aria-label={`Editar cara ${FACE_LABELS[name]} (centro ${COLOR_NAMES[CENTER_COLORS[name]]})`}
              className="grid grid-cols-3 gap-[2px] rounded-lg p-1 transition-colors"
              style={{
                gridColumn: column,
                gridRow: row,
                backgroundColor: selected ? `${ACCENT}33` : "transparent",
                outline: selected ? `2px solid ${ACCENT}` : "none",
              }}
            >
              {facelets.slice(faceOffset(name), faceOffset(name) + 9).map((color, i) => (
                <span
                  key={i}
                  className="aspect-square rounded-[3px]"
                  style={{
                    backgroundColor: color ? CUBE_COLOR_HEX[color] : "var(--navy-3)",
                    boxShadow: problemStickers.has(faceOffset(name) + i)
                      ? "0 0 0 2px var(--cube-red)"
                      : undefined,
                  }}
                />
              ))}
            </button>
          );
        })}
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="cara-actual">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setFace(FACE_ORDER[(faceIndex + 5) % 6])}
            aria-label="Cara anterior"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-2 text-navy-muted hover:bg-navy-3 hover:text-foreground"
          >
            <ChevronRightIcon className="h-5 w-5 rotate-180" />
          </button>
          <div className="flex flex-col items-center text-center">
            <h2 id="cara-actual" className="text-lg font-semibold">
              {FACE_LABELS[face]}{" "}
              <span className="text-sm font-normal text-navy-muted">
                · centro {COLOR_NAMES[CENTER_COLORS[face]]}
              </span>
            </h2>
            <span className="text-xs text-navy-muted tabular-nums">
              Cara {faceIndex + 1} de 6 · {faceMissing === 0 ? "completa" : `faltan ${faceMissing}`} ·{" "}
              {painted}/54 en total
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFace(FACE_ORDER[(faceIndex + 1) % 6])}
            aria-label="Cara siguiente"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-2 text-navy-muted hover:bg-navy-3 hover:text-foreground"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-navy-muted">{FACE_HINTS[face]}</p>

        {/* Each border shows the color of the face it touches, so the face is read the right way round. */}
        <FaceFrame face={face}>
          {facelets.slice(faceOffset(face), faceOffset(face) + 9).map((color, i) => {
            const index = faceOffset(face) + i;
            const center = i === 4;
            const problem = problemStickers.has(index);
            return (
              <StickerButton
                key={index}
                color={color}
                center={center}
                flag={problem ? "problem" : null}
                onPaint={() => paint(index)}
                label={
                  center
                    ? `Centro ${COLOR_NAMES[CENTER_COLORS[face]]} (fijo)`
                    : `Pegatina ${i + 1}${color ? `, ${COLOR_NAMES[color]}` : ", sin color"}${problem ? ", revisar" : ""}`
                }
              />
            );
          })}
        </FaceFrame>
      </section>

      <ColorPalette brush={brush} onBrush={setBrush} counts={counts} />

      <StatusPanel validation={validation} onFix={fixTurnedFaces} onSelectFace={setFace} />

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
            <button
              type="button"
              onClick={handleSolve}
              className="h-11 rounded-xl bg-navy-2 font-medium text-foreground hover:bg-navy-3"
            >
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
            El cubo ya está resuelto: no hace falta ningún movimiento.
          </p>
        )}

        {result.kind === "solved" && (
          <SolutionPlayer
            key={result.id}
            moves={result.moves}
            start={result.start}
            onNewCube={clearAll}
          />
        )}
      </div>
        </>
      )}
    </div>
  );
}

/** The two ways in, as big cards that are easy to hit on a phone. */
function ModePicker({
  headingRef,
  onPick,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  onPick: (mode: "manual" | "camera") => void;
}) {
  const options = [
    {
      mode: "manual" as const,
      title: "Manual",
      text: "Pinta las 54 pegatinas cara a cara con la paleta de colores.",
      Icon: GridIcon,
    },
    {
      mode: "camera" as const,
      title: "Cámara / foto",
      text: "Enseña cada cara a la cámara o haz una foto: los colores se leen solos y puedes corregirlos.",
      Icon: CameraIcon,
    },
  ];
  return (
    <section className="flex flex-col gap-3" aria-labelledby="elige-forma">
      <h2 id="elige-forma" ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
        ¿Cómo quieres introducir el cubo?
      </h2>
      {options.map(({ mode, title, text, Icon }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onPick(mode)}
          className="flex min-h-24 items-center gap-4 rounded-2xl border border-navy-border bg-navy-2 px-4 py-4 text-left transition-colors hover:bg-navy-3 active:scale-[0.99]"
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
            aria-hidden
          >
            <Icon className="h-6 w-6" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-base font-semibold text-foreground">{title}</span>
            <span className="text-sm text-navy-muted">{text}</span>
          </span>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-navy-muted" />
        </button>
      ))}
      <p className="text-xs text-navy-muted">
        Con la cámara todo pasa en tu dispositivo: las imágenes no se envían a ningún sitio.
      </p>
    </section>
  );
}

/** Live feedback on the stickers, updated on every tap. */
function StatusPanel({
  validation,
  onFix,
  onSelectFace,
}: {
  validation: Validation;
  onFix: (turned: TurnedFace[]) => void;
  onSelectFace: (face: FaceName) => void;
}) {
  if (validation.kind === "valid") {
    return (
      <div
        className="rounded-2xl border px-4 py-3 text-sm text-foreground"
        style={{ borderColor: `${OK_GREEN}66`, backgroundColor: `${OK_GREEN}14` }}
        role="status"
      >
        <p className="font-semibold">
          {validation.solved
            ? "✓ Cubo completo: ya está resuelto."
            : "✓ Cubo completo y válido. Pulsa Resolver."}
        </p>
      </div>
    );
  }

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
                className="flex items-center gap-1.5 rounded-full bg-navy-3 px-2.5 py-1 text-xs text-navy-muted hover:text-foreground"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CUBE_COLOR_HEX[CENTER_COLORS[face]] }}
                  aria-hidden
                />
                {FACE_LABELS[face]}: {missing}
              </button>
            ))}
          </div>
        </div>
        <IssueList messages={validation.issues.map((issue) => issue.message)} />
      </div>
    );
  }

  if (validation.kind === "count") {
    return (
      <div className="flex flex-col gap-2" role="alert">
        <ErrorBox title="Los colores no cuadran." lines={[validation.message]} />
        <IssueList messages={validation.issues.map((issue) => issue.message)} />
      </div>
    );
  }

  const { turned } = validation;
  if (turned) {
    const names = turned.map(
      (fix) => `${FACE_LABELS[fix.face]} (centro ${COLOR_NAMES[CENTER_COLORS[fix.face]]})`,
    );
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
          {FACE_HINTS[turned[0].face]} Comprueba que cada lado coincide con la barra de color que tiene al
          lado. Si al girarla coincide con tu cubo, pulsa el botón.
        </p>
        <p className="text-navy-muted">Detalle: {validation.message}</p>
        <button
          type="button"
          onClick={() => onFix(turned)}
          className="h-11 rounded-xl bg-navy-2 font-medium text-foreground hover:bg-navy-3"
        >
          {turned.length === 1 ? "Girar esa cara" : "Girar esas caras"}
        </button>
      </div>
    );
  }

  return (
    <ErrorBox
      title="Estos colores no corresponden a un cubo 3×3 real."
      lines={[
        validation.message,
        "Revisa las pegatinas marcadas (si las hay) y que cada cara esté copiada con el cubo en la posición que se indica. Si alguna vez desmontaste el cubo o cambiaste pegatinas, puede que de verdad no tenga solución.",
      ]}
    />
  );
}

function ErrorBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-1.5 rounded-2xl border border-cube-red/40 bg-cube-red/10 px-4 py-3 text-sm text-foreground"
    >
      <p className="font-semibold">{title}</p>
      {lines.map((line) => (
        <p key={line} className="text-navy-muted">
          {line}
        </p>
      ))}
    </div>
  );
}

function IssueList({ messages }: { messages: string[] }) {
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
      {messages.length > shown.length && (
        <li className="text-navy-muted">Y {messages.length - shown.length} problema(s) más.</li>
      )}
    </ul>
  );
}
