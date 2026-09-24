export type LearningCategoryId = "notation" | "beginner" | "f2l" | "oll" | "pll";

export interface LearningCategory {
  id: LearningCategoryId;
  title: string;
  description: string;
  accent: string;
  /**
   * `true` only when real content from a real source exists. Categories
   * without content never show an invented total — they show
   * "Próximamente" instead of an X/Y count.
   */
  available: boolean;
}

/**
 * The blocks of the Aprender screen, in order. New methods (Roux, ZZ...)
 * are added here once they have real content.
 */
export const LEARNING_CATEGORIES: LearningCategory[] = [
  {
    id: "notation",
    title: "Notación del Cubo",
    description: "Aprende los giros básicos para leer algoritmos",
    accent: "#38bdf8",
    available: true,
  },
  {
    id: "beginner",
    title: "Método Principiantes",
    description: "Aprende a resolver el cubo paso a paso",
    accent: "#34d399",
    available: false,
  },
  {
    id: "f2l",
    title: "F2L (CFOP)",
    description: "Resuelve las primeras dos capas simultáneamente",
    accent: "#ff8c1a",
    available: true,
  },
  {
    id: "oll",
    title: "OLL (CFOP)",
    description: "Orienta la última capa de tu cubo",
    accent: "#facc15",
    available: false,
  },
  {
    id: "pll",
    title: "PLL (CFOP)",
    description: "Permuta las piezas de la última capa",
    accent: "#a78bfa",
    available: false,
  },
];

export const F2L_CATEGORY = LEARNING_CATEGORIES.find((category) => category.id === "f2l")!;
