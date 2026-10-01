import { describe, expect, it } from "vitest";
import { FACE_CORNERS, PYRA_FACES, STICKER_KIND, STICKER_TRIANGLES, VERTEX_POSITION, dot, faceOf } from "./geometry";
import {
  ALL_PYRA_MOVES,
  BIG_MOVES,
  MOVE_PERMUTATION,
  TIP_MOVES,
  applyPyraMove,
  applyPyraMoves,
  invertPyraMoves,
  isSolvedPyraminx,
  parsePyraAlgorithm,
  solvedPyraminx,
  type PyraMove,
} from "./moves";

const cross = (a: readonly number[], b: readonly number[]) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

describe("Pyraminx geometry", () => {
  it("draws every face from outside, apex, left, right counterclockwise", () => {
    for (const face of PYRA_FACES) {
      const [a, l, r] = FACE_CORNERS[face].map((v) => VERTEX_POSITION[v]);
      const normal = cross(l.map((x, i) => x - a[i]), r.map((x, i) => x - a[i]));
      const center = [0, 1, 2].map((i) => (a[i] + l[i] + r[i]) / 3);
      expect(dot(normal as never, center as never)).toBeGreaterThan(0);
    }
  });

  it("has 36 stickers of the same size", () => {
    const area = (t: readonly (readonly number[])[]) =>
      Math.hypot(...cross(t[1].map((x, i) => x - t[0][i]), t[2].map((x, i) => x - t[0][i]))) / 2;
    expect(STICKER_TRIANGLES).toHaveLength(36);
    const first = area(STICKER_TRIANGLES[0]);
    for (const triangle of STICKER_TRIANGLES) expect(area(triangle)).toBeCloseTo(first, 9);
  });
});

describe("Pyraminx moves", () => {
  it("turn 12 stickers (big layer) or 3 (tip), and three turns are none", () => {
    for (const move of ALL_PYRA_MOVES) {
      const moved = MOVE_PERMUTATION[move].filter((to, i) => to !== i).length;
      expect(moved, move).toBe(BIG_MOVES.includes(move) ? 12 : 3);
      const thrice = applyPyraMoves(solvedPyraminx().map((_, i) => i), [move, move, move]);
      expect(thrice, move).toEqual(solvedPyraminx().map((_, i) => i));
    }
  });

  it("undo each other with '", () => {
    const start = solvedPyraminx().map((_, i) => i);
    for (const move of ALL_PYRA_MOVES) {
      expect(applyPyraMoves(start, [move, ...invertPyraMoves([move])])).toEqual(start);
    }
  });

  it("tip turns only move tips, and keep each sticker's kind", () => {
    for (const move of ALL_PYRA_MOVES) {
      MOVE_PERMUTATION[move].forEach((to, i) => {
        expect(STICKER_KIND[to % 9]).toBe(STICKER_KIND[i % 9]);
        if (TIP_MOVES.includes(move) && to !== i) expect(STICKER_KIND[i % 9]).toBe("tip");
      });
    }
  });

  it("U is clockwise seen from above: the front of the top layer goes to the left face", () => {
    const to = MOVE_PERMUTATION.U;
    for (const n of [0, 1, 2, 3]) expect(faceOf(to[n])).toBe("L");
    // As the notation sheet's arrows: R takes the front's right corner up to the right
    // face, L takes the front's left corner down to the bottom face; tips the same.
    for (const n of [3, 7, 8]) expect(faceOf(MOVE_PERMUTATION.R[n])).toBe("R");
    for (const n of [1, 4, 5]) expect(faceOf(MOVE_PERMUTATION.L[n])).toBe("D");
    expect(faceOf(MOVE_PERMUTATION.r[8])).toBe("R");
    expect(faceOf(MOVE_PERMUTATION.l[4])).toBe("D");
    expect(faceOf(MOVE_PERMUTATION.u[0])).toBe("L");
    // B, drawn on the right face (turned to the front): its bottom right corner goes to
    // the face on that side (L), just as R takes the front's to R — so B looks like R there.
    for (const n of [3, 7, 8]) expect(faceOf(MOVE_PERMUTATION.B[18 + n])).toBe("L");
    expect(faceOf(MOVE_PERMUTATION.b[18 + 8])).toBe("L");
    const moved = applyPyraMove(solvedPyraminx(), "U");
    expect(isSolvedPyraminx(moved)).toBe(false);
  });

  it("never moves the face opposite a tip", () => {
    const opposite: Record<string, number> = { U: 27, L: 18, R: 9, B: 0 };
    for (const move of ALL_PYRA_MOVES) {
      const start = opposite[move[0].toUpperCase()];
      for (let i = start; i < start + 9; i++) expect(MOVE_PERMUTATION[move][i]).toBe(i);
    }
  });

  it("reads the sheets' algorithms", () => {
    expect(parsePyraAlgorithm("(R' L R L') U")).toEqual(["R'", "L", "R", "L'", "U"]);
    expect(parsePyraAlgorithm("R U R')")).toEqual(["R", "U", "R'"]);
    expect(parsePyraAlgorithm("R' L R L2' U L")).toEqual(["R'", "L", "R", "L'", "L'", "U", "L"]);
    expect(parsePyraAlgorithm("u’ b")).toEqual(["u'", "b"] as PyraMove[]);
    expect(() => parsePyraAlgorithm("F")).toThrow();
  });
});
