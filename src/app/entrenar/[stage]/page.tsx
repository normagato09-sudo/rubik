import Link from "next/link";
import { notFound } from "next/navigation";
import { CrossTrainer } from "@/features/trainings/components/CrossTrainer";
import { CFOP_STAGES } from "@/features/trainer/cfop";

export function generateStaticParams() {
  // F2L has its own static route (/entrenar/f2l) inside the new Aprender.
  return CFOP_STAGES.filter((stage) => stage.id !== "f2l").map((stage) => ({
    stage: stage.id,
  }));
}

export default async function CfopStagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage: stageId } = await params;
  const stage = CFOP_STAGES.find((option) => option.id === stageId);
  if (!stage) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/entrenar"
        className="text-sm text-muted hover:text-foreground"
      >
        ← Entrenar
      </Link>
      {stage.id === "cross" ? (
        <CrossTrainer stage={stage} />
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">
            {stage.label}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Esta sección de CFOP todavía no está implementada. Aquí llegarán
            los casos, algoritmos y práctica de {stage.label}.
          </p>
        </>
      )}
    </div>
  );
}
