import type { ReactNode } from "react";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import type { CubeColor } from "@/features/cube/types";
import type { FaceName } from "../cubie";
import { CENTER_COLORS, COLOR_NAMES, FACE_LABELS, neighborFace } from "../facelets";

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

/**
 * The same for a 2×2, which has no centers: the guide is the reference
 * corner — yellow-blue-orange at down-back-left, the place it has on a
 * solved cube held white up, green front.
 */
export const FACE_HINTS_2X2: Record<FaceName, string> = {
  U: "Desde la posición inicial, inclina el cubo hacia ti hasta ver la cara de arriba de frente: la de delante queda abajo.",
  F: "Posición inicial: la esquina amarilla-azul-naranja abajo, detrás y a la izquierda (desde delante no se ve). Copia la cara que tienes de frente.",
  R: "Gira el cubo entero hacia la izquierda: la cara de la derecha queda delante y la de arriba sigue arriba.",
  B: "Gira el cubo entero otra vez hacia la izquierda: ves la cara de detrás, con la esquina guía abajo a la derecha (su pegatina azul).",
  L: "Una vez más hacia la izquierda: ves la cara de la izquierda, con la esquina guía abajo a la izquierda (su pegatina naranja).",
  D: "Vuelve a la posición inicial e inclina el cubo alejándolo de ti hasta ver la cara de abajo: la esquina guía queda abajo a la izquierda (su pegatina amarilla).",
};

/** Where the reference corner shows on a 2×2 face (sticker 0–3), and its color there. */
export const REFERENCE_MARK: Partial<Record<FaceName, { index: number; color: CubeColor }>> = {
  D: { index: 2, color: "yellow" },
  B: { index: 3, color: "blue" },
  L: { index: 2, color: "orange" },
};

/** How to hold a 2×2, shown above its editor and camera. */
export const HOLD_2X2 =
  "Busca la esquina amarilla-azul-naranja y sujeta el cubo con ella abajo, detrás y a la izquierda: amarillo abajo, azul detrás y naranja a la izquierda. Es donde está en un cubo resuelto con blanco arriba y verde delante.";

/** Border sticker (2 top, 4 left, 6 right, 8 bottom) → where its marker goes. */
const BORDERS = [
  { n: 2, className: "col-start-2 row-start-1 h-1.5 w-1/2 self-center justify-self-center" },
  { n: 4, className: "col-start-1 row-start-2 h-1/2 w-1.5 self-center justify-self-center" },
  { n: 6, className: "col-start-3 row-start-2 h-1/2 w-1.5 self-center justify-self-center" },
  { n: 8, className: "col-start-2 row-start-3 h-1.5 w-1/2 self-center justify-self-center" },
] as const;

/**
 * A face's 3×3 grid framed by bars in the color of the center each side
 * touches, so the face is read the right way round. A 2×2 has no centers:
 * its 2×2 grid is framed by the name of the face each side touches.
 */
export function FaceFrame({ face, size = 3, children }: { face: FaceName; size?: 2 | 3; children: ReactNode }) {
  if (size === 2) {
    const side = (n: 2 | 4 | 6 | 8) => FACE_LABELS[neighborFace(face, n)].toLowerCase();
    return (
      <div className="mx-auto grid w-full max-w-[272px] grid-cols-[20px_1fr_20px] grid-rows-[20px_auto_20px] text-[11px] text-navy-muted">
        <span className="col-start-2 row-start-1 self-center text-center">{side(2)}</span>
        <span className="col-start-1 row-start-2 self-center justify-self-center [writing-mode:vertical-rl] rotate-180">{side(4)}</span>
        <span className="col-start-3 row-start-2 self-center justify-self-center [writing-mode:vertical-rl]">{side(6)}</span>
        <span className="col-start-2 row-start-3 self-center text-center">{side(8)}</span>
        <div className="col-start-2 row-start-2 grid grid-cols-2 gap-2 rounded-2xl bg-black/40 p-2">{children}</div>
      </div>
    );
  }
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

/**
 * The brush: the colors with how many of each are painted (of 9, or 4 on a
 * 2×2), plus the eraser. A Pyraminx passes its own 4 colors.
 */
export function ColorPalette<C extends CubeColor>({
  brush,
  onBrush,
  counts,
  perColor = 9,
  colors = PALETTE_COLORS as C[],
}: {
  brush: C | null;
  onBrush: (color: C | null) => void;
  counts: Record<C, number>;
  perColor?: 4 | 9;
  colors?: readonly C[];
}) {
  return (
    <div
      className={`grid ${colors.length === 4 ? "mx-auto w-full max-w-xs grid-cols-5" : "grid-cols-7"} gap-1.5`}
      role="radiogroup"
      aria-label="Color para pintar"
    >
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={brush === color}
          aria-label={`${COLOR_NAMES[color]}, ${counts[color]} de ${perColor}`}
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
              counts[color] > perColor ? "font-semibold text-cube-red" : "text-navy-muted"
            }`}
            style={counts[color] === perColor ? { color: OK_GREEN } : undefined}
          >
            {counts[color]}/{perColor}
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
 * `guide` marks where the 2×2's reference corner goes, with its color.
 */
export function StickerButton({
  color,
  label,
  center = false,
  flag = null,
  guide = null,
  onPaint,
}: {
  color: CubeColor | null;
  label: string;
  center?: boolean;
  flag?: "problem" | "unsure" | null;
  guide?: CubeColor | null;
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
      {guide && (
        <span
          className="absolute bottom-1.5 left-1.5 h-3 w-3 rounded-full border-2 border-black/40"
          style={{ backgroundColor: CUBE_COLOR_HEX[guide] }}
          title="Aquí va la esquina guía"
          aria-hidden
        />
      )}
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
