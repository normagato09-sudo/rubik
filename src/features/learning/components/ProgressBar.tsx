export function ProgressBar({
  value,
  total,
  accent,
  label,
}: {
  value: number;
  total: number;
  accent: string;
  label: string;
}) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-white/10"
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${percent}%`, backgroundColor: accent }}
      />
    </div>
  );
}
