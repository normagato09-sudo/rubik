import type { MethodOption } from "./types";

/**
 * Solving methods. Each is scoped to one cube type via `cubeType` — a
 * method never appears as an option for a cube type it doesn't belong
 * to (e.g. CFOP only ever shows up for `cubeType: "3x3"`). Active today:
 * CFOP for the 3x3, Ortega and CLL for the 2x2, and for the Pyraminx
 * Por capas, Keyhole, L4E intuitivo, 1-Flip, WO and L4E (easiest first) — the methods Aprender
 * teaches (features/learning/categories.ts).
 */
export const METHODS: MethodOption[] = [
  { id: "cfop", label: "CFOP", status: "active", cubeType: "3x3" },
  { id: "roux", label: "Roux", status: "coming-soon", cubeType: "3x3" },
  { id: "zz", label: "ZZ", status: "coming-soon", cubeType: "3x3" },
  { id: "petrus", label: "Petrus", status: "coming-soon", cubeType: "3x3" },
  { id: "lbl", label: "LBL", status: "coming-soon", cubeType: "3x3" },
  { id: "ortega", label: "Ortega", status: "active", cubeType: "2x2" },
  { id: "cll", label: "CLL", status: "active", cubeType: "2x2" },
  { id: "por-capas", label: "Por capas", status: "active", cubeType: "pyraminx" },
  { id: "keyhole", label: "Keyhole", status: "active", cubeType: "pyraminx" },
  { id: "l4e-intuitivo", label: "L4E intuitivo", status: "active", cubeType: "pyraminx" },
  { id: "1-flip", label: "1-Flip", status: "active", cubeType: "pyraminx" },
  { id: "wo", label: "WO", status: "active", cubeType: "pyraminx" },
  { id: "l4e", label: "L4E", status: "active", cubeType: "pyraminx" },
];

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
