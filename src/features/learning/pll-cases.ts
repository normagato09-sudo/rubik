import { buildCases } from "./algorithm-sets";

/**
 * The 21 PLL cases of `docs/source/pll.docx`, in table order, with the
 * name the source gives each one. Algorithms are copied exactly, including
 * the stray space in Rb's `U2 '`.
 */
export const PLL_CASES = buildCases("pll", [
  { name: "Ua", algorithm: "M2 U M U2 M' U M2" },
  { name: "Ub", algorithm: "M2 U' M U2 M' U' M2" },
  { name: "H", algorithm: "M2 U' M2 U2 M2 U' M2" },
  { name: "Z", algorithm: "M2' U' M2' U' M' U2 M2' U2 M' U2" },
  { name: "Aa", algorithm: "l' U R' D2 R U' R' D2 R2" },
  { name: "Ab", algorithm: "l U' R D2 R' U R D2 R2" },
  { name: "E", algorithm: "x' L' U L D' L' U' L D L' U' L D' L' U L D" },
  { name: "T", algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { name: "F", algorithm: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
  { name: "V", algorithm: "R' U R' U' y R' F' R2 U' R' U R' F R F" },
  { name: "Y", algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { name: "Ja", algorithm: "R' U L' U2 R U' R' U2 R L U'" },
  { name: "Jb", algorithm: "R U R' F' R U R' U' R' F R2 U' R' U'" },
  { name: "Rb", algorithm: "R' U2 R U2 ' R' F R U R' U' R' F' R2 U'" },
  { name: "Ra", algorithm: "R U' R' U' R U R D R' U' R D' R' U2 R' U'" },
  { name: "Gc", algorithm: "R2 U' R U' R U R' U R2 D' U R U' R' D U'" },
  { name: "Gd", algorithm: "R U R' y' R2 u' R U' R' U R' u R2" },
  { name: "Ga", algorithm: "R2 u R' U R' U' R u' R2 y' R' U R" },
  { name: "Gb", algorithm: "F' U' F R2 u R' U R U' R u' R2'" },
  { name: "Nb", algorithm: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },
  { name: "Na", algorithm: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
]);
