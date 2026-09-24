export type LearningCategoryId = "notation" | "f2l" | "oll" | "pll";

export interface LearningCategory {
  id: LearningCategoryId;
  title: string;
  description: string;
  accent: string;
}

/**
 * The blocks of the Aprender screen, in order. Each one has real content
 * from a source in docs/source. New methods (Roux, ZZ...) are added here
 * once they have that content too.
 */
export const LEARNING_CATEGORIES: LearningCategory[] = [
  {
    id: "notation",
    title: "Notación del Cubo",
    description: "Aprende los giros básicos para leer algoritmos",
    accent: "#38bdf8",
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
];

export function getCategory(id: LearningCategoryId): LearningCategory {
  return LEARNING_CATEGORIES.find((category) => category.id === id)!;
}

export function isLearningCategoryId(id: string): id is LearningCategoryId {
  return LEARNING_CATEGORIES.some((category) => category.id === id);
}
