import { describe, expect, it } from "vitest";
import { DEFAULT_RGB, emptyCalibration, type Pixels, type Rgb } from "@/features/solver/color-scan";
import { stickerCorners, type Vec2 } from "./geometry";
import { validatePyraFacelets } from "./facelets";
import { applyPyraMoves, parsePyraAlgorithm, solvedPyraminx, type PyraColor } from "./moves";
import {
  PYRA_FACE_ORDER,
  classifyPyraFace,
  isUpsideDown,
  pyraFaceletsFromScans,
  pyraTriangle,
  samplePyraFace,
  type ScannedPyraFaces,
} from "./scan";

const WIDTH = 320;
const HEIGHT = 180;

const inside = ([px, py]: Vec2, [a, b, c]: Vec2[]) => {
  const side = (p: Vec2, q: Vec2) => (q[0] - p[0]) * (py - p[1]) - (q[1] - p[1]) * (px - p[0]);
  const [d1, d2, d3] = [side(a, b), side(b, c), side(c, a)];
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

/** A photo of a face: dark plastic, and each sticker a slightly shrunk, slightly noisy triangle. */
function photo(colors: readonly PyraColor[], upsideDown: boolean, light = 1): Pixels {
  const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  const triangle = pyraTriangle(WIDTH, HEIGHT, upsideDown);
  const stickers = colors.map((_, n) => {
    const corners = stickerCorners(...triangle, n);
    const [cx, cy] = [0, 1].map((k) => corners.reduce((sum, p) => sum + p[k], 0) / 3);
    return corners.map(([x, y]) => [cx + (x - cx) * 0.85, cy + (y - cy) * 0.85] as Vec2);
  });
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const n = stickers.findIndex((corners) => inside([x, y], corners));
      const base: Rgb = n === -1 ? [20, 20, 22] : DEFAULT_RGB[colors[n]];
      const noise = ((x * 7 + y * 13) % 11) - 5;
      const i = (y * WIDTH + x) * 4;
      for (let k = 0; k < 3; k++) data[i + k] = base[k] * light + noise;
      data[i + 3] = 255;
    }
  }
  return { width: WIDTH, height: HEIGHT, data };
}

const faceColors = (state: readonly PyraColor[], face: number) => state.slice(face * 9, face * 9 + 9);
const FACE_INDEX = { F: 0, L: 1, R: 2, D: 3 } as const;

describe("reading a Pyraminx face", () => {
  it("reads every sticker of an upright and an upside-down face", () => {
    const state = applyPyraMoves(solvedPyraminx(), parsePyraAlgorithm("R U' L B' u r' U L'"));
    for (const face of PYRA_FACE_ORDER) {
      const colors = faceColors(state, FACE_INDEX[face]);
      const read = classifyPyraFace(samplePyraFace(photo(colors, isUpsideDown(face)), isUpsideDown(face)), emptyCalibration());
      expect(read.map((c) => c.color), face).toEqual(colors);
    }
  });

  it("still reads them in dimmer light", () => {
    const colors = faceColors(applyPyraMoves(solvedPyraminx(), parsePyraAlgorithm("L R' B U")), 0);
    const read = classifyPyraFace(samplePyraFace(photo(colors, false, 0.7)), emptyCalibration());
    expect(read.map((c) => c.color)).toEqual(colors);
  });

  it("the 4 faces read go to the editor, which takes them as a real Pyraminx", () => {
    const state = applyPyraMoves(solvedPyraminx(), parsePyraAlgorithm("U L' R B' l b"));
    const scans: ScannedPyraFaces = {};
    for (const face of PYRA_FACE_ORDER) {
      const colors = faceColors(state, FACE_INDEX[face]);
      scans[face] = classifyPyraFace(samplePyraFace(photo(colors, isUpsideDown(face)), isUpsideDown(face)), emptyCalibration()).map((c) => c.color);
    }
    const facelets = pyraFaceletsFromScans(scans);
    expect(facelets).toEqual(state);
    expect(validatePyraFacelets(facelets).kind).toBe("valid");
  });

  it("the guide triangle upside down is the upright one turned half a turn", () => {
    const up = pyraTriangle(WIDTH, HEIGHT);
    const down = pyraTriangle(WIDTH, HEIGHT, true);
    up.forEach(([x, y], k) => {
      expect(down[k][0]).toBeCloseTo(WIDTH - x);
      expect(down[k][1]).toBeCloseTo(HEIGHT - y);
    });
  });
});
