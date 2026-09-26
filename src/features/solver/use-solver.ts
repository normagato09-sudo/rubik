"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CubieCube } from "./cubie";
import type { SolverRequest, SolverResponse } from "./solver.worker";

/**
 * Owns the solver Web Worker for one screen: starts building its tables as
 * soon as the screen opens, so the first "Resolver" is already fast.
 */
export function useSolver() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, (result: SolverResponse) => void>());
  const nextId = useRef(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL("./solver.worker.ts", import.meta.url));
    workerRef.current = worker;
    const callbacks = pending.current;
    worker.onmessage = (event: MessageEvent<SolverResponse>) => {
      const response = event.data;
      if (response.type === "ready") {
        setReady(true);
        return;
      }
      callbacks.get(response.id)?.(response);
      callbacks.delete(response.id);
    };
    // A worker that fails to load or crashes would leave "Calculando…"
    // forever: fail every pending request instead.
    worker.onerror = (event) => {
      event.preventDefault();
      for (const [id, callback] of callbacks) {
        callback({ type: "error", id, message: "El solucionador ha fallado." });
      }
      callbacks.clear();
    };
    worker.postMessage({ type: "warmup" } satisfies SolverRequest);
    return () => {
      worker.terminate();
      workerRef.current = null;
      callbacks.clear();
    };
  }, []);

  const solve = useCallback(
    (cube: CubieCube) =>
      new Promise<string[]>((resolve, reject) => {
        const worker = workerRef.current;
        if (!worker) {
          reject(new Error("El solucionador no está disponible."));
          return;
        }
        const id = nextId.current++;
        pending.current.set(id, (response) => {
          if (response.type === "solved") resolve(response.moves);
          else if (response.type === "error") reject(new Error(response.message));
        });
        worker.postMessage({ type: "solve", id, cube } satisfies SolverRequest);
      }),
    [],
  );

  return { ready, solve };
}
