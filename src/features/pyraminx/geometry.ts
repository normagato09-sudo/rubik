/**
 * Shape of the Pyraminx: a regular tetrahedron centered at the origin,
 * circumradius 1, held the standard way — yellow face down, green face
 * towards you, red on the left and blue on the right. Its four tips are
 * named like the moves that turn around them: U (top), L (front left),
 * R (front right) and B (back).
 *
 * Each face is a triangle cut into 9 stickers. They are numbered the same
 * way on every face, seen from outside with the face's "apex" on top:
 *
 *            0
 *         1  2  3
 *      4  5  6  7  8
 *
 * 0, 4 and 8 are tips, 2, 5 and 7 (the upside-down ones) are the centers
 * (axial pieces) and 1, 3 and 6 are edges.
 */

export type Vec3 = readonly [number, number, number];
export type Vec2 = readonly [number, number];

export type PyraFace = "F" | "L" | "R" | "D";
export type PyraVertex = "U" | "L" | "R" | "B";

/** Faces in sticker order: F is 0–8, L 9–17, R 18–26 and D 27–35. */
export const PYRA_FACES: PyraFace[] = ["F", "L", "R", "D"];
export const PYRA_VERTICES: PyraVertex[] = ["U", "L", "R", "B"];

export const STICKERS_PER_FACE = 9;
export const PYRA_STICKERS = 36;

export const faceOffsetPyra = (face: PyraFace) => PYRA_FACES.indexOf(face) * STICKERS_PER_FACE;

const S = Math.sqrt(2 / 3);
const Z = Math.SQRT2 / 3;

export const VERTEX_POSITION: Record<PyraVertex, Vec3> = {
  U: [0, 1, 0],
  L: [-S, -1 / 3, Z],
  R: [S, -1 / 3, Z],
  B: [0, -1 / 3, -2 * Z],
};

/**
 * Each face as seen from outside with its apex on top: [apex, bottom left,
 * bottom right]. F, L and R have the U tip on top (the way you see them
 * turning the Pyraminx around it); D is seen tilting the Pyraminx towards
 * you, which leaves it upside down: B at the bottom, L top left, R top right.
 */
export const FACE_CORNERS: Record<PyraFace, [PyraVertex, PyraVertex, PyraVertex]> = {
  F: ["U", "L", "R"],
  L: ["U", "B", "L"],
  R: ["U", "R", "B"],
  D: ["B", "R", "L"],
};

/** The tip each face does not touch. */
export const OPPOSITE_VERTEX: Record<PyraFace, PyraVertex> = { F: "B", L: "R", R: "L", D: "U" };

export type StickerKind = "tip" | "center" | "edge";

export const STICKER_KIND: StickerKind[] = [
  "tip",
  "edge",
  "center",
  "edge",
  "tip",
  "center",
  "edge",
  "center",
  "tip",
];

/** Whether sticker n (0–8) of a face is an upside-down triangle. */
export const isDownSticker = (n: number) => n === 2 || n === 5 || n === 7;

/**
 * The 3 corners of sticker n (0–8) of a triangle with corners `apex`,
 * `left` and `right`, in any number of dimensions (2D drawings, 3D model).
 */
export function stickerCorners<T extends readonly number[]>(apex: T, left: T, right: T, n: number): T[] {
  const lattice = (row: number, column: number) =>
    apex.map((a, i) => a + (row / 3) * (left[i] - a) + (column / 3) * (right[i] - left[i])) as unknown as T;
  const row = n === 0 ? 1 : n < 4 ? 2 : 3;
  const k = n - (row - 1) ** 2;
  const c = k >> 1;
  return k % 2 === 0
    ? [lattice(row - 1, c), lattice(row, c), lattice(row, c + 1)]
    : [lattice(row - 1, c), lattice(row, c + 1), lattice(row - 1, c + 1)];
}

export function centroid<T extends readonly number[]>(points: readonly T[]): T {
  return points[0].map((_, i) => points.reduce((sum, p) => sum + p[i], 0) / points.length) as unknown as T;
}

/** The 3D triangle of each of the 36 stickers. */
export const STICKER_TRIANGLES: Vec3[][] = PYRA_FACES.flatMap((face) => {
  const [apex, left, right] = FACE_CORNERS[face].map((v) => VERTEX_POSITION[v]);
  return Array.from({ length: STICKERS_PER_FACE }, (_, n) => stickerCorners(apex, left, right, n));
});

export const STICKER_CENTERS: Vec3[] = STICKER_TRIANGLES.map((triangle) => centroid(triangle));

export const faceOf = (index: number): PyraFace => PYRA_FACES[Math.floor(index / STICKERS_PER_FACE)];

export const dot = (p: Vec3, q: Vec3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];

/** The tip a sticker belongs to or sits next to (tips and centers only). */
export const nearestVertex = (point: Vec3): PyraVertex =>
  PYRA_VERTICES.reduce((best, v) => (dot(point, VERTEX_POSITION[v]) > dot(point, VERTEX_POSITION[best]) ? v : best));

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
