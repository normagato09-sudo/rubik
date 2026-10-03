import { ALGORITHM_MOVES, type Move } from "./moves";

/**
 * Reads a 3×3 algorithm as the engine's moves: face turns, middle layers
 * (M, E, S), wide turns (r or Rw) and rotations. Grouping parentheses are
 * dropped, "R2'" is R2, and a detached prime ("U2 '") belongs to the move
 * before it, as the sheets sometimes write it.
 */
export function parseCubeAlgorithm(text: string): Move[] {
  const tokens: string[] = [];
  for (const token of text.replace(/[()]/g, " ").replace(/[’´`]/g, "'").split(/\s+/)) {
    if (token.length === 0) continue;
    if (/^'+$/.test(token) && tokens.length > 0) tokens[tokens.length - 1] += token;
    else tokens.push(token);
  }
  return tokens.map((token) => {
    const move = token.replace(/^([RLUDFB])w/, (_, face: string) => face.toLowerCase()).replace(/^(\w)2'$/, "$12");
    if (!(ALGORITHM_MOVES as string[]).includes(move)) throw new Error(`Movimiento no válido: ${token}`);
    return move as Move;
  });
}
