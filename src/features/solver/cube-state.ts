/**
 * Bridge between the 3D cube model (features/cube, the source of truth for
 * faces, colors and moves in RUBIKO) and the solver's 54 stickers.
 *
 * World axes of features/cube: +x right, +y up, +z front, so holding the
 * cube white up and green front puts U=+y, D=-y, F=+z, B=-z, R=+x, L=-x.
 *
 * Each face of the net is read row by row (1–9) exactly as the solver
 * screen asks the user to hold the cube:
 *   U — from above, F at the bottom edge  → row 1 is the back row.
 *   D — from below, F at the top edge     → row 1 is the front row.
 *   F, R, B, L — facing that side, U on top; the sticker on the left is
 *     the one next to the face on the left when looking at it (for R that
 *     is F, for B it is R, for L it is B, for F it is L).
 */
import type { CubeState, StickerFace, Vec3 } from "@/features/cube/types";
import { FACE_NAMES, type FaceName } from "./cubie";
import type { Facelets } from "./facelets";

/**
 * World position of the piece and outward normal of sticker n (0–8, row
 * by row) of each face, following the convention documented above.
 */
const STICKER_GEOMETRY: Record<FaceName, (row: number, col: number) => [Vec3, Vec3]> = {
  U: (r, c) => [[c - 1, 1, r - 1], [0, 1, 0]],
  R: (r, c) => [[1, 1 - r, 1 - c], [1, 0, 0]],
  F: (r, c) => [[c - 1, 1 - r, 1], [0, 0, 1]],
  D: (r, c) => [[c - 1, -1, 1 - r], [0, -1, 0]],
  L: (r, c) => [[-1, 1 - r, c - 1], [-1, 0, 0]],
  B: (r, c) => [[1 - c, 1 - r, -1], [0, 0, -1]],
};

/** Position and outward normal of each of the 54 stickers, in solver order. */
export const FACELET_GEOMETRY: [Vec3, Vec3][] = FACE_NAMES.flatMap((face) =>
  Array.from({ length: 9 }, (_, n) => STICKER_GEOMETRY[face](Math.floor(n / 3), n % 3)),
);

const same = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const negate = (v: Vec3): Vec3 => [-v[0], -v[1], -v[2]];

const LOCAL_AXIS: Record<StickerFace, { axis: "x" | "y" | "z"; sign: 1 | -1 }> = {
  "+x": { axis: "x", sign: 1 },
  "-x": { axis: "x", sign: -1 },
  "+y": { axis: "y", sign: 1 },
  "-y": { axis: "y", sign: -1 },
  "+z": { axis: "z", sign: 1 },
  "-z": { axis: "z", sign: -1 },
};

/** The 54 sticker colors of a 3D cube state, in the solver's order. */
export function faceletsFromCubeState(state: CubeState): Facelets {
  return FACELET_GEOMETRY.map(([position, normal]) => {
    const cubie = state.cubies.find((piece) => same(piece.position, position));
    const sticker = cubie?.stickers.find(({ face }) => {
      const { axis, sign } = LOCAL_AXIS[face];
      const world = cubie.orientation[axis];
      return same(sign === 1 ? world : negate(world), normal);
    });
    if (!sticker) throw new Error(`No hay pegatina en ${position} hacia ${normal}.`);
    return sticker.color;
  });
}
