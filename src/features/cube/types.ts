/**
 * Pure data model of a 3x3x3 Rubik's cube. No Three.js / rendering
 * concerns live here so this can be tested and reused (scramble, timer
 * replays, solver) independently of how it is drawn on screen.
 */

/** Integer vector; components are always in {-1, 0, 1} for this cube. */
export type Vec3 = readonly [number, number, number];

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
  /** Current position in the 3x3x3 grid. */
  position: Vec3;
  orientation: Orientation;
  /** Fixed set of colored stickers glued to this piece's local faces. */
  stickers: Sticker[];
}

/** Full state of the cube: just the 26 visible pieces. */
export interface CubeState {
  cubies: Cubie[];
}
