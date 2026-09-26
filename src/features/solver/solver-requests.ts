/**
 * Messages between the solver screen and solver.worker.ts, and what the
 * worker does with each one — kept free of worker globals so it can be
 * tested directly.
 */
import type { CubieCube } from "./cubie";
import { initTables, solve } from "./twophase";

export type SolverRequest = { type: "warmup" } | { type: "solve"; id: number; cube: CubieCube };

export type SolverResponse =
  | { type: "ready" }
  | { type: "solved"; id: number; moves: string[] }
  | { type: "error"; id: number; message: string };

/** Answers one request; never throws, so the screen always hears back. */
export function handleSolverRequest(request: SolverRequest): SolverResponse | null {
  if (request.type === "warmup") {
    try {
      initTables();
      return { type: "ready" };
    } catch {
      // The first "solve" will try again and report the error.
      return null;
    }
  }
  try {
    return { type: "solved", id: request.id, moves: solve(request.cube, { improveForMs: 400 }) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se ha podido resolver.";
    return { type: "error", id: request.id, message };
  }
}
