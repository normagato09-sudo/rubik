import { CfopStageCard } from "@/features/trainer/components/cfop-stage-card";
import { CFOP_STAGES } from "@/features/trainer/cfop";
import { CUBES } from "@/features/trainer/cubes";
import { METHODS } from "@/features/trainer/methods";

export const metadata = {
  title: "Entrenar — RUBIKO",
};

export default function EntrenarPage() {
  const cube = CUBES.find((option) => option.status === "active");
  const method = METHODS.find((option) => option.status === "active");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {cube?.label} · Método activo
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {method?.label}
        </h1>
        <div className="flex flex-wrap gap-2">
          {CFOP_STAGES.map((stage) => (
            <span
              key={stage.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: stage.accent }}
                aria-hidden="true"
              />
              {stage.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CFOP_STAGES.map((stage, i) => (
          <CfopStageCard key={stage.id} stage={stage} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
