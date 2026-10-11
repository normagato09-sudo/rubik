import { describe, expect, it } from "vitest";
import type { CubeColor } from "@/features/cube/types";
import { DEFAULT_RGB, emptyCalibration, guideSquare, type Pixels, type Rgb } from "@/features/solver/color-scan";
import { faceOffsetSkewb, type SkewbFace } from "./geometry";
import { FIXED_CORNER_STICKERS, validateSkewbFacelets } from "./facelets";
import { applySkewbMoves, parseSkewbScramble, solvedSkewb } from "./moves";
import { SKEWB_FACE_ORDER, classifySkewbFace, sampleSkewbFace, skewbFaceletsFromScans, type ScannedSkewbFaces } from "./scan";

const WIDTH = 320;
const HEIGHT = 180;

/**
 * A photo of a face: dark plastic, the face filling the guide square, a
 * dark line between stickers and a little noise. In the square's own
 * coordinates (-1…1), the center is |u| + |v| < 1 and each corner the rest
 * of its quarter.
 */
function photo(colors: readonly CubeColor[], light = 1): Pixels {
  const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  const { x: x0, y: y0, size } = guideSquare(WIDTH, HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const u = ((x - x0) / size) * 2 - 1;
      const v = ((y - y0) / size) * 2 - 1;
      const line = Math.abs(Math.abs(u) + Math.abs(v) - 1) < 0.06;
      let n = -1;
      if (Math.abs(u) < 0.95 && Math.abs(v) < 0.95 && !line) {
        n = Math.abs(u) + Math.abs(v) < 1 ? 0 : v < 0 ? (u < 0 ? 1 : 2) : u < 0 ? 4 : 3;
      }
      const base: Rgb = n === -1 ? [20, 20, 22] : DEFAULT_RGB[colors[n]];
      const noise = ((x * 7 + y * 13) % 11) - 5;
      const i = (y * WIDTH + x) * 4;
      for (let k = 0; k < 3; k++) data[i + k] = base[k] * light + noise;
      data[i + 3] = 255;
    }
  }
  return { width: WIDTH, height: HEIGHT, data };
}

const state = applySkewbMoves(solvedSkewb(), parseSkewbScramble("R U' L B R' U L' B' R U L"));
const faceColors = (face: SkewbFace) => state.slice(faceOffsetSkewb(face), faceOffsetSkewb(face) + 5);

describe("reading a Skewb face", () => {
  it("reads the center and the 4 corners of every face", () => {
    for (const face of SKEWB_FACE_ORDER) {
      const read = classifySkewbFace(sampleSkewbFace(photo(faceColors(face))), emptyCalibration());
      expect(read.map((c) => c.color), face).toEqual(faceColors(face));
    }
  });

  it("still reads them in dimmer light", () => {
    const read = classifySkewbFace(sampleSkewbFace(photo(faceColors("F"), 0.8)), emptyCalibration());
    expect(read.map((c) => c.color)).toEqual(faceColors("F"));
  });

  it("the six faces read give the editor a valid Skewb", () => {
    const scans: ScannedSkewbFaces = {};
    for (const face of SKEWB_FACE_ORDER) {
      scans[face] = classifySkewbFace(sampleSkewbFace(photo(faceColors(face))), emptyCalibration()).map((c) => c.color);
    }
    const facelets = skewbFaceletsFromScans(scans);
    expect(facelets).toEqual(state);
    expect(validateSkewbFacelets(facelets).kind).toBe("valid");
  });

  it("the corner that stays still shows on the up, front and right faces where the hints say", () => {
    expect([...FIXED_CORNER_STICKERS].sort((a, b) => a - b)).toEqual([
      faceOffsetSkewb("U") + 3,
      faceOffsetSkewb("R") + 1,
      faceOffsetSkewb("F") + 2,
    ]);
  });
});
