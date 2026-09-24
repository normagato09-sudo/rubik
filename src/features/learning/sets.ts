import type { AlgorithmCase, AlgorithmSetId } from "./algorithm-sets";
import { getCategory, type LearningCategoryId } from "./categories";
import { CRUZ_CASES } from "./cruz-cases";
import { ESQUINAS_CASES } from "./esquinas-cases";
import { F2L_CASES } from "./f2l-cases";
import { OLL_CASES } from "./oll-cases";
import { PLL_CASES } from "./pll-cases";

/** Every list of cases with algorithms, whatever Aprender block shows it. */
export const ALGORITHM_SETS: Record<AlgorithmSetId, AlgorithmCase[]> = {
  cruz: CRUZ_CASES,
  esquinas: ESQUINAS_CASES,
  f2l: F2L_CASES,
  oll: OLL_CASES,
  pll: PLL_CASES,
};

/**
 * The "Pasos de aprendizaje" block: learning steps for the 3×3, in order.
 * To add a step: put its source in docs/source, create `<step>-cases.ts`
 * with buildCases(), register it in ALGORITHM_SETS and add one line here.
 */
export const LEARNING_STEPS: { setId: AlgorithmSetId; title: string }[] = [
  { setId: "cruz", title: "Cruz" },
  { setId: "esquinas", title: "Esquinas" },
];

export interface SetInfo {
  /** The Aprender block that lists this set. */
  categoryId: LearningCategoryId;
  /** "F2L (CFOP)", or "Paso 1 · Cruz" for a learning step. */
  title: string;
  accent: string;
}

export function getSetInfo(setId: AlgorithmSetId): SetInfo {
  const stepIndex = LEARNING_STEPS.findIndex((step) => step.setId === setId);
  if (stepIndex !== -1) {
    return {
      categoryId: "steps",
      title: `Paso ${stepIndex + 1} · ${LEARNING_STEPS[stepIndex].title}`,
      accent: getCategory("steps").accent,
    };
  }
  const category = getCategory(setId as LearningCategoryId);
  return { categoryId: category.id, title: category.title, accent: category.accent };
}

export function isAlgorithmSetId(id: string): id is AlgorithmSetId {
  return id in ALGORITHM_SETS;
}

export function getCase(setId: AlgorithmSetId, caseId: string): AlgorithmCase | undefined {
  return ALGORITHM_SETS[setId].find((algorithmCase) => algorithmCase.id === caseId);
}
