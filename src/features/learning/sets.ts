import type { AlgorithmCase, AlgorithmSetId } from "./algorithm-sets";
import {
  CLL_LEARN_CASES,
  ORTEGA_OLL_CASES,
  ORTEGA_PBL_CASES,
  PRIMERA_CAPA_CASES,
  PRIMERA_CARA_CASES,
} from "./cases-2x2";
import { getCategory, type LearningCategoryId, type LearningMethodId } from "./categories";
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
  "primera-cara": PRIMERA_CARA_CASES,
  "primera-capa": PRIMERA_CAPA_CASES,
  "ortega-oll": ORTEGA_OLL_CASES,
  "ortega-pbl": ORTEGA_PBL_CASES,
  cll: CLL_LEARN_CASES,
};

export interface LearningStep {
  setId: AlgorithmSetId;
  title: string;
  /** What the step is about, shown above its cases (when the source has no cases of its own). */
  intro?: string;
}

/**
 * The "Pasos de aprendizaje" block of each method, in order. To add a
 * step: put its source in docs/source, create `<step>-cases.ts` with
 * buildCases(), register it in ALGORITHM_SETS and add one line here.
 */
export const METHOD_STEPS: Record<LearningMethodId, LearningStep[]> = {
  cfop: [
    { setId: "cruz", title: "Cruz" },
    { setId: "esquinas", title: "Esquinas" },
  ],
  ortega: [
    {
      setId: "primera-cara",
      title: "Primera cara",
      intro:
        "Haz una cara de un solo color abajo; aquí, la blanca. Es el primer paso de Ortega y se hace con intuición: los otros colores de esas esquinas no tienen que coincidir, porque la PBL los coloca al final. Busca una esquina con blanco que esté arriba y gira U hasta dejarla justo encima de su hueco, delante a la derecha. Luego mira hacia dónde apunta su pegatina blanca y usa el caso que toque. Repite con las cuatro esquinas.",
    },
  ],
  cll: [
    {
      setId: "primera-capa",
      title: "Primera capa",
      intro:
        "Haz la capa de abajo completa; aquí, la blanca. Tiene que tener las cuatro esquinas con el blanco abajo y, además, con sus otros colores coincidiendo en cada lado. Así la CLL puede resolver toda la capa de arriba de una vez. Coloca las esquinas de una en una: gira U hasta dejar la esquina encima de su hueco, delante a la derecha, y usa el caso según hacia dónde mire su pegatina blanca.",
    },
  ],
};

/** The 3×3 (CFOP) learning steps. */
export const LEARNING_STEPS = METHOD_STEPS.cfop;

/** Which method teaches each set. */
const SET_METHOD: Record<AlgorithmSetId, LearningMethodId> = {
  cruz: "cfop",
  esquinas: "cfop",
  f2l: "cfop",
  oll: "cfop",
  pll: "cfop",
  "primera-cara": "ortega",
  "primera-capa": "cll",
  "ortega-oll": "ortega",
  "ortega-pbl": "ortega",
  cll: "cll",
};

export interface SetInfo {
  /** The method whose Aprender screen lists this set. */
  method: LearningMethodId;
  /** The Aprender block that lists this set. */
  categoryId: LearningCategoryId;
  /** "F2L (CFOP)", or "Paso 1 · Cruz" for a learning step. */
  title: string;
  accent: string;
}

export function getSetInfo(setId: AlgorithmSetId): SetInfo {
  const method = SET_METHOD[setId];
  const steps = METHOD_STEPS[method];
  const stepIndex = steps.findIndex((step) => step.setId === setId);
  if (stepIndex !== -1) {
    return {
      method,
      categoryId: "steps",
      title: `Paso ${stepIndex + 1} · ${steps[stepIndex].title}`,
      accent: getCategory("steps", method).accent,
    };
  }
  const category = getCategory(setId as LearningCategoryId, method);
  return { method, categoryId: category.id, title: category.title, accent: category.accent };
}

export function isAlgorithmSetId(id: string): id is AlgorithmSetId {
  return id in ALGORITHM_SETS;
}

export function getCase(setId: AlgorithmSetId, caseId: string): AlgorithmCase | undefined {
  return ALGORITHM_SETS[setId].find((algorithmCase) => algorithmCase.id === caseId);
}
