"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CubieCube } from "./cubie";
import type { SolverRequest, SolverResponse } from "./solver-requests";

/** A search takes well under a second; past this the worker is stuck. */
const TIMEOUT_MS = 30_000;

type Pending = { resolve: (moves: string[]) => void; reject: (error: Error) => void };

/**
 * Owns the solver Web Worker for one screen: starts building its tables as
 * soon as the screen opens, so the first "Resolver" is already fast.
 *
 * Every request ends — with moves or an error — even if the worker fails
 * to load, crashes or hangs: a broken worker is thrown away (the next
 * request starts a fresh one), and without Worker support the solver runs
 * on the main thread.
 */
export function useSolver() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, Pending>());
  const nextId = useRef(1);
  const [ready, setReady] = useState(false);

  const failAll = useCallback((message: string) => {
    for (const { reject } of pending.current.values()) reject(new Error(message));
    pending.current.clear();
  }, []);

  const dropWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setReady(false);
  }, []);

  const startWorker = useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;
    if (typeof Worker === "undefined") return null;
    let worker: Worker;
    try {
      worker = new Worker(new URL("./solver.worker.ts", import.meta.url));
    } catch {
      return null;
    }
    worker.onmessage = (event: MessageEvent<SolverResponse>) => {
      const response = event.data;
      if (response.type === "ready") {
        setReady(true);
        return;
      }
      const request = pending.current.get(response.id);
      pending.current.delete(response.id);
      if (response.type === "solved") request?.resolve(response.moves);
      else request?.reject(new Error(response.message));
    };
    const crash = (event: Event) => {
      event.preventDefault();
      dropWorker();
      failAll("El solucionador ha fallado.");
    };
    worker.onerror = crash;
    worker.onmessageerror = crash;
    worker.postMessage({ type: "warmup" } satisfies SolverRequest);
    workerRef.current = worker;
    return worker;
  }, [dropWorker, failAll]);

  useEffect(() => {
    startWorker();
    const requests = pending.current;
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      requests.clear();
    };
  }, [startWorker]);

  const solve = useCallback(
    (cube: CubieCube) =>
      new Promise<string[]>((resolve, reject) => {
        const worker = startWorker();
        if (!worker) {
          // No Web Worker: solve here, after letting "Calculando…" paint.
          setTimeout(() => {
            import("./solver-requests")
              .then(({ handleSolverRequest }) => {
                const response = handleSolverRequest({ type: "solve", id: 0, cube });
                if (response?.type === "solved") resolve(response.moves);
                else reject(new Error(response?.type === "error" ? response.message : "Sin respuesta."));
              })
              .catch(reject);
          }, 50);
          return;
        }
        const id = nextId.current++;
        const timer = setTimeout(() => {
          if (!pending.current.has(id)) return;
          dropWorker();
          failAll("El solucionador ha tardado demasiado.");
        }, TIMEOUT_MS);
        pending.current.set(id, {
          resolve: (moves) => {
            clearTimeout(timer);
            resolve(moves);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
        worker.postMessage({ type: "solve", id, cube } satisfies SolverRequest);
      }),
    [dropWorker, failAll, startWorker],
  );

  return { ready, solve };
}
