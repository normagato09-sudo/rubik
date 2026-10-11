import type { KeyboardEvent } from "react";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import type { CubeColor } from "@/features/cube/types";
import { SKEWB_COLOR_NAMES, SKEWB_FACE_LABELS } from "@/features/skewb/facelets";
import type { SkewbFace } from "@/features/skewb/geometry";
import { neighborFace } from "../facelets";
import { ACCENT } from "./face-guide";

/**
 * How to hold the Skewb for each face, shared by the manual editor and
 * the camera. It is copied like a cube (the faces read as on the 3×3's
 * net); what matters is the corner at up-front-right, the "esquina fija":
 * no move of the solution turns it, so the Skewb is solved held the same way.
 */
export const SKEWB_FACE_HINTS: Record<SkewbFace, string> = {
  U: "Posición inicial: el Skewb como un cubo, con una cara hacia ti y otra arriba; no importan los colores. Inclínalo hacia ti hasta ver la cara de arriba de frente: la de delante queda abajo y la esquina fija, abajo a la derecha.",
  F: "Vuelve a la posición inicial y copia la cara que tienes de frente. La esquina fija es su esquina de arriba a la derecha.",
  R: "Gira el Skewb entero hacia la izquierda: la cara de la derecha queda delante y la de arriba sigue arriba. La esquina fija queda arriba a la izquierda.",
  B: "Gíralo entero otra vez hacia la izquierda: ves la cara de detrás, con la de arriba arriba.",
  L: "Una vez más hacia la izquierda: ves la cara de la izquierda, con la de arriba arriba.",
  D: "Vuelve a la posición inicial e inclina el Skewb alejándolo de ti hasta ver la cara de abajo de frente: la de delante queda arriba.",
};

/** How to hold the Skewb, shown above its editor and camera. */
export const HOLD_SKEWB =
  "Sujeta el Skewb como un cubo, con una cara hacia ti y otra arriba, y fíjate en la esquina de arriba, delante a la derecha: es la esquina fija.";

/** Where the fixed corner shows on a face (sticker 1–4), for the faces that touch it. */
export const FIXED_CORNER_MARK: Partial<Record<SkewbFace, number>> = { U: 3, F: 2, R: 1 };

const VIEW = 300;
const MARGIN = 34;

type Vec2 = [number, number];

/** The 5 stickers of a face in a square from `a` to `b` (both axes): the center, then corners up-left, up-right, down-right, down-left. */
function stickerShapes(a: number, b: number, shrink: number): { points: string; middle: Vec2 }[] {
  const m = (a + b) / 2;
  const shapes: Vec2[][] = [
    [
      [m, a],
      [b, m],
      [m, b],
      [a, m],
    ],
    [
      [a, a],
      [m, a],
      [a, m],
    ],
    [
      [b, a],
      [b, m],
      [m, a],
    ],
    [
      [b, b],
      [m, b],
      [b, m],
    ],
    [
      [a, b],
      [a, m],
      [m, b],
    ],
  ];
  return shapes.map((corners) => {
    const middle: Vec2 = [0, 1].map((k) => corners.reduce((sum, p) => sum + p[k], 0) / corners.length) as Vec2;
    const shrunk = corners.map(([x, y]) => [middle[0] + (x - middle[0]) * shrink, middle[1] + (y - middle[1]) * shrink]);
    return { middle, points: shrunk.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ") };
  });
}

/**
 * One face, big, to paint: the center and the 4 corner triangles, each a
 * button. Each side names the face it touches, so the face is copied the
 * right way round, and a ring marks the fixed corner. `flags` marks
 * stickers to check: "problem" (the validation found them wrong) or
 * "unsure" (the camera could not tell).
 */
export function SkewbFaceEditor({
  face,
  colors,
  flags,
  onPaint,
  labelOf,
}: {
  face: SkewbFace;
  colors: readonly (CubeColor | null)[];
  flags?: readonly ("problem" | "unsure" | null)[];
  onPaint: (n: number) => void;
  labelOf: (n: number) => string;
}) {
  const [a, b] = [MARGIN, VIEW - MARGIN];
  const stickers = stickerShapes(a, b, 0.88);
  const m = VIEW / 2;
  const side = (n: 2 | 4 | 6 | 8) => SKEWB_FACE_LABELS[neighborFace(face, n)].toLowerCase();
  const fixed = FIXED_CORNER_MARK[face];

  const onKey = (event: KeyboardEvent, n: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPaint(n);
    }
  };

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      className="mx-auto w-full max-w-[320px] touch-manipulation"
      role="group"
      aria-label={`Cara ${SKEWB_FACE_LABELS[face].toLowerCase()}`}
    >
      <rect x={a} y={a} width={b - a} height={b - a} rx={10} fill="rgb(0 0 0 / 40%)" stroke="var(--navy-border)" strokeWidth={3} />
      {[
        { x: m, y: a - 15, text: side(2), rotate: 0 },
        { x: a - 15, y: m, text: side(4), rotate: -90 },
        { x: b + 15, y: m, text: side(6), rotate: 90 },
        { x: m, y: b + 16, text: side(8), rotate: 0 },
      ].map(({ x, y, text, rotate }) => (
        <text
          key={`${text}-${rotate}-${y}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fill="var(--navy-muted)"
          transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
        >
          {text}
        </text>
      ))}
      {stickers.map(({ points, middle: [x, y] }, n) => {
        const flag = flags?.[n] ?? null;
        const color = colors[n];
        return (
          <g
            key={n}
            role="button"
            tabIndex={0}
            aria-label={labelOf(n)}
            onClick={() => onPaint(n)}
            onKeyDown={(event) => onKey(event, n)}
            className="cursor-pointer outline-none [&:focus-visible>polygon]:stroke-[var(--foreground)]"
          >
            <polygon
              points={points}
              fill={color ? CUBE_COLOR_HEX[color] : "var(--navy-3)"}
              stroke={flag === "problem" ? "var(--cube-red)" : color ? "rgb(0 0 0 / 35%)" : "var(--navy-border)"}
              strokeWidth={flag === "problem" ? 5 : 2}
              strokeLinejoin="round"
            />
            {fixed === n && !flag && (
              <circle cx={x} cy={y} r={9} fill="none" stroke={color ? "rgb(0 0 0 / 55%)" : ACCENT} strokeWidth={3} strokeDasharray="4 3" />
            )}
            {flag && (
              <>
                <circle cx={x} cy={y} r={11} fill={flag === "problem" ? "var(--cube-red)" : ACCENT} />
                <text
                  x={x}
                  y={y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill={flag === "problem" ? "white" : "var(--navy)"}
                >
                  {flag === "problem" ? "!" : "?"}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** A face small and still, for the overview of the six. */
export function SkewbFaceThumb({
  colors,
  problems,
}: {
  colors: readonly (CubeColor | null)[];
  problems?: readonly boolean[];
}) {
  return (
    <svg viewBox="0 0 100 100" className="w-full" aria-hidden>
      {stickerShapes(4, 96, 0.9).map(({ points }, n) => (
        <polygon
          key={n}
          points={points}
          fill={colors[n] ? CUBE_COLOR_HEX[colors[n]!] : "var(--navy-3)"}
          stroke={problems?.[n] ? "var(--cube-red)" : "none"}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

const STICKER_NAMES = ["centro", "esquina de arriba a la izquierda", "esquina de arriba a la derecha", "esquina de abajo a la derecha", "esquina de abajo a la izquierda"];

/** "Pegatina 2 (esquina de arriba a la izquierda), verde" for the screen readers. */
export function skewbStickerLabel(n: number, color: CubeColor | null, extra = "") {
  return `Pegatina ${n + 1} (${STICKER_NAMES[n]}), ${color ? SKEWB_COLOR_NAMES[color] : "sin color"}${extra}`;
}
