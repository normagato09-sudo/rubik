"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { CameraIcon, ChevronRightIcon, GridIcon } from "@/components/ui/icons";
import type { Move } from "@/features/cube/moves";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import type { CubeColor, CubeSize, CubeState } from "@/features/cube/types";
import { emptyPyraFacelets, type PyraFacelets } from "@/features/pyraminx/facelets";
import type { TurnedFace2, Validation2 } from "@/features/solver2x2/facelets";
import { cubeStateForSolution2 } from "@/features/solver2x2/sticker-moves";
import { FACE_NAMES, type FaceName } from "../cubie";
import { cubeStateForSolution } from "../cube-state";
import {
  CENTER_COLORS,
  COLOR_NAMES,
  FACE_LABELS,
  type Facelets,
  type TurnedFace,
  type Validation,
} from "../facelets";
import { useSolver } from "../use-solver";
import { CameraScanner } from "./CameraScanner";
import {
  ACCENT,
  ColorPalette,
  FACE_ORDER,
  FaceFrame,
  HOLD_2X2,
  OK_GREEN,
  REFERENCE_MARK,
  StickerButton,
} from "./face-guide";
import {
  PUZZLES,
  PUZZLE_IDS,
  PUZZLE_LABELS,
  puzzleStore,
  savePuzzle,
  type CubePuzzleId,
  type Puzzle,
  type PuzzleId,
} from "./puzzles";
import { PyraminxSolver } from "./PyraminxSolver";
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

const turnLabel = ({ turns }: TurnedFace | TurnedFace2) =>
  turns === 2 ? "media vuelta" : "un cuarto de vuelta";

/** How the stickers are entered: chosen on arrival, changeable any time. */
type Mode = "choose" | "manual" | "camera";

type Result =
  | { kind: "idle" }
  | { kind: "solving" }
  | { kind: "error"; message: string }
  | { kind: "already-solved" }
  | { kind: "solved"; id: number; moves: Move[]; start: CubeState; size: CubeSize };

/** How to follow a 2×2 solution: its fixed corner plays the part of the 3×3's centers. */
const HOLD_SOLUTION_2X2 =
  "Hazlos con la esquina amarilla-azul-naranja abajo, detrás y a la izquierda (como copiaste el cubo), sin girar el cubo entero: esa esquina no se mueve en toda la solución.";

/** " (centro blanco)" on a 3×3, nothing on a 2×2. */
const withDetail = (puzzle: Puzzle, face: FaceName) =>
  puzzle.faceDetail(face) ? `${FACE_LABELS[face]} (${puzzle.faceDetail(face)})` : FACE_LABELS[face];

export function SolverScreen() {
  const puzzleId = useSyncExternalStore(puzzleStore.subscribe, puzzleStore.getSnapshot, puzzleStore.getServerSnapshot);
  const isPyraminx = puzzleId === "pyraminx";
  // The Pyraminx has its own editor (PyraminxSolver); the cube one keeps the 3×3 meanwhile.
  const cubeId: CubePuzzleId = isPyraminx ? "3x3" : puzzleId;
  const puzzle = PUZZLES[cubeId];
  const [mode, setMode] = useState<Mode>("choose");
  const [fromCamera, setFromCamera] = useState(false);
  // Each cube keeps its own stickers: switching back and forth loses nothing.
  const [stickers, setStickers] = useState<Record<CubePuzzleId, Facelets>>(() => ({
    "3x3": PUZZLES["3x3"].empty(),
    "2x2": PUZZLES["2x2"].empty(),
  }));
  const facelets = stickers[cubeId];
  const [pyraFacelets, setPyraFacelets] = useState<PyraFacelets>(emptyPyraFacelets);
  const [face, setFace] = useState<FaceName>("U");
  const [brush, setBrush] = useState<CubeColor | null>("white");
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [confirmReset, setConfirmReset] = useState(false);
  const { ready, ready2x2, readyPyraminx, solve, solve2x2, solvePyraminx, warmup2x2, warmupPyraminx } = useSolver();
  // Bumped on every edit: a solution that arrives for older stickers is dropped.
  const run = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const modeHeading = useRef<HTMLHeadingElement>(null);

  const validation = useMemo(() => puzzle.validate(facelets), [puzzle, facelets]);
  const counts = puzzle.counts(facelets);
  const painted = facelets.filter((sticker) => sticker !== null).length;
  const problemStickers = new Set(
    validation.kind === "valid" ? [] : validation.issues.flatMap((issue) => issue.stickers),
  );

  // The 2×2 and Pyraminx tables are only built once that puzzle is on screen.
  useEffect(() => {
    if (puzzleId === "2x2") warmup2x2();
    if (puzzleId === "pyraminx") warmupPyraminx();
  }, [puzzleId, warmup2x2, warmupPyraminx]);

  useEffect(() => {
    if (result.kind !== "idle" && result.kind !== "solving") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result.kind]);

  const edit = (next: Facelets) => {
    run.current++;
    setStickers((current) => ({ ...current, [cubeId]: next }));
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

  const changePuzzle = (next: PuzzleId) => {
    if (next === puzzleId) return;
    run.current++;
    savePuzzle(next);
    setFace("U");
    setFromCamera(false);
    setResult({ kind: "idle" });
    setConfirmReset(false);
    // The camera reads one cube; switching mid-scan starts that cube over.
    if (mode === "camera") setMode("choose");
  };

  /** The camera read the four faces of the Pyraminx: its editor takes over. */
  const scannedPyraminx = (next: PyraFacelets) => {
    setPyraFacelets(next);
    setFromCamera(true);
    changeMode("manual");
  };

  /** The camera read all six faces: the editor and its validation take over. */
  const scanned = (next: Facelets) => {
    edit(next);
    setFace("U");
    setFromCamera(true);
    changeMode("manual");
  };

  const paint = (index: number) => {
    if (puzzle.isFixed(index)) return;
    edit(facelets.map((color, i) => (i === index ? brush : color)));
  };

  const fixTurnedFaces = (turned: (TurnedFace | TurnedFace2)[]) => {
    edit(turned.reduce(puzzle.turnFace, facelets));
  };

  const clearAll = () => {
    edit(puzzle.empty());
    setFace("U");
    setBrush("white");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Clearing a whole cube by accident hurts: ask for a second tap. */
  const reset = () => {
    if (painted > 6 && !confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    clearAll();
  };

  const failed = (id: number) => {
    // The input was already validated, so this is the solver itself
    // failing: never show its technical message.
    if (run.current === id) {
      setResult({
        kind: "error",
        message: "No se ha podido calcular la solución. Vuelve a pulsar Resolver para intentarlo de nuevo.",
      });
    }
  };

  const unchecked = {
    kind: "error" as const,
    message: "La solución calculada no ha superado la comprobación. Vuelve a pulsar Resolver.",
  };

  const handleSolve = async () => {
    if (validation.kind !== "valid") return;
    const id = ++run.current;
    if (validation.solved) {
      setResult({ kind: "already-solved" });
      return;
    }
    setResult({ kind: "solving" });

    if (puzzleId === "2x2") {
      const colors = (validation as Extract<Validation2, { kind: "valid" }>).facelets;
      let moves: string[];
      try {
        moves = await solve2x2(colors);
      } catch {
        failed(id);
        return;
      }
      if (run.current !== id) return;
      // Replayed with RUBIKO's 3D engine on the exact stickers painted.
      const start = cubeStateForSolution2(colors, moves as Move[]);
      setResult(start ? { kind: "solved", id, moves: moves as Move[], start, size: 2 } : unchecked);
      return;
    }

    const snapshot = facelets;
    let moves: string[];
    try {
      moves = await solve((validation as Extract<Validation, { kind: "valid" }>).cube);
    } catch {
      failed(id);
      return;
    }
    if (run.current !== id) return;
    // Replay the moves with RUBIKO's own cube engine on the exact stickers
    // painted: only moves that really solve this cube are ever shown.
    const start = cubeStateForSolution(snapshot, moves);
    setResult(start ? { kind: "solved", id, moves: moves as Move[], start, size: 3 } : unchecked);
  };

  const faceIndex = FACE_ORDER.indexOf(face);
  const faceStickers = facelets.slice(puzzle.offset(face), puzzle.offset(face) + puzzle.perFace);
  const faceMissing = faceStickers.filter((color) => color === null).length;
  const isReady = puzzleId === "2x2" ? ready2x2 : ready;

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
            {PUZZLE_LABELS[puzzleId]}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Solucionador</h1>
          <p className="text-sm text-navy-muted">
            Introduce los colores de tu {isPyraminx ? "Pyraminx" : "cubo"}, a mano o con la cámara, y obtén los movimientos
            para resolverlo.
          </p>
        </div>
        <PuzzlePicker selected={puzzleId} onPick={changePuzzle} />
      </div>

      {mode === "choose" ? (
        <ModePicker headingRef={modeHeading} onPick={changeMode} total={isPyraminx ? 36 : puzzle.total} />
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

      {isPyraminx && mode !== "choose" && (
        <PyraminxSolver
          mode={mode}
          facelets={pyraFacelets}
          onChange={setPyraFacelets}
          fromCamera={fromCamera}
          onScanned={scannedPyraminx}
          solve={solvePyraminx}
          ready={readyPyraminx}
        />
      )}

      {mode === "camera" && !isPyraminx && <CameraScanner key={puzzleId} puzzle={puzzle} onDone={scanned} />}

      {mode === "manual" && !isPyraminx && (
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

      {puzzleId === "3x3" ? (
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
      ) : (
        <HoldReference />
      )}

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
              aria-label={`Editar cara ${withDetail(puzzle, name)}`}
              className={`grid ${puzzle.size === 3 ? "grid-cols-3" : "grid-cols-2"} gap-[2px] rounded-lg p-1 transition-colors`}
              style={{
                gridColumn: column,
                gridRow: row,
                backgroundColor: selected ? `${ACCENT}33` : "transparent",
                outline: selected ? `2px solid ${ACCENT}` : "none",
              }}
            >
              {facelets.slice(puzzle.offset(name), puzzle.offset(name) + puzzle.perFace).map((color, i) => (
                <span
                  key={i}
                  className="aspect-square rounded-[3px]"
                  style={{
                    backgroundColor: color ? CUBE_COLOR_HEX[color] : "var(--navy-3)",
                    boxShadow: problemStickers.has(puzzle.offset(name) + i)
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
              {FACE_LABELS[face]}
              {puzzle.faceDetail(face) && (
                <>
                  {" "}
                  <span className="text-sm font-normal text-navy-muted">· {puzzle.faceDetail(face)}</span>
                </>
              )}
            </h2>
            <span className="text-xs text-navy-muted tabular-nums">
              Cara {faceIndex + 1} de 6 · {faceMissing === 0 ? "completa" : `faltan ${faceMissing}`} ·{" "}
              {painted}/{puzzle.total} en total
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
        <p className="text-sm text-navy-muted">{puzzle.hints[face]}</p>

        {/* Each border shows what that side touches, so the face is read the right way round. */}
        <FaceFrame face={face} size={puzzle.size}>
          {faceStickers.map((color, i) => {
            const index = puzzle.offset(face) + i;
            const center = puzzle.isFixed(index);
            const problem = problemStickers.has(index);
            const guide = puzzleId === "2x2" && REFERENCE_MARK[face]?.index === i ? REFERENCE_MARK[face]!.color : null;
            return (
              <StickerButton
                key={index}
                color={color}
                center={center}
                flag={problem ? "problem" : null}
                guide={guide}
                onPaint={() => paint(index)}
                label={
                  center
                    ? `Centro ${COLOR_NAMES[CENTER_COLORS[face]]} (fijo)`
                    : `Pegatina ${i + 1}${color ? `, ${COLOR_NAMES[color]}` : ", sin color"}${problem ? ", revisar" : ""}${guide ? `, aquí va la pegatina ${COLOR_NAMES[guide]} de la esquina guía` : ""}`
                }
              />
            );
          })}
        </FaceFrame>
      </section>

      <ColorPalette brush={brush} onBrush={setBrush} counts={counts} perColor={puzzle.perFace} />

      <StatusPanel puzzle={puzzle} validation={validation} onFix={fixTurnedFaces} onSelectFace={setFace} />

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
          {result.kind === "solving" ? (isReady ? "Calculando…" : "Preparando…") : "Resolver"}
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

        {result.kind === "solved" &&
          (result.size === 2 ? (
            <SolutionPlayer
              key={result.id}
              moves={result.moves}
              start={result.start}
              onNewCube={clearAll}
              size={2}
              hold={HOLD_SOLUTION_2X2}
            />
          ) : (
            <SolutionPlayer key={result.id} moves={result.moves} start={result.start} onNewCube={clearAll} />
          ))}
      </div>
        </>
      )}
    </div>
  );
}

/** 3×3, 2×2 or Pyraminx: big buttons, easy to hit at 360 px. */
function PuzzlePicker({ selected, onPick }: { selected: PuzzleId; onPick: (id: PuzzleId) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-navy-2 p-1" role="radiogroup" aria-label="Cubo">
      {PUZZLE_IDS.map((id) => {
        const active = id === selected;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onPick(id)}
            className="h-11 rounded-xl text-base font-semibold transition-colors"
            style={
              active
                ? { backgroundColor: ACCENT, color: "var(--navy)" }
                : { color: "var(--navy-muted)" }
            }
          >
            {PUZZLE_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}

/** How to hold a 2×2: its reference corner, drawn with its three colors. */
function HoldReference() {
  return (
    <div className="flex gap-3 rounded-2xl border border-navy-border bg-navy-2 px-4 py-3 text-sm">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 grid-cols-2 grid-rows-2 gap-0.5" aria-hidden>
        <span className="rounded-sm" style={{ backgroundColor: CUBE_COLOR_HEX.blue }} />
        <span className="rounded-sm bg-navy-3" />
        <span className="rounded-sm" style={{ backgroundColor: CUBE_COLOR_HEX.orange }} />
        <span className="rounded-sm" style={{ backgroundColor: CUBE_COLOR_HEX.yellow }} />
      </span>
      <p className="text-foreground">
        <span className="font-semibold">{HOLD_2X2}</span>{" "}
        <span className="text-navy-muted">
          El 2×2 no tiene centros: esa esquina es la guía, y el punto de color marca dónde se ve en cada cara. Si lo
          copias en otra posición no pasa nada: la solución toma como fija la esquina que tengas abajo, detrás y a la
          izquierda.
        </span>
      </p>
    </div>
  );
}

/** The two ways in, as big cards that are easy to hit on a phone. */
function ModePicker({
  headingRef,
  onPick,
  total,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  onPick: (mode: "manual" | "camera") => void;
  total: number;
}) {
  const options = [
    {
      mode: "manual" as const,
      title: "Manual",
      text: `Pinta las ${total} pegatinas cara a cara con la paleta de colores.`,
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
  puzzle,
  validation,
  onFix,
  onSelectFace,
}: {
  puzzle: Puzzle;
  validation: Validation | Validation2;
  onFix: (turned: (TurnedFace | TurnedFace2)[]) => void;
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
                  style={{
                    backgroundColor: puzzle.size === 3 ? CUBE_COLOR_HEX[CENTER_COLORS[face]] : "var(--navy-muted)",
                  }}
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
    const names = turned.map((fix) => withDetail(puzzle, fix.face));
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
          {puzzle.hints[turned[0].face]}{" "}
          {puzzle.size === 3
            ? "Comprueba que cada lado coincide con la barra de color que tiene al lado."
            : "Comprueba que cada lado toca la cara que indica el marco."}{" "}
          Si al girarla coincide con tu cubo, pulsa el botón.
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
      title={`Estos colores no corresponden a un cubo ${puzzle.label} real.`}
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
