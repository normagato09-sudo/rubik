import { EVERY_MOVE, type Move } from "@/features/cube/moves";

/**
 * Reads an algorithm as written in the method sheets: "(U') R' F R2 F'",
 * "F (R U R' U2') F'", "R U R2' U'", "x' U2 R", with ’ or ' — parentheses
 * only group moves, and a half turn is the same either way (R2' = R2).
 */
export function parseAlgorithm(text: string): Move[] {
  return text
    .replace(/[()]/g, " ")
    .replace(/[’´`]/g, "'")
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => {
      const move = token.replace(/^([RLUDFBxyz])2'$/, "$12");
      if (!(EVERY_MOVE as string[]).includes(move)) throw new Error(`Movimiento no válido: ${token}`);
      return move as Move;
    });
}
