import { notFound } from "next/navigation";
import { F2LCaseDetail } from "@/features/learning/components/F2LCaseDetail";
import { F2L_CASES, getF2LCase } from "@/features/learning/f2l-cases";

export function generateStaticParams() {
  return F2L_CASES.map((f2lCase) => ({ caseId: f2lCase.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/entrenar/f2l/[caseId]">) {
  const { caseId } = await params;
  return { title: `F2L · Caso ${caseId} — RUBIKO` };
}

export default async function F2LCasePage({ params }: PageProps<"/entrenar/f2l/[caseId]">) {
  const { caseId } = await params;
  if (!getF2LCase(caseId)) notFound();
  return <F2LCaseDetail caseId={caseId} />;
}
