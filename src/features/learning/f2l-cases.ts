import { splitAlgorithm } from "./algorithm";

export interface F2LCase {
  /** Two-digit, 1-based position in the source sheet ("01"–"24"). Used in URLs. */
  id: string;
  number: number;
  /** Exactly as printed in the source; only the apostrophe glyph is normalized (’ → '). */
  algorithm: string;
  /** Static diagram cropped from the same cell of the source sheet. */
  image: string;
}

/**
 * The 24 F2L cases of `docs/source/F2L_Complet.pdf` (page 1, www.myrubik.com),
 * in reading order: left to right, top to bottom. Source of truth — do not
 * "fix" or swap these algorithms for other versions.
 */
const ALGORITHMS = [
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
] as const;

export const F2L_CASES: F2LCase[] = ALGORITHMS.map((algorithm, index) => {
  const id = String(index + 1).padStart(2, "0");
  return {
    id,
    number: index + 1,
    algorithm,
    image: `/learning/f2l/f2l-${id}.png`,
  };
});

export function getF2LCase(id: string): F2LCase | undefined {
  return F2L_CASES.find((f2lCase) => f2lCase.id === id);
}

export function getF2LSteps(f2lCase: F2LCase): string[] {
  return splitAlgorithm(f2lCase.algorithm);
}

/** Previous/next case in sheet order; `undefined` at either end (no wrap-around). */
export function getAdjacentF2LCases(id: string): {
  previous?: F2LCase;
  next?: F2LCase;
} {
  const index = F2L_CASES.findIndex((f2lCase) => f2lCase.id === id);
  if (index === -1) return {};
  return { previous: F2L_CASES[index - 1], next: F2L_CASES[index + 1] };
}

const compact = (text: string) =>
  text.toLowerCase().replace(/’/g, "'").replace(/\s+/g, "");

/**
 * Matches by case number ("7", "07", "caso 7") or by algorithm, ignoring
 * spaces and letter case so "ur u'r'" still finds `U R U' R'`.
 */
export function matchesF2LCase(f2lCase: F2LCase, query: string): boolean {
  const q = compact(query);
  if (q.length === 0) return true;
  const numberQuery = q.replace(/^(caso|f2l)/, "");
  if (/^\d+$/.test(numberQuery)) return Number(numberQuery) === f2lCase.number;
  return compact(f2lCase.algorithm).includes(q) || `caso${f2lCase.id}`.includes(q);
}
