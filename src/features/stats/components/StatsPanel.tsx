import { formatTime } from "@/features/timer/engine";
import type { EvolutionPoint, StatsSummary } from "../types";

/**
 * Purely presentational: receives already-computed data, never touches
 * the store or the history directly. Rendering-only, so it's trivial to
 * reason about (and to reuse) independently of where the data comes from.
 */
export function StatsPanel({
  stats,
  evolution,
}: {
  stats: StatsSummary;
  evolution: EvolutionPoint[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Resumen">
        <Stat label="Total de solves" value={String(stats.totalSolves)} />
        <Stat label="Mejor solve" value={formatNullableTime(stats.bestSolveMs)} />
        <Stat label="Media" value={formatNullableTime(stats.averageMs)} />
        <Stat label="Mejor Ao5" value={formatNullableTime(stats.bestAo5Ms)} />
      </Section>

      <Section title="Penalizaciones">
        <Stat label="+2" value={String(stats.plus2Count)} />
        <Stat label="DNF" value={String(stats.dnfCount)} />
        <Stat
          label="% DNF"
          value={stats.dnfPercentage === null ? "—" : `${stats.dnfPercentage.toFixed(1)}%`}
          accent={stats.dnfCount > 0 ? "text-cube-red" : undefined}
        />
      </Section>

      <Section title="Otros datos">
        <Stat label="Tiempo total" value={formatNullableTime(stats.totalTimeMs)} wide />
        <EvolutionChart points={evolution} />
      </Section>
    </div>
  );
}

function formatNullableTime(ms: number | null): string {
  return ms === null ? "—" : formatTime(ms);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  wide,
}: {
  label: string;
  value: string;
  accent?: string;
  wide?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-lg bg-background p-3 ${wide ? "sm:col-span-4" : ""}`}>
      <span className="text-xs text-muted">{label}</span>
      <span className={`font-mono text-lg font-semibold tabular-nums ${accent ?? "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

const CHART_WIDTH = 480;
const CHART_HEIGHT = 120;
const PADDING = 12;

function EvolutionChart({ points }: { points: EvolutionPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="sm:col-span-4">
        <span className="mb-2 block text-xs text-muted">Evolución de solves</span>
        <p className="rounded-lg bg-background p-4 text-sm text-muted">
          Aún no hay resoluciones para mostrar la evolución.
        </p>
      </div>
    );
  }

  const numericValues = points
    .map((p) => p.value)
    .filter((v): v is number => typeof v === "number");
  const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const max = numericValues.length > 0 ? Math.max(...numericValues) : 1;
  const range = max - min || 1;
  const plotHeight = CHART_HEIGHT - PADDING * 2;
  const stepX = points.length > 1 ? (CHART_WIDTH - PADDING * 2) / (points.length - 1) : 0;

  const xAt = (i: number) => PADDING + i * stepX;
  // Smaller (better) times sit lower on the chart, larger ones higher —
  // the standard reading direction: a line trending down means improving.
  const yAt = (value: number) => PADDING + (1 - (value - min) / range) * plotHeight;
  const dnfY = PADDING;

  const linePath = points
    .map((p, i) => (typeof p.value === "number" ? `${xAt(i)},${yAt(p.value)}` : null))
    .filter((segment): segment is string => segment !== null);

  // Break the line around any DNF so it never implies a fake time there.
  const segments: string[][] = [];
  let current: string[] = [];
  points.forEach((p, i) => {
    if (typeof p.value === "number") {
      current.push(`${xAt(i)},${yAt(p.value)}`);
    } else if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  });
  if (current.length > 0) segments.push(current);
  void linePath;

  return (
    <div className="sm:col-span-4">
      <span className="mb-2 block text-xs text-muted">Evolución de solves</span>
      <div className="rounded-lg bg-background p-3">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-28 w-full"
          role="img"
          aria-label="Evolución de los tiempos de resolución en orden cronológico"
        >
          {segments.map((segment, i) => (
            <polyline
              key={i}
              points={segment.join(" ")}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {points.map((p, i) => {
            const isDnf = p.value === "dnf";
            return (
              <circle
                key={p.id}
                cx={xAt(i)}
                cy={isDnf ? dnfY : yAt(p.value as number)}
                r={isDnf ? 4 : 3}
                fill={isDnf ? "var(--cube-red)" : "var(--accent)"}
              >
                <title>{`#${p.index}: ${isDnf ? "DNF" : formatTime(p.value as number)}`}</title>
              </circle>
            );
          })}
        </svg>
        <p className="mt-1 text-xs text-muted">
          Línea: tiempo de resolución (con +2 aplicado). Puntos rojos: DNF.
        </p>
      </div>
    </div>
  );
}
