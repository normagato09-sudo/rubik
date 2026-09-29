import type { LearningCategoryId } from "../categories";

/**
 * A cube face where the highlighted cells hint at what each category
 * works on. 3×3: a turning column (notation), the cross (learning steps),
 * the first two layers (F2L) or the last layer (OLL/PLL). 2×2: a turning
 * column (notation), the bottom layer (first face/layer) or the top layer
 * (OLL, PBL, CLL).
 */
const HIGHLIGHTED_3X3: Partial<Record<LearningCategoryId, number[]>> = {
  notation: [2, 5, 8],
  steps: [1, 3, 4, 5, 7],
  f2l: [3, 4, 5, 6, 7, 8],
  oll: [0, 1, 2],
  pll: [0, 2],
};

const HIGHLIGHTED_2X2: Partial<Record<LearningCategoryId, number[]>> = {
  notation: [1, 3],
  steps: [2, 3],
  "ortega-oll": [0, 1],
  "ortega-pbl": [0, 3],
  cll: [0, 1],
};

export function CategoryIcon({
  id,
  cube = "3x3",
  accent,
  className = "",
}: {
  id: LearningCategoryId;
  cube?: "3x3" | "2x2";
  accent: string;
  className?: string;
}) {
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
