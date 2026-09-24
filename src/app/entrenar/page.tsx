import { LearnScreen } from "@/features/learning/components/LearnScreen";

export const metadata = {
  title: "Aprender — RUBIKO",
};

export default async function AprenderPage({ searchParams }: PageProps<"/entrenar">) {
  // `?abierto=f2l` keeps the F2L block open when coming back from a case.
  const { abierto } = await searchParams;
  return <LearnScreen initialExpanded={abierto === "f2l" ? ["f2l"] : []} />;
}
