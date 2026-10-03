/**
 * Tools for the 3×3 cases RUBIKO teaches from research (Petrus, ZZ, Roux):
 * the state each case is in, read from the 3D engine, and how to tell its
 * pieces apart. Held like the sheets: yellow up, white down, green front
 * (RUBIKO's solved cube turned over with z2, so orange is on the right and
 * red on the left).
 */
import { parseCubeAlgorithm } from "@/features/cube/algorithm";
import { createSolvedCube } from "@/features/cube/model";
import { applyMoves, invertMoves, type Move } from "@/features/cube/moves";
import type { CubeColor, CubeState, Vec3 } from "@/features/cube/types";
import { FACELET_GEOMETRY, faceletsFromCubeState } from "@/features/solver/cube-state";
import { FACE_NAMES, type FaceName } from "@/features/solver/cubie";

/** The sheets hold the cube yellow up: RUBIKO's solved cube turned over. */
export const SHEET_FRAME_3: Move[] = ["z2"];

/** The solved cube held like the sheets. */
export const sheetSolved3 = (): CubeState => applyMoves(createSolvedCube(), SHEET_FRAME_3);

/** The case an algorithm solves: the algorithm undone from `goal` (by default, the solved cube). */
export function caseState3(algorithm: string, goal: CubeState = sheetSolved3()): CubeState {
  return applyMoves(goal, invertMoves(parseCubeAlgorithm(algorithm)));
}

/** The 54 stickers, in the solver's order (U, R, F, D, L, B, each face row by row). */
export const facelets3 = (state: CubeState): CubeColor[] => faceletsFromCubeState(state);

/** Index of sticker n (0–8, row by row as the solver reads it) of `face`. */
export const sticker3 = (face: FaceName, n: number) => FACE_NAMES.indexOf(face) * 9 + n;

const sameVec = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/** The stickers of the pieces at the given positions (all their faces). */
export function stickersAt(positions: readonly Vec3[]): Set<number> {
  const shown = new Set<number>();
  FACELET_GEOMETRY.forEach(([position], index) => {
    if (positions.some((p) => sameVec(p, position))) shown.add(index);
  });
  return shown;
}

/** Every position of the 3×3 grid (no core) for which `inside` holds. */
export function positionsWhere(inside: (p: Vec3) => boolean): Vec3[] {
  const positions: Vec3[] = [];
  for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      for (const z of [-1, 0, 1]) {
        const p: Vec3 = [x, y, z];
        if ((x !== 0 || y !== 0 || z !== 0) && inside(p)) positions.push(p);
      }
    }
  }
  return positions;
}

/**
 * Whether the pieces whose home is in `positions` are home and turned the
 * right way, in `state` compared with `goal`.
 */
export function piecesSolved(state: CubeState, positions: readonly Vec3[], goal: CubeState = sheetSolved3()): boolean {
  return positions.every((position) => {
    if (position.filter((c) => c === 0).length === 2) return centerHome(state, position, goal);
    const home = goal.cubies.find((cubie) => sameVec(cubie.position, position))!;
    const now = state.cubies.find((cubie) => cubie.id === home.id)!;
    return (
      sameVec(now.position, home.position) &&
      sameVec(now.orientation.x, home.orientation.x) &&
      sameVec(now.orientation.y, home.orientation.y)
    );
  });
}

/** Whether the center whose home is `position` is there (a center spun in place looks the same). */
function centerHome(state: CubeState, position: Vec3, goal: CubeState): boolean {
  const home = goal.cubies.find((cubie) => sameVec(cubie.position, position))!;
  return sameVec(state.cubies.find((cubie) => cubie.id === home.id)!.position, position);
}

/** Which axis a position is on: the edges have exactly one 0. */
export const isEdge = (p: Vec3) => p.filter((c) => c === 0).length === 1;
export const isCorner = (p: Vec3) => p.every((c) => c !== 0);

/**
 * Edge orientation as ZZ and Petrus see it: an edge is good when it can
 * reach its place with R, U, L and D only (no quarter turns of F or B).
 * Its key sticker is the yellow or white one, or the green or blue one if
 * it has neither; the edge is good when that sticker faces up or down, or
 * faces front or back while the edge is in the middle layer.
 */
export function edgeIsGood(state: CubeState, position: Vec3): boolean {
  const facelets = facelets3(state);
  const indices = [...stickersAt([position])];
  const colors = indices.map((i) => facelets[i]);
  const key =
    colors.findIndex((c) => c === "yellow" || c === "white") !== -1
      ? colors.findIndex((c) => c === "yellow" || c === "white")
      : colors.findIndex((c) => c === "green" || c === "blue");
  const normal = FACELET_GEOMETRY[indices[key]][1];
  if (normal[1] !== 0) return true;
  return position[1] === 0 && normal[2] !== 0;
}

// ---------- words for the explanations ----------

const COLOR_ADJECTIVE: Record<CubeColor, string> = {
  white: "blanca",
  yellow: "amarilla",
  red: "roja",
  orange: "naranja",
  blue: "azul",
  green: "verde",
};

export const COLOR_NOUN: Record<CubeColor, string> = {
  white: "blanco",
  yellow: "amarillo",
  red: "rojo",
  orange: "naranja",
  blue: "azul",
  green: "verde",
};

/** The colors of the piece at `home` in `goal`, up or down first, then front or back, then the sides. */
function homeColors(home: Vec3, goal: CubeState): CubeColor[] {
  const facelets = facelets3(goal);
  return [...stickersAt([home])]
    .map((i) => ({ color: facelets[i], axis: FACELET_GEOMETRY[i][1].findIndex((c) => c !== 0) }))
    .sort((a, b) => [1, 2, 0].indexOf(a.axis) - [1, 2, 0].indexOf(b.axis))
    .map(({ color }) => color);
}

/** "la esquina blanca-verde-roja", "la arista verde-roja". */
export function pieceLabel(home: Vec3, goal: CubeState = sheetSolved3()): string {
  return `la ${isCorner(home) ? "esquina" : "arista"} ${homeColors(home, goal).map((c) => COLOR_ADJECTIVE[c]).join("-")}`;
}

/** "arriba, delante a la derecha", "arriba detrás", "en la capa del medio, detrás a la izquierda". */
export function placeName([x, y, z]: Vec3): string {
  const depth = z === 1 ? "delante" : z === -1 ? "detrás" : "";
  const side = x === 1 ? "a la derecha" : x === -1 ? "a la izquierda" : "";
  const where = [depth, side].filter(Boolean).join(" ");
  if (y === 0) return `en la capa del medio, ${where}`;
  return `${y === 1 ? "arriba" : "abajo"}${isCorner([x, y, z]) ? "," : ""} ${where}`;
}

/** Where a sticker facing `normal` looks. */
export function facingName(normal: Vec3): string {
  if (normal[1] !== 0) return normal[1] === 1 ? "hacia arriba" : "hacia abajo";
  if (normal[2] !== 0) return normal[2] === 1 ? "hacia ti" : "hacia atrás";
  return normal[0] === 1 ? "a la derecha" : "a la izquierda";
}

/** Where the piece whose home is `home` is now, and which way each of its colors faces. */
export function locatePiece(state: CubeState, home: Vec3, goal: CubeState = sheetSolved3()) {
  const piece = goal.cubies.find((cubie) => sameVec(cubie.position, home))!;
  const now = state.cubies.find((cubie) => cubie.id === piece.id)!;
  const facelets = facelets3(state);
  const facing = (color: CubeColor): Vec3 | undefined => {
    const index = [...stickersAt([now.position])].find((i) => facelets[i] === color);
    return index === undefined ? undefined : FACELET_GEOMETRY[index][1];
  };
  return { position: now.position, facing, home: sameVec(now.position, home) };
}

/**
 * "la esquina blanca-verde-roja está arriba, delante a la izquierda, con el
 * blanco mirando hacia ti" — or "ya está en su sitio" — for each piece.
 */
export function describePiece(state: CubeState, home: Vec3, keyColor: CubeColor, goal: CubeState = sheetSolved3()): string {
  const { position, facing, home: atHome } = locatePiece(state, home, goal);
  const label = pieceLabel(home, goal);
  if (atHome && piecesSolved(state, [home], goal)) return `${label} ya está en su sitio`;
  const where = atHome ? "está en su sitio pero girada" : `está ${placeName(position)}`;
  return `${label} ${where}, con el ${COLOR_NOUN[keyColor]} mirando ${facingName(facing(keyColor)!)}`;
}

/** The 24 ways of holding the cube. */
const HOLDS: Move[][] = ([[], ["x"], ["x2"], ["x'"], ["z"], ["z'"]] as Move[][]).flatMap((a) =>
  ([[], ["y"], ["y2"], ["y'"]] as Move[][]).map((b) => [...a, ...b]),
);

const isCenter = (p: Vec3) => p.filter((c) => c === 0).length === 2;

/**
 * The same cube held again with its centers where `goal` has them, for an
 * algorithm that turns the whole cube (a "y" first). A center spun in
 * place by M, E or S cannot be seen, so only where centers are counts.
 */
export function heldLike(state: CubeState, goal: CubeState = sheetSolved3()): CubeState {
  for (const hold of HOLDS) {
    const held = applyMoves(state, hold);
    const home = goal.cubies.filter((cubie) => isCenter(cubie.position));
    if (home.every((center) => sameVec(held.cubies.find((c) => c.id === center.id)!.position, center.position))) return held;
  }
  throw new Error("Los centros no están en ninguna forma de sujetar el cubo.");
}
