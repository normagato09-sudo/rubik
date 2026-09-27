import type { ReactNode } from "react";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import type { CubeColor } from "@/features/cube/types";
import type { FaceName } from "../cubie";
import { CENTER_COLORS, COLOR_NAMES, neighborFace } from "../facelets";

/**
 * How to hold the cube for each face, shared by the manual editor and the
 * camera: both read every face row by row in the same orientation.
 */

export const ACCENT = "#22d3ee";
export const OK_GREEN = "#34d399";

/** Order to copy the faces in: each hint starts from the previous position. */
export const FACE_ORDER: FaceName[] = ["U", "F", "R", "B", "L", "D"];

/** How to hold the cube to read each face the way the grid expects. */
export const FACE_HINTS: Record<FaceName, string> = {
  U: "Desde la posición inicial, inclina el cubo hacia ti hasta ver la cara blanca de frente: el verde queda abajo.",
  F: "Posición inicial: blanco arriba y verde delante. Copia la cara que tienes de frente.",
  R: "Gira el cubo entero hacia la izquierda: cara roja delante, blanco arriba.",
  B: "Gira el cubo entero otra vez hacia la izquierda: cara azul delante, blanco arriba.",
  L: "Una vez más hacia la izquierda: cara naranja delante, blanco arriba.",
  D: "Vuelve a la posición inicial e inclina el cubo alejándolo de ti hasta ver la cara amarilla de frente: el verde queda arriba.",
};

/** Border sticker (2 top, 4 left, 6 right, 8 bottom) → where its marker goes. */
const BORDERS = [
  { n: 2, className: "col-start-2 row-start-1 h-1.5 w-1/2 self-center justify-self-center" },
  { n: 4, className: "col-start-1 row-start-2 h-1/2 w-1.5 self-center justify-self-center" },
  { n: 6, className: "col-start-3 row-start-2 h-1/2 w-1.5 self-center justify-self-center" },
  { n: 8, className: "col-start-2 row-start-3 h-1.5 w-1/2 self-center justify-self-center" },
] as const;

/**
 * A face's 3×3 grid framed by bars in the color of the center each side
 * touches, so the face is read the right way round.
 */
export function FaceFrame({ face, children }: { face: FaceName; children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[288px] grid-cols-[14px_1fr_14px] grid-rows-[14px_auto_14px]">
      {BORDERS.map(({ n, className }) => {
        const color = CENTER_COLORS[neighborFace(face, n)];
        return (
          <span
            key={n}
            className={`rounded-full ${className}`}
            style={{ backgroundColor: CUBE_COLOR_HEX[color] }}
            title={`Este lado toca el centro ${COLOR_NAMES[color]}`}
            aria-hidden
          />
        );
      })}
      <div className="col-start-2 row-start-2 grid grid-cols-3 gap-2 rounded-2xl bg-black/40 p-2">
        {children}
      </div>
    </div>
  );
}

export const PALETTE_COLORS: CubeColor[] = ["white", "yellow", "green", "blue", "red", "orange"];

/** The brush: the six colors with how many of each are painted, plus the eraser. */
export function ColorPalette({
  brush,
  onBrush,
  counts,
}: {
  brush: CubeColor | null;
  onBrush: (color: CubeColor | null) => void;
  counts: Record<CubeColor, number>;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label="Color para pintar">
      {PALETTE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={brush === color}
          aria-label={`${COLOR_NAMES[color]}, ${counts[color]} de 9`}
          onClick={() => onBrush(color)}
          className="flex min-w-0 flex-col items-center gap-1"
        >
          <span
            className="aspect-square w-full max-w-12 rounded-xl border-[3px] transition-transform"
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
            style={counts[color] === 9 ? { color: OK_GREEN } : undefined}
          >
            {counts[color]}/9
          </span>
        </button>
      ))}
      <button
        type="button"
        role="radio"
        aria-checked={brush === null}
        aria-label="Borrar pegatina"
        onClick={() => onBrush(null)}
        className="flex min-w-0 flex-col items-center gap-1"
      >
        <span
          className="flex aspect-square w-full max-w-12 items-center justify-center rounded-xl border-[3px] bg-navy-3 text-navy-muted"
          style={{ borderColor: brush === null ? ACCENT : "var(--navy-border)" }}
        >
          ✕
        </span>
        <span className="text-[11px] text-navy-muted">Borrar</span>
      </button>
    </div>
  );
}

/**
 * One sticker of the big face grid: tap to paint it. The center is fixed.
 * `flag` marks a sticker to check: "problem" (the validation found it
 * wrong) or "unsure" (the camera could not tell two colors apart).
 */
export function StickerButton({
  color,
  label,
  center = false,
  flag = null,
  onPaint,
}: {
  color: CubeColor | null;
  label: string;
  center?: boolean;
  flag?: "problem" | "unsure" | null;
  onPaint: () => void;
}) {
  const problem = flag === "problem";
  return (
    <button
      type="button"
      onClick={onPaint}
      disabled={center}
      aria-label={label}
      className="relative flex aspect-square items-center justify-center rounded-xl border-2 transition-transform active:scale-95 disabled:cursor-default"
      style={{
        backgroundColor: color ? CUBE_COLOR_HEX[color] : "var(--navy-3)",
        borderColor: problem ? "var(--cube-red)" : color ? "rgb(0 0 0 / 25%)" : "var(--navy-border)",
        boxShadow: problem ? "0 0 0 2px var(--cube-red)" : undefined,
      }}
    >
      {center && <span className="h-2 w-2 rounded-full bg-black/30" aria-hidden />}
      {flag && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
          style={
            problem
              ? { backgroundColor: "var(--cube-red)", color: "white" }
              : { backgroundColor: ACCENT, color: "var(--navy)" }
          }
          aria-hidden
        >
          {problem ? "!" : "?"}
        </span>
      )}
    </button>
  );
}
