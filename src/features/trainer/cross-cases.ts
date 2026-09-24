import { createSolvedCube } from "@/features/cube/model";
import { applyMoves, invertMoves } from "@/features/cube/moves";
import type { Move } from "@/features/cube/moves";
import type { CubeState } from "@/features/cube/types";

/**
 * The 4 titled white-cross cases from ruwix.com's beginner tutorial,
 * "Step 1: First Layer Edges"
 * (https://ruwix.com/the-rubiks-cube/how-to-solve-the-rubiks-cube-beginners-method/step-1-first-layer-edges/).
 * Algorithm text and situation descriptions are taken from that page —
 * not invented here. The page also shows a 5th, untitled bonus example
 * under "From The Middle Layer" (`U' R' U`), deliberately left out: only
 * these 4 have their own heading.
 */
export interface CrossCase {
  id: string;
  label: string;
  description: string;
  /** Exact algorithm from the reference, in RUBIKO's move notation. */
  algorithm: Move[];
}

export const CROSS_CASES: CrossCase[] = [
  {
    id: "flip-edge",
    label: "Voltear una arista",
    description:
      "Las otras tres aristas de la cruz ya están colocadas. La última está en la capa superior, pero mal orientada: el blanco mira hacia el lateral en vez de hacia arriba.",
    algorithm: ["F", "U'", "R", "U"],
  },
  {
    id: "bottom-layer",
    label: "Desde la capa inferior",
    description:
      "La última arista blanca está en la cara frontal, en la capa inferior. Subirla directamente la dejaría mal orientada.",
    algorithm: ["F'", "U'", "R", "U"],
  },
  {
    id: "middle-layer",
    label: "Desde la capa central",
    description: "La última arista está atrapada en la capa central (el ecuador), mal orientada.",
    algorithm: ["U'", "R", "U"],
  },
  {
    id: "middle-layer-mirror",
    label: "Desde la capa central (espejo)",
    description: "El mismo caso anterior, en espejo.",
    algorithm: ["U", "L'", "U'"],
  },
];

/**
 * The exact cube state the case's algorithm is designed to solve: the
 * inverse of the algorithm applied to a solved cube. Solving the case
 * (playing its algorithm forward from here) always returns to solved —
 * a property of the inverse, not a hand-picked scramble.
 */
export function startingStateFor(kase: CrossCase): CubeState {
  return applyMoves(createSolvedCube(), invertMoves(kase.algorithm));
}
