import { describe, expect, it } from "vitest";
import type { CubeColor } from "@/features/cube/types";
import {
  calibrate,
  centerFits,
  classifyColor,
  classifyFace,
  createStabilityTracker,
  emptyCalibration,
  faceletsFromScans,
  guideSquare,
  looksLikeSticker,
  medianColor,
  sampleFace,
  type Calibration,
  type Pixels,
  type Rgb,
} from "./color-scan";
import { FACE_NAMES, applyAlgorithm, solvedCube, type FaceName } from "./cubie";
import {
  CENTER_COLORS,
  emptyFacelets,
  faceOffset,
  faceletsFromCube,
  validateFacelets,
} from "./facelets";

const color = (rgb: Rgb, calibration?: Calibration) => classifyColor(rgb, calibration).color;

/** Calibration from one sample per color, like after scanning the six centers. */
const calibrated = (samples: Record<CubeColor, Rgb>) => {
  const colors = Object.keys(samples) as CubeColor[];
  return calibrate(
    emptyCalibration(),
    colors.map((c) => samples[c]),
    colors,
  );
};

describe("classifyColor without calibration", () => {
  it.each<[CubeColor, Rgb]>([
    ["white", [230, 230, 228]],
    ["white", [150, 152, 155]], // in shadow
    ["yellow", [230, 215, 40]],
    ["yellow", [190, 170, 20]],
    ["red", [200, 30, 35]],
    ["red", [140, 20, 30]], // dark red
    ["orange", [250, 120, 30]],
    ["orange", [255, 140, 60]],
    ["blue", [20, 70, 180]],
    ["blue", [10, 40, 110]],
    ["green", [20, 160, 80]],
    ["green", [30, 120, 60]],
  ])("reads %s from rgb(%s)", (expected, rgb) => {
    expect(color(rgb)).toBe(expected);
  });

  it("separates red from orange by hue", () => {
    expect(color([210, 50, 35])).toBe("red");
    expect(color([215, 60, 35])).toBe("red");
    expect(color([235, 100, 30])).toBe("orange");
    expect(color([220, 110, 50])).toBe("orange");
  });

  it("separates white from yellow by how yellow it is", () => {
    expect(color([225, 225, 205])).toBe("white"); // slightly warm white
    expect(color([230, 225, 150])).toBe("yellow"); // pale yellow
    expect(color([240, 230, 110])).toBe("yellow");
  });

  it("marks close calls as unsure", () => {
    expect(classifyColor([225, 75, 30]).unsure).toBe(true);
    expect(classifyColor([200, 30, 35]).unsure).toBe(false);
  });
});

describe("classifyColor calibrated with the centers", () => {
  /** Warm indoor light: whites look cream, reds look orange-ish, oranges look yellow-ish. */
  const warm: Record<CubeColor, Rgb> = {
    white: [240, 215, 145],
    yellow: [230, 200, 50],
    red: [215, 70, 35],
    orange: [245, 145, 40],
    blue: [40, 70, 130],
    green: [60, 150, 70],
  };

  it("fails on its defaults but gets it right once calibrated (warm light)", () => {
    // Without references a cream white is too yellow to be called white.
    expect(color([236, 212, 138])).toBe("yellow");
    const calibration = calibrated(warm);
    expect(color([236, 212, 138], calibration)).toBe("white");
    expect(color([228, 198, 60], calibration)).toBe("yellow");
    expect(color([218, 78, 38], calibration)).toBe("red");
    expect(color([240, 135, 40], calibration)).toBe("orange");
  });

  it("reads every color back under warm light", () => {
    const calibration = calibrated(warm);
    for (const [expected, rgb] of Object.entries(warm)) {
      expect(color(rgb, calibration)).toBe(expected);
    }
  });

  it("keeps red and orange apart under cold light", () => {
    const calibration = calibrated({
      white: [200, 215, 240],
      yellow: [200, 210, 90],
      red: [170, 25, 60],
      orange: [220, 90, 60],
      blue: [20, 80, 200],
      green: [20, 160, 120],
    });
    expect(color([175, 30, 62], calibration)).toBe("red");
    expect(color([190, 50, 60], calibration)).toBe("red");
    expect(color([215, 85, 58], calibration)).toBe("orange");
    expect(color([205, 212, 238], calibration)).toBe("white");
    expect(color([195, 205, 110], calibration)).toBe("yellow");
  });
});

describe("classifyFace", () => {
  it("always gives the known center and calibrates with it", () => {
    // A cream white center (warm light) and a sticker that matches it.
    const samples: Rgb[] = Array(9).fill([236, 212, 138]);
    samples[4] = [240, 215, 145];
    samples[0] = [228, 198, 55];
    const face = classifyFace(samples, "U", emptyCalibration()).map((c) => c.color);
    expect(face[4]).toBe("white");
    expect(face[1]).toBe("white");
    expect(face[0]).toBe("yellow");
  });

  it("uses the center even when the sample says otherwise", () => {
    const samples: Rgb[] = Array(9).fill([20, 160, 80]);
    expect(classifyFace(samples, "R", emptyCalibration())[4].color).toBe("red");
  });
});

/** An image of a face: 9 flat squares on black plastic, with a bright glare spot on one. */
function faceImage(colors: Rgb[], size = 90): Pixels {
  const data = new Uint8ClampedArray(size * size * 4);
  const square = guideSquare(size, size);
  const cell = square.size / 3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const col = Math.floor((x - square.x) / cell);
      const row = Math.floor((y - square.y) / cell);
      const inside = col >= 0 && col < 3 && row >= 0 && row < 3;
      const rgb: Rgb = inside ? colors[row * 3 + col] : [15, 15, 18];
      data.set([...rgb, 255], (y * size + x) * 4);
    }
  }
  // One glare pixel in the middle of the first cell.
  const c = Math.round(square.x + cell / 2);
  data.set([255, 255, 255, 255], (c * size + c) * 4);
  return { width: size, height: size, data };
}

describe("sampling", () => {
  it("takes the median of a small area, so a glare pixel is ignored", () => {
    const image = faceImage(Array(9).fill([200, 30, 35]));
    const square = guideSquare(90, 90);
    const c = square.x + square.size / 6;
    expect(medianColor(image, c, c, 3)).toEqual([200, 30, 35]);
  });

  it("reads the 9 cells row by row from the guide grid", () => {
    const colors: Rgb[] = [
      [200, 30, 35],
      [250, 120, 30],
      [230, 215, 40],
      [20, 70, 180],
      [230, 230, 228],
      [20, 160, 80],
      [230, 230, 228],
      [200, 30, 35],
      [20, 70, 180],
    ];
    const samples = sampleFace(faceImage(colors));
    expect(samples).toEqual(colors);
    expect(classifyFace(samples, "U", emptyCalibration()).map((c) => c.color)).toEqual([
      "red",
      "orange",
      "yellow",
      "blue",
      "white",
      "green",
      "white",
      "red",
      "blue",
    ]);
  });

  it("uses the central square of a landscape photo", () => {
    const square = guideSquare(160, 90);
    expect(square.size).toBeCloseTo(63);
    expect(square.x).toBeCloseTo(48.5);
    expect(square.y).toBeCloseTo(13.5);
  });
});

describe("createStabilityTracker", () => {
  const face = Array<CubeColor>(9).fill("green");

  it("fires after the same colors are held for the whole time", () => {
    const tracker = createStabilityTracker(1000);
    expect(tracker.push(face, 0)).toBe(false);
    expect(tracker.push(face, 600)).toBe(false);
    expect(tracker.progress(500)).toBe(0.5);
    expect(tracker.push(face, 1000)).toBe(true);
  });

  it("starts again when any sticker changes", () => {
    const tracker = createStabilityTracker(1000);
    tracker.push(face, 0);
    const moved = [...face];
    moved[3] = "blue";
    expect(tracker.push(moved, 800)).toBe(false);
    expect(tracker.push(moved, 1500)).toBe(false);
    expect(tracker.push(moved, 1800)).toBe(true);
    tracker.reset();
    expect(tracker.push(moved, 1900)).toBe(false);
  });
});

describe("looksLikeSticker", () => {
  it("accepts every sticker color, dim ones included", () => {
    for (const rgb of [
      [150, 152, 155],
      [190, 170, 20],
      [140, 20, 30],
      [10, 40, 110],
      [30, 120, 60],
      [255, 140, 60],
    ] as Rgb[]) {
      expect(looksLikeSticker(rgb)).toBe(true);
    }
  });

  it("rejects black plastic and darkness, which would otherwise read as white", () => {
    expect(looksLikeSticker([18, 18, 22])).toBe(false);
    expect(looksLikeSticker([40, 36, 34])).toBe(false);
    expect(classifyColor([18, 18, 22])).toEqual({ color: "white", unsure: true });
  });
});

describe("centerFits", () => {
  it("rejects the previous face still in view, so it is not captured twice", () => {
    const calibration = calibrate(emptyCalibration(), [[230, 230, 228]], ["white"]);
    expect(centerFits([228, 229, 226], "F", calibration, ["U"])).toBe(false);
    expect(centerFits([20, 160, 80], "F", calibration, ["U"])).toBe(true);
  });

  it("lets through a center that only looks off before calibration", () => {
    // A cream white (warm light) reads as yellow, but no yellow face was scanned yet.
    expect(centerFits([236, 212, 138], "U", emptyCalibration(), [])).toBe(true);
  });
});

describe("faceletsFromScans", () => {
  const scansOf = (facelets: (CubeColor | null)[]) =>
    Object.fromEntries(
      FACE_NAMES.map((face) => [face, facelets.slice(faceOffset(face), faceOffset(face) + 9)]),
    ) as Record<FaceName, CubeColor[]>;

  it("turns 6 scanned faces into the editor's stickers of a real cube", () => {
    const cube = faceletsFromCube(applyAlgorithm(solvedCube(), "R U F' L2 D B' R2 U'"));
    const facelets = faceletsFromScans(scansOf(cube));
    expect(facelets).toEqual(cube);
    expect(validateFacelets(facelets).kind).toBe("valid");
  });

  it("leaves faces not scanned empty and never changes the centers", () => {
    const scan = Array<CubeColor>(9).fill("blue");
    const facelets = faceletsFromScans({ F: scan });
    const expected = emptyFacelets();
    for (let i = 0; i < 9; i++) if (i !== 4) expected[faceOffset("F") + i] = "blue";
    expect(facelets).toEqual(expected);
    expect(facelets[faceOffset("F") + 4]).toBe(CENTER_COLORS.F);
    expect(validateFacelets(facelets).kind).toBe("incomplete");
  });

  it("lets the existing validation catch a face scanned turned", () => {
    const cube = faceletsFromCube(applyAlgorithm(solvedCube(), "R U F' L2 D B' R2 U'"));
    const scans = scansOf(cube);
    const f = scans.F;
    scans.F = [6, 3, 0, 7, 4, 1, 8, 5, 2].map((n) => f[n]); // held a quarter turn off
    const validation = validateFacelets(faceletsFromScans(scans));
    expect(validation.kind).toBe("impossible");
    if (validation.kind === "impossible") expect(validation.turned?.[0].face).toBe("F");
  });
});
