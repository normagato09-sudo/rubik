"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CubeColor } from "@/features/cube/types";
import type { Method2x2, Solution2x2 } from "@/features/solver2x2/methods";
import type { CubieCube } from "./cubie";
import type { SolverRequest, SolverResponse } from "./solver-requests";

/** A search takes well under a second; past this the worker is stuck. */
const TIMEOUT_MS = 30_000;

type Pending = { resolve: (result: unknown) => void; reject: (error: Error) => void };

/** A solve request before it gets its id. */
type Request =
  | { type: "solve"; cube: CubieCube }
  | { type: "solve2x2"; facelets: CubeColor[]; method: Method2x2 };

/**
 * Owns the solver Web Worker for one screen: starts building its tables as
 * soon as the screen opens, so the first "Resolver" is already fast (the
 * 2×2 tables only once the 2×2 is chosen: `warmup2x2`).
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
  const [ready2x2, setReady2x2] = useState(false);
  const wants2x2 = useRef(false);

  const failAll = useCallback((message: string) => {
    for (const { reject } of pending.current.values()) reject(new Error(message));
    pending.current.clear();
  }, []);

  const dropWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setReady(false);
    setReady2x2(false);
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
      if (response.type === "ready2x2") {
        setReady2x2(true);
        return;
      }
      const request = pending.current.get(response.id);
      pending.current.delete(response.id);
      if (response.type === "solved") request?.resolve(response.moves);
      else if (response.type === "solved2x2") request?.resolve(response.solution);
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
    if (wants2x2.current) worker.postMessage({ type: "warmup2x2" } satisfies SolverRequest);
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

  const request = useCallback(
    (message: Request) =>
      new Promise<unknown>((resolve, reject) => {
        const worker = startWorker();
        if (!worker) {
          // No Web Worker: solve here, after letting "Calculando…" paint.
          setTimeout(() => {
            import("./solver-requests")
              .then(({ handleSolverRequest }) => {
                const response = handleSolverRequest({ ...message, id: 0 } as SolverRequest);
                if (response?.type === "solved") resolve(response.moves);
                else if (response?.type === "solved2x2") resolve(response.solution);
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
          resolve: (result) => {
            clearTimeout(timer);
            resolve(result);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
        worker.postMessage({ ...message, id } as SolverRequest);
      }),
    [dropWorker, failAll, startWorker],
  );

  const solve = useCallback(
    (cube: CubieCube) => request({ type: "solve", cube }) as Promise<string[]>,
    [request],
  );

  const solve2x2 = useCallback(
    (facelets: CubeColor[], method: Method2x2) =>
      request({ type: "solve2x2", facelets, method }) as Promise<Solution2x2>,
    [request],
  );

  /** Starts building the 2×2 tables (about half a second) as soon as the 2×2 is chosen. */
  const warmup2x2 = useCallback(() => {
    if (wants2x2.current) return;
    wants2x2.current = true;
    startWorker()?.postMessage({ type: "warmup2x2" } satisfies SolverRequest);
  }, [startWorker]);

  return { ready, ready2x2, solve, solve2x2, warmup2x2 };
}
