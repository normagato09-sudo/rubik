/**
 * Pure data model of a Rubik's cube (2×2 to 5×5). No Three.js / rendering
 * concerns live here so this can be tested and reused (scramble, timer
 * replays, solver) independently of how it is drawn on screen.
 */

/**
 * Integer vector. On odd cubes the layers are consecutive integers around 0
 * (3×3: -1, 0, 1; 5×5: -2 … 2); on even ones, odd integers (2×2: -1, 1;
 * 4×4: -3, -1, 1, 3), so a quarter turn is always an exact swap of integers.
 */
export type Vec3 = readonly [number, number, number];

/** Pieces per edge: 2×2 to 5×5. */
export type CubeSize = 2 | 3 | 4 | 5;

/** The six classic face colors. */
export type CubeColor =
  | "white"
  | "yellow"
  | "red"
  | "orange"
  | "blue"
  | "green";

/** A local face of a cubie, fixed to the piece regardless of rotation. */
export type StickerFace = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

/** A colored sticker glued to one local face of a cubie. */
export interface Sticker {
  face: StickerFace;
  color: CubeColor;
}

/**
 * Orientation of a cubie as the world-space direction each of its local
 * axes currently points to. Every reachable orientation of a cube piece
 * is a signed permutation of the axes, so this stays exact (no drift)
 * across the 90 degree rotations that face turns will apply later.
 */
export interface Orientation {
  x: Vec3;
  y: Vec3;
  z: Vec3;
}

export const IDENTITY_ORIENTATION: Orientation = {
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
};

/** A single small cube piece (center, edge or corner). */
export interface Cubie {
  /** Stable identity for the piece, independent of its current position. */
  id: string;
  /** Current position in the grid (see Vec3: {-1, 0, 1} per axis on a 3×3, {-1, 1} on a 2×2). */
  position: Vec3;
  orientation: Orientation;
  /** Fixed set of colored stickers glued to this piece's local faces. */
  stickers: Sticker[];
}

/** Full state of the cube: just the visible pieces (8 on a 2×2, 26 on a 3×3, 56 on a 4×4, 98 on a 5×5). */
export interface CubeState {
  cubies: Cubie[];
}
