import type { CubeColor } from "@/features/cube/types";
import { FACE_NAMES, cubeProblem, isSolved, type CubieCube, type FaceName } from "./cubie";

/**
 * 54 stickers in Kociemba order: U1–U9, R1–R9, F1–F9, D1–D9, L1–L9, B1–B9,
 * each face read row by row as it looks in the net below:
 *
 *            U
 *        L   F   R   B
 *            D
 *
 * U is seen from above with F at its bottom edge; D from below with F at its
 * top edge; the side faces with U on top. cube-state.ts writes this down
 * in the 3D model's coordinates, and the tests check it against the
 * features/cube move engine.
 */
export type Facelets = (CubeColor | null)[];

/**
 * Holding the cube white up, green front: the same colors features/cube
 * paints on +y, -y, +x, -x, +z, -z (the scheme used in Aprender).
 */
export const CENTER_COLORS: Record<FaceName, CubeColor> = {
  U: "white",
  R: "red",
  F: "green",
  D: "yellow",
  L: "orange",
  B: "blue",
};

export const FACE_LABELS: Record<FaceName, string> = {
  U: "Arriba",
  R: "Derecha",
  F: "Delante",
  D: "Abajo",
  L: "Izquierda",
  B: "Detrás",
};

export const COLOR_NAMES: Record<CubeColor, string> = {
  white: "blanco",
  yellow: "amarillo",
  red: "rojo",
  orange: "naranja",
  blue: "azul",
  green: "verde",
};

const OPPOSITE: Record<FaceName, FaceName> = { U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" };

/** Centers never move, so each color always names the same face. */
const FACE_OF_COLOR = Object.fromEntries(
  FACE_NAMES.map((face) => [CENTER_COLORS[face], face]),
) as Record<CubeColor, FaceName>;

export const faceOffset = (face: FaceName) => FACE_NAMES.indexOf(face) * 9;
export const CENTER_INDEX = (face: FaceName) => faceOffset(face) + 4;

const at = (face: FaceName, n: number) => faceOffset(face) + n - 1;

const CORNER_FACELETS: number[][] = [
  [at("U", 9), at("R", 1), at("F", 3)],
  [at("U", 7), at("F", 1), at("L", 3)],
  [at("U", 1), at("L", 1), at("B", 3)],
  [at("U", 3), at("B", 1), at("R", 3)],
  [at("D", 3), at("F", 9), at("R", 7)],
  [at("D", 1), at("L", 9), at("F", 7)],
  [at("D", 7), at("B", 9), at("L", 7)],
  [at("D", 9), at("R", 9), at("B", 7)],
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

const EDGE_FACELETS: number[][] = [
  [at("U", 6), at("R", 2)],
  [at("U", 8), at("F", 2)],
  [at("U", 4), at("L", 2)],
  [at("U", 2), at("B", 2)],
  [at("D", 6), at("R", 8)],
  [at("D", 2), at("F", 8)],
  [at("D", 4), at("L", 8)],
  [at("D", 8), at("B", 8)],
  [at("F", 6), at("R", 4)],
  [at("F", 4), at("L", 6)],
  [at("B", 6), at("L", 4)],
  [at("B", 4), at("R", 6)],
];

const EDGE_FACES: FaceName[][] = [
  ["U", "R"],
  ["U", "F"],
  ["U", "L"],
  ["U", "B"],
  ["D", "R"],
  ["D", "F"],
  ["D", "L"],
  ["D", "B"],
  ["F", "R"],
  ["F", "L"],
  ["B", "L"],
  ["B", "R"],
];

/** A cube with only the six centers filled in. */
export function emptyFacelets(): Facelets {
  const facelets: Facelets = Array(54).fill(null);
  for (const face of FACE_NAMES) facelets[CENTER_INDEX(face)] = CENTER_COLORS[face];
  return facelets;
}

export function faceletsFromCube(cube: CubieCube): Facelets {
  const facelets = emptyFacelets();
  cube.cp.forEach((corner, slot) => {
    for (let n = 0; n < 3; n++) {
      facelets[CORNER_FACELETS[slot][(n + cube.co[slot]) % 3]] =
        CENTER_COLORS[CORNER_FACES[corner][n]];
    }
  });
  cube.ep.forEach((edge, slot) => {
    for (let n = 0; n < 2; n++) {
      facelets[EDGE_FACELETS[slot][(n + cube.eo[slot]) % 2]] = CENTER_COLORS[EDGE_FACES[edge][n]];
    }
  });
  return facelets;
}

// ---------- messages ----------

/** "a", "a y b", "a, b y c". */
const joinWords = (words: string[]) =>
  words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} y ${words.at(-1)}`;

const colorList = (faces: FaceName[]) => joinWords(faces.map((f) => COLOR_NAMES[CENTER_COLORS[f]]));

/** Where a piece sits, named by the centers it touches (what the user sees). */
const cornerPlace = (slot: number) => `La esquina entre los centros ${colorList(CORNER_FACES[slot])}`;
const edgePlace = (slot: number) => `La arista entre los centros ${colorList(EDGE_FACES[slot])}`;

/** A problem found in a few stickers, so the screen can point at them. */
export interface Issue {
  message: string;
  stickers: number[];
}

/**
 * Pieces whose painted stickers no real cube can show, found as soon as
 * they are painted (the rest may still be empty): the same color twice,
 * two opposite colors (white/yellow, red/orange, green/blue), or a corner
 * whose three colors go round the wrong way (its mirror image).
 */
export function pieceIssues(facelets: Facelets): Issue[] {
  const issues: Issue[] = [];
  const pieces = [
    ...CORNER_FACELETS.map((stickers, slot) => ({ stickers, place: cornerPlace(slot) })),
    ...EDGE_FACELETS.map((stickers, slot) => ({ stickers, place: edgePlace(slot) })),
  ];
  for (const { stickers, place } of pieces) {
    const painted = stickers.filter((index) => facelets[index] !== null);
    const faces = painted.map((index) => FACE_OF_COLOR[facelets[index]!]);
    const repeated = faces.find((face, i) => faces.indexOf(face) !== i);
    if (repeated) {
      issues.push({
        message: `${place} tiene dos pegatinas de color ${COLOR_NAMES[CENTER_COLORS[repeated]]}: cada pieza tiene colores distintos.`,
        stickers: painted,
      });
      continue;
    }
    const opposite = faces.find((face) => faces.includes(OPPOSITE[face]));
    if (opposite) {
      issues.push({
        message: `${place} tiene ${colorList([opposite, OPPOSITE[opposite]])}, que son colores opuestos: nunca van en la misma pieza.`,
        stickers: painted,
      });
      continue;
    }
    if (stickers.length === 3 && faces.length === 3 && cornerOf(faces) === -1) {
      issues.push({
        message: `${place} tiene ${colorList(faces)} en un orden que no existe (es esa esquina vista en un espejo). Revisa si alguna de esas caras está copiada girada.`,
        stickers: painted,
      });
    }
  }
  return issues;
}

/**
 * Which corner these three faces (read clockwise, as in CORNER_FACELETS)
 * are, and its twist; -1 if no corner has them in this order.
 */
function cornerOf(faces: FaceName[]): number {
  const ori = faces.findIndex((face) => face === "U" || face === "D");
  if (ori === -1) return -1;
  const side1 = faces[(ori + 1) % 3];
  const side2 = faces[(ori + 2) % 3];
  return CORNER_FACES.findIndex(
    (corner) => corner[0] === faces[ori] && corner[1] === side1 && corner[2] === side2,
  );
}

export function colorCounts(facelets: Facelets): Record<CubeColor, number> {
  const counts = Object.fromEntries(
    Object.values(CENTER_COLORS).map((color) => [color, 0]),
  ) as Record<CubeColor, number>;
  for (const color of facelets) if (color) counts[color]++;
  return counts;
}

// ---------- stickers → cubie cube ----------

/**
 * Why some stickers are not a solvable cube:
 * - "incomplete": some stickers are still unpainted;
 * - "count": everything painted, but a color is not used exactly 9 times;
 * - "impossible": every color is 9/9 but the stickers are not a real 3×3 (a
 *   piece that does not exist or is repeated, or a twisted corner, flipped
 *   edge or swapped pair that no turn can produce).
 */
export type InvalidReason = "incomplete" | "count" | "impossible";

export type ParseResult =
  | { ok: true; cube: CubieCube }
  | { ok: false; reason: InvalidReason; error: string; stickers: number[] };

const impossible = (error: string, stickers: number[] = []): ParseResult => ({
  ok: false,
  reason: "impossible",
  error,
  stickers,
});

/**
 * Turns the painted stickers into a cubie cube, or explains (in Spanish)
 * why that cube cannot exist — missing stickers, a wrong count, an
 * impossible or repeated piece, or a twisted corner / flipped edge /
 * swapped pair that no turn can reach. Never "fixes" anything: a cube that
 * is accepted here is exactly the one painted.
 */
export function parseFacelets(facelets: Facelets): ParseResult {
  const missing = facelets.filter((color) => color === null).length;
  if (missing > 0) {
    return {
      ok: false,
      reason: "incomplete",
      error:
        missing === 1
          ? "Falta 1 pegatina por colorear."
          : `Faltan ${missing} pegatinas por colorear.`,
      stickers: [],
    };
  }

  const counts = colorCounts(facelets);
  const wrong = Object.values(CENTER_COLORS).filter((color) => counts[color] !== 9);
  if (wrong.length > 0) {
    const list = joinWords(
      wrong.map((color, i) => `${counts[color]}${i === 0 ? " pegatinas" : ""} de color ${COLOR_NAMES[color]}`),
    );
    return {
      ok: false,
      reason: "count",
      error: `Hay ${list}; cada color tiene que aparecer exactamente 9 veces.`,
      stickers: [],
    };
  }

  const [issue] = pieceIssues(facelets);
  if (issue) return impossible(issue.message, issue.stickers);

  const f = facelets.map((color) => FACE_OF_COLOR[color!]);
  const cube: CubieCube = { cp: [], co: [], ep: [], eo: [] };

  for (let slot = 0; slot < 8; slot++) {
    const faces = CORNER_FACELETS[slot].map((index) => f[index]);
    const corner = cornerOf(faces);
    if (corner === -1) {
      return impossible(`${cornerPlace(slot)} tiene una combinación de colores imposible.`, CORNER_FACELETS[slot]);
    }
    cube.cp.push(corner);
    cube.co.push(faces.findIndex((face) => face === "U" || face === "D"));
  }

  for (let slot = 0; slot < 12; slot++) {
    const [a, b] = EDGE_FACELETS[slot].map((index) => f[index]);
    const edge = EDGE_FACES.findIndex(([x, y]) => (a === x && b === y) || (a === y && b === x));
    if (edge === -1) {
      return impossible(`${edgePlace(slot)} tiene una combinación de colores imposible.`, EDGE_FACELETS[slot]);
    }
    cube.ep.push(edge);
    cube.eo.push(a === EDGE_FACES[edge][0] ? 0 : 1);
  }

  switch (cubeProblem(cube)) {
    case "corner-repeated": {
      const corner = cube.cp.find((piece, i) => cube.cp.indexOf(piece) !== i)!;
      const slots = cube.cp.flatMap((piece, slot) => (piece === corner ? [slot] : []));
      return impossible(
        `Hay dos esquinas ${colorList(CORNER_FACES[corner])} (y falta otra esquina): en un cubo real cada pieza aparece una sola vez.`,
        slots.flatMap((slot) => CORNER_FACELETS[slot]),
      );
    }
    case "edge-repeated": {
      const edge = cube.ep.find((piece, i) => cube.ep.indexOf(piece) !== i)!;
      const slots = cube.ep.flatMap((piece, slot) => (piece === edge ? [slot] : []));
      return impossible(
        `Hay dos aristas ${colorList(EDGE_FACES[edge])} (y falta otra arista): en un cubo real cada pieza aparece una sola vez.`,
        slots.flatMap((slot) => EDGE_FACELETS[slot]),
      );
    }
    case "twist":
      return impossible(
        "Hay una esquina girada sobre sí misma: sus colores son correctos, pero están rotados. Girando las caras eso no puede pasar, así que revisa los colores de las esquinas.",
      );
    case "flip":
      return impossible(
        "Hay una arista dada la vuelta: sus dos colores están intercambiados. Girando las caras eso no puede pasar, así que revisa los colores de las aristas.",
      );
    case "parity":
      return impossible(
        "Hay dos piezas intercambiadas entre sí. Girando las caras eso no puede pasar, así que revisa que cada cara esté bien copiada.",
      );
  }

  return { ok: true, cube };
}

// ---------- faces copied turned ----------

/** Sticker order of a face after turning it a quarter clockwise. */
const QUARTER_TURN = [6, 3, 0, 7, 4, 1, 8, 5, 2];

export interface TurnedFace {
  face: FaceName;
  /** Quarter turns clockwise (as the face is shown on screen) that fix it. */
  turns: 1 | 2 | 3;
}

/** The stickers with `face` turned `turns` quarter turns clockwise on screen. */
export function turnFace(facelets: Facelets, { face, turns }: TurnedFace): Facelets {
  let stickers = facelets.slice(faceOffset(face), faceOffset(face) + 9);
  for (let i = 0; i < turns; i++) stickers = QUARTER_TURN.map((n) => stickers[n]);
  const turned = [...facelets];
  turned.splice(faceOffset(face), 9, ...stickers);
  return turned;
}

const TURN_OPTIONS: TurnedFace[] = FACE_NAMES.flatMap((face) =>
  ([1, 2, 3] as const).map((turns) => ({ face, turns })),
);

/**
 * When the stickers are not a real cube, checks whether one face — or
 * failing that, two — was probably read turned (the usual slip when
 * copying a real cube): returns the faces and the turns that fix them, only
 * if exactly one such fix makes the whole cube valid. Never used to solve
 * anything by itself: the user decides whether to apply it.
 */
export function findTurnedFaces(facelets: Facelets): TurnedFace[] | null {
  if (parseFacelets(facelets).ok) return null;
  const valid = (candidate: Facelets) => parseFacelets(candidate).ok;

  const single = TURN_OPTIONS.filter((fix) => valid(turnFace(facelets, fix)));
  if (single.length > 0) return single.length === 1 ? single : null;

  const pairs: TurnedFace[][] = [];
  for (let i = 0; i < TURN_OPTIONS.length; i++) {
    for (let j = i + 1; j < TURN_OPTIONS.length; j++) {
      const [a, b] = [TURN_OPTIONS[i], TURN_OPTIONS[j]];
      if (a.face === b.face) continue;
      if (valid(turnFace(turnFace(facelets, a), b))) pairs.push([a, b]);
    }
  }
  return pairs.length === 1 ? pairs[0] : null;
}

// ---------- what the screen shows ----------

export type Validation =
  | { kind: "valid"; cube: CubieCube; solved: boolean }
  | {
      kind: "incomplete";
      message: string;
      missingByFace: { face: FaceName; missing: number }[];
      issues: Issue[];
    }
  | { kind: "count"; message: string; issues: Issue[] }
  | { kind: "impossible"; message: string; issues: Issue[]; turned: TurnedFace[] | null };

/**
 * Everything the screen says about the stickers as they are being painted:
 * what is missing, which pieces are already wrong, why a complete cube is
 * not valid (and whether a face looks copied turned), or that it is ready.
 */
export function validateFacelets(facelets: Facelets): Validation {
  const parsed = parseFacelets(facelets);
  if (parsed.ok) return { kind: "valid", cube: parsed.cube, solved: isSolved(parsed.cube) };

  if (parsed.reason === "incomplete") {
    const counts = colorCounts(facelets);
    const tooMany = Object.values(CENTER_COLORS)
      .filter((color) => counts[color] > 9)
      .map((color) => ({
        message: `Hay ${counts[color]} pegatinas de color ${COLOR_NAMES[color]}: sobra${counts[color] > 10 ? "n" : ""} ${counts[color] - 9} (cada color va exactamente 9 veces).`,
        stickers: facelets.flatMap((sticker, i) => (sticker === color ? [i] : [])),
      }));
    return {
      kind: "incomplete",
      message: parsed.error,
      missingByFace: FACE_NAMES.map((face) => ({
        face,
        missing: facelets.slice(faceOffset(face), faceOffset(face) + 9).filter((c) => c === null).length,
      })).filter(({ missing }) => missing > 0),
      issues: [...tooMany, ...pieceIssues(facelets)],
    };
  }

  if (parsed.reason === "count") {
    return { kind: "count", message: parsed.error, issues: pieceIssues(facelets) };
  }

  const turned = findTurnedFaces(facelets);
  return {
    kind: "impossible",
    message: parsed.error,
    issues: [{ message: parsed.error, stickers: parsed.stickers }],
    turned,
  };
}

/**
 * Face whose center shows next to sticker `n` (1–9) of `face`: for the
 * middle of each border (2 top, 4 left, 6 right, 8 bottom) this is the face
 * that side of the grid touches, as the screen asks to hold the cube.
 */
export function neighborFace(face: FaceName, n: 2 | 4 | 6 | 8): FaceName {
  const index = at(face, n);
  const edge = EDGE_FACELETS.findIndex((stickers) => stickers.includes(index));
  const side = EDGE_FACELETS[edge].indexOf(index);
  return EDGE_FACES[edge][1 - side];
}
