import Link from "next/link";
import type { CfopStage } from "@/features/trainer/cfop";

export function CfopStageCard({
  stage,
  index,
}: {
  stage: CfopStage;
  index: number;
}) {
  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/30">
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold"
          style={{ backgroundColor: `${stage.accent}1f`, color: stage.accent }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: stage.accent }}
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {stage.label}
        </h3>
        <p className="text-sm leading-relaxed text-muted">
          {stage.description}
        </p>
      </div>

      <Link
        href={`/entrenar/${stage.id}`}
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80"
      >
        Entrenar
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
