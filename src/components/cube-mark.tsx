const FACE_COLORS = [
  "bg-cube-white",
  "bg-cube-red",
  "bg-cube-blue",
  "bg-cube-yellow",
  "bg-cube-orange",
  "bg-cube-green",
  "bg-cube-yellow",
  "bg-cube-white",
  "bg-cube-red",
] as const;

export function CubeMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-3 gap-[3px] rounded-md bg-border p-[3px] ${className}`}
      aria-hidden="true"
    >
      {FACE_COLORS.map((color, i) => (
        <span key={i} className={`aspect-square rounded-[2px] ${color}`} />
      ))}
    </div>
  );
}
