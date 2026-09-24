import { notFound } from "next/navigation";
import { caseTitle } from "@/features/learning/algorithm-sets";
import { CaseDetail } from "@/features/learning/components/CaseDetail";
import { ALGORITHM_SETS, getCase, getSetInfo, isAlgorithmSetId } from "@/features/learning/sets";

export function generateStaticParams() {
  return Object.entries(ALGORITHM_SETS).flatMap(([stage, cases]) =>
    cases.map((algorithmCase) => ({ stage, caseId: algorithmCase.id })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/entrenar/[stage]/[caseId]">) {
  const { stage, caseId } = await params;
  if (!isAlgorithmSetId(stage)) return {};
  const algorithmCase = getCase(stage, caseId);
  if (!algorithmCase) return {};
  return { title: `${getSetInfo(stage).title} · ${caseTitle(algorithmCase)} — RUBIKO` };
}

export default async function AlgorithmCasePage({
  params,
}: PageProps<"/entrenar/[stage]/[caseId]">) {
  const { stage, caseId } = await params;
  if (!isAlgorithmSetId(stage) || !getCase(stage, caseId)) notFound();
  return <CaseDetail setId={stage} caseId={caseId} />;
}
