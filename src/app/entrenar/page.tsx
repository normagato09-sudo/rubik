import { isLearningCategoryId } from "@/features/learning/categories";
import { LearnScreen } from "@/features/learning/components/LearnScreen";

export const metadata = {
  title: "Aprender — RUBIKO",
};

export default async function AprenderPage({ searchParams }: PageProps<"/entrenar">) {
  // `?abierto=oll` keeps that block open when coming back from one of its cases.
  const { abierto } = await searchParams;
  return (
    <LearnScreen
      initialExpanded={typeof abierto === "string" && isLearningCategoryId(abierto) ? [abierto] : []}
    />
  );
}
