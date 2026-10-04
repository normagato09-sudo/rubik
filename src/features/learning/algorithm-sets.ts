import type { ResearchSource } from "@/features/pyraminx/research";
import { splitAlgorithm } from "./algorithm";
import type { Research3x3SetId } from "./cases-3x3-research";
import type { ResearchSetId } from "./cases-pyraminx-research";
import type { RouxSetId } from "./cases-roux";
import type { Research2x2SetId } from "./cases-2x2-research";

export type AlgorithmSetId =
  | "cruz"
  | "esquinas"
  | "f2l"
  | "oll"
  | "pll"
  // 2×2 (cases-2x2.ts)
  | "primera-cara"
  | "primera-capa"
  | "ortega-oll"
  | "ortega-pbl"
  | "cll"
  // Pyraminx (cases-pyraminx.ts)
  | "pyra-puntas"
  | "pyra-centros"
  | "pyra-primera-capa"
  | "pyra-ultima-capa"
  | "l4e-puntas"
  | "l4e-v"
  | "l4e"
  // Pyraminx methods taught from research (cases-pyraminx-research.ts)
  | ResearchSetId
  // 3×3 methods taught from research (cases-3x3-research.ts)
  | Research3x3SetId
  // Roux (cases-roux.ts)
  | RouxSetId
  // 2×2 methods taught from research (cases-2x2-research.ts)
  | Research2x2SetId;

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
  /** Short explanation in Spanish of how to recognize the case (2×2 and Pyraminx sets). */
  explanation?: string;
  /** Where the algorithm or diagram does not come from the source, why. */
  note?: string;
  /** Content RUBIKO researched (not from the user's documents): where it comes from. */
  research?: ResearchSource;
}

/** Natural size of each set's diagrams, for next/image. */
export const IMAGE_SIZE: Record<AlgorithmSetId, { width: number; height: number }> = {
  cruz: { width: 128, height: 128 },
  esquinas: { width: 128, height: 128 },
  f2l: { width: 151, height: 161 },
  oll: { width: 200, height: 200 },
  pll: { width: 200, height: 200 },
  "primera-cara": { width: 200, height: 200 },
  "primera-capa": { width: 200, height: 200 },
  "ortega-oll": { width: 200, height: 200 },
  "ortega-pbl": { width: 200, height: 200 },
  cll: { width: 200, height: 200 },
  "pyra-puntas": { width: 200, height: 200 },
  "pyra-centros": { width: 200, height: 200 },
  "pyra-primera-capa": { width: 200, height: 200 },
  "pyra-ultima-capa": { width: 200, height: 200 },
  "l4e-puntas": { width: 200, height: 200 },
  "l4e-v": { width: 200, height: 200 },
  l4e: { width: 200, height: 200 },
  "keyhole-puntas": { width: 200, height: 200 },
  "keyhole-bloque": { width: 200, height: 200 },
  "keyhole-centros": { width: 200, height: 200 },
  "keyhole-arista": { width: 200, height: 200 },
  "keyhole-l3e": { width: 200, height: 200 },
  "l4ei-puntas": { width: 200, height: 200 },
  "l4ei-v": { width: 200, height: 200 },
  "l4ei-arista": { width: 200, height: 200 },
  "l4ei-l3e": { width: 200, height: 200 },
  "1flip-puntas": { width: 200, height: 200 },
  "1flip-bloque": { width: 200, height: 200 },
  "1flip-arista": { width: 200, height: 200 },
  "1flip-l3c": { width: 200, height: 200 },
  "1flip-l3e": { width: 200, height: 200 },
  "wo-puntas": { width: 200, height: 200 },
  "wo-bloque": { width: 200, height: 200 },
  "wo-arista": { width: 200, height: 200 },
  "wo-l3c": { width: 200, height: 200 },
  "wo-l3e": { width: 200, height: 200 },
  "oka-puntas": { width: 200, height: 200 },
  "oka-arista": { width: 200, height: 200 },
  "oka-centros": { width: 200, height: 200 },
  "oka-cierre": { width: 200, height: 200 },
  "oka-l3e": { width: 200, height: 200 },
  "nutella-puntas": { width: 200, height: 200 },
  "nutella-aristas": { width: 200, height: 200 },
  "nutella-l3c": { width: 200, height: 200 },
  "nutella-l3e": { width: 200, height: 200 },
  "petrus-222": { width: 200, height: 200 },
  "petrus-223": { width: 200, height: 200 },
  "petrus-eo": { width: 200, height: 200 },
  "petrus-f2l": { width: 200, height: 200 },
  "petrus-coll": { width: 200, height: 200 },
  "petrus-epll": { width: 200, height: 200 },
  "zz-eo": { width: 200, height: 200 },
  "zz-linea": { width: 200, height: 200 },
  "zz-f2l": { width: 200, height: 200 },
  "zz-ocll": { width: 200, height: 200 },
  "zz-pll": { width: 200, height: 200 },
  "roux-bloque1": { width: 200, height: 200 },
  "roux-bloque2": { width: 200, height: 200 },
  "roux-cmll": { width: 200, height: 200 },
  "roux-eo": { width: 200, height: 200 },
  "roux-ulur": { width: 200, height: 200 },
  "roux-capa-m": { width: 200, height: 200 },
  "eg-cara": { width: 200, height: 200 },
  "eg-cll": { width: 200, height: 200 },
  "eg-1": { width: 200, height: 200 },
  "eg-2": { width: 200, height: 200 },
  "leg-cara": { width: 200, height: 200 },
  "leg-1": { width: 200, height: 200 },
  "tcll-capa": { width: 200, height: 200 },
  "tcll-cll": { width: 200, height: 200 },
  "tcll-mas": { width: 200, height: 200 },
  "tcll-menos": { width: 200, height: 200 },
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
  const numberQuery = q.replace(/^(caso|cruz|esquinas|f2l|ocll|oll|pll|pbl|cmll|cll|coll|epll|eg-?[12]|leg-?1|tcll[+-]?|eo|l4e|l3e|l3c)/, "");
  if (/^\d+$/.test(numberQuery)) return Number(numberQuery) === algorithmCase.number;
  const name = algorithmCase.name?.toLowerCase();
  if (name && (name.startsWith(q) || `${name}perm` === q || `${name}-perm` === q)) return true;
  return compact(algorithmCase.algorithm).includes(q);
}
