import type { LearningCategoryId } from "../categories";

/**
 * A 3×3 face where the highlighted cells hint at what each category
 * works on: a turning column (notation), the cross (learning steps),
 * the first two layers (F2L) or the last layer (OLL/PLL).
 */
const HIGHLIGHTED: Record<LearningCategoryId, number[]> = {
  notation: [2, 5, 8],
  steps: [1, 3, 4, 5, 7],
  f2l: [3, 4, 5, 6, 7, 8],
  oll: [0, 1, 2],
  pll: [0, 2],
};

export function CategoryIcon({
  id,
  accent,
  className = "",
}: {
  id: LearningCategoryId;
  accent: string;
  className?: string;
}) {
  const highlighted = HIGHLIGHTED[id];
  return (
    <svg viewBox="0 0 30 30" className={className} aria-hidden="true">
      {Array.from({ length: 9 }, (_, cell) => (
        <rect
          key={cell}
          x={(cell % 3) * 10 + 1}
          y={Math.floor(cell / 3) * 10 + 1}
          width={8}
          height={8}
          rx={2}
          fill={highlighted.includes(cell) ? accent : "currentColor"}
          opacity={highlighted.includes(cell) ? 1 : 0.22}
        />
      ))}
    </svg>
  );
}
