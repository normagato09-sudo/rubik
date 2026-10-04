import { stickerCorners, type Vec2 } from "@/features/pyraminx/geometry";
import type { LearningCategoryId, LearningCube } from "../categories";

/**
 * A cube face where the highlighted cells hint at what each category
 * works on. 3×3: a turning column (notation), the cross (learning steps),
 * the first two layers (F2L) or the last layer (OLL/PLL). 2×2: a turning
 * column (notation), the bottom layer (first face/layer) or the top layer
 * (OLL, PBL, CLL). Pyraminx: a face of 9 triangles — the top layer
 * (notation), the tips (steps) or the top edges (last layer, L4E).
 */
const HIGHLIGHTED_3X3: Partial<Record<LearningCategoryId, number[]>> = {
  notation: [2, 5, 8],
  steps: [1, 3, 4, 5, 7],
  f2l: [3, 4, 5, 6, 7, 8],
  oll: [0, 1, 2],
  pll: [0, 2],
  "petrus-coll": [0, 2],
  "petrus-epll": [1],
  "zz-ocll": [0, 2],
  "zz-pll": [0, 2],
  "roux-cmll": [0, 2],
  "roux-eo": [1, 4, 7],
  "roux-ulur": [3, 5],
  "roux-capa-m": [1, 4, 7],
};

const HIGHLIGHTED_2X2: Partial<Record<LearningCategoryId, number[]>> = {
  notation: [1, 3],
  steps: [2, 3],
  "ortega-oll": [0, 1],
  "ortega-pbl": [0, 3],
  cll: [0, 1],
};

const HIGHLIGHTED_PYRAMINX: Partial<Record<LearningCategoryId, number[]>> = {
  notation: [0, 1, 2, 3],
  steps: [0, 4, 8],
  "pyra-ultima-capa": [1, 3],
  l4e: [1, 3, 6],
  "keyhole-l3e": [1, 3, 6],
  "l4ei-l3e": [1, 3, 6],
  "oka-cierre": [2, 5, 7],
  "oka-l3e": [1, 3, 6],
  "1flip-l3c": [2, 5, 7],
  "1flip-l3e": [1, 3, 6],
  "wo-l3c": [2, 5, 7],
  "wo-l3e": [1, 3, 6],
  "nutella-l3c": [2, 5, 7],
  "nutella-l3e": [1, 3, 6],
};

const PYRA_FACE: [Vec2, Vec2, Vec2] = [
  [15, 2],
  [0, 28],
  [30, 28],
];

/** Each triangle drawn a little smaller than its place, so they read as separate stickers. */
function pyraSticker(n: number): string {
  const corners = stickerCorners(...PYRA_FACE, n);
  const [cx, cy] = [0, 1].map((k) => corners.reduce((sum, p) => sum + p[k], 0) / 3);
  return corners.map(([x, y]) => `${cx + (x - cx) * 0.78},${cy + (y - cy) * 0.78}`).join(" ");
}

export function CategoryIcon({
  id,
  cube = "3x3",
  accent,
  className = "",
}: {
  id: LearningCategoryId;
  cube?: LearningCube;
  accent: string;
  className?: string;
}) {
  if (cube === "pyraminx") {
    const highlighted = HIGHLIGHTED_PYRAMINX[id] ?? [];
    return (
      <svg viewBox="0 0 30 30" className={className} aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <polygon
            key={index}
            points={pyraSticker(index)}
            strokeLinejoin="round"
            fill={highlighted.includes(index) ? accent : "currentColor"}
            opacity={highlighted.includes(index) ? 1 : 0.22}
          />
        ))}
      </svg>
    );
  }
  const size = cube === "2x2" ? 2 : 3;
  const highlighted = (cube === "2x2" ? HIGHLIGHTED_2X2 : HIGHLIGHTED_3X3)[id] ?? [];
  const cell = 30 / size;
  return (
    <svg viewBox="0 0 30 30" className={className} aria-hidden="true">
      {Array.from({ length: size * size }, (_, index) => (
        <rect
          key={index}
          x={(index % size) * cell + 1}
          y={Math.floor(index / size) * cell + 1}
          width={cell - 2}
          height={cell - 2}
          rx={2}
          fill={highlighted.includes(index) ? accent : "currentColor"}
          opacity={highlighted.includes(index) ? 1 : 0.22}
        />
      ))}
    </svg>
  );
}
