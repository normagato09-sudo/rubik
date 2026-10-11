/**
 * The Skewb as painted in the solver: 30 stickers (5 per face, U R F D L B,
 * numbered as in geometry.ts), checked live with messages in Spanish and
 * the stickers to look at.
 *
 * Its centers move, so — like the 2×2 and the Pyraminx — it does not need
 * to be held with particular colors anywhere. What the solver keeps still
 * is a corner: none of the WCA moves (R, U, L, B) turns the corner at
 * up-front-right, so the solution is found for the Skewb as it is held,
 * with that corner fixed (`solve.ts`).
 */
import type { CubeColor } from "@/features/cube/types";
import { SKEWB_CORNERS, SKEWB_FACES, faceOffsetSkewb, type SkewbCorner, type SkewbFace } from "./geometry";
import { applySkewbTurns, isSolvedSkewb, solvedSkewb, type SkewbRotation } from "./moves";
import { CORNER_STICKERS, piecesFromStickers, reachability } from "./search";

export type SkewbFacelets = (CubeColor | null)[];

export interface SkewbIssue {
  message: string;
  stickers: number[];
}

export interface TurnedSkewbFace {
  face: SkewbFace;
  /** Quarter turns, clockwise as the face is drawn, that put it right. */
  turns: 1 | 2 | 3;
}

export type SkewbValidation =
  | { kind: "valid"; facelets: CubeColor[]; solved: boolean }
  | {
      kind: "incomplete";
      message: string;
      missingByFace: { face: SkewbFace; missing: number }[];
      issues: SkewbIssue[];
    }
  | { kind: "count"; message: string; issues: SkewbIssue[] }
  | { kind: "impossible"; message: string; issues: SkewbIssue[]; turned: TurnedSkewbFace[] | null };

export const SKEWB_COLORS: CubeColor[] = ["white", "yellow", "green", "blue", "red", "orange"];

export const SKEWB_COLOR_NAMES: Record<CubeColor, string> = {
  white: "blanco",
  yellow: "amarillo",
  red: "rojo",
  orange: "naranja",
  blue: "azul",
  green: "verde",
};

export const SKEWB_FACE_LABELS: Record<SkewbFace, string> = {
  U: "Arriba",
  R: "Derecha",
  F: "Delante",
  D: "Abajo",
  L: "Izquierda",
  B: "Detrás",
};

/** "la esquina de arriba, delante a la derecha", for the messages. */
export const CORNER_NAMES: Record<SkewbCorner, string> = {
  UFR: "de arriba, delante a la derecha",
  UFL: "de arriba, delante a la izquierda",
  UBR: "de arriba, detrás a la derecha",
  UBL: "de arriba, detrás a la izquierda",
  DFR: "de abajo, delante a la derecha",
  DFL: "de abajo, delante a la izquierda",
  DBR: "de abajo, detrás a la derecha",
  DBL: "de abajo, detrás a la izquierda",
};

export const STICKERS_PER_COLOR = 5;

export const emptySkewbFacelets = (): SkewbFacelets => Array<CubeColor | null>(30).fill(null);

export function skewbColorCounts(facelets: readonly (CubeColor | null)[]): Record<CubeColor, number> {
  const counts: Record<CubeColor, number> = { white: 0, yellow: 0, green: 0, blue: 0, red: 0, orange: 0 };
  for (const color of facelets) if (color) counts[color]++;
  return counts;
}

const CENTER_STICKERS = SKEWB_FACES.map((_, f) => f * 5);
const SOLVED = solvedSkewb();

/** The real corners: their three colors in order (as CORNER_STICKERS reads them). */
const REAL_CORNERS = CORNER_STICKERS.map((stickers) => stickers.map((i) => SOLVED[i]));

const OPPOSITE: Record<CubeColor, CubeColor> = {
  white: "yellow",
  yellow: "white",
  green: "blue",
  blue: "green",
  red: "orange",
  orange: "red",
};

const list = (colors: readonly (CubeColor | null)[]) => colors.map((c) => (c ? SKEWB_COLOR_NAMES[c] : "?")).join("-");

/** The real corner with these colors (whatever their order), or -1. */
const cornerWith = (colors: readonly CubeColor[]) =>
  REAL_CORNERS.findIndex((real) => real.every((color) => colors.includes(color)));

/** Whether the colors go round as on the real corner (not as in a mirror). */
const sameTurn = (colors: readonly CubeColor[], real: readonly CubeColor[]) =>
  [0, 1, 2].some((k) => real.every((color, j) => color === colors[(j + k) % 3]));

/**
 * Pieces whose painted stickers no real Skewb can show, found as soon as
 * they are painted (the rest may still be empty): two centers of the same
 * color, a corner with a color twice or two opposite colors, a corner in
 * its mirror image, the same corner twice.
 */
export function skewbPieceIssues(facelets: readonly (CubeColor | null)[]): SkewbIssue[] {
  const issues: SkewbIssue[] = [];
  const centers = new Map<CubeColor, number[]>();
  for (const i of CENTER_STICKERS) {
    const color = facelets[i];
    if (!color) continue;
    centers.set(color, [...(centers.get(color) ?? []), i]);
  }
  for (const [color, stickers] of centers) {
    if (stickers.length > 1) {
      issues.push({
        message: `Hay ${stickers.length} centros de color ${SKEWB_COLOR_NAMES[color]}: cada color tiene un solo centro.`,
        stickers,
      });
    }
  }

  const seen = new Map<number, number[]>();
  CORNER_STICKERS.forEach((stickers, place) => {
    const colors = stickers.map((i) => facelets[i]);
    if (!colors.every(Boolean)) return;
    const painted = colors as CubeColor[];
    const name = CORNER_NAMES[SKEWB_CORNERS[place]];
    if (new Set(painted).size < 3) {
      issues.push({ message: `La esquina ${name} tiene un color repetido (${list(painted)}).`, stickers: [...stickers] });
      return;
    }
    const opposite = painted.find((color) => painted.includes(OPPOSITE[color]));
    if (opposite) {
      issues.push({
        message: `La esquina ${name} tiene ${SKEWB_COLOR_NAMES[opposite]} y ${SKEWB_COLOR_NAMES[OPPOSITE[opposite]]}, que son colores opuestos: ninguna esquina los lleva juntos.`,
        stickers: [...stickers],
      });
      return;
    }
    const corner = cornerWith(painted);
    if (!sameTurn(painted, REAL_CORNERS[corner])) {
      issues.push({
        message: `La esquina ${name} (${list(painted)}) tiene los colores en el orden contrario, como en un espejo.`,
        stickers: [...stickers],
      });
      return;
    }
    const previous = seen.get(corner);
    if (previous) {
      issues.push({ message: `La esquina ${list(REAL_CORNERS[corner])} aparece dos veces: solo hay una.`, stickers: [...previous, ...stickers] });
    } else seen.set(corner, [...stickers]);
  });
  return issues;
}

// ---------- holding it: the corner that stays still ----------

const ROTATIONS: SkewbRotation[] = ["x", "y", "z"];

/** The solved Skewb held each of its 24 ways (white up and green front first). */
const ORIENTATIONS: CubeColor[][] = (() => {
  const found = new Map([[SOLVED.join(), SOLVED]]);
  const queue = [SOLVED];
  for (let head = 0; head < queue.length; head++) {
    for (const rotation of ROTATIONS) {
      const next = applySkewbTurns(queue[head], [{ kind: "rotation", rotation }]);
      if (!found.has(next.join())) {
        found.set(next.join(), next);
        queue.push(next);
      }
    }
  }
  return queue;
})();

/** The stickers of the up-front-right corner, which the WCA moves never turn. */
export const FIXED_CORNER_STICKERS = CORNER_STICKERS[SKEWB_CORNERS.indexOf("UFR")];

/**
 * The colors of the Skewb as the solver sees it: the solved Skewb held so
 * that its up-front-right corner is the painted one is "white up, green
 * front", and every color is renamed to match. Null if that corner is not
 * a real one.
 */
export function asHeldForSolver(colors: readonly CubeColor[]): CubeColor[] | null {
  const held = ORIENTATIONS.find((solved) => FIXED_CORNER_STICKERS.every((i) => solved[i] === colors[i]));
  if (!held) return null;
  const rename = new Map(CENTER_STICKERS.map((i) => [held[i], SOLVED[i]]));
  return colors.map((color) => rename.get(color)!);
}

/** Why a complete Skewb with 5 of each color is impossible, or null if it is fine. */
export function skewbImpossible(colors: readonly CubeColor[]): SkewbIssue | null {
  const pieces = skewbPieceIssues(colors);
  if (pieces.length > 0) return pieces[0];

  const renamed = asHeldForSolver(colors);
  if (!renamed) {
    // Every corner is real (checked above), so this cannot happen; kept as a guard.
    return { message: "La esquina de arriba, delante a la derecha, no es una esquina real.", stickers: [...FIXED_CORNER_STICKERS] };
  }
  const reach = reachability(piecesFromStickers(renamed));
  if (!reach.centers) {
    return {
      message:
        "Hay dos centros intercambiados: así no se puede llegar girando el Skewb (los centros solo se mueven de tres en tres). Revisa los colores de los centros.",
      stickers: [...CENTER_STICKERS],
    };
  }
  if (!reach.corners) {
    return {
      message:
        "Hay una esquina girada sobre sí misma o dos esquinas intercambiadas: así no se puede llegar girando el Skewb. Revisa las esquinas.",
      stickers: CORNER_STICKERS.flat(),
    };
  }
  return null;
}

// ---------- faces copied turned ----------

/** Where each sticker of a face goes when the face is turned a quarter, clockwise as drawn. */
const TURN_QUARTER = [0, 2, 3, 4, 1];

export function turnSkewbFace(facelets: readonly (CubeColor | null)[], { face, turns }: TurnedSkewbFace): SkewbFacelets {
  const offset = faceOffsetSkewb(face);
  let next = [...facelets];
  for (let t = 0; t < turns; t++) {
    const turned = [...next];
    for (let n = 0; n < 5; n++) turned[offset + TURN_QUARTER[n]] = next[offset + n];
    next = turned;
  }
  return next;
}

/** One or two faces that, turned, give a real Skewb (so they were copied turned); null if none. */
export function findTurnedSkewbFaces(facelets: readonly (CubeColor | null)[]): TurnedSkewbFace[] | null {
  const options = SKEWB_FACES.flatMap((face) => ([1, 2, 3] as const).map((turns) => ({ face, turns })));
  for (const fix of options) {
    if (!skewbImpossible(turnSkewbFace(facelets, fix) as CubeColor[])) return [fix];
  }
  for (let i = 0; i < options.length; i++) {
    for (let j = i + 1; j < options.length; j++) {
      if (options[i].face === options[j].face) continue;
      const turned = turnSkewbFace(turnSkewbFace(facelets, options[i]), options[j]);
      if (!skewbImpossible(turned as CubeColor[])) return [options[i], options[j]];
    }
  }
  return null;
}

/** Everything the screen says about a Skewb as it is being painted. */
export function validateSkewbFacelets(facelets: SkewbFacelets): SkewbValidation {
  const counts = skewbColorCounts(facelets);
  const missing = facelets.filter((c) => c === null).length;
  const tooMany: SkewbIssue[] = SKEWB_COLORS.filter((color) => counts[color] > STICKERS_PER_COLOR).map((color) => ({
    message: `Hay ${counts[color]} pegatinas de color ${SKEWB_COLOR_NAMES[color]}: sobra${counts[color] > STICKERS_PER_COLOR + 1 ? "n" : ""} ${counts[color] - STICKERS_PER_COLOR} (en un Skewb cada color va exactamente 5 veces).`,
    stickers: facelets.flatMap((sticker, i) => (sticker === color ? [i] : [])),
  }));

  if (missing > 0) {
    return {
      kind: "incomplete",
      message: missing === 1 ? "Falta 1 pegatina por pintar." : `Faltan ${missing} pegatinas por pintar.`,
      missingByFace: SKEWB_FACES.map((face) => ({
        face,
        missing: facelets.slice(faceOffsetSkewb(face), faceOffsetSkewb(face) + 5).filter((c) => c === null).length,
      })).filter((entry) => entry.missing > 0),
      issues: [...tooMany, ...skewbPieceIssues(facelets)],
    };
  }

  if (SKEWB_COLORS.some((color) => counts[color] !== STICKERS_PER_COLOR)) {
    const wrong = SKEWB_COLORS.filter((color) => counts[color] !== STICKERS_PER_COLOR)
      .map((color) => `${SKEWB_COLOR_NAMES[color]}: ${counts[color]}`)
      .join(", ");
    return {
      kind: "count",
      message: `Cada color tiene que aparecer 5 veces (${wrong}).`,
      issues: [...tooMany, ...skewbPieceIssues(facelets)],
    };
  }

  const colors = facelets as CubeColor[];
  const problem = skewbImpossible(colors);
  if (!problem) return { kind: "valid", facelets: colors, solved: isSolvedSkewb(colors) };
  return { kind: "impossible", message: problem.message, issues: [problem], turned: findTurnedSkewbFaces(facelets) };
}
