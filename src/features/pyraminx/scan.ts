/**
 * Reading a Pyraminx face from a camera frame or a photo: the guide is a
 * triangle instead of a square, and each of its 9 stickers is sampled at
 * its middle. Only 4 colors exist, so each sample is matched among those
 * (features/solver/color-scan.ts does the color science). A Pyraminx has
 * no fixed sticker to calibrate with, so — like the 2×2 — the faces
 * already confirmed are the reference, and close calls come back unsure.
 */
import {
  classifyColor,
  medianColor,
  type Calibration,
  type Classified,
  type Pixels,
  type Rgb,
} from "@/features/solver/color-scan";
import { centroid, stickerCorners, type PyraFace, type Vec2 } from "./geometry";
import { PYRA_COLORS, type PyraColor } from "./moves";
import { emptyPyraFacelets, type PyraFacelets } from "./facelets";

/** Side of the guide triangle, as a share of the image's short side. */
export const PYRA_GUIDE_FRACTION = 0.8;

/** Order to copy the faces in: each hint starts from the previous position. */
export const PYRA_FACE_ORDER: PyraFace[] = ["F", "R", "L", "D"];

/**
 * The bottom face is seen tilting the Pyraminx away from you, so it shows
 * upside down: the editor and the camera draw it pointing down, as it is seen.
 */
export const isUpsideDown = (face: PyraFace) => face === "D";

/**
 * A face's triangle inside a `width`×`height` box, as [apex, left, right]
 * in geometry.ts's sticker order: centered, `fraction` of the short side.
 * Upside down, the apex is at the bottom and left/right swap sides.
 */
export function pyraTriangle(
  width: number,
  height: number,
  upsideDown = false,
  fraction = PYRA_GUIDE_FRACTION,
): [Vec2, Vec2, Vec2] {
  const side = Math.min(width, height) * fraction;
  const h = (side * Math.sqrt(3)) / 2;
  const [cx, cy] = [width / 2, height / 2];
  const top = cy - h / 2;
  const bottom = cy + h / 2;
  return upsideDown
    ? [
        [cx, bottom],
        [cx + side / 2, top],
        [cx - side / 2, top],
      ]
    : [
        [cx, top],
        [cx - side / 2, bottom],
        [cx + side / 2, bottom],
      ];
}

/** The middle of each of the 9 stickers of a triangle. */
export const stickerMiddles = (triangle: [Vec2, Vec2, Vec2]): Vec2[] =>
  Array.from({ length: 9 }, (_, n) => centroid(stickerCorners(...triangle, n)));

/** One sample per sticker of the guide triangle, numbered as in geometry.ts. */
export function samplePyraFace(image: Pixels, upsideDown = false): Rgb[] {
  const triangle = pyraTriangle(image.width, image.height, upsideDown);
  const side = Math.min(image.width, image.height) * PYRA_GUIDE_FRACTION;
  // A sticker's inscribed circle has radius side/3 · √3/6 ≈ 0.096·side: stay well inside it.
  const radius = Math.max(1, side * 0.035);
  return stickerMiddles(triangle).map(([x, y]) => medianColor(image, x, y, radius));
}

/** The 9 stickers of a face, each matched among the Pyraminx's 4 colors. */
export function classifyPyraFace(samples: readonly Rgb[], calibration: Calibration): (Classified & { color: PyraColor })[] {
  return samples.map((sample) => classifyColor(sample, calibration, PYRA_COLORS) as Classified & { color: PyraColor });
}

export type ScannedPyraFaces = Partial<Record<PyraFace, readonly (PyraColor | null)[]>>;

/** The editor's 36 stickers from the faces read so far (each in geometry.ts's order). */
export function pyraFaceletsFromScans(scans: ScannedPyraFaces): PyraFacelets {
  const facelets = emptyPyraFacelets();
  (["F", "L", "R", "D"] as const).forEach((face, f) => {
    scans[face]?.forEach((color, n) => {
      facelets[f * 9 + n] = color;
    });
  });
  return facelets;
}
