import { buildCases } from "./algorithm-sets";

/**
 * The 5 cross cases of `docs/source/cruz.docx`, in table order. Algorithms
 * are copied exactly (’ written as ', and case 4's double space collapsed);
 * case 2 really is `F' F'` in the source.
 */
export const CRUZ_CASES = buildCases("cruz", [
  "F'",
  "F' F'",
  "U' R U",
  "F' U' R U",
  "F U' R U",
]);
