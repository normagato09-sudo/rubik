/**
 * Shape of the Skewb: a cube from -1 to 1 on each axis, held the way the
 * WCA scrambles it — white on top and green in front on the left, looking
 * at the up-front-right corner (red is the face in front on the right).
 * Its faces keep the names of a 3×3 held with white on top and green in
 * front: U white, F green, R red, D yellow, L orange, B blue.
 *
 * Each face has 5 stickers: the center (a square standing on a corner) and
 * the 4 corner triangles. They are numbered the same way on every face,
 * seen from outside, as on the flat net of a 3×3 (U with B above it, D
 * with F above it, the sides with U above them):
 *
 *      1     2
 *         0
 *      4     3
 *
 * Faces in sticker order, like the 3×3: U 0–4, R 5–9, F 10–14, D 15–19,
 * L 20–24, B 25–29.
 */

export type Vec3 = readonly [number, number, number];

export type SkewbFace = "U" | "R" | "F" | "D" | "L" | "B";

/** The 8 corners, by the three faces they touch. */
export type SkewbCorner = "UFR" | "UFL" | "UBR" | "UBL" | "DFR" | "DFL" | "DBR" | "DBL";

export const SKEWB_FACES: SkewbFace[] = ["U", "R", "F", "D", "L", "B"];
export const SKEWB_CORNERS: SkewbCorner[] = ["UFR", "UFL", "UBR", "UBL", "DFR", "DFL", "DBR", "DBL"];

export const STICKERS_PER_FACE = 5;
export const SKEWB_STICKERS = 30;

export const faceOffsetSkewb = (face: SkewbFace) => SKEWB_FACES.indexOf(face) * STICKERS_PER_FACE;
export const faceOf = (index: number): SkewbFace => SKEWB_FACES[Math.floor(index / STICKERS_PER_FACE)];

/** Each face: the way out of it, and which way is up and right seen from outside (as on the net). */
const FACE_FRAME: Record<SkewbFace, { normal: Vec3; up: Vec3; right: Vec3 }> = {
  U: { normal: [0, 1, 0], up: [0, 0, -1], right: [1, 0, 0] },
  R: { normal: [1, 0, 0], up: [0, 1, 0], right: [0, 0, -1] },
  F: { normal: [0, 0, 1], up: [0, 1, 0], right: [1, 0, 0] },
  D: { normal: [0, -1, 0], up: [0, 0, 1], right: [1, 0, 0] },
  L: { normal: [-1, 0, 0], up: [0, 1, 0], right: [0, 0, 1] },
  B: { normal: [0, 0, -1], up: [0, 1, 0], right: [-1, 0, 0] },
};

export const FACE_NORMAL: Record<SkewbFace, Vec3> = Object.fromEntries(
  SKEWB_FACES.map((face) => [face, FACE_FRAME[face].normal]),
) as Record<SkewbFace, Vec3>;

/** Corner triangles 1–4: up-left, up-right, down-right, down-left (as [up, right] signs). */
const CORNER_SIGNS: [number, number][] = [
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
];

const combine = (terms: [number, Vec3][]): Vec3 =>
  [0, 1, 2].map((k) => terms.reduce((sum, [scale, v]) => sum + scale * v[k], 0)) as unknown as Vec3;

/** The corners of each of the 30 stickers in 3D: 4 for a center, 3 for a corner triangle. */
export const STICKER_POLYGONS: Vec3[][] = SKEWB_FACES.flatMap((face) => {
  const { normal, up, right } = FACE_FRAME[face];
  const center = [
    combine([[1, normal], [1, up]]),
    combine([[1, normal], [1, right]]),
    combine([[1, normal], [-1, up]]),
    combine([[1, normal], [-1, right]]),
  ];
  const corners = CORNER_SIGNS.map(([u, r]) => [
    combine([[1, normal], [u, up], [r, right]]),
    combine([[1, normal], [r, right]]),
    combine([[1, normal], [u, up]]),
  ]);
  return [center, ...corners];
});

export function centroid(points: readonly Vec3[]): Vec3 {
  return [0, 1, 2].map((k) => points.reduce((sum, p) => sum + p[k], 0) / points.length) as unknown as Vec3;
}

export const STICKER_CENTERS: Vec3[] = STICKER_POLYGONS.map(centroid);

export const isCenterSticker = (index: number) => index % STICKERS_PER_FACE === 0;

export const CORNER_POSITION: Record<SkewbCorner, Vec3> = Object.fromEntries(
  SKEWB_CORNERS.map((corner) => [
    corner,
    [corner.includes("R") ? 1 : -1, corner[0] === "U" ? 1 : -1, corner.includes("F") ? 1 : -1] as Vec3,
  ]),
) as Record<SkewbCorner, Vec3>;

export const dot = (p: Vec3, q: Vec3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];

/** The corner a corner sticker belongs to. */
export const cornerOfSticker = (index: number): SkewbCorner =>
  SKEWB_CORNERS.reduce((best, corner) =>
    dot(STICKER_CENTERS[index], CORNER_POSITION[corner]) > dot(STICKER_CENTERS[index], CORNER_POSITION[best])
      ? corner
      : best,
  );

/** Rotation of `point` by `angle` (radians) around the unit `axis`, right-handed. */
export function rotate(point: Vec3, axis: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const k = dot(axis, point) * (1 - cos);
  return [
    point[0] * cos + (axis[1] * point[2] - axis[2] * point[1]) * sin + axis[0] * k,
    point[1] * cos + (axis[2] * point[0] - axis[0] * point[2]) * sin + axis[1] * k,
    point[2] * cos + (axis[0] * point[1] - axis[1] * point[0]) * sin + axis[2] * k,
  ];
}
