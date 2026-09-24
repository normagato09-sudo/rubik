/**
 * Splits an algorithm into its individual moves, in order, exactly as
 * written — `R2`, `U'`, `y'`, `d`... each become one step. Grouping
 * parentheses like `(R U R' U')` are only visual and are dropped; they
 * never produce a step of their own. A detached prime (`U2 '`, as typed
 * in one source) belongs to the move before it, not to a step of its own.
 */
export function splitAlgorithm(algorithm: string): string[] {
  const steps: string[] = [];
  for (const token of algorithm.replace(/[()]/g, " ").split(/\s+/)) {
    if (token.length === 0) continue;
    if (/^['’]+$/.test(token) && steps.length > 0) steps[steps.length - 1] += token;
    else steps.push(token);
  }
  return steps;
}
