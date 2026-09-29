export type LearningCategoryId =
  | "notation"
  | "steps"
  | "f2l"
  | "oll"
  | "pll"
  | "ortega-oll"
  | "ortega-pbl"
  | "cll";

export interface LearningCategory {
  id: LearningCategoryId;
  title: string;
  description: string;
  accent: string;
}

/** The methods Aprender teaches — the active ones of features/trainer/methods.ts. */
export type LearningMethodId = "cfop" | "ortega" | "cll";

export const DEFAULT_LEARNING_METHOD: LearningMethodId = "cfop";

/** Which cube each method is for (matches features/trainer/methods.ts). */
export const METHOD_CUBE: Record<LearningMethodId, "3x3" | "2x2"> = {
  cfop: "3x3",
  ortega: "2x2",
  cll: "2x2",
};

export function isLearningMethodId(id: string): id is LearningMethodId {
  return id in METHOD_CUBE;
}

const NOTATION = { id: "notation", accent: "#38bdf8" } as const;
const STEPS = { id: "steps", accent: "#34d399" } as const;

/**
 * The blocks of the Aprender screen, in order, for each method. Each one
 * has real content from a source in docs/source. New methods (Roux, ZZ...)
 * are added here once they have that content too.
 */
export const METHOD_CATEGORIES: Record<LearningMethodId, LearningCategory[]> = {
  cfop: [
    {
      ...NOTATION,
      title: "Notación del Cubo",
      description: "Aprende los giros básicos para leer algoritmos",
    },
    {
      // Its content is the ordered list of steps in sets.ts (LEARNING_STEPS).
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Aprende a resolver el 3×3 paso a paso",
    },
    {
      id: "f2l",
      title: "F2L (CFOP)",
      description: "Resuelve las primeras dos capas simultáneamente",
      accent: "#ff8c1a",
    },
    {
      id: "oll",
      title: "OLL (CFOP)",
      description: "Orienta la última capa de tu cubo",
      accent: "#facc15",
    },
    {
      id: "pll",
      title: "PLL (CFOP)",
      description: "Permuta las piezas de la última capa",
      accent: "#a78bfa",
    },
  ],
  ortega: [
    {
      ...NOTATION,
      title: "Notación del 2×2",
      description: "Aprende los giros del 2×2 para leer algoritmos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Empieza el 2×2 con una cara de un color",
    },
    {
      id: "ortega-oll",
      title: "OLL (Ortega)",
      description: "Orienta la cara de arriba del 2×2",
      accent: "#facc15",
    },
    {
      id: "ortega-pbl",
      title: "PBL (Ortega)",
      description: "Coloca las esquinas de las dos capas a la vez",
      accent: "#a78bfa",
    },
  ],
  cll: [
    {
      ...NOTATION,
      title: "Notación del 2×2",
      description: "Aprende los giros del 2×2 para leer algoritmos",
    },
    {
      ...STEPS,
      title: "Pasos de aprendizaje",
      description: "Empieza el 2×2 con la primera capa completa",
    },
    {
      id: "cll",
      title: "CLL",
      description: "Resuelve la última capa del 2×2 con un solo algoritmo",
      accent: "#f472b6",
    },
  ],
};

/** The 3×3 (CFOP) blocks. */
export const LEARNING_CATEGORIES = METHOD_CATEGORIES.cfop;

export function getCategory(
  id: LearningCategoryId,
  method: LearningMethodId = DEFAULT_LEARNING_METHOD,
): LearningCategory {
  return METHOD_CATEGORIES[method].find((category) => category.id === id)!;
}

export function isLearningCategoryId(
  id: string,
  method: LearningMethodId = DEFAULT_LEARNING_METHOD,
): id is LearningCategoryId {
  return METHOD_CATEGORIES[method].some((category) => category.id === id);
}

/** Aprender for one method: the 3×3 keeps its plain /entrenar address. */
export function learnHref(method: LearningMethodId, open?: LearningCategoryId): string {
  const params = new URLSearchParams();
  if (method !== DEFAULT_LEARNING_METHOD) params.set("metodo", method);
  if (open) params.set("abierto", open);
  const query = params.toString();
  return query ? `/entrenar?${query}` : "/entrenar";
}
