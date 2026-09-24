import { buildCases } from "./algorithm-sets";

/**
 * The 4 corner cases of `docs/source/esquinas.docx`, in table order.
 * Algorithms are copied exactly (’ written as '); cases 2 and 4 share an
 * algorithm in the source, with different diagrams.
 */
export const ESQUINAS_CASES = buildCases("esquinas", [
  "R' D' D' R D",
  "R' D' R",
  "L D L'",
  "R' D' R",
]);
