import type { TrainerOption } from "./types";

/** Cubes the trainer can eventually support. 3x3, 2x2 and Pyraminx are active today. */
export const CUBES: TrainerOption[] = [
  { id: "3x3", label: "3×3", status: "active" },
  { id: "2x2", label: "2×2", status: "active" },
  { id: "pyraminx", label: "Pyraminx", status: "active" },
  { id: "skewb", label: "Skewb", status: "coming-soon" },
  { id: "megaminx", label: "Megaminx", status: "coming-soon" },
  { id: "4x4", label: "4×4", status: "coming-soon" },
  { id: "5x5", label: "5×5", status: "coming-soon" },
  { id: "6x6", label: "6×6", status: "coming-soon" },
  { id: "7x7", label: "7×7", status: "coming-soon" },
];

export const DEFAULT_CUBE_ID = "3x3";
