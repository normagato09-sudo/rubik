import { splitAlgorithm } from "./algorithm";

export type AlgorithmSetId = "cruz" | "esquinas" | "f2l" | "oll" | "pll";

export interface AlgorithmCase {
  setId: AlgorithmSetId;
  /** Two-digit, 1-based position in the source ("01", "02"...). Used in URLs. */
  id: string;
  number: number;
  /** Name given by the source, when it has one (PLL: "Ua", "T"...). */
  name?: string;
  /** Exactly as written in the source; only the apostrophe glyph is normalized (’ → '). */
  algorithm: string;
  /** Static diagram taken from the same row/cell of the source. */
  image: string;
}

/** Natural size of each set's diagrams, for next/image. */
export const IMAGE_SIZE: Record<AlgorithmSetId, { width: number; height: number }> = {
  cruz: { width: 128, height: 128 },
  esquinas: { width: 128, height: 128 },
  f2l: { width: 151, height: 161 },
  oll: { width: 200, height: 200 },
  pll: { width: 200, height: 200 },
};

export function buildCases(
  setId: AlgorithmSetId,
  entries: readonly (string | { name: string; algorithm: string })[],
): AlgorithmCase[] {
  return entries.map((entry, index) => {
    const id = String(index + 1).padStart(2, "0");
    const { name, algorithm } =
      typeof entry === "string" ? { name: undefined, algorithm: entry } : entry;
    return {
      setId,
      id,
      number: index + 1,
      ...(name ? { name } : {}),
      algorithm,
      image: `/learning/${setId}/${setId}-${id}.png`,
    };
  });
}

export function getSteps(algorithmCase: AlgorithmCase): string[] {
  return splitAlgorithm(algorithmCase.algorithm);
}

/** "Caso 07", or "Caso 08 · T" when the source names the case. */
export function caseTitle(algorithmCase: AlgorithmCase): string {
  return algorithmCase.name
    ? `Caso ${algorithmCase.id} · ${algorithmCase.name}`
    : `Caso ${algorithmCase.id}`;
}

/** Previous/next case in source order; `undefined` at either end (no wrap-around). */
export function getAdjacentCases(
  cases: AlgorithmCase[],
  id: string,
): { previous?: AlgorithmCase; next?: AlgorithmCase } {
  const index = cases.findIndex((algorithmCase) => algorithmCase.id === id);
  if (index === -1) return {};
  return { previous: cases[index - 1], next: cases[index + 1] };
}

const compact = (text: string) => text.toLowerCase().replace(/’/g, "'").replace(/\s+/g, "");

/**
 * Matches by case number ("7", "07", "caso 7"), by name ("T", "ga"; a
 * prefix like "g" finds every G perm) or by algorithm, ignoring spaces and
 * letter case so "ur u'r'" still finds `U R U' R'`.
 */
export function matchesCase(algorithmCase: AlgorithmCase, query: string): boolean {
  const q = compact(query);
  if (q.length === 0) return true;
  const numberQuery = q.replace(/^(caso|cruz|esquinas|f2l|oll|pll)/, "");
  if (/^\d+$/.test(numberQuery)) return Number(numberQuery) === algorithmCase.number;
  const name = algorithmCase.name?.toLowerCase();
  if (name && (name.startsWith(q) || `${name}perm` === q || `${name}-perm` === q)) return true;
  return compact(algorithmCase.algorithm).includes(q);
}
