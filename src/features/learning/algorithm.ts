/**
 * Splits an algorithm into its individual moves, in order, exactly as
 * written — `R2`, `U'`, `y'`, `d`... each become one step. Grouping
 * parentheses like `(R U R' U')` are only visual and are dropped; they
 * never produce a step of their own.
 */
export function splitAlgorithm(algorithm: string): string[] {
  return algorithm
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter((move) => move.length > 0);
}
