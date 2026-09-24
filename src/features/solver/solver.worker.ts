/**
 * Runs the two-phase solver off the main thread: building its tables takes
 * about a second, and a search a few hundred milliseconds more.
 */
import type { CubieCube } from "./cubie";
import { initTables, solve } from "./twophase";

export type SolverRequest = { type: "warmup" } | { type: "solve"; id: number; cube: CubieCube };
export type SolverResponse =
  | { type: "ready" }
  | { type: "solved"; id: number; moves: string[] }
  | { type: "error"; id: number; message: string };

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<SolverRequest>) => void) | null;
  postMessage: (message: SolverResponse) => void;
};

ctx.onmessage = (event: MessageEvent<SolverRequest>) => {
  const request = event.data;
  if (request.type === "warmup") {
    initTables();
    ctx.postMessage({ type: "ready" } satisfies SolverResponse);
    return;
  }
  try {
    const moves = solve(request.cube, { improveForMs: 400 });
    ctx.postMessage({ type: "solved", id: request.id, moves } satisfies SolverResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se ha podido resolver.";
    ctx.postMessage({ type: "error", id: request.id, message } satisfies SolverResponse);
  }
};
