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
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          {cube?.label} · {method?.label}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {method?.label}
        </h1>
        <p className="text-sm text-muted">
          {CFOP_STAGES.map((stage) => stage.label).join(" · ")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CFOP_STAGES.map((stage) => (
          <CfopStageCard key={stage.id} stage={stage} />
        ))}
      </div>
    </div>
  );
}
