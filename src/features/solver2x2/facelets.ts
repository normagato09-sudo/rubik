import type { CubeColor } from "@/features/cube/types";
import { FACELET_GEOMETRY } from "@/features/solver/cube-state";
import { FACE_NAMES, type FaceName } from "@/features/solver/cubie";
import { COLOR_NAMES, CENTER_COLORS, type Issue } from "@/features/solver/facelets";

/**
 * The 24 stickers of a 2×2, in the same order and orientation as the 3×3's
 * 54 (U, R, F, D, L, B, each face read row by row as the solver screen asks
 * to hold the cube), just with 4 stickers per face: sticker n of a 2×2 face
 * sits where corner sticker 1, 3, 7 or 9 of a 3×3 face does.
 *
 * A 2×2 has no centers, so nothing here says which color goes on which
 * face: pieces are recognised by their three colors, and a face is named by
 * where it is while the cube is held (arriba, delante...).
 */
export type Facelets2 = (CubeColor | null)[];

export const STICKERS_PER_FACE = 4;
export const STICKER_COUNT = 24;

export const faceOffset2 = (face: FaceName) => FACE_NAMES.indexOf(face) * STICKERS_PER_FACE;

/** 3×3 sticker (0–8) that each 2×2 sticker (0–3) of a face matches. */
const FROM_3X3 = [0, 2, 6, 8];

/** Position and outward normal of each of the 24 stickers, in solver order. */
export const FACELET_GEOMETRY_2 = FACE_NAMES.flatMap((_, f) =>
  FROM_3X3.map((n) => FACELET_GEOMETRY[f * 9 + n]),
);

/** Sticker n (1–4) of `face`. */
const at = (face: FaceName, n: number) => faceOffset2(face) + n - 1;

/**
 * The 8 corner slots (Kociemba's URF UFL ULB UBR DFR DLF DBL DRB), each read
 * clockwise from its U or D sticker — the 3×3's corner stickers.
 */
export const CORNER_FACELETS_2: number[][] = [
  [at("U", 4), at("R", 1), at("F", 2)],
  [at("U", 3), at("F", 1), at("L", 2)],
  [at("U", 1), at("L", 1), at("B", 2)],
  [at("U", 2), at("B", 1), at("R", 2)],
  [at("D", 2), at("F", 4), at("R", 3)],
  [at("D", 1), at("L", 4), at("F", 3)],
  [at("D", 3), at("B", 4), at("L", 3)],
  [at("D", 4), at("R", 4), at("B", 3)],
];

const CORNER_FACES: FaceName[][] = [
  ["U", "R", "F"],
  ["U", "F", "L"],
  ["U", "L", "B"],
  ["U", "B", "R"],
  ["D", "F", "R"],
  ["D", "L", "F"],
  ["D", "B", "L"],
  ["D", "R", "B"],
];

/** Colors of each real corner, in the same clockwise order, on a solved cube held white up, green front. */
export const CORNER_COLORS: CubeColor[][] = CORNER_FACES.map((faces) => faces.map((face) => CENTER_COLORS[face]));

/** The reference corner: yellow-blue-orange, down-back-left (slot DBL) on a solved cube. */
export const REFERENCE_SLOT = 6;

const SLOT_NAMES = [
  "arriba, delante y a la derecha",
  "arriba, delante y a la izquierda",
  "arriba, detrás y a la izquierda",
  "arriba, detrás y a la derecha",
  "abajo, delante y a la derecha",
  "abajo, delante y a la izquierda",
  "abajo, detrás y a la izquierda",
  "abajo, detrás y a la derecha",
];

export const OPPOSITE_COLOR: Record<CubeColor, CubeColor> = {
  white: "yellow",
  yellow: "white",
  red: "orange",
  orange: "red",
  green: "blue",
  blue: "green",
};

const PALETTE: CubeColor[] = ["white", "yellow", "green", "blue", "red", "orange"];

/** "a", "a y b", "a, b y c". */
const joinWords = (words: string[]) =>
  words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} y ${words.at(-1)}`;

const colorList = (colors: CubeColor[]) => joinWords(colors.map((color) => COLOR_NAMES[color]));

const slotPlace = (slot: number) => `La esquina de ${SLOT_NAMES[slot]}`;

/** All 24 stickers empty: a 2×2 has no fixed centers. */
export function emptyFacelets2(): Facelets2 {
  return Array(STICKER_COUNT).fill(null);
}

/**
 * Which real corner these three colors (read clockwise from the slot's U/D
 * sticker) are, and its twist: how many steps clockwise its white or yellow
 * sticker is from the U/D sticker. -1 if no corner has them in this order.
 */
export function identifyCorner(colors: CubeColor[]): { corner: number; twist: number } {
  const twist = colors.findIndex((color) => color === "white" || color === "yellow");
  if (twist === -1) return { corner: -1, twist: 0 };
  const corner = CORNER_COLORS.findIndex((real) =>
    real.every((color, n) => colors[(n + twist) % 3] === color),
  );
  return { corner, twist };
}

export function colorCounts2(facelets: Facelets2): Record<CubeColor, number> {
  const counts = Object.fromEntries(PALETTE.map((color) => [color, 0])) as Record<CubeColor, number>;
  for (const color of facelets) if (color) counts[color]++;
  return counts;
}

/**
 * Corners whose painted stickers no real cube can show, found as soon as
 * they are painted: the same color twice, two opposite colors
 * (white/yellow, red/orange, green/blue), or three colors going round the
 * wrong way (that corner's mirror image).
 */
export function pieceIssues2(facelets: Facelets2): Issue[] {
  const issues: Issue[] = [];
  CORNER_FACELETS_2.forEach((stickers, slot) => {
    const painted = stickers.filter((index) => facelets[index] !== null);
    const colors = painted.map((index) => facelets[index]!);
    const repeated = colors.find((color, i) => colors.indexOf(color) !== i);
    if (repeated) {
      issues.push({
        message: `${slotPlace(slot)} tiene dos pegatinas de color ${COLOR_NAMES[repeated]}: cada esquina tiene tres colores distintos.`,
        stickers: painted,
      });
      return;
    }
    const opposite = colors.find((color) => colors.includes(OPPOSITE_COLOR[color]));
    if (opposite) {
      issues.push({
        message: `${slotPlace(slot)} tiene ${colorList([opposite, OPPOSITE_COLOR[opposite]])}, que son colores opuestos: nunca van en la misma esquina.`,
        stickers: painted,
      });
      return;
    }
    if (colors.length === 3 && identifyCorner(colors).corner === -1) {
      issues.push({
        message: `${slotPlace(slot)} tiene ${colorList(colors)} en un orden que no existe (es esa esquina vista en un espejo). Revisa si alguna de esas caras está copiada girada.`,
        stickers: painted,
      });
    }
  });
  return issues;
}

/** Which corner sits in each slot, and how it is twisted. */
export interface CornerState {
  cp: number[];
  co: number[];
}

export type ParseResult2 =
  | { ok: true; corners: CornerState }
  | { ok: false; reason: "incomplete" | "count" | "impossible"; error: string; stickers: number[] };

const impossible = (error: string, stickers: number[] = []): ParseResult2 => ({
  ok: false,
  reason: "impossible",
  error,
  stickers,
});

/**
 * The painted stickers as 8 corners, or why (in Spanish) no real 2×2 looks
 * like that: missing stickers, a color not used exactly 4 times, a corner
 * that does not exist or appears twice, or a corner twisted on itself.
 * A 2×2 has no other restriction: every arrangement of the 8 corners with
 * twists adding up is reachable (turning the whole cube included).
 */
export function parseFacelets2(facelets: Facelets2): ParseResult2 {
  const missing = facelets.filter((color) => color === null).length;
  if (missing > 0) {
    return {
      ok: false,
      reason: "incomplete",
      error: missing === 1 ? "Falta 1 pegatina por colorear." : `Faltan ${missing} pegatinas por colorear.`,
      stickers: [],
    };
  }

  const counts = colorCounts2(facelets);
  const wrong = PALETTE.filter((color) => counts[color] !== 4);
  if (wrong.length > 0) {
    const list = joinWords(
      wrong.map((color, i) => `${counts[color]}${i === 0 ? " pegatinas" : ""} de color ${COLOR_NAMES[color]}`),
    );
    return {
      ok: false,
      reason: "count",
      error: `Hay ${list}; en un 2×2 cada color tiene que aparecer exactamente 4 veces.`,
      stickers: [],
    };
  }

  const [issue] = pieceIssues2(facelets);
  if (issue) return impossible(issue.message, issue.stickers);

  const corners: CornerState = { cp: [], co: [] };
  for (let slot = 0; slot < 8; slot++) {
    const { corner, twist } = identifyCorner(CORNER_FACELETS_2[slot].map((index) => facelets[index]!));
    if (corner === -1) {
      return impossible(`${slotPlace(slot)} tiene una combinación de colores imposible.`, CORNER_FACELETS_2[slot]);
    }
    corners.cp.push(corner);
    corners.co.push(twist);
  }

  const repeated = corners.cp.find((corner, i) => corners.cp.indexOf(corner) !== i);
  if (repeated !== undefined) {
    const slots = corners.cp.flatMap((corner, slot) => (corner === repeated ? [slot] : []));
    return impossible(
      `Hay dos esquinas ${colorList(CORNER_COLORS[repeated])} (y falta otra esquina): en un cubo real cada esquina aparece una sola vez.`,
      slots.flatMap((slot) => CORNER_FACELETS_2[slot]),
    );
  }

  if (corners.co.reduce((sum, twist) => sum + twist, 0) % 3 !== 0) {
    return impossible(
      "Hay una esquina girada sobre sí misma: sus colores son correctos, pero están rotados. Girando las caras eso no puede pasar, así que revisa los colores de las esquinas.",
    );
  }

  return { ok: true, corners };
}

/** Every face of a single color (in whatever orientation the cube is held). */
export function isSolved2(facelets: readonly (CubeColor | null)[]): boolean {
  return FACE_NAMES.every((face) => {
    const stickers = facelets.slice(faceOffset2(face), faceOffset2(face) + STICKERS_PER_FACE);
    return stickers[0] !== null && stickers.every((color) => color === stickers[0]);
  });
}

// ---------- faces copied turned ----------

/** Sticker order of a 2×2 face after turning it a quarter clockwise. */
const QUARTER_TURN = [2, 0, 3, 1];

export interface TurnedFace2 {
  face: FaceName;
  turns: 1 | 2 | 3;
}

/** The stickers with `face` turned `turns` quarter turns clockwise on screen. */
export function turnFace2(facelets: Facelets2, { face, turns }: TurnedFace2): Facelets2 {
  let stickers = facelets.slice(faceOffset2(face), faceOffset2(face) + STICKERS_PER_FACE);
  for (let i = 0; i < turns; i++) stickers = QUARTER_TURN.map((n) => stickers[n]);
  const turned = [...facelets];
  turned.splice(faceOffset2(face), STICKERS_PER_FACE, ...stickers);
  return turned;
}

const TURN_OPTIONS: TurnedFace2[] = FACE_NAMES.flatMap((face) =>
  ([1, 2, 3] as const).map((turns) => ({ face, turns })),
);

/**
 * Same idea as the 3×3's findTurnedFaces: when the stickers are not a real
 * 2×2, whether exactly one way of turning one face (or failing that, two)
 * makes them valid. Only offered to the user, never applied on its own.
 */
export function findTurnedFaces2(facelets: Facelets2): TurnedFace2[] | null {
  if (parseFacelets2(facelets).ok) return null;
  const valid = (candidate: Facelets2) => parseFacelets2(candidate).ok;

  const single = TURN_OPTIONS.filter((fix) => valid(turnFace2(facelets, fix)));
  if (single.length > 0) return single.length === 1 ? single : null;

  const pairs: TurnedFace2[][] = [];
  for (let i = 0; i < TURN_OPTIONS.length; i++) {
    for (let j = i + 1; j < TURN_OPTIONS.length; j++) {
      const [a, b] = [TURN_OPTIONS[i], TURN_OPTIONS[j]];
      if (a.face === b.face) continue;
      if (valid(turnFace2(turnFace2(facelets, a), b))) pairs.push([a, b]);
    }
  }
  return pairs.length === 1 ? pairs[0] : null;
}

// ---------- what the screen shows ----------

export type Validation2 =
  | { kind: "valid"; facelets: CubeColor[]; solved: boolean }
  | {
      kind: "incomplete";
      message: string;
      missingByFace: { face: FaceName; missing: number }[];
      issues: Issue[];
    }
  | { kind: "count"; message: string; issues: Issue[] }
  | { kind: "impossible"; message: string; issues: Issue[]; turned: TurnedFace2[] | null };

/** Everything the screen says about a 2×2 as it is being painted (see the 3×3's validateFacelets). */
export function validateFacelets2(facelets: Facelets2): Validation2 {
  const parsed = parseFacelets2(facelets);
  if (parsed.ok) {
    const complete = facelets as CubeColor[];
    return { kind: "valid", facelets: complete, solved: isSolved2(complete) };
  }

  if (parsed.reason === "incomplete") {
    const counts = colorCounts2(facelets);
    const tooMany = PALETTE.filter((color) => counts[color] > 4).map((color) => ({
      message: `Hay ${counts[color]} pegatinas de color ${COLOR_NAMES[color]}: sobra${counts[color] > 5 ? "n" : ""} ${counts[color] - 4} (en un 2×2 cada color va exactamente 4 veces).`,
      stickers: facelets.flatMap((sticker, i) => (sticker === color ? [i] : [])),
    }));
    return {
      kind: "incomplete",
      message: parsed.error,
      missingByFace: FACE_NAMES.map((face) => ({
        face,
        missing: facelets
          .slice(faceOffset2(face), faceOffset2(face) + STICKERS_PER_FACE)
          .filter((color) => color === null).length,
      })).filter(({ missing }) => missing > 0),
      issues: [...tooMany, ...pieceIssues2(facelets)],
    };
  }

  if (parsed.reason === "count") {
    return { kind: "count", message: parsed.error, issues: pieceIssues2(facelets) };
  }

  return {
    kind: "impossible",
    message: parsed.error,
    issues: [{ message: parsed.error, stickers: parsed.stickers }],
    turned: findTurnedFaces2(facelets),
  };
}

/** The stickers of 8 corners (the inverse of parseFacelets2). */
export function faceletsFromCorners({ cp, co }: CornerState): CubeColor[] {
  const facelets: CubeColor[] = Array(STICKER_COUNT);
  cp.forEach((corner, slot) => {
    for (let n = 0; n < 3; n++) {
      facelets[CORNER_FACELETS_2[slot][(n + co[slot]) % 3]] = CORNER_COLORS[corner][n];
    }
  });
  return facelets;
}
