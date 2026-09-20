import type { MethodOption } from "./types";

/**
 * Solving methods. Each is scoped to one cube type via `cubeType` — a
 * method never appears as an option for a cube type it doesn't belong
 * to (e.g. CFOP only ever shows up for `cubeType: "3x3"`). Only CFOP is
 * active today.
 */
export const METHODS: MethodOption[] = [
  { id: "cfop", label: "CFOP", status: "active", cubeType: "3x3" },
  { id: "roux", label: "Roux", status: "coming-soon", cubeType: "3x3" },
  { id: "zz", label: "ZZ", status: "coming-soon", cubeType: "3x3" },
  { id: "petrus", label: "Petrus", status: "coming-soon", cubeType: "3x3" },
  { id: "lbl", label: "LBL", status: "coming-soon", cubeType: "3x3" },
];

export const DEFAULT_METHOD_ID = "cfop";

/** Methods available for one cube type — the "Cubo → Método" relation. */
export function getMethodsForCubeType(cubeType: string): MethodOption[] {
  return METHODS.filter((method) => method.cubeType === cubeType);
}
