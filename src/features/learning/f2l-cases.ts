import { buildCases } from "./algorithm-sets";

/**
 * The 24 F2L cases of `docs/source/F2L_Complet.pdf` (page 1, www.myrubik.com),
 * in reading order: left to right, top to bottom. Source of truth — do not
 * "fix" or swap these algorithms for other versions.
 */
export const F2L_CASES = buildCases("f2l", [
  "U R U' R'",
  "U' F' U F",
  "F' U' F",
  "R U R'",
  "R U' R' U R U' R' U2",
  "U' R' U2 R U F' U' F",
  "R U' R' U2 F' U' F",
  "F' U F U2 R U R'",
  "U' R U' R' U R U R'",
  "d R' U R U' R' U' R",
  "U F' U' F U2 F' U F",
  "U' R U R' U' R U2 R'",
  "U' R U R' U R U R'",
  "U' R U' R' U F' U' F",
  "y' U' R' U2 R U2 R' U R",
  "U' R U2 R' U2 R U' R'",
  "R U R' U2 R U R' U' R U R'",
  "R U R' U R U2 R' F' U2 F",
  "F' U2 F U F' U' F",
  "R U2 R' U' R U R'",
  "U' F' U2 F U' F' U F",
  "U R U2 R' U R U' R'",
  "U2 R U R' U R U' R'",
  "U2 F' U' F U' F' U F",
]);
