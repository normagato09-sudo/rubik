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
  FACE_TURNS,
  ROTATIONS,
  TOKEN_PERMUTATION,
  applyPyraTokens,
  inversePyraToken,
  invertPyraTokens,
  parsePyraAlgorithm,
  parsePyraNotation,
  solvedPyraminx,
  turnsWith,
  type PyraMove,
  type PyraToken,
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

describe("the wider notation (face turns and turns of the whole Pyraminx)", () => {
  const solved = solvedPyraminx();
  const same = (a: readonly unknown[], b: readonly unknown[]) => a.every((x, i) => x === b[i]);

  it("leaves the 16 moves exactly as they were", () => {
    for (const move of ALL_PYRA_MOVES) expect(TOKEN_PERMUTATION[move]).toEqual(MOVE_PERMUTATION[move]);
    const text = "(R' L R L') U' l b' R2 u’";
    expect(parsePyraNotation(text)).toEqual(parsePyraAlgorithm(text));
  });

  it("reads face turns and whole turns", () => {
    expect(parsePyraNotation("Rw U Rw' [U] Dw2 [l']")).toEqual(["Rw", "U", "Rw'", "[U]", "Dw", "Dw", "[L']"]);
    expect(() => parsePyraNotation("Bw")).toThrow();
    expect(() => parsePyraNotation("[F]")).toThrow();
  });

  it("three turns of any of them are none, and ' undoes it", () => {
    for (const token of [...FACE_TURNS, ...ROTATIONS]) {
      expect(same(applyPyraTokens(solved, [token, token, token]), solved), token).toBe(true);
      expect(same(applyPyraTokens(solved, [token, inversePyraToken(token)]), solved), token).toBe(true);
    }
    expect(invertPyraTokens(["Rw", "[U']", "L"])).toEqual(["L'", "[U]", "Rw'"]);
  });

  it("a face turn moves everything but the big layer of the tip opposite the face", () => {
    const opposite = { F: "B", L: "R", R: "L", D: "U" } as const;
    for (const face of ["F", "L", "R", "D"] as const) {
      const turn = `${face}w` as const;
      // 36 stickers less the 12 of that big layer (tip, center, 3 edges); none of the others stays put.
      expect(TOKEN_PERMUTATION[turn].filter((to, i) => to !== i)).toHaveLength(24);
      for (let i = 0; i < 36; i++) {
        if (turnsWith(opposite[face], i)) expect(TOKEN_PERMUTATION[turn][i]).toBe(i);
      }
      // The face turns in place.
      const start = ["F", "L", "R", "D"].indexOf(face) * 9;
      for (let i = start; i < start + 9; i++) expect(Math.floor(TOKEN_PERMUTATION[turn][i] / 9)).toBe(start / 9);
    }
  });

  it("a turn of the whole Pyraminx is the big layer plus the opposite face the same way", () => {
    // [U] = U + Dw' (clockwise from the top tip is anticlockwise seen from the bottom face).
    const pairs = { U: "Dw'", L: "Rw'", R: "Lw'", B: "Fw'" } as const;
    for (const [vertex, face] of Object.entries(pairs)) {
      const whole = applyPyraTokens(solved, [`[${vertex}]` as PyraToken]);
      expect(same(whole, applyPyraTokens(solved, [vertex as PyraMove, face])), vertex).toBe(true);
      // Whole turns keep a solved Pyraminx solved (with its faces swapped round).
      expect(isSolvedPyraminx(whole)).toBe(true);
    }
  });

  it("Keyhole's U and Rw: with the block at the back, Fw and U never touch its center and two bottom edges", () => {
    const block = Array.from({ length: 36 }, (_, i) => i).filter((i) => turnsWith("B", i) && !turnsWith("U", i));
    expect(block).toHaveLength(10);
    const state = applyPyraTokens(solved, parsePyraNotation("Fw U Fw' U' Fw'"));
    for (const i of block) expect(state[i]).toBe(solved[i]);
  });
});
