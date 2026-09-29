/**
 * Messages between the solver screen and solver.worker.ts, and what the
 * worker does with each one — kept free of worker globals so it can be
 * tested directly. The same worker solves the 3×3 (two-phase) and the 2×2
 * (optimal); both answer with the moves.
 */
import type { CubeColor } from "@/features/cube/types";
import { initTables2x2 } from "@/features/solver2x2/search";
import { solve2x2 } from "@/features/solver2x2/solve";
import type { CubieCube } from "./cubie";
import { initTables, solve } from "./twophase";

export type SolverRequest =
  | { type: "warmup" }
  | { type: "solve"; id: number; cube: CubieCube }
  | { type: "warmup2x2" }
  | { type: "solve2x2"; id: number; facelets: CubeColor[] };

export type SolverResponse =
  | { type: "ready" }
  | { type: "ready2x2" }
  | { type: "solved"; id: number; moves: string[] }
  | { type: "error"; id: number; message: string };

/** Answers one request; never throws, so the screen always hears back. */
export function handleSolverRequest(request: SolverRequest): SolverResponse | null {
  if (request.type === "warmup" || request.type === "warmup2x2") {
    try {
      if (request.type === "warmup") initTables();
      else initTables2x2();
      return { type: request.type === "warmup" ? "ready" : "ready2x2" };
    } catch {
      // The first "solve" will try again and report the error.
      return null;
    }
  }
  try {
    if (request.type === "solve2x2") {
      return { type: "solved", id: request.id, moves: solve2x2(request.facelets) };
    }
    return { type: "solved", id: request.id, moves: solve(request.cube, { improveForMs: 400 }) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se ha podido resolver.";
    return { type: "error", id: request.id, message };
  }
}
