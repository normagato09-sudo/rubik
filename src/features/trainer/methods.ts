import type { TrainerOption } from "./types";

/** Solving methods for 3x3. Only CFOP is active today. */
export const METHODS: TrainerOption[] = [
  { id: "cfop", label: "CFOP", status: "active" },
  { id: "roux", label: "Roux", status: "coming-soon" },
  { id: "zz", label: "ZZ", status: "coming-soon" },
  { id: "petrus", label: "Petrus", status: "coming-soon" },
  { id: "lbl", label: "LBL", status: "coming-soon" },
];

export const DEFAULT_METHOD_ID = "cfop";
