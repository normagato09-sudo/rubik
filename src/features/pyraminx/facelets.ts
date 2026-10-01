/**
 * The Pyraminx as painted in the solver: 36 stickers (9 per face, F L R D,
 * numbered as in geometry.ts), checked live with messages in Spanish and
 * the stickers to look at. Like the 2×2, it does not need to be held one
 * particular way: the centers say which color each face ends with.
 */
import { FACE_CORNERS, OPPOSITE_VERTEX, PYRA_FACES, PYRA_VERTICES, centroid, faceOf, stickerCorners, type PyraFace, type PyraVertex, type Vec2 } from "./geometry";
import { PYRA_COLORS, SOLVED_FACE_COLORS, isSolvedPyraminx, type PyraColor } from "./moves";
import { CENTER_STICKERS, EDGE_STICKERS, TIP_STICKERS, faceColorsFromCenters, twistOf } from "./pieces";
import { coordsFromColors, edgesReachable, isEvenPerm, permFromIndex } from "./search";

export type PyraFacelets = (PyraColor | null)[];

export interface PyraIssue {
  message: string;
  stickers: number[];
}

export interface TurnedPyraFace {
  face: PyraFace;
  /** Thirds of a turn, clockwise, that put it right. */
  turns: 1 | 2;
}

export type PyraValidation =
  | { kind: "valid"; facelets: PyraColor[]; solved: boolean }
  | {
      kind: "incomplete";
      message: string;
      missingByFace: { face: PyraFace; missing: number }[];
      issues: PyraIssue[];
    }
  | { kind: "count"; message: string; issues: PyraIssue[] }
  | { kind: "impossible"; message: string; issues: PyraIssue[]; turned: TurnedPyraFace[] | null };

export const PYRA_COLOR_NAMES: Record<PyraColor, string> = {
  green: "verde",
  red: "rojo",
  blue: "azul",
  yellow: "amarillo",
};

export const PYRA_FACE_LABELS: Record<PyraFace, string> = {
  F: "Delante",
  L: "Izquierda",
  R: "Derecha",
  D: "Abajo",
};

/** "la punta de arriba", for the messages. */
export const VERTEX_NAMES: Record<PyraVertex, string> = {
  U: "de arriba",
  L: "de la izquierda",
  R: "de la derecha",
  B: "de detrás",
};

export const emptyPyraFacelets = (): PyraFacelets => Array<PyraColor | null>(36).fill(null);

export function pyraColorCounts(facelets: PyraFacelets): Record<PyraColor, number> {
  const counts: Record<PyraColor, number> = { green: 0, red: 0, blue: 0, yellow: 0 };
  for (const color of facelets) if (color) counts[color]++;
  return counts;
}

const list = (colors: readonly (PyraColor | null)[]) => colors.map((c) => (c ? PYRA_COLOR_NAMES[c] : "?")).join("-");

/**
 * Pieces that can be told wrong while painting (only from their own
 * complete stickers): a tip or center with a repeated color, an edge with
 * the same color twice, the same edge twice.
 */
export function pyraPieceIssues(facelets: readonly (PyraColor | null)[]): PyraIssue[] {
  const issues: PyraIssue[] = [];
  for (const v of PYRA_VERTICES) {
    for (const [kind, stickers] of [
      ["centro", CENTER_STICKERS[v]],
      ["punta", TIP_STICKERS[v]],
    ] as const) {
      const colors = stickers.map((i) => facelets[i]);
      if (colors.every(Boolean) && new Set(colors).size < 3) {
        issues.push({
          message: `${kind === "centro" ? "El centro" : "La punta"} ${VERTEX_NAMES[v]} tiene un color repetido (${list(colors)}): sus tres pegatinas son de colores distintos.`,
          stickers: [...stickers],
        });
      }
    }
  }
  const seen = new Map<string, number[]>();
  for (const [a, b] of EDGE_STICKERS) {
    const [x, y] = [facelets[a], facelets[b]];
    if (!x || !y) continue;
    if (x === y) {
      issues.push({ message: `Hay una arista con las dos pegatinas de color ${PYRA_COLOR_NAMES[x]}.`, stickers: [a, b] });
      continue;
    }
    const key = [x, y].sort().join();
    const previous = seen.get(key);
    if (previous) {
      issues.push({
        message: `La arista ${PYRA_COLOR_NAMES[x]}-${PYRA_COLOR_NAMES[y]} aparece dos veces: solo hay una.`,
        stickers: [...previous, a, b],
      });
    } else seen.set(key, [a, b]);
  }
  return issues;
}

/** Why a complete Pyraminx with 9 of each color is impossible, or null if it is fine. */
export function pyraImpossible(colors: readonly PyraColor[]): PyraIssue | null {
  const pieces = pyraPieceIssues(colors);
  if (pieces.length > 0) return pieces[0];

  const faces = faceColorsFromCenters(colors);
  if (!faces) {
    return {
      message: "Dos centros tienen los mismos tres colores. Cada centro tiene tres colores distintos y le falta uno diferente.",
      stickers: PYRA_VERTICES.flatMap((v) => CENTER_STICKERS[v]),
    };
  }

  // The faces' colors must be the real ones turned, not in a mirror.
  const standard = PYRA_FACES.map((face) => PYRA_FACES.find((f) => SOLVED_FACE_COLORS[f] === faces[face])!);
  if (!isEvenPerm(standard.map((f) => PYRA_FACES.indexOf(f)))) {
    return {
      message: "Los colores de los centros están como en un espejo: así no puede ser un Pyraminx real. Revisa que cada cara esté copiada con la pirámide como se indica.",
      stickers: PYRA_VERTICES.flatMap((v) => CENTER_STICKERS[v]),
    };
  }

  for (const v of PYRA_VERTICES) {
    const center = CENTER_STICKERS[v];
    if (twistOf(center.map((i) => colors[i]), center.map((i) => faces[faceOf(i)])) === null) {
      return {
        message: `El centro ${VERTEX_NAMES[v]} tiene sus colores en el orden contrario (${list(center.map((i) => colors[i]))}).`,
        stickers: [...center],
      };
    }
    const tip = TIP_STICKERS[v];
    if (twistOf(tip.map((i) => colors[i]), center.map((i) => colors[i])) === null) {
      return {
        message: `La punta ${VERTEX_NAMES[v]} no tiene los colores de su centro: una punta siempre lleva los mismos tres colores que el centro que tiene debajo.`,
        stickers: [...tip, ...center],
      };
    }
  }

  const coords = coordsFromColors(colors, faces);
  if (!coords) {
    return {
      message: "Hay una arista que no existe con estos centros.",
      stickers: EDGE_STICKERS.flat(),
    };
  }
  if (!isEvenPerm(permFromIndex(coords.perm))) {
    return {
      message: "Hay dos aristas intercambiadas: así no se puede llegar girando el Pyraminx. Revisa los colores de las aristas.",
      stickers: EDGE_STICKERS.flat(),
    };
  }
  if (!edgesReachable(coords.perm, coords.flip)) {
    return {
      message: "Hay una arista dada la vuelta (sus dos colores cambiados de lado): así no se puede llegar girando el Pyraminx.",
      stickers: EDGE_STICKERS.flat(),
    };
  }
  return null;
}

// ---------- faces copied turned ----------

const UNIT: [Vec2, Vec2, Vec2] = [
  [0.5, 0],
  [0, Math.sqrt(3) / 2],
  [1, Math.sqrt(3) / 2],
];
const UNIT_CENTERS = Array.from({ length: 9 }, (_, n) => centroid(stickerCorners(...UNIT, n)));
const MIDDLE = centroid(UNIT);

/** Where each sticker of a face goes when the face is turned a third, clockwise as drawn. */
const TURN_THIRD: number[] = UNIT_CENTERS.map(([x, y]) => {
  // Screen coordinates (y down): clockwise is +120°.
  const angle = (2 * Math.PI) / 3;
  const [dx, dy] = [x - MIDDLE[0], y - MIDDLE[1]];
  const p: Vec2 = [MIDDLE[0] + dx * Math.cos(angle) - dy * Math.sin(angle), MIDDLE[1] + dx * Math.sin(angle) + dy * Math.cos(angle)];
  return UNIT_CENTERS.findIndex((c) => Math.hypot(c[0] - p[0], c[1] - p[1]) < 1e-6);
});

export function turnPyraFace(facelets: PyraFacelets, { face, turns }: TurnedPyraFace): PyraFacelets {
  const offset = PYRA_FACES.indexOf(face) * 9;
  let next = [...facelets];
  for (let t = 0; t < turns; t++) {
    const turned = [...next];
    for (let n = 0; n < 9; n++) turned[offset + TURN_THIRD[n]] = next[offset + n];
    next = turned;
  }
  return next;
}

/** One or two faces that, turned, give a real Pyraminx (so they were copied turned); null if none. */
export function findTurnedPyraFaces(facelets: PyraFacelets): TurnedPyraFace[] | null {
  const options = PYRA_FACES.flatMap((face) => ([1, 2] as const).map((turns) => ({ face, turns })));
  for (const fix of options) {
    if (!pyraImpossible(turnPyraFace(facelets, fix) as PyraColor[])) return [fix];
  }
  for (let i = 0; i < options.length; i++) {
    for (let j = i + 1; j < options.length; j++) {
      if (options[i].face === options[j].face) continue;
      const turned = turnPyraFace(turnPyraFace(facelets, options[i]), options[j]);
      if (!pyraImpossible(turned as PyraColor[])) return [options[i], options[j]];
    }
  }
  return null;
}

/** Everything the screen says about a Pyraminx as it is being painted. */
export function validatePyraFacelets(facelets: PyraFacelets): PyraValidation {
  const counts = pyraColorCounts(facelets);
  const missing = facelets.filter((c) => c === null).length;
  const tooMany: PyraIssue[] = PYRA_COLORS.filter((color) => counts[color] > 9).map((color) => ({
    message: `Hay ${counts[color]} pegatinas de color ${PYRA_COLOR_NAMES[color]}: sobra${counts[color] > 10 ? "n" : ""} ${counts[color] - 9} (en un Pyraminx cada color va exactamente 9 veces).`,
    stickers: facelets.flatMap((sticker, i) => (sticker === color ? [i] : [])),
  }));

  if (missing > 0) {
    return {
      kind: "incomplete",
      message: missing === 1 ? "Falta 1 pegatina por pintar." : `Faltan ${missing} pegatinas por pintar.`,
      missingByFace: PYRA_FACES.map((face) => ({
        face,
        missing: facelets.slice(PYRA_FACES.indexOf(face) * 9, PYRA_FACES.indexOf(face) * 9 + 9).filter((c) => c === null).length,
      })).filter((entry) => entry.missing > 0),
      issues: [...tooMany, ...pyraPieceIssues(facelets)],
    };
  }

  if (PYRA_COLORS.some((color) => counts[color] !== 9)) {
    const wrong = PYRA_COLORS.filter((color) => counts[color] !== 9)
      .map((color) => `${PYRA_COLOR_NAMES[color]}: ${counts[color]}`)
      .join(", ");
    return {
      kind: "count",
      message: `Cada color tiene que aparecer 9 veces (${wrong}).`,
      issues: [...tooMany, ...pyraPieceIssues(facelets)],
    };
  }

  const colors = facelets as PyraColor[];
  const problem = pyraImpossible(colors);
  if (!problem) return { kind: "valid", facelets: colors, solved: isSolvedPyraminx(colors) };
  return { kind: "impossible", message: problem.message, issues: [problem], turned: findTurnedPyraFaces(facelets) };
}

/** The face each side of a face touches, as drawn (left side, right side, bottom side). */
export function pyraNeighbors(face: PyraFace): { left: PyraFace; right: PyraFace; bottom: PyraFace } {
  const [apex, left, right] = FACE_CORNERS[face];
  const faceWithout = (v: PyraVertex) =>
    PYRA_FACES.find((f) => f !== face && OPPOSITE_VERTEX[f] === v)!;
  // A side of the triangle is shared with the face that does not touch the opposite corner.
  return { left: faceWithout(right), right: faceWithout(left), bottom: faceWithout(apex) };
}
