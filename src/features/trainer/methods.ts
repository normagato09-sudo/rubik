import type { MethodLevel, MethodOption } from "./types";

/**
 * Solving methods. Each is scoped to one cube type via `cubeType` — a
 * method never appears as an option for a cube type it doesn't belong
 * to (e.g. CFOP only ever shows up for `cubeType: "3x3"`). Active today:
 * CFOP for the 3x3, Ortega and CLL for the 2x2, and for the Pyraminx
 * Por capas, Keyhole, L4E intuitivo, L4E, Oka, 1-Flip, WO and Nutella — the methods Aprender
 * teaches (features/learning/categories.ts). Each active method has its
 * level, and each cube lists them easiest first (docs/plan-metodos.md).
 */
export const METHODS: MethodOption[] = [
  { id: "cfop", label: "CFOP", status: "active", cubeType: "3x3", level: "Intermedio" },
  { id: "roux", label: "Roux", status: "coming-soon", cubeType: "3x3" },
  { id: "zz", label: "ZZ", status: "coming-soon", cubeType: "3x3" },
  { id: "petrus", label: "Petrus", status: "coming-soon", cubeType: "3x3" },
  { id: "lbl", label: "LBL", status: "coming-soon", cubeType: "3x3" },
  { id: "ortega", label: "Ortega", status: "active", cubeType: "2x2", level: "Intermedio" },
  { id: "cll", label: "CLL", status: "active", cubeType: "2x2", level: "Avanzado" },
  { id: "por-capas", label: "Por capas", status: "active", cubeType: "pyraminx", level: "Principiante" },
  { id: "keyhole", label: "Keyhole", status: "active", cubeType: "pyraminx", level: "Intermedio" },
  { id: "l4e-intuitivo", label: "L4E intuitivo", status: "active", cubeType: "pyraminx", level: "Intermedio" },
  { id: "l4e", label: "L4E", status: "active", cubeType: "pyraminx", level: "Intermedio" },
  { id: "oka", label: "Oka", status: "active", cubeType: "pyraminx", level: "Avanzado" },
  { id: "1-flip", label: "1-Flip", status: "active", cubeType: "pyraminx", level: "Avanzado" },
  { id: "wo", label: "WO", status: "active", cubeType: "pyraminx", level: "Avanzado" },
  { id: "nutella", label: "Nutella", status: "active", cubeType: "pyraminx", level: "Experto" },
];

/** Easiest first: the order of the levels in the Método selector. */
export const LEVELS: MethodLevel[] = ["Principiante", "Intermedio", "Avanzado", "Experto"];

/** The level of a method, by id. */
export function getMethodLevel(methodId: string): MethodLevel | undefined {
  return METHODS.find((method) => method.id === methodId)?.level;
}

export const DEFAULT_METHOD_ID = "cfop";

/** Methods available for one cube type — the "Cubo → Método" relation. */
export function getMethodsForCubeType(cubeType: string): MethodOption[] {
  return METHODS.filter((method) => method.cubeType === cubeType);
}

/**
 * What the Método selector shows: only methods that are active today.
 * "Coming soon" methods stay in METHODS for later, but are not listed.
 */
export function getSelectableMethodsForCubeType(cubeType: string): MethodOption[] {
  return getMethodsForCubeType(cubeType).filter((method) => method.status === "active");
}
