import {
  DEFAULT_LEARNING_METHOD,
  isLearningCategoryId,
  isLearningMethodId,
} from "@/features/learning/categories";
import { LearnScreen } from "@/features/learning/components/LearnScreen";

export const metadata = {
  title: "Aprender — RUBIKO",
};

export default async function AprenderPage({ searchParams }: PageProps<"/entrenar">) {
  // `?metodo=ortega` shows that method's blocks (the 3×3 CFOP ones without it);
  // `?abierto=oll` keeps that block open when coming back from one of its cases.
  const { metodo, abierto } = await searchParams;
  const method =
    typeof metodo === "string" && isLearningMethodId(metodo) ? metodo : DEFAULT_LEARNING_METHOD;
  return (
    <LearnScreen
      key={method}
      method={method}
      initialExpanded={
        typeof abierto === "string" && isLearningCategoryId(abierto, method) ? [abierto] : []
      }
    />
  );
}
