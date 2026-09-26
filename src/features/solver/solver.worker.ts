/**
 * Runs the two-phase solver off the main thread: building its tables takes
 * about a second, and a search a few hundred milliseconds more.
 */
import { handleSolverRequest, type SolverRequest, type SolverResponse } from "./solver-requests";

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<SolverRequest>) => void) | null;
  postMessage: (message: SolverResponse) => void;
};

ctx.onmessage = (event: MessageEvent<SolverRequest>) => {
  const response = handleSolverRequest(event.data);
  if (response) ctx.postMessage(response);
};
