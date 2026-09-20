import Link from "next/link";
import type { CfopStage } from "@/features/trainer/cfop";

export function CfopStageCard({ stage }: { stage: CfopStage }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <span
        className="h-1.5 w-10 rounded-full"
        style={{ backgroundColor: stage.accent }}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {stage.label}
        </h3>
        <p className="text-sm leading-relaxed text-muted">
          {stage.description}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full w-0 rounded-full" style={{ backgroundColor: stage.accent }} />
        </div>
        <span className="text-xs text-muted">Progreso: sin datos todavía</span>
      </div>

      <Link
        href={`/entrenar/${stage.id}`}
        className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80"
      >
        Entrenar
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
