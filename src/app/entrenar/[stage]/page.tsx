import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CrossTrainer } from "@/features/trainings/components/CrossTrainer";
import { CFOP_STAGES } from "@/features/trainer/cfop";

export function generateStaticParams() {
  return CFOP_STAGES.map((stage) => ({ stage: stage.id }));
}

export default async function CfopStagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage: stageId } = await params;
  const stage = CFOP_STAGES.find((option) => option.id === stageId);
  if (!stage) notFound();

  // F2L, OLL and PLL live inside Aprender; their cases are at
  // /entrenar/[stage]/[caseId]. Only the old Cross trainer is kept here.
  if (stage.id !== "cross") redirect(`/entrenar?abierto=${stage.id}`);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/entrenar"
        className="text-sm text-muted hover:text-foreground"
      >
        ← Entrenar
      </Link>
      <CrossTrainer stage={stage} />
    </div>
  );
}
