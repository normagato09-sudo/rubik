import type { CubeColor } from "@/features/cube/types";
import { FACE_NAMES, type CubieCube, type FaceName } from "./cubie";

/**
 * 54 stickers in Kociemba order: U1–U9, R1–R9, F1–F9, D1–D9, L1–L9, B1–B9,
 * each face read row by row as it looks in the net below:
 *
 *            U
 *        L   F   R   B
 *            D
 *
 * U is seen from above with F at its bottom edge; D from below with F at its
 * top edge; the side faces with U on top.
 */
export type Facelets = (CubeColor | null)[];

/** Holding the cube white up, green front (the scheme used in Aprender). */
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

export type ParseResult = { ok: true; cube: CubieCube } | { ok: false; error: string };

export const COLOR_NAMES: Record<CubeColor, string> = {
  white: "blanco",
  yellow: "amarillo",
  red: "rojo",
  orange: "naranja",
  blue: "azul",
  green: "verde",
};

function parity(permutation: number[]): number {
  let swaps = 0;
  for (let i = 0; i < permutation.length; i++) {
    for (let j = i + 1; j < permutation.length; j++) {
      if (permutation[i] > permutation[j]) swaps++;
    }
  }
  return swaps % 2;
}

/**
 * Turns the painted stickers into a cubie cube, or explains (in Spanish)
 * why that cube cannot exist — a wrong count, an impossible piece, or a
 * twisted corner / flipped edge / swapped pair that no turn can reach.
 */
export function parseFacelets(facelets: Facelets): ParseResult {
  const missing = facelets.filter((color) => color === null).length;
  if (missing > 0) {
    return { ok: false, error: `Faltan ${missing} pegatinas por colorear.` };
  }

  for (const color of Object.values(CENTER_COLORS)) {
    const count = facelets.filter((sticker) => sticker === color).length;
    if (count !== 9) {
      return {
        ok: false,
        error: `Hay ${count} pegatinas de color ${COLOR_NAMES[color]}; tienen que ser 9.`,
      };
    }
  }

  const faceOf = new Map<CubeColor, FaceName>(
    FACE_NAMES.map((face) => [facelets[CENTER_INDEX(face)]!, face]),
  );
  const f = facelets.map((color) => faceOf.get(color!)!);

  const cube: CubieCube = { cp: [], co: [], ep: [], eo: [] };

  for (let slot = 0; slot < 8; slot++) {
    const stickers = CORNER_FACELETS[slot].map((index) => f[index]);
    const ori = stickers.findIndex((face) => face === "U" || face === "D");
    const side1 = stickers[(ori + 1) % 3];
    const side2 = stickers[(ori + 2) % 3];
    const corner = CORNER_FACES.findIndex(
      (faces) => ori !== -1 && faces[1] === side1 && faces[2] === side2,
    );
    if (corner === -1) {
      return { ok: false, error: "Hay una esquina con una combinación de colores imposible." };
    }
    cube.cp.push(corner);
    cube.co.push(ori);
  }

  for (let slot = 0; slot < 12; slot++) {
    const [a, b] = EDGE_FACELETS[slot].map((index) => f[index]);
    let found = false;
    for (let edge = 0; edge < 12 && !found; edge++) {
      const [x, y] = EDGE_FACES[edge];
      if (a === x && b === y) {
        cube.ep.push(edge);
        cube.eo.push(0);
        found = true;
      } else if (a === y && b === x) {
        cube.ep.push(edge);
        cube.eo.push(1);
        found = true;
      }
    }
    if (!found) {
      return { ok: false, error: "Hay una arista con una combinación de colores imposible." };
    }
  }

  if (new Set(cube.cp).size !== 8) {
    return { ok: false, error: "Hay una esquina repetida (y otra que falta)." };
  }
  if (new Set(cube.ep).size !== 12) {
    return { ok: false, error: "Hay una arista repetida (y otra que falta)." };
  }
  if (cube.co.reduce((sum, twist) => sum + twist, 0) % 3 !== 0) {
    return { ok: false, error: "Hay una esquina girada sobre sí misma: revisa sus colores." };
  }
  if (cube.eo.reduce((sum, flip) => sum + flip, 0) % 2 !== 0) {
    return { ok: false, error: "Hay una arista dada la vuelta: revisa sus colores." };
  }
  if (parity(cube.cp) !== parity(cube.ep)) {
    return {
      ok: false,
      error: "Hay dos piezas intercambiadas: así el cubo no se puede resolver.",
    };
  }

  return { ok: true, cube };
}
