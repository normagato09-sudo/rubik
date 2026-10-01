import type { KeyboardEvent } from "react";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import { PYRA_COLOR_NAMES, PYRA_FACE_LABELS, pyraNeighbors } from "@/features/pyraminx/facelets";
import { centroid, stickerCorners, type PyraFace, type Vec2 } from "@/features/pyraminx/geometry";
import type { PyraColor } from "@/features/pyraminx/moves";
import { isUpsideDown, pyraTriangle } from "@/features/pyraminx/scan";
import { ACCENT } from "./face-guide";

/**
 * How to hold the Pyraminx for each face, shared by the manual editor and
 * the camera: both draw every face as it is seen in that position (the
 * bottom one upside down).
 */
export const PYRA_FACE_HINTS: Record<PyraFace, string> = {
  F: "Posición inicial: una cara apoyada abajo, una punta arriba y una cara hacia ti. Copia la cara que tienes de frente.",
  R: "Gira el Pyraminx entero hacia la izquierda, sobre la punta de arriba, hasta tener delante la cara que estaba a la derecha.",
  L: "Gíralo entero otra vez hacia la izquierda: ahora tienes delante la cara que al principio estaba a la izquierda.",
  D: "Vuelve a la posición inicial e inclina el Pyraminx alejándolo de ti hasta ver la cara de abajo de frente: la punta de detrás queda abajo, por eso se dibuja al revés.",
};

/** The 9 stickers of a face drawn in a `size`×`size` box, a little apart so each reads on its own. */
function stickerShapes(face: PyraFace, size: number, fraction: number) {
  const triangle = pyraTriangle(size, size, isUpsideDown(face), fraction);
  return {
    triangle,
    stickers: Array.from({ length: 9 }, (_, n) => {
      const corners = stickerCorners(...triangle, n);
      const middle = centroid(corners);
      const shrunk = corners.map(([x, y]) => [middle[0] + (x - middle[0]) * 0.88, middle[1] + (y - middle[1]) * 0.88] as Vec2);
      return { middle, points: shrunk.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ") };
    }),
  };
}

const VIEW = 300;

/**
 * One face, big, to paint: 9 triangles, each a button. Each side of the
 * triangle names the face it touches, so the face is copied the right way
 * round. `flags` marks stickers to check: "problem" (the validation found
 * them wrong) or "unsure" (the camera could not tell).
 */
export function PyraFaceEditor({
  face,
  colors,
  flags,
  onPaint,
  labelOf,
}: {
  face: PyraFace;
  colors: readonly (PyraColor | null)[];
  flags?: readonly ("problem" | "unsure" | null)[];
  onPaint: (n: number) => void;
  labelOf: (n: number) => string;
}) {
  const { triangle, stickers } = stickerShapes(face, VIEW, 0.8);
  const [apex, left, right] = triangle;
  const neighbors = pyraNeighbors(face);
  const middle = centroid(triangle);
  /** A label just outside the middle of a side. */
  const sideLabel = (p: Vec2, q: Vec2, name: PyraFace) => {
    const [mx, my] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const [dx, dy] = [mx - middle[0], my - middle[1]];
    const length = Math.hypot(dx, dy);
    return { x: mx + (dx / length) * 16, y: my + (dy / length) * 16, text: PYRA_FACE_LABELS[name].toLowerCase() };
  };
  const labels = [
    sideLabel(apex, left, neighbors.left),
    sideLabel(apex, right, neighbors.right),
    sideLabel(left, right, neighbors.bottom),
  ];

  const onKey = (event: KeyboardEvent, n: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPaint(n);
    }
  };

  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="mx-auto w-full max-w-[320px] touch-manipulation" role="group" aria-label={`Cara ${PYRA_FACE_LABELS[face].toLowerCase()}`}>
      <polygon
        points={triangle.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="rgb(0 0 0 / 40%)"
        stroke="var(--navy-border)"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {labels.map(({ x, y, text }) => (
        <text key={text} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={13} fill="var(--navy-muted)">
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
            {flag && (
              <>
                <circle cx={x} cy={y} r={11} fill={flag === "problem" ? "var(--cube-red)" : ACCENT} />
                <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={700} fill={flag === "problem" ? "white" : "var(--navy)"}>
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

/** A face small and still, for the overview of the four. */
export function PyraFaceThumb({
  face,
  colors,
  problems,
}: {
  face: PyraFace;
  colors: readonly (PyraColor | null)[];
  problems?: readonly boolean[];
}) {
  const { stickers } = stickerShapes(face, 100, 0.92);
  return (
    <svg viewBox="0 0 100 100" className="w-full" aria-hidden>
      {stickers.map(({ points }, n) => (
        <polygon
          key={n}
          points={points}
          fill={colors[n] ? CUBE_COLOR_HEX[colors[n]!] : "var(--navy-3)"}
          stroke={problems?.[n] ? "var(--cube-red)" : "none"}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

/** "Pegatina 3 (arista), verde" for the screen readers. */
export function pyraStickerLabel(n: number, color: PyraColor | null, extra = "") {
  const kind = n === 0 || n === 4 || n === 8 ? "punta" : n === 2 || n === 5 || n === 7 ? "centro" : "arista";
  return `Pegatina ${n + 1} (${kind}), ${color ? PYRA_COLOR_NAMES[color] : "sin color"}${extra}`;
}
