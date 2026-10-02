import type { MethodLevel } from "@/features/trainer/types";

/** Easiest in green, hardest in red: the cube's own colors. */
const LEVEL_CLASS: Record<MethodLevel, string> = {
  Principiante: "bg-cube-green/15 text-cube-green",
  Intermedio: "bg-cube-yellow/15 text-cube-yellow",
  Avanzado: "bg-cube-orange/15 text-cube-orange",
  Experto: "bg-cube-red/15 text-cube-red",
};

/** A method's level (Principiante → Experto) as a small pill. */
export function LevelBadge({ level, className = "" }: { level: MethodLevel; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${LEVEL_CLASS[level]} ${className}`}
    >
      {level}
    </span>
  );
}
