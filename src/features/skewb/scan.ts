/**
 * Reading a Skewb face from a camera frame or a photo. The guide is the
 * same square as the cube's (features/solver/color-scan.ts), but a Skewb
 * face is a center standing on a corner and 4 corner triangles, so it is
 * sampled at the middle of each of those 5 stickers. Its centers move, so
 * — like the 2×2 — there is no fixed sticker to calibrate with: the faces
 * already confirmed are the reference, and close calls come back unsure.
 */
import {
  classifyColor,
  guideSquare,
  medianColor,
  type Calibration,
  type Classified,
  type Pixels,
  type Rgb,
  type Square,
} from "@/features/solver/color-scan";
import type { CubeColor } from "@/features/cube/types";
import { faceOffsetSkewb, type SkewbFace } from "./geometry";
import { SKEWB_COLORS, emptySkewbFacelets, type SkewbFacelets } from "./facelets";

/** Order to copy the faces in, as on a cube: each hint starts from the previous position. */
export const SKEWB_FACE_ORDER: SkewbFace[] = ["U", "F", "R", "B", "L", "D"];

/**
 * The middle of each of the 5 stickers of a face inside the guide square,
 * numbered as in geometry.ts: the center, then the corners up-left,
 * up-right, down-right and down-left. A corner triangle's middle is a
 * third of the side in from its corner.
 */
export function skewbStickerMiddles({ x, y, size }: Square): [number, number][] {
  const [cx, cy] = [x + size / 2, y + size / 2];
  const d = size / 6;
  return [
    [cx, cy],
    [cx - 2 * d, cy - 2 * d],
    [cx + 2 * d, cy - 2 * d],
    [cx + 2 * d, cy + 2 * d],
    [cx - 2 * d, cy + 2 * d],
  ];
}

/** One sample per sticker of the guide square, numbered as in geometry.ts. */
export function sampleSkewbFace(image: Pixels): Rgb[] {
  const square = guideSquare(image.width, image.height);
  // A corner triangle's inscribed circle has radius ≈ 0.073 of the side: stay well inside it.
  const radius = Math.max(1, square.size * 0.035);
  return skewbStickerMiddles(square).map(([x, y]) => medianColor(image, x, y, radius));
}

/** The 5 stickers of a face, each matched among the Skewb's 6 colors. */
export const classifySkewbFace = (samples: readonly Rgb[], calibration: Calibration): Classified[] =>
  samples.map((sample) => classifyColor(sample, calibration, SKEWB_COLORS));

export type ScannedSkewbFaces = Partial<Record<SkewbFace, readonly (CubeColor | null)[]>>;

/** The editor's 30 stickers from the faces read so far (each in geometry.ts's order). */
export function skewbFaceletsFromScans(scans: ScannedSkewbFaces): SkewbFacelets {
  const facelets = emptySkewbFacelets();
  for (const face of SKEWB_FACE_ORDER) {
    scans[face]?.forEach((color, n) => {
      facelets[faceOffsetSkewb(face) + n] = color;
    });
  }
  return facelets;
}
