import type { CubeColor } from "@/features/cube/types";
import { FACE_NAMES, type FaceName } from "./cubie";
import { CENTER_COLORS, emptyFacelets, faceOffset, type Facelets } from "./facelets";

/**
 * Reading a face from a camera frame or a photo, all in the browser:
 * sample the middle of each of the 9 cells of the guide grid, convert to
 * CIELAB and pick the nearest of the 6 colors. The references start as
 * typical camera colors and are replaced by what this cube really looks
 * like under this light: every face has a known center, and every
 * confirmed face adds its stickers.
 */

export type Rgb = readonly [number, number, number];
export type Lab = readonly [number, number, number];

/** Anything with RGBA pixels: ImageData in the browser, plain objects in tests. */
export interface Pixels {
  width: number;
  height: number;
  data: ArrayLike<number>;
}

// ---------- color spaces ----------

const linear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const labF = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);

/** sRGB (0–255) → CIELAB (D65). */
export function rgbToLab([r, g, b]: Rgb): Lab {
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)];
  const x = (0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / 0.95047;
  const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  const z = (0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / 1.08883;
  const [fx, fy, fz] = [labF(x), labF(y), labF(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Hue angle in the a*b* plane, in degrees (red ≈ 40, orange ≈ 60, yellow ≈ 95). */
const hue = ([, a, b]: Lab) => (Math.atan2(b, a) * 180) / Math.PI;

/**
 * Lightness matters little (a white sticker in shadow is still white), the
 * a*b* plane matters a lot: that is where red/orange and white/yellow differ.
 */
const distance = (p: Lab, q: Lab) =>
  Math.sqrt(0.25 * (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2);

// ---------- calibration ----------

/** Typical phone-camera readings of each sticker, before any calibration. */
export const DEFAULT_RGB: Record<CubeColor, Rgb> = {
  white: [205, 208, 206],
  yellow: [215, 200, 45],
  red: [180, 32, 40],
  orange: [235, 110, 35],
  blue: [25, 75, 170],
  green: [25, 150, 80],
};

const COLORS = Object.keys(DEFAULT_RGB) as CubeColor[];

/** Samples of each color as this camera sees this cube. Empty = use the default. */
export type Calibration = Record<CubeColor, Lab[]>;

export function emptyCalibration(): Calibration {
  return { white: [], yellow: [], red: [], orange: [], blue: [], green: [] };
}

/** Keeps the latest samples only: the light may change while scanning. */
const MAX_SAMPLES = 24;

/** `calibration` plus the given samples, whose colors are known. */
export function calibrate(
  calibration: Calibration,
  samples: readonly Rgb[],
  colors: readonly (CubeColor | null)[],
): Calibration {
  const next: Calibration = { ...calibration };
  samples.forEach((sample, i) => {
    const color = colors[i];
    if (color) next[color] = [...next[color], rgbToLab(sample)].slice(-MAX_SAMPLES);
  });
  return next;
}

const references = (calibration: Calibration, color: CubeColor): Lab[] =>
  calibration[color].length > 0 ? calibration[color] : [rgbToLab(DEFAULT_RGB[color])];

const nearest = (lab: Lab, refs: Lab[]) =>
  refs.reduce(
    (best, ref) => {
      const d = distance(lab, ref);
      return d < best.d ? { d, ref } : best;
    },
    { d: Infinity, ref: refs[0] },
  );

// ---------- classification ----------

export interface Classified {
  color: CubeColor;
  /** Close call between two colors, or not a sticker at all: worth a look when reviewing. */
  unsure: boolean;
}

/**
 * Whether a sample can be a sticker: colorful, or bright enough to be
 * white. Black plastic or a dark room is neither — without this check it
 * would read as white, whose only feature is having no color.
 */
export function looksLikeSticker(rgb: Rgb): boolean {
  const [l, a, b] = rgbToLab(rgb);
  return Math.hypot(a, b) >= 15 || l >= 40;
}

/**
 * The nearest color. When the two closest are red/orange or white/yellow —
 * the pairs cameras confuse — the decision is made on the one feature that
 * separates them, halfway between this cube's own references: the hue for
 * red/orange, the amount of yellow (b*) for white/yellow.
 */
export function classifyColor(
  rgb: Rgb,
  calibration: Calibration = emptyCalibration(),
  /** The colors the puzzle has (a Pyraminx only has 4). */
  palette: readonly CubeColor[] = COLORS,
): Classified {
  const lab = rgbToLab(rgb);
  const ranked = palette.map((color) => ({ color, ...nearest(lab, references(calibration, color)) })).sort(
    (p, q) => p.d - q.d,
  );
  const [first, second] = ranked;
  let color = first.color;
  let margin = (second.d - first.d) / (second.d + first.d || 1);

  const pair = (x: CubeColor, y: CubeColor) =>
    (first.color === x && second.color === y) || (first.color === y && second.color === x);
  const refOf = (c: CubeColor) => (first.color === c ? first.ref : second.ref);

  if (pair("red", "orange")) {
    const [red, orange] = [hue(refOf("red")), hue(refOf("orange"))];
    const split = (red + orange) / 2;
    color = hue(lab) < split ? "red" : "orange";
    margin = Math.abs(hue(lab) - split) / (Math.abs(orange - red) / 2 || 1);
  } else if (pair("white", "yellow")) {
    const [white, yellow] = [refOf("white")[2], refOf("yellow")[2]];
    const split = (white + yellow) / 2;
    color = lab[2] < split ? "white" : "yellow";
    margin = Math.abs(lab[2] - split) / (Math.abs(yellow - white) / 2 || 1);
  }

  return { color, unsure: margin < 0.25 || !looksLikeSticker(rgb) };
}

/**
 * The 9 stickers of `face` from their samples (row by row, as the guide
 * grid shows them). The center is known, so it is always the face's color
 * and its sample calibrates the other 8 before they are classified.
 */
export function classifyFace(
  samples: readonly Rgb[],
  face: FaceName,
  calibration: Calibration,
): Classified[] {
  const center = CENTER_COLORS[face];
  const withCenter = calibrate(calibration, [samples[4]], [center]);
  return samples.map((sample, i) =>
    i === 4 ? { color: center, unsure: false } : classifyColor(sample, withCenter),
  );
}

/**
 * The 4 stickers of a 2×2 face. There is no center to calibrate with, so
 * each sample is compared with this cube's colors as seen on the faces
 * already confirmed (or typical camera colors before the first one); close
 * calls come back `unsure`, to be marked with "?".
 */
export function classifyFace2x2(samples: readonly Rgb[], calibration: Calibration): Classified[] {
  return samples.map((sample) => classifyColor(sample, calibration));
}

/**
 * Whether the 2×2 face in view can be a new one: not the face just
 * confirmed, still in front of the camera (the 3×3 checks its center).
 */
export function isNewFace(colors: readonly (CubeColor | null)[], previous: readonly (CubeColor | null)[] | undefined): boolean {
  return !previous || colors.some((color, i) => color !== previous[i]);
}

// ---------- sampling the image ----------

/** Share of the image's short side the guide grid covers (the overlay uses the same). */
export const GUIDE_FRACTION = 0.7;

export interface Square {
  x: number;
  y: number;
  size: number;
}

/** The guide grid inside a `width`×`height` image: centered, same share of the short side. */
export function guideSquare(width: number, height: number): Square {
  const size = Math.min(width, height) * GUIDE_FRACTION;
  return { x: (width - size) / 2, y: (height - size) / 2, size };
}

const median = (values: number[]) => {
  const sorted = [...values].sort((p, q) => p - q);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Median of each channel over a small square around (cx, cy): glare and edges don't count. */
export function medianColor(image: Pixels, cx: number, cy: number, radius: number): Rgb {
  const r: number[] = [];
  const g: number[] = [];
  const b: number[] = [];
  const x0 = Math.max(0, Math.round(cx - radius));
  const x1 = Math.min(image.width - 1, Math.round(cx + radius));
  const y0 = Math.max(0, Math.round(cy - radius));
  const y1 = Math.min(image.height - 1, Math.round(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * image.width + x) * 4;
      r.push(image.data[i]);
      g.push(image.data[i + 1]);
      b.push(image.data[i + 2]);
    }
  }
  return [median(r), median(g), median(b)];
}

/**
 * One sample per cell of the guide grid (`size` × `size`: 3 for a 3×3,
 * 2 for a 2×2), row by row, from the middle of each cell.
 */
export function sampleFace(
  image: Pixels,
  square = guideSquare(image.width, image.height),
  size: 2 | 3 = 3,
): Rgb[] {
  const cell = square.size / size;
  const radius = Math.max(1, cell * 0.15);
  return Array.from({ length: size * size }, (_, i) =>
    medianColor(
      image,
      square.x + cell * ((i % size) + 0.5),
      square.y + cell * (Math.floor(i / size) + 0.5),
      radius,
    ),
  );
}

// ---------- automatic capture ----------

/**
 * True once the same 9 colors have been read continuously for `holdMs`:
 * the cube is steady in front of the camera, so the frame can be captured.
 */
export function createStabilityTracker(holdMs = 1000) {
  let key = "";
  let since = 0;
  return {
    push(colors: readonly CubeColor[], now: number): boolean {
      const next = colors.join();
      if (next !== key) {
        key = next;
        since = now;
      }
      return now - since >= holdMs;
    },
    /** How far along the hold is, 0–1 (for a progress bar). */
    progress(now: number): number {
      return key ? Math.min(1, (now - since) / holdMs) : 0;
    },
    reset() {
      key = "";
    },
  };
}

/**
 * Whether the center in view can be `face`'s: false when it reads as the
 * center of a face already scanned — the previous face is still in front
 * of the camera and must not be captured again. A center that merely
 * looks off (say, a white read as yellow before any calibration) passes.
 */
export function centerFits(
  center: Rgb,
  face: FaceName,
  calibration: Calibration,
  scanned: readonly FaceName[],
): boolean {
  const { color } = classifyColor(center, calibration);
  if (color === CENTER_COLORS[face]) return true;
  return !scanned.some((done) => CENTER_COLORS[done] === color);
}

// ---------- scanned faces → editor ----------

export type ScannedFaces = Partial<Record<FaceName, readonly (CubeColor | null)[]>>;

/**
 * The editor's 54 stickers from the scanned faces (each read row by row,
 * held as the hints say, which is the editor's own layout). Faces not
 * scanned stay empty; centers are always the fixed ones.
 */
export function faceletsFromScans(scans: ScannedFaces): Facelets {
  const facelets = emptyFacelets();
  for (const face of FACE_NAMES) {
    const stickers = scans[face];
    if (!stickers) continue;
    stickers.forEach((color, i) => {
      if (i !== 4) facelets[faceOffset(face) + i] = color;
    });
  }
  return facelets;
}
