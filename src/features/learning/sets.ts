import type { AlgorithmCase, AlgorithmSetId } from "./algorithm-sets";
import { F2L_CASES } from "./f2l-cases";
import { OLL_CASES } from "./oll-cases";
import { PLL_CASES } from "./pll-cases";

/** Every Aprender category that is a list of cases with algorithms. */
export const ALGORITHM_SETS: Record<AlgorithmSetId, AlgorithmCase[]> = {
  f2l: F2L_CASES,
  oll: OLL_CASES,
  pll: PLL_CASES,
};

export function isAlgorithmSetId(id: string): id is AlgorithmSetId {
  return id in ALGORITHM_SETS;
}

export function getCase(setId: AlgorithmSetId, caseId: string): AlgorithmCase | undefined {
  return ALGORITHM_SETS[setId].find((algorithmCase) => algorithmCase.id === caseId);
}
