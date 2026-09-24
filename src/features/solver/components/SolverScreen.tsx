"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import type { CubeColor } from "@/features/cube/types";
import { FACE_NAMES, type FaceName } from "../cubie";
import {
  CENTER_COLORS,
  CENTER_INDEX,
  COLOR_NAMES,
  FACE_LABELS,
  emptyFacelets,
  faceOffset,
  parseFacelets,
  type Facelets,
} from "../facelets";
import { useSolver } from "../use-solver";

const ACCENT = "#22d3ee";
const COLORS: CubeColor[] = ["white", "yellow", "green", "blue", "red", "orange"];

/** How to hold the cube to read each face in the order the net expects. */
const FACE_HINTS: Record<FaceName, string> = {
  U: "Mira la cara blanca desde arriba, con la cara verde hacia ti (abajo).",
  F: "Cara verde delante, con el blanco arriba.",
  R: "Cara roja delante, con el blanco arriba.",
  B: "Cara azul delante, con el blanco arriba.",
  L: "Cara naranja delante, con el blanco arriba.",
  D: "Mira la cara amarilla desde abajo, con la cara verde arriba.",
};

/** Where each face sits in the 4×3 net: [column, row]. */
const NET_POSITION: Record<FaceName, [number, number]> = {
  U: [2, 1],
  L: [1, 2],
  F: [2, 2],
  R: [3, 2],
  B: [4, 2],
  D: [2, 3],
};

type Result =
  | { kind: "idle" }
  | { kind: "solving" }
  | { kind: "error"; message: string }
  | { kind: "solved"; moves: string[] };

export function SolverScreen() {
  const [facelets, setFacelets] = useState<Facelets>(emptyFacelets);
  const [face, setFace] = useState<FaceName>("U");
  const [brush, setBrush] = useState<CubeColor | null>("white");
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const { ready, solve } = useSolver();

  const paint = (index: number) => {
    if (FACE_NAMES.some((name) => CENTER_INDEX(name) === index)) return;
    setFacelets((current) => current.map((color, i) => (i === index ? brush : color)));
    setResult({ kind: "idle" });
  };

  const clear = () => {
    setFacelets(emptyFacelets());
    setResult({ kind: "idle" });
  };

  const handleSolve = async () => {
    const parsed = parseFacelets(facelets);
    if (!parsed.ok) {
      setResult({ kind: "error", message: parsed.error });
      return;
    }
    setResult({ kind: "solving" });
    try {
      setResult({ kind: "solved", moves: await solve(parsed.cube) });
    } catch (error) {
      setResult({
        kind: "error",
        message: error instanceof Error ? error.message : "No se ha podido resolver.",
      });
    }
  };

  const counts = Object.fromEntries(
    COLORS.map((color) => [color, facelets.filter((sticker) => sticker === color).length]),
  ) as Record<CubeColor, number>;
  const painted = facelets.filter((sticker) => sticker !== null).length;

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
            Colorea tu cubo cara a cara y obtén los movimientos para resolverlo.
          </p>
        </div>
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
              aria-label={`${FACE_LABELS[name]} (${name})`}
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
                  style={{ backgroundColor: color ? CUBE_COLOR_HEX[color] : "var(--navy-3)" }}
                />
              ))}
            </button>
          );
        })}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">
            {FACE_LABELS[face]}{" "}
            <span className="font-mono text-sm text-navy-muted">({face})</span>
          </h2>
          <span className="text-xs text-navy-muted tabular-nums">{painted}/54</span>
        </div>
        <p className="text-sm text-navy-muted">{FACE_HINTS[face]}</p>

        <div className="mx-auto grid w-full max-w-[264px] grid-cols-3 gap-2 rounded-2xl bg-black/40 p-2">
          {facelets.slice(faceOffset(face), faceOffset(face) + 9).map((color, i) => {
            const index = faceOffset(face) + i;
            const isCenter = i === 4;
            return (
              <button
                key={index}
                type="button"
                onClick={() => paint(index)}
                disabled={isCenter}
                aria-label={
                  isCenter
                    ? `Centro ${COLOR_NAMES[CENTER_COLORS[face]]}`
                    : `Pegatina ${i + 1}${color ? `, ${COLOR_NAMES[color]}` : ", sin color"}`
                }
                className="aspect-square rounded-xl border-2 transition-transform active:scale-95 disabled:cursor-default"
                style={{
                  backgroundColor: color ? CUBE_COLOR_HEX[color] : "var(--navy-3)",
                  borderColor: color ? "rgb(0 0 0 / 25%)" : "var(--navy-border)",
                }}
              />
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-7 gap-2" role="radiogroup" aria-label="Color para pintar">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={brush === color}
            aria-label={COLOR_NAMES[color]}
            onClick={() => setBrush(color)}
            className="flex flex-col items-center gap-1"
          >
            <span
              className="h-11 w-11 rounded-xl border-2 transition-transform"
              style={{
                backgroundColor: CUBE_COLOR_HEX[color],
                borderColor: brush === color ? ACCENT : "transparent",
                transform: brush === color ? "scale(1.08)" : undefined,
              }}
            />
            <span
              className={`text-[11px] tabular-nums ${
                counts[color] > 9 ? "font-semibold text-cube-red" : "text-navy-muted"
              }`}
            >
              {counts[color]}/9
            </span>
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={brush === null}
          aria-label="Borrar"
          onClick={() => setBrush(null)}
          className="flex flex-col items-center gap-1"
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 bg-navy-3 text-navy-muted"
            style={{ borderColor: brush === null ? ACCENT : "var(--navy-border)" }}
          >
            ✕
          </span>
          <span className="text-[11px] text-navy-muted">Borrar</span>
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <button
          type="button"
          onClick={handleSolve}
          disabled={result.kind === "solving"}
          className="flex h-13 items-center justify-center rounded-2xl text-base font-semibold text-navy transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundColor: ACCENT }}
        >
          {result.kind === "solving" ? (ready ? "Calculando…" : "Preparando…") : "Resolver"}
        </button>
        <button
          type="button"
          onClick={clear}
          className="h-13 rounded-2xl bg-navy-2 px-5 text-sm font-medium text-foreground hover:bg-navy-3"
        >
          Vaciar
        </button>
      </div>

      {result.kind === "error" && (
        <p
          role="alert"
          className="rounded-2xl border border-cube-red/40 bg-cube-red/10 px-4 py-3 text-sm text-foreground"
        >
          {result.message}
        </p>
      )}

      {result.kind === "solved" && <Solution moves={result.moves} />}
    </div>
  );
}

function Solution({ moves }: { moves: string[] }) {
  if (moves.length === 0) {
    return (
      <p className="rounded-2xl bg-navy-2 px-4 py-4 text-sm text-foreground">
        El cubo ya está resuelto.
      </p>
    );
  }
  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <h2 className="flex items-baseline justify-between text-xs font-semibold tracking-wide text-navy-muted uppercase">
        Solución
        <span className="font-normal normal-case tabular-nums">{moves.length} movimientos</span>
      </h2>
      <p
        className="rounded-2xl border border-l-4 border-navy-border bg-navy-2 px-4 py-4 font-mono text-lg leading-snug font-semibold break-words text-foreground"
        style={{ borderLeftColor: ACCENT }}
      >
        {moves.join(" ")}
      </p>
      <p className="text-sm text-navy-muted">
        Hazlos con el blanco arriba y el verde delante.
      </p>
      <ol className="grid grid-cols-4 gap-2">
        {moves.map((move, index) => (
          <li
            key={index}
            className="flex flex-col items-center gap-0.5 rounded-xl border border-navy-border bg-navy-2 py-2.5"
          >
            <span className="text-[11px] font-medium text-navy-muted tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-xl font-semibold text-foreground">{move}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
